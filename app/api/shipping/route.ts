import { Permission } from '@/config/rbac';
import { err, ok } from '@/lib/auth/response';
import { requirePermission } from '@/lib/authorize.middleware';
import connect_to_database from '@/lib/db';
import Shipping from '@/models/Shipping';
import { NextRequest } from 'next/server';

type PublicShippingResponse = {
  shippingFee: number;
  isShippingFree: boolean;
  updatedAt: Date;
};

// GET /api/shipping — Retrieve the singleton shipping settings
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
