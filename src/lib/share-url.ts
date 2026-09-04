export function sharePath(token: string): string {
  return `/s/${token}`;
}

export function sharePhotoSrc(token: string, photoId: string): string {
  return `/api/share/${token}/photos/${photoId}`;
}

/**
 * Random unguessable token. Encoded as hex so we never depend on `btoa`,
 * which throws on binary strings in jsdom/CI.
 */
export function createShareToken(): string {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  let hex = '';
  for (let i = 0; i < bytes.length; i += 1) {
    hex += (bytes[i] as number).toString(16).padStart(2, '0');
  }
  return hex;
}

/** Keep a live URL stable; mint a new token after a share is turned off. */
export function nextShareToken(
  enabled: boolean,
  current: string | null | undefined
): string | null {
  if (!enabled) return null;
  return current || createShareToken();
}
