import { z } from 'zod';

const object_id_schema = z
  .string()
  .trim()
  .regex(/^[a-f\d]{24}$/i, 'Invalid object id');

const optional_trimmed_string = z.preprocess(
  (val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
  z.string().trim().min(1, 'Cannot be empty if provided').optional()
);

// Helper: Transforms "" into null, or validates min(1) if provided
const nullable_trimmed_string = z.preprocess(
  (val) => (typeof val === 'string' && val.trim() === '' ? null : val),
  z.string().trim().min(1, 'Value must contain at least 1 character.').nullable().optional()
);

// Helper: Transforms "" into undefined, or validates URL if provided
const optional_url_string = z.preprocess(
  (val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
  z.string().trim().url('Must be a valid URL').nullable().optional()
);

export const updateBrandSchema = z.object({
  brand_name: z.string().trim().min(1, 'Brand name is required').max(200).optional(),
  brand_slug: optional_trimmed_string,
  brand_logo: optional_url_string,
  brand_description: nullable_trimmed_string,
  brand_website: optional_url_string,
  brand_active: z.boolean().optional(),
});

export type UpdateBrandInput = z.input<typeof updateBrandSchema>;

export const updateCategorySchema = z.object({
  category_name: z.string().trim().min(1, 'Category name is required').max(100).optional(),
  category_slug: optional_trimmed_string,
  category_parent: object_id_schema.nullable().optional(),
  category_image: optional_url_string,
  category_description: nullable_trimmed_string,
  category_active: z.boolean().optional(),
});

export type UpdateCategoryInput = z.input<typeof updateCategorySchema>;

export const updateCollectionSchema = z.object({
  collection_name: z.string().trim().min(1, 'Collection name is required').max(100).optional(),
  collection_slug: optional_trimmed_string,
  collection_description: nullable_trimmed_string,
  collection_image: optional_url_string,
  collection_active: z.boolean().optional(),
});

export type UpdateCollectionInput = z.input<typeof updateCollectionSchema>;

export const updateSizeSchema = z.object({
  size_name: z.string().trim().min(1, 'Size name is required').max(30).optional(), // e.g., "US 9", "Medium", "XL"
});

export type UpdateSizeInput = z.input<typeof updateSizeSchema>;
