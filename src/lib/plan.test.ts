import { describe, expect, it } from 'vitest';
import {
  colourBatchAllowed,
  FREE_COLOUR_BATCH_LIMIT,
  FREE_PHOTO_LIMIT,
  photoLimitReached,
  PRO_COLOUR_BATCH_LIMIT,
} from '@/lib/plan';
import { createShareToken, nextShareToken, sharePath, sharePhotoSrc } from '@/lib/share-url';

describe('plan caps', () => {
  it('lets free accounts attach photos under the cap', () => {
    expect(photoLimitReached(false, FREE_PHOTO_LIMIT - 1)).toBe(false);
    expect(photoLimitReached(false, FREE_PHOTO_LIMIT)).toBe(true);
  });

  it('does not cap Pro photo storage', () => {
    expect(photoLimitReached(true, FREE_PHOTO_LIMIT + 80)).toBe(false);
  });

  it('allows a few colour-fixes on free, a full card on Pro', () => {
    expect(colourBatchAllowed(false, FREE_COLOUR_BATCH_LIMIT)).toBe(true);
    expect(colourBatchAllowed(false, FREE_COLOUR_BATCH_LIMIT + 1)).toBe(false);
    expect(colourBatchAllowed(true, PRO_COLOUR_BATCH_LIMIT)).toBe(true);
    expect(colourBatchAllowed(true, PRO_COLOUR_BATCH_LIMIT + 1)).toBe(false);
  });
});

describe('share tokens', () => {
  it('mints a URL-safe token long enough to be unguessable', () => {
    const token = createShareToken();
    expect(token).toMatch(/^[a-f0-9]+$/);
    expect(token.length).toBe(36);
  });

  it('keeps a live token and rotates after sharing is turned off', () => {
    const live = 'already-live-token-value';
    expect(nextShareToken(true, live)).toBe(live);
    expect(nextShareToken(false, live)).toBeNull();
    const minted = nextShareToken(true, null);
    expect(minted).toBeTruthy();
    expect(minted).not.toBe(live);
  });

  it('builds share paths from the token', () => {
    expect(sharePath('abc')).toBe('/s/abc');
    expect(sharePhotoSrc('abc', 'p1')).toBe('/api/share/abc/photos/p1');
  });
});
