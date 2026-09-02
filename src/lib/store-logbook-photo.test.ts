import { describe, expect, it, vi, afterEach } from 'vitest';
import { put } from '@vercel/blob';
import {
  decodeDataUrlPhoto,
  parseLogbookPhotoDataUrl,
  safeLogbookPhotoContentType,
  storeLogbookPhoto,
} from '@/lib/store-logbook-photo';

vi.mock('@vercel/blob', () => ({
  put: vi.fn(),
  get: vi.fn(),
  del: vi.fn(),
}));

const jpegDataUrl = 'data:image/jpeg;base64,AAAA';
const pngDataUrl = 'data:image/png;base64,AAAA';
const webpDataUrl = 'data:image/webp;base64,AAAA';
const svgDataUrl =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjwvc3ZnPg==';

describe('parseLogbookPhotoDataUrl', () => {
  it('accepts jpeg, png, and webp', () => {
    expect(parseLogbookPhotoDataUrl(jpegDataUrl).contentType).toBe('image/jpeg');
    expect(parseLogbookPhotoDataUrl(pngDataUrl).contentType).toBe('image/png');
    expect(parseLogbookPhotoDataUrl(webpDataUrl).contentType).toBe('image/webp');
  });

  it('treats image/jpg as jpeg', () => {
    expect(
      parseLogbookPhotoDataUrl('data:image/jpg;base64,AAAA').contentType
    ).toBe('image/jpeg');
  });

  it('rejects SVG and other types', () => {
    expect(() => parseLogbookPhotoDataUrl(svgDataUrl)).toThrow(
      /JPEG, PNG, or WebP/
    );
    expect(() =>
      parseLogbookPhotoDataUrl('data:text/html;base64,AAAA')
    ).toThrow();
    try {
      parseLogbookPhotoDataUrl(svgDataUrl);
      throw new Error('expected throw');
    } catch (error) {
      expect((error as { status?: number }).status).toBe(400);
    }
  });
});

describe('safeLogbookPhotoContentType', () => {
  it('allowlists raster image types only', () => {
    expect(safeLogbookPhotoContentType('image/jpeg')).toBe('image/jpeg');
    expect(safeLogbookPhotoContentType('image/png; charset=utf-8')).toBe(
      'image/png'
    );
    expect(safeLogbookPhotoContentType('image/svg+xml')).toBeNull();
    expect(safeLogbookPhotoContentType('application/octet-stream')).toBeNull();
  });

  it('rejects empty content types', () => {
    expect(safeLogbookPhotoContentType(null)).toBeNull();
    expect(safeLogbookPhotoContentType(undefined)).toBeNull();
    expect(safeLogbookPhotoContentType('')).toBeNull();
  });
});

describe('decodeDataUrlPhoto', () => {
  it('returns null for SVG instead of serving it', () => {
    expect(decodeDataUrlPhoto(svgDataUrl)).toBeNull();
  });

  it('decodes an allowed jpeg', () => {
    const decoded = decodeDataUrlPhoto(jpegDataUrl);
    expect(decoded?.contentType).toBe('image/jpeg');
    expect(decoded?.buffer.length).toBeGreaterThan(0);
  });
});

describe('storeLogbookPhoto', () => {
  afterEach(() => {
    delete process.env.BLOB_READ_WRITE_TOKEN;
    vi.mocked(put).mockReset();
  });

  it('keeps the data URL when blob storage is not configured', async () => {
    const stored = await storeLogbookPhoto({
      userId: 'user-1',
      diveId: 'dive-1',
      dataUrl: jpegDataUrl,
    });
    expect(stored).toBe(jpegDataUrl);
    expect(put).not.toHaveBeenCalled();
  });

  it('uploads jpeg, png, and webp to private blob storage', async () => {
    process.env.BLOB_READ_WRITE_TOKEN = 'test-token';
    vi.mocked(put).mockImplementation(async (pathname) => ({
      pathname,
    }) as never);

    await storeLogbookPhoto({
      userId: 'user-1',
      diveId: 'dive-1',
      dataUrl: jpegDataUrl,
    });
    await storeLogbookPhoto({
      userId: 'user-1',
      diveId: 'dive-1',
      dataUrl: pngDataUrl,
    });
    await storeLogbookPhoto({
      userId: 'user-1',
      diveId: 'dive-1',
      dataUrl: webpDataUrl,
    });

    expect(put).toHaveBeenCalledTimes(3);
    const [jpegCall, pngCall, webpCall] = vi.mocked(put).mock.calls;
    expect(jpegCall[0]).toMatch(/^logbook\/user-1\/dive-1\/\d+\.jpg$/);
    expect(jpegCall[2]).toMatchObject({
      access: 'private',
      contentType: 'image/jpeg',
      addRandomSuffix: true,
    });
    expect(pngCall[0]).toMatch(/\.png$/);
    expect(pngCall[2]).toMatchObject({ contentType: 'image/png' });
    expect(webpCall[0]).toMatch(/\.webp$/);
    expect(webpCall[2]).toMatchObject({ contentType: 'image/webp' });
  });
});
