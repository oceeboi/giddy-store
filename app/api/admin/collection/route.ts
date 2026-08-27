import { ok, validationErr } from '@/lib/auth/response';
import connect_to_database from '@/lib/db';
import Collection from '@/models/Collection';
import { createCollectionSchema } from '@/schemas/create-catalogs.schema';
import { slugify } from '@/utils/slug';
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
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: collection._id.toString(),
    name: collection.name,
    slug: collection.slug,
    description: collection.description,
    image: collection.image,
    active: collection.active,
    createdAt: collection.createdAt,
    updatedAt: collection.updatedAt,
  };
}

export async function GET(req: NextRequest) {
  //   const authorization = await requirePermission(Permission.COLLECTIONS_READ);
  //   if (!authorization.ok) {
  //     return authorization.response;
  //   }

  await connect_to_database();

  const search_term = req.nextUrl.searchParams.get('search')?.trim();
  const active_filter = req.nextUrl.searchParams.get('active');

  const query: Record<string, unknown> = {};

  if (search_term) {
    query.$or = [
      { name: { $regex: search_term, $options: 'i' } },
      { slug: { $regex: search_term, $options: 'i' } },
    ];
  }

  if (active_filter === 'true') {
    query.active = true;
  } else if (active_filter === 'false') {
    query.active = false;
  }

  const collections = await Collection.find(query)
    .sort({ sortOrder: 1, name: 1 })
    .select(collection_select_fields)
    .lean();

  return ok({
    collections: collections.map(serialize_collection),
    total: collections.length,
  });
}

export async function POST(req: NextRequest) {
  //   const authorization = await requirePermission(Permission.COLLECTIONS_WRITE);
  //   if (!authorization.ok) {
  //     return authorization.response;
  //   }

  const request_body = await req.json().catch(() => null);
  const validation_result = createCollectionSchema.safeParse(request_body);
  if (!validation_result.success) {
    return format_validation_issues(validation_result.error.issues);
  }

  await connect_to_database();

  const payload = validation_result.data;
  let manual_slug = payload.collection_slug ? slugify(payload.collection_slug) : undefined;

  if (manual_slug) {
    const existing_slug_owner = await Collection.findOne({ slug: manual_slug })
      .select('_id')
      .lean();

    if (existing_slug_owner) {
      // return err('A collection with this slug already exists', 409);

      // create a unique slug by appending a random string to the end of the slug
      const random_string = Math.random().toString(36).substring(2, 8);
      manual_slug = `${manual_slug}-${random_string}`;
    }
  }

  const created_collection = await Collection.create({
    name: payload.collection_name,
    ...(manual_slug ? { slug: manual_slug } : {}),
    description: payload.collection_description ?? null,
    image: payload.collection_image ?? null,
    active: payload.collection_active ?? true,
  });

  //   writeAuditLog({
  //     userId: null,
  //     actorId: new Types.ObjectId(authorization.user.userId),
  //     action: AuditAction.CATALOG_ENTITY_CREATED,
  //     entityType: 'Collection',
  //     entityId: created_collection._id.toString(),
  //     newValues: serialize_collection(created_collection),
  //     metadata: { resource: 'collection' },
  //     ...requestMeta(req),
  //   });

  return ok({ collection: serialize_collection(created_collection) }, 201);
}
