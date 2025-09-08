import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { clerkClient } from '@clerk/nextjs/server';
import Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Configure Next.js App Router for webhooks
export const runtime = 'nodejs';
export const preferredRegion = 'auto';

// Explicitly disable body parsing for webhooks
export const dynamic = 'force-dynamic';

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

    // Read the raw request body - this is critical for signature verification
    const rawBody = await req.text();
    const sig = headers().get('stripe-signature') as string;

    console.log('[WEBHOOK] 📝 Raw body length:', rawBody.length);
    console.log('[WEBHOOK] 🔑 Signature present:', !!sig);
    console.log('[WEBHOOK] 📋 Webhook secret configured:', !!webhookSecret);

    if (!sig) {
      console.log('[WEBHOOK] ❌ No stripe-signature header');
      return NextResponse.json(
        { error: 'No stripe-signature header' },
        { status: 400 }
      );
    }

    // Construct the event using Stripe's webhook verification
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
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

        console.log(
          `[WEBHOOK] Processing checkout.session.completed for user: ${userId}`
        );
        console.log(
          `[WEBHOOK] Customer: ${session.customer}, Subscription: ${session.subscription}`
        );

        if (userId && session.subscription) {
          try {
            // Update user metadata with subscription info
            const client = await clerkClient();

            // First, verify the user exists
            const user = await client.users.getUser(userId);
            console.log(`[WEBHOOK] User found: ${user.id}`);

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
              },
            });

            console.log(
              `[WEBHOOK] ✅ Subscription activated for user ${userId}`
            );
          } catch (clerkError: any) {
            console.error(
              `[WEBHOOK] ❌ Clerk error for user ${userId}:`,
              clerkError.message
            );
            console.error(`[WEBHOOK] Full Clerk error:`, clerkError);
            // Don't throw - let Stripe know we received the webhook but had an issue
          }
        } else {
          console.log(
            `[WEBHOOK] ❌ Missing data - userId: ${userId}, subscription: ${session.subscription}`
          );
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        console.log(
          `[WEBHOOK] Processing subscription update for customer: ${customerId}`
        );
        console.log(`[WEBHOOK] Subscription status: ${subscription.status}`);

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
            // Update metadata in BOTH private and public for immediate sync
            await client.users.updateUserMetadata(user.id, {
              privateMetadata: {
                ...(user.privateMetadata || {}),
                subscriptionStatus: subscription.status,
                isProUser: isActive,
                subscriptionUpdated: new Date().toISOString(),
              },
              // ALSO update public metadata - this syncs immediately to client
              publicMetadata: {
                ...(user.publicMetadata || {}),
                subscriptionStatus: subscription.status,
                isProUser: isActive,
                plan: isActive ? 'pro' : 'free',
              },
            });

            console.log(
              `[WEBHOOK] ✅ Subscription ${subscription.status} for user ${user.id}`
            );
          } else {
            console.log(
              `[WEBHOOK] ❌ User not found for customer: ${customerId}`
            );
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

        console.log(
          `[WEBHOOK] Processing subscription deletion for customer: ${customerId}`
        );

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

            console.log(
              `[WEBHOOK] ✅ Subscription canceled for user ${user.id}`
            );
          } else {
            console.log(
              `[WEBHOOK] ❌ User not found for customer: ${customerId}`
            );
          }
        } catch (clerkError: any) {
          console.error(
            `[WEBHOOK] ❌ Clerk error in subscription.deleted:`,
            clerkError.message
          );
          console.error(`[WEBHOOK] Full error:`, clerkError);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        console.log(
          `[WEBHOOK] Processing payment failure for customer: ${customerId}`
        );

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

            console.log(
              `[WEBHOOK] ✅ Payment failed recorded for user ${user.id}`
            );
          } else {
            console.log(
              `[WEBHOOK] ❌ User not found for customer: ${customerId}`
            );
          }
        } catch (clerkError: any) {
          console.error(
            `[WEBHOOK] ❌ Clerk error in payment_failed:`,
            clerkError.message
          );
          console.error(`[WEBHOOK] Full error:`, clerkError);
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
