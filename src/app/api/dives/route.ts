'use server';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireDbUser } from '@/lib/auth';

// Create a new dive
export async function POST(req: NextRequest) {
  try {
    const { user } = await requireDbUser();
    const body = await req.json();

    const {
      siteId,
      diveDate,
      depthMeters,
      bottomTimeMinutes,
      buddy,
      conditions,
      notes,
    } = body;

    if (!diveDate) {
      return NextResponse.json(
        { error: 'diveDate is required' },
        { status: 400 }
      );
    }

    const dive = await prisma.dive.create({
      data: {
        userId: user.id,
        siteId,
        diveDate: new Date(diveDate),
        depthMeters,
        bottomTimeMinutes,
        buddy,
        conditions,
        notes,
      },
      include: {
        site: true,
      },
    });

    return NextResponse.json(dive, { status: 201 });
  } catch (error: any) {
    const status = error?.status || 500;
    return NextResponse.json({ error: error.message || 'Server error' }, { status });
  }
}

// List dives for the authenticated user
export async function GET(req: NextRequest) {
  try {
    const { user } = await requireDbUser();
    const { searchParams } = new URL(req.url);

    // Optional bounding box filter for map views
    const minLat = searchParams.get('minLat');
    const maxLat = searchParams.get('maxLat');
    const minLng = searchParams.get('minLng');
    const maxLng = searchParams.get('maxLng');

    const dives = await prisma.dive.findMany({
      where: {
        userId: user.id,
        ...(minLat && maxLat && minLng && maxLng
          ? {
              site: {
                latitude: {
                  gte: minLat ? parseFloat(minLat) : undefined,
                  lte: maxLat ? parseFloat(maxLat) : undefined,
                },
                longitude: {
                  gte: minLng ? parseFloat(minLng) : undefined,
                  lte: maxLng ? parseFloat(maxLng) : undefined,
                },
              },
            }
          : {}),
      },
      include: {
        site: true,
        photos: true,
      },
      orderBy: { diveDate: 'desc' },
    });

    return NextResponse.json(dives);
  } catch (error: any) {
    const status = error?.status || 500;
    return NextResponse.json({ error: error.message || 'Server error' }, { status });
  }
}
