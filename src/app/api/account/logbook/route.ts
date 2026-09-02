import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireDbUser } from '@/lib/auth';
import { photoSrc, serializeSite, serializeTrip } from '@/lib/logbook';
import { deleteStoredLogbookPhotos } from '@/lib/store-logbook-photo';

/**
 * Data portability: returns everything stored in the caller's logbook as JSON.
 */
export async function GET() {
  try {
    const { user } = await requireDbUser();

    const [sites, trips, unplacedDives] = await Promise.all([
      prisma.diveSite.findMany({
        where: { userId: user.id },
        include: {
          trip: { select: { id: true, name: true } },
          dives: {
            include: { photos: { orderBy: { createdAt: 'asc' } } },
            orderBy: { diveDate: 'desc' },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.trip.findMany({
        where: { userId: user.id },
        include: {
          places: {
            select: {
              id: true,
              dives: { select: { photos: { select: { id: true } } } },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.dive.findMany({
        where: { userId: user.id, siteId: null },
        include: { photos: { orderBy: { createdAt: 'asc' } } },
        orderBy: { diveDate: 'desc' },
      }),
    ]);

    const payload = {
      exportedAt: new Date().toISOString(),
      accountCreatedAt: user.createdAt.toISOString(),
      trips: trips.map(serializeTrip),
      places: sites.map(serializeSite),
      divesWithoutPlace: unplacedDives.map((dive) => ({
        id: dive.id,
        diveDate: dive.diveDate.toISOString(),
        diveType: dive.diveType,
        notes: dive.notes,
        photos: dive.photos.map((photo) => photoSrc(photo.id)),
      })),
    };

    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="snapshark-logbook.json"',
      },
    });
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    return NextResponse.json(
      { error: err.message || 'Server error' },
      { status: err?.status || 500 }
    );
  }
}

/**
 * Right to erasure: permanently removes the caller's logbook content, including
 * photos held in Blob storage.
 */
export async function DELETE() {
  try {
    const { user } = await requireDbUser();

    const photos = await prisma.photo.findMany({
      where: { dive: { userId: user.id } },
      select: { storageRef: true },
    });

    await prisma.$transaction([
      prisma.dive.deleteMany({ where: { userId: user.id } }),
      prisma.diveSite.deleteMany({ where: { userId: user.id } }),
      prisma.trip.deleteMany({ where: { userId: user.id } }),
    ]);

    await deleteStoredLogbookPhotos(photos.map((photo) => photo.storageRef));

    return NextResponse.json({ ok: true, deletedPhotos: photos.length });
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    return NextResponse.json(
      { error: err.message || 'Server error' },
      { status: err?.status || 500 }
    );
  }
}
