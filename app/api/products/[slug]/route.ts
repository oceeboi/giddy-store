import { err, ok } from '@/lib/auth/response';
import connect_to_database from '@/lib/db';
import {
  PRODUCT_SELECT_FIELDS,
  serializeProduct,
} from '@/lib/service-route/admin-product-route-helpers';
import Product from '@/models/Product';
import { NextRequest } from 'next/server';

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/products/[slug]'>) {
  const { slug } = await ctx.params;

  await connect_to_database();

  const found_product = await Product.findOne({ slug, active: true })
    .select(PRODUCT_SELECT_FIELDS)
    .populate('brand', 'name slug')
    .populate('category', 'name slug')
    .populate('collections', 'name slug type')
    .lean();
  if (!found_product) {
    return err('Product not found', 404);
  }

  return ok({ product: serializeProduct(found_product as any) });
}
