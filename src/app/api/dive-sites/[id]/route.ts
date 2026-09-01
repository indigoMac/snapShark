import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireDbUser } from '@/lib/auth';
import { serializeSite } from '@/lib/logbook';
import { diveInclude } from '../route';

type RouteContext = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const { user } = await requireDbUser();
    const body = await req.json();
    const {
      name,
      description,
      country,
      region,
      latitude,
      longitude,
      tripId,
    } = body;

    const existing = await prisma.diveSite.findFirst({
      where: { id: params.id, userId: user.id },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Place not found' }, { status: 404 });
    }

    if (name !== undefined && !String(name).trim()) {
      return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
    }

    if (latitude !== undefined || longitude !== undefined) {
      const lat = Number(latitude);
      const lng = Number(longitude);
      if (
        Number.isNaN(lat) ||
        Number.isNaN(lng) ||
        lat < -90 ||
        lat > 90 ||
        lng < -180 ||
        lng > 180
      ) {
        return NextResponse.json(
          { error: 'Valid latitude and longitude are required' },
          { status: 400 }
        );
      }
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

    const site = await prisma.diveSite.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined ? { name: String(name).trim() } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(country !== undefined ? { country } : {}),
        ...(region !== undefined ? { region } : {}),
        ...(latitude !== undefined ? { latitude: Number(latitude) } : {}),
        ...(longitude !== undefined ? { longitude: Number(longitude) } : {}),
        ...(tripId !== undefined
          ? { tripId: tripId === null || tripId === '' ? null : tripId }
          : {}),
      },
      include: diveInclude,
    });

    return NextResponse.json(serializeSite(site));
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

    const existing = await prisma.diveSite.findFirst({
      where: { id: params.id, userId: user.id },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Place not found' }, { status: 404 });
    }

    await prisma.diveSite.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    return NextResponse.json(
      { error: err.message || 'Server error' },
      { status: err?.status || 500 }
    );
  }
}
