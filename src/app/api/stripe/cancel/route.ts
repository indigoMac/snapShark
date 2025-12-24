import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
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

    // Cancel the subscription
    let subscription: Stripe.Subscription;
    if (cancelAtPeriodEnd) {
      // Cancel at the end of the billing period (recommended)
      subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    } else {
      // Cancel immediately
      subscription = await stripe.subscriptions.cancel(subscriptionId);
    }

    // Update Clerk metadata immediately so the UI reflects the cancel choice
    try {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);

      const isActive = subscription.status === 'active';
      const willCancel = subscription.cancel_at_period_end;
      const cancelAt = subscription.cancel_at
        ? new Date(subscription.cancel_at * 1000).toISOString()
        : null;

      const currentPeriodStart = (subscription as any).current_period_start
        ? new Date((subscription as any).current_period_start * 1000).toISOString()
        : null;
      const currentPeriodEnd = (subscription as any).current_period_end
        ? new Date((subscription as any).current_period_end * 1000).toISOString()
        : null;

      await client.users.updateUserMetadata(userId, {
        privateMetadata: {
          ...(user.privateMetadata || {}),
          stripeSubscriptionId: subscription.id,
          subscriptionStatus: subscription.status,
          isProUser: isActive,
          cancelAtPeriodEnd: willCancel,
          cancelAt,
          currentPeriodStart,
          currentPeriodEnd,
          subscriptionUpdated: new Date().toISOString(),
        },
        publicMetadata: {
          ...(user.publicMetadata || {}),
          subscriptionStatus: subscription.status,
          isProUser: isActive,
          plan: isActive ? 'pro' : 'free',
          cancelAtPeriodEnd: willCancel,
          cancelAt,
          currentPeriodEnd,
        },
      });
    } catch (clerkError: any) {
      console.error('[CANCEL] Failed to update Clerk metadata:', clerkError);
      // Continue; Stripe cancellation already succeeded
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
