import { NextRequest } from 'next/server';
import mongoose, { Types } from 'mongoose';
import crypto from 'crypto';

import User, { UserRole, UserStatus } from '@/models/User';
import Account from '@/models/Account';
import UserProfile from '@/models/UserProfile';
import Referral from '@/models/Referral';
import connect_to_database from '@/lib/db';
import { generateToken, hashPassword } from '@/lib/auth/password';
import {
  ACCESS_COOKIE_NAME,
  accessCookieOptions,
  hashToken,
  issueAccessToken,
  issueRefreshToken,
  REFRESH_COOKIE_NAME,
  refreshCookieOptions,
} from '@/lib/auth/tokens';
import { ok, err, validationErr, requestMeta, writeAuditLog } from '@/lib/auth/response';
import { AuditAction } from '@/models/Auditlog';
import { apply_rate_limit, login_limiter, with_login_identifier } from '@/packages/rate-limiter';
import { magicAuthSchema } from '@/schemas/auth.schemas';

const REFERRAL_REWARD_POINTS = 3;

function deriveUsernameFromEmail(email: string): string {
  const prefix = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');
  const randomSuffix = crypto.randomBytes(2).toString('hex');
  return `${prefix}_${randomSuffix}`.slice(0, 20);
}

export async function POST(req: NextRequest) {
  // ── 1. Validation ────────────────────────────────────────────────────────
  const request_body = await req.json().catch(() => null);
  const validation_result = magicAuthSchema.safeParse(request_body);

  if (!validation_result.success) {
    const issues = validation_result.error.issues.map((i) => ({
      path: i.path.map((s) => String(s)),
      message: i.message,
    }));
    return validationErr(issues);
  }

  const { email: rawEmail, referralcode } = validation_result.data;
  const email = rawEmail.toLowerCase().trim();
  const normalizedReferralCode = referralcode?.trim().toUpperCase();

  // ── 2. Rate Limiting ─────────────────────────────────────────────────────
  //const keyed_request = with_login_identifier(req, email);
  // const rateLimitRes = await apply_rate_limit(
  //   keyed_request,
  //   login_limiter,
  //   'Too many attempts. Try again shortly.'
  // );
  // if (rateLimitRes) return rateLimitRes;

  await connect_to_database();
  const audit_meta = requestMeta(req);

  // ── 3. Token Generation for Email Link ───────────────────────────────────
  const rawToken = generateToken().raw;
  const tokenHash = hashToken(rawToken);
  const tokenExpiresAt = new Date(Date.now() + 1000 * 60 * 15); // 15 minutes expiry

  let isNewUser = false;
  let targetUser: {
    id: Types.ObjectId;
    email: string;
    username: string;
    role: UserRole;
    status: UserStatus;
  };

  // ── 4. User Lookup / Transactional Registration ──────────────────────────
  const existingUser = await User.findOne({ email });

  if (!existingUser) {
    isNewUser = true;

    if (normalizedReferralCode) {
      const referralExists = await Referral.exists({ referralCode: normalizedReferralCode }).lean();
      if (!referralExists) return err('Invalid referral code.', 400);
    }

    const dummyPasswordHash = await hashPassword(crypto.randomBytes(32).toString('hex'));
    const session = await mongoose.startSession();

    try {
      const newUser = await session.withTransaction(async () => {
        const generatedUsername = deriveUsernameFromEmail(email);

        const [createdUser] = await User.create(
          [
            {
              email,
              username: generatedUsername,
              passwordHash: dummyPasswordHash,
              status: UserStatus.PENDING,
              emailVerified: false,
              emailVerifyTokenHash: tokenHash,
              emailVerifyTokenExp: tokenExpiresAt,
            },
          ],
          { session }
        );

        const refCode = await generateUniqueReferralCode(generatedUsername, session);
        const [createdReferral, [createdAccount]] = await Promise.all([
          Referral.create([{ userId: createdUser._id, referralCode: refCode }], { session }),
          Account.create([{ userId: createdUser._id }], { session }),
        ]);

        await UserProfile.create(
          [
            {
              userId: createdUser._id,
              referralId: createdReferral[0]._id,
              accountId: createdAccount._id,
            },
          ],
          { session }
        );

        if (normalizedReferralCode) {
          await rewardReferrer(normalizedReferralCode, session);
        }

        return createdUser;
      });

      targetUser = {
        id: newUser._id,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role,
        status: newUser.status,
      };
    } finally {
      await session.endSession();
    }

    writeAuditLog({
      userId: targetUser.id,
      action: AuditAction.USER_REGISTERED,
      entityType: 'User',
      entityId: targetUser.id.toString(),
      ...audit_meta,
    });
  } else {
    // Existing User Validation
    if (existingUser.status === UserStatus.SUSPENDED || existingUser.status === UserStatus.CLOSED) {
      return err('Account is suspended or closed.', 403);
    }

    targetUser = {
      id: existingUser._id,
      email: existingUser.email,
      username: existingUser.username,
      role: existingUser.role,
      status: existingUser.status,
    };
  }

  // ── 5. Issue Session Tokens (Access & Refresh) ───────────────────────────
  const access_token = issueAccessToken(targetUser.id, targetUser.username, targetUser.role);
  const refresh_token = issueRefreshToken(targetUser.id);
  const hashedRefreshToken = hashToken(refresh_token);

  // ── 6. Persist Refresh Token & Verification Link State ──────────────────
  await User.updateOne(
    { _id: targetUser.id },
    {
      $set: {
        refreshTokenHash: hashedRefreshToken,
        emailVerifyTokenHash: tokenHash,
        emailVerifyTokenExp: tokenExpiresAt,
        lastLoginAt: new Date(),
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    }
  );

  writeAuditLog({
    userId: targetUser.id,
    action: AuditAction.USER_LOGIN,
    entityType: 'User',
    entityId: targetUser.id.toString(),
    ...audit_meta,
  });

  // Debug payload (Replace with actual email dispatch service)
  console.log('[MagicAuth] Dispatch:', {
    email: targetUser.email,
    username: targetUser.username,
    token: rawToken,
  });

  // ── 7. Respond & Set Cookies ─────────────────────────────────────────────
  const response_body = ok({
    message: isNewUser
      ? 'Account created and authenticated! Check your email for verification.'
      : 'Authenticated successfully. Login link dispatched to your email.',
    isNewUser,
  });

  response_body.cookies.set(REFRESH_COOKIE_NAME, refresh_token, refreshCookieOptions);
  response_body.cookies.set(ACCESS_COOKIE_NAME, access_token, accessCookieOptions);

  return response_body;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
async function generateUniqueReferralCode(
  username: string,
  session: mongoose.mongo.ClientSession
): Promise<string> {
  const prefix = `${(username.replace(/[^a-zA-Z0-9_]/g, '').toUpperCase() || 'USR').slice(0, 8)}-`;
  for (let i = 0; i < 8; i++) {
    const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const code = `${prefix}${suffix}`.slice(0, 20);
    if (!(await Referral.exists({ referralCode: code }).session(session))) return code;
  }
  throw new Error('Unable to generate unique referral code');
}

async function rewardReferrer(
  referralCode: string,
  session: mongoose.mongo.ClientSession
): Promise<void> {
  const referrer = await Referral.findOne({ referralCode }).lean();
  if (!referrer) throw new Error('Invalid referral code');

  await Referral.updateOne(
    { _id: referrer._id },
    {
      $inc: {
        successfulReferrals: 1,
        pointsEarned: REFERRAL_REWARD_POINTS,
        pointsAvailable: REFERRAL_REWARD_POINTS,
        totalRewards: REFERRAL_REWARD_POINTS,
      },
      $set: { lastRewardAt: new Date() },
    },
    { session }
  );
}
