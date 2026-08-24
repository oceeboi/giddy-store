import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generatePresignedUploadUrl } from '@/lib/s3';

const presignSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileType: z.string().min(1),
  fileSize: z.number().positive(),
  productId: z.string().min(1),
  folder: z.string().optional(),
  colorId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  // Gate this behind admin auth — presigned URLs are a write-capability
  // grant, not just a read. Anyone who can hit this route unauthenticated
  // can upload arbitrary files to your bucket under your product paths.
  const session = { role: 'admin' }; // Replace with actual session logic
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
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
