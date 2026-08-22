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

export const createBrandSchema = z.object({
  brand_name: z.string().trim().min(1, 'Brand name is required').max(200),
  brand_slug: optional_trimmed_string,
  brand_logo: optional_url_string,
  brand_description: nullable_trimmed_string,
  brand_website: optional_url_string,
  brand_active: z.boolean().optional(),
});
