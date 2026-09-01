import { put } from '@vercel/blob';

/**
 * Store a compressed image for the logbook.
 * Prefers Vercel Blob when BLOB_READ_WRITE_TOKEN is set; otherwise keeps a data URL
 * (fine for local/dev). Production should always set the blob token.
 */
export async function storeLogbookPhoto(opts: {
  userId: string;
  diveId: string;
  dataUrl: string;
}): Promise<string> {
  const { userId, diveId, dataUrl } = opts;

  if (!dataUrl.startsWith('data:image/')) {
    if (dataUrl.startsWith('https://')) return dataUrl;
    throw new Error('Photo must be a data URL or https image URL');
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
  const ext =
    contentType.includes('png')
      ? 'png'
      : contentType.includes('webp')
        ? 'webp'
        : 'jpg';

  const blob = await put(
    `logbook/${userId}/${diveId}/${Date.now()}.${ext}`,
    buffer,
    {
      access: 'public',
      contentType,
      addRandomSuffix: true,
    }
  );

  return blob.url;
}
