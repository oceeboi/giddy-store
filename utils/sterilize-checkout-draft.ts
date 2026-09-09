import {
  SterilizedCheckoutDraft,
  CartItemDraft,
  PricingSummary,
} from '@/types/checkout-draft.type';

export function sterilizeCheckoutDraft(rawDraft: Record<string, any>): SterilizedCheckoutDraft {
  const rawItems: any[] = Array.isArray(rawDraft?.cartItems) ? rawDraft.cartItems : [];

  // 1. Sterilize Cart Items & Compute Line Totals
  let computedSubtotal = 0;

  const cartItems: CartItemDraft[] = rawItems.map((item) => {
    const price = Number(item.price) || 0;
    const quantity = Math.max(1, Number(item.quantity) || 1);
    const lineTotal = price * quantity;

    computedSubtotal += lineTotal;

    return {
      productId: String(item.productId || ''),
      variantId: String(item.variantId || ''),
      sku: String(item.sku || ''),
      title: String(item.title || 'Untitled Item'),
      size: String(item.size || ''),
      color: String(item.color || ''),
      price,
      quantity,
      image: String(item.image || ''),
      isReserved: Boolean(item.isReserved),
      lineTotal,
    };
  });

  // 2. Resolve Shipping & Pricing
  const shippingCost = Number(rawDraft?.shippingMethod?.cost) || 0;
  const storedSubtotal = Number(rawDraft?.pricingSummary?.subtotal) || 0;

  // Use calculated subtotal if stored pricingSummary is zeroed out
  const finalSubtotal = storedSubtotal > 0 ? storedSubtotal : computedSubtotal;
  const taxRate = 0.08; // 8% Default Tax Rate
  const taxAmount = Math.round(finalSubtotal * taxRate * 100) / 100;
  const totalAmount = finalSubtotal + shippingCost + taxAmount;

  const pricingSummary: PricingSummary = {
    subtotal: finalSubtotal,
    shippingCost,
    taxAmount,
    totalAmount,
    currency: rawDraft?.pricingSummary?.currency || 'USD',
  };

  // 3. Expiry Status Check
  const expiresAtISO = rawDraft?.expiresAt || new Date().toISOString();
  const isExpired = new Date(expiresAtISO).getTime() < Date.now();

  // 4. Return Clean Sterilized Object
  return {
    checkoutToken: String(rawDraft?.checkoutToken || ''),
    status: rawDraft?.status || 'DRAFT',
    customer: {
      userId: rawDraft?.userId || rawDraft?.customer?.userId || undefined,
      guestEmail: rawDraft?.guestEmail || rawDraft?.customer?.guestEmail || undefined,
      isVIP: Boolean(rawDraft?.customer?.isVIP),
    },
    cartItems,
    giftOptions: {
      isGift: Boolean(rawDraft?.giftOptions?.isGift),
      complimentaryGiftWrapping: Boolean(rawDraft?.giftOptions?.complimentaryGiftWrapping),
      message: rawDraft?.giftOptions?.giftMessage || undefined,
    },
    shippingMethod: {
      id: rawDraft?.shippingMethod?.id,
      name: rawDraft?.shippingMethod?.name,
      cost: shippingCost,
    },
    pricingSummary,
    expiresAt: expiresAtISO,
    reservedUntil: rawDraft?.reservedUntil || undefined,
    isExpired,
  };
}
