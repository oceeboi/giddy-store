import { err, ok, validationErr } from '@/lib/auth/response';
import connect_to_database from '@/lib/db';

import Product from '@/models/Product';
import ProductSize from '@/models/ProductSize';
import { updateSizeSchema } from '@/schemas/update-catalogs.schema';
import { Types } from 'mongoose';
import { NextRequest } from 'next/server';

const size_select_fields = 'name createdAt updatedAt';

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

function serialize_size(size: { _id: { toString(): string }; name: string }) {
  return {
    id: size._id.toString(),
    name: size.name,
  };
}

async function get_size_id(ctx: RouteContext<'/api/admin/size/[id]'>) {
  const { id } = await ctx.params;
  return id;
}

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/admin/size/[id]'>) {
  const size_id = await get_size_id(ctx);
  if (!Types.ObjectId.isValid(size_id)) {
    return err('Invalid size id', 400);
  }

  await connect_to_database();

  const found_size = await ProductSize.findById(size_id).select(size_select_fields).lean();
  if (!found_size) {
    return err('Size not found', 404);
  }

  return ok({ size: serialize_size(found_size) });
}

export async function PATCH(req: NextRequest, ctx: RouteContext<'/api/admin/size/[id]'>) {
  const size_id = await get_size_id(ctx);
  if (!Types.ObjectId.isValid(size_id)) {
    return err('Invalid size id', 400);
  }

  const request_body = await req.json().catch(() => null);
  const validation_result = updateSizeSchema.safeParse(request_body);
  if (!validation_result.success) {
    return format_validation_issues(validation_result.error.issues);
  }

  await connect_to_database();

  const found_size = await ProductSize.findById(size_id).select(size_select_fields);
  if (!found_size) {
    return err('Size not found', 404);
  }

  const payload = validation_result.data;

  if (payload.size_name !== undefined) {
    const trimmed_name = payload.size_name.trim();

    // Prevent duplicate size names
    const existing_size_owner = await ProductSize.findOne({
      name: { $regex: new RegExp(`^${trimmed_name}$`, 'i') },
      _id: { $ne: found_size._id },
    })
      .select('_id')
      .lean();

    if (existing_size_owner) {
      return err('A size with this name already exists', 409);
    }

    found_size.name = trimmed_name;
  }

  await found_size.save();

  return ok({ size: serialize_size(found_size) });
}

export async function DELETE(req: NextRequest, ctx: RouteContext<'/api/admin/size/[id]'>) {
  const size_id = await get_size_id(ctx);
  if (!Types.ObjectId.isValid(size_id)) {
    return err('Invalid size id', 400);
  }

  await connect_to_database();

  const found_size = await ProductSize.findById(size_id).select(size_select_fields).lean();
  if (!found_size) {
    return err('Size not found', 404);
  }

  const size_object_id = new Types.ObjectId(size_id);

  // Check if any product variant references this size
  const linked_product = await Product.findOne({ 'variants.sizeId': size_object_id })
    .select('_id')
    .lean();

  if (linked_product) {
    return err('This size cannot be deleted while products still reference it', 409);
  }

  await ProductSize.deleteOne({ _id: size_object_id });

  return ok({ deleted: true });
}
