import { z } from 'zod';

// ==========================================
// Enums & Constants
// ==========================================

export const ProductType = {
  SNEAKER: 'sneaker', // footwear
  APPAREL: 'apparel', // clothing
  ACCESSORY: 'accessory', // bags, hats, jewelry, etc.
  EQUIPMENT: 'equipment', // sports gear, electronics, etc.
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
// Reusable Helpers & Primitives
// ==========================================

const nullableTrimmedString = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? null : value),
  z.string().trim().min(1, 'Value must contain at least 1 character.').nullable().optional()
);

const objectIdSchema = (message?: string) =>
  z
    .string()
    .trim()
    .regex(/^[a-f\d]{24}$/i, message ?? 'Invalid object Id');

const collectionIdsSchema = z.array(objectIdSchema()).max(50, 'Too many collections assigned');

const optionalCoercedNumber = (minMessage?: string) =>
  z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    z.coerce
      .number({ message: 'Must be a valid number' })
      .min(0, minMessage ?? 'Price must be zero or greater')
      .optional()
  );

// ==========================================
// Component Schemas
// ==========================================

const mediaItemSchema = z.object({
  url: z.string().url(),
  key: z.string().min(1),
  alt: z.string().min(1, 'Alt text is required for accessibility'),
  type: z.enum(['image', 'video']),
  order: z.number().int().min(0),
  colorId: z.string().optional(),
});

const productSeoSchema = z.object({
  title: z.string().trim().max(70).nullable().optional(),
  description: z.string().trim().max(160).nullable().optional(),
  keywords: z.array(z.string().trim().min(1).max(50)).max(30).optional(),
});

const productAdditionalSectionSchema = z.object({
  title: z.string().trim().min(1).max(60),
  content: z.string().trim().min(1).max(2000),
});

const productDescriptionSchema = z.object({
  narrative: z.string().trim().min(1, 'Description narrative is required').max(2000),
  styleCode: z.string().trim().max(50).nullable().optional(),
  colorway: z.string().trim().max(150).nullable().optional(),
  releaseDate: z.coerce.date().nullable().optional(),
  materials: nullableTrimmedString,
  editorialHighlights: z.array(z.string().trim().min(1).max(200)).max(8).optional(),
  additionalSections: z.array(productAdditionalSectionSchema).max(5).optional(),
});

const productVariantSchema = z.object({
  colorId: z.string().trim().min(1, 'Color reference is required'),
  sizeId: objectIdSchema(),
  size: z.string().trim().min(1, 'Size is required').max(20),
  barcode: nullableTrimmedString,
  stockQuantity: z.coerce.number().int().min(0, 'Stock quantity must be zero or greater'),
  reservedQuantity: z.coerce.number().int().min(0, 'Reserved quantity must be zero or greater'),
  availableQuantity: z.coerce.number().int().min(0, 'Available quantity must be zero or greater'),
  reorderLevel: z.coerce.number().int().min(0, 'Reorder level must be zero or greater'),
  active: z.boolean(),
  priceOverride: optionalCoercedNumber('Price override must be zero or greater'),
});

const productColorSchema = z.object({
  tempId: z.string().trim().min(1, 'Temporary color ID is required'),
  name: z.string().trim().min(1, 'Color name is required').max(50),
  hexCode: z
    .string()
    .trim()
    .regex(/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/, 'Invalid hex code')
    .optional(),
  swatchImage: nullableTrimmedString,
});

// ==========================================
// Main Product Schema with Frontend Refinement
// ==========================================

export const createProductSchema = z
  .object({
    product_name: z.string().trim().min(1, 'Product name is required').max(200),
    product_category_id: objectIdSchema('Select a category'),
    product_brand_id: objectIdSchema('Select a brand'),
    product_collections_id: collectionIdsSchema.optional(),

    product_currency: z
      .string()
      .trim()
      .length(3, 'Currency must be a 3-letter ISO code')
      .optional()
      .or(z.literal('')),

    product_basePrice: z.preprocess(
      (val) => (val === '' || val === null || val === undefined ? undefined : val),
      z.coerce
        .number({ message: 'Base price is required' })
        .min(0, 'Base price must be zero or greater')
    ),

    product_compareAtPrice: optionalCoercedNumber('Compare at price must be zero or greater'),
    product_costPrice: optionalCoercedNumber('Cost price must be zero or greater'),

    product_features: z.array(z.string().trim().min(1).max(200)).max(50).optional(),
    product_media: z.array(mediaItemSchema).min(1, 'Upload at least one product image'),
    product_description: productDescriptionSchema.optional(),
    product_seo: productSeoSchema.optional(),

    product_type: z.enum(
      [ProductType.SNEAKER, ProductType.APPAREL, ProductType.ACCESSORY, ProductType.EQUIPMENT],
      { message: 'Select a product type' }
    ),

    product_variants: z.array(productVariantSchema),
    product_colors: z.array(productColorSchema).min(1, 'At least one color is required'),

    product_gender: z.enum([Gender.MEN, Gender.WOMEN, Gender.UNISEX, Gender.KIDS], {
      message: 'Select a gender',
    }),
    product_tags: z.array(z.string().trim().min(1).max(50)).max(50).optional(),
    product_active: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    const validTempColorIds = new Set(data.product_colors.map((color) => color.tempId));

    data.product_variants.forEach((variant, index) => {
      if (!validTempColorIds.has(variant.colorId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'This variant references a color that does not exist in the product colors list.',
          path: ['product_variants', index, 'colorId'],
        });
      }
    });
  });

export type CreateProductInput = z.input<typeof createProductSchema>;
