import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

import connectToDatabase from '@/lib/db';
import { CheckoutDraft } from '@/models/CheckoutDraft';
import { createCheckoutDraftSchema } from '@/schemas/checkout.schema';

// ---------------------------------------------------------------------------
// Upstash Rate Limiter Configuration (Single Lua Round-Trip)
// ---------------------------------------------------------------------------
const checkoutDraftLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '15 m'),
  prefix: 'rl:checkout_draft',
  analytics: true,
});

function getClientIp(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return request.headers.get('cf-connecting-ip') ?? request.headers.get('x-real-ip') ?? '127.0.0.1';
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();

    // 1. Fast Schema Validation
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

    // 2. Parallel Execution (Atomic Lua Rate-Limit + MongoDB Warmup)
    const clientIdentifier = customer?.userId || customer?.guestEmail || getClientIp(request);
    const rateLimitKey = `draft:${clientIdentifier}`;

    const [rateLimitResult] = await Promise.all([
      checkoutDraftLimiter.limit(rateLimitKey),
      connectToDatabase(),
    ]);

    if (!rateLimitResult.success) {
      const resetInSeconds = Math.ceil((rateLimitResult.reset - Date.now()) / 1000);
      return NextResponse.json(
        {
          error:
            'Too many checkout creation attempts. Please wait a few minutes before trying again.',
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(rateLimitResult.limit),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'X-RateLimit-Reset': String(rateLimitResult.reset),
            'Retry-After': String(resetInSeconds > 0 ? resetInSeconds : 1),
          },
        }
      );
    }

    // 3. Single-Pass Computation for Pricing & Cart Formatting
    const isEligibleForHold = Boolean(customer?.userId || isAdvisorGenerated);
    const holdDurationMinutes = isAdvisorGenerated ? 120 : 15;
    const nowMs = Date.now();
    const reservedUntil = isEligibleForHold
      ? new Date(nowMs + holdDurationMinutes * 60 * 1000)
      : undefined;

    const shippingCost = shippingMethod?.cost ?? 0;
    let subtotal = 0;

    const formattedCartItems = new Array(cartItems.length);

    for (let i = 0; i < cartItems.length; i++) {
      const item = cartItems[i];
      subtotal += item.unitPrice * item.quantity;

      formattedCartItems[i] = {
        productId: item.productId,
        variantId: item.variantId,
        sku: item.sku,
        title: item.title,
        size: item.size,
        color: item.color,
        price: item.unitPrice,
        quantity: item.quantity,
        image: item.image,
        isReserved: isEligibleForHold,
      };
    }

    const taxAmount = Math.round(subtotal * 0.08 * 100) / 100;
    const pricing = {
      subtotal,
      discountTotal: 0,
      shippingCost,
      taxAmount,
      totalAmount: subtotal + shippingCost + taxAmount,
      currency: 'USD',
    };

    const reservation = {
      isReserved: isEligibleForHold,
      holdDurationMinutes: isEligibleForHold ? holdDurationMinutes : 0,
      ...(reservedUntil && { reservedUntil }),
    };

    // 4. Update Existing Draft or Create New Draft
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
            expiresAt: new Date(nowMs + 14 * 24 * 60 * 60 * 1000),
          },
        },
        { new: true, runValidators: true, lean: true }
      );

      if (!updatedDraft) {
        return NextResponse.json(
          { error: 'Checkout session not found or expired.' },
          { status: 404 }
        );
      }

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

    // 5. Create Full New Draft Document
    const newDraftData = {
      ...(checkoutToken && { checkoutToken }),
      userId: customer?.userId,
      guestEmail: customer?.guestEmail,
      cartItems: formattedCartItems,
      pricing,
      reservation,
      ...(shippingAddress && { shippingAddress }),
      ...(billingAddress && { billingAddress }),
      ...(shippingMethod && { shippingMethod }),
      ...(giftOptions && { giftOptions }),
      ...(clientNotes && { clientNotes }),
      expiresAt: new Date(nowMs + 14 * 24 * 60 * 60 * 1000),
    };

    const newDraftDocument = await CheckoutDraft.create(newDraftData);

    const newDraft = newDraftDocument.toObject();

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
