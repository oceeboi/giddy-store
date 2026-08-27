import { err, ok, requestMeta, validationErr } from '@/lib/auth/response';

import connect_to_database from '@/lib/db';

import Product, { EnumProductType } from '@/models/Product';
import { createProductSchema, Gender } from '@/schemas/create-product.schema';
import { slugify } from '@/utils/slug';
import { Types } from 'mongoose';
import { NextRequest } from 'next/server';
import {
  PRODUCT_SELECT_FIELDS,
  serializeProduct,
  validateProductRelations,
} from '@/lib/service-route/admin-product-route-helpers';

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

// Helper to sanitize & validate incoming URL search params
function buildProductQuery(req: NextRequest) {
  const searchTerm = req.nextUrl.searchParams.get('search')?.trim();
  const activeFilter = req.nextUrl.searchParams.get('active');
  const brandFilter = req.nextUrl.searchParams.get('brand');
  const categoryFilter = req.nextUrl.searchParams.get('category');
  const collectionFilter = req.nextUrl.searchParams.get('collection');
  const productTypeFilter = req.nextUrl.searchParams.get('productType');
  const genderFilter = req.nextUrl.searchParams.get('gender');

  const query: Record<string, unknown> = {};

  if (searchTerm) {
    query.$or = [
      { name: { $regex: searchTerm, $options: 'i' } },
      { slug: { $regex: searchTerm, $options: 'i' } },
      { 'description.narrative': { $regex: searchTerm, $options: 'i' } },
      { 'description.styleCode': { $regex: searchTerm, $options: 'i' } },
      { tags: { $regex: searchTerm, $options: 'i' } },
      { 'colors.name': { $regex: searchTerm, $options: 'i' } },
    ];
  }

  if (activeFilter === 'true') query.active = true;
  if (activeFilter === 'false') query.active = false;

  if (brandFilter) {
    if (!Types.ObjectId.isValid(brandFilter)) {
      return { error: 'Invalid brand filter ID', status: 400 as const };
    }
    query.brand = brandFilter;
  }

  if (categoryFilter) {
    if (!Types.ObjectId.isValid(categoryFilter)) {
      return { error: 'Invalid category filter ID', status: 400 as const };
    }
    query.category = categoryFilter;
  }

  if (collectionFilter) {
    if (!Types.ObjectId.isValid(collectionFilter)) {
      return { error: 'Invalid collection filter ID', status: 400 as const };
    }
    query.collections = collectionFilter;
  }

  if (productTypeFilter) {
    if (!Object.values(EnumProductType).includes(productTypeFilter as EnumProductType)) {
      return { error: 'Invalid product type filter', status: 400 as const };
    }
    query.productType = productTypeFilter;
  }

  if (genderFilter) {
    if (!Object.values(Gender).includes(genderFilter as Gender)) {
      return { error: 'Invalid gender filter', status: 400 as const };
    }
    query.gender = genderFilter;
  }

  return { query };
}

export async function GET(req: NextRequest) {
  // 2. Validate URL search filters
  const queryResult = buildProductQuery(req);
  if (!('query' in queryResult)) {
    return err(queryResult.error, queryResult.status);
  }

  await connect_to_database();

  // 3. Fetch with selects, populates, and lean execution
  const products = await Product.find(queryResult.query)
    .sort({ createdAt: -1 })
    .select(PRODUCT_SELECT_FIELDS)
    .populate('brand', 'name slug logo')
    .populate('category', 'name slug')
    .populate('collections', 'name slug')
    .populate('variants.sizeId', 'name code') // Populates product size document if applicable
    .lean();

  return ok({
    products: products.map(serializeProduct as any),
    total: products.length,
  });
}

export async function POST(req: NextRequest) {
  const requestBody = await req.json().catch(() => null);
  const validationResult = createProductSchema.safeParse(requestBody);

  if (!validationResult.success) {
    return format_validation_issues(validationResult.error.issues);
  }

  await connect_to_database();

  const payload = validationResult.data;

  // 1. Slug availability check
  const manualSlug = slugify(payload.product_name);
  const existingSlugOwner = await Product.findOne({ slug: manualSlug }).select('_id').lean();

  let finalSlug = manualSlug;
  if (existingSlugOwner) {
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    finalSlug = `${manualSlug}-${randomSuffix}`;
  }

  // 2. Validate Foreign DB Relations (Brand, Category, Collections, Variant Sizes)
  const variantSizeIds = payload.product_variants.map((v) => v.sizeId);

  const relationError = await validateProductRelations({
    brandId: payload.product_brand_id,
    categoryId: payload.product_category_id,
    collectionIds: payload.product_collections_id,
    sizeIds: variantSizeIds,
  });

  if (relationError) {
    return err(relationError.error, relationError.status);
  }

  // 3. Resolve client-side tempId -> DB ObjectIds for Colors
  const colorIdMap = new Map<string, string>();

  const mappedColors = payload.product_colors.map((color) => {
    const dbColorId = new Types.ObjectId();
    const stringId = dbColorId.toString();

    colorIdMap.set(color.tempId, stringId);

    return {
      _id: dbColorId,
      name: color.name,
      hexCode: color.hexCode ?? null,
      swatchImage: color.swatchImage ?? null,
    };
  });

  // 4. Map colorId references in Media
  const mappedMedia = payload.product_media.map((media) => ({
    url: media.url,
    alt: media.alt,
    type: media.type,
    order: media.order,
    colorId: media.colorId ? (colorIdMap.get(media.colorId) ?? null) : null,
  }));

  // 5. Map colorId references and transform sizeId in Variants
  const mappedVariants = payload.product_variants.map((variant) => ({
    colorId: colorIdMap.get(variant.colorId)!,
    sizeId: new Types.ObjectId(variant.sizeId),
    size: variant.size,
    barcode: variant.barcode ?? null,
    stockQuantity: variant.stockQuantity,
    reservedQuantity: variant.reservedQuantity,
    availableQuantity: variant.availableQuantity,
    reorderLevel: variant.reorderLevel,
    active: variant.active,
    priceOverride: variant.priceOverride ?? null,
  }));

  // 6. Structure Description and Pricing subdocuments
  const mappedDescription = {
    narrative: payload.product_description?.narrative ?? '',
    styleCode: payload.product_description?.styleCode ?? null,
    fitType: null,
    fabricComposition: payload.product_description?.materials ?? null,
    careInstructions: [],
    releaseDate: payload.product_description?.releaseDate ?? null,
    editorialHighlights: payload.product_description?.editorialHighlights ?? [],
    additionalSections: payload.product_description?.additionalSections ?? [],
  };

  const mappedPricing = {
    currency: payload.product_currency?.toUpperCase() || 'NGN',
    basePrice: payload.product_basePrice,
    compareAtPrice: payload.product_compareAtPrice ?? null,
    costPrice: payload.product_costPrice ?? null,
  };

  // 7. Instantiate and save the Product
  const createdProduct = await Product.create({
    name: payload.product_name,
    slug: finalSlug,
    brand: new Types.ObjectId(payload.product_brand_id),
    category: new Types.ObjectId(payload.product_category_id),
    collections: payload.product_collections_id?.map((id) => new Types.ObjectId(id)) ?? [],
    productType: payload.product_type,
    gender: payload.product_gender,
    colors: mappedColors,
    description: mappedDescription,
    features: payload.product_features ?? [],
    media: mappedMedia,
    variants: mappedVariants,
    pricing: mappedPricing,
    seo: payload.product_seo ?? { title: null, description: null, keywords: [] },
    tags: payload.product_tags ?? [],
    active: payload.product_active ?? false,
  });

  // 8. Populate product references for clean return payload
  const populatedProduct = await Product.findById(createdProduct._id)
    .select(PRODUCT_SELECT_FIELDS)
    .populate('brand', 'name slug')
    .populate('category', 'name slug')
    .populate('collections', 'name slug type')
    .lean();

  if (!populatedProduct) {
    return err('Product not found after creation', 500);
  }

  // // 9. Audit Logging
  // writeAuditLog({
  //   userId: null,
  //   actorId: new Types.ObjectId(authorization.user.userId),
  //   action: AuditAction.CATALOG_ENTITY_CREATED,
  //   entityType: 'Product',
  //   entityId: populatedProduct._id.toString(),
  //   newValues: serializeProduct(populatedProduct),
  //   metadata: { resource: 'product' },
  //   ...requestMeta(req),
  // });

  return ok({ product: serializeProduct(populatedProduct as any) }, 201);
}
