export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { Types } from 'mongoose';

import connectToDatabase from '@/lib/db';
import { CheckoutDraft } from '@/models/CheckoutDraft';
import Product from '@/models/Product';
import { sterilizeCheckoutDraft } from '@/utils/sterilize-checkout-draft';

const get_draft_limiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(30, '1 m'),
  prefix: 'rl:get_checkout_draft',
  analytics: true,
});

function get_client_ip(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return request.headers.get('cf-connecting-ip') ?? request.headers.get('x-real-ip') ?? '127.0.0.1';
}

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Checkout token is required.' }, { status: 400 });
    }

    const client_ip = get_client_ip(request);

    // const [rate_limit_result] = await Promise.all([
    //   get_draft_limiter.limit(`get_draft:${client_ip}`),
    //   connectToDatabase(),
    // ]);

    // if (!rate_limit_result.success) {
    //   const reset_in_seconds = Math.ceil((rate_limit_result.reset - Date.now()) / 1000);
    //   return NextResponse.json(
    //     { error: 'Too many requests. Please try again later.' },
    //     {
    //       status: 429,
    //       headers: {
    //         'X-RateLimit-Limit': String(rate_limit_result.limit),
    //         'X-RateLimit-Remaining': String(rate_limit_result.remaining),
    //         'X-RateLimit-Reset': String(rate_limit_result.reset),
    //         'Retry-After': String(reset_in_seconds > 0 ? reset_in_seconds : 1),
    //       },
    //     }
    //   );
    // }

    // 1. Retrieve Raw Document from MongoDB
    const raw_draft = await CheckoutDraft.findOne({ checkoutToken: token })
      .select('-__v -createdAt -updatedAt')
      .lean();

    if (!raw_draft) {
      return NextResponse.json(
        { error: 'Checkout session not found or has expired.' },
        { status: 404 }
      );
    }

    const draft = sterilizeCheckoutDraft(raw_draft);

    if (draft.status === 'EXPIRED' || draft.status === 'COMPLETED') {
      return NextResponse.json(
        { error: `Checkout session is ${draft.status.toLowerCase()}.`, draft },
        { status: 410 }
      );
    }

    // 2. Evaluate Reservation Hold Expiration
    const now_ms = Date.now();
    const reserved_until_ms = draft.reservedUntil ? new Date(draft.reservedUntil).getTime() : 0;

    const is_hold_expired = reserved_until_ms > 0 && reserved_until_ms <= now_ms;
    let draft_was_modified = false;
    const validation_warnings = [];

    if (is_hold_expired) {
      draft_was_modified = true;
      validation_warnings.push({
        reason: 'RESERVATION_EXPIRED',
        message:
          'Your stock reservation hold has expired. Items in your cart are now subject to live stock availability.',
      });
    }

    // 3. Real-Time Product & Stock Validation Loop
    const product_ids = Array.from(
      new Set(
        draft.cartItems
          .map((item: any) => item.productId)
          .filter((id: string) => Types.ObjectId.isValid(id))
      )
    );

    const db_products = await Product.find({
      _id: { $in: product_ids },
      active: true,
    }).lean();

    let recalculated_subtotal = 0;
    const active_cart_items = [];

    for (const item of draft.cartItems) {
      const item_product_id_str = String(item.productId);
      const item_variant_id_str = String(item.variantId);

      const db_product = db_products.find((p) => String(p._id) === item_product_id_str);

      if (!db_product) {
        draft_was_modified = true;
        validation_warnings.push({
          productId: item_product_id_str,
          variantId: item_variant_id_str,
          reason: 'PRODUCT_REMOVED_OR_INACTIVE',
        });
        continue;
      }

      // Match target variant inside product.variants
      const variant_option = db_product.variants?.find(
        (v: any) => String(v._id) === item_variant_id_str && v.active
      );

      if (!variant_option) {
        draft_was_modified = true;
        validation_warnings.push({
          productId: item_product_id_str,
          variantId: item_variant_id_str,
          reason: 'VARIANT_UNAVAILABLE',
        });
        continue;
      }

      // Calculate stock capacities
      const unreserved_stock = Math.max(
        0,
        variant_option.stockQuantity - (variant_option.reservedQuantity || 0)
      );

      const total_available_for_item = is_hold_expired
        ? unreserved_stock
        : unreserved_stock + item.quantity;

      let adjusted_quantity = item.quantity;

      if (is_hold_expired && total_available_for_item < item.quantity) {
        draft_was_modified = true;
        adjusted_quantity = Math.max(0, total_available_for_item);
        validation_warnings.push({
          productId: item_product_id_str,
          variantId: item_variant_id_str,
          requested: item.quantity,
          available: adjusted_quantity,
          reason: total_available_for_item <= 0 ? 'OUT_OF_STOCK' : 'QUANTITY_ADJUSTED_TO_STOCK',
        });
      }

      if (adjusted_quantity <= 0) {
        continue;
      }

      // Resolve price and color metadata
      const current_unit_price = variant_option.priceOverride ?? db_product.pricing.basePrice;
      if (current_unit_price !== item.price) {
        draft_was_modified = true;
        validation_warnings.push({
          productId: item_product_id_str,
          variantId: item_variant_id_str,
          oldPrice: item.price,
          newPrice: current_unit_price,
          reason: 'PRICE_CHANGED',
        });
      }

      recalculated_subtotal += current_unit_price * adjusted_quantity;

      const color_option = db_product.colors?.find(
        (c: any) => String(c._id) === String(variant_option.colorId)
      );

      const primary_image =
        db_product.media?.find((m: any) => m.colorId === variant_option.colorId)?.url ||
        db_product.media?.find((m: any) => m.order === 0)?.url ||
        db_product.media?.[0]?.url ||
        item.image;

      active_cart_items.push({
        ...item,
        productId: item_product_id_str,
        variantId: item_variant_id_str,
        sku: variant_option.sku || item.sku || 'N/A',
        title: db_product.name || item.title,
        size: variant_option.size || item.size,
        color: color_option?.name || item.color,
        price: current_unit_price,
        quantity: adjusted_quantity,
        image: primary_image,
        isReserved: !is_hold_expired,
      });
    }

    // Handle complete stock depletion
    if (active_cart_items.length === 0) {
      await CheckoutDraft.deleteOne({ checkoutToken: token });
      return NextResponse.json(
        {
          error: 'All items in this checkout session are no longer available.',
          warnings: validation_warnings,
        },
        {
          status: 410,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            Pragma: 'no-cache',
            Expires: '0',
          },
        }
      );
    }

    // 4. Recalculate Totals & Update Database
    const shipping_cost = draft.pricingSummary?.shippingCost || 0;
    const tax_amount = Math.round(recalculated_subtotal * 0.08);
    const currency = db_products[0]?.pricing?.currency || 'NGN';

    const updated_pricing_summary = {
      subtotal: recalculated_subtotal,
      shippingCost: shipping_cost,
      taxAmount: tax_amount,
      totalAmount: recalculated_subtotal + shipping_cost + tax_amount,
      currency,
    };

    let final_draft = {
      ...draft,
      cartItems: active_cart_items,
      pricingSummary: updated_pricing_summary,
    };

    if (draft_was_modified) {
      const self_healed_db_doc = await CheckoutDraft.findOneAndUpdate(
        { checkoutToken: token },
        {
          $set: {
            cartItems: active_cart_items,
            pricingSummary: updated_pricing_summary,
          },
        },
        { lean: true, returnDocument: 'after' }
      );

      if (self_healed_db_doc) {
        final_draft = {
          ...final_draft,
          ...sterilizeCheckoutDraft(self_healed_db_doc),
          cartItems: active_cart_items,
          pricingSummary: updated_pricing_summary,
        };
      }
    }

    return NextResponse.json(
      {
        success: true,
        draft: final_draft,
        warnings: validation_warnings.length > 0 ? validation_warnings : undefined,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error: unknown) {
    console.error('Error fetching checkout draft:', error);
    return NextResponse.json({ error: 'Failed to retrieve checkout session.' }, { status: 500 });
  }
}
