import { NextRequest } from 'next/server';
import User, { UserStatus } from '@/models/User';
import connect_to_database from '@/lib/db';
import {
  hashToken,
  issueAccessToken,
  issueRefreshToken,
  REFRESH_COOKIE_NAME,
  ACCESS_COOKIE_NAME,
  refreshCookieOptions,
  accessCookieOptions,
} from '@/lib/auth/tokens';
import { ok, err, requestMeta, writeAuditLog } from '@/lib/auth/response';
import { AuditAction } from '@/models/Auditlog';

export async function POST(req: NextRequest) {
  const { email, token } = await req.json().catch(() => ({}));

  if (!email || !token) return err('Email and token are required', 400);

  await connect_to_database();
  const tokenHash = hashToken(token);

  const user = await User.findOne({
    email,
    emailVerifyTokenHash: tokenHash,
    emailVerifyTokenExp: { $gt: new Date() },
  });

  if (!user) {
    return err('Invalid or expired login link', 401);
  }

  // Issue Access & Refresh Tokens
  const accessToken = issueAccessToken(user._id, user.username, user.role);
  const refreshToken = issueRefreshToken(user._id);

  user.refreshTokenHash = hashToken(refreshToken);
  user.emailVerifyTokenHash = null;
  user.emailVerifyTokenExp = null;
  user.emailVerified = true;
  if (user.status === UserStatus.PENDING) user.status = UserStatus.ACTIVE;
  user.lastLoginAt = new Date();
  await user.save();

  const audit_meta = requestMeta(req);
  writeAuditLog({
    userId: user._id,
    action: AuditAction.USER_LOGIN,
    entityType: 'User',
    entityId: user._id.toString(),
    ...audit_meta,
  });

  const response = ok({
    user: {
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role,
      status: user.status,
    },
    message: 'Authenticated successfully',
  });

  response.cookies.set(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions);
  response.cookies.set(ACCESS_COOKIE_NAME, accessToken, accessCookieOptions);

  return response;
}
