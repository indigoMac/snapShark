import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const client = await clerkClient();

    try {
      const user = await client.users.getUser(userId);

      return NextResponse.json({
        success: true,
        userId: user.id,
        email: user.emailAddresses[0]?.emailAddress,
        privateMetadata: user.privateMetadata,
        publicMetadata: user.publicMetadata,
        lastSignInAt: user.lastSignInAt,
        createdAt: user.createdAt,
      });
    } catch (userError: any) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
          details: userError.message,
          userId,
        },
        { status: 404 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Request failed', details: error.message },
      { status: 500 }
    );
  }
}
