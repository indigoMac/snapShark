import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireDbUser } from '@/lib/auth';
import { serializeDive } from '@/lib/logbook';

const diveInclude = {
  site: true,
  photos: { orderBy: { createdAt: 'asc' as const } },
};

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

    if (siteId) {
      const site = await prisma.diveSite.findFirst({
        where: { id: siteId, userId: user.id },
        select: { id: true },
      });
      if (!site) {
        return NextResponse.json(
          { error: 'Dive site not found for current user' },
          { status: 404 }
        );
      }
    }

    const dive = await prisma.dive.create({
      data: {
        userId: user.id,
        siteId: siteId || null,
        diveDate: new Date(diveDate),
        depthMeters,
        bottomTimeMinutes,
        buddy,
        conditions,
        notes,
      },
      include: diveInclude,
    });

    return NextResponse.json(serializeDive(dive), { status: 201 });
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
    const siteId = searchParams.get('siteId');

    const dives = await prisma.dive.findMany({
      where: {
        userId: user.id,
        ...(siteId ? { siteId } : {}),
        ...(minLat && maxLat && minLng && maxLng
          ? {
              site: {
                latitude: {
                  gte: parseFloat(minLat),
                  lte: parseFloat(maxLat),
                },
                longitude: {
                  gte: parseFloat(minLng),
                  lte: parseFloat(maxLng),
                },
              },
            }
          : {}),
      },
      include: diveInclude,
      orderBy: { diveDate: 'desc' },
    });

    return NextResponse.json(dives.map(serializeDive));
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    const status = err?.status || 500;
    return NextResponse.json(
      { error: err.message || 'Server error' },
      { status }
    );
  }
}
