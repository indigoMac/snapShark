import { useState, useRef, useCallback } from 'react';
import { OutputFormat, generateFilename } from '@/lib/formats';
import { loadImage, calculateDimensions } from '@/lib/canvas';
import { maybeDecodeHEIC } from '@/lib/heic';
import type { ProcessImageTask, ProcessImageResult, WorkerMessage, UpscalingOptions } from '@/workers/imageWorker';

export interface ProcessingSettings {
  format: OutputFormat;
  quality: number;
  width?: number;
  height?: number;
  scale?: number;
  lockAspectRatio: boolean;
  usePica: boolean;
  upscaling?: UpscalingOptions;
}

export interface ProcessedImage {
  id: string;
  originalFile: File;
  blob: Blob;
  filename: string;
  width: number;
  height: number;
  actualFormat: OutputFormat;
  fallbackUsed: boolean;
}

export interface ProcessingProgress {
  current: number;
  total: number;
  currentFileName?: string;
}

export function useImageProcessor() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress>({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ProcessedImage[]>([]);
  
  const workerRef = useRef<Worker | null>(null);
  const tasksRef = useRef<Map<string, { file: File; settings: ProcessingSettings }>>(new Map());
  
  const initWorker = useCallback(() => {
    if (!workerRef.current) {
      workerRef.current = new Worker(
        new URL('../workers/imageWorker.ts', import.meta.url),
        { type: 'module' }
      );
      
      workerRef.current.onmessage = (event: MessageEvent<WorkerMessage>) => {
        const { type, data } = event.data;
        
        switch (type) {
          case 'COMPLETE':
            handleTaskComplete(data as ProcessImageResult);
            break;
            
          case 'ERROR':
            handleTaskError(data);
            break;
        }
      };
    }
    return workerRef.current;
  }, []);
  
  const handleTaskComplete = useCallback((result: ProcessImageResult) => {
    const task = tasksRef.current.get(result.id);
    if (!task) return;
    
    const processedImage: ProcessedImage = {
      id: result.id,
      originalFile: task.file,
      blob: result.blob,
      filename: generateFilename(
        task.file.name,
        result.width,
        result.height,
        result.actualFormat
      ),
      width: result.width,
      height: result.height,
      actualFormat: result.actualFormat,
      fallbackUsed: result.fallbackUsed
    };
    
    setResults(prev => [...prev, processedImage]);
    setProgress(prev => ({ ...prev, current: prev.current + 1 }));
    
    tasksRef.current.delete(result.id);
    
    // Check if all tasks are complete
    if (tasksRef.current.size === 0) {
      setIsProcessing(false);
    }
  }, []);
  
  const handleTaskError = useCallback((errorData: { id: string; error: string }) => {
    const task = tasksRef.current.get(errorData.id);
    if (task) {
      console.error(`Processing failed for ${task.file.name}:`, errorData.error);
      tasksRef.current.delete(errorData.id);
    }
    
    setError(errorData.error);
    
    // Check if all tasks are complete (including failed ones)
    if (tasksRef.current.size === 0) {
      setIsProcessing(false);
    }
  }, []);
  
  const processImages = useCallback(async (
    files: File[],
    settings: ProcessingSettings
  ) => {
    if (files.length === 0) return;
    
    setIsProcessing(true);
    setError(null);
    setResults([]);
    setProgress({ current: 0, total: files.length });
    
    const worker = initWorker();
    tasksRef.current.clear();
    
    try {
      for (const file of files) {
        setProgress(prev => ({ ...prev, currentFileName: file.name }));
        
        // Handle HEIC files
        let imageSource: File | ImageBitmap;
        try {
          imageSource = await maybeDecodeHEIC(file);
        } catch (heicError) {
          console.error(`HEIC processing failed for ${file.name}:`, heicError);
          setError(`HEIC format not supported: ${file.name}`);
          continue;
        }
        
        // Load image to get dimensions
        const img = await loadImage(imageSource instanceof File ? imageSource : file);
        
        // Calculate target dimensions
        const { width: targetWidth, height: targetHeight } = calculateDimensions(
          img.naturalWidth,
          img.naturalHeight,
          settings.width,
          settings.height,
          settings.scale
        );
        
        // Create ImageData from the image
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          throw new Error('Could not get canvas context');
        }
        
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.naturalWidth, img.naturalHeight);
        
        // Create processing task
        const taskId = `${file.name}-${Date.now()}-${Math.random()}`;
        const task: ProcessImageTask = {
          id: taskId,
          imageData,
          targetWidth,
          targetHeight,
          format: settings.format,
          quality: settings.quality,
          usePica: settings.usePica,
          upscaling: settings.upscaling
        };
        
        tasksRef.current.set(taskId, { file, settings });
        
        // Send task to worker
        worker.postMessage({
          type: 'PROCESS_IMAGE',
          data: task
        });
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Processing failed');
      setIsProcessing(false);
    }
  }, [initWorker]);
  
  const reset = useCallback(() => {
    setResults([]);
    setError(null);
    setProgress({ current: 0, total: 0 });
    setIsProcessing(false);
    tasksRef.current.clear();
  }, []);
  
  const cleanup = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    tasksRef.current.clear();
  }, []);
  
  return {
    processImages,
    isProcessing,
    progress,
    error,
    results,
    reset,
    cleanup
  };
}
