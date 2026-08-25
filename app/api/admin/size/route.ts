import { err, ok, validationErr } from '@/lib/auth/response';
import connect_to_database from '@/lib/db';
import ProductSize from '@/models/ProductSize';
import { createSizeSchema } from '@/schemas/create-catalogs.schema';
import { NextRequest } from 'next/server';

const size_select_fields = 'name';

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

function serialize_size(size: { _id: { toString(): string } | string; name: string }) {
  return {
    id: typeof size._id === 'string' ? size._id : size._id.toString(),
    name: size.name,
  };
}

export async function GET(req: NextRequest) {
  // const authorization = await requirePermission(Permission.BRANDS_READ);
  // if (!authorization.ok) {
  //   return authorization.response;
  // }

  await connect_to_database();

  const search_term = req.nextUrl.searchParams.get('search')?.trim();

  const query: Record<string, unknown> = {};

  if (search_term) {
    query.$or = [
      { name: { $regex: search_term, $options: 'i' } },
      { slug: { $regex: search_term, $options: 'i' } },
    ];
  }

  const product_sizes = await ProductSize.find(query)
    .sort({ name: 1 })
    .select(size_select_fields)
    .lean();

  return ok({
    sizes: product_sizes.map(serialize_size),
    total: product_sizes.length,
  });
}

export async function POST(req: NextRequest) {
  // const authorization = await requirePermission(Permission.BRANDS_WRITE);
  // if (!authorization.ok) {
  //   return authorization.response;
  // }

  const request_body = await req.json().catch(() => null);
  const validation_result = createSizeSchema.safeParse(request_body);

  if (!validation_result.success) {
    return format_validation_issues(validation_result.error.issues);
  }

  await connect_to_database();

  const payload = validation_result.data;

  const exists = await ProductSize.exists({ name: payload.size_name });
  if (exists) {
    return err('Exact name already exists', 409);
  }

  const created_size = await ProductSize.create({
    name: payload.size_name,
  });

  return ok({ size: serialize_size(created_size) }, 201);
}
