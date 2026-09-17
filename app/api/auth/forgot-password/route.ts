import { NextRequest } from 'next/server';

import User from '@/models/User';
import { forgotPasswordSchema } from '@/schemas/auth.schemas';
import { generateToken } from '@/lib/auth/password';
import { ok, validationErr, requestMeta, writeAuditLog } from '@/lib/auth/response';
import { AuditAction } from '@/models/Auditlog';
import connect_to_database from '@/lib/db';
import { sendPasswordReset } from '@/lib/email/service';

// ─── POST /api/auth/forgot-password ──────────────────────────────────────────
export async function POST(req: NextRequest) {
  const request_body = await req.json().catch(() => null);
  const validation_result = forgotPasswordSchema.safeParse(request_body);

  if (!validation_result.success) {
    const validation_issues = validation_result.error.issues.map((issue) => ({
      path: issue.path.map((segment) => String(segment)) as (string | number)[],
      message: issue.message,
    }));
    return validationErr(validation_issues);
  }

  const normalized_identifier = validation_result.data.identifier.trim().toLowerCase();
  const audit_meta = requestMeta(req);
  const is_email = normalized_identifier.includes('@');

  await connect_to_database();

  // ── 1. Lookup ─────────────────────────────────────────────────────────────
  const found_user = await User.findOne(
    is_email ? { email: normalized_identifier } : { username: normalized_identifier }
  )
    .select('_id email username')
    .lean();

  // Always respond 200 regardless of whether the user exists —
  // prevents user enumeration via timing or response differences.
  if (!found_user) {
    return ok({
      message: 'If an account with that identifier exists, a reset link has been sent.',
    });
  }

  // ── 2. Generate reset token ───────────────────────────────────────────────
  const reset_token = generateToken();
  const reset_token_expires_at = new Date(Date.now() + 1000 * 60 * 15); // 15 minutes

  await User.updateOne(
    { _id: found_user._id },
    {
      $set: {
        passwordResetTokenHash: reset_token.hash,
        passwordResetTokenExp: reset_token_expires_at,
      },
    }
  );

  writeAuditLog({
    userId: found_user._id,
    action: AuditAction.PASSWORD_RESET_SENT,
    entityType: 'User',
    entityId: found_user._id.toString(),
    ...audit_meta,
  });

  // ── 3. Send reset link email ────────────────────────────────────────────
  void sendPasswordReset(
    { email: found_user.email, username: found_user.username },
    reset_token.raw
  ).catch((email_error: unknown) => {
    console.error('[Email] password reset email failed:', email_error);
  });

  return ok({
    message: 'If an account with that identifier exists, a reset link has been sent.',
  });
}
