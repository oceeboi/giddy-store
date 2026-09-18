import { NextRequest } from 'next/server';

import User, { UserStatus } from '@/models/User';
import { verifyEmailSchema } from '@/schemas/auth.schemas';
import {
  hashToken,
  issueAccessToken,
  issueRefreshToken,
  ACCESS_COOKIE_NAME,
  accessCookieOptions,
  REFRESH_COOKIE_NAME,
  refreshCookieOptions,
} from '@/lib/auth/tokens';
import { ok, err, validationErr, requestMeta, writeAuditLog } from '@/lib/auth/response';
import { AuditAction } from '@/models/Auditlog';
import connect_to_database from '@/lib/db';
import { sendRegistrationSuccess } from '@/lib/email/service';

export async function POST(req: NextRequest) {
  const request_body = await req.json().catch(() => null);
  const validation_result = verifyEmailSchema.safeParse(request_body);

  if (!validation_result.success) {
    const validation_issues = validation_result.error.issues.map((issue) => ({
      path: issue.path.map((segment) => String(segment)),
      message: issue.message,
    }));
    return validationErr(validation_issues);
  }

  await connect_to_database();

  const { token } = validation_result.data;
  const audit_meta = requestMeta(req);
  const computedHash = hashToken(token.trim());

  // ── 1. Find user by hash + expiry ───────────────────────────────────────
  const found_user = await User.findOne({
    emailVerifyTokenHash: computedHash,
    emailVerifyTokenExp: { $gt: new Date() },
  })
    .select('_id email username role status emailVerified')
    .exec();

  if (!found_user) {
    return err('This verification link is invalid or has expired. Please request a new one.', 400);
  }

  if (found_user.status === UserStatus.SUSPENDED || found_user.status === UserStatus.CLOSED) {
    return err('Account suspended or closed.', 403);
  }

  // ── 2. Issue Session Tokens ─────────────────────────────────────────────
  const access_token = issueAccessToken(found_user._id, found_user.username, found_user.role);
  const refresh_token = issueRefreshToken(found_user._id);

  // ── 3. Update User State ────────────────────────────────────────────────
  await User.updateOne(
    { _id: found_user._id },
    {
      $set: {
        emailVerified: true,
        emailVerifyTokenHash: null,
        emailVerifyTokenExp: null,
        refreshTokenHash: hashToken(refresh_token),
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        ...(found_user.status === UserStatus.PENDING && { status: UserStatus.ACTIVE }),
      },
    }
  );

  writeAuditLog({
    userId: found_user._id,
    action: AuditAction.EMAIL_VERIFIED,
    entityType: 'User',
    entityId: found_user._id.toString(),
    ...audit_meta,
  });

  // ── 4. Send Welcome Email ───────────────────────────────────────────────
  void sendRegistrationSuccess({
    email: found_user.email,
    username: found_user.username,
  }).catch((email_error: unknown) => {
    console.error('[Email] Welcome email failed:', email_error);
  });

  // ── 5. Respond with Session Cookies ─────────────────────────────────────
  const response_body = ok({
    user: {
      id: found_user._id.toString(),
      email: found_user.email,
      username: found_user.username,
      role: found_user.role,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    },
    message: 'Email verified and signed in successfully.',
  });

  response_body.cookies.set(REFRESH_COOKIE_NAME, refresh_token, refreshCookieOptions);
  response_body.cookies.set(ACCESS_COOKIE_NAME, access_token, accessCookieOptions);

  return response_body;
}
