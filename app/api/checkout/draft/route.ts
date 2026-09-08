import { NextRequest, NextResponse } from 'next/server';

import connectToDatabase from '@/lib/db';
import { CheckoutDraft } from '@/models/CheckoutDraft';
import { createCheckoutDraftSchema } from '@/schemas/checkout.schema';
import { RateLimiter, withLoginIdentifier, applyRateLimit } from '@/packages/rate-limiter';

// ---------------------------------------------------------------------------
// Rate Limiter Configuration
// ---------------------------------------------------------------------------
// Stricter limit for checkout draft generation: 5 drafts per 15 minutes per IP/Identifier
const checkoutDraftLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  keyPrefix: 'rl:checkout_draft',
  getKey: (request, clientId) => {
    const url = new URL(request.url);
    const identifier = url.searchParams.get('__identifier') ?? 'guest';
    return `draft:${clientId}:${identifier}`;
  },
  lockout: {
    maxFailures: 10,
    failWindowMs: 15 * 60 * 1000,
    baseLockoutMs: 30 * 60 * 1000, // 30 minutes initial lockout
    lockoutCapMs: 24 * 60 * 60 * 1000, // Max 24 hours
  },
});

interface CartItemPricing {
  unitPrice: number;
  quantity: number;
}

// Server-calculated pricing summary
function calculatePricingSummary(
  items: CartItemPricing[],
  shippingCost: number = 0,
  taxRate: number = 0.08,
  currency: string = 'USD'
) {
  const subtotal = items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
  const totalAmount = subtotal + shippingCost + taxAmount;

  return {
    subtotal,
    discountTotal: 0,
    shippingCost,
    taxAmount,
    totalAmount,
    currency,
  };
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();

    // 1. Zod Validation
    const validationResult = createCheckoutDraftSchema.safeParse(rawBody);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid checkout payload',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const body = validationResult.data;
    const {
      checkoutToken,
      customer,
      cartItems,
      shippingAddress,
      billingAddress,
      giftOptions,
      clientNotes,
      shippingMethod,
      isAdvisorGenerated = false,
    } = body;

    // 2. Upstash Redis Rate Limiting (Keyed by IP + Identifier)
    const clientIdentifier = customer.userId || customer.guestEmail || 'anonymous_guest';
    const keyedRequest = withLoginIdentifier(request, clientIdentifier);

    const rateLimitResponse = await applyRateLimit(
      keyedRequest,
      checkoutDraftLimiter,
      'Too many checkout creation attempts. Please wait a few minutes before trying again.'
    );

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    await connectToDatabase();

    // 3. Compute Server-Side Pricing
    const shippingCost = shippingMethod?.cost ?? 0;
    const pricing = calculatePricingSummary(cartItems, shippingCost);

    // 4. Determine Inventory Reservation Rule
    // Reserve stock only for Authenticated users or Sales Advisor concierge links
    const isEligibleForHold = Boolean(customer.userId || isAdvisorGenerated);
    const holdDurationMinutes = isAdvisorGenerated ? 120 : 15; // 2 hrs for advisor, 15 mins for users
    const reservedUntil = isEligibleForHold
      ? new Date(Date.now() + holdDurationMinutes * 60 * 1000)
      : undefined;

    const reservation = {
      isReserved: isEligibleForHold,
      holdDurationMinutes: isEligibleForHold ? holdDurationMinutes : 0,
      ...(reservedUntil && { reservedUntil }),
    };

    const formattedCartItems = cartItems.map((item) => ({
      ...item,
      isReserved: isEligibleForHold,
    }));

    // 5. UPDATE EXISTING DRAFT (if checkoutToken supplied)
    if (checkoutToken) {
      const updatedDraft = await CheckoutDraft.findOneAndUpdate(
        { checkoutToken },
        {
          $set: {
            customer,
            cartItems: formattedCartItems,
            pricing,
            reservation,
            ...(shippingAddress && { shippingAddress }),
            ...(billingAddress && { billingAddress }),
            ...(shippingMethod && { shippingMethod }),
            ...(giftOptions && { giftOptions }),
            ...(clientNotes && { clientNotes }),
            expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Reset TTL
          },
        },
        { new: true, runValidators: true }
      );

      if (!updatedDraft) {
        await checkoutDraftLimiter.recordFailure(keyedRequest);
        return NextResponse.json(
          { error: 'Checkout session not found or expired.' },
          { status: 404 }
        );
      }

      await checkoutDraftLimiter.recordSuccess(keyedRequest);

      return NextResponse.json(
        {
          success: true,
          checkoutToken: updatedDraft.checkoutToken,
          shareableUrl: `/checkout/${updatedDraft.checkoutToken}`,
          draft: updatedDraft,
        },
        { status: 200 }
      );
    }

    // 6. CREATE NEW DRAFT
    const newDraft = await CheckoutDraft.create({
      userId: customer.userId,
      guestEmail: customer.guestEmail,
      cartItems: formattedCartItems,
      shippingAddress,
      billingAddress,
      shippingMethod,
      giftOptions,
      clientNotes,
      status: 'DRAFT',
    });

    await checkoutDraftLimiter.recordSuccess(keyedRequest);

    return NextResponse.json(
      {
        success: true,
        checkoutToken: newDraft.checkoutToken,
        shareableUrl: `/checkout/${newDraft.checkoutToken}`,
        draft: newDraft,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Error creating checkout draft:', error);
    return NextResponse.json({ error: 'Failed to initialize checkout session.' }, { status: 500 });
  }
}
