import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireDbUser } from '@/lib/auth';
import { serializeDive } from '@/lib/logbook';
import { deleteStoredLogbookPhotos } from '@/lib/store-logbook-photo';

const diveInclude = {
  site: true,
  photos: { orderBy: { createdAt: 'asc' as const } },
};

type RouteContext = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const { user } = await requireDbUser();
    const body = await req.json();
    const {
      diveDate,
      notes,
      diveType,
      depthMeters,
      bottomTimeMinutes,
      buddy,
      conditions,
    } = body;

    const existing = await prisma.dive.findFirst({
      where: { id: params.id, userId: user.id },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Dive not found' }, { status: 404 });
    }

    const dive = await prisma.dive.update({
      where: { id: params.id },
      data: {
        ...(diveDate !== undefined ? { diveDate: new Date(diveDate) } : {}),
        ...(notes !== undefined ? { notes } : {}),
        ...(diveType !== undefined ? { diveType: diveType || null } : {}),
        ...(depthMeters !== undefined ? { depthMeters } : {}),
        ...(bottomTimeMinutes !== undefined ? { bottomTimeMinutes } : {}),
        ...(buddy !== undefined ? { buddy: buddy || null } : {}),
        ...(conditions !== undefined ? { conditions } : {}),
      },
      include: diveInclude,
    });

    return NextResponse.json(serializeDive(dive));
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

    const existing = await prisma.dive.findFirst({
      where: { id: params.id, userId: user.id },
      select: { id: true, photos: { select: { storageRef: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Dive not found' }, { status: 404 });
    }

    await prisma.dive.delete({ where: { id: params.id } });
    await deleteStoredLogbookPhotos(existing.photos.map((p) => p.storageRef));

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    return NextResponse.json(
      { error: err.message || 'Server error' },
      { status: err?.status || 500 }
    );
  }
}
