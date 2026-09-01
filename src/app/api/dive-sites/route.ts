import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireDbUser } from '@/lib/auth';
import { serializeSite } from '@/lib/logbook';

export const diveInclude = {
  trip: { select: { id: true, name: true } },
  dives: {
    include: { photos: { orderBy: { createdAt: 'asc' as const } } },
    orderBy: { diveDate: 'desc' as const },
  },
};

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireDbUser();
    const body = await req.json();
    const {
      name,
      description,
      latitude,
      longitude,
      country,
      region,
      tripId,
    } = body;

    if (!name || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: 'name, latitude, and longitude are required' },
        { status: 400 }
      );
    }

    if (tripId) {
      const trip = await prisma.trip.findFirst({
        where: { id: tripId, userId: user.id },
        select: { id: true },
      });
      if (!trip) {
        return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
      }
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
        tripId: tripId || null,
      },
      include: diveInclude,
    });

    return NextResponse.json(serializeSite(site), { status: 201 });
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    const status = err?.status || 500;
    return NextResponse.json(
      { error: err.message || 'Server error' },
      { status }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { user } = await requireDbUser();
    const { searchParams } = new URL(req.url);

    const minLat = searchParams.get('minLat');
    const maxLat = searchParams.get('maxLat');
    const minLng = searchParams.get('minLng');
    const maxLng = searchParams.get('maxLng');
    const tripId = searchParams.get('tripId');

    const sites = await prisma.diveSite.findMany({
      where: {
        userId: user.id,
        ...(tripId === 'none'
          ? { tripId: null }
          : tripId
            ? { tripId }
            : {}),
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
      include: diveInclude,
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(sites.map(serializeSite));
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    const status = err?.status || 500;
    return NextResponse.json(
      { error: err.message || 'Server error' },
      { status }
    );
  }
}
