import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { stripe, STRIPE_CONFIG } from '@/lib/stripe';
import { RATE_LIMITS, createRateLimitHeaders } from '@/lib/rate-limit';
import { trackPaymentError, trackAPIError } from '@/lib/error-tracking';

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await RATE_LIMITS.PAYMENT(req);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil(
            (rateLimitResult.resetTime - Date.now()) / 1000
          ),
        },
        {
          status: 429,
          headers: createRateLimitHeaders(rateLimitResult),
        }
      );
    }

    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      );
    }

    const { priceId, isYearly = false } = await req.json();

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      );
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: STRIPE_CONFIG.SUCCESS_URL,
      cancel_url: STRIPE_CONFIG.CANCEL_URL,
      client_reference_id: userId,
      metadata: {
        userId,
        isYearly: isYearly.toString(),
      },
      subscription_data: {
        metadata: {
          userId,
          isYearly: isYearly.toString(),
        },
      },
      customer_email: undefined, // Let Stripe collect email
      allow_promotion_codes: true,
    });

    return NextResponse.json(
      {
        sessionId: session.id,
        url: session.url,
      },
      {
        headers: createRateLimitHeaders(rateLimitResult),
      }
    );
  } catch (error) {
    console.error('Stripe checkout error:', error);

    // Track payment error for monitoring
    trackPaymentError(
      error as Error,
      undefined, // userId not available in error case
      undefined, // no session ID yet
      {
        endpoint: '/api/stripe/checkout',
        userAgent: req.headers.get('user-agent'),
      }
    );

    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
