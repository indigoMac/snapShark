import { describe, it, expect } from 'vitest';
import {
  isInputFormatSupported,
  isOutputFormatSupported,
  isLossyFormat,
  getFileExtension,
  getMimeTypeFromExtension,
  generateFilename,
  FORMAT_EXTENSIONS,
  FORMAT_NAMES,
  LOSSY_FORMATS,
  SUPPORTED_INPUT_FORMATS,
  SUPPORTED_OUTPUT_FORMATS,
  type InputFormat,
  type OutputFormat,
} from './formats';

describe('formats', () => {
  describe('isInputFormatSupported', () => {
    it('should return true for supported input formats', () => {
      expect(isInputFormatSupported('image/jpeg')).toBe(true);
      expect(isInputFormatSupported('image/png')).toBe(true);
      expect(isInputFormatSupported('image/webp')).toBe(true);
      expect(isInputFormatSupported('image/heic')).toBe(true);
    });

    it('should return false for unsupported formats', () => {
      expect(isInputFormatSupported('image/gif')).toBe(false);
      expect(isInputFormatSupported('image/bmp')).toBe(false);
      expect(isInputFormatSupported('text/plain')).toBe(false);
    });
  });

  describe('isOutputFormatSupported', () => {
    it('should return true for supported output formats', () => {
      expect(isOutputFormatSupported('image/jpeg')).toBe(true);
      expect(isOutputFormatSupported('image/png')).toBe(true);
      expect(isOutputFormatSupported('image/webp')).toBe(true);
      expect(isOutputFormatSupported('image/avif')).toBe(true);
    });

    it('should return false for unsupported output formats', () => {
      expect(isOutputFormatSupported('image/heic')).toBe(false);
      expect(isOutputFormatSupported('image/gif')).toBe(false);
    });
  });

  describe('isLossyFormat', () => {
    it('should return true for lossy formats', () => {
      expect(isLossyFormat('image/jpeg')).toBe(true);
      expect(isLossyFormat('image/webp')).toBe(true);
      expect(isLossyFormat('image/avif')).toBe(true);
    });

    it('should return false for lossless formats', () => {
      expect(isLossyFormat('image/png')).toBe(false);
    });
  });

  describe('getFileExtension', () => {
    it('should return correct extensions', () => {
      expect(getFileExtension('image/jpeg')).toBe('jpg');
      expect(getFileExtension('image/png')).toBe('png');
      expect(getFileExtension('image/webp')).toBe('webp');
      expect(getFileExtension('image/avif')).toBe('avif');
    });
  });

  describe('generateFilename', () => {
    it('should generate correct filenames', () => {
      expect(generateFilename('photo.jpg', 800, 600, 'image/webp')).toBe(
        'photo_800x600.webp'
      );

      expect(generateFilename('image.png', 1920, 1080, 'image/jpeg')).toBe(
        'image_1920x1080.jpg'
      );
    });

    it('should handle filenames without extensions', () => {
      expect(generateFilename('photo', 800, 600, 'image/png')).toBe(
        'photo_800x600.png'
      );
    });
  });

  describe('getMimeTypeFromExtension', () => {
    it('should return correct mime types for extensions', () => {
      expect(getMimeTypeFromExtension('jpg')).toBe('image/jpeg');
      expect(getMimeTypeFromExtension('.png')).toBe('image/png');
      expect(getMimeTypeFromExtension('WEBP')).toBe('image/webp');
      expect(getMimeTypeFromExtension('.AVIF')).toBe('image/avif');
    });

    it('should return null for unsupported extensions', () => {
      expect(getMimeTypeFromExtension('gif')).toBeNull();
      expect(getMimeTypeFromExtension('bmp')).toBeNull();
      expect(getMimeTypeFromExtension('txt')).toBeNull();
    });
  });

  describe('format validation edge cases', () => {
    it('should handle case sensitivity correctly', () => {
      expect(isInputFormatSupported('IMAGE/JPEG')).toBe(false); // Should be case sensitive
      expect(isInputFormatSupported('image/JPEG')).toBe(false); // Should be case sensitive
    });

    it('should handle invalid mime types', () => {
      expect(isInputFormatSupported('')).toBe(false);
      expect(isInputFormatSupported('not-a-mime-type')).toBe(false);
      expect(isOutputFormatSupported('image/unknown')).toBe(false);
    });
  });

  describe('lossy format detection', () => {
    it('should correctly identify all lossy formats', () => {
      const lossyFormats: OutputFormat[] = [
        'image/jpeg',
        'image/webp',
        'image/avif',
      ];
      lossyFormats.forEach((format) => {
        expect(isLossyFormat(format)).toBe(true);
      });
    });

    it('should correctly identify lossless formats', () => {
      expect(isLossyFormat('image/png')).toBe(false);
    });
  });

  describe('filename generation edge cases', () => {
    it('should handle filenames with multiple dots', () => {
      expect(
        generateFilename('my.photo.backup.jpg', 800, 600, 'image/webp')
      ).toBe('my.photo.backup_800x600.webp');
    });

    it('should handle special characters in filenames', () => {
      expect(generateFilename('photo (1).jpg', 800, 600, 'image/png')).toBe(
        'photo (1)_800x600.png'
      );
    });

    it('should handle very long filenames', () => {
      const longName = 'a'.repeat(100) + '.jpg';
      const result = generateFilename(longName, 800, 600, 'image/webp');
      expect(result).toContain('_800x600.webp');
      expect(result.length).toBeGreaterThan(100);
    });

    it('should handle zero dimensions', () => {
      expect(generateFilename('photo.jpg', 0, 0, 'image/png')).toBe(
        'photo_0x0.png'
      );
    });
  });

  describe('constants validation', () => {
    it('should have valid format constants', () => {
      expect(SUPPORTED_INPUT_FORMATS.length).toBeGreaterThan(0);
      expect(SUPPORTED_OUTPUT_FORMATS.length).toBeGreaterThan(0);
      expect(Object.keys(FORMAT_EXTENSIONS).length).toBe(
        SUPPORTED_OUTPUT_FORMATS.length
      );
    });

    it('should have format names for all output formats', () => {
      SUPPORTED_OUTPUT_FORMATS.forEach((format) => {
        expect(FORMAT_NAMES[format]).toBeDefined();
        expect(typeof FORMAT_NAMES[format]).toBe('string');
        expect(FORMAT_NAMES[format].length).toBeGreaterThan(0);
      });
    });

    it('should have extensions for all output formats', () => {
      SUPPORTED_OUTPUT_FORMATS.forEach((format) => {
        expect(FORMAT_EXTENSIONS[format]).toBeDefined();
        expect(typeof FORMAT_EXTENSIONS[format]).toBe('string');
        expect(FORMAT_EXTENSIONS[format].length).toBeGreaterThan(0);
      });
    });

    it('should have lossy formats array properly defined', () => {
      expect(LOSSY_FORMATS.length).toBeGreaterThan(0);
      LOSSY_FORMATS.forEach((format) => {
        expect(SUPPORTED_OUTPUT_FORMATS.includes(format)).toBe(true);
      });
    });
  });
});
