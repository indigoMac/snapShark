import { NextRequest, NextResponse } from 'next/server';
import { photoBelongsToShare } from '@/lib/share';
import { logbookPhotoResponse } from '@/lib/photo-file';

type RouteContext = { params: { token: string; photoId: string } };

/**
 * Serves a photo that belongs to a currently-shared trip or place.
 * Token in the URL is the access check; turning sharing off revokes this.
 */
export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const photo = await photoBelongsToShare(params.token, params.photoId);
    if (!photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    return logbookPhotoResponse(photo.storageRef, 'public');
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    return NextResponse.json(
      { error: err.message || 'Server error' },
      { status: err?.status || 500 }
    );
  }
}
