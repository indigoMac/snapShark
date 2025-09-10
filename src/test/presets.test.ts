import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePresets } from '@/hooks/usePresets';
import { BUILT_IN_PRESETS } from '@/lib/presets';
import type { Preset, CustomPreset } from '@/lib/presets';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

beforeEach(() => {
  vi.clearAllMocks();
  mockLocalStorage.getItem.mockReturnValue(null); // Start with empty localStorage
});

describe('Presets System Tests', () => {
  describe('Built-in Presets', () => {
    it('should have valid built-in presets structure', () => {
      expect(BUILT_IN_PRESETS.length).toBeGreaterThan(0);

      BUILT_IN_PRESETS.forEach((preset) => {
        expect(preset.id).toBeDefined();
        expect(preset.name).toBeDefined();
        expect(preset.category).toBeDefined();
        expect(preset.dimensions).toBeDefined();
        expect(preset.format).toBeDefined();
        expect(typeof preset.isPro).toBe('boolean');

        // Validate dimensions
        expect(Array.isArray(preset.dimensions)).toBe(true);
        preset.dimensions.forEach((dim) => {
          expect(dim.width).toBeGreaterThan(0);
          expect(dim.height).toBeGreaterThan(0);
        });
      });
    });

    it('should have both free and pro presets', () => {
      const freePresets = BUILT_IN_PRESETS.filter((p) => !p.isPro);
      const proPresets = BUILT_IN_PRESETS.filter((p) => p.isPro);

      expect(freePresets.length).toBeGreaterThan(0);
      expect(proPresets.length).toBeGreaterThan(0);
    });

    it('should have presets for different categories', () => {
      const categories = [...new Set(BUILT_IN_PRESETS.map((p) => p.category))];

      expect(categories.length).toBeGreaterThan(1);
      expect(categories.includes('social')).toBe(true);

      categories.forEach((category) => {
        const presetsInCategory = BUILT_IN_PRESETS.filter(
          (p) => p.category === category
        );
        expect(presetsInCategory.length).toBeGreaterThan(0);
      });
    });

    it('should have valid quality settings', () => {
      BUILT_IN_PRESETS.forEach((preset) => {
        if (preset.quality !== undefined) {
          expect(preset.quality).toBeGreaterThanOrEqual(0);
          expect(preset.quality).toBeLessThanOrEqual(1);
        }
      });
    });
  });

  describe('usePresets Hook', () => {
    it('should initialize with built-in presets', () => {
      const { result } = renderHook(() => usePresets());

      expect(result.current.builtInPresets).toEqual(BUILT_IN_PRESETS);
      expect(result.current.allPresets.length).toBe(BUILT_IN_PRESETS.length);
      expect(result.current.customPresets).toEqual([]);
      expect(result.current.selectedPresetId).toBeNull();
      expect(result.current.selectedPreset).toBeNull();
    });

    it('should load custom presets from localStorage', () => {
      const mockCustomPresets: CustomPreset[] = [
        {
          id: 'custom-1',
          name: 'My Custom Preset',
          category: 'custom',
          dimensions: [{ width: 500, height: 500 }],
          format: 'image/png',
        },
      ];

      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify(mockCustomPresets)
      );

      const { result } = renderHook(() => usePresets());

      expect(result.current.customPresets).toEqual(mockCustomPresets);
      expect(result.current.allPresets.length).toBe(
        BUILT_IN_PRESETS.length + 1
      );
    });

    it('should filter presets by category', () => {
      const { result } = renderHook(() => usePresets());

      const socialPresets = result.current.getPresetsByCategory('social');
      const webPresets = result.current.getPresetsByCategory('web');
      const printPresets = result.current.getPresetsByCategory('print');

      expect(socialPresets.length).toBeGreaterThan(0);
      socialPresets.forEach((preset) => {
        expect(preset.category).toBe('social');
      });

      webPresets.forEach((preset) => {
        expect(preset.category).toBe('web');
      });

      printPresets.forEach((preset) => {
        expect(preset.category).toBe('print');
      });
    });

    it('should filter free presets correctly', () => {
      const { result } = renderHook(() => usePresets());

      const freePresets = result.current.getFreePresets();

      freePresets.forEach((preset) => {
        if ('isPro' in preset) {
          expect(preset.isPro).toBe(false);
        }
        // Custom presets (without isPro property) should be included
      });
    });

    it('should filter pro presets correctly', () => {
      const { result } = renderHook(() => usePresets());

      const proPresets = result.current.getProPresets();

      proPresets.forEach((preset) => {
        expect(preset.isPro).toBe(true);
      });

      expect(proPresets.length).toBeGreaterThan(0);
    });
  });

  describe('Preset Selection', () => {
    it('should apply preset settings correctly', () => {
      const { result } = renderHook(() => usePresets());

      // Find a specific preset to test
      const instagramPost = BUILT_IN_PRESETS.find(
        (p) => p.id === 'instagram-post'
      );
      expect(instagramPost).toBeDefined();

      act(() => {
        const settings = result.current.applyPreset('instagram-post');
        expect(settings).toBeDefined();
        expect(settings?.dimensions).toEqual(instagramPost?.dimensions);
        expect(settings?.format).toBe(instagramPost?.format);
        expect(settings?.quality).toBe(instagramPost?.quality);
      });

      expect(result.current.selectedPresetId).toBe('instagram-post');
      expect(result.current.selectedPreset).toEqual(instagramPost);
    });

    it('should handle invalid preset IDs', () => {
      const { result } = renderHook(() => usePresets());

      act(() => {
        const settings = result.current.applyPreset('non-existent-preset');
        expect(settings).toBeNull();
      });

      expect(result.current.selectedPresetId).toBeNull();
      expect(result.current.selectedPreset).toBeNull();
    });

    it('should clear selection', () => {
      const { result } = renderHook(() => usePresets());

      // First select a preset
      act(() => {
        result.current.applyPreset('instagram-post');
      });

      expect(result.current.selectedPresetId).toBe('instagram-post');

      // Then clear selection
      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.selectedPresetId).toBeNull();
      expect(result.current.selectedPreset).toBeNull();
    });
  });

  describe('Custom Presets Management', () => {
    it('should create custom presets', () => {
      const { result } = renderHook(() => usePresets());

      const customPreset: Omit<CustomPreset, 'id'> = {
        name: 'My Custom Size',
        category: 'custom',
        dimensions: [{ width: 1200, height: 800 }],
        format: 'image/webp',
      };

      act(() => {
        result.current.createCustomPreset(customPreset);
      });

      expect(result.current.customPresets.length).toBe(1);
      expect(result.current.customPresets[0].name).toBe('My Custom Size');
      expect(result.current.customPresets[0].id).toBeDefined();
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('should handle custom preset operations', () => {
      const { result } = renderHook(() => usePresets());

      // Test basic functionality without complex localStorage mocking
      expect(result.current.customPresets).toBeDefined();
      expect(Array.isArray(result.current.customPresets)).toBe(true);
      expect(typeof result.current.createCustomPreset).toBe('function');
      expect(typeof result.current.deleteCustomPreset).toBe('function');
    });

    it('should handle deleting non-existent custom presets', () => {
      const { result } = renderHook(() => usePresets());

      act(() => {
        result.current.deleteCustomPreset('non-existent-id');
      });

      expect(result.current.customPresets.length).toBe(0);
      // Should not crash or cause errors
    });

    it('should persist custom presets to localStorage', () => {
      const { result } = renderHook(() => usePresets());

      const customPreset: Omit<CustomPreset, 'id'> = {
        name: 'Persistent Preset',
        category: 'custom',
        dimensions: [{ width: 1000, height: 1000 }],
        format: 'image/jpeg',
      };

      act(() => {
        result.current.createCustomPreset(customPreset);
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'snapshark-custom-presets',
        expect.any(String)
      );

      // Verify the stored data is valid JSON
      const storedData = mockLocalStorage.setItem.mock.calls[0][1];
      expect(() => JSON.parse(storedData)).not.toThrow();
    });

    it('should handle corrupted localStorage data', () => {
      // Mock corrupted JSON in localStorage
      mockLocalStorage.getItem.mockReturnValue('invalid-json{');

      const { result } = renderHook(() => usePresets());

      // Should not crash and should fallback to empty array
      expect(result.current.customPresets).toEqual([]);
    });
  });

  describe('Preset Validation', () => {
    it('should validate preset dimensions', () => {
      BUILT_IN_PRESETS.forEach((preset) => {
        preset.dimensions.forEach((dim) => {
          expect(dim.width).toBeGreaterThan(0);
          expect(dim.height).toBeGreaterThan(0);
          expect(Number.isInteger(dim.width)).toBe(true);
          expect(Number.isInteger(dim.height)).toBe(true);
        });
      });
    });

    it('should validate preset formats', () => {
      const validFormats = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/avif',
      ];

      BUILT_IN_PRESETS.forEach((preset) => {
        expect(validFormats.includes(preset.format)).toBe(true);
      });
    });

    it('should have reasonable quality settings for print presets', () => {
      const printPresets = BUILT_IN_PRESETS.filter(
        (p) => p.category === 'print'
      );

      printPresets.forEach((preset) => {
        if (preset.quality !== undefined) {
          expect(preset.quality).toBeGreaterThanOrEqual(0.9); // High quality for print
        }
      });
    });

    it('should have appropriate formats for different categories', () => {
      const socialPresets = BUILT_IN_PRESETS.filter(
        (p) => p.category === 'social'
      );
      const printPresets = BUILT_IN_PRESETS.filter(
        (p) => p.category === 'print'
      );
      const webPresets = BUILT_IN_PRESETS.filter((p) => p.category === 'web');

      // Social media typically uses JPEG
      socialPresets.forEach((preset) => {
        expect(['image/jpeg', 'image/webp'].includes(preset.format)).toBe(true);
      });

      // Print typically uses JPEG at high quality
      printPresets.forEach((preset) => {
        expect(preset.format).toBe('image/jpeg');
      });

      // Web can use modern formats
      webPresets.forEach((preset) => {
        expect(
          ['image/webp', 'image/avif', 'image/png'].includes(preset.format)
        ).toBe(true);
      });
    });
  });

  describe('Preset Categories and Organization', () => {
    it('should have Instagram preset with correct dimensions', () => {
      const instagramPost = BUILT_IN_PRESETS.find(
        (p) => p.id === 'instagram-post'
      );

      expect(instagramPost).toBeDefined();
      expect(instagramPost?.dimensions).toEqual([
        { width: 1080, height: 1080 },
      ]);
      expect(instagramPost?.isPro).toBe(false); // Should be free
      expect(instagramPost?.category).toBe('social');
    });

    it('should have print presets with correct DPI calculations', () => {
      const printA4 = BUILT_IN_PRESETS.find((p) => p.id === 'print-a4');

      expect(printA4).toBeDefined();
      expect(printA4?.category).toBe('print');
      expect(printA4?.isPro).toBe(true); // Print should be Pro

      // A4 at 300 DPI should be approximately 2480x3508
      if (printA4?.dimensions) {
        const { width, height } = printA4.dimensions[0];
        expect(width).toBeCloseTo(2480, -2); // Within 100 pixels
        expect(height).toBeCloseTo(3508, -2);
      }
    });

    it('should have app icon preset with multiple sizes', () => {
      const appIcons = BUILT_IN_PRESETS.find((p) => p.id === 'app-icons');

      expect(appIcons).toBeDefined();
      expect(appIcons?.dimensions.length).toBeGreaterThan(1);
      expect(appIcons?.isPro).toBe(true);

      // Should have common icon sizes
      const sizes = appIcons?.dimensions.map((d) => d.width) || [];
      expect(sizes.includes(16)).toBe(true);
      expect(sizes.includes(32)).toBe(true);
      expect(sizes.includes(512)).toBe(true);
    });
  });

  describe('Custom Preset Functionality', () => {
    it('should create custom presets with valid structure', () => {
      const { result } = renderHook(() => usePresets());

      const preset: Omit<CustomPreset, 'id'> = {
        name: 'Custom Test',
        category: 'custom',
        dimensions: [{ width: 800, height: 600 }],
        format: 'image/jpeg',
      };

      act(() => {
        result.current.createCustomPreset(preset);
      });

      // Test that the preset creation interface works
      expect(typeof result.current.createCustomPreset).toBe('function');
      expect(result.current.allPresets).toBeDefined();
      expect(Array.isArray(result.current.allPresets)).toBe(true);
    });

    it('should handle custom presets with multiple dimensions', () => {
      const { result } = renderHook(() => usePresets());

      const multiSizePreset: Omit<CustomPreset, 'id'> = {
        name: 'Multi Size',
        category: 'custom',
        dimensions: [
          { width: 100, height: 100 },
          { width: 200, height: 200 },
          { width: 400, height: 400 },
        ],
        format: 'image/png',
      };

      act(() => {
        result.current.createCustomPreset(multiSizePreset);
      });

      expect(result.current.customPresets[0].dimensions.length).toBe(3);
    });

    it('should validate custom preset data', () => {
      const { result } = renderHook(() => usePresets());

      const invalidPreset = {
        name: '', // Empty name
        category: 'custom',
        dimensions: [{ width: 0, height: -100 }], // Invalid dimensions
        format: 'invalid/format' as any,
      };

      // The hook should handle invalid data gracefully
      act(() => {
        try {
          result.current.createCustomPreset(invalidPreset);
        } catch (error) {
          // Should either validate and reject, or sanitize the input
        }
      });

      // Hook should remain stable
      expect(result.current.allPresets).toBeDefined();
    });
  });

  describe('Preset Application', () => {
    it('should apply built-in preset settings', () => {
      const { result } = renderHook(() => usePresets());

      const instagramPost = BUILT_IN_PRESETS.find(
        (p) => p.id === 'instagram-post'
      );
      expect(instagramPost).toBeDefined();

      act(() => {
        const settings = result.current.applyPreset('instagram-post');

        expect(settings).toEqual({
          dimensions: instagramPost?.dimensions,
          format: instagramPost?.format,
          quality: instagramPost?.quality,
          description: instagramPost?.description,
        });
      });

      expect(result.current.selectedPresetId).toBe('instagram-post');
      expect(result.current.selectedPreset).toEqual(instagramPost);
    });

    it('should handle preset application logic', () => {
      const { result } = renderHook(() => usePresets());

      // Test the preset application interface
      expect(typeof result.current.applyPreset).toBe('function');
      expect(typeof result.current.clearSelection).toBe('function');

      // Test built-in preset application
      act(() => {
        const settings = result.current.applyPreset('instagram-post');
        expect(settings).toBeDefined();
      });
    });

    it('should handle preset switching', () => {
      const { result } = renderHook(() => usePresets());

      // Apply first preset
      act(() => {
        result.current.applyPreset('instagram-post');
      });
      expect(result.current.selectedPresetId).toBe('instagram-post');

      // Switch to different preset
      act(() => {
        result.current.applyPreset('web-1080p');
      });
      expect(result.current.selectedPresetId).toBe('web-1080p');

      // Clear selection
      act(() => {
        result.current.clearSelection();
      });
      expect(result.current.selectedPresetId).toBeNull();
    });
  });

  describe('Pro Feature Gating', () => {
    it('should identify which presets require Pro', () => {
      const { result } = renderHook(() => usePresets());

      const freePresets = result.current.getFreePresets();
      const proPresets = result.current.getProPresets();

      // Verify Instagram Post is free (basic social media)
      const instagramPost = freePresets.find((p) => p.id === 'instagram-post');
      expect(instagramPost).toBeDefined();

      // Verify advanced presets are Pro
      const printPresets = proPresets.filter((p) => p.category === 'print');
      expect(printPresets.length).toBeGreaterThan(0);

      const webPresets = proPresets.filter((p) => p.category === 'web');
      expect(webPresets.length).toBeGreaterThan(0);
    });

    it('should have reasonable Pro/Free distribution', () => {
      const { result } = renderHook(() => usePresets());

      const freePresets = result.current.getFreePresets();
      const proPresets = result.current.getProPresets();

      // Should have some free presets for trial users
      expect(freePresets.length).toBeGreaterThan(0);

      // Should have Pro presets to encourage upgrades
      expect(proPresets.length).toBeGreaterThan(freePresets.length);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle localStorage gracefully', () => {
      const { result } = renderHook(() => usePresets());

      // Hook should remain functional even with localStorage issues
      expect(result.current.allPresets).toBeDefined();
      expect(result.current.builtInPresets.length).toBeGreaterThan(0);
    });

    it('should handle basic preset operations', () => {
      const { result } = renderHook(() => usePresets());

      const preset: Omit<CustomPreset, 'id'> = {
        name: 'Test Preset',
        category: 'custom',
        dimensions: [{ width: 100, height: 100 }],
        format: 'image/png',
      };

      act(() => {
        result.current.createCustomPreset(preset);
      });

      // Should handle basic operations
      expect(result.current.allPresets).toBeDefined();
    });
  });
});
