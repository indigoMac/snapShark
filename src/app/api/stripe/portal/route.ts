import { NextResponse } from 'next/server';
import { requireDbUser } from '@/lib/auth';
import { stripe, STRIPE_CONFIG } from '@/lib/stripe';
import { getBillingIds } from '@/lib/subscription';

export async function POST() {
  try {
    const { clerkUserId } = await requireDbUser();

    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      );
    }

    const billing = await getBillingIds(clerkUserId);
    if (!billing?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No billing account found' },
        { status: 404 }
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: billing.stripeCustomerId,
      return_url: STRIPE_CONFIG.CUSTOMER_PORTAL_URL,
    });

    return NextResponse.json({
      url: session.url,
    });
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    if (err.status === 401) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Stripe portal error:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
