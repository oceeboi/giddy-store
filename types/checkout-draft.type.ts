export interface CartItemDraft {
  productId: string;
  variantId: string;
  sku: string;
  title: string;
  size: string;
  color: string;
  price: number;
  quantity: number;
  image: string;
  isReserved: boolean;
  lineTotal: number; // Computed during sterilization
}

export interface PricingSummary {
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
}

export interface GiftOptions {
  isGift: boolean;
  complimentaryGiftWrapping: boolean;
  message?: string;
}

export interface ShippingMethod {
  id?: string;
  name?: string;
  cost: number;
}

export interface CustomerDraft {
  userId?: string;
  guestEmail?: string;
  isVIP?: boolean;
}

export interface SterilizedCheckoutDraft {
  checkoutToken: string;
  status: 'DRAFT' | 'COMPLETED' | 'EXPIRED' | 'ABANDONED';
  customer: CustomerDraft;
  cartItems: CartItemDraft[];
  giftOptions: GiftOptions;
  shippingMethod: ShippingMethod;
  pricingSummary: PricingSummary;
  expiresAt: string;
  reservedUntil?: string;
  isExpired: boolean;
}

export interface CheckoutDraftType extends SterilizedCheckoutDraft {}
