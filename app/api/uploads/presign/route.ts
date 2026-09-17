import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generatePresignedUploadUrl } from '@/lib/s3';
import { authenticateRequest } from '@/lib/auth.middleware';
import { err } from '@/lib/auth/response';

const presignSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileType: z.string().min(1),
  fileSize: z.number().positive(),
  productId: z.string().min(1),
  folder: z.string().optional(),
  colorId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const auth_result = await authenticateRequest();
  if ('error' in auth_result) {
    return err(auth_result.error ?? 'Unauthorized', 401);
  }

  const body = await req.json().catch(() => null);
  const parsed = presignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid request' },
      { status: 400 }
    );
  }

  const { folder, ...rest } = parsed.data;

  const result = await generatePresignedUploadUrl(rest, folder);
  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result);
}
