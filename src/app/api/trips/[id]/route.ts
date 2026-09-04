import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireDbUser } from '@/lib/auth';
import { serializeTrip } from '@/lib/logbook';
import { nextShareToken } from '@/lib/share';

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

type RouteContext = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const { user } = await requireDbUser();
    const body = await req.json();
    const { name, description, startDate, endDate, shareEnabled } = body;

    const existing = await prisma.trip.findFirst({
      where: { id: params.id, userId: user.id },
      select: { id: true, shareToken: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    if (name !== undefined && !String(name).trim()) {
      return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
    }

    const trip = await prisma.trip.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined ? { name: String(name).trim() } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(startDate !== undefined
          ? { startDate: startDate ? new Date(startDate) : null }
          : {}),
        ...(endDate !== undefined
          ? { endDate: endDate ? new Date(endDate) : null }
          : {}),
        ...(typeof shareEnabled === 'boolean'
          ? { shareToken: nextShareToken(shareEnabled, existing.shareToken) }
          : {}),
      },
      include: tripInclude,
    });

    return NextResponse.json(serializeTrip(trip));
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    return NextResponse.json(
      { error: err.message || 'Server error' },
      { status: err?.status || 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
    const { user } = await requireDbUser();

    const existing = await prisma.trip.findFirst({
      where: { id: params.id, userId: user.id },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // Places keep their data; trip link is cleared via onDelete: SetNull
    await prisma.trip.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    return NextResponse.json(
      { error: err.message || 'Server error' },
      { status: err?.status || 500 }
    );
  }
}
