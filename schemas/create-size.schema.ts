import { z } from 'zod';

export const createSizeSchema = z.object({
  name: z.string().trim().min(1, 'Size name is required').max(30), // e.g., "US 9", "Medium", "XL"
  category: z.enum(['sneaker', 'apparel', 'accessory', 'equipment']).optional(), // Optional grouping
  sortOrder: z.number().int().min(0).optional(), // Useful for sorting sizes sequentially (S, M, L, XL)
});

export type CreateSizeInput = z.input<typeof createSizeSchema>;
