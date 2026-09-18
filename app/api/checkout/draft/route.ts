import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { nanoid } from 'nanoid';

import connectToDatabase from '@/lib/db';
import { CheckoutDraft } from '@/models/CheckoutDraft';
import { createCheckoutDraftSchema } from '@/schemas/checkout.schema';
import Product from '@/models/Product';

// ---------------------------------------------------------------------------
// Upstash Rate Limiter Configuration
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
      cartItems: raw_cart_items,
      shippingAddress,
      billingAddress,
      giftOptions,
      clientNotes,
      shippingMethod,
      isAdvisorGenerated = false,
    } = body;

    // 2. Parallel Execution (Rate Limiting & DB Connection)
    const clientIdentifier = customer?.userId || customer?.guestEmail || getClientIp(request);
    const rateLimitKey = `draft:${clientIdentifier}`;

    const [rateLimitResult] = await Promise.all([
      checkoutDraftLimiter.limit(rateLimitKey),
      connectToDatabase(),
    ]);

    // if (!rateLimitResult.success) {
    //   const resetInSeconds = Math.ceil((rateLimitResult.reset - Date.now()) / 1000);
    //   return NextResponse.json(
    //     {
    //       error:
    //         'Too many checkout creation attempts. Please wait a few minutes before trying again.',
    //     },
    //     {
    //       status: 429,
    //       headers: {
    //         'X-RateLimit-Limit': String(rateLimitResult.limit),
    //         'X-RateLimit-Remaining': String(rateLimitResult.remaining),
    //         'X-RateLimit-Reset': String(rateLimitResult.reset),
    //         'Retry-After': String(resetInSeconds > 0 ? resetInSeconds : 1),
    //       },
    //     }
    //   );
    // }

    // 3. Deduplicate items with identical (productId + variantId)
    const sanitized_cart_map = new Map<string, (typeof raw_cart_items)[0]>();
    for (const item of raw_cart_items) {
      const composite_key = `${item.productId}_${item.variantId}_${item.size}_${item.color}`;
      const existing = sanitized_cart_map.get(composite_key);

      if (existing) {
        sanitized_cart_map.set(composite_key, {
          ...existing,
          quantity: existing.quantity + item.quantity,
          size: item.size,
        });
      } else {
        sanitized_cart_map.set(composite_key, { ...item });
      }
    }
    const sanitized_cart_items = Array.from(sanitized_cart_map.values());

    // 4. Fetch Products and Validate Stock & Pricing
    const unique_product_ids = Array.from(
      new Set(sanitized_cart_items.map((item) => item.productId))
    );
    const db_products = await Product.find({
      _id: { $in: unique_product_ids },
      active: true,
    }).lean();

    const isEligibleForHold = Boolean(customer?.userId || isAdvisorGenerated);
    const holdDurationMinutes = isAdvisorGenerated ? 120 : 15;
    const nowMs = Date.now();
    const reservedUntil = new Date(nowMs + holdDurationMinutes * 60 * 1000);

    let subtotal = 0;
    const formatted_cart_items = [];
    const validation_errors = [];

    for (const item of sanitized_cart_items) {
      const db_product = db_products.find((p) => p._id.toString() === item.productId);

      if (!db_product) {
        validation_errors.push({
          productId: item.productId,
          variantId: item.variantId,
          reason: 'PRODUCT_NOT_FOUND_OR_INACTIVE',
        });
        continue;
      }

      const variant_option = db_product.variants.find(
        (v) => v._id?.toString() === item.variantId && v.active
      );

      if (!variant_option) {
        validation_errors.push({
          productId: item.productId,
          variantId: item.variantId,
          reason: 'VARIANT_UNAVAILABLE',
        });
        continue;
      }

      const available_stock = variant_option.stockQuantity - (variant_option.reservedQuantity || 0);
      if (available_stock < item.quantity) {
        validation_errors.push({
          productId: item.productId,
          variantId: item.variantId,
          requested: item.quantity,
          available: Math.max(0, available_stock),
          reason: 'INSUFFICIENT_STOCK',
        });
        continue;
      }

      // Server-authoritative price in base currency units (Kobo/Cents)
      const unit_price = variant_option.priceOverride ?? db_product.pricing.basePrice;
      subtotal += unit_price * item.quantity;

      // Extract resolved color name from Product colors schema
      const color_option = db_product.colors?.find(
        (c) => c._id?.toString() === variant_option.colorId
      );

      // Media resolution logic: matched by colorId, fallback to order 0, then index 0
      const primary_image =
        db_product.media?.find((m) => m.colorId === variant_option.colorId)?.url ||
        db_product.media?.find((m) => m.order === 0)?.url ||
        db_product.media?.[0]?.url ||
        item.image;

      formatted_cart_items.push({
        productId: item.productId,
        variantId: item.variantId,
        sku: variant_option.sku || item.sku || 'N/A',
        title: db_product.name || item.title,
        size: item.size,
        color: color_option?.name || item.color,
        price: unit_price,
        quantity: item.quantity,
        image: primary_image,
        isReserved: isEligibleForHold,
      });
    }

    if (validation_errors.length > 0) {
      return NextResponse.json(
        {
          error: 'Cart validation failed due to stock or availability issues.',
          details: validation_errors,
        },
        { status: 422 }
      );
    }

    // 5. Calculate Final Integer Pricing (Lowest Currency Units)
    const shippingCost = shippingMethod?.cost ?? 0;
    const taxAmount = Math.round(subtotal * 0.08); // Fixed math for integer amounts
    const totalAmount = subtotal + shippingCost + taxAmount;
    const currency = db_products[0]?.pricing?.currency || 'NGN';

    const pricing_summary = {
      subtotal,
      shippingCost,
      taxAmount,
      totalAmount,
      currency,
    };

    const expiresAt = new Date(nowMs + 14 * 24 * 60 * 60 * 1000);

    const draft_data = {
      userId: customer?.userId,
      guestEmail: customer?.guestEmail,
      cartItems: formatted_cart_items,
      pricingSummary: pricing_summary,
      reservedUntil, // Strictly matches ICheckoutDraft top-level schema
      status: 'DRAFT' as const,
      ...(shippingAddress && { shippingAddress }),
      ...(billingAddress && { billingAddress }),
      ...(shippingMethod && { shippingMethod }),
      ...(giftOptions && { giftOptions }),
      ...(clientNotes && { clientNotes }),
      expiresAt,
    };

    // 6. Database Operations
    let draft;

    if (checkoutToken) {
      draft = await CheckoutDraft.findOneAndUpdate(
        { checkoutToken },
        { $set: draft_data },
        { runValidators: true, lean: true, returnDocument: 'after' }
      );

      if (!draft) {
        return NextResponse.json(
          { error: 'Checkout session not found or expired.' },
          { status: 404 }
        );
      }
    } else {
      const newToken = `chk_${nanoid(12)}`;
      draft = await CheckoutDraft.create({
        checkoutToken: newToken,
        ...draft_data,
      });
      draft = draft.toObject();
    }

    return NextResponse.json(
      {
        success: true,
        checkoutToken: draft.checkoutToken,
        shareableUrl: `/checkout/${draft.checkoutToken}`,
        draft,
        warnings: validation_errors.length > 0 ? validation_errors : undefined,
      },
      { status: checkoutToken ? 200 : 201 }
    );
  } catch (error: unknown) {
    console.error('Error creating checkout draft:', error);
    return NextResponse.json({ error: 'Failed to initialize checkout session.' }, { status: 500 });
  }
}
