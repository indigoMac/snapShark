import { NextResponse } from 'next/server';
import { getEntitlements } from '@/lib/entitlements';

/**
 * Server-resolved entitlements, so the client can confirm what the database
 * says rather than relying only on auth-provider metadata.
 */
export async function GET() {
  try {
    const entitlements = await getEntitlements();
    return NextResponse.json(entitlements, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    return NextResponse.json(
      { error: err.message || 'Server error' },
      { status: err?.status || 500 }
    );
  }
}
