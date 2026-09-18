import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import crypto from 'crypto';

import User, { UserStatus } from '@/models/User';
import Account from '@/models/Account';
import UserProfile from '@/models/UserProfile';
import Referral from '@/models/Referral';
import connect_to_database from '@/lib/db';
import { generateToken } from '@/lib/auth/password';
import { ok, err, validationErr, requestMeta, writeAuditLog } from '@/lib/auth/response';
import { AuditAction } from '@/models/Auditlog';
import { apply_rate_limit, login_limiter } from '@/packages/rate-limiter';
// import { sendMagicAuthEmail } from '@/lib/email/service'; // Implement this function in your email service

const REFERRAL_REWARD_POINTS = 3;

function deriveUsernameFromEmail(email: string): string {
  const prefix = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');
  const randomSuffix = crypto.randomBytes(2).toString('hex');
  return `${prefix}_${randomSuffix}`.slice(0, 20);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = body?.email?.toLowerCase().trim();
  const referralcode = body?.referralcode?.trim().toUpperCase();

  if (!email || !email.includes('@')) {
    return err('A valid email address is required', 400);
  }

  // Rate Limiting
  const rateLimitRes = await apply_rate_limit(
    req,
    login_limiter,
    'Too many attempts. Try again shortly.'
  );
  if (rateLimitRes) return rateLimitRes;

  await connect_to_database();
  const audit_meta = requestMeta(req);

  // 1. Generate short-lived auth token (e.g., 15 minutes)
  const magicToken = generateToken();
  const tokenExpiresAt = new Date(Date.now() + 1000 * 60 * 15);

  let user = await User.findOne({ email });
  let isNewUser = false;

  if (!user) {
    // ── 2. NEW USER REGISTRATION ───────────────────────────────────────────
    isNewUser = true;

    if (referralcode) {
      const referralExists = await Referral.exists({ referralCode: referralcode }).lean();
      if (!referralExists) return err('Invalid referral code.', 400);
    }

    const generatedUsername = deriveUsernameFromEmail(email);
    const session = await mongoose.startSession();

    try {
      user = await session.withTransaction(async () => {
        const [newUser] = await User.create(
          [
            {
              email,
              username: generatedUsername,
              status: UserStatus.PENDING,
              emailVerifyTokenHash: magicToken.hash,
              emailVerifyTokenExp: tokenExpiresAt,
            },
          ],
          { session }
        );

        // Account + Profile + Referral setup
        const refCode = await generateUniqueReferralCode(generatedUsername, session);
        const [createdReferral, [createdAccount]] = await Promise.all([
          Referral.create([{ userId: newUser._id, referralCode: refCode }], { session }),
          Account.create([{ userId: newUser._id }], { session }),
        ]);

        await UserProfile.create(
          [
            {
              userId: newUser._id,
              referralId: createdReferral[0]._id,
              accountId: createdAccount._id,
            },
          ],
          { session }
        );

        if (referralcode) {
          await rewardReferrer(referralcode, session);
        }

        return newUser;
      });
    } finally {
      await session.endSession();
    }

    writeAuditLog({
      userId: user._id,
      action: AuditAction.USER_REGISTERED,
      entityType: 'User',
      entityId: user._id.toString(),
      ...audit_meta,
    });
  } else {
    // ── 3. EXISTING USER LOGIN ─────────────────────────────────────────────
    if (user.status === UserStatus.SUSPENDED || user.status === UserStatus.CLOSED) {
      return err('Account is suspended or closed.', 403);
    }

    // Store magic token on existing user
    user.emailVerifyTokenHash = magicToken.hash;
    user.emailVerifyTokenExp = tokenExpiresAt;
    await user.save();
  }

  console.log('Magic-auth', { email: user.email, username: user.username, token: magicToken.raw });

  // 4. Send Email with Magic Link / Code
  //   void sendMagicAuthEmail(
  //     { email: user.email, username: user.username },
  //     magicToken.raw
  //   ).catch((e) => console.error('[MagicAuth] Email dispatch failed:', e));

  return ok({
    message: isNewUser
      ? 'Account created! Check your email to log in.'
      : 'Login link sent to your email.',
    isNewUser,
  });
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
