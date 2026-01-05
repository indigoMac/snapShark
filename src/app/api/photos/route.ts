'use server';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireDbUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireDbUser();
    const body = await req.json();

    const { diveId, url, caption, takenAt, latitude, longitude } = body;

    if (!diveId || !url) {
      return NextResponse.json(
        { error: 'diveId and url are required' },
        { status: 400 }
      );
    }

    // Ensure the dive belongs to the current user
    const dive = await prisma.dive.findFirst({
      where: { id: diveId, userId: user.id },
      select: { id: true },
    });

    if (!dive) {
      return NextResponse.json(
        { error: 'Dive not found for current user' },
        { status: 404 }
      );
    }

    const photo = await prisma.photo.create({
      data: {
        diveId,
        url,
        caption,
        takenAt: takenAt ? new Date(takenAt) : undefined,
        latitude,
        longitude,
      },
    });

    return NextResponse.json(photo, { status: 201 });
  } catch (error: any) {
    const status = error?.status || 500;
    return NextResponse.json({ error: error.message || 'Server error' }, { status });
  }
}
