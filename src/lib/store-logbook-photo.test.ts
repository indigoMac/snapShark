import { describe, expect, it } from 'vitest';
import {
  decodeDataUrlPhoto,
  parseLogbookPhotoDataUrl,
  safeLogbookPhotoContentType,
} from '@/lib/store-logbook-photo';

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
