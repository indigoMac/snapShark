import { describe, expect, it } from 'vitest';
import {
  clampVideoBitrate,
  evenOutputSize,
  normalizeFrameRate,
  recorderContainerType,
  scaleColorMatrix,
} from '@/lib/underwater-video';

const ONE_MINUTE = 60;
const MB = 1024 * 1024;
const PIXELS_1080P = 1920 * 1080;

describe('underwater video helpers', () => {
  it('caps output to 1080/1920 with even dimensions', () => {
    expect(evenOutputSize(3840, 2160)).toEqual({ width: 1920, height: 1080 });
    expect(evenOutputSize(1280, 720)).toEqual({ width: 1280, height: 720 });
  });

  it('blends a colour matrix toward identity as intensity drops', () => {
    const identityish = scaleColorMatrix(
      [2, 0, 0, 0, 0.5, 0, 2, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 1, 0],
      0
    );
    expect(identityish[0]).toBe(1);
    expect(identityish[6]).toBe(1);
    expect(identityish[12]).toBe(1);
    expect(identityish[4]).toBe(0);
  });

  it('encodes above the source bitrate so the transcode does not lose a generation', () => {
    const sourceBitsPerSecond = (40 * MB * 8) / ONE_MINUTE;
    const target = clampVideoBitrate(40 * MB, ONE_MINUTE, PIXELS_1080P, 30);

    expect(target).toBeGreaterThan(sourceBitsPerSecond);
  });

  it('scales the bitrate budget with output resolution and frame rate', () => {
    const at30 = clampVideoBitrate(200 * MB, ONE_MINUTE, PIXELS_1080P, 30);
    const at60 = clampVideoBitrate(200 * MB, ONE_MINUTE, PIXELS_1080P, 60);
    const at720p = clampVideoBitrate(200 * MB, ONE_MINUTE, 1280 * 720, 30);

    expect(at60).toBeGreaterThan(at30);
    expect(at720p).toBeLessThan(at30);
  });

  it('holds a floor for clips that were already heavily compressed', () => {
    expect(clampVideoBitrate(1 * MB, ONE_MINUTE, PIXELS_1080P, 30)).toBeGreaterThan(
      1_000_000
    );
  });

  it('falls back to 30fps for unusable frame rate measurements', () => {
    expect(normalizeFrameRate(Number.NaN)).toBe(30);
    expect(normalizeFrameRate(0)).toBe(30);
    expect(normalizeFrameRate(59.94)).toBe(60);
    expect(normalizeFrameRate(240)).toBe(60);
  });

  it('maps recorder mime types to a download container', () => {
    expect(recorderContainerType('video/mp4;codecs=avc1.640029,mp4a.40.2')).toBe(
      'video/mp4'
    );
    expect(recorderContainerType('video/webm;codecs=vp9,opus')).toBe('video/webm');
  });
});
