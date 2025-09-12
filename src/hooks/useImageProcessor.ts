import { useState, useRef, useCallback } from 'react';
import { OutputFormat, generateFilename } from '@/lib/formats';
import { loadImage, calculateDimensions } from '@/lib/canvas';
import { maybeDecodeHEIC } from '@/lib/heic';
import type {
  ProcessImageTask,
  ProcessImageResult,
  WorkerMessage,
  UpscalingOptions,
} from '@/workers/imageWorker';

export interface ProcessingSettings {
  format: OutputFormat;
  quality: number;
  width?: number;
  height?: number;
  scale?: number;
  lockAspectRatio: boolean;
  usePica: boolean;
  upscaling?: UpscalingOptions;
  targetPPI?: number;
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
  const [progress, setProgress] = useState<ProcessingProgress>({
    current: 0,
    total: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ProcessedImage[]>([]);

  const workerRef = useRef<Worker | null>(null);
  const tasksRef = useRef<
    Map<string, { file: File; settings: ProcessingSettings }>
  >(new Map());

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
      fallbackUsed: result.fallbackUsed,
    };

    setResults((prev) => [...prev, processedImage]);
    setProgress((prev) => ({ ...prev, current: prev.current + 1 }));

    tasksRef.current.delete(result.id);

    // Check if all tasks are complete
    if (tasksRef.current.size === 0) {
      setIsProcessing(false);
    }
  }, []);

  const handleTaskError = useCallback(
    (errorData: { id: string; error: string }) => {
      const task = tasksRef.current.get(errorData.id);
      if (task) {
        console.error(
          `Processing failed for ${task.file.name}:`,
          errorData.error
        );
        tasksRef.current.delete(errorData.id);
      }

      setError(errorData.error);

      // Check if all tasks are complete (including failed ones)
      if (tasksRef.current.size === 0) {
        setIsProcessing(false);
      }
    },
    []
  );

  const processImages = useCallback(
    async (files: File[], settings: ProcessingSettings) => {
      if (files.length === 0) return;

      setIsProcessing(true);
      setError(null);
      setResults([]);
      setProgress({ current: 0, total: files.length });

      const worker = initWorker();
      tasksRef.current.clear();

      try {
        for (const file of files) {
          setProgress((prev) => ({ ...prev, currentFileName: file.name }));

          // Handle HEIC files
          let imageSource: File | ImageBitmap;
          try {
            imageSource = await maybeDecodeHEIC(file);
          } catch (heicError) {
            console.error(
              `HEIC processing failed for ${file.name}:`,
              heicError
            );
            setError(`HEIC format not supported: ${file.name}`);
            continue;
          }

          // Load image to get dimensions
          const img = await loadImage(
            imageSource instanceof File ? imageSource : file
          );

          // Calculate target dimensions
          const { width: targetWidth, height: targetHeight } =
            calculateDimensions(
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
          const imageData = ctx.getImageData(
            0,
            0,
            img.naturalWidth,
            img.naturalHeight
          );

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
            upscaling: settings.upscaling,
            targetPPI: settings.targetPPI,
          };

          tasksRef.current.set(taskId, { file, settings });

          // Send task to worker
          worker.postMessage({
            type: 'PROCESS_IMAGE',
            data: task,
          });
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Processing failed');
        setIsProcessing(false);
      }
    },
    [initWorker]
  );

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

  const generateLogoPackage = useCallback(
    async (logoFile: File) => {
      // Web Developer Logo Package - PNG formats (ICO/SVG coming soon)
      const logoFormats = [
        // Favicon PNGs (for modern browsers)
        {
          name: 'favicon-16',
          width: 16,
          height: 16,
          format: 'image/png' as const,
        },
        {
          name: 'favicon-32',
          width: 32,
          height: 32,
          format: 'image/png' as const,
        },
        {
          name: 'favicon-48',
          width: 48,
          height: 48,
          format: 'image/png' as const,
        },

        // Apple Touch Icons (square)
        {
          name: 'apple-touch-icon-180',
          width: 180,
          height: 180,
          format: 'image/png' as const,
        },

        // Web App Icons (square, for PWAs)
        {
          name: 'icon-192',
          width: 192,
          height: 192,
          format: 'image/png' as const,
        },
        {
          name: 'icon-512',
          width: 512,
          height: 512,
          format: 'image/png' as const,
        },

        // Website logos (aspect ratio preserved)
        {
          name: 'logo-200',
          width: 200,
          height: undefined,
          format: 'image/png' as const,
        },
        {
          name: 'logo-400',
          width: 400,
          height: undefined,
          format: 'image/png' as const,
        },
        {
          name: 'logo-800',
          width: 800,
          height: undefined,
          format: 'image/png' as const,
        },
      ];

      setIsProcessing(true);
      setError(null);
      setResults([]); // Clear previous results
      setProgress({ current: 0, total: logoFormats.length });

      const worker = initWorker();
      tasksRef.current.clear();

      try {
        // Load original image once
        const img = await loadImage(logoFile);

        // Process all formats in parallel
        for (let i = 0; i < logoFormats.length; i++) {
          const logoFormat = logoFormats[i];

          // For square formats (favicons/icons), crop to square
          // For aspect-preserving formats, maintain original ratio
          let targetWidth, targetHeight;

          if (logoFormat.height === undefined) {
            // Preserve aspect ratio
            const aspectRatio = img.naturalHeight / img.naturalWidth;
            targetWidth = logoFormat.width;
            targetHeight = Math.round(logoFormat.width * aspectRatio);
          } else {
            // Force square (for icons/favicons)
            targetWidth = logoFormat.width;
            targetHeight = logoFormat.height;
          }

          // Create ImageData from the image
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            throw new Error('Could not get canvas context');
          }

          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(
            0,
            0,
            img.naturalWidth,
            img.naturalHeight
          );

          // Create unique task ID with format name
          const taskId = `logo-${logoFormat.name}-${Date.now()}-${Math.random()}`;

          const task: ProcessImageTask = {
            id: taskId,
            imageData,
            targetWidth,
            targetHeight,
            format: logoFormat.format,
            quality: 1.0, // Maximum quality for logos
            usePica: true,
            upscaling: {
              method: 'bicubic',
              quality: 'high',
              preserveDetails: true,
            },
          };

          // Create a renamed file for each format
          const renamedFile = new File(
            [logoFile],
            `${logoFormat.name}.${logoFile.name.split('.').pop()}`,
            {
              type: logoFile.type,
              lastModified: logoFile.lastModified,
            }
          );

          tasksRef.current.set(taskId, {
            file: renamedFile,
            settings: {
              format: logoFormat.format,
              quality: 1.0,
              width: targetWidth,
              height: targetHeight,
              usePica: true,
              lockAspectRatio: logoFormat.height === undefined, // Lock aspect for responsive logos
              upscaling: {
                method: 'bicubic',
                quality: 'high',
                preserveDetails: true,
              },
            },
          });

          // Send task to worker
          worker.postMessage({
            type: 'PROCESS_IMAGE',
            data: task,
          });
        }
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : 'Logo package generation failed'
        );
        setIsProcessing(false);
      }
    },
    [initWorker]
  );

  // Smart print size generator based on aspect ratio
  const generateSmartPrintSizes = (originalAspect: number) => {
    const formats: Array<{
      name: string;
      width: number;
      height: number;
      format: 'image/jpeg';
      description: string;
      matchType: 'primary' | 'alternative';
    }> = [];

    // Common aspect ratios with tolerance
    const aspectRatios = {
      square: { ratio: 1.0, tolerance: 0.05, name: 'Square' },
      portrait_4_5: { ratio: 0.8, tolerance: 0.05, name: 'Portrait 4:5' },
      portrait_3_4: { ratio: 0.75, tolerance: 0.05, name: 'Portrait 3:4' },
      portrait_2_3: { ratio: 0.667, tolerance: 0.05, name: 'Portrait 2:3' },
      landscape_3_2: { ratio: 1.5, tolerance: 0.05, name: 'Landscape 3:2' },
      landscape_4_3: { ratio: 1.333, tolerance: 0.05, name: 'Landscape 4:3' },
      landscape_5_4: { ratio: 1.25, tolerance: 0.05, name: 'Landscape 5:4' },
      wide_16_9: { ratio: 1.777, tolerance: 0.05, name: 'Wide 16:9' },
    };

    // Find closest aspect ratio
    let closestMatch = aspectRatios.square;
    let minDifference = Math.abs(originalAspect - aspectRatios.square.ratio);

    for (const [key, aspect] of Object.entries(aspectRatios)) {
      const difference = Math.abs(originalAspect - aspect.ratio);
      if (difference < minDifference) {
        minDifference = difference;
        closestMatch = aspect;
      }
    }

    console.log(
      `Original aspect: ${originalAspect.toFixed(3)}, Closest match: ${closestMatch.name} (${closestMatch.ratio})`
    );

    // Generate primary sizes (70% of output) - matching original aspect ratio
    if (originalAspect >= 0.95 && originalAspect <= 1.05) {
      // Square images (1:1)
      formats.push(
        {
          name: 'square-4x4',
          width: 1200,
          height: 1200,
          format: 'image/jpeg',
          description: '4×4" Square',
          matchType: 'primary',
        },
        {
          name: 'square-6x6',
          width: 1800,
          height: 1800,
          format: 'image/jpeg',
          description: '6×6" Square',
          matchType: 'primary',
        },
        {
          name: 'square-8x8',
          width: 2400,
          height: 2400,
          format: 'image/jpeg',
          description: '8×8" Square',
          matchType: 'primary',
        },
        {
          name: 'square-10x10',
          width: 3000,
          height: 3000,
          format: 'image/jpeg',
          description: '10×10" Square',
          matchType: 'primary',
        },
        {
          name: 'square-12x12',
          width: 3600,
          height: 3600,
          format: 'image/jpeg',
          description: '12×12" Square',
          matchType: 'primary',
        },
        {
          name: 'square-16x16',
          width: 4800,
          height: 4800,
          format: 'image/jpeg',
          description: '16×16" Square',
          matchType: 'primary',
        },
        {
          name: 'square-20x20',
          width: 6000,
          height: 6000,
          format: 'image/jpeg',
          description: '20×20" Square',
          matchType: 'primary',
        },
        {
          name: 'square-24x24',
          width: 7200,
          height: 7200,
          format: 'image/jpeg',
          description: '24×24" Square',
          matchType: 'primary',
        }
      );
    } else if (originalAspect < 1.0) {
      // Portrait images
      const aspectStr =
        originalAspect < 0.7 ? '2:3' : originalAspect < 0.8 ? '3:4' : '4:5';

      if (originalAspect < 0.7) {
        // 2:3 aspect ratio (0.667)
        formats.push(
          {
            name: 'portrait-4x6',
            width: 1200,
            height: 1800,
            format: 'image/jpeg',
            description: '4×6" Portrait',
            matchType: 'primary',
          },
          {
            name: 'portrait-5x7.5',
            width: 1500,
            height: 2250,
            format: 'image/jpeg',
            description: '5×7.5" Portrait',
            matchType: 'primary',
          },
          {
            name: 'portrait-8x12',
            width: 2400,
            height: 3600,
            format: 'image/jpeg',
            description: '8×12" Portrait',
            matchType: 'primary',
          },
          {
            name: 'portrait-10x15',
            width: 3000,
            height: 4500,
            format: 'image/jpeg',
            description: '10×15" Portrait',
            matchType: 'primary',
          },
          {
            name: 'portrait-12x18',
            width: 3600,
            height: 5400,
            format: 'image/jpeg',
            description: '12×18" Portrait',
            matchType: 'primary',
          },
          {
            name: 'portrait-16x24',
            width: 4800,
            height: 7200,
            format: 'image/jpeg',
            description: '16×24" Portrait',
            matchType: 'primary',
          },
          {
            name: 'portrait-20x30',
            width: 6000,
            height: 9000,
            format: 'image/jpeg',
            description: '20×30" Portrait',
            matchType: 'primary',
          }
        );
      } else if (originalAspect < 0.8) {
        // 3:4 aspect ratio (0.75)
        formats.push(
          {
            name: 'portrait-3x4',
            width: 900,
            height: 1200,
            format: 'image/jpeg',
            description: '3×4" Portrait',
            matchType: 'primary',
          },
          {
            name: 'portrait-6x8',
            width: 1800,
            height: 2400,
            format: 'image/jpeg',
            description: '6×8" Portrait',
            matchType: 'primary',
          },
          {
            name: 'portrait-9x12',
            width: 2700,
            height: 3600,
            format: 'image/jpeg',
            description: '9×12" Portrait',
            matchType: 'primary',
          },
          {
            name: 'portrait-12x16',
            width: 3600,
            height: 4800,
            format: 'image/jpeg',
            description: '12×16" Portrait',
            matchType: 'primary',
          },
          {
            name: 'portrait-15x20',
            width: 4500,
            height: 6000,
            format: 'image/jpeg',
            description: '15×20" Portrait',
            matchType: 'primary',
          },
          {
            name: 'portrait-18x24',
            width: 5400,
            height: 7200,
            format: 'image/jpeg',
            description: '18×24" Portrait',
            matchType: 'primary',
          }
        );
      } else {
        // 4:5 aspect ratio (0.8)
        formats.push(
          {
            name: 'portrait-4x5',
            width: 1200,
            height: 1500,
            format: 'image/jpeg',
            description: '4×5" Portrait',
            matchType: 'primary',
          },
          {
            name: 'portrait-8x10',
            width: 2400,
            height: 3000,
            format: 'image/jpeg',
            description: '8×10" Portrait',
            matchType: 'primary',
          },
          {
            name: 'portrait-11x14',
            width: 3300,
            height: 4200,
            format: 'image/jpeg',
            description: '11×14" Portrait',
            matchType: 'primary',
          },
          {
            name: 'portrait-16x20',
            width: 4800,
            height: 6000,
            format: 'image/jpeg',
            description: '16×20" Portrait',
            matchType: 'primary',
          },
          {
            name: 'portrait-20x25',
            width: 6000,
            height: 7500,
            format: 'image/jpeg',
            description: '20×25" Portrait',
            matchType: 'primary',
          },
          {
            name: 'portrait-24x30',
            width: 7200,
            height: 9000,
            format: 'image/jpeg',
            description: '24×30" Portrait',
            matchType: 'primary',
          }
        );
      }
    } else {
      // Landscape images
      if (originalAspect > 1.7) {
        // Wide 16:9 aspect ratio (1.777)
        formats.push(
          {
            name: 'wide-8x4.5',
            width: 2400,
            height: 1350,
            format: 'image/jpeg',
            description: '8×4.5" Wide',
            matchType: 'primary',
          },
          {
            name: 'wide-12x6.75',
            width: 3600,
            height: 2025,
            format: 'image/jpeg',
            description: '12×6.75" Wide',
            matchType: 'primary',
          },
          {
            name: 'wide-16x9',
            width: 4800,
            height: 2700,
            format: 'image/jpeg',
            description: '16×9" Wide',
            matchType: 'primary',
          },
          {
            name: 'wide-20x11.25',
            width: 6000,
            height: 3375,
            format: 'image/jpeg',
            description: '20×11.25" Wide',
            matchType: 'primary',
          },
          {
            name: 'wide-24x13.5',
            width: 7200,
            height: 4050,
            format: 'image/jpeg',
            description: '24×13.5" Wide',
            matchType: 'primary',
          },
          {
            name: 'wide-32x18',
            width: 9600,
            height: 5400,
            format: 'image/jpeg',
            description: '32×18" Wide',
            matchType: 'primary',
          }
        );
      } else if (originalAspect > 1.4) {
        // 3:2 landscape (1.5)
        formats.push(
          {
            name: 'landscape-6x4',
            width: 1800,
            height: 1200,
            format: 'image/jpeg',
            description: '6×4" Landscape',
            matchType: 'primary',
          },
          {
            name: 'landscape-9x6',
            width: 2700,
            height: 1800,
            format: 'image/jpeg',
            description: '9×6" Landscape',
            matchType: 'primary',
          },
          {
            name: 'landscape-12x8',
            width: 3600,
            height: 2400,
            format: 'image/jpeg',
            description: '12×8" Landscape',
            matchType: 'primary',
          },
          {
            name: 'landscape-15x10',
            width: 4500,
            height: 3000,
            format: 'image/jpeg',
            description: '15×10" Landscape',
            matchType: 'primary',
          },
          {
            name: 'landscape-18x12',
            width: 5400,
            height: 3600,
            format: 'image/jpeg',
            description: '18×12" Landscape',
            matchType: 'primary',
          },
          {
            name: 'landscape-24x16',
            width: 7200,
            height: 4800,
            format: 'image/jpeg',
            description: '24×16" Landscape',
            matchType: 'primary',
          },
          {
            name: 'landscape-30x20',
            width: 9000,
            height: 6000,
            format: 'image/jpeg',
            description: '30×20" Landscape',
            matchType: 'primary',
          }
        );
      } else {
        // 4:3 landscape (1.333)
        formats.push(
          {
            name: 'landscape-4x3',
            width: 1200,
            height: 900,
            format: 'image/jpeg',
            description: '4×3" Landscape',
            matchType: 'primary',
          },
          {
            name: 'landscape-8x6',
            width: 2400,
            height: 1800,
            format: 'image/jpeg',
            description: '8×6" Landscape',
            matchType: 'primary',
          },
          {
            name: 'landscape-12x9',
            width: 3600,
            height: 2700,
            format: 'image/jpeg',
            description: '12×9" Landscape',
            matchType: 'primary',
          },
          {
            name: 'landscape-16x12',
            width: 4800,
            height: 3600,
            format: 'image/jpeg',
            description: '16×12" Landscape',
            matchType: 'primary',
          },
          {
            name: 'landscape-20x15',
            width: 6000,
            height: 4500,
            format: 'image/jpeg',
            description: '20×15" Landscape',
            matchType: 'primary',
          },
          {
            name: 'landscape-24x18',
            width: 7200,
            height: 5400,
            format: 'image/jpeg',
            description: '24×18" Landscape',
            matchType: 'primary',
          }
        );
      }
    }

    // Add alternative aspect ratios (30% of output) - popular standards
    formats.push(
      {
        name: 'alt-4x6',
        width: 1200,
        height: 1800,
        format: 'image/jpeg',
        description: '4×6" Standard',
        matchType: 'alternative',
      },
      {
        name: 'alt-5x7',
        width: 1500,
        height: 2100,
        format: 'image/jpeg',
        description: '5×7" Standard',
        matchType: 'alternative',
      },
      {
        name: 'alt-8x10',
        width: 2400,
        height: 3000,
        format: 'image/jpeg',
        description: '8×10" Standard',
        matchType: 'alternative',
      }
    );

    // Add one international size
    formats.push({
      name: 'ISO-A4',
      width: 2480,
      height: 3508,
      format: 'image/jpeg',
      description: 'A4 International',
      matchType: 'alternative',
    });

    return formats;
  };

  const generatePrintPackage = useCallback(
    async (printFile: File) => {
      // Load image first to analyze aspect ratio
      const img = await loadImage(printFile);
      const originalAspect = img.naturalWidth / img.naturalHeight;

      // Smart Print Package - Generate sizes based on original aspect ratio
      const printFormats = generateSmartPrintSizes(originalAspect);

      setIsProcessing(true);
      setError(null);
      setResults([]); // Clear previous results
      setProgress({ current: 0, total: printFormats.length });

      const worker = initWorker();
      tasksRef.current.clear();

      try {
        // Process all formats in parallel
        for (let i = 0; i < printFormats.length; i++) {
          const printFormat = printFormats[i];

          // Use exact dimensions from smart sizing (they already match aspect ratio)
          const targetWidth = printFormat.width;
          const targetHeight = printFormat.height;

          // Create ImageData from the image
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            throw new Error('Could not get canvas context');
          }

          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(
            0,
            0,
            img.naturalWidth,
            img.naturalHeight
          );

          // Create unique task ID with format name
          const taskId = `print-${printFormat.name}-${Date.now()}-${Math.random()}`;

          const task: ProcessImageTask = {
            id: taskId,
            imageData,
            targetWidth,
            targetHeight,
            format: printFormat.format,
            quality: 0.95, // High quality for prints
            usePica: true,
            upscaling: {
              method: 'bicubic',
              quality: 'high',
              preserveDetails: true,
            },
            targetPPI: 300, // Professional print resolution
          };

          // Create a renamed file for each format
          const renamedFile = new File(
            [printFile],
            `${printFormat.name}_${printFormat.description.replace(/[^a-zA-Z0-9]/g, '_')}.${printFile.name.split('.').pop()}`,
            {
              type: printFile.type,
              lastModified: printFile.lastModified,
            }
          );

          tasksRef.current.set(taskId, {
            file: renamedFile,
            settings: {
              format: printFormat.format,
              quality: 0.95,
              width: targetWidth,
              height: targetHeight,
              usePica: true,
              lockAspectRatio: true,
              upscaling: {
                method: 'bicubic',
                quality: 'high',
                preserveDetails: true,
              },
              targetPPI: 300,
            },
          });

          // Send task to worker
          worker.postMessage({
            type: 'PROCESS_IMAGE',
            data: task,
          });
        }
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : 'Print package generation failed'
        );
        setIsProcessing(false);
      }
    },
    [initWorker]
  );

  return {
    processImages,
    generateLogoPackage,
    generatePrintPackage,
    isProcessing,
    progress,
    error,
    results,
    reset,
    cleanup,
  };
}
