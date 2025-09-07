import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { stripe } from '@/lib/stripe';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  try {
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

    const { subscriptionId, cancelAtPeriodEnd = true } = await req.json();

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    console.log(
      `[CANCEL] Canceling subscription ${subscriptionId} for user ${userId}`
    );

    // Cancel the subscription
    let subscription: Stripe.Subscription;
    if (cancelAtPeriodEnd) {
      // Cancel at the end of the billing period (recommended)
      subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
      console.log(
        `[CANCEL] ✅ Subscription ${subscriptionId} will cancel at period end`
      );
    } else {
      // Cancel immediately
      subscription = await stripe.subscriptions.cancel(subscriptionId);
      console.log(
        `[CANCEL] ✅ Subscription ${subscriptionId} canceled immediately`
      );
    }

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });
  } catch (error: any) {
    console.error('[CANCEL] Subscription cancellation error:', error);

    // Handle specific Stripe errors
    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { error: 'Invalid subscription or already canceled' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
