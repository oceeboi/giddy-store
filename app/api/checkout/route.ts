import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

import connectToDatabase from '@/lib/db';
import { CheckoutDraft } from '@/models/CheckoutDraft';
import { sterilizeCheckoutDraft } from '@/utils/sterilize-checkout-draft';

// ---------------------------------------------------------------------------
// Rate Limiter Setup (30 requests per minute)
// ---------------------------------------------------------------------------
const getDraftLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(30, '1 m'),
  prefix: 'rl:get_checkout_draft',
  analytics: true,
});

function getClientIp(request: NextRequest): string {
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

    // 1. Concurrent Execution: Upstash Rate Limit + MongoDB Warmup
    const clientIp = getClientIp(request);

    const [rateLimitResult] = await Promise.all([
      getDraftLimiter.limit(`get_draft:${clientIp}`),
      connectToDatabase(),
    ]);

    if (!rateLimitResult.success) {
      const resetInSeconds = Math.ceil((rateLimitResult.reset - Date.now()) / 1000);
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
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

    // 2. Query MongoDB using lean() for zero hydration overhead
    const rawDraft = await CheckoutDraft.findOne({ checkoutToken: token })
      .select('-__v -createdAt -updatedAt')
      .lean();

    if (!rawDraft) {
      return NextResponse.json(
        { error: 'Checkout session not found or has expired.' },
        { status: 404 }
      );
    }

    // 3. Sterilize raw MongoDB object
    const draft = sterilizeCheckoutDraft(rawDraft);

    // 4. Return expired status if TTL has passed
    if (draft.isExpired) {
      return NextResponse.json({ error: 'Checkout session has expired.', draft }, { status: 410 });
    }

    return NextResponse.json(
      {
        success: true,
        draft,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error fetching checkout draft:', error);
    return NextResponse.json({ error: 'Failed to retrieve checkout session.' }, { status: 500 });
  }
}
