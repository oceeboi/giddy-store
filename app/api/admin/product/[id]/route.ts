import { err, ok, validationErr } from '@/lib/auth/response';
import connect_to_database from '@/lib/db';
import {
  PRODUCT_SELECT_FIELDS,
  serializeProduct,
  validateProductRelations,
} from '@/lib/service-route/admin-product-route-helpers';
import Product from '@/models/Product';
import { updateProductSchema } from '@/schemas/update-product.schema';
import { slugify } from '@/utils/slug';
import { Types } from 'mongoose';
import { NextRequest } from 'next/server';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

async function getProductId(ctx: RouteContext): Promise<string> {
  const { id } = await ctx.params;
  return id;
}

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const productId = await getProductId(ctx);
  if (!Types.ObjectId.isValid(productId)) {
    return err('Invalid product id', 400);
  }

  await connect_to_database();

  const foundProduct = await Product.findById(productId)
    .select(PRODUCT_SELECT_FIELDS)
    .populate('brand', 'name slug')
    .populate('category', 'name slug')
    .populate('collections', 'name slug type')
    .lean();

  if (!foundProduct) {
    return err('Product not found', 404);
  }

  // Cast lean document to expected PopulatedProductDocument for type safety
  return ok({ product: serializeProduct(foundProduct as any) });
}
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

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const productId = await getProductId(ctx);
  if (!Types.ObjectId.isValid(productId)) {
    return err('Invalid product id', 400);
  }

  const requestBody = await req.json().catch(() => null);
  const validationResult = updateProductSchema.safeParse(requestBody);

  if (!validationResult.success) {
    return format_validation_issues(validationResult.error.issues);
  }

  await connect_to_database();

  const existingProduct = await Product.findById(productId);
  if (!existingProduct) {
    return err('Product not found', 404);
  }

  const payload = validationResult.data;

  // 1. Slug handling & uniqueness check
  let updatedSlug = existingProduct.slug;
  if (payload.product_name && payload.product_name !== existingProduct.name) {
    const manualSlug = slugify(payload.product_name);
    const existingSlugOwner = await Product.findOne({
      slug: manualSlug,
      _id: { $ne: productId },
    })
      .select('_id')
      .lean();

    if (existingSlugOwner) {
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      updatedSlug = `${manualSlug}-${randomSuffix}`;
    } else {
      updatedSlug = manualSlug;
    }
  }

  // 2. Validate Foreign Relations (if updated)
  const variantSizeIds = payload.product_variants
    ? payload.product_variants.map((v) => v.sizeId)
    : undefined;

  const relationError = await validateProductRelations({
    brandId: payload.product_brand! ?? undefined,
    categoryId: payload.product_category! ?? undefined,
    collectionIds: payload.product_collections ?? undefined,
    sizeIds: variantSizeIds,
  });

  if (relationError) {
    return err(relationError.error, relationError.status);
  }

  // 3. Process & Map Color Identifiers (Database ObjectIds vs client tempIds)
  const colorIdMap = new Map<string, string>();
  let mappedColors = existingProduct.colors;

  if (payload.product_colors) {
    mappedColors = payload.product_colors.map((color) => {
      // Re-use existing DB ObjectId if available; generate a new one if dynamic additions were made
      const dbColorId =
        color.id && Types.ObjectId.isValid(color.id)
          ? new Types.ObjectId(color.id)
          : new Types.ObjectId();

      const stringId = dbColorId.toString();

      if (color.tempId) {
        colorIdMap.set(color.tempId, stringId);
      }
      colorIdMap.set(stringId, stringId);

      return {
        _id: dbColorId,
        name: color.name,
        hexCode: color.hexCode ?? null,
        swatchImage: color.swatchImage ?? null,
      } as any;
    });
  } else {
    // Populate map with existing DB color IDs if colors were not passed in payload
    existingProduct.colors.forEach((c: any) => {
      const idStr = c._id.toString();
      colorIdMap.set(idStr, idStr);
    });
  }

  // 4. Map Color references in Media items
  let mappedMedia = existingProduct.media;
  if (payload.product_media) {
    mappedMedia = payload.product_media.map((media) => {
      const resolvedColorId = media.colorId
        ? (colorIdMap.get(media.colorId) ??
          (Types.ObjectId.isValid(media.colorId) ? media.colorId : null))
        : null;

      return {
        url: media.url,
        alt: media.alt ?? 'Product media',
        type: media.type ?? 'image',
        order: media.order ?? 0,
        colorId: resolvedColorId ? new Types.ObjectId(resolvedColorId) : null,
      } as any;
    });
  }

  // 5. Map Color references and size ObjectIds in Variants
  let mappedVariants = existingProduct.variants;
  if (payload.product_variants) {
    mappedVariants = payload.product_variants.map((variant) => {
      const resolvedColorId = colorIdMap.get(variant.colorId) ?? variant.colorId;

      return {
        ...(variant.id && Types.ObjectId.isValid(variant.id)
          ? { _id: new Types.ObjectId(variant.id) }
          : {}),
        colorId: new Types.ObjectId(resolvedColorId),
        sizeId: new Types.ObjectId(variant.sizeId),
        size: variant.size,
        sku: variant.sku ?? null,
        barcode: variant.barcode ?? null,
        stockQuantity: variant.stockQuantity,
        reservedQuantity: variant.reservedQuantity ?? 0,
        availableQuantity: variant.availableQuantity,
        reorderLevel: variant.reorderLevel ?? 5,
        active: variant.active ?? true,
        priceOverride: variant.priceOverride ?? null,
      } as any;
    });
  }

  // 6. Build Subdocuments
  const updatedPricing = payload.product_pricing
    ? {
        currency: payload.product_pricing.currency ?? existingProduct.pricing?.currency ?? 'NGN',
        basePrice: payload.product_pricing.basePrice ?? existingProduct.pricing?.basePrice ?? 0,
        compareAtPrice: payload.product_pricing.compareAtPrice ?? null,
        costPrice: payload.product_pricing.costPrice ?? null,
      }
    : existingProduct.pricing;

  const updatedDescription = payload.product_description
    ? {
        narrative: payload.product_description.narrative ?? '',
        styleCode: payload.product_description.styleCode ?? null,
        fitType: payload.product_description.fitType ?? null,
        fabricComposition: payload.product_description.fabricComposition ?? null,
        careInstructions: payload.product_description.careInstructions ?? [],
        releaseDate: payload.product_description.releaseDate ?? null,
        editorialHighlights: payload.product_description.editorialHighlights ?? [],
        additionalSections: payload.product_description.additionalSections ?? [],
      }
    : existingProduct.description;

  const updatedSeo = payload.product_seo
    ? {
        title: payload.product_seo.title ?? null,
        description: payload.product_seo.description ?? null,
        keywords: payload.product_seo.keywords ?? [],
      }
    : existingProduct.seo;

  // 7. Update document fields safely
  if (payload.product_name !== undefined) existingProduct.name = payload.product_name;
  existingProduct.slug = updatedSlug;

  if (payload.product_brand !== undefined) {
    existingProduct.brand =
      payload.product_brand && Types.ObjectId.isValid(payload.product_brand)
        ? new Types.ObjectId(payload.product_brand)
        : (null as any);
  }
  if (payload.product_category !== undefined) {
    existingProduct.category =
      payload.product_category && Types.ObjectId.isValid(payload.product_category)
        ? new Types.ObjectId(payload.product_category)
        : (null as any);
  }
  if (payload.product_collections !== undefined) {
    existingProduct.collections = payload.product_collections.map((id) => new Types.ObjectId(id));
  }
  if (payload.product_productType !== undefined)
    existingProduct.productType = payload.product_productType;
  if (payload.product_gender !== undefined) existingProduct.gender = payload.product_gender;
  if (payload.product_features !== undefined) existingProduct.features = payload.product_features;
  if (payload.product_tags !== undefined) existingProduct.tags = payload.product_tags;
  if (payload.product_active !== undefined) existingProduct.active = payload.product_active;
  if (payload.product_publishedAt !== undefined) {
    existingProduct.publishedAt =
      payload.product_publishedAt === null
        ? null
        : payload.product_publishedAt instanceof Date
          ? payload.product_publishedAt
          : new Date(payload.product_publishedAt);
  }

  existingProduct.colors = mappedColors;
  existingProduct.media = mappedMedia;
  existingProduct.variants = mappedVariants;
  existingProduct.pricing = updatedPricing;
  existingProduct.description = updatedDescription;
  existingProduct.seo = updatedSeo;

  await existingProduct.save();

  // 8. Fetch updated & populated document
  const updatedProduct = await Product.findById(productId)
    .select(PRODUCT_SELECT_FIELDS)
    .populate('brand', 'name slug')
    .populate('category', 'name slug')
    .populate('collections', 'name slug type')
    .populate('variants.sizeId', 'name code')
    .lean();

  if (!updatedProduct) {
    return err('Product not found after update', 500);
  }

  return ok({ product: serializeProduct(updatedProduct as any) });
}

export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  const productId = await getProductId(ctx);
  if (!Types.ObjectId.isValid(productId)) {
    return err('Invalid product id', 400);
  }

  await connect_to_database();

  const foundProduct = await Product.findById(productId)
    .select(PRODUCT_SELECT_FIELDS)
    .populate('brand', 'name slug')
    .populate('category', 'name slug')
    .populate('collections', 'name slug type');

  if (!foundProduct) {
    return err('Product not found', 404);
  }

  await Product.deleteOne({ _id: new Types.ObjectId(productId) });

  // Optional: Add audit logging here if desired
  // writeAuditLog({
  //   userId: null,
  //   actorId: new Types.ObjectId(authorization.user.userId),
  //   action: AuditAction.CATALOG_ENTITY_DELETED,
  //   entityType: 'Product',
  //   entityId: productId,
  //   metadata: { resource: 'product' },
  //   ...requestMeta(_req),
  // });

  return ok({ message: 'Product deleted successfully', id: productId });
}
