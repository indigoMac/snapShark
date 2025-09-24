import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';

// Test endpoint to verify webhook-style operations
export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const client = await clerkClient();

    // First, verify the user exists
    try {
      const user = await client.users.getUser(userId);

      // Test updating metadata (similar to webhook)
      await client.users.updateUserMetadata(userId, {
        privateMetadata: {
          ...(user.privateMetadata || {}),
          debugTest: true,
          stripeCustomerId: 'test_customer_123',
          stripeSubscriptionId: 'test_sub_123',
          subscriptionStatus: 'active',
          isProUser: true,
          subscriptionStarted: new Date().toISOString(),
        },
        publicMetadata: {
          ...(user.publicMetadata || {}),
          debugTest: true,
          subscriptionStatus: 'active',
          isProUser: true,
          plan: 'pro',
        },
      });

      // Get updated user data
      const updatedUser = await client.users.getUser(userId);

      return NextResponse.json({
        success: true,
        message: 'Test webhook operations completed',
        userId,
        metadata: {
          private: updatedUser.privateMetadata,
          public: updatedUser.publicMetadata,
        },
      });
    } catch (userError: any) {
      return NextResponse.json(
        {
          error: 'User not found or access denied',
          details: userError.message,
          userId,
        },
        { status: 404 }
      );
    }
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Test failed', details: error.message },
      { status: 500 }
    );
  }
}
