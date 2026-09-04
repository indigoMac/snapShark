import { NextResponse } from 'next/server';
import {
  decodeDataUrlPhoto,
  readStoredLogbookPhoto,
  safeLogbookPhotoContentType,
  type PhotoStorageRef,
} from '@/lib/store-logbook-photo';

export function photoFileHeaders(
  contentType: string,
  cache: 'private' | 'public'
): Record<string, string> {
  return {
    'Content-Type': contentType,
    'Content-Disposition': 'inline',
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control':
      cache === 'public'
        ? 'public, max-age=3600, s-maxage=3600'
        : 'private, max-age=3600',
  };
}

export async function logbookPhotoResponse(
  storageRef: PhotoStorageRef,
  cache: 'private' | 'public'
): Promise<NextResponse> {
  const inline = decodeDataUrlPhoto(storageRef);
  if (inline) {
    return new NextResponse(new Uint8Array(inline.buffer), {
      status: 200,
      headers: photoFileHeaders(inline.contentType, cache),
    });
  }

  const stored = await readStoredLogbookPhoto(storageRef);
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
    headers: photoFileHeaders(contentType, cache),
  });
}

export async function readLogbookPhotoBytes(
  storageRef: PhotoStorageRef
): Promise<{ buffer: Buffer; contentType: string } | null> {
  const inline = decodeDataUrlPhoto(storageRef);
  if (inline) {
    return { buffer: inline.buffer, contentType: inline.contentType };
  }

  const stored = await readStoredLogbookPhoto(storageRef);
  if (!stored) return null;

  const contentType = safeLogbookPhotoContentType(stored.contentType);
  if (!contentType) return null;

  const buffer = await streamToBuffer(stored.stream);
  return { buffer, contentType };
}

async function streamToBuffer(
  stream: ReadableStream<Uint8Array> | NodeJS.ReadableStream
): Promise<Buffer> {
  if (typeof (stream as ReadableStream<Uint8Array>).getReader === 'function') {
    const arrayBuffer = await new Response(
      stream as ReadableStream<Uint8Array>
    ).arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  const chunks: Buffer[] = [];
  for await (const chunk of stream as AsyncIterable<Buffer | Uint8Array>) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}
