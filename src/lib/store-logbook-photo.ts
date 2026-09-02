import { del, get, put } from '@vercel/blob';

/**
 * Reference to a stored logbook photo: a private Blob pathname in production,
 * or a data URL when no blob store is configured (local development only).
 */
export type PhotoStorageRef = string;

function isDataUrl(ref: PhotoStorageRef): boolean {
  return ref.startsWith('data:');
}

/** Legacy references created before photos moved to private storage. */
function isLegacyPublicUrl(ref: PhotoStorageRef): boolean {
  return ref.startsWith('https://');
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

  if (!dataUrl.startsWith('data:image/')) {
    throw new Error('Photo must be a data URL');
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return dataUrl;
  }

  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(dataUrl);
  if (!match) {
    throw new Error('Invalid image data URL');
  }

  const contentType = match[1];
  const buffer = Buffer.from(match[2], 'base64');
  const ext = contentType.includes('png')
    ? 'png'
    : contentType.includes('webp')
      ? 'webp'
      : 'jpg';

  const blob = await put(
    `logbook/${userId}/${diveId}/${Date.now()}.${ext}`,
    buffer,
    {
      access: 'private',
      contentType,
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
): { buffer: Buffer; contentType: string } | null {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(ref);
  if (!match) return null;
  return { buffer: Buffer.from(match[2], 'base64'), contentType: match[1] };
}
