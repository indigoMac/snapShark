import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { requireDbUser } from '@/lib/auth';
import { stripe } from '@/lib/stripe';
import { periodEndFromStripe, syncSubscriptionToDb, getBillingIds } from '@/lib/subscription';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  try {
    const { clerkUserId } = await requireDbUser();

    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      );
    }

    const body = (await req.json().catch(() => ({}))) as {
      cancelAtPeriodEnd?: boolean;
    };
    const cancelAtPeriodEnd = body.cancelAtPeriodEnd !== false;

    const billing = await getBillingIds(clerkUserId);
    if (!billing?.stripeSubscriptionId) {
      return NextResponse.json(
        { error: 'No subscription found to cancel' },
        { status: 404 }
      );
    }

    const subscriptionId = billing.stripeSubscriptionId;

    let subscription: Stripe.Subscription;
    if (cancelAtPeriodEnd) {
      subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    } else {
      subscription = await stripe.subscriptions.cancel(subscriptionId);
    }

    await syncSubscriptionToDb({
      clerkUserId,
      stripeCustomerId: subscription.customer as string,
      stripeSubscriptionId: subscription.id,
      status: subscription.status,
      currentPeriodEnd: periodEndFromStripe(
        (subscription as any).current_period_end
      ),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });

    try {
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(clerkUserId);

      const isActive = subscription.status === 'active';
      const willCancel = subscription.cancel_at_period_end;
      const cancelAt = subscription.cancel_at
        ? new Date(subscription.cancel_at * 1000).toISOString()
        : null;

      const currentPeriodStart = (subscription as any).current_period_start
        ? new Date(
            (subscription as any).current_period_start * 1000
          ).toISOString()
        : null;
      const currentPeriodEnd = (subscription as any).current_period_end
        ? new Date((subscription as any).current_period_end * 1000).toISOString()
        : null;

      await client.users.updateUserMetadata(clerkUserId, {
        privateMetadata: {
          ...(clerkUser.privateMetadata || {}),
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
          ...(clerkUser.publicMetadata || {}),
          subscriptionStatus: subscription.status,
          isProUser: isActive,
          plan: isActive ? 'pro' : 'free',
          cancelAtPeriodEnd: willCancel,
          cancelAt,
          currentPeriodEnd,
          stripeCustomerId: null,
          stripeSubscriptionId: null,
        },
      });
    } catch (clerkError: unknown) {
      console.error('[CANCEL] Failed to update Clerk metadata:', clerkError);
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
    if (error?.status === 401) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.error('[CANCEL] Subscription cancellation error:', error);

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
