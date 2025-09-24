/**
 * Background Removal using MediaPipe Selfie Segmentation
 * Privacy-first, client-side implementation
 */

import { SelfieSegmentation } from '@mediapipe/selfie_segmentation';

export interface BackgroundRemovalOptions {
  modelSelection: 0 | 1; // 0 = general model (256x256), 1 = landscape model (144x256)
  threshold: number; // 0.1 to 0.9, confidence threshold for segmentation
  outputFormat: 'png' | 'webp'; // Output format (always transparent)
  quality: number; // 0.1 to 1.0, compression quality
  edgeSmoothing: boolean; // Apply edge smoothing to mask
  featherRadius: number; // Feather edge radius in pixels (0-10)
}

export interface BackgroundRemovalResult {
  blob: Blob;
  width: number;
  height: number;
  processingTime: number;
  confidence: number; // Average confidence of the segmentation
  method?: string;
}

class BackgroundRemovalProcessor {
  private selfieSegmentation: SelfieSegmentation | null = null;
  private isInitialized = false;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  async initialize(options: BackgroundRemovalOptions): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Check if MediaPipe is available
      if (typeof SelfieSegmentation === 'undefined') {
        throw new Error('MediaPipe Selfie Segmentation not available');
      }

      // Initialize MediaPipe Selfie Segmentation
      this.selfieSegmentation = new SelfieSegmentation({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
        },
      });

      await this.selfieSegmentation.setOptions({
        modelSelection: options.modelSelection,
        selfieMode: false, // Don't flip horizontally
      });

      this.isInitialized = true;
    } catch (error) {
      throw new Error(
        'Failed to initialize background removal engine. Please check your internet connection and try again.'
      );
    }
  }

  async removeBackground(
    imageElement: HTMLImageElement,
    options: BackgroundRemovalOptions
  ): Promise<BackgroundRemovalResult> {
    if (!this.isInitialized || !this.selfieSegmentation) {
      await this.initialize(options);
    }

    const startTime = performance.now();

    return new Promise((resolve, reject) => {
      try {
        // Set canvas dimensions
        this.canvas.width = imageElement.naturalWidth;
        this.canvas.height = imageElement.naturalHeight;

        // Process the image
        this.selfieSegmentation!.onResults(async (results) => {
          try {
            const result = await this.processSegmentationResults(
              imageElement,
              results,
              options,
              startTime
            );
            resolve(result);
          } catch (error) {
            reject(error);
          }
        });

        // Send image for processing
        this.selfieSegmentation!.send({ image: imageElement });
      } catch (error) {
        reject(error);
      }
    });
  }

  private async processSegmentationResults(
    originalImage: HTMLImageElement,
    results: any,
    options: BackgroundRemovalOptions,
    startTime: number
  ): Promise<BackgroundRemovalResult> {
    const { width, height } = this.canvas;

    // Clear canvas
    this.ctx.clearRect(0, 0, width, height);

    // Draw original image
    this.ctx.drawImage(originalImage, 0, 0, width, height);

    // Get image data
    const imageData = this.ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Get segmentation mask
    const segmentationMask = results.segmentationMask;
    const maskCanvas = document.createElement('canvas');
    const maskCtx = maskCanvas.getContext('2d')!;
    maskCanvas.width = segmentationMask.width;
    maskCanvas.height = segmentationMask.height;
    maskCtx.drawImage(segmentationMask, 0, 0);

    const maskImageData = maskCtx.getImageData(
      0,
      0,
      maskCanvas.width,
      maskCanvas.height
    );
    const maskData = maskImageData.data;

    // Calculate average confidence
    let totalConfidence = 0;
    let pixelCount = 0;

    // Apply segmentation mask
    for (let i = 0; i < data.length; i += 4) {
      const pixelIndex = i / 4;
      const maskX = Math.floor(
        (pixelIndex % width) * (maskCanvas.width / width)
      );
      const maskY = Math.floor(
        Math.floor(pixelIndex / width) * (maskCanvas.height / height)
      );
      const maskIndex = (maskY * maskCanvas.width + maskX) * 4;

      // Get mask confidence (red channel value normalized to 0-1)
      const confidence = maskData[maskIndex] / 255;
      totalConfidence += confidence;
      pixelCount++;

      // Apply threshold and set alpha
      if (confidence > options.threshold) {
        // Keep pixel - apply edge smoothing if enabled
        let alpha = 255;

        if (options.edgeSmoothing && confidence < 0.9) {
          // Smooth edges near threshold
          const smoothFactor =
            (confidence - options.threshold) / (0.9 - options.threshold);
          alpha = Math.round(255 * smoothFactor);
        }

        data[i + 3] = alpha; // Set alpha channel
      } else {
        // Remove pixel (transparent)
        data[i + 3] = 0;
      }
    }

    // Apply advanced edge processing
    this.applyAdvancedEdgeProcessing(data, width, height, options);

    // Put processed image data back
    this.ctx.putImageData(imageData, 0, 0);

    // Convert to blob
    const processingTime = performance.now() - startTime;
    const averageConfidence = totalConfidence / pixelCount;

    const blob = await new Promise<Blob>((resolve, reject) => {
      this.canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create output blob'));
          }
        },
        options.outputFormat === 'png' ? 'image/png' : 'image/webp',
        options.quality
      );
    });

    return {
      blob,
      width,
      height,
      processingTime,
      confidence: averageConfidence,
      method: 'AI Segmentation',
    };
  }

  private applyAdvancedEdgeProcessing(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    options: BackgroundRemovalOptions
  ): void {
    // Step 1: Morphological operations to smooth edges
    if (options.edgeSmoothing) {
      this.applyMorphologicalSmoothing(data, width, height);
    }

    // Step 2: Apply feathering with improved algorithm
    if (options.featherRadius > 0) {
      this.applyImprovedFeathering(data, width, height, options.featherRadius);
    }

    // Step 3: Anti-aliasing pass
    this.applyAntiAliasing(data, width, height);
  }

  private applyMorphologicalSmoothing(
    data: Uint8ClampedArray,
    width: number,
    height: number
  ): void {
    const tempData = new Uint8ClampedArray(data);
    const kernel = [
      [1, 1, 1],
      [1, 1, 1],
      [1, 1, 1],
    ];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const index = (y * width + x) * 4;
        const currentAlpha = tempData[index + 3];

        if (currentAlpha > 0 && currentAlpha < 255) {
          // Apply opening operation (erosion followed by dilation)
          let minAlpha = 255;
          let maxAlpha = 0;

          // Erosion
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const nIndex = ((y + ky) * width + (x + kx)) * 4;
              minAlpha = Math.min(minAlpha, tempData[nIndex + 3]);
            }
          }

          // Dilation
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const nIndex = ((y + ky) * width + (x + kx)) * 4;
              maxAlpha = Math.max(maxAlpha, minAlpha);
            }
          }

          // Smooth transition
          data[index + 3] = Math.round((currentAlpha + maxAlpha) / 2);
        }
      }
    }
  }

  private applyImprovedFeathering(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    radius: number
  ): void {
    const tempData = new Uint8ClampedArray(data);

    // Create distance transform for better feathering
    const distanceMap = this.createDistanceTransform(tempData, width, height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4;
        const currentAlpha = tempData[index + 3];
        const distance = distanceMap[y * width + x];

        if (currentAlpha > 0 && distance <= radius) {
          // Apply smooth falloff based on distance
          const falloff = distance / radius;
          const smoothFactor = 1 - falloff * falloff; // Quadratic falloff
          data[index + 3] = Math.round(currentAlpha * smoothFactor);
        }
      }
    }
  }

  private createDistanceTransform(
    data: Uint8ClampedArray,
    width: number,
    height: number
  ): Float32Array {
    const distances = new Float32Array(width * height);

    // Initialize distance map
    for (let i = 0; i < width * height; i++) {
      const alpha = data[i * 4 + 3];
      distances[i] = alpha === 0 ? 0 : alpha === 255 ? Infinity : 1;
    }

    // Forward pass
    for (let y = 1; y < height; y++) {
      for (let x = 1; x < width; x++) {
        const index = y * width + x;
        if (distances[index] !== 0) {
          distances[index] = Math.min(
            distances[index],
            distances[(y - 1) * width + x] + 1,
            distances[y * width + (x - 1)] + 1
          );
        }
      }
    }

    // Backward pass
    for (let y = height - 2; y >= 0; y--) {
      for (let x = width - 2; x >= 0; x--) {
        const index = y * width + x;
        if (distances[index] !== 0) {
          distances[index] = Math.min(
            distances[index],
            distances[(y + 1) * width + x] + 1,
            distances[y * width + (x + 1)] + 1
          );
        }
      }
    }

    return distances;
  }

  private applyAntiAliasing(
    data: Uint8ClampedArray,
    width: number,
    height: number
  ): void {
    const tempData = new Uint8ClampedArray(data);

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const index = (y * width + x) * 4;
        const currentAlpha = tempData[index + 3];

        // Only process edge pixels
        if (currentAlpha > 0 && currentAlpha < 255) {
          // Sample neighboring pixels for sub-pixel positioning
          const samples = [
            tempData[((y - 1) * width + (x - 1)) * 4 + 3], // top-left
            tempData[((y - 1) * width + x) * 4 + 3], // top
            tempData[((y - 1) * width + (x + 1)) * 4 + 3], // top-right
            tempData[(y * width + (x - 1)) * 4 + 3], // left
            tempData[(y * width + (x + 1)) * 4 + 3], // right
            tempData[((y + 1) * width + (x - 1)) * 4 + 3], // bottom-left
            tempData[((y + 1) * width + x) * 4 + 3], // bottom
            tempData[((y + 1) * width + (x + 1)) * 4 + 3], // bottom-right
          ];

          // Calculate weighted average with higher weight for center
          let weightedSum = currentAlpha * 4; // Center pixel gets 4x weight
          let totalWeight = 4;

          for (const sample of samples) {
            weightedSum += sample;
            totalWeight += 1;
          }

          data[index + 3] = Math.round(weightedSum / totalWeight);
        }
      }
    }
  }

  dispose(): void {
    if (this.selfieSegmentation) {
      this.selfieSegmentation.close();
      this.selfieSegmentation = null;
    }
    this.isInitialized = false;
  }
}

// Singleton instance
let processor: BackgroundRemovalProcessor | null = null;

export async function removeBackground(
  imageFile: File,
  options: Partial<BackgroundRemovalOptions> = {}
): Promise<BackgroundRemovalResult> {
  const defaultOptions: BackgroundRemovalOptions = {
    modelSelection: 1, // Use landscape model for better general performance
    threshold: 0.5, // Lower threshold for better edge detection
    outputFormat: 'png', // PNG for transparency
    quality: 0.98, // Very high quality
    edgeSmoothing: true, // Smooth edges
    featherRadius: 4, // Increased feathering for smoother edges
  };

  const finalOptions = { ...defaultOptions, ...options };

  // Initialize processor if needed
  if (!processor) {
    processor = new BackgroundRemovalProcessor();
  }

  // Load image
  const imageElement = await loadImageFromFile(imageFile);

  try {
    return await processor.removeBackground(imageElement, finalOptions);
  } catch (error) {
    // Background removal failed
    throw error;
  }
}

// Helper function to load image from file
function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

// Cleanup function
export function cleanupBackgroundRemoval(): void {
  if (processor) {
    processor.dispose();
    processor = null;
  }
}
