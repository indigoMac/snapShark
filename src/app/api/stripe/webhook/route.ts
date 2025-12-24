import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { clerkClient } from '@clerk/nextjs/server';
import { RATE_LIMITS, createRateLimitHeaders } from '@/lib/rate-limit';
import Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Configure Next.js App Router for webhooks
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting (even for webhooks as defense in depth)
    const rateLimitResult = await RATE_LIMITS.API(req);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        {
          status: 429,
          headers: createRateLimitHeaders(rateLimitResult),
        }
      );
    }
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
        const customerId = session.customer as string | undefined;
        const subscriptionId = session.subscription as string | undefined;

        if (userId && subscriptionId) {
          try {
            const client = await clerkClient();
            const user = await client.users.getUser(userId);

            await client.users.updateUserMetadata(userId, {
              privateMetadata: {
                ...(user.privateMetadata || {}),
                stripeCustomerId: customerId,
                stripeSubscriptionId: subscriptionId,
                subscriptionStatus: 'active',
                isProUser: true,
                subscriptionStarted: new Date().toISOString(),
              },
              publicMetadata: {
                ...(user.publicMetadata || {}),
                subscriptionStatus: 'active',
                isProUser: true,
                plan: 'pro',
                stripeCustomerId: customerId,
                stripeSubscriptionId: subscriptionId,
              },
            });
          } catch (clerkError: any) {
            console.error(
              `[WEBHOOK] checkout.session.completed Clerk update failed`,
              {
                userId,
                customerId,
                subscriptionId,
                message: clerkError?.message,
              }
            );
          }
        } else {
          console.warn(
            `[WEBHOOK] checkout.session.completed missing userId or subscriptionId`,
            { userId, customerId, subscriptionId }
          );
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const userId = (subscription.metadata as any)?.userId as string | undefined;

        try {
          const client = await clerkClient();
          const user = userId
            ? await client.users.getUser(userId)
            : await findUserByCustomerId(client, customerId);

          if (user) {
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

            await client.users.updateUserMetadata(user.id, {
              privateMetadata: {
                ...(user.privateMetadata || {}),
                subscriptionStatus: subscription.status,
                isProUser: isActive,
                cancelAtPeriodEnd: willCancel,
                cancelAt,
                currentPeriodStart,
                currentPeriodEnd,
                subscriptionUpdated: new Date().toISOString(),
                stripeCustomerId: customerId,
                stripeSubscriptionId: subscription.id,
              },
              publicMetadata: {
                ...(user.publicMetadata || {}),
                subscriptionStatus: subscription.status,
                isProUser: isActive,
                plan: isActive ? 'pro' : 'free',
                cancelAtPeriodEnd: willCancel,
                cancelAt,
                currentPeriodEnd,
                stripeCustomerId: customerId,
                stripeSubscriptionId: subscription.id,
              },
            });
          } else {
            console.warn(
              `[WEBHOOK] subscription.updated user not found`,
              { userId, customerId, subscriptionId: subscription.id }
            );
          }
        } catch (clerkError: any) {
          console.error(
            `[WEBHOOK] subscription.updated Clerk update failed`,
            {
              userId,
              customerId,
              subscriptionId: subscription.id,
              message: clerkError?.message,
            }
          );
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const userId = (subscription.metadata as any)?.userId as string | undefined;

        try {
          const client = await clerkClient();
          const user = userId
            ? await client.users.getUser(userId)
            : await findUserByCustomerId(client, customerId);

          if (user) {
            await client.users.updateUserMetadata(user.id, {
              privateMetadata: {
                ...(user.privateMetadata || {}),
                subscriptionStatus: 'canceled',
                isProUser: false,
                subscriptionCanceled: new Date().toISOString(),
                stripeCustomerId: customerId,
                stripeSubscriptionId: subscription.id,
              },
              publicMetadata: {
                ...(user.publicMetadata || {}),
                subscriptionStatus: 'canceled',
                isProUser: false,
                plan: 'free',
                stripeCustomerId: customerId,
                stripeSubscriptionId: subscription.id,
              },
            });
          } else {
            console.warn(
              `[WEBHOOK] subscription.deleted user not found`,
              { userId, customerId, subscriptionId: subscription.id }
            );
          }
        } catch (clerkError: any) {
          console.error(
            `[WEBHOOK] subscription.deleted Clerk update failed`,
            {
              userId,
              customerId,
              subscriptionId: subscription.id,
              message: clerkError?.message,
            }
          );
        }
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

    return NextResponse.json(
      { received: true },
      {
        headers: createRateLimitHeaders(rateLimitResult),
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Webhook handler failed', details: error.message },
      { status: 400 }
    );
  }
}

async function findUserByCustomerId(
  client: Awaited<ReturnType<typeof clerkClient>>,
  customerId: string
) {
  const users = await client.users.getUserList({
    limit: 100,
  });
  return users.data.find(
    (u: any) => u.privateMetadata?.stripeCustomerId === customerId
  );
}
