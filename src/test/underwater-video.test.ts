import { describe, expect, it } from 'vitest';
import { evenOutputSize, scaleColorMatrix } from '@/lib/underwater-video';

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
});
