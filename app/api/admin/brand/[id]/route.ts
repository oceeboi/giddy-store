import { err, ok, validationErr } from '@/lib/auth/response';
import connect_to_database from '@/lib/db';
import Brand from '@/models/Brand';
import Product from '@/models/Product';
import { updateBrandSchema } from '@/schemas/update-catalogs.schema';
import { slugify } from '@/utils/slug';
import { Types } from 'mongoose';
import { NextRequest } from 'next/server';

const brand_select_fields = 'name slug logo description website active createdAt updatedAt';

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

function serialize_brand(brand: {
  _id: { toString(): string };
  name: string;
  slug: string;
  logo: string | null;
  description: string | null;
  website: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: brand._id.toString(),
    name: brand.name,
    slug: brand.slug,
    logo: brand.logo,
    description: brand.description,
    website: brand.website,
    active: brand.active,
    createdAt: brand.createdAt,
    updatedAt: brand.updatedAt,
  };
}

async function get_brand_id(ctx: RouteContext<'/api/admin/brand/[id]'>) {
  const { id } = await ctx.params;
  return id;
}

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/admin/brand/[id]'>) {
  const brand_id = await get_brand_id(ctx);
  if (!Types.ObjectId.isValid(brand_id)) {
    return err('Invalid brand id', 400);
  }

  await connect_to_database();

  const found_brand = await Brand.findById(brand_id).select(brand_select_fields).lean();
  if (!found_brand) {
    return err('Brand not found', 404);
  }

  return ok({ brand: serialize_brand(found_brand) });
}

export async function PATCH(req: NextRequest, ctx: RouteContext<'/api/admin/brand/[id]'>) {
  //   const authorization = await requirePermission(Permission.BRANDS_WRITE);
  //   if (!authorization.ok) {
  //     return authorization.response;
  //   }

  const brand_id = await get_brand_id(ctx);
  if (!Types.ObjectId.isValid(brand_id)) {
    return err('Invalid brand id', 400);
  }

  const request_body = await req.json().catch(() => null);
  const validation_result = updateBrandSchema.safeParse(request_body);
  if (!validation_result.success) {
    return format_validation_issues(validation_result.error.issues);
  }

  await connect_to_database();

  const found_brand = await Brand.findById(brand_id).select(brand_select_fields);
  if (!found_brand) {
    return err('Brand not found', 404);
  }

  const payload = validation_result.data;
  let manual_slug: string | undefined;

  if (payload.brand_slug !== undefined) {
    manual_slug = slugify(payload.brand_slug);
  } else if (payload.brand_name !== undefined) {
    manual_slug = slugify(payload.brand_name);
  }

  if (manual_slug) {
    const existing_slug_owner = await Brand.findOne({
      slug: manual_slug,
      _id: { $ne: found_brand._id },
    })
      .select('_id')
      .lean();

    if (existing_slug_owner) {
      return err('A brand with this slug already exists', 409);
    }
  }

  const old_values = serialize_brand(found_brand);

  if (payload.brand_name !== undefined) found_brand.name = payload.brand_name;
  if (manual_slug !== undefined) found_brand.slug = manual_slug;
  if (payload.brand_logo !== undefined) found_brand.logo = payload.brand_logo;
  if (payload.brand_description !== undefined) found_brand.description = payload.brand_description;
  if (payload.brand_website !== undefined) found_brand.website = payload.brand_website;
  if (payload.brand_active !== undefined) found_brand.active = payload.brand_active;

  await found_brand.save();

  //   writeAuditLog({
  //     userId: null,
  //     actorId: new Types.ObjectId(authorization.user.userId),
  //     action: AuditAction.CATALOG_ENTITY_UPDATED,
  //     entityType: 'Brand',
  //     entityId: found_brand._id.toString(),
  //     oldValues: old_values,
  //     newValues: serialize_brand(found_brand),
  //     metadata: { resource: 'brand' },
  //     ...requestMeta(req),
  //   });

  return ok({ brand: serialize_brand(found_brand) });
}

export async function DELETE(req: NextRequest, ctx: RouteContext<'/api/admin/brand/[id]'>) {
  //   const authorization = await requirePermission(Permission.BRANDS_WRITE);
  //   if (!authorization.ok) {
  //     return authorization.response;
  //   }

  const brand_id = await get_brand_id(ctx);
  if (!Types.ObjectId.isValid(brand_id)) {
    return err('Invalid brand id', 400);
  }

  await connect_to_database();

  const found_brand = await Brand.findById(brand_id).select(brand_select_fields).lean();
  if (!found_brand) {
    return err('Brand not found', 404);
  }

  const brand_object_id = new Types.ObjectId(brand_id);
  const linked_product = await Product.findOne({ brand: brand_object_id }).select('_id').lean();
  if (linked_product) {
    return err('This brand cannot be deleted while products still reference it', 409);
  }

  await Brand.deleteOne({ _id: brand_object_id });

  //   writeAuditLog({
  //     userId: null,
  //     actorId: new Types.ObjectId(authorization.user.userId),
  //     action: AuditAction.CATALOG_ENTITY_DELETED,
  //     entityType: 'Brand',
  //     entityId: brand_id,
  //     oldValues: serialize_brand(found_brand),
  //     metadata: { resource: 'brand' },
  //     ...requestMeta(req),
  //   });

  return ok({ deleted: true });
}
