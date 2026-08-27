import { err, ok, validationErr } from '@/lib/auth/response';
import connect_to_database from '@/lib/db';
import Collection from '@/models/Collection';
import Product from '@/models/Product';
import { updateCollectionSchema } from '@/schemas/update-catalogs.schema';
import { slugify } from '@/utils/slug';
import { Types } from 'mongoose';
import { NextRequest } from 'next/server';

const collection_select_fields = 'name slug description image active';

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

function serialize_collection(collection: {
  _id: { toString(): string };
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  active: boolean;
}) {
  return {
    id: collection._id.toString(),
    name: collection.name,
    slug: collection.slug,
    description: collection.description,
    image: collection.image,
    active: collection.active,
  };
}

async function get_collection_id(ctx: RouteContext<'/api/admin/collection/[id]'>) {
  const { id } = await ctx.params;
  return id;
}

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/admin/collection/[id]'>) {
  //   const authorization = await requirePermission(Permission.COLLECTIONS_READ);
  //   if (!authorization.ok) {
  //     return authorization.response;
  //   }

  const collection_id = await get_collection_id(ctx);
  if (!Types.ObjectId.isValid(collection_id)) {
    return err('Invalid collection id', 400);
  }

  await connect_to_database();

  const found_collection = await Collection.findById(collection_id)
    .select(collection_select_fields)
    .lean();

  if (!found_collection) {
    return err('Collection not found', 404);
  }

  return ok({ collection: serialize_collection(found_collection) });
}

export async function PATCH(req: NextRequest, ctx: RouteContext<'/api/admin/collection/[id]'>) {
  //   const authorization = await requirePermission(Permission.COLLECTIONS_WRITE);
  //   if (!authorization.ok) {
  //     return authorization.response;
  //   }

  const collection_id = await get_collection_id(ctx);
  if (!Types.ObjectId.isValid(collection_id)) {
    return err('Invalid collection id', 400);
  }

  const request_body = await req.json().catch(() => null);
  const validation_result = updateCollectionSchema.safeParse(request_body);
  if (!validation_result.success) {
    return format_validation_issues(validation_result.error.issues);
  }

  await connect_to_database();

  const found_collection =
    await Collection.findById(collection_id).select(collection_select_fields);
  if (!found_collection) {
    return err('Collection not found', 404);
  }

  const payload = validation_result.data;
  let manual_slug: string | undefined;

  if (payload.collection_slug !== undefined) {
    manual_slug = slugify(payload.collection_slug);
  } else if (payload.collection_name !== undefined) {
    manual_slug = slugify(payload.collection_name);
  }

  if (manual_slug) {
    const existing_slug_owner = await Collection.findOne({
      slug: manual_slug,
      _id: { $ne: found_collection._id },
    })
      .select('_id')
      .lean();

    if (existing_slug_owner) {
      return err('A collection with this slug already exists', 409);
    }
  }

  const old_values = serialize_collection(found_collection);

  if (payload.collection_name !== undefined) found_collection.name = payload.collection_name;
  if (manual_slug !== undefined) found_collection.slug = manual_slug;
  if (payload.collection_description !== undefined)
    found_collection.description = payload.collection_description;
  if (payload.collection_image !== undefined) found_collection.image = payload.collection_image;
  if (payload.collection_active !== undefined) found_collection.active = payload.collection_active;

  await found_collection.save();

  //   writeAuditLog({
  //     userId: null,
  //     actorId: new Types.ObjectId(authorization.user.userId),
  //     action: AuditAction.CATALOG_ENTITY_UPDATED,
  //     entityType: 'Collection',
  //     entityId: found_collection._id.toString(),
  //     oldValues: old_values,
  //     newValues: serialize_collection(found_collection),
  //     metadata: { resource: 'collection' },
  //     ...requestMeta(req),
  //   });

  return ok({ collection: serialize_collection(found_collection) });
}

export async function DELETE(req: NextRequest, ctx: RouteContext<'/api/admin/collection/[id]'>) {
  //   const authorization = await requirePermission(Permission.COLLECTIONS_WRITE);
  //   if (!authorization.ok) {
  //     return authorization.response;
  //   }

  const collection_id = await get_collection_id(ctx);
  if (!Types.ObjectId.isValid(collection_id)) {
    return err('Invalid collection id', 400);
  }

  await connect_to_database();

  const found_collection = await Collection.findById(collection_id)
    .select(collection_select_fields)
    .lean();

  if (!found_collection) {
    return err('Collection not found', 404);
  }

  const collection_object_id = new Types.ObjectId(collection_id);
  const linked_product = await Product.findOne({ collections: collection_object_id })
    .select('_id')
    .lean();

  if (linked_product) {
    return err('This collection cannot be deleted while products still reference it', 409);
  }

  await Collection.deleteOne({ _id: collection_object_id });

  //   writeAuditLog({
  //     userId: null,
  //     actorId: new Types.ObjectId(authorization.user.userId),
  //     action: AuditAction.CATALOG_ENTITY_DELETED,
  //     entityType: 'Collection',
  //     entityId: collection_id,
  //     oldValues: serialize_collection(found_collection),
  //     metadata: { resource: 'collection' },
  //     ...requestMeta(req),
  //   });

  return ok({ deleted: true });
}
