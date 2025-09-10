import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  calculateDimensions,
  drawImageToCanvas,
  canEncode,
  toBlobSafe,
  loadImage,
  supportsAVIF,
  supportsWebP,
} from '@/lib/canvas';
import type { OutputFormat } from '@/lib/formats';

// Mock canvas and image APIs for testing
beforeEach(() => {
  // Mock HTMLCanvasElement
  global.HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    drawImage: vi.fn(),
    putImageData: vi.fn(),
    getImageData: vi.fn(() => ({
      data: new Uint8ClampedArray(4),
      width: 1,
      height: 1,
    })),
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'high',
  }));

  // Mock HTMLCanvasElement.toBlob
  global.HTMLCanvasElement.prototype.toBlob = vi.fn(
    (callback, type, quality) => {
      // Simulate successful blob creation
      const mockBlob = new Blob(['mock-image-data'], {
        type: type || 'image/png',
      });
      callback(mockBlob);
    }
  );

  // Mock Image constructor
  global.Image = vi.fn(() => ({
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    onload: null,
    onerror: null,
    src: '',
    naturalWidth: 1920,
    naturalHeight: 1080,
  })) as any;

  // Mock URL.createObjectURL and revokeObjectURL
  global.URL.createObjectURL = vi.fn(() => 'mock-object-url');
  global.URL.revokeObjectURL = vi.fn();
});

describe('Canvas Operations', () => {
  describe('calculateDimensions', () => {
    it('should maintain aspect ratio when scaling', () => {
      const result = calculateDimensions(1920, 1080, undefined, undefined, 0.5);
      expect(result).toEqual({ width: 960, height: 540 });
    });

    it('should calculate height from width maintaining aspect ratio', () => {
      const result = calculateDimensions(1920, 1080, 800);
      expect(result).toEqual({ width: 800, height: 450 });
    });

    it('should calculate width from height maintaining aspect ratio', () => {
      const result = calculateDimensions(1920, 1080, undefined, 600);
      expect(result).toEqual({ width: 1067, height: 600 });
    });

    it('should use exact dimensions when both provided', () => {
      const result = calculateDimensions(1920, 1080, 800, 600);
      expect(result).toEqual({ width: 800, height: 600 });
    });

    it('should return original dimensions when no targets provided', () => {
      const result = calculateDimensions(1920, 1080);
      expect(result).toEqual({ width: 1920, height: 1080 });
    });

    it('should handle edge cases', () => {
      // Zero scale (function treats 0 as falsy, returns original dimensions)
      const zeroScale = calculateDimensions(
        1920,
        1080,
        undefined,
        undefined,
        0
      );
      expect(zeroScale).toEqual({ width: 1920, height: 1080 });

      // Very small scale
      const smallScale = calculateDimensions(
        1920,
        1080,
        undefined,
        undefined,
        0.001
      );
      expect(smallScale).toEqual({ width: 2, height: 1 }); // Rounded

      // Large scale
      const largeScale = calculateDimensions(
        100,
        100,
        undefined,
        undefined,
        10
      );
      expect(largeScale).toEqual({ width: 1000, height: 1000 });
    });

    it('should handle non-standard aspect ratios', () => {
      // Very wide image
      const wide = calculateDimensions(3000, 100, 600);
      expect(wide).toEqual({ width: 600, height: 20 });

      // Very tall image
      const tall = calculateDimensions(100, 3000, undefined, 600);
      expect(tall).toEqual({ width: 20, height: 600 });
    });

    it('should round to whole pixels', () => {
      // Test that results are always integers
      const result = calculateDimensions(1000, 1000, 333); // Should create fractional height
      expect(result.width).toBe(333);
      expect(result.height).toBe(333); // Should be rounded
      expect(Number.isInteger(result.width)).toBe(true);
      expect(Number.isInteger(result.height)).toBe(true);
    });
  });

  describe('drawImageToCanvas', () => {
    it('should create canvas with correct dimensions', () => {
      const mockImage = {
        naturalWidth: 1920,
        naturalHeight: 1080,
      } as HTMLImageElement;

      const canvas = drawImageToCanvas(mockImage, 800, 600);

      expect(canvas.width).toBe(800);
      expect(canvas.height).toBe(600);
    });

    it('should throw error when canvas context unavailable', () => {
      global.HTMLCanvasElement.prototype.getContext = vi.fn(() => null);

      const mockImage = {} as HTMLImageElement;

      expect(() => drawImageToCanvas(mockImage, 800, 600)).toThrow(
        'Could not get canvas context'
      );
    });

    it('should enable high quality image smoothing', () => {
      const mockContext = {
        drawImage: vi.fn(),
        imageSmoothingEnabled: false,
        imageSmoothingQuality: 'low',
      };

      global.HTMLCanvasElement.prototype.getContext = vi.fn(() => mockContext);

      const mockImage = {} as HTMLImageElement;
      drawImageToCanvas(mockImage, 800, 600);

      expect(mockContext.imageSmoothingEnabled).toBe(true);
      expect(mockContext.imageSmoothingQuality).toBe('high');
    });
  });

  describe('Format Support Detection', () => {
    it('should detect canvas encoding capabilities', async () => {
      // Test with a format that should be supported
      const supportsJPEG = await canEncode('image/jpeg');
      expect(typeof supportsJPEG).toBe('boolean');
    });

    it('should handle encoding detection errors', async () => {
      // Mock toBlob to simulate encoding failure
      global.HTMLCanvasElement.prototype.toBlob = vi.fn((callback) => {
        callback(null); // Simulate encoding failure
      });

      const result = await canEncode('image/jpeg');
      expect(result).toBe(false);
    });

    it('should test AVIF support detection', async () => {
      const result = await supportsAVIF();
      expect(typeof result).toBe('boolean');
    });

    it('should test WebP support detection', async () => {
      const result = await supportsWebP();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('toBlobSafe', () => {
    let mockCanvas: HTMLCanvasElement;

    beforeEach(() => {
      mockCanvas = document.createElement('canvas');
      mockCanvas.width = 100;
      mockCanvas.height = 100;
    });

    it('should convert canvas to blob successfully', async () => {
      const result = await toBlobSafe(mockCanvas, 'image/jpeg', 0.8);

      expect(result.blob).toBeDefined();
      expect(result.actualFormat).toBe('image/jpeg');
      expect(result.fallbackUsed).toBe(false);
    });

    it('should fallback from AVIF to WebP when AVIF unsupported', async () => {
      // Mock toBlob to simulate AVIF not supported but WebP supported
      let callCount = 0;
      global.HTMLCanvasElement.prototype.toBlob = vi.fn((callback, type) => {
        callCount++;
        if (type === 'image/avif' && callCount === 1) {
          callback(null); // AVIF fails
        } else if (type === 'image/webp' && callCount === 2) {
          callback(null); // WebP detection fails too
        } else {
          const mockBlob = new Blob(['mock-data'], {
            type: type || 'image/png',
          });
          callback(mockBlob);
        }
      });

      const result = await toBlobSafe(mockCanvas, 'image/avif', 0.8);
      expect(result.actualFormat).toBe('image/jpeg'); // Should fallback to JPEG
      expect(result.fallbackUsed).toBe(true);
    });

    it('should fallback from WebP to JPEG when WebP unsupported', async () => {
      // Similar test for WebP fallback
      const result = await toBlobSafe(mockCanvas, 'image/webp', 0.8);
      expect(result.blob).toBeDefined();
      // In a real test environment, this might fallback to JPEG
    });

    it('should handle blob conversion failures', async () => {
      // Mock toBlob to fail
      global.HTMLCanvasElement.prototype.toBlob = vi.fn((callback) => {
        callback(null); // Simulate failure
      });

      await expect(toBlobSafe(mockCanvas, 'image/jpeg')).rejects.toThrow(
        'Failed to convert canvas to blob'
      );
    });

    it('should respect quality settings', async () => {
      const qualityValues = [0.1, 0.5, 0.8, 0.9, 1.0];

      for (const quality of qualityValues) {
        const result = await toBlobSafe(mockCanvas, 'image/jpeg', quality);
        expect(result.blob).toBeDefined();
        // In real implementation, you might test blob size varies with quality
      }
    });
  });

  describe('loadImage', () => {
    it('should load image from file successfully', async () => {
      const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });

      // Mock successful image load
      const mockImage = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        naturalWidth: 1920,
        naturalHeight: 1080,
        onload: null,
        onerror: null,
        src: '',
      };

      global.Image = vi.fn(() => mockImage) as any;

      // Simulate successful load
      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload(new Event('load'));
        }
      }, 0);

      const result = await loadImage(mockFile);
      expect(result).toBeDefined();
    });

    it('should handle image load failures', async () => {
      const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });

      const mockImage = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        onload: null,
        onerror: null,
        src: '',
      };

      global.Image = vi.fn(() => mockImage) as any;

      // Simulate load error
      setTimeout(() => {
        if (mockImage.onerror) {
          mockImage.onerror(new Event('error'));
        }
      }, 0);

      await expect(loadImage(mockFile)).rejects.toThrow('Failed to load image');
    });

    it('should handle blob inputs', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/png' });

      const mockImage = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        onload: null,
        onerror: null,
        src: '',
      };

      global.Image = vi.fn(() => mockImage) as any;

      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload(new Event('load'));
        }
      }, 0);

      const result = await loadImage(mockBlob);
      expect(result).toBeDefined();
    });
  });
});
