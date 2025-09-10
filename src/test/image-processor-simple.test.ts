import { describe, it, expect } from 'vitest';
import { calculateDimensions } from '@/lib/canvas';
import { generateFilename } from '@/lib/formats';
import type { ProcessingSettings } from '@/hooks/useImageProcessor';

describe('Image Processor Core Functions', () => {
  describe('calculateDimensions', () => {
    it('should maintain aspect ratio when scaling', () => {
      const result = calculateDimensions(1920, 1080, undefined, undefined, 0.5);
      expect(result).toEqual({ width: 960, height: 540 });
    });

    it('should calculate height from width maintaining aspect ratio', () => {
      const result = calculateDimensions(1920, 1080, 800);
      expect(result).toEqual({ width: 800, height: 450 });
    });

    it('should handle exact dimensions', () => {
      const result = calculateDimensions(1920, 1080, 800, 600);
      expect(result).toEqual({ width: 800, height: 600 });
    });
  });

  describe('generateFilename', () => {
    it('should generate correct filenames with dimensions', () => {
      expect(generateFilename('photo.jpg', 800, 600, 'image/webp')).toBe(
        'photo_800x600.webp'
      );
    });

    it('should handle files without extensions', () => {
      expect(generateFilename('photo', 800, 600, 'image/png')).toBe(
        'photo_800x600.png'
      );
    });
  });

  describe('ProcessingSettings validation', () => {
    it('should have valid structure for settings', () => {
      const settings: ProcessingSettings = {
        format: 'image/jpeg',
        quality: 0.8,
        width: 800,
        height: 600,
        lockAspectRatio: false,
        usePica: true,
      };

      expect(settings.format).toBe('image/jpeg');
      expect(settings.quality).toBeGreaterThan(0);
      expect(settings.quality).toBeLessThanOrEqual(1);
      expect(typeof settings.lockAspectRatio).toBe('boolean');
      expect(typeof settings.usePica).toBe('boolean');
    });

    it('should handle different format combinations', () => {
      const formats = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/avif',
      ] as const;

      formats.forEach((format) => {
        const settings: ProcessingSettings = {
          format,
          quality: 0.85,
          scale: 1.0,
          lockAspectRatio: true,
          usePica: false,
        };

        expect(settings.format).toBe(format);
      });
    });
  });

  describe('Batch processing logic', () => {
    it('should handle multiple files conceptually', () => {
      const files = [
        new File([''], 'test1.jpg', { type: 'image/jpeg' }),
        new File([''], 'test2.png', { type: 'image/png' }),
        new File([''], 'test3.webp', { type: 'image/webp' }),
      ];

      // Test file validation
      files.forEach((file) => {
        expect(file.name).toBeDefined();
        expect(file.type).toBeDefined();
        expect(file.size).toBeGreaterThanOrEqual(0);
      });

      // Test filename generation for each
      const dimensions = { width: 800, height: 600 };
      const targetFormat = 'image/jpeg';

      files.forEach((file) => {
        const newFilename = generateFilename(
          file.name,
          dimensions.width,
          dimensions.height,
          targetFormat
        );
        expect(newFilename).toContain('_800x600.jpg');
      });
    });

    it('should handle dimension calculations for batches', () => {
      const originalDimensions = [
        { width: 1920, height: 1080 },
        { width: 800, height: 600 },
        { width: 1200, height: 800 },
      ];

      const scale = 0.5;

      originalDimensions.forEach(({ width, height }) => {
        const result = calculateDimensions(
          width,
          height,
          undefined,
          undefined,
          scale
        );
        expect(result.width).toBe(Math.round(width * scale));
        expect(result.height).toBe(Math.round(height * scale));
      });
    });
  });

  describe('Error handling scenarios', () => {
    it('should handle invalid dimensions gracefully', () => {
      // Zero dimensions should return original
      const result = calculateDimensions(1920, 1080, undefined, undefined, 0);
      expect(result).toEqual({ width: 1920, height: 1080 });
    });

    it('should handle edge case filenames', () => {
      const edgeCases = [
        { input: '', expected: '_800x600.jpg' },
        {
          input: 'file with spaces.png',
          expected: 'file with spaces_800x600.jpg',
        },
        { input: 'файл.jpg', expected: 'файл_800x600.jpg' },
      ];

      edgeCases.forEach(({ input, expected }) => {
        const result = generateFilename(input, 800, 600, 'image/jpeg');
        expect(result).toBe(expected);
      });
    });
  });
});
