import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireDbUser } from '@/lib/auth';
import {
  decodeDataUrlPhoto,
  readStoredLogbookPhoto,
  safeLogbookPhotoContentType,
} from '@/lib/store-logbook-photo';

type RouteContext = { params: { id: string } };

/**
 * Streams a logbook photo to its owner. Photos are stored privately, so this is
 * the only way to view one and every request is checked against the signed-in
 * account.
 */
export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const { user } = await requireDbUser();

    const photo = await prisma.photo.findFirst({
      where: { id: params.id, dive: { userId: user.id } },
      select: { storageRef: true },
    });
    if (!photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    const inline = decodeDataUrlPhoto(photo.storageRef);
    if (inline) {
      return new NextResponse(new Uint8Array(inline.buffer), {
        status: 200,
        headers: photoFileHeaders(inline.contentType),
      });
    }

    const stored = await readStoredLogbookPhoto(photo.storageRef);
    if (!stored) {
      return NextResponse.json(
        { error: 'Photo is no longer available' },
        { status: 404 }
      );
    }

    const contentType = safeLogbookPhotoContentType(stored.contentType);
    if (!contentType) {
      return NextResponse.json(
        { error: 'Photo is no longer available' },
        { status: 404 }
      );
    }

    return new NextResponse(stored.stream, {
      status: 200,
      headers: photoFileHeaders(contentType),
    });
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    return NextResponse.json(
      { error: err.message || 'Server error' },
      { status: err?.status || 500 }
    );
  }
}

function photoFileHeaders(contentType: string): Record<string, string> {
  return {
    'Content-Type': contentType,
    'Content-Disposition': 'inline',
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'private, max-age=3600',
  };
}
