import { err, ok, validationErr } from '@/lib/auth/response';
import connect_to_database from '@/lib/db';
import Category from '@/models/Category';
import Product from '@/models/Product';
import { updateCategorySchema } from '@/schemas/update-catalogs.schema';
import { slugify } from '@/utils/slug';
import { Types } from 'mongoose';
import { NextRequest } from 'next/server';

const category_select_fields =
  'name slug parent image description sortOrder active createdAt updatedAt';

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

function serialize_category(category: {
  _id: { toString(): string };
  name: string;
  slug: string;
  parent: { toString(): string } | null;
  image: string | null;
  description: string | null;
  sortOrder: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: category._id.toString(),
    name: category.name,
    slug: category.slug,
    parentId: category.parent?.toString() ?? null,
    image: category.image,
    description: category.description,
    sortOrder: category.sortOrder,
    active: category.active,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
}

async function get_category_id(ctx: RouteContext<'/api/admin/category/[id]'>) {
  const { id } = await ctx.params;
  return id;
}

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/admin/category/[id]'>) {
  //   const authorization = await requirePermission(Permission.CATEGORIES_READ);
  //   if (!authorization.ok) {
  //     return authorization.response;
  //   }

  const category_id = await get_category_id(ctx);
  if (!Types.ObjectId.isValid(category_id)) {
    return err('Invalid category id', 400);
  }

  await connect_to_database();

  const found_category = await Category.findById(category_id).select(category_select_fields).lean();
  if (!found_category) {
    return err('Category not found', 404);
  }

  return ok({ category: serialize_category(found_category as any) });
}

export async function PATCH(req: NextRequest, ctx: RouteContext<'/api/admin/category/[id]'>) {
  //   const authorization = await requirePermission(Permission.CATEGORIES_WRITE);
  //   if (!authorization.ok) {
  //     return authorization.response;
  //   }

  const category_id = await get_category_id(ctx);
  if (!Types.ObjectId.isValid(category_id)) {
    return err('Invalid category id', 400);
  }

  const request_body = await req.json().catch(() => null);
  const validation_result = updateCategorySchema.safeParse(request_body);
  if (!validation_result.success) {
    return format_validation_issues(validation_result.error.issues);
  }

  await connect_to_database();

  const found_category = await Category.findById(category_id).select(category_select_fields);
  if (!found_category) {
    return err('Category not found', 404);
  }

  const payload = validation_result.data;
  let manual_slug: string | undefined;

  if (payload.category_name !== undefined) {
    manual_slug = slugify(payload?.category_slug!);
  } else if (payload.category_name !== undefined) {
    manual_slug = slugify(payload.category_name);
  }

  if (manual_slug) {
    const existing_slug_owner = await Category.findOne({
      slug: manual_slug,
      _id: { $ne: found_category._id },
    })
      .select('_id')
      .lean();

    if (existing_slug_owner) {
      return err('A category with this slug already exists', 409);
    }
  }

  if (payload.category_parent !== undefined) {
    if (payload.category_parent === category_id) {
      return err('A category cannot be its own parent', 400);
    }

    if (payload.category_parent) {
      const parent_category = await Category.findById(payload.category_parent).select('_id').lean();
      if (!parent_category) {
        return err('Parent category not found', 404);
      }
    }
  }

  const old_values = serialize_category(found_category as any);

  if (payload.category_name !== undefined) found_category.name = payload.category_name;
  if (manual_slug !== undefined) found_category.slug = manual_slug;
  if (payload.category_parent !== undefined)
    found_category.parent = payload.category_parent
      ? new Types.ObjectId(payload.category_parent)
      : null;
  if (payload.category_image !== undefined) found_category.image = payload.category_image;
  if (payload.category_description !== undefined)
    found_category.description = payload.category_description;

  if (payload.category_active !== undefined) found_category.active = payload.category_active;

  await found_category.save();

  //   writeAuditLog({
  //     userId: null,
  //     actorId: new Types.ObjectId(authorization.user.userId),
  //     action: AuditAction.CATALOG_ENTITY_UPDATED,
  //     entityType: 'Category',
  //     entityId: found_category._id.toString(),
  //     oldValues: old_values,
  //     newValues: serialize_category(found_category),
  //     metadata: { resource: 'category' },
  //     ...requestMeta(req),
  //   });

  return ok({ category: serialize_category(found_category as any) });
}

export async function DELETE(req: NextRequest, ctx: RouteContext<'/api/admin/category/[id]'>) {
  //   const authorization = await requirePermission(Permission.CATEGORIES_WRITE);
  //   if (!authorization.ok) {
  //     return authorization.response;
  //   }

  const category_id = await get_category_id(ctx);
  if (!Types.ObjectId.isValid(category_id)) {
    return err('Invalid category id', 400);
  }

  await connect_to_database();

  const found_category = await Category.findById(category_id).select(category_select_fields).lean();
  if (!found_category) {
    return err('Category not found', 404);
  }

  const category_object_id = new Types.ObjectId(category_id);

  const [child_category, linked_product] = await Promise.all([
    Category.findOne({ parent: category_object_id }).select('_id').lean(),
    Product.findOne({ category: category_object_id }).select('_id').lean(),
  ]);

  if (child_category) {
    return err('This category cannot be deleted while child categories still reference it', 409);
  }

  if (linked_product) {
    return err('This category cannot be deleted while products still reference it', 409);
  }

  await Category.deleteOne({ _id: category_object_id });

  //   writeAuditLog({
  //     userId: null,
  //     actorId: new Types.ObjectId(authorization.user.userId),
  //     action: AuditAction.CATALOG_ENTITY_DELETED,
  //     entityType: 'Category',
  //     entityId: category_id,
  //     oldValues: serialize_category(found_category),
  //     metadata: { resource: 'category' },
  //     ...requestMeta(req),
  //   });

  return ok({ deleted: true });
}
