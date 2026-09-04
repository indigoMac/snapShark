export function sharePath(token: string): string {
  return `/s/${token}`;
}

export function sharePhotoSrc(token: string, photoId: string): string {
  return `/api/share/${token}/photos/${photoId}`;
}

export function createShareToken(): string {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

/** Keep a live URL stable; mint a new token after a share is turned off. */
export function nextShareToken(
  enabled: boolean,
  current: string | null | undefined
): string | null {
  if (!enabled) return null;
  return current || createShareToken();
}
