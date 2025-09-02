import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { clerkClient } from '@clerk/nextjs/server';
import Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      );
    }

    const body = await req.text();
    const signature = headers().get('stripe-signature')!;

    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );

    console.log('Stripe webhook event:', event.type);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;

        if (userId && session.subscription) {
          // Update user metadata with subscription info
          const client = await clerkClient();
          await client.users.updateUserMetadata(userId, {
            privateMetadata: {
              stripeCustomerId: session.customer,
              stripeSubscriptionId: session.subscription,
              subscriptionStatus: 'active',
              isProUser: true,
              subscriptionStarted: new Date().toISOString(),
            },
          });

          console.log(`Subscription activated for user ${userId}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

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
          await client.users.updateUserMetadata(user.id, {
            privateMetadata: {
              ...user.privateMetadata,
              subscriptionStatus: subscription.status,
              isProUser: isActive,
              subscriptionUpdated: new Date().toISOString(),
            },
          });

          console.log(
            `Subscription ${subscription.status} for user ${user.id}`
          );
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find user by customer ID
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
              ...user.privateMetadata,
              subscriptionStatus: 'canceled',
              isProUser: false,
              subscriptionCanceled: new Date().toISOString(),
            },
          });

          console.log(`Subscription canceled for user ${user.id}`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

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
              ...user.privateMetadata,
              lastPaymentFailed: new Date().toISOString(),
            },
          });

          console.log(`Payment failed for user ${user.id}`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    );
  }
}
