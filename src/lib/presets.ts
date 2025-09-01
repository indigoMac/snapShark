import { OutputFormat } from './formats';

export interface Preset {
  id: string;
  name: string;
  category: 'social' | 'web' | 'print' | 'custom';
  dimensions: { width: number; height: number }[];
  format?: OutputFormat;
  quality?: number;
  isPro: boolean;
  description?: string;
}

export const BUILT_IN_PRESETS: Preset[] = [
  // Social Media - Free
  {
    id: 'instagram-post',
    name: 'Instagram Post',
    category: 'social',
    dimensions: [{ width: 1080, height: 1080 }],
    format: 'image/jpeg',
    quality: 0.85,
    isPro: false,
    description: '1:1 square format for Instagram posts',
  },

  // Social Media - Pro
  {
    id: 'instagram-story',
    name: 'Instagram Story',
    category: 'social',
    dimensions: [{ width: 1080, height: 1920 }],
    format: 'image/jpeg',
    quality: 0.85,
    isPro: true,
    description: '9:16 vertical format for Instagram stories',
  },
  {
    id: 'facebook-cover',
    name: 'Facebook Cover',
    category: 'social',
    dimensions: [{ width: 820, height: 312 }],
    format: 'image/jpeg',
    quality: 0.85,
    isPro: true,
    description: 'Facebook page cover photo',
  },
  {
    id: 'linkedin-banner',
    name: 'LinkedIn Banner',
    category: 'social',
    dimensions: [{ width: 1584, height: 396 }],
    format: 'image/jpeg',
    quality: 0.85,
    isPro: true,
    description: 'LinkedIn profile banner',
  },

  // Web - Pro
  {
    id: 'web-4k',
    name: '4K Display',
    category: 'web',
    dimensions: [{ width: 3840, height: 2160 }],
    format: 'image/webp',
    quality: 0.8,
    isPro: true,
    description: '4K resolution for high-DPI displays',
  },
  {
    id: 'web-1440p',
    name: '1440p Display',
    category: 'web',
    dimensions: [{ width: 2560, height: 1440 }],
    format: 'image/webp',
    quality: 0.8,
    isPro: true,
    description: '1440p resolution for desktop displays',
  },
  {
    id: 'web-1080p',
    name: '1080p Display',
    category: 'web',
    dimensions: [{ width: 1920, height: 1080 }],
    format: 'image/webp',
    quality: 0.8,
    isPro: true,
    description: 'Full HD resolution',
  },
  {
    id: 'web-720p',
    name: '720p Display',
    category: 'web',
    dimensions: [{ width: 1280, height: 720 }],
    format: 'image/webp',
    quality: 0.8,
    isPro: true,
    description: 'HD resolution for smaller displays',
  },

  // App Icons - Pro
  {
    id: 'app-icons',
    name: 'App Icon Set',
    category: 'web',
    dimensions: [
      { width: 16, height: 16 },
      { width: 32, height: 32 },
      { width: 64, height: 64 },
      { width: 128, height: 128 },
      { width: 256, height: 256 },
      { width: 512, height: 512 },
    ],
    format: 'image/png',
    isPro: true,
    description: 'Complete set of app icon sizes',
  },

  // Print - Pro
  {
    id: 'print-a4',
    name: 'A4 Print (300 DPI)',
    category: 'print',
    dimensions: [{ width: 2480, height: 3508 }],
    format: 'image/jpeg',
    quality: 0.95,
    isPro: true,
    description: 'A4 size at 300 DPI for printing',
  },
  {
    id: 'print-a3',
    name: 'A3 Print (300 DPI)',
    category: 'print',
    dimensions: [{ width: 3508, height: 4961 }],
    format: 'image/jpeg',
    quality: 0.95,
    isPro: true,
    description: 'A3 size at 300 DPI for printing',
  },

  // Standard Print Sizes - Pro
  {
    id: 'print-4x6',
    name: '4×6 Photo Print',
    category: 'print',
    dimensions: [{ width: 1200, height: 1800 }],
    format: 'image/jpeg',
    quality: 0.95,
    isPro: true,
    description: '4×6 inch photo at 300 DPI',
  },
  {
    id: 'print-5x7',
    name: '5×7 Photo Print',
    category: 'print',
    dimensions: [{ width: 1500, height: 2100 }],
    format: 'image/jpeg',
    quality: 0.95,
    isPro: true,
    description: '5×7 inch photo at 300 DPI',
  },
  {
    id: 'print-8x10',
    name: '8×10 Photo Print',
    category: 'print',
    dimensions: [{ width: 2400, height: 3000 }],
    format: 'image/jpeg',
    quality: 0.95,
    isPro: true,
    description: '8×10 inch photo at 300 DPI',
  },
  {
    id: 'print-11x14',
    name: '11×14 Photo Print',
    category: 'print',
    dimensions: [{ width: 3300, height: 4200 }],
    format: 'image/jpeg',
    quality: 0.95,
    isPro: true,
    description: '11×14 inch photo at 300 DPI',
  },
  {
    id: 'print-16x20',
    name: '16×20 Poster Print',
    category: 'print',
    dimensions: [{ width: 4800, height: 6000 }],
    format: 'image/jpeg',
    quality: 0.95,
    isPro: true,
    description: '16×20 inch poster at 300 DPI',
  },
  {
    id: 'print-canvas-12x16',
    name: '12×16 Canvas Print',
    category: 'print',
    dimensions: [{ width: 3600, height: 4800 }],
    format: 'image/jpeg',
    quality: 0.95,
    isPro: true,
    description: '12×16 inch canvas at 300 DPI',
  },
  {
    id: 'print-canvas-16x24',
    name: '16×24 Canvas Print',
    category: 'print',
    dimensions: [{ width: 4800, height: 7200 }],
    format: 'image/jpeg',
    quality: 0.95,
    isPro: true,
    description: '16×24 inch canvas at 300 DPI',
  },
  {
    id: 'print-large-24x36',
    name: '24×36 Large Print',
    category: 'print',
    dimensions: [{ width: 7200, height: 10800 }],
    format: 'image/jpeg',
    quality: 0.95,
    isPro: true,
    description: '24×36 inch large format at 300 DPI',
  },

  // Print Bundles - Pro
  {
    id: 'print-bundle-photos',
    name: 'Photo Print Bundle',
    category: 'print',
    dimensions: [
      { width: 1200, height: 1800 }, // 4×6
      { width: 1500, height: 2100 }, // 5×7
      { width: 2400, height: 3000 }, // 8×10
      { width: 3300, height: 4200 }, // 11×14
    ],
    format: 'image/jpeg',
    quality: 0.95,
    isPro: true,
    description: 'Complete photo sizes: 4×6, 5×7, 8×10, 11×14',
  },
  {
    id: 'print-bundle-posters',
    name: 'Poster Print Bundle',
    category: 'print',
    dimensions: [
      { width: 4800, height: 6000 }, // 16×20
      { width: 4800, height: 7200 }, // 16×24
      { width: 7200, height: 10800 }, // 24×36
    ],
    format: 'image/jpeg',
    quality: 0.95,
    isPro: true,
    description: 'Large format sizes: 16×20, 16×24, 24×36',
  },
];

export function getPresetsByCategory(category: Preset['category']): Preset[] {
  return BUILT_IN_PRESETS.filter((preset) => preset.category === category);
}

export function getPresetById(id: string): Preset | undefined {
  return BUILT_IN_PRESETS.find((preset) => preset.id === id);
}

export function getFreePresets(): Preset[] {
  return BUILT_IN_PRESETS.filter((preset) => !preset.isPro);
}

export function getProPresets(): Preset[] {
  return BUILT_IN_PRESETS.filter((preset) => preset.isPro);
}
