'use server';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireDbUser } from '@/lib/auth';

// Create a new dive site
export async function POST(req: NextRequest) {
  try {
    const { user } = await requireDbUser();
    const body = await req.json();
    const { name, description, latitude, longitude, country, region } = body;

    if (!name || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: 'name, latitude, and longitude are required' },
        { status: 400 }
      );
    }

    const site = await prisma.diveSite.create({
      data: {
        userId: user.id,
        name,
        description,
        latitude,
        longitude,
        country,
        region,
      },
    });

    return NextResponse.json(site, { status: 201 });
  } catch (error: any) {
    const status = error?.status || 500;
    return NextResponse.json({ error: error.message || 'Server error' }, { status });
  }
}

// List dive sites for the authenticated user
export async function GET(req: NextRequest) {
  try {
    const { user } = await requireDbUser();
    const { searchParams } = new URL(req.url);

    const minLat = searchParams.get('minLat');
    const maxLat = searchParams.get('maxLat');
    const minLng = searchParams.get('minLng');
    const maxLng = searchParams.get('maxLng');

    const sites = await prisma.diveSite.findMany({
      where: {
        userId: user.id,
        ...(minLat && maxLat && minLng && maxLng
          ? {
              latitude: {
                gte: parseFloat(minLat),
                lte: parseFloat(maxLat),
              },
              longitude: {
                gte: parseFloat(minLng),
                lte: parseFloat(maxLng),
              },
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(sites);
  } catch (error: any) {
    const status = error?.status || 500;
    return NextResponse.json({ error: error.message || 'Server error' }, { status });
  }
}
