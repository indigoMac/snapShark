import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { clerkClient } from '@clerk/nextjs/server';
import Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  try {
    console.log('[WEBHOOK] 🚀 Webhook request received');
    
    if (!stripe) {
      console.log('[WEBHOOK] ❌ Stripe not configured');
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      );
    }

    if (!webhookSecret) {
      console.log('[WEBHOOK] ❌ Webhook secret not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    const body = await req.text();
    const signature = headers().get('stripe-signature');
    
    console.log('[WEBHOOK] 📝 Body length:', body.length);
    console.log('[WEBHOOK] 🔑 Signature present:', !!signature);
    
    if (!signature) {
      console.log('[WEBHOOK] ❌ No stripe-signature header');
      return NextResponse.json(
        { error: 'No stripe-signature header' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      );
      console.log('[WEBHOOK] ✅ Signature verified successfully');
    } catch (err: any) {
      console.log('[WEBHOOK] ❌ Signature verification failed:', err.message);
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${err.message}` },
        { status: 400 }
      );
    }

    console.log(`[WEBHOOK] Event: ${event.type}`);

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

          console.log(`[WEBHOOK] ✅ Subscription activated for user ${userId}`);
        } else {
          console.log(`[WEBHOOK] ❌ Missing data - userId: ${userId}, subscription: ${session.subscription}`);
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

          console.log(`[WEBHOOK] ✅ Subscription ${subscription.status} for user ${user.id}`);
        } else {
          console.log(`[WEBHOOK] ❌ User not found for customer: ${customerId}`);
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

          console.log(`[WEBHOOK] ✅ Subscription canceled for user ${user.id}`);
        } else {
          console.log(`[WEBHOOK] ❌ User not found for customer: ${customerId}`);
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

          console.log(`[WEBHOOK] ✅ Payment failed recorded for user ${user.id}`);
        } else {
          console.log(`[WEBHOOK] ❌ User not found for customer: ${customerId}`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[WEBHOOK] 🚨 Webhook error:', error.message || error);
    console.error('[WEBHOOK] 🚨 Full error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed', details: error.message },
      { status: 400 }
    );
  }
}
