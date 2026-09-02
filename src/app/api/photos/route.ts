import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireDbUser } from '@/lib/auth';
import { storeLogbookPhoto } from '@/lib/store-logbook-photo';
import { photoSrc } from '@/lib/logbook';

const MAX_DATA_URL_CHARS = 1_200_000;

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

    if (typeof url !== 'string' || url.length > MAX_DATA_URL_CHARS) {
      return NextResponse.json(
        { error: 'Photo is too large. Compress and try again.' },
        { status: 400 }
      );
    }

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

    const storageRef = await storeLogbookPhoto({
      userId: user.id,
      diveId,
      dataUrl: url,
    });

    const photo = await prisma.photo.create({
      data: {
        diveId,
        storageRef,
        caption,
        takenAt: takenAt ? new Date(takenAt) : undefined,
        latitude,
        longitude,
      },
    });

    return NextResponse.json(
      {
        id: photo.id,
        url: photoSrc(photo.id),
        caption: photo.caption,
        takenAt: photo.takenAt?.toISOString() ?? null,
      },
      { status: 201 }
    );
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
    const diveId = new URL(req.url).searchParams.get('diveId');

    if (!diveId) {
      return NextResponse.json(
        { error: 'diveId is required' },
        { status: 400 }
      );
    }

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

    const photos = await prisma.photo.findMany({
      where: { diveId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(
      photos.map((photo) => ({
        id: photo.id,
        url: photoSrc(photo.id),
        caption: photo.caption,
        takenAt: photo.takenAt?.toISOString() ?? null,
      }))
    );
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    const status = err?.status || 500;
    return NextResponse.json(
      { error: err.message || 'Server error' },
      { status }
    );
  }
}
