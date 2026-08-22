import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.AWS_S3_BUCKET!;
const CDN_BASE_URL = process.env.AWS_CLOUDFRONT_URL; // optional — falls back to raw S3 URL

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'video/mp4',
] as const;

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB — adjust for video if needed

export type PresignInput = {
  fileName: string;
  fileType: string;
  fileSize: number;
  productId: string;
  colorId?: string;
};

export type PresignResult =
  { ok: true; uploadUrl: string; publicUrl: string; key: string } | { ok: false; error: string };

export async function generatePresignedUploadUrl(input: PresignInput): Promise<PresignResult> {
  if (!ALLOWED_MIME_TYPES.includes(input.fileType as (typeof ALLOWED_MIME_TYPES)[number])) {
    return { ok: false, error: `Unsupported file type: ${input.fileType}` };
  }

  if (input.fileSize > MAX_FILE_SIZE_BYTES) {
    return { ok: false, error: `File exceeds ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB limit` };
  }

  // Sanitize the filename — never trust user-supplied names in the key.
  // Strip anything that isn't alphanumeric/dot/dash to avoid path traversal
  // (e.g. "../../etc/passwd.png") or S3 key edge cases with special chars.
  const safeName = input.fileName
    .toLowerCase()
    .replace(/[^a-z0-9.\-]/g, '-')
    .slice(-100); // guard against absurdly long filenames

  const uniquePrefix = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  const colorSegment = input.colorId ? `${input.colorId}/` : '';
  const key = `products/${input.productId}/${colorSegment}${uniquePrefix}-${safeName}`;

  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: input.fileType,
      ContentLength: input.fileSize,
      // Not setting ACL: 'public-read' here — bucket should be configured
      // with a bucket policy or served through CloudFront instead of
      // per-object ACLs, which AWS now discourages (and blocks by default
      // on buckets created after 2023 unless ACLs are explicitly re-enabled).
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 }); // 5 min window

    const publicUrl = CDN_BASE_URL
      ? `${CDN_BASE_URL}/${key}`
      : `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return { ok: true, uploadUrl, publicUrl, key };
  } catch (err) {
    console.error('S3 presign error:', err);
    return { ok: false, error: 'Failed to generate upload URL' };
  }
}

export async function deleteS3Object(key: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
    return { ok: true };
  } catch (err) {
    console.error('S3 delete error:', err);
    return { ok: false, error: 'Failed to delete file from S3' };
  }
}
