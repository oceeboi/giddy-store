import 'server-only';

import Brand from '@/models/Brand';
import Category from '@/models/Category';
import Collection from '@/models/Collection';
import ProductSize from '@/models/ProductSize';
import { Types } from 'mongoose';
export interface ProductRelationsInput {
  brandId: string;
  categoryId: string;
  collectionIds?: string[];
  sizeIds?: string[];
}

export const PRODUCT_SELECT_FIELDS =
  'name slug brand category collections productType gender colors description features media variants pricing seo tags active publishedAt createdAt updatedAt';

export async function validateProductRelations({
  brandId,
  categoryId,
  collectionIds = [],
  sizeIds = [],
}: ProductRelationsInput): Promise<{ error: string; status: 400 | 404 } | null> {
  // Deduplicate array IDs
  const uniqueCollectionIds = Array.from(new Set(collectionIds));
  const uniqueSizeIds = Array.from(new Set(sizeIds));

  // Run database checks in parallel
  const [brandExists, categoryExists, collectionsCount, sizesCount] = await Promise.all([
    Brand.exists({ _id: brandId }),
    Category.exists({ _id: categoryId }),
    uniqueCollectionIds.length > 0
      ? Collection.countDocuments({ _id: { $in: uniqueCollectionIds } })
      : Promise.resolve(0),
    uniqueSizeIds.length > 0
      ? ProductSize.countDocuments({ _id: { $in: uniqueSizeIds } })
      : Promise.resolve(0),
  ]);

  if (!brandExists) {
    return { error: 'The referenced Brand does not exist', status: 404 };
  }

  if (!categoryExists) {
    return { error: 'The referenced Category does not exist', status: 404 };
  }

  if (uniqueCollectionIds.length > 0 && collectionsCount !== uniqueCollectionIds.length) {
    return { error: 'One or more referenced Collections do not exist', status: 404 };
  }

  if (uniqueSizeIds.length > 0 && sizesCount !== uniqueSizeIds.length) {
    return { error: 'One or more referenced Variant Sizes do not exist', status: 404 };
  }

  return null;
}

// ==========================================
// Base Component Types
// ==========================================

export type ProductReference = {
  id: string;
  name: string | null;
  slug: string | null;
};

export type ProductMedia = {
  id: string | null;
  url: string;
  alt: string;
  type: string;
  order: number;
  colorId: string | null;
};

export type ProductPricing = {
  currency: string;
  basePrice: number;
  compareAtPrice: number | null;
  costPrice: number | null;
};

export type ProductColor = {
  id: string;
  name: string;
  hexCode: string | null;
  swatchImage: string | null;
};

export type ProductVariant = {
  id: string | null;
  colorId: string;
  sizeId: string;
  size: string;
  sku: string | null;
  barcode: string | null;
  stockQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderLevel: number;
  active: boolean;
  priceOverride: number | null;
};

export type ProductSeo = {
  title: string | null;
  description: string | null;
  keywords: string[];
};

export type IAdditionalSection = {
  title: string;
  content: string;
};

export type ProductDescription = {
  narrative: string | null;
  styleCode: string | null;
  fitType: string | null;
  fabricComposition: string | null;
  careInstructions: string[];
  releaseDate: Date | string | null;
  editorialHighlights: string[];
  additionalSections: IAdditionalSection[];
};

export const ProductType = {
  SNEAKER: 'sneaker',
  APPAREL: 'apparel',
  ACCESSORY: 'accessory',
  EQUIPMENT: 'equipment',
} as const;
export type ProductType = (typeof ProductType)[keyof typeof ProductType];

export const Gender = {
  MEN: 'men',
  WOMEN: 'women',
  UNISEX: 'unisex',
  KIDS: 'kids',
} as const;
export type Gender = (typeof Gender)[keyof typeof Gender];

// ==========================================
// Serialized Response Payload Type
// ==========================================

export type SerializedProduct = {
  id: string;
  name: string;
  slug: string;
  brand: ProductReference | null;
  category: ProductReference | null;
  collections: ProductReference[];
  productType: ProductType;
  gender: Gender;
  colors: ProductColor[];
  description: ProductDescription | null;
  features: string[];
  media: ProductMedia[];
  variants: ProductVariant[];
  pricing: ProductPricing | null;
  seo: ProductSeo | null;
  tags: string[];
  active: boolean;
  publishedAt: Date | string | null;
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
};

// ==========================================
// Incoming Mongoose Lean Product Document Type
// ==========================================

type RawReference =
  | { _id: Types.ObjectId | string; name?: string; slug?: string }
  | Types.ObjectId
  | string
  | null
  | undefined;

export type PopulatedProductDocument = {
  _id: Types.ObjectId | string;
  name: string;
  slug: string;
  brand?: RawReference;
  category?: RawReference;
  collections?: RawReference[];
  productType: ProductType;
  gender: Gender;
  pricing?: {
    currency: string;
    basePrice: number;
    compareAtPrice?: number | null;
    costPrice?: number | null;
  } | null;
  colors?: Array<{
    _id: Types.ObjectId | string;
    name: string;
    hexCode?: string | null;
    swatchImage?: string | null;
  }>;
  media?: Array<{
    _id?: Types.ObjectId | string;
    url: string;
    alt: string;
    type: string;
    order: number;
    colorId?: string | null;
  }>;
  variants?: Array<{
    _id?: Types.ObjectId | string;
    colorId: string;
    sizeId: Types.ObjectId | string;
    size: string;
    sku?: string | null;
    barcode?: string | null;
    stockQuantity: number;
    reservedQuantity: number;
    availableQuantity: number;
    reorderLevel: number;
    active: boolean;
    priceOverride?: number | null;
  }>;
  description?: {
    narrative?: string | null;
    styleCode?: string | null;
    fitType?: string | null;
    fabricComposition?: string | null;
    careInstructions?: string[];
    releaseDate?: Date | string | null;
    editorialHighlights?: string[];
    additionalSections?: IAdditionalSection[];
  } | null;
  features?: string[];
  seo?: {
    title?: string | null;
    description?: string | null;
    keywords?: string[];
  } | null;
  tags?: string[];
  active?: boolean;
  publishedAt?: Date | string | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
};

// ==========================================
// Helpers & Serializer
// ==========================================

function serializeReference(ref: RawReference): ProductReference | null {
  if (!ref) return null;
  if (typeof ref === 'string' || ref instanceof Types.ObjectId) {
    return { id: ref.toString(), name: null, slug: null };
  }
  return {
    id: ref._id.toString(),
    name: ref.name ?? null,
    slug: ref.slug ?? null,
  };
}

export function serializeProduct(product: PopulatedProductDocument): SerializedProduct {
  return {
    id: product._id.toString(),
    name: product.name,
    slug: product.slug,
    brand: serializeReference(product.brand),
    category: serializeReference(product.category),
    collections: Array.isArray(product.collections)
      ? product.collections
          .map(serializeReference)
          .filter((item): item is ProductReference => item !== null)
      : [],
    productType: product.productType,
    gender: product.gender,
    pricing: product.pricing
      ? {
          currency: product.pricing.currency,
          basePrice: product.pricing.basePrice,
          compareAtPrice: product.pricing.compareAtPrice ?? null,
          costPrice: product.pricing.costPrice ?? null,
        }
      : null,
    colors:
      product.colors?.map((c) => ({
        id: c._id.toString(),
        name: c.name,
        hexCode: c.hexCode ?? null,
        swatchImage: c.swatchImage ?? null,
      })) ?? [],
    media:
      product.media?.map((m) => ({
        id: m._id?.toString() ?? null,
        url: m.url,
        alt: m.alt,
        type: m.type,
        order: m.order,
        colorId: m.colorId ?? null,
      })) ?? [],
    variants:
      product.variants?.map((v) => ({
        id: v._id?.toString() ?? null,
        colorId: v.colorId,
        sizeId: v.sizeId.toString(),
        size: v.size,
        sku: v.sku ?? null,
        barcode: v.barcode ?? null,
        stockQuantity: v.stockQuantity,
        reservedQuantity: v.reservedQuantity,
        availableQuantity: v.availableQuantity,
        reorderLevel: v.reorderLevel,
        active: v.active,
        priceOverride: v.priceOverride ?? null,
      })) ?? [],
    description: product.description
      ? {
          narrative: product.description.narrative ?? null,
          styleCode: product.description.styleCode ?? null,
          fitType: product.description.fitType ?? null,
          fabricComposition: product.description.fabricComposition ?? null,
          careInstructions: product.description.careInstructions ?? [],
          releaseDate: product.description.releaseDate ?? null,
          editorialHighlights: product.description.editorialHighlights ?? [],
          additionalSections: product.description.additionalSections ?? [],
        }
      : null,
    features: product.features ?? [],
    seo: product.seo
      ? {
          title: product.seo.title ?? null,
          description: product.seo.description ?? null,
          keywords: product.seo.keywords ?? [],
        }
      : null,
    tags: product.tags ?? [],
    active: product.active ?? false,
    publishedAt: product.publishedAt ?? null,
    createdAt: product.createdAt ?? null,
    updatedAt: product.updatedAt ?? null,
  };
}
