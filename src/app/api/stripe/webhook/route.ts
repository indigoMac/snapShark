import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { clerkClient } from '@clerk/nextjs/server';
import Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Configure Next.js App Router for webhooks
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      );
    }

    if (!webhookSecret) {
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Get signature from headers
    const sig = headers().get('stripe-signature') as string;

    if (!sig) {
      return NextResponse.json(
        { error: 'No stripe-signature header' },
        { status: 400 }
      );
    }

    // Try both approaches for Vercel compatibility
    let event: Stripe.Event;
    try {
      // Method 1: Read as text (most common approach)
      const body = await req.text();

      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err: any) {
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${err.message}` },
        { status: 400 }
      );
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;

        if (userId && session.subscription) {
          try {
            // Update user metadata with subscription info
            const client = await clerkClient();

            // First, verify the user exists
            const user = await client.users.getUser(userId);

            await client.users.updateUserMetadata(userId, {
              privateMetadata: {
                ...(user.privateMetadata || {}), // Preserve existing metadata
                stripeCustomerId: session.customer,
                stripeSubscriptionId: session.subscription,
                subscriptionStatus: 'active',
                isProUser: true,
                subscriptionStarted: new Date().toISOString(),
              },
              // Also update public metadata for immediate client sync
              publicMetadata: {
                ...(user.publicMetadata || {}), // Preserve existing metadata
                subscriptionStatus: 'active',
                isProUser: true,
                plan: 'pro',
                stripeCustomerId: session.customer,
                stripeSubscriptionId: session.subscription,
              },
            });
          } catch (clerkError: any) {
            console.error(`[WEBHOOK] Full Clerk error:`, clerkError);
            // Don't throw - let Stripe know we received the webhook but had an issue
          }
        } else {
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        try {
          // Find user by customer ID
          const client = await clerkClient();
          const users = await client.users.getUserList({
            limit: 100, // Increased limit to find users
          });

          const user = users.data.find(
            (u: any) => u.privateMetadata?.stripeCustomerId === customerId
          );

          if (user) {
            const isActive = subscription.status === 'active';
            const willCancel = subscription.cancel_at_period_end;
            const cancelAt = subscription.cancel_at
              ? new Date(subscription.cancel_at * 1000).toISOString()
              : null;

            // Capture subscription period information for grace period messaging
            const subscriptionData = subscription as any; // Type assertion for period properties
            const currentPeriodStart = subscriptionData.current_period_start
              ? new Date(
                  subscriptionData.current_period_start * 1000
                ).toISOString()
              : null;
            const currentPeriodEnd = subscriptionData.current_period_end
              ? new Date(
                  subscriptionData.current_period_end * 1000
                ).toISOString()
              : null;

            // Update metadata in BOTH private and public for immediate sync
            await client.users.updateUserMetadata(user.id, {
              privateMetadata: {
                ...(user.privateMetadata || {}),
                subscriptionStatus: subscription.status,
                isProUser: isActive, // Keep Pro until actually canceled
                cancelAtPeriodEnd: willCancel,
                cancelAt: cancelAt,
                currentPeriodStart: currentPeriodStart,
                currentPeriodEnd: currentPeriodEnd,
                subscriptionUpdated: new Date().toISOString(),
              },
              // ALSO update public metadata - this syncs immediately to client
              publicMetadata: {
                ...(user.publicMetadata || {}),
                subscriptionStatus: subscription.status,
                isProUser: isActive, // Keep Pro until actually canceled
                plan: isActive ? 'pro' : 'free',
                cancelAtPeriodEnd: willCancel,
                cancelAt: cancelAt,
                currentPeriodEnd: currentPeriodEnd,
              },
            });
          } else {
          }
        } catch (clerkError: any) {
          console.error(
            `[WEBHOOK] ❌ Clerk error in subscription.updated:`,
            clerkError.message
          );
          console.error(`[WEBHOOK] Full error:`, clerkError);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        try {
          // Find user by customer ID
          const client = await clerkClient();
          const users = await client.users.getUserList({
            limit: 100, // Increased limit to find users
          });

          const user = users.data.find(
            (u: any) => u.privateMetadata?.stripeCustomerId === customerId
          );

          if (user) {
            // Update metadata in BOTH private and public for immediate sync
            await client.users.updateUserMetadata(user.id, {
              privateMetadata: {
                ...(user.privateMetadata || {}),
                subscriptionStatus: 'canceled',
                isProUser: false,
                subscriptionCanceled: new Date().toISOString(),
              },
              // ALSO update public metadata - this syncs immediately to client
              publicMetadata: {
                ...(user.publicMetadata || {}),
                subscriptionStatus: 'canceled',
                isProUser: false,
                plan: 'free',
              },
            });
          } else {
          }
        } catch (clerkError: any) {}
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        try {
          // Find user by customer ID and notify of payment failure
          const client = await clerkClient();
          const users = await client.users.getUserList({
            limit: 100, // Increased limit to find users
          });

          const user = users.data.find(
            (u: any) => u.privateMetadata?.stripeCustomerId === customerId
          );

          if (user) {
            await client.users.updateUserMetadata(user.id, {
              privateMetadata: {
                ...(user.privateMetadata || {}),
                lastPaymentFailed: new Date().toISOString(),
              },
            });
          } else {
          }
        } catch (clerkError: any) {}
        break;
      }

      default:
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Webhook handler failed', details: error.message },
      { status: 400 }
    );
  }
}
