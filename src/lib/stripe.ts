import Stripe from 'stripe';
import { loadStripe } from '@stripe/stripe-js';

// Server-side Stripe instance - only create if we have the secret key
const createStripeInstance = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    // Only warn on server-side, not client-side
    if (typeof window === 'undefined') {
      console.warn(
        'STRIPE_SECRET_KEY not found - Stripe server features disabled'
      );
    }
    return null;
  }

  return new Stripe(secretKey, {
    apiVersion: '2025-08-27.basil',
  });
};

export const stripe = createStripeInstance();

// Client-side Stripe instance
let stripePromise: Promise<any>;
export const getStripe = () => {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
      console.error('Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');
      return Promise.resolve(null);
    }
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
};

// Stripe configuration - with safe defaults
export const STRIPE_CONFIG = {
  // Pro subscription price (monthly)
  PRO_PRICE_ID:
    process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ||
    process.env.STRIPE_PRO_PRICE_ID ||
    '',
  // Pro subscription price (yearly)
  PRO_YEARLY_PRICE_ID:
    process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID ||
    process.env.STRIPE_PRO_YEARLY_PRICE_ID ||
    '',
  // Success and cancel URLs
  SUCCESS_URL: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/account?success=true`,
  CANCEL_URL: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pricing?canceled=true`,
  // Customer portal
  CUSTOMER_PORTAL_URL: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/account`,
};

// Product configuration
export const PRODUCTS = {
  PRO_MONTHLY: {
    name: 'SnapShark Pro Monthly',
    description: 'Batch processing, advanced presets, and priority support',
    price: 3, // £3/month
    interval: 'month' as const,
  },
  PRO_YEARLY: {
    name: 'SnapShark Pro Yearly',
    description: 'Batch processing, advanced presets, and priority support',
    price: 15, // £15/year (5 months free)
    interval: 'year' as const,
  },
} as const;
