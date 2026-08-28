import { NextRequest } from 'next/server';

import { err, ok } from '@/lib/auth/response';
import connect_to_database from '@/lib/db';
import Brand from '@/models/Brand';
import Category from '@/models/Category';
import Collection from '@/models/Collection';
import Product, { EnumProductType } from '@/models/Product';
import { Gender } from '@/types/shared/product';
import {
  PRODUCT_SELECT_FIELDS,
  serializeProduct,
} from '@/lib/service-route/admin-product-route-helpers';

function parse_positive_int(value: string | null, fallback: number, max: number): number {
  if (!value) return fallback;
  const parsed_value = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed_value) || parsed_value < 1) {
    return fallback;
  }
  return Math.min(parsed_value, max);
}

function parse_number(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl;

  const search_term = url.searchParams.get('search')?.trim();
  const brand_filter = url.searchParams.get('brand')?.trim();
  const category_filter = url.searchParams.get('category')?.trim();
  const collection_filter = url.searchParams.get('collection')?.trim();
  const product_type_filter = url.searchParams.get('productType')?.trim();
  const gender_filter = url.searchParams.get('gender')?.trim();
  const color_filter = url.searchParams.get('color')?.trim();
  const size_param = url.searchParams.get('size')?.trim();
  const in_stock_param = url.searchParams.get('in_stock')?.trim();
  const sort_filter = url.searchParams.get('sort')?.trim();

  const min_price = parse_number(url.searchParams.get('min_price'));
  const max_price = parse_number(url.searchParams.get('max_price'));

  const page = parse_positive_int(url.searchParams.get('page'), 1, Number.MAX_SAFE_INTEGER);
  const limit = parse_positive_int(url.searchParams.get('limit'), 12, 48);

  const query: Record<string, unknown> = {
    active: true,
  };

  await connect_to_database();

  // 1. BRAND LOOKUP (Supports single slug or comma-separated slugs)
  if (brand_filter) {
    const brand_slugs = brand_filter
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    const brand_docs = await Brand.find({ slug: { $in: brand_slugs } })
      .select('_id')
      .lean();

    if (brand_docs.length === 0) {
      return ok({
        products: [],
        pagination: { page, limit, total: 0, totalPages: 1 },
      });
    }

    query.brand =
      brand_docs.length === 1 ? brand_docs[0]._id : { $in: brand_docs.map((b) => b._id) };
  }

  // 2. CATEGORY LOOKUP
  if (category_filter) {
    const category_slugs = category_filter
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    const category_docs = await Category.find({ slug: { $in: category_slugs } })
      .select('_id')
      .lean();

    if (category_docs.length === 0) {
      return ok({
        products: [],
        pagination: { page, limit, total: 0, totalPages: 1 },
      });
    }

    query.category =
      category_docs.length === 1 ? category_docs[0]._id : { $in: category_docs.map((c) => c._id) };
  }

  // 3. COLLECTION LOOKUP
  if (collection_filter) {
    const collection_slugs = collection_filter
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    const collection_docs = await Collection.find({ slug: { $in: collection_slugs } })
      .select('_id')
      .lean();

    if (collection_docs.length === 0) {
      return ok({
        products: [],
        pagination: { page, limit, total: 0, totalPages: 1 },
      });
    }

    query.collections = { $in: collection_docs.map((col) => col._id) };
  }

  // 4. EMBEDDED COLOR FILTER (Matches colors.name, colors.hexCode, or description.colorway)
  if (color_filter) {
    const requested_colors = color_filter
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    if (requested_colors.length > 0) {
      const color_regexes = requested_colors.map((c) => new RegExp(c, 'i'));

      query.$or = [
        { 'colors.name': { $in: color_regexes } },
        { 'colors.hexCode': { $in: requested_colors.map((c) => c.toUpperCase()) } },
        { 'description.colorway': { $in: color_regexes } },
      ];
    }
  }

  // 5. ENUM VALIDATIONS
  if (product_type_filter) {
    if (!Object.values(EnumProductType).includes(product_type_filter as EnumProductType)) {
      return err('Invalid product type filter', 400);
    }
    query.productType = product_type_filter;
  }

  if (gender_filter) {
    if (!Object.values(Gender).includes(gender_filter as Gender)) {
      return err('Invalid gender filter', 400);
    }
    query.gender = gender_filter;
  }

  // 6. PRICE RANGE (Querying pricing.basePrice)
  if (min_price !== null || max_price !== null) {
    const price_query: Record<string, number> = {};
    if (min_price !== null) price_query.$gte = min_price;
    if (max_price !== null) price_query.$lte = max_price;

    query['pricing.basePrice'] = price_query;
  }

  // 7. IN-STOCK & SIZE EXPRESSION ENGINE (Queries embedded variants array)
  const expr_conditions: Array<Record<string, unknown>> = [];

  if (in_stock_param === 'true' || in_stock_param === 'false') {
    const isInStockRequired = in_stock_param === 'true';

    expr_conditions.push({
      [isInStockRequired ? '$gt' : '$eq']: [
        {
          $size: {
            $filter: {
              input: '$variants',
              as: 'variant_item',
              cond: {
                $and: [
                  { $eq: ['$$variant_item.active', true] },
                  { $gt: ['$$variant_item.stockQuantity', '$$variant_item.reservedQuantity'] },
                ],
              },
            },
          },
        },
        0,
      ],
    });
  }

  if (size_param) {
    const requested_sizes = size_param
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (requested_sizes.length > 0) {
      const size_regexes = requested_sizes.map((s) => new RegExp(`^${s}$`, 'i'));

      expr_conditions.push({
        $gt: [
          {
            $size: {
              $filter: {
                input: '$variants',
                as: 'variant_item',
                cond: {
                  $and: [
                    { $eq: ['$$variant_item.active', true] },
                    { $gt: ['$$variant_item.stockQuantity', '$$variant_item.reservedQuantity'] },
                    {
                      $or: size_regexes.map((rx) => ({
                        $regexMatch: {
                          input: '$$variant_item.size',
                          regex: rx.source,
                          options: 'i',
                        },
                      })),
                    },
                  ],
                },
              },
            },
          },
          0,
        ],
      });
    }
  }

  if (expr_conditions.length > 0) {
    query.$expr = expr_conditions.length === 1 ? expr_conditions[0] : { $and: expr_conditions };
  }

  // 8. TEXT SEARCH / FUZZY MATCHING
  if (search_term) {
    const search_regex = { $regex: search_term, $options: 'i' };
    const search_conditions = [
      { name: search_regex },
      { slug: search_regex },
      { 'description.narrative': search_regex },
      { 'description.styleCode': search_regex },
      { 'description.colorway': search_regex },
      { 'description.fabricComposition': search_regex },
      { tags: search_regex },
      { 'variants.sku': search_regex },
    ];

    if (query.$or) {
      query.$and = [{ $or: query.$or }, { $or: search_conditions }];
      delete query.$or;
    } else {
      query.$or = search_conditions;
    }
  }

  // 9. SORTING OPTIONS
  let sort_query: Record<string, 1 | -1> = { publishedAt: -1, createdAt: -1 };
  if (sort_filter === 'newest') sort_query = { publishedAt: -1, createdAt: -1 };
  if (sort_filter === 'oldest') sort_query = { publishedAt: 1, createdAt: 1 };
  if (sort_filter === 'price_asc') sort_query = { 'pricing.basePrice': 1 };
  if (sort_filter === 'price_desc') sort_query = { 'pricing.basePrice': -1 };
  if (sort_filter === 'name_asc') sort_query = { name: 1 };
  if (sort_filter === 'name_desc') sort_query = { name: -1 };

  // 10. EXECUTE QUERY
  const [total, products] = await Promise.all([
    Product.countDocuments(query),
    Product.find(query)
      .sort(sort_query)
      .skip((page - 1) * limit)
      .limit(limit)
      .select(PRODUCT_SELECT_FIELDS)
      .populate('brand', 'name slug logo')
      .populate('category', 'name slug')
      .populate('collections', 'name slug type')
      .lean(),
  ]);

  return ok({
    products: products.map(serializeProduct as any),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  });
}
