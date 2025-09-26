/**
 * Image vectorization for PNG to SVG conversion
 * Provides true vectorization of bitmap images using ImageTracerJS
 */

export interface VTracerOptions {
  // ImageTracerJS options for SVG generation
  // See: https://github.com/jankovicsandras/imagetracerjs

  // Tracing
  corsenabled?: boolean; // enable corner detection, default: false
  ltres?: number; // line threshold, default: 1
  qtres?: number; // quad threshold, default: 1
  pathomit?: number; // path omit threshold, default: 8

  // Color quantization
  colorsampling?: number; // 1 or 2, default: 2
  numberofcolors?: number; // number of colors, default: 16
  mincolorration?: number; // color ratio threshold, default: 0.02
  colorquantcycles?: number; // color quantization cycles, default: 3

  // SVG rendering
  scale?: number; // scaling factor, default: 1
  simplifytolerance?: number; // simplify tolerance, default: 0
  roundcoords?: number; // coordinate rounding, default: 1
  lcpr?: number; // line color precision, default: 0
  qcpr?: number; // quad color precision, default: 0
  desc?: boolean; // description, default: false
  viewbox?: boolean; // viewbox, default: false

  // Blur
  blurradius?: number; // blur radius, default: 0
  blurdelta?: number; // blur delta, default: 20
}

export interface VTracerResult {
  svg: string;
  width: number;
  height: number;
  processingTime: number;
}

class VTracerProcessor {
  private imageTracer: any = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Import ImageTracerJS - a pure JavaScript vectorization library
      const ImageTracer = await import('imagetracerjs');
      this.imageTracer = ImageTracer.default || ImageTracer;
      this.isInitialized = true;
    } catch (error) {
      throw new Error(
        'ImageTracer initialization failed. This feature requires the imagetracer module.'
      );
    }
  }

  async convertPngToSvg(
    imageData: ImageData,
    options: VTracerOptions = {}
  ): Promise<VTracerResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = performance.now();

    try {
      // Set default ImageTracer options optimized for web-friendly logos
      const tracerOptions = {
        // Color quantization - Reduced for smaller file sizes
        numberofcolors: options.numberofcolors ?? 8,
        colorsampling: options.colorsampling ?? 2,
        colorquantcycles: options.colorquantcycles ?? 3,
        mincolorration: options.mincolorration ?? 0.05,

        // Tracing - More aggressive simplification
        corsenabled: options.corsenabled ?? true,
        ltres: options.ltres ?? 1.5,
        qtres: options.qtres ?? 1.5,
        pathomit: options.pathomit ?? 20,

        // SVG rendering - Better path simplification
        scale: options.scale ?? 1,
        simplifytolerance: options.simplifytolerance ?? 1,
        roundcoords: options.roundcoords ?? 1,
        lcpr: options.lcpr ?? 0,
        qcpr: options.qcpr ?? 0,
        desc: options.desc ?? false,
        viewbox: options.viewbox ?? true,

        // Blur (disabled for sharp logos)
        blurradius: options.blurradius ?? 0,
        blurdelta: options.blurdelta ?? 20,
      };

      // Convert ImageData to SVG using ImageTracer
      const svgString = this.imageTracer.imagedataToSVG(
        imageData,
        tracerOptions
      );

      const processingTime = performance.now() - startTime;

      return {
        svg: svgString,
        width: imageData.width,
        height: imageData.height,
        processingTime,
      };
    } catch (error) {
      throw new Error(
        `SVG conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  dispose(): void {
    this.imageTracer = null;
    this.isInitialized = false;
  }
}

// Singleton instance
let processor: VTracerProcessor | null = null;

/**
 * Convert a PNG image to a true vectorized SVG using VTracer
 * @param imageData - The image data to convert
 * @param options - Configuration options for the conversion
 * @returns Promise resolving to the SVG result
 */
export async function convertImageToSvg(
  imageData: ImageData,
  options: VTracerOptions = {}
): Promise<VTracerResult> {
  // Initialize processor if needed
  if (!processor) {
    processor = new VTracerProcessor();
  }

  return await processor.convertPngToSvg(imageData, options);
}

/**
 * Convert a File (PNG/JPEG) to SVG
 * @param file - The image file to convert
 * @param options - Configuration options for the conversion
 * @returns Promise resolving to the SVG result
 */
export async function convertFileToSvg(
  file: File,
  options: VTracerOptions = {}
): Promise<VTracerResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = async () => {
      try {
        URL.revokeObjectURL(url);

        // Create canvas to get ImageData
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          throw new Error('Could not get canvas context');
        }

        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Convert to SVG
        const result = await convertImageToSvg(imageData, options);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Get optimal VTracer options for different use cases
 */
export const VTRACER_PRESETS = {
  // High quality for logos - prioritizes accuracy over file size
  logo: {
    numberofcolors: 32,
    colorsampling: 2,
    colorquantcycles: 4,
    corsenabled: true,
    ltres: 0.5,
    qtres: 0.5,
    pathomit: 4,
    roundcoords: 2,
    viewbox: true,
    blurradius: 0,
  } as VTracerOptions,

  // Balanced settings for general use - Web optimized
  balanced: {
    numberofcolors: 8,
    colorsampling: 2,
    colorquantcycles: 3,
    mincolorration: 0.05,
    corsenabled: true,
    ltres: 1.5,
    qtres: 1.5,
    pathomit: 20,
    simplifytolerance: 1,
    roundcoords: 1,
    viewbox: true,
    blurradius: 0,
  } as VTracerOptions,

  // Web optimized for smaller file sizes with good quality
  web_optimized: {
    numberofcolors: 6,
    colorsampling: 2,
    colorquantcycles: 3,
    mincolorration: 0.08,
    corsenabled: true,
    ltres: 2,
    qtres: 2,
    pathomit: 24,
    simplifytolerance: 1.5,
    roundcoords: 1,
    viewbox: true,
    blurradius: 0,
  } as VTracerOptions,

  // Fast conversion with lower quality
  fast: {
    numberofcolors: 8,
    colorsampling: 1,
    colorquantcycles: 2,
    corsenabled: false,
    ltres: 2,
    qtres: 2,
    pathomit: 16,
    roundcoords: 0,
    viewbox: true,
    blurradius: 0,
  } as VTracerOptions,

  // Maximum quality for detailed images
  high: {
    numberofcolors: 64,
    colorsampling: 2,
    colorquantcycles: 5,
    corsenabled: true,
    ltres: 0.25,
    qtres: 0.25,
    pathomit: 2,
    roundcoords: 3,
    viewbox: true,
    blurradius: 0,
  } as VTracerOptions,
} as const;

/**
 * Cleanup function to dispose of resources
 */
export function cleanupVTracer(): void {
  if (processor) {
    processor.dispose();
    processor = null;
  }
}
