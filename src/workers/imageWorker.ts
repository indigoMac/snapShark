/// <reference lib="webworker" />

import { OutputFormat } from '../lib/formats';

export interface ProcessImageTask {
  id: string;
  imageData: ImageData;
  targetWidth: number;
  targetHeight: number;
  format: OutputFormat;
  quality?: number;
  usePica?: boolean;
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

async function canEncode(mimeType: OutputFormat): Promise<boolean> {
  const canvas = new OffscreenCanvas(1, 1);
  try {
    const blob = await canvas.convertToBlob({ type: mimeType });
    return blob !== null;
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
    quality: quality
  });
  
  return { blob, actualFormat: targetFormat, fallbackUsed };
}

async function processImage(task: ProcessImageTask): Promise<ProcessImageResult> {
  const { id, imageData, targetWidth, targetHeight, format, quality, usePica } = task;
  
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
    if (usePica) {
      targetCanvas = await resizeWithPica(sourceCanvas, targetWidth, targetHeight);
    } else {
      targetCanvas = resizeWithCanvas(sourceCanvas, targetWidth, targetHeight);
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
