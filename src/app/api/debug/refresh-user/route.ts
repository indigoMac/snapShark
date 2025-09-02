import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';

// Force refresh user data from server
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`[REFRESH] Getting fresh user data for: ${userId}`);

    // Get fresh user data from Clerk
    const client = await clerkClient();
    const freshUser = await client.users.getUser(userId);
    
    console.log(`[REFRESH] Fresh metadata:`, freshUser.privateMetadata);

    return NextResponse.json({ 
      success: true, 
      message: 'Fresh user data retrieved',
      userId,
      metadata: freshUser.privateMetadata,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[REFRESH] Error:', error);
    return NextResponse.json(
      { error: 'Failed to refresh user data', details: error.message },
      { status: 500 }
    );
  }
}
