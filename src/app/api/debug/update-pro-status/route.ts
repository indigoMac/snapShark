import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';

// TEMPORARY DEBUG ENDPOINT - Remove in production
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Manual Pro status update (TEMPORARY)
    const client = await clerkClient();
    await client.users.updateUserMetadata(userId, {
      privateMetadata: {
        isProUser: true,
        subscriptionStatus: 'active',
        manuallyUpdated: new Date().toISOString(),
        stripeCustomerId: 'manual_update', // Placeholder
      },
    });
    return NextResponse.json({
      success: true,
      message: 'Pro status updated manually',
      userId,
    });
  } catch (error) {
    console.error('[DEBUG] Manual update error:', error);
    return NextResponse.json(
      { error: 'Failed to update Pro status' },
      { status: 500 }
    );
  }
}
