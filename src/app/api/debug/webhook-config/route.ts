import { NextResponse } from 'next/server';

export async function GET() {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeSecret = process.env.STRIPE_SECRET_KEY;

  return NextResponse.json({
    webhookSecretConfigured: !!webhookSecret,
    webhookSecretPrefix: webhookSecret
      ? webhookSecret.substring(0, 8) + '...'
      : 'NOT SET',
    stripeSecretConfigured: !!stripeSecret,
    stripeSecretPrefix: stripeSecret
      ? stripeSecret.substring(0, 8) + '...'
      : 'NOT SET',
    env: process.env.NODE_ENV,
  });
}
