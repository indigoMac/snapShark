/**
 * Advanced Background Removal with Hybrid Approach
 * Combines AI segmentation with traditional computer vision for better edge quality
 */

export interface AdvancedBackgroundRemovalOptions {
  // AI Model options
  useAI: boolean;
  modelSelection: 0 | 1;
  aiThreshold: number;

  // Traditional CV options
  useEdgeDetection: boolean;
  cannyLowThreshold: number;
  cannyHighThreshold: number;

  // Refinement options
  morphologyKernelSize: number;
  gaussianBlurRadius: number;
  gradientFeathering: number;

  // Output options
  outputFormat: 'png' | 'webp';
  quality: number;
}

export interface AdvancedBackgroundRemovalResult {
  blob: Blob;
  width: number;
  height: number;
  processingTime: number;
  confidence: number;
  method: string;
}

class AdvancedBackgroundRemovalProcessor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private tempCanvas: HTMLCanvasElement;
  private tempCtx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
    this.tempCanvas = document.createElement('canvas');
    this.tempCtx = this.tempCanvas.getContext('2d')!;
  }

  async processImage(
    imageElement: HTMLImageElement,
    options: AdvancedBackgroundRemovalOptions
  ): Promise<AdvancedBackgroundRemovalResult> {
    const startTime = performance.now();
    const { width, height } = {
      width: imageElement.naturalWidth,
      height: imageElement.naturalHeight,
    };

    // Set canvas dimensions
    this.canvas.width = width;
    this.canvas.height = height;
    this.tempCanvas.width = width;
    this.tempCanvas.height = height;

    // Draw original image
    this.ctx.drawImage(imageElement, 0, 0, width, height);
    const imageData = this.ctx.getImageData(0, 0, width, height);

    let mask: Uint8ClampedArray;
    let method: string;

    if (options.useAI) {
      // Try AI first, fallback to traditional if it fails
      try {
        mask = await this.createAIMask(imageElement, options);
        method = 'AI + Refinement';
      } catch (error) {
        console.warn(
          'AI segmentation failed, falling back to traditional methods'
        );
        mask = this.createTraditionalMask(imageData, options);
        method = 'Traditional CV';
      }
    } else {
      mask = this.createTraditionalMask(imageData, options);
      method = 'Traditional CV';
    }

    // Apply advanced refinement to the mask
    const refinedMask = this.refineMask(mask, width, height, options);

    // Apply mask to image
    this.applyMaskToImage(imageData, refinedMask);

    // Put processed image back
    this.ctx.putImageData(imageData, 0, 0);

    // Convert to blob
    const blob = await this.canvasToBlob(options);
    const processingTime = performance.now() - startTime;

    return {
      blob,
      width,
      height,
      processingTime,
      confidence: this.calculateMaskConfidence(refinedMask),
      method,
    };
  }

  private createTraditionalMask(
    imageData: ImageData,
    options: AdvancedBackgroundRemovalOptions
  ): Uint8ClampedArray {
    const { width, height, data } = imageData;
    const mask = new Uint8ClampedArray(width * height);

    // Method 1: Color-based segmentation with automatic background detection
    const backgroundColors = this.detectBackgroundColors(data, width, height);

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const pixelIndex = i / 4;

      // Check if pixel is similar to detected background colors
      let isBackground = false;
      for (const bgColor of backgroundColors) {
        const colorDistance = Math.sqrt(
          Math.pow(r - bgColor.r, 2) +
            Math.pow(g - bgColor.g, 2) +
            Math.pow(b - bgColor.b, 2)
        );

        if (colorDistance < bgColor.tolerance) {
          isBackground = true;
          break;
        }
      }

      mask[pixelIndex] = isBackground ? 0 : 255;
    }

    // Method 2: Edge-based refinement
    if (options.useEdgeDetection) {
      const edges = this.detectEdges(data, width, height, options);
      this.refineWithEdges(mask, edges, width, height);
    }

    return mask;
  }

  private detectBackgroundColors(
    data: Uint8ClampedArray,
    width: number,
    height: number
  ): Array<{ r: number; g: number; b: number; tolerance: number }> {
    const cornerSamples = [];
    const sampleSize = Math.min(
      20,
      Math.floor(width * 0.1),
      Math.floor(height * 0.1)
    );

    // Sample corners and edges
    const regions = [
      // Top-left corner
      { startX: 0, startY: 0, endX: sampleSize, endY: sampleSize },
      // Top-right corner
      { startX: width - sampleSize, startY: 0, endX: width, endY: sampleSize },
      // Bottom-left corner
      {
        startX: 0,
        startY: height - sampleSize,
        endX: sampleSize,
        endY: height,
      },
      // Bottom-right corner
      {
        startX: width - sampleSize,
        startY: height - sampleSize,
        endX: width,
        endY: height,
      },
      // Top edge
      { startX: width * 0.4, startY: 0, endX: width * 0.6, endY: sampleSize },
      // Bottom edge
      {
        startX: width * 0.4,
        startY: height - sampleSize,
        endX: width * 0.6,
        endY: height,
      },
      // Left edge
      { startX: 0, startY: height * 0.4, endX: sampleSize, endY: height * 0.6 },
      // Right edge
      {
        startX: width - sampleSize,
        startY: height * 0.4,
        endX: width,
        endY: height * 0.6,
      },
    ];

    for (const region of regions) {
      for (let y = region.startY; y < region.endY; y++) {
        for (let x = region.startX; x < region.endX; x++) {
          const index = (y * width + x) * 4;
          cornerSamples.push({
            r: data[index],
            g: data[index + 1],
            b: data[index + 2],
          });
        }
      }
    }

    // Cluster similar colors
    const clusters = this.clusterColors(cornerSamples);

    // Return dominant background colors with appropriate tolerance
    return clusters.map((cluster) => ({
      ...cluster.center,
      tolerance: Math.max(30, cluster.variance * 2),
    }));
  }

  private clusterColors(colors: Array<{ r: number; g: number; b: number }>) {
    const clusters = [];
    const tolerance = 25;

    for (const color of colors) {
      let foundCluster = false;

      for (const cluster of clusters) {
        const distance = Math.sqrt(
          Math.pow(color.r - cluster.center.r, 2) +
            Math.pow(color.g - cluster.center.g, 2) +
            Math.pow(color.b - cluster.center.b, 2)
        );

        if (distance < tolerance) {
          cluster.colors.push(color);
          // Update cluster center
          cluster.center.r = Math.round(
            cluster.colors.reduce((sum, c) => sum + c.r, 0) /
              cluster.colors.length
          );
          cluster.center.g = Math.round(
            cluster.colors.reduce((sum, c) => sum + c.g, 0) /
              cluster.colors.length
          );
          cluster.center.b = Math.round(
            cluster.colors.reduce((sum, c) => sum + c.b, 0) /
              cluster.colors.length
          );
          foundCluster = true;
          break;
        }
      }

      if (!foundCluster) {
        clusters.push({
          center: { ...color },
          colors: [color],
          variance: 0,
        });
      }
    }

    // Calculate variance for each cluster
    for (const cluster of clusters) {
      let totalVariance = 0;
      for (const color of cluster.colors) {
        const distance = Math.sqrt(
          Math.pow(color.r - cluster.center.r, 2) +
            Math.pow(color.g - cluster.center.g, 2) +
            Math.pow(color.b - cluster.center.b, 2)
        );
        totalVariance += distance;
      }
      cluster.variance = totalVariance / cluster.colors.length;
    }

    // Sort by cluster size and return top 3
    return clusters
      .sort((a, b) => b.colors.length - a.colors.length)
      .slice(0, 3);
  }

  private detectEdges(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    options: AdvancedBackgroundRemovalOptions
  ): Uint8ClampedArray {
    // Convert to grayscale
    const gray = new Uint8ClampedArray(width * height);
    for (let i = 0; i < data.length; i += 4) {
      const pixelIndex = i / 4;
      gray[pixelIndex] = Math.round(
        0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
      );
    }

    // Apply Gaussian blur
    const blurred = this.gaussianBlur(gray, width, height, 1);

    // Sobel edge detection
    const edges = this.sobelEdgeDetection(blurred, width, height);

    // Double threshold (Canny algorithm)
    return this.doubleThreshold(
      edges,
      options.cannyLowThreshold,
      options.cannyHighThreshold
    );
  }

  private gaussianBlur(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    radius: number
  ): Uint8ClampedArray {
    const kernel = this.createGaussianKernel(radius);
    const result = new Uint8ClampedArray(width * height);
    const kernelSize = kernel.length;
    const kernelHalf = Math.floor(kernelSize / 2);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sum = 0;
        let weightSum = 0;

        for (let ky = 0; ky < kernelSize; ky++) {
          for (let kx = 0; kx < kernelSize; kx++) {
            const nx = x + kx - kernelHalf;
            const ny = y + ky - kernelHalf;

            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const weight = kernel[ky][kx];
              sum += data[ny * width + nx] * weight;
              weightSum += weight;
            }
          }
        }

        result[y * width + x] = Math.round(sum / weightSum);
      }
    }

    return result;
  }

  private createGaussianKernel(radius: number): number[][] {
    const size = 2 * radius + 1;
    const kernel = Array(size)
      .fill()
      .map(() => Array(size).fill(0));
    const sigma = radius / 3;
    const twoSigmaSquare = 2 * sigma * sigma;
    let sum = 0;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - radius;
        const dy = y - radius;
        const value = Math.exp(-(dx * dx + dy * dy) / twoSigmaSquare);
        kernel[y][x] = value;
        sum += value;
      }
    }

    // Normalize
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        kernel[y][x] /= sum;
      }
    }

    return kernel;
  }

  private sobelEdgeDetection(
    data: Uint8ClampedArray,
    width: number,
    height: number
  ): Uint8ClampedArray {
    const edges = new Uint8ClampedArray(width * height);

    const sobelX = [
      [-1, 0, 1],
      [-2, 0, 2],
      [-1, 0, 1],
    ];
    const sobelY = [
      [-1, -2, -1],
      [0, 0, 0],
      [1, 2, 1],
    ];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0;
        let gy = 0;

        for (let ky = 0; ky < 3; ky++) {
          for (let kx = 0; kx < 3; kx++) {
            const pixelValue = data[(y + ky - 1) * width + (x + kx - 1)];
            gx += pixelValue * sobelX[ky][kx];
            gy += pixelValue * sobelY[ky][kx];
          }
        }

        const magnitude = Math.sqrt(gx * gx + gy * gy);
        edges[y * width + x] = Math.min(255, magnitude);
      }
    }

    return edges;
  }

  private doubleThreshold(
    edges: Uint8ClampedArray,
    lowThreshold: number,
    highThreshold: number
  ): Uint8ClampedArray {
    const result = new Uint8ClampedArray(edges.length);

    for (let i = 0; i < edges.length; i++) {
      if (edges[i] >= highThreshold) {
        result[i] = 255; // Strong edge
      } else if (edges[i] >= lowThreshold) {
        result[i] = 128; // Weak edge
      } else {
        result[i] = 0; // No edge
      }
    }

    return result;
  }

  private refineWithEdges(
    mask: Uint8ClampedArray,
    edges: Uint8ClampedArray,
    width: number,
    height: number
  ): void {
    // Use edge information to refine mask boundaries
    for (let i = 0; i < mask.length; i++) {
      if (edges[i] > 128) {
        // Strong or weak edge
        // Look at neighboring mask values to decide
        const x = i % width;
        const y = Math.floor(i / width);

        let foregroundNeighbors = 0;
        let backgroundNeighbors = 0;

        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx;
            const ny = y + dy;

            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const neighborIndex = ny * width + nx;
              if (mask[neighborIndex] > 128) {
                foregroundNeighbors++;
              } else {
                backgroundNeighbors++;
              }
            }
          }
        }

        // Refine based on neighbor consensus
        if (foregroundNeighbors > backgroundNeighbors) {
          mask[i] = 255;
        } else {
          mask[i] = 0;
        }
      }
    }
  }

  private async createAIMask(
    imageElement: HTMLImageElement,
    options: AdvancedBackgroundRemovalOptions
  ): Promise<Uint8ClampedArray> {
    // This would use MediaPipe or another AI model
    // For now, return a placeholder that triggers fallback
    throw new Error('AI segmentation not available in this implementation');
  }

  private refineMask(
    mask: Uint8ClampedArray,
    width: number,
    height: number,
    options: AdvancedBackgroundRemovalOptions
  ): Uint8ClampedArray {
    let refined = new Uint8ClampedArray(mask);

    // Morphological operations
    if (options.morphologyKernelSize > 0) {
      refined = this.morphologicalClose(
        refined,
        width,
        height,
        options.morphologyKernelSize
      );
      refined = this.morphologicalOpen(
        refined,
        width,
        height,
        options.morphologyKernelSize
      );
    }

    // Gaussian blur for smooth edges
    if (options.gaussianBlurRadius > 0) {
      refined = this.gaussianBlur(
        refined,
        width,
        height,
        options.gaussianBlurRadius
      );
    }

    // Gradient feathering
    if (options.gradientFeathering > 0) {
      refined = this.applyGradientFeathering(
        refined,
        width,
        height,
        options.gradientFeathering
      );
    }

    return refined;
  }

  private morphologicalClose(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    kernelSize: number
  ): Uint8ClampedArray {
    const dilated = this.dilate(data, width, height, kernelSize);
    return this.erode(dilated, width, height, kernelSize);
  }

  private morphologicalOpen(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    kernelSize: number
  ): Uint8ClampedArray {
    const eroded = this.erode(data, width, height, kernelSize);
    return this.dilate(eroded, width, height, kernelSize);
  }

  private dilate(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    kernelSize: number
  ): Uint8ClampedArray {
    const result = new Uint8ClampedArray(data.length);
    const halfKernel = Math.floor(kernelSize / 2);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let maxValue = 0;

        for (let ky = -halfKernel; ky <= halfKernel; ky++) {
          for (let kx = -halfKernel; kx <= halfKernel; kx++) {
            const nx = x + kx;
            const ny = y + ky;

            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              maxValue = Math.max(maxValue, data[ny * width + nx]);
            }
          }
        }

        result[y * width + x] = maxValue;
      }
    }

    return result;
  }

  private erode(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    kernelSize: number
  ): Uint8ClampedArray {
    const result = new Uint8ClampedArray(data.length);
    const halfKernel = Math.floor(kernelSize / 2);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let minValue = 255;

        for (let ky = -halfKernel; ky <= halfKernel; ky++) {
          for (let kx = -halfKernel; kx <= halfKernel; kx++) {
            const nx = x + kx;
            const ny = y + ky;

            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              minValue = Math.min(minValue, data[ny * width + nx]);
            }
          }
        }

        result[y * width + x] = minValue;
      }
    }

    return result;
  }

  private applyGradientFeathering(
    mask: Uint8ClampedArray,
    width: number,
    height: number,
    radius: number
  ): Uint8ClampedArray {
    const result = new Uint8ClampedArray(mask);

    // Create distance field for smooth gradients
    const distanceField = this.createDistanceField(mask, width, height);

    for (let i = 0; i < mask.length; i++) {
      const distance = distanceField[i];
      if (distance <= radius) {
        const factor = distance / radius;
        const smoothFactor = 0.5 + 0.5 * Math.cos(factor * Math.PI);
        result[i] = Math.round(mask[i] * smoothFactor);
      }
    }

    return result;
  }

  private createDistanceField(
    mask: Uint8ClampedArray,
    width: number,
    height: number
  ): Float32Array {
    const distances = new Float32Array(width * height);

    // Initialize with large values
    for (let i = 0; i < distances.length; i++) {
      distances[i] = mask[i] > 128 ? 0 : Infinity;
    }

    // Forward pass
    for (let y = 1; y < height; y++) {
      for (let x = 1; x < width; x++) {
        const i = y * width + x;
        if (distances[i] > 0) {
          distances[i] = Math.min(
            distances[i],
            distances[(y - 1) * width + x] + 1,
            distances[y * width + (x - 1)] + 1
          );
        }
      }
    }

    // Backward pass
    for (let y = height - 2; y >= 0; y--) {
      for (let x = width - 2; x >= 0; x--) {
        const i = y * width + x;
        if (distances[i] > 0) {
          distances[i] = Math.min(
            distances[i],
            distances[(y + 1) * width + x] + 1,
            distances[y * width + (x + 1)] + 1
          );
        }
      }
    }

    return distances;
  }

  private applyMaskToImage(
    imageData: ImageData,
    mask: Uint8ClampedArray
  ): void {
    const { data } = imageData;

    for (let i = 0; i < data.length; i += 4) {
      const pixelIndex = i / 4;
      data[i + 3] = mask[pixelIndex]; // Set alpha channel
    }
  }

  private calculateMaskConfidence(mask: Uint8ClampedArray): number {
    let totalConfidence = 0;
    for (let i = 0; i < mask.length; i++) {
      totalConfidence += mask[i] / 255;
    }
    return totalConfidence / mask.length;
  }

  private async canvasToBlob(
    options: AdvancedBackgroundRemovalOptions
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      this.canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        },
        options.outputFormat === 'png' ? 'image/png' : 'image/webp',
        options.quality
      );
    });
  }
}

// Singleton instance
let advancedProcessor: AdvancedBackgroundRemovalProcessor | null = null;

export async function removeBackgroundAdvanced(
  imageFile: File,
  options: Partial<AdvancedBackgroundRemovalOptions> = {}
): Promise<AdvancedBackgroundRemovalResult> {
  const defaultOptions: AdvancedBackgroundRemovalOptions = {
    useAI: false, // Disable AI for now, use traditional CV
    modelSelection: 1,
    aiThreshold: 0.5,
    useEdgeDetection: true,
    cannyLowThreshold: 50,
    cannyHighThreshold: 150,
    morphologyKernelSize: 3,
    gaussianBlurRadius: 2,
    gradientFeathering: 8,
    outputFormat: 'png',
    quality: 0.98,
  };

  const finalOptions = { ...defaultOptions, ...options };

  // Initialize processor if needed
  if (!advancedProcessor) {
    advancedProcessor = new AdvancedBackgroundRemovalProcessor();
  }

  // Load image
  const imageElement = await loadImageFromFile(imageFile);

  return await advancedProcessor.processImage(imageElement, finalOptions);
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
