import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toBlobSafe } from '@/lib/canvas';
import { isLossyFormat } from '@/lib/formats';
import type { OutputFormat } from '@/lib/formats';

// Mock canvas setup
beforeEach(() => {
  global.HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    drawImage: vi.fn(),
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'high',
  }));

  // Mock different blob sizes based on quality for testing
  global.HTMLCanvasElement.prototype.toBlob = vi.fn(
    (callback, type, quality) => {
      const baseSize = 10000; // Base size in bytes
      let actualSize = baseSize;

      // Simulate quality affecting file size for lossy formats
      if (
        type === 'image/jpeg' ||
        type === 'image/webp' ||
        type === 'image/avif'
      ) {
        actualSize = Math.floor(
          baseSize * Math.max(0, Math.min(1, quality || 0.85))
        );
      }

      // Create mock blob with size simulation
      const mockBlob = new Blob(['x'.repeat(Math.max(1, actualSize))], {
        type: type || 'image/png',
      });
      callback(mockBlob);
    }
  );
});

describe('Compression and Quality Tests', () => {
  let mockCanvas: HTMLCanvasElement;

  beforeEach(() => {
    mockCanvas = document.createElement('canvas');
    mockCanvas.width = 100;
    mockCanvas.height = 100;
  });

  describe('Quality Settings', () => {
    it('should respect quality settings for lossy formats', async () => {
      const formats: OutputFormat[] = [
        'image/jpeg',
        'image/webp',
        'image/avif',
      ];

      for (const format of formats) {
        if (isLossyFormat(format)) {
          const lowQuality = await toBlobSafe(mockCanvas, format, 0.1);
          const highQuality = await toBlobSafe(mockCanvas, format, 0.9);

          expect(lowQuality.blob.size).toBeLessThan(highQuality.blob.size);
          expect(lowQuality.actualFormat).toBe(format);
          expect(highQuality.actualFormat).toBe(format);
        }
      }
    });

    it('should handle quality boundary values', async () => {
      const qualityValues = [0, 0.1, 0.5, 0.85, 1.0];

      for (const quality of qualityValues) {
        const result = await toBlobSafe(mockCanvas, 'image/jpeg', quality);
        expect(result.blob).toBeDefined();
        expect(result.blob.size).toBeGreaterThan(0);
      }
    });

    it('should ignore quality for lossless formats', async () => {
      const lowQuality = await toBlobSafe(mockCanvas, 'image/png', 0.1);
      const highQuality = await toBlobSafe(mockCanvas, 'image/png', 0.9);

      // PNG should have same size regardless of quality setting
      expect(lowQuality.blob.size).toBe(highQuality.blob.size);
    });

    it('should use default quality when not specified', async () => {
      const withoutQuality = await toBlobSafe(mockCanvas, 'image/jpeg');
      const withDefaultQuality = await toBlobSafe(
        mockCanvas,
        'image/jpeg',
        0.85
      );

      expect(withoutQuality.blob.size).toBe(withDefaultQuality.blob.size);
    });
  });

  describe('Format Optimization', () => {
    it('should choose appropriate format for different use cases', () => {
      // Test format selection logic
      expect(isLossyFormat('image/jpeg')).toBe(true); // Good for photos
      expect(isLossyFormat('image/png')).toBe(false); // Good for graphics
      expect(isLossyFormat('image/webp')).toBe(true); // Good for web
      expect(isLossyFormat('image/avif')).toBe(true); // Best compression
    });

    it('should handle format fallbacks correctly', async () => {
      // Test AVIF fallback chain
      const formats: OutputFormat[] = [
        'image/avif',
        'image/webp',
        'image/jpeg',
      ];

      for (const format of formats) {
        const result = await toBlobSafe(mockCanvas, format, 0.8);
        expect(result.blob).toBeDefined();
        expect(result.actualFormat).toBeDefined();
        // actualFormat might be different due to fallbacks
      }
    });
  });

  describe('File Size Validation', () => {
    it('should produce reasonable file sizes', async () => {
      const result = await toBlobSafe(mockCanvas, 'image/jpeg', 0.8);

      // Basic sanity checks
      expect(result.blob.size).toBeGreaterThan(0);
      expect(result.blob.size).toBeLessThan(1000000); // Less than 1MB for 100x100 canvas
    });

    it('should show quality impact on file size', async () => {
      const veryLowQuality = await toBlobSafe(mockCanvas, 'image/jpeg', 0.1);
      const veryHighQuality = await toBlobSafe(mockCanvas, 'image/jpeg', 1.0);

      expect(veryLowQuality.blob.size).toBeLessThan(veryHighQuality.blob.size);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very small canvas', async () => {
      const smallCanvas = document.createElement('canvas');
      smallCanvas.width = 1;
      smallCanvas.height = 1;

      const result = await toBlobSafe(smallCanvas, 'image/jpeg', 0.8);
      expect(result.blob).toBeDefined();
      expect(result.blob.size).toBeGreaterThan(0);
    });

    it('should handle large canvas dimensions', async () => {
      const largeCanvas = document.createElement('canvas');
      largeCanvas.width = 4000;
      largeCanvas.height = 4000;

      const result = await toBlobSafe(largeCanvas, 'image/jpeg', 0.8);
      expect(result.blob).toBeDefined();
    });

    it('should handle invalid quality values gracefully', async () => {
      // Test with out-of-range quality values
      const negativeQuality = await toBlobSafe(mockCanvas, 'image/jpeg', -0.5);
      const overMaxQuality = await toBlobSafe(mockCanvas, 'image/jpeg', 1.5);

      expect(negativeQuality.blob).toBeDefined();
      expect(overMaxQuality.blob).toBeDefined();
    });
  });

  describe('Performance Considerations', () => {
    it('should complete conversion within reasonable time', async () => {
      const start = Date.now();

      await toBlobSafe(mockCanvas, 'image/jpeg', 0.8);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle multiple concurrent conversions', async () => {
      const conversions = Array.from({ length: 5 }, () =>
        toBlobSafe(mockCanvas, 'image/jpeg', 0.8)
      );

      const results = await Promise.all(conversions);

      results.forEach((result) => {
        expect(result.blob).toBeDefined();
        expect(result.actualFormat).toBe('image/jpeg');
      });
    });
  });
});
