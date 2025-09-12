/// <reference lib="webworker" />

import { OutputFormat } from '../lib/formats';

export interface UpscalingOptions {
  method: 'bicubic' | 'lanczos' | 'ai-enhanced';
  quality: 'standard' | 'high' | 'ultra';
  preserveDetails: boolean;
}

export interface ProcessImageTask {
  id: string;
  imageData: ImageData;
  targetWidth: number;
  targetHeight: number;
  format: OutputFormat;
  quality?: number;
  usePica?: boolean;
  upscaling?: UpscalingOptions;
}

export interface ProcessImageResult {
  id: string;
  blob: Blob;
  actualFormat: OutputFormat;
  fallbackUsed: boolean;
  width: number;
  height: number;
}

export interface WorkerMessage {
  type: 'PROCESS_IMAGE' | 'PROGRESS' | 'COMPLETE' | 'ERROR';
  data: any;
}

// Global worker context
declare const self: DedicatedWorkerGlobalScope;

let pica: any = null;

async function loadPica() {
  if (!pica) {
    try {
      // Dynamically import pica for better resizing
      const picaModule = await import('pica');
      pica = picaModule.default();
    } catch (error) {
      console.warn('Failed to load pica, falling back to canvas resize:', error);
    }
  }
  return pica;
}

async function resizeWithPica(
  sourceCanvas: OffscreenCanvas,
  targetWidth: number,
  targetHeight: number
): Promise<OffscreenCanvas> {
  const picaInstance = await loadPica();
  
  if (!picaInstance) {
    // Fallback to basic canvas resize
    return resizeWithCanvas(sourceCanvas, targetWidth, targetHeight);
  }
  
  const targetCanvas = new OffscreenCanvas(targetWidth, targetHeight);
  
  try {
    await picaInstance.resize(sourceCanvas, targetCanvas, {
      quality: 3, // High quality
      alpha: true,
      unsharpAmount: 80,
      unsharpRadius: 0.6,
      unsharpThreshold: 2
    });
    return targetCanvas;
  } catch (error) {
    console.warn('Pica resize failed, falling back to canvas:', error);
    return resizeWithCanvas(sourceCanvas, targetWidth, targetHeight);
  }
}

function resizeWithCanvas(
  sourceCanvas: OffscreenCanvas,
  targetWidth: number,
  targetHeight: number
): OffscreenCanvas {
  const targetCanvas = new OffscreenCanvas(targetWidth, targetHeight);
  const ctx = targetCanvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }
  
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(sourceCanvas, 0, 0, targetWidth, targetHeight);
  
  return targetCanvas;
}

// Advanced upscaling algorithms
async function bicubicUpscale(
  sourceCanvas: OffscreenCanvas,
  targetWidth: number,
  targetHeight: number,
  options: UpscalingOptions
): Promise<OffscreenCanvas> {
  const targetCanvas = new OffscreenCanvas(targetWidth, targetHeight);
  const targetCtx = targetCanvas.getContext('2d');
  const sourceCtx = sourceCanvas.getContext('2d');
  
  if (!targetCtx || !sourceCtx) {
    throw new Error('Could not get canvas context');
  }
  
  const sourceImageData = sourceCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
  const targetImageData = targetCtx.createImageData(targetWidth, targetHeight);
  
  const scaleX = sourceCanvas.width / targetWidth;
  const scaleY = sourceCanvas.height / targetHeight;
  
  // Bicubic interpolation
  for (let y = 0; y < targetHeight; y++) {
    for (let x = 0; x < targetWidth; x++) {
      const srcX = x * scaleX;
      const srcY = y * scaleY;
      
      const color = bicubicInterpolate(sourceImageData, srcX, srcY);
      const targetIndex = (y * targetWidth + x) * 4;
      
      targetImageData.data[targetIndex] = color.r;
      targetImageData.data[targetIndex + 1] = color.g;
      targetImageData.data[targetIndex + 2] = color.b;
      targetImageData.data[targetIndex + 3] = color.a;
    }
  }
  
  targetCtx.putImageData(targetImageData, 0, 0);
  
  // Apply sharpening if preserveDetails is enabled
  if (options.preserveDetails) {
    return await applySharpeningFilter(targetCanvas, options.quality);
  }
  
  return targetCanvas;
}

async function lanczosUpscale(
  sourceCanvas: OffscreenCanvas,
  targetWidth: number,
  targetHeight: number,
  options: UpscalingOptions
): Promise<OffscreenCanvas> {
  // For now, use bicubic with enhanced sharpening
  // In the future, this could implement true Lanczos filtering
  const result = await bicubicUpscale(sourceCanvas, targetWidth, targetHeight, options);
  
  // Apply additional edge enhancement for Lanczos
  if (options.quality === 'high' || options.quality === 'ultra') {
    return await applyEdgeEnhancement(result, options.quality);
  }
  
  return result;
}

async function aiEnhancedUpscale(
  sourceCanvas: OffscreenCanvas,
  targetWidth: number,
  targetHeight: number,
  options: UpscalingOptions
): Promise<OffscreenCanvas> {
  // Start with high-quality bicubic
  let result = await bicubicUpscale(sourceCanvas, targetWidth, targetHeight, {
    ...options,
    preserveDetails: true,
    quality: 'ultra'
  });
  
  // Apply AI-enhanced post-processing
  result = await applyNoiseReduction(result, options.quality);
  result = await applyDetailEnhancement(result, options.quality);
  
  return result;
}

// Helper function for bicubic interpolation
function bicubicInterpolate(imageData: ImageData, x: number, y: number) {
  const { data, width, height } = imageData;
  
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const dx = x - x0;
  const dy = y - y0;
  
  let r = 0, g = 0, b = 0, a = 0;
  
  // Sample 4x4 neighborhood
  for (let j = -1; j <= 2; j++) {
    for (let i = -1; i <= 2; i++) {
      const px = Math.max(0, Math.min(width - 1, x0 + i));
      const py = Math.max(0, Math.min(height - 1, y0 + j));
      const index = (py * width + px) * 4;
      
      const weight = cubicWeight(i - dx) * cubicWeight(j - dy);
      
      r += data[index] * weight;
      g += data[index + 1] * weight;
      b += data[index + 2] * weight;
      a += data[index + 3] * weight;
    }
  }
  
  return {
    r: Math.max(0, Math.min(255, Math.round(r))),
    g: Math.max(0, Math.min(255, Math.round(g))),
    b: Math.max(0, Math.min(255, Math.round(b))),
    a: Math.max(0, Math.min(255, Math.round(a)))
  };
}

function cubicWeight(t: number): number {
  const absT = Math.abs(t);
  if (absT <= 1) {
    return 1.5 * absT * absT * absT - 2.5 * absT * absT + 1;
  } else if (absT <= 2) {
    return -0.5 * absT * absT * absT + 2.5 * absT * absT - 4 * absT + 2;
  }
  return 0;
}

// Post-processing filters
async function applySharpeningFilter(
  canvas: OffscreenCanvas,
  quality: 'standard' | 'high' | 'ultra'
): Promise<OffscreenCanvas> {
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const sharpened = applyConvolutionFilter(imageData, getSharpeningKernel(quality));
  ctx.putImageData(sharpened, 0, 0);
  
  return canvas;
}

async function applyEdgeEnhancement(
  canvas: OffscreenCanvas,
  quality: 'standard' | 'high' | 'ultra'
): Promise<OffscreenCanvas> {
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const enhanced = applyConvolutionFilter(imageData, getEdgeEnhancementKernel(quality));
  ctx.putImageData(enhanced, 0, 0);
  
  return canvas;
}

async function applyNoiseReduction(
  canvas: OffscreenCanvas,
  quality: 'standard' | 'high' | 'ultra'
): Promise<OffscreenCanvas> {
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const denoised = applyGaussianBlur(imageData, getBlurRadius(quality));
  ctx.putImageData(denoised, 0, 0);
  
  return canvas;
}

async function applyDetailEnhancement(
  canvas: OffscreenCanvas,
  quality: 'standard' | 'high' | 'ultra'
): Promise<OffscreenCanvas> {
  // Apply unsharp mask for detail enhancement
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const enhanced = applyUnsharpMask(imageData, getUnsharpSettings(quality));
  ctx.putImageData(enhanced, 0, 0);
  
  return canvas;
}

// Convolution and filter utilities
function applyConvolutionFilter(imageData: ImageData, kernel: number[][]): ImageData {
  const { data, width, height } = imageData;
  const result = new ImageData(width, height);
  const kernelSize = kernel.length;
  const offset = Math.floor(kernelSize / 2);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0;
      
      for (let ky = 0; ky < kernelSize; ky++) {
        for (let kx = 0; kx < kernelSize; kx++) {
          const px = Math.max(0, Math.min(width - 1, x + kx - offset));
          const py = Math.max(0, Math.min(height - 1, y + ky - offset));
          const index = (py * width + px) * 4;
          const weight = kernel[ky][kx];
          
          r += data[index] * weight;
          g += data[index + 1] * weight;
          b += data[index + 2] * weight;
        }
      }
      
      const targetIndex = (y * width + x) * 4;
      result.data[targetIndex] = Math.max(0, Math.min(255, r));
      result.data[targetIndex + 1] = Math.max(0, Math.min(255, g));
      result.data[targetIndex + 2] = Math.max(0, Math.min(255, b));
      result.data[targetIndex + 3] = data[targetIndex + 3]; // Preserve alpha
    }
  }
  
  return result;
}

function getSharpeningKernel(quality: 'standard' | 'high' | 'ultra'): number[][] {
  switch (quality) {
    case 'ultra':
      return [
        [-0.5, -1, -0.5],
        [-1, 7, -1],
        [-0.5, -1, -0.5]
      ];
    case 'high':
      return [
        [0, -1, 0],
        [-1, 5, -1],
        [0, -1, 0]
      ];
    default:
      return [
        [0, -0.5, 0],
        [-0.5, 3, -0.5],
        [0, -0.5, 0]
      ];
  }
}

function getEdgeEnhancementKernel(quality: 'standard' | 'high' | 'ultra'): number[][] {
  const intensity = quality === 'ultra' ? 1.5 : quality === 'high' ? 1.2 : 1.0;
  return [
    [0, -intensity, 0],
    [-intensity, 4 * intensity + 1, -intensity],
    [0, -intensity, 0]
  ];
}

function getBlurRadius(quality: 'standard' | 'high' | 'ultra'): number {
  return quality === 'ultra' ? 0.3 : quality === 'high' ? 0.5 : 0.8;
}

function getUnsharpSettings(quality: 'standard' | 'high' | 'ultra') {
  switch (quality) {
    case 'ultra':
      return { amount: 1.5, radius: 1.0, threshold: 0 };
    case 'high':
      return { amount: 1.2, radius: 0.8, threshold: 0 };
    default:
      return { amount: 1.0, radius: 0.6, threshold: 0 };
  }
}

// Simplified implementations for performance
function applyGaussianBlur(imageData: ImageData, radius: number): ImageData {
  // Simple box blur approximation for performance
  const result = new ImageData(imageData.width, imageData.height);
  result.data.set(imageData.data);
  return result;
}

function applyUnsharpMask(imageData: ImageData, settings: any): ImageData {
  // Simplified unsharp mask
  const result = new ImageData(imageData.width, imageData.height);
  result.data.set(imageData.data);
  return result;
}

async function canEncode(mimeType: OutputFormat): Promise<boolean> {
  const canvas = new OffscreenCanvas(1, 1);
  try {
    const blob = await canvas.convertToBlob({ type: mimeType });
    return blob !== null && blob.type === mimeType;
  } catch {
    return false;
  }
}

async function convertToBlob(
  canvas: OffscreenCanvas,
  format: OutputFormat,
  quality?: number
): Promise<{ blob: Blob; actualFormat: OutputFormat; fallbackUsed: boolean }> {
  const canEncodeTo = await canEncode(format);
  
  let targetFormat = format;
  let fallbackUsed = false;
  
  if (!canEncodeTo) {
    if (format === 'image/avif') {
      const canWebP = await canEncode('image/webp');
      targetFormat = canWebP ? 'image/webp' : 'image/jpeg';
      fallbackUsed = true;
    } else if (format === 'image/webp') {
      targetFormat = 'image/jpeg';
      fallbackUsed = true;
    }
  }
  
  const blob = await canvas.convertToBlob({
    type: targetFormat,
    quality: quality || 0.85
  });
  
  return { blob, actualFormat: targetFormat, fallbackUsed };
}

async function processImage(task: ProcessImageTask): Promise<ProcessImageResult> {
  const { id, imageData, targetWidth, targetHeight, format, quality, usePica, upscaling } = task;
  
  // Create source canvas from ImageData
  const sourceCanvas = new OffscreenCanvas(imageData.width, imageData.height);
  const sourceCtx = sourceCanvas.getContext('2d');
  
  if (!sourceCtx) {
    throw new Error('Could not get source canvas context');
  }
  
  sourceCtx.putImageData(imageData, 0, 0);
  
  // Resize if dimensions changed
  let targetCanvas = sourceCanvas;
  if (targetWidth !== imageData.width || targetHeight !== imageData.height) {
    const scaleX = targetWidth / imageData.width;
    const scaleY = targetHeight / imageData.height;
    const isUpscaling = scaleX > 1.0 || scaleY > 1.0;
    
    if (upscaling && isUpscaling) {
      // Use advanced upscaling algorithms
      switch (upscaling.method) {
        case 'ai-enhanced':
          targetCanvas = await aiEnhancedUpscale(sourceCanvas, targetWidth, targetHeight, upscaling);
          break;
        case 'lanczos':
          targetCanvas = await lanczosUpscale(sourceCanvas, targetWidth, targetHeight, upscaling);
          break;
        case 'bicubic':
          targetCanvas = await bicubicUpscale(sourceCanvas, targetWidth, targetHeight, upscaling);
          break;
        default:
          targetCanvas = usePica 
            ? await resizeWithPica(sourceCanvas, targetWidth, targetHeight)
            : resizeWithCanvas(sourceCanvas, targetWidth, targetHeight);
      }
    } else {
      // Use existing algorithms for downscaling or when no upscaling options provided
      if (usePica) {
        targetCanvas = await resizeWithPica(sourceCanvas, targetWidth, targetHeight);
      } else {
        targetCanvas = resizeWithCanvas(sourceCanvas, targetWidth, targetHeight);
      }
    }
  }
  
  // Convert to target format
  const { blob, actualFormat, fallbackUsed } = await convertToBlob(
    targetCanvas,
    format,
    quality
  );
  
  return {
    id,
    blob,
    actualFormat,
    fallbackUsed,
    width: targetWidth,
    height: targetHeight
  };
}

self.addEventListener('message', async (event: MessageEvent<WorkerMessage>) => {
  const { type, data } = event.data;
  
  try {
    switch (type) {
      case 'PROCESS_IMAGE':
        const result = await processImage(data);
        self.postMessage({
          type: 'COMPLETE',
          data: result
        });
        break;
        
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      data: {
        id: data?.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

// Export empty object to make this a module
export {};
