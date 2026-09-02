import { del, get, put } from '@vercel/blob';

/**
 * Reference to a stored logbook photo: a private Blob pathname in production,
 * or a data URL when no blob store is configured (local development only).
 */
export type PhotoStorageRef = string;

export const ALLOWED_LOGBOOK_PHOTO_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type AllowedLogbookPhotoType =
  (typeof ALLOWED_LOGBOOK_PHOTO_TYPES)[number];

const ALLOWED_TYPE_SET = new Set<string>(ALLOWED_LOGBOOK_PHOTO_TYPES);

const TYPE_TO_EXT: Record<AllowedLogbookPhotoType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function isDataUrl(ref: PhotoStorageRef): boolean {
  return ref.startsWith('data:');
}

/** Legacy references created before photos moved to private storage. */
function isLegacyPublicUrl(ref: PhotoStorageRef): boolean {
  return ref.startsWith('https://');
}

function httpError(message: string, status: number): Error {
  return Object.assign(new Error(message), { status });
}

function normalizeImageContentType(raw: string): string {
  const type = raw.toLowerCase().split(';')[0]?.trim() ?? '';
  if (type === 'image/jpg') return 'image/jpeg';
  return type;
}

export function safeLogbookPhotoContentType(
  contentType: string | null | undefined
): AllowedLogbookPhotoType | null {
  if (!contentType) return null;
  const normalized = normalizeImageContentType(contentType);
  return ALLOWED_TYPE_SET.has(normalized)
    ? (normalized as AllowedLogbookPhotoType)
    : null;
}

/**
 * Accepts only JPEG, PNG, or WebP data URLs. SVG and other types are rejected
 * so they cannot be served back on this origin.
 */
export function parseLogbookPhotoDataUrl(dataUrl: string): {
  contentType: AllowedLogbookPhotoType;
  buffer: Buffer;
  ext: string;
} {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(dataUrl);
  if (!match) {
    throw httpError('Photo must be a JPEG, PNG, or WebP image', 400);
  }

  const contentType = safeLogbookPhotoContentType(match[1]);
  if (!contentType) {
    throw httpError('Photo must be a JPEG, PNG, or WebP image', 400);
  }

  return {
    contentType,
    buffer: Buffer.from(match[2], 'base64'),
    ext: TYPE_TO_EXT[contentType],
  };
}

/**
 * Store a compressed image for the logbook.
 * Uses private Vercel Blob storage when BLOB_READ_WRITE_TOKEN is set; otherwise
 * keeps a data URL, which is fine for local development.
 */
export async function storeLogbookPhoto(opts: {
  userId: string;
  diveId: string;
  dataUrl: string;
}): Promise<PhotoStorageRef> {
  const { userId, diveId, dataUrl } = opts;
  const parsed = parseLogbookPhotoDataUrl(dataUrl);

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return dataUrl;
  }

  const blob = await put(
    `logbook/${userId}/${diveId}/${Date.now()}.${parsed.ext}`,
    parsed.buffer,
    {
      access: 'private',
      contentType: parsed.contentType,
      addRandomSuffix: true,
    }
  );

  return blob.pathname;
}

/**
 * Reads a stored photo so it can be streamed to its owner. Returns null when the
 * reference points at inline data, which the caller decodes itself.
 */
export async function readStoredLogbookPhoto(ref: PhotoStorageRef) {
  if (isDataUrl(ref)) return null;

  const result = await get(ref, {
    access: isLegacyPublicUrl(ref) ? 'public' : 'private',
  });

  if (!result || result.statusCode !== 200) return null;

  return {
    stream: result.stream,
    contentType: result.blob.contentType,
  };
}

/**
 * Removes stored photo objects so deleted logbook content is erased from Blob
 * storage, not just from the database. Data URLs live only in the database row,
 * so they need no extra cleanup.
 */
export async function deleteStoredLogbookPhotos(
  refs: readonly PhotoStorageRef[]
): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return;

  const storedRefs = refs.filter((ref) => !isDataUrl(ref));
  if (storedRefs.length === 0) return;

  await del(storedRefs);
}

/** Decodes an inline data URL reference into bytes for streaming. */
export function decodeDataUrlPhoto(
  ref: PhotoStorageRef
): { buffer: Buffer; contentType: AllowedLogbookPhotoType } | null {
  try {
    const parsed = parseLogbookPhotoDataUrl(ref);
    return { buffer: parsed.buffer, contentType: parsed.contentType };
  } catch {
    return null;
  }
}
