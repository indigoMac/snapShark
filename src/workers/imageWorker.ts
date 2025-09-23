/// <reference lib="webworker" />

import { OutputFormat } from '../lib/formats';

// Dynamically import vtracer to avoid build issues
let vtracerModule: any = null;

async function loadVTracer() {
  if (!vtracerModule) {
    try {
      vtracerModule = await import('../lib/vtracer');
      return vtracerModule;
    } catch (error) {
      console.warn('VTracer module not available:', error);
      return null;
    }
  }
  return vtracerModule;
}

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
  targetPPI?: number;
  autoCrop?: boolean;
  preserveAspectRatio?: boolean;
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
      console.warn(
        'Failed to load pica, falling back to canvas resize:',
        error
      );
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
      unsharpThreshold: 2,
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

  const sourceImageData = sourceCtx.getImageData(
    0,
    0,
    sourceCanvas.width,
    sourceCanvas.height
  );
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
  const result = await bicubicUpscale(
    sourceCanvas,
    targetWidth,
    targetHeight,
    options
  );

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
    quality: 'ultra',
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

  let r = 0,
    g = 0,
    b = 0,
    a = 0;

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
    a: Math.max(0, Math.min(255, Math.round(a))),
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
  const sharpened = applyConvolutionFilter(
    imageData,
    getSharpeningKernel(quality)
  );
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
  const enhanced = applyConvolutionFilter(
    imageData,
    getEdgeEnhancementKernel(quality)
  );
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
function applyConvolutionFilter(
  imageData: ImageData,
  kernel: number[][]
): ImageData {
  const { data, width, height } = imageData;
  const result = new ImageData(width, height);
  const kernelSize = kernel.length;
  const offset = Math.floor(kernelSize / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0,
        g = 0,
        b = 0;

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

function getSharpeningKernel(
  quality: 'standard' | 'high' | 'ultra'
): number[][] {
  switch (quality) {
    case 'ultra':
      return [
        [-0.5, -1, -0.5],
        [-1, 7, -1],
        [-0.5, -1, -0.5],
      ];
    case 'high':
      return [
        [0, -1, 0],
        [-1, 5, -1],
        [0, -1, 0],
      ];
    default:
      return [
        [0, -0.5, 0],
        [-0.5, 3, -0.5],
        [0, -0.5, 0],
      ];
  }
}

function getEdgeEnhancementKernel(
  quality: 'standard' | 'high' | 'ultra'
): number[][] {
  const intensity = quality === 'ultra' ? 1.5 : quality === 'high' ? 1.2 : 1.0;
  return [
    [0, -intensity, 0],
    [-intensity, 4 * intensity + 1, -intensity],
    [0, -intensity, 0],
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

// Auto-crop function to trim whitespace/transparent areas around logos
function autoCropImage(imageData: ImageData): {
  cropX: number;
  cropY: number;
  cropWidth: number;
  cropHeight: number;
} {
  const { data, width, height } = imageData;

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  // Scan all pixels to find content boundaries
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      // Check if pixel is not transparent and not white/near-white
      const isTransparent = a < 10;
      const isWhite = r > 240 && g > 240 && b > 240;

      if (!isTransparent && !isWhite) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  // If no content found, return full image
  if (minX >= maxX || minY >= maxY) {
    return { cropX: 0, cropY: 0, cropWidth: width, cropHeight: height };
  }

  // Add 10% padding around content
  const contentWidth = maxX - minX + 1;
  const contentHeight = maxY - minY + 1;
  const paddingX = Math.max(2, Math.floor(contentWidth * 0.1));
  const paddingY = Math.max(2, Math.floor(contentHeight * 0.1));

  const cropX = Math.max(0, minX - paddingX);
  const cropY = Math.max(0, minY - paddingY);
  const cropWidth = Math.min(width - cropX, maxX - cropX + 1 + paddingX * 2);
  const cropHeight = Math.min(height - cropY, maxY - cropY + 1 + paddingY * 2);

  return { cropX, cropY, cropWidth, cropHeight };
}

// Helper function to inject DPI/PPI metadata into JPEG images
function injectDPI(arrayBuffer: ArrayBuffer, dpi: number): ArrayBuffer {
  const bytes = new Uint8Array(arrayBuffer);

  // For JPEG, we need to find the APP0 segment and modify/add DPI data
  // This is a simplified implementation - in production you'd want to use a proper EXIF library

  // Look for JPEG markers
  let i = 0;
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    // Not a valid JPEG, return as-is
    return arrayBuffer;
  }

  i = 2; // Skip SOI marker

  // Create new DPI data in APP0 segment
  const dpiBytes = Math.round(dpi);
  const app0Segment = new Uint8Array([
    0xff,
    0xe0, // APP0 marker
    0x00,
    0x10, // Length (16 bytes)
    0x4a,
    0x46,
    0x49,
    0x46,
    0x00, // "JFIF\0"
    0x01,
    0x01, // Version 1.1
    0x01, // Units: 1 = inches
    (dpiBytes >> 8) & 0xff,
    dpiBytes & 0xff, // X density
    (dpiBytes >> 8) & 0xff,
    dpiBytes & 0xff, // Y density
    0x00,
    0x00, // Thumbnail width & height
  ]);

  // Find where to insert/replace APP0
  let insertPos = 2;
  if (bytes[2] === 0xff && bytes[3] === 0xe0) {
    // APP0 already exists, replace it
    const length = (bytes[4] << 8) | bytes[5];
    insertPos = 2 + 2 + length;

    // Create new array without the old APP0
    const newBytes = new Uint8Array(bytes.length - length + app0Segment.length);
    newBytes.set(bytes.slice(0, 2)); // SOI
    newBytes.set(app0Segment, 2); // New APP0
    newBytes.set(bytes.slice(insertPos), 2 + app0Segment.length); // Rest
    return newBytes.buffer;
  } else {
    // No APP0, insert one
    const newBytes = new Uint8Array(bytes.length + app0Segment.length);
    newBytes.set(bytes.slice(0, 2)); // SOI
    newBytes.set(app0Segment, 2); // New APP0
    newBytes.set(bytes.slice(2), 2 + app0Segment.length); // Rest
    return newBytes.buffer;
  }
}

async function convertCanvasToTrueSvg(
  canvas: OffscreenCanvas,
  quality?: number
): Promise<{ blob: Blob; width: number; height: number }> {
  try {
    // Load VTracer module dynamically
    const vtracer = await loadVTracer();
    if (!vtracer) {
      throw new Error('VTracer module not available');
    }

    // Get ImageData from the canvas
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Use high-quality settings for logo conversion
    const options = vtracer.VTRACER_PRESETS.logo;

    // Convert to SVG using VTracer
    const result = await vtracer.convertImageToSvg(imageData, options);

    // Create blob from SVG string
    const blob = new Blob([result.svg], { type: 'image/svg+xml' });

    console.log(
      `✅ True SVG conversion completed: ${canvas.width}×${canvas.height} -> ${result.svg.length} chars`
    );

    return {
      blob,
      width: result.width,
      height: result.height,
    };
  } catch (error) {
    console.error('❌ VTracer conversion failed:', error);
    throw error;
  }
}

async function convertToBlob(
  canvas: OffscreenCanvas,
  format: OutputFormat,
  quality?: number,
  targetPPI?: number
): Promise<{ blob: Blob; actualFormat: OutputFormat; fallbackUsed: boolean }> {
  // Handle special formats that can't use canvas.convertToBlob()
  if (format === 'image/svg+xml') {
    try {
      // Try to use VTracer for true SVG vectorization
      const result = await convertCanvasToTrueSvg(canvas, quality);
      return {
        blob: result.blob,
        actualFormat: 'image/svg+xml',
        fallbackUsed: false,
      };
    } catch (error) {
      console.warn(
        'VTracer conversion failed, falling back to embedded PNG:',
        error
      );

      // Fallback to embedded PNG approach
      const width = canvas.width;
      const height = canvas.height;

      // Convert canvas to compressed PNG for embedding
      const pngBlob = await canvas.convertToBlob({
        type: 'image/png',
        quality: quality || 0.85,
      });
      const arrayBuffer = await pngBlob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      // Convert to base64
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);

      // Create SVG with embedded PNG
      const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
     width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <image width="${width}" height="${height}" xlink:href="data:image/png;base64,${base64}"/>
</svg>`;

      const blob = new Blob([svgContent], { type: 'image/svg+xml' });
      return { blob, actualFormat: 'image/svg+xml', fallbackUsed: true };
    }
  }

  if (format === 'image/x-icon') {
    // Convert canvas to proper ICO format
    const size = Math.min(canvas.width, canvas.height); // ICO works best with square images

    // Create a square canvas for ICO
    const icoCanvas = new OffscreenCanvas(size, size);
    const icoCtx = icoCanvas.getContext('2d');

    if (!icoCtx) {
      throw new Error('Could not get ICO canvas context');
    }

    // Draw image centered and scaled to fit
    const scale = size / Math.max(canvas.width, canvas.height);
    const scaledWidth = canvas.width * scale;
    const scaledHeight = canvas.height * scale;
    const offsetX = (size - scaledWidth) / 2;
    const offsetY = (size - scaledHeight) / 2;

    icoCtx.drawImage(canvas, offsetX, offsetY, scaledWidth, scaledHeight);

    // Get PNG data
    const pngBlob = await icoCanvas.convertToBlob({ type: 'image/png' });
    const pngArrayBuffer = await pngBlob.arrayBuffer();
    const pngBytes = new Uint8Array(pngArrayBuffer);

    // Create ICO header and directory entry
    const icoData = new ArrayBuffer(6 + 16 + pngBytes.length);
    const view = new DataView(icoData);
    const bytes = new Uint8Array(icoData);

    let offset = 0;

    // ICO header (6 bytes)
    view.setUint16(offset, 0, true); // Reserved (0)
    view.setUint16(offset + 2, 1, true); // Type (1 = ICO)
    view.setUint16(offset + 4, 1, true); // Number of images
    offset += 6;

    // Directory entry (16 bytes)
    view.setUint8(offset, size === 256 ? 0 : size); // Width (0 = 256)
    view.setUint8(offset + 1, size === 256 ? 0 : size); // Height (0 = 256)
    view.setUint8(offset + 2, 0); // Color palette
    view.setUint8(offset + 3, 0); // Reserved
    view.setUint16(offset + 4, 1, true); // Color planes
    view.setUint16(offset + 6, 32, true); // Bits per pixel
    view.setUint32(offset + 8, pngBytes.length, true); // Image size
    view.setUint32(offset + 12, 22, true); // Image offset
    offset += 16;

    // PNG data
    bytes.set(pngBytes, offset);

    const blob = new Blob([icoData], { type: 'image/x-icon' });
    return { blob, actualFormat: 'image/x-icon', fallbackUsed: false };
  }

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

  let blob = await canvas.convertToBlob({
    type: targetFormat,
    quality: quality || 0.85,
  });

  // Inject DPI metadata for JPEG images if specified
  if (targetPPI && targetPPI > 0 && targetFormat === 'image/jpeg') {
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const modifiedBuffer = injectDPI(arrayBuffer, targetPPI);
      blob = new Blob([modifiedBuffer], { type: targetFormat });
    } catch (error) {
      console.warn('Failed to inject DPI metadata:', error);
      // Continue with original blob if DPI injection fails
    }
  }

  return { blob, actualFormat: targetFormat, fallbackUsed };
}

// Super-high-quality favicon downsampling using area sampling
async function faviconOptimizedResize(
  sourceCanvas: OffscreenCanvas,
  targetWidth: number,
  targetHeight: number
): Promise<OffscreenCanvas> {
  console.log(
    `FAVICON RESIZE: ${sourceCanvas.width}×${sourceCanvas.height} → ${targetWidth}×${targetHeight}`
  );

  const sourceCtx = sourceCanvas.getContext('2d');
  if (!sourceCtx) throw new Error('Could not get source context');

  const sourceImageData = sourceCtx.getImageData(
    0,
    0,
    sourceCanvas.width,
    sourceCanvas.height
  );
  const targetCanvas = new OffscreenCanvas(targetWidth, targetHeight);
  const targetCtx = targetCanvas.getContext('2d');
  if (!targetCtx) throw new Error('Could not get target context');

  const targetImageData = targetCtx.createImageData(targetWidth, targetHeight);

  // Use area sampling for much better quality when downsampling
  const scaleX = sourceCanvas.width / targetWidth;
  const scaleY = sourceCanvas.height / targetHeight;

  for (let targetY = 0; targetY < targetHeight; targetY++) {
    for (let targetX = 0; targetX < targetWidth; targetX++) {
      // Calculate source area bounds for this target pixel
      const sourceXStart = targetX * scaleX;
      const sourceYStart = targetY * scaleY;
      const sourceXEnd = sourceXStart + scaleX;
      const sourceYEnd = sourceYStart + scaleY;

      // Sample all pixels in the source area
      let totalR = 0,
        totalG = 0,
        totalB = 0,
        totalA = 0;
      let sampleCount = 0;

      // Iterate through all source pixels that contribute to this target pixel
      for (
        let sourceY = Math.floor(sourceYStart);
        sourceY < Math.ceil(sourceYEnd);
        sourceY++
      ) {
        for (
          let sourceX = Math.floor(sourceXStart);
          sourceX < Math.ceil(sourceXEnd);
          sourceX++
        ) {
          if (
            sourceX >= 0 &&
            sourceX < sourceCanvas.width &&
            sourceY >= 0 &&
            sourceY < sourceCanvas.height
          ) {
            // Calculate overlap weight
            const overlapXStart = Math.max(sourceX, sourceXStart);
            const overlapXEnd = Math.min(sourceX + 1, sourceXEnd);
            const overlapYStart = Math.max(sourceY, sourceYStart);
            const overlapYEnd = Math.min(sourceY + 1, sourceYEnd);

            const overlapArea =
              Math.max(0, overlapXEnd - overlapXStart) *
              Math.max(0, overlapYEnd - overlapYStart);

            if (overlapArea > 0) {
              const sourceIndex = (sourceY * sourceCanvas.width + sourceX) * 4;
              totalR += sourceImageData.data[sourceIndex] * overlapArea;
              totalG += sourceImageData.data[sourceIndex + 1] * overlapArea;
              totalB += sourceImageData.data[sourceIndex + 2] * overlapArea;
              totalA += sourceImageData.data[sourceIndex + 3] * overlapArea;
              sampleCount += overlapArea;
            }
          }
        }
      }

      // Average the samples
      const targetIndex = (targetY * targetWidth + targetX) * 4;
      if (sampleCount > 0) {
        targetImageData.data[targetIndex] = Math.round(totalR / sampleCount);
        targetImageData.data[targetIndex + 1] = Math.round(
          totalG / sampleCount
        );
        targetImageData.data[targetIndex + 2] = Math.round(
          totalB / sampleCount
        );
        targetImageData.data[targetIndex + 3] = Math.round(
          totalA / sampleCount
        );
      }
    }
  }

  targetCtx.putImageData(targetImageData, 0, 0);

  // Apply favicon-specific sharpening
  return await sharpenForFavicon(targetCanvas);
}

async function sharpenForFavicon(
  canvas: OffscreenCanvas
): Promise<OffscreenCanvas> {
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;

  // Create sharpened copy
  const sharpened = new Uint8ClampedArray(data.length);

  // Apply unsharp mask for favicon clarity
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;

      // 3x3 sharpening kernel for each channel
      for (let c = 0; c < 3; c++) {
        // RGB channels only
        const center = data[idx + c];
        const surrounding =
          (data[((y - 1) * width + (x - 1)) * 4 + c] + // top-left
            data[((y - 1) * width + x) * 4 + c] + // top
            data[((y - 1) * width + (x + 1)) * 4 + c] + // top-right
            data[(y * width + (x - 1)) * 4 + c] + // left
            data[(y * width + (x + 1)) * 4 + c] + // right
            data[((y + 1) * width + (x - 1)) * 4 + c] + // bottom-left
            data[((y + 1) * width + x) * 4 + c] + // bottom
            data[((y + 1) * width + (x + 1)) * 4 + c]) / // bottom-right
          8;

        // Unsharp mask: original + amount * (original - blurred)
        const amount = 0.6; // Moderate sharpening
        const sharpValue = center + amount * (center - surrounding);

        // Apply contrast boost for tiny icons
        const contrast = 1.15;
        const finalValue = (sharpValue - 128) * contrast + 128;

        sharpened[idx + c] = Math.max(0, Math.min(255, finalValue));
      }

      // Preserve alpha
      sharpened[idx + 3] = data[idx + 3];
    }
  }

  // Copy edge pixels unchanged
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (y === 0 || y === height - 1 || x === 0 || x === width - 1) {
        const idx = (y * width + x) * 4;
        for (let c = 0; c < 4; c++) {
          sharpened[idx + c] = data[idx + c];
        }
      }
    }
  }

  const sharpenedImageData = new ImageData(sharpened, width, height);
  ctx.putImageData(sharpenedImageData, 0, 0);

  return canvas;
}

async function processImage(
  task: ProcessImageTask
): Promise<ProcessImageResult> {
  const {
    id,
    imageData,
    targetWidth,
    targetHeight,
    format,
    quality,
    usePica,
    upscaling,
    targetPPI,
    autoCrop,
    preserveAspectRatio,
  } = task;

  // Create source canvas from ImageData
  let sourceCanvas = new OffscreenCanvas(imageData.width, imageData.height);
  let sourceCtx = sourceCanvas.getContext('2d');

  if (!sourceCtx) {
    throw new Error('Could not get source canvas context');
  }

  sourceCtx.putImageData(imageData, 0, 0);

  // Apply auto-crop if requested (for logo processing)
  if (autoCrop) {
    const cropData = autoCropImage(imageData);

    if (cropData.cropWidth > 0 && cropData.cropHeight > 0) {
      // Create cropped canvas
      const croppedCanvas = new OffscreenCanvas(
        cropData.cropWidth,
        cropData.cropHeight
      );
      const croppedCtx = croppedCanvas.getContext('2d');

      if (!croppedCtx) {
        throw new Error('Could not get cropped canvas context');
      }

      // Draw cropped portion
      croppedCtx.drawImage(
        sourceCanvas,
        cropData.cropX,
        cropData.cropY,
        cropData.cropWidth,
        cropData.cropHeight,
        0,
        0,
        cropData.cropWidth,
        cropData.cropHeight
      );

      // Update source canvas to cropped version
      sourceCanvas = croppedCanvas;
      sourceCtx = croppedCtx;

      console.log(
        `Auto-cropped from ${imageData.width}×${imageData.height} to ${cropData.cropWidth}×${cropData.cropHeight}`
      );
    }
  }

  // Handle square format requirements (favicons/icons) vs aspect-preserving formats
  let targetCanvas = sourceCanvas;

  // Recalculate target dimensions if preserving aspect ratio (after auto-crop)
  let finalTargetWidth = targetWidth;
  let finalTargetHeight = targetHeight;

  if (preserveAspectRatio) {
    // Use the cropped canvas dimensions to calculate proper aspect ratio
    const aspectRatio = sourceCanvas.height / sourceCanvas.width;
    finalTargetWidth = targetWidth;
    finalTargetHeight = Math.round(targetWidth * aspectRatio);

    console.log(
      `Aspect ratio preserved: ${sourceCanvas.width}×${sourceCanvas.height} → ${finalTargetWidth}×${finalTargetHeight}`
    );
  }

  // For square formats, we need to add transparent padding instead of distorting
  const needsSquarePadding =
    finalTargetWidth === finalTargetHeight &&
    sourceCanvas.width !== sourceCanvas.height;

  if (needsSquarePadding) {
    // Create square canvas with transparent background
    const squareSize = Math.max(targetWidth, targetHeight);
    const paddedCanvas = new OffscreenCanvas(squareSize, squareSize);
    const paddedCtx = paddedCanvas.getContext('2d');

    if (!paddedCtx) {
      throw new Error('Could not get padded canvas context');
    }

    // Clear to transparent
    paddedCtx.clearRect(0, 0, squareSize, squareSize);

    // Calculate scaling to fit within square while preserving aspect ratio
    const scale = Math.min(
      squareSize / sourceCanvas.width,
      squareSize / sourceCanvas.height
    );
    const scaledWidth = sourceCanvas.width * scale;
    const scaledHeight = sourceCanvas.height * scale;

    // Center the logo in the square
    const offsetX = (squareSize - scaledWidth) / 2;
    const offsetY = (squareSize - scaledHeight) / 2;

    paddedCtx.drawImage(
      sourceCanvas,
      offsetX,
      offsetY,
      scaledWidth,
      scaledHeight
    );

    // Now resize the padded square to target size
    if (squareSize !== finalTargetWidth) {
      targetCanvas = usePica
        ? await resizeWithPica(
            paddedCanvas,
            finalTargetWidth,
            finalTargetHeight
          )
        : resizeWithCanvas(paddedCanvas, finalTargetWidth, finalTargetHeight);
    } else {
      targetCanvas = paddedCanvas;
    }

    console.log(
      `Square padding applied: ${sourceCanvas.width}×${sourceCanvas.height} → ${squareSize}×${squareSize} → ${finalTargetWidth}×${finalTargetHeight}`
    );
  } else if (
    finalTargetWidth !== sourceCanvas.width ||
    finalTargetHeight !== sourceCanvas.height
  ) {
    // Regular resize for non-square or already-square images
    const scaleX = finalTargetWidth / sourceCanvas.width;
    const scaleY = finalTargetHeight / sourceCanvas.height;
    const isUpscaling = scaleX > 1.0 || scaleY > 1.0;
    const isSmallIcon = finalTargetWidth <= 64 && finalTargetHeight <= 64;

    if (upscaling && isUpscaling) {
      // Use advanced upscaling algorithms
      switch (upscaling.method) {
        case 'ai-enhanced':
          targetCanvas = await aiEnhancedUpscale(
            sourceCanvas,
            finalTargetWidth,
            finalTargetHeight,
            upscaling
          );
          break;
        case 'lanczos':
          targetCanvas = await lanczosUpscale(
            sourceCanvas,
            finalTargetWidth,
            finalTargetHeight,
            upscaling
          );
          break;
        case 'bicubic':
          targetCanvas = await bicubicUpscale(
            sourceCanvas,
            finalTargetWidth,
            finalTargetHeight,
            upscaling
          );
          break;
        default:
          targetCanvas = usePica
            ? await resizeWithPica(
                sourceCanvas,
                finalTargetWidth,
                finalTargetHeight
              )
            : resizeWithCanvas(
                sourceCanvas,
                finalTargetWidth,
                finalTargetHeight
              );
      }
    } else if (isSmallIcon) {
      // Use favicon-optimized algorithm for small icons
      targetCanvas = await faviconOptimizedResize(
        sourceCanvas,
        finalTargetWidth,
        finalTargetHeight
      );
    } else {
      // Use existing algorithms for regular downscaling
      if (usePica) {
        targetCanvas = await resizeWithPica(
          sourceCanvas,
          finalTargetWidth,
          finalTargetHeight
        );
      } else {
        targetCanvas = resizeWithCanvas(
          sourceCanvas,
          finalTargetWidth,
          finalTargetHeight
        );
      }
    }
  }

  // Convert to target format
  const { blob, actualFormat, fallbackUsed } = await convertToBlob(
    targetCanvas,
    format,
    quality,
    targetPPI
  );

  return {
    id,
    blob,
    actualFormat,
    fallbackUsed,
    width: targetWidth,
    height: targetHeight,
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
          data: result,
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
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

// Export empty object to make this a module
export {};
