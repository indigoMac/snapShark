import Stripe from 'stripe';
import { loadStripe } from '@stripe/stripe-js';

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

// Client-side Stripe instance
let stripePromise: Promise<Stripe | null>;
export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
};

// Stripe configuration
export const STRIPE_CONFIG = {
  // Pro subscription price (monthly)
  PRO_PRICE_ID: process.env.STRIPE_PRO_PRICE_ID!,
  // Pro subscription price (yearly)
  PRO_YEARLY_PRICE_ID: process.env.STRIPE_PRO_YEARLY_PRICE_ID!,
  // Success and cancel URLs
  SUCCESS_URL: `${process.env.NEXT_PUBLIC_APP_URL}/account?success=true`,
  CANCEL_URL: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
  // Customer portal
  CUSTOMER_PORTAL_URL: `${process.env.NEXT_PUBLIC_APP_URL}/account`,
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
