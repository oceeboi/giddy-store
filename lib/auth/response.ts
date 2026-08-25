import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';

// ─── Standard API response shapes ────────────────────────────────────────────
// Every route returns one of these — no ad-hoc response objects.

type SuccessResponse<T> = {
  ok: true;
  data: T;
};

type ErrorResponse = {
  ok: false;
  error: string;
  details?: unknown;
};

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

// ─── Response factories ───────────────────────────────────────────────────────

export const ok = <T>(data: T, status = 200): NextResponse<ApiResponse<T>> =>
  NextResponse.json({ ok: true, data }, { status });

export const err = (
  error: string,
  status: number,
  details?: unknown
): NextResponse<ApiResponse<never>> => NextResponse.json({ ok: false, error, details }, { status });

// ─── Validation error helper ─────────────────────────────────────────────────
// Unwraps Zod errors into a flat field → message map.

export const validationErr = (issues: { path: (string | number)[]; message: string }[]) =>
  err(
    'Validation failed',
    422,
    Object.fromEntries(issues.map((i) => [i.path.join('.'), i.message]))
  );

// ─── Request metadata ─────────────────────────────────────────────────────────
// Extract IP and user-agent from a Next.js request — used for audit logs.

export const requestMeta = (req: NextRequest) => ({
  ipAddress:
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    null,
  userAgent: req.headers.get('user-agent') ?? null,
});
