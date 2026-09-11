import { describe, expect, it } from 'vitest';
import { isImageMediaFile, isVideoMediaFile } from '@/lib/media-file';

function file(name: string, type: string) {
  return new File([''], name, { type });
}

describe('media file detection', () => {
  it('recognises images by MIME type', () => {
    expect(isImageMediaFile(file('photo.jpg', 'image/jpeg'))).toBe(true);
    expect(isVideoMediaFile(file('photo.jpg', 'image/jpeg'))).toBe(false);
  });

  it('recognises videos by MIME type', () => {
    expect(isVideoMediaFile(file('clip.mp4', 'video/mp4'))).toBe(true);
    expect(isVideoMediaFile(file('clip.mov', 'video/quicktime'))).toBe(true);
    expect(isImageMediaFile(file('clip.mp4', 'video/mp4'))).toBe(false);
  });

  it('falls back to extension when MIME type is empty', () => {
    expect(isVideoMediaFile(file('dive.MP4', ''))).toBe(true);
    expect(isVideoMediaFile(file('dive.mov', ''))).toBe(true);
    expect(isImageMediaFile(file('photo.HEIC', ''))).toBe(true);
    expect(isImageMediaFile(file('photo.jpeg', ''))).toBe(true);
  });

  it('falls back to extension for application/octet-stream', () => {
    expect(isVideoMediaFile(file('dive.mp4', 'application/octet-stream'))).toBe(
      true
    );
    expect(isImageMediaFile(file('photo.jpg', 'application/octet-stream'))).toBe(
      true
    );
  });

  it('rejects unknown files with no MIME type', () => {
    expect(isImageMediaFile(file('notes.txt', ''))).toBe(false);
    expect(isVideoMediaFile(file('notes.txt', ''))).toBe(false);
  });
});
