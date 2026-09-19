import { Permission } from '@/config/rbac';
import { err, ok, requestMeta, validationErr, writeAuditLog } from '@/lib/auth/response';
import { requirePermission } from '@/lib/authorize.middleware';
import connect_to_database from '@/lib/db';
import { AuditAction } from '@/models/Auditlog';
import Shipping from '@/models/Shipping';
import { Types } from 'mongoose';
import { NextRequest } from 'next/server';
import { z } from 'zod';

type PublicShippingResponse = {
  shippingFee: number;
  isShippingFree: boolean;
  updatedAt: Date;
};

function format_validation_issues(issues: { path: PropertyKey[]; message: string }[]) {
  return validationErr(
    issues.map((issue) => ({
      path: issue.path.map((segment) =>
        typeof segment === 'symbol' ? segment.toString() : segment
      ) as (string | number)[],
      message: issue.message,
    }))
  );
}

const updateShippingSchema = z
  .object({
    shippingFee: z
      .number({
        message: 'Shipping fee must be a number',
      })
      .min(0, 'Shipping fee cannot be negative')
      .optional(),
    isShippingFree: z
      .boolean({
        message: 'isShippingFree must be a boolean',
      })
      .optional(),
  })
  .refine((data) => data.shippingFee !== undefined || data.isShippingFree !== undefined, {
    message: 'At least one field (shippingFee or isShippingFree) must be provided for update',
  });

// GET /api/admin/shipping — Retrieve the singleton shipping settings
export async function GET() {
  const authorization = await requirePermission(Permission.SHIPPING_READ);
  if (!authorization.ok) return authorization.response;

  await connect_to_database();

  const settings = await Shipping.getSingleton();

  if (!settings) {
    return err('Unable to load shipping settings', 500);
  }

  const response: PublicShippingResponse = {
    shippingFee: settings.shippingFee,
    isShippingFree: settings.isShippingFree,
    updatedAt: (settings as unknown as { updatedAt: Date }).updatedAt,
  };

  return ok({ settings: response });
}

// PATCH /api/admin/shipping — Update the singleton shipping settings admin acc
export async function PATCH(req: NextRequest) {
  const authorization = await requirePermission(Permission.SHIPPING_WRITE);
  if (!authorization.ok) return authorization.response;

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return err('Invalid JSON request body', 400);
  }

  const parseResult = updateShippingSchema.safeParse(rawBody);

  if (!parseResult.success) {
    return format_validation_issues(parseResult.error.issues);
  }

  const updates = parseResult.data;

  await connect_to_database();

  const updatedSettings = await Shipping.findOneAndUpdate(
    {},
    { $set: updates },
    { upsert: true, setDefaultsOnInsert: true, returnDocument: 'after' }
  ).lean<PublicShippingResponse | null>();

  if (!updatedSettings) {
    return err('Unable to update shipping settings', 500);
  }
  const audit_meta = requestMeta(req);

  writeAuditLog({
    userId: null,
    actorId: new Types.ObjectId(authorization.user.userId),
    action: AuditAction.SHIPPING_ENTITY_CREATED,
    entityType: 'shipping',
    newValues: {
      shippingFee: updatedSettings.shippingFee,
      isShippingFree: updatedSettings.isShippingFree,
    },
    metadata: {
      adminUserId: authorization.user.userId,
      resource: 'shipping',
    },
    ...audit_meta,
  });

  return ok({ settings: updatedSettings });
}
