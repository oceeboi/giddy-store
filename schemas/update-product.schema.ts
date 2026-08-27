import { z } from 'zod';
import { Gender } from '@/types/shared/product';
import { ProductType } from './create-product.schema';

// Helper to validate Mongoose ObjectIds
const objectIdSchema = z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
  message: 'Invalid ObjectId format',
});

// Base Sub-Schemas for nested product updates
const pricingUpdateSchema = z.object({
  currency: z.string().min(1, 'Currency code is required').optional(),
  basePrice: z.number().min(0, 'Base price cannot be negative').optional(),
  compareAtPrice: z.number().min(0).nullable().optional(),
  costPrice: z.number().min(0).nullable().optional(),
});

const colorUpdateSchema = z.object({
  id: z.string().optional(), // Existing database ObjectId if saved
  tempId: z.string().optional(), // Session key if created dynamically in editor
  name: z.string().min(1, 'Color name is required'),
  hexCode: z.string().nullable().optional(),
  swatchImage: z.string().url('Invalid swatch image URL').nullable().optional(),
});

const mediaUpdateSchema = z.object({
  id: z.string().nullable().optional(), // Existing DB ID
  key: z.string().nullable().optional(), // S3/Storage identifier or client key
  url: z.string().url('Invalid media URL'),
  alt: z.string().optional().default('Product media'),
  type: z.enum(['image', 'video']).optional().default('image'),
  order: z.number().int().min(0).default(0),
  colorId: z.string().nullable().optional(), // References color id or tempId
  isNew: z.boolean().optional(),
});

const variantUpdateSchema = z.object({
  id: z.string().nullable().optional(),
  colorId: z.string().min(1, 'Color ID reference is required'), // Accepts ObjectId or tempId
  sizeId: objectIdSchema,
  size: z.string().min(1, 'Size is required'),
  sku: z.string().nullable().optional(),
  barcode: z.string().nullable().optional(),
  stockQuantity: z.number().int().min(0, 'Stock quantity cannot be negative'),
  reservedQuantity: z.number().int().min(0).default(0),
  availableQuantity: z.number().int().min(0),
  reorderLevel: z.number().int().min(0).default(5),
  active: z.boolean().default(true),
  priceOverride: z.number().min(0).nullable().optional(),
});

const additionalSectionUpdateSchema = z.object({
  title: z.string().min(1, 'Section title is required'),
  content: z.string().min(1, 'Section content is required'),
});

const descriptionUpdateSchema = z.object({
  narrative: z.string().nullable().optional(),
  styleCode: z.string().nullable().optional(),
  fitType: z.string().nullable().optional(),
  fabricComposition: z.string().nullable().optional(),
  careInstructions: z.array(z.string()).optional(),
  releaseDate: z.union([z.string(), z.date()]).nullable().optional(),
  editorialHighlights: z.array(z.string()).optional(),
  additionalSections: z.array(additionalSectionUpdateSchema).optional(),
});

const seoUpdateSchema = z.object({
  title: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  keywords: z.array(z.string()).optional(),
});

// ==========================================
// Update Product Root Schema
// ==========================================

export const updateProductSchema = z.object({
  product_name: z.string().min(1, 'Product name cannot be empty').optional(),
  product_slug: z.string().min(1, 'Slug cannot be empty').optional(),
  product_brand: objectIdSchema.nullable().optional(),
  product_category: objectIdSchema.nullable().optional(),
  product_collections: z.array(objectIdSchema).optional(),
  product_productType: z.nativeEnum(ProductType).optional(),
  product_gender: z.nativeEnum(Gender).optional(),
  product_colors: z.array(colorUpdateSchema).optional(),
  product_description: descriptionUpdateSchema.nullable().optional(),
  product_features: z.array(z.string()).optional(),
  product_media: z.array(mediaUpdateSchema).optional(),
  product_variants: z.array(variantUpdateSchema).optional(),
  product_pricing: pricingUpdateSchema.nullable().optional(),
  product_seo: seoUpdateSchema.nullable().optional(),
  product_tags: z.array(z.string()).optional(),
  product_active: z.boolean().optional(),
  product_publishedAt: z.union([z.string(), z.date()]).nullable().optional(),
});

export type UpdateProductInput = z.input<typeof updateProductSchema>;
export type UpdateProductOutput = z.output<typeof updateProductSchema>;
