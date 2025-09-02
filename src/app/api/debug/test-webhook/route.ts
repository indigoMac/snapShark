import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';

// DEBUG ENDPOINT - Test webhook functionality manually
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`[DEBUG] Testing webhook logic for user: ${userId}`);

    // Simulate successful checkout.session.completed event
    const client = await clerkClient();
    
    // Get current user data first
    const currentUser = await client.users.getUser(userId);
    console.log(`[DEBUG] Current user metadata:`, currentUser.privateMetadata);

    // Update user metadata (same as webhook)
    await client.users.updateUserMetadata(userId, {
      privateMetadata: {
        stripeCustomerId: 'test_customer_id',
        stripeSubscriptionId: 'test_subscription_id', 
        subscriptionStatus: 'active',
        isProUser: true,
        subscriptionStarted: new Date().toISOString(),
        debugTest: true,
      },
    });

    console.log(`[DEBUG] ✅ Pro status updated for user: ${userId}`);

    // Get updated user data
    const updatedUser = await client.users.getUser(userId);
    console.log(`[DEBUG] Updated user metadata:`, updatedUser.privateMetadata);

    return NextResponse.json({ 
      success: true, 
      message: 'Debug test completed - check if Pro status updated',
      userId,
      before: currentUser.privateMetadata,
      after: updatedUser.privateMetadata
    });
  } catch (error: any) {
    console.error('[DEBUG] Test webhook error:', error);
    return NextResponse.json(
      { error: 'Debug test failed', details: error.message },
      { status: 500 }
    );
  }
}
