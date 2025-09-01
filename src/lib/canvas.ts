import { OutputFormat } from './formats';

/**
 * Check if the browser can encode to a specific format
 */
export function canEncode(mimeType: OutputFormat): Promise<boolean> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    
    canvas.toBlob((blob) => {
      resolve(blob !== null);
    }, mimeType);
  });
}

/**
 * Safely convert canvas to blob with fallback
 */
export async function toBlobSafe(
  canvas: HTMLCanvasElement,
  mimeType: OutputFormat,
  quality?: number
): Promise<{ blob: Blob; actualFormat: OutputFormat; fallbackUsed: boolean }> {
  const canEncodeTo = await canEncode(mimeType);
  
  let targetFormat = mimeType;
  let fallbackUsed = false;
  
  if (!canEncodeTo) {
    // Fallback order: AVIF → WebP → JPEG
    if (mimeType === 'image/avif') {
      const canWebP = await canEncode('image/webp');
      targetFormat = canWebP ? 'image/webp' : 'image/jpeg';
      fallbackUsed = true;
    } else if (mimeType === 'image/webp') {
      targetFormat = 'image/jpeg';
      fallbackUsed = true;
    }
  }
  
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve({ blob, actualFormat: targetFormat, fallbackUsed });
        } else {
          reject(new Error('Failed to convert canvas to blob'));
        }
      },
      targetFormat,
      quality
    );
  });
}

/**
 * Load image file to HTMLImageElement
 */
export function loadImage(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Draw image to canvas with specific dimensions
 */
export function drawImageToCanvas(
  img: HTMLImageElement,
  width: number,
  height: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }
  
  canvas.width = width;
  canvas.height = height;
  
  // Use better image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  ctx.drawImage(img, 0, 0, width, height);
  return canvas;
}

/**
 * Calculate dimensions maintaining aspect ratio
 */
export function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  targetWidth?: number,
  targetHeight?: number,
  scale?: number
): { width: number; height: number } {
  if (scale) {
    return {
      width: Math.round(originalWidth * scale),
      height: Math.round(originalHeight * scale)
    };
  }
  
  if (targetWidth && targetHeight) {
    return { width: targetWidth, height: targetHeight };
  }
  
  if (targetWidth) {
    const ratio = targetWidth / originalWidth;
    return {
      width: targetWidth,
      height: Math.round(originalHeight * ratio)
    };
  }
  
  if (targetHeight) {
    const ratio = targetHeight / originalHeight;
    return {
      width: Math.round(originalWidth * ratio),
      height: targetHeight
    };
  }
  
  return { width: originalWidth, height: originalHeight };
}

/**
 * Feature detection for AVIF support
 */
export async function supportsAVIF(): Promise<boolean> {
  return canEncode('image/avif');
}

/**
 * Feature detection for WebP support
 */
export async function supportsWebP(): Promise<boolean> {
  return canEncode('image/webp');
}
