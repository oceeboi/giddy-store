import { z } from 'zod';

// 1. Address Schema
export const addressSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50).trim(),
  lastName: z.string().min(1, 'Last name is required').max(50).trim(),
  company: z.string().max(100).trim().optional(),
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  phone: z.string().min(7, 'Invalid phone number').max(20).trim(),
  streetAddress: z.string().min(1, 'Street address is required').max(150).trim(),
  apartment: z.string().max(50).trim().optional(),
  city: z.string().min(1, 'City is required').max(50).trim(),
  state: z.string().min(1, 'State/Province is required').max(50).trim(),
  postalCode: z.string().min(2, 'Postal code is required').max(20).trim(),
  country: z
    .string()
    .length(3, 'Country must be a 2-letter ISO code (e.g. SA)')
    .toUpperCase()
    .default('SA'),
});

// 2. Cart Item Schema
export const checkoutItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  variantId: z.string().min(1, 'Variant ID is required'),
  sku: z.string().min(1, 'SKU is required'),
  title: z.string().min(1, 'Item title is required'),
  size: z.string().optional(),
  color: z.string().optional(),
  unitPrice: z.number().positive('Price must be greater than zero'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  image: z.string().url('Invalid image URL'),
});

// 3. Customer Info Schema
export const customerInfoSchema = z.object({
  userId: z.string().optional(),
  guestEmail: z.string().email('Invalid guest email').trim().toLowerCase().optional(),
  isVIP: z.boolean().default(false),
});

// 4. Shipping Method Schema
export const shippingMethodSchema = z.object({
  id: z.string().min(1, 'Shipping method ID is required'),
  name: z.string().min(1, 'Shipping method name is required'),
  carrier: z.string().optional(),
  cost: z.number().min(0, 'Shipping cost cannot be negative'),
  estimatedDays: z.string().optional(),
});

// 5. Luxury Gift Options Schema
export const giftOptionsSchema = z.object({
  isGift: z.boolean().default(false),
  giftMessage: z.string().max(500, 'Gift message cannot exceed 500 characters').trim().optional(),
  complimentaryWrapping: z.boolean().default(false),
  hidePricingOnReceipt: z.boolean().default(true),
});

// ---------------------------------------------------------------------------
// Main Checkout Draft POST Payload Schema
// ---------------------------------------------------------------------------
export const createCheckoutDraftSchema = z
  .object({
    checkoutToken: z.string().optional(), // Provided if updating an existing draft session
    customer: customerInfoSchema.optional(),
    cartItems: z.array(checkoutItemSchema).min(1, 'Cart must contain at least one item'),
    shippingAddress: addressSchema.optional(),
    billingAddress: addressSchema.optional(),
    shippingMethod: shippingMethodSchema.optional(),
    giftOptions: giftOptionsSchema.optional(),
    clientNotes: z.string().max(1000, 'Notes cannot exceed 1000 characters').trim().optional(),
    isAdvisorGenerated: z.boolean().default(false), // Flag for VIP concierge orders
  })
  .refine((data) => Boolean(data.customer?.userId || data.customer?.guestEmail), {
    message: 'Either userId or guestEmail must be provided for customer identification',
    path: ['customer'],
  });

export type CreateCheckoutDraftInput = z.infer<typeof createCheckoutDraftSchema>;
