import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireDbUser } from '@/lib/auth';
import { serializeTrip } from '@/lib/logbook';

const tripInclude = {
  places: {
    include: {
      dives: {
        include: { photos: { orderBy: { createdAt: 'asc' as const }, take: 1 } },
        orderBy: { diveDate: 'desc' as const },
      },
    },
  },
};

export async function GET() {
  try {
    const { user } = await requireDbUser();
    const trips = await prisma.trip.findMany({
      where: { userId: user.id },
      include: tripInclude,
      orderBy: [{ startDate: 'desc' }, { createdAt: 'desc' }],
    });
    return NextResponse.json(trips.map(serializeTrip));
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    return NextResponse.json(
      { error: err.message || 'Server error' },
      { status: err?.status || 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireDbUser();
    const body = await req.json();
    const { name, description, startDate, endDate } = body;

    if (!name || !String(name).trim()) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    const trip = await prisma.trip.create({
      data: {
        userId: user.id,
        name: String(name).trim(),
        description: description || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
      include: tripInclude,
    });

    return NextResponse.json(serializeTrip(trip), { status: 201 });
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    return NextResponse.json(
      { error: err.message || 'Server error' },
      { status: err?.status || 500 }
    );
  }
}
