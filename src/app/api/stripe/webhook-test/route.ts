import { NextRequest, NextResponse } from 'next/server';

// Simple test endpoint to verify webhook is reachable
export async function GET() {
  return NextResponse.json({
    status: 'Webhook endpoint is working',
    timestamp: new Date().toISOString(),
    env: {
      hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      hasStripeSecret: !!process.env.STRIPE_SECRET_KEY,
    },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  return NextResponse.json({
    received: true,
    timestamp: new Date().toISOString(),
  });
}
