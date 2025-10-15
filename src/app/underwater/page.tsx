'use client';

import { useState, useRef, useCallback, useMemo, useEffect, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Download, Upload, RotateCcw, Waves } from 'lucide-react';
import { downloadFile, createZip, downloadZip } from '@/lib/zip';

interface ProcessedResult {
  original: string;
  corrected: string;
  filename: string;
  isVideo?: boolean;
  correctedBlob?: Blob; // Store the actual blob for ZIP creation
}

export default function UnderwaterPage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ProcessedResult[]>([]);
  const [intensity, setIntensity] = useState([100]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  // Batch processing state
  const [batchProgress, setBatchProgress] = useState(0);
  const [currentProcessingIndex, setCurrentProcessingIndex] = useState(0);
  const [isBatchMode, setIsBatchMode] = useState(false);
  
  // Video processing state (for single file mode)
  const [isVideoFile, setIsVideoFile] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [totalFrames, setTotalFrames] = useState(0);
  const [processedFrames, setProcessedFrames] = useState(0);

  const handleFileSelect = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      
      // Filter for images only in batch mode
      const imageFiles = fileArray.filter(file => file.type.startsWith('image/'));
      const videoFiles = fileArray.filter(file => file.type.startsWith('video/'));
      
      if (imageFiles.length === 0 && videoFiles.length === 0) {
        setError('Please select valid image or video files');
        return;
      }

      // Check for mixed file types
      if (imageFiles.length > 0 && videoFiles.length > 0) {
        setError('Please select either images or videos, not both');
        return;
      }

      // Check video file sizes (limit to ~100MB for now)
      const oversizedVideos = videoFiles.filter(file => file.size > 100 * 1024 * 1024);
      if (oversizedVideos.length > 0) {
        setError('Some video files are too large. Please select videos under 100MB.');
        return;
      }

      setError(null);
      setResults([]);
      setVideoProgress(0);
      setProcessedFrames(0);
      setTotalFrames(0);
      setBatchProgress(0);
      setCurrentProcessingIndex(0);

      if (fileArray.length === 1) {
        // Single file mode (existing behavior)
        const file = fileArray[0];
        const isVideo = file.type.startsWith('video/');
        setSelectedFiles([file]);
        setIsVideoFile(isVideo);
        setIsBatchMode(false);

        // Start processing immediately with default intensity
        if (isVideo) {
          await processVideo(file, intensity[0]);
        } else {
          await processImage(file, intensity[0], false);
        }
      } else {
        // Batch mode (images only)
        if (videoFiles.length > 0) {
          setError('Batch processing only supports images. Please select image files only.');
          return;
        }
        
        setSelectedFiles(imageFiles);
        setIsVideoFile(false);
        setIsBatchMode(true);
        // Don't auto-process in batch mode, wait for user to click "Process Batch"
      }
    },
    [intensity]
  );

  const processImage = useCallback(
    async (file: File, intensityValue: number, isBatchProcessing: boolean = false) => {
      if (!isBatchProcessing) {
        setIsProcessing(true);
      }
      setError(null);

      try {
        // Load the image
        const img = new Image();
        const imageUrl = URL.createObjectURL(file);

        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = imageUrl;
        });

        // Create canvas for processing
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          throw new Error('Could not get canvas context');
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Apply underwater color correction
        const correctedImageData = applyUnderwaterCorrection(
          imageData,
          intensityValue / 100
        );

        // Put corrected data back to canvas
        ctx.putImageData(correctedImageData, 0, 0);

        // Create blob for download
        const correctedBlob = await new Promise<Blob>((resolve) => {
          canvas.toBlob(
            (blob) => {
              resolve(blob!);
            },
            'image/jpeg',
            0.95
          );
        });

        const correctedUrl = URL.createObjectURL(correctedBlob);

        const newResult = {
          original: imageUrl,
          corrected: correctedUrl,
          filename: file.name.replace(/\.[^/.]+$/, '_underwater_corrected.jpg'),
          correctedBlob: correctedBlob, // Store the blob for ZIP creation
        };

        if (isBatchProcessing) {
          setResults(prev => [...prev, newResult]);
        } else {
          setResults([newResult]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Processing failed');
      } finally {
        if (!isBatchProcessing) {
          setIsProcessing(false);
        }
      }
    },
    []
  );

  // Underwater color correction algorithm (from your example code)
  const applyUnderwaterCorrection = useCallback(
    (imageData: ImageData, intensity: number): ImageData => {
      const { data, width, height } = imageData;

      // Get color filter matrix using your algorithm
      const matrix = getColorFilterMatrix(data, width, height);

      // Apply intensity scaling
      const scaledMatrix = matrix.map((value, index) => {
        if (index % 5 === 4) {
          // Offset values (last column)
          return value * intensity;
        } else if (index % 5 === index % 5) {
          // Diagonal values - blend with identity matrix
          const identityValue = index % 6 === 0 ? 1 : 0;
          return identityValue + (value - identityValue) * intensity;
        } else {
          // Other values
          return value * intensity;
        }
      });

      // Apply matrix transformation to image
      const newImageData = new ImageData(width, height);

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        // Apply color matrix transformation
        const newR = Math.max(
          0,
          Math.min(
            255,
            scaledMatrix[0] * r +
              scaledMatrix[1] * g +
              scaledMatrix[2] * b +
              scaledMatrix[4] * 255
          )
        );
        const newG = Math.max(
          0,
          Math.min(
            255,
            scaledMatrix[5] * r +
              scaledMatrix[6] * g +
              scaledMatrix[7] * b +
              scaledMatrix[9] * 255
          )
        );
        const newB = Math.max(
          0,
          Math.min(
            255,
            scaledMatrix[10] * r +
              scaledMatrix[11] * g +
              scaledMatrix[12] * b +
              scaledMatrix[14] * 255
          )
        );

        newImageData.data[i] = newR;
        newImageData.data[i + 1] = newG;
        newImageData.data[i + 2] = newB;
        newImageData.data[i + 3] = a;
      }

      return newImageData;
    },
    []
  );

  // Your color filter matrix function (adapted from example/index.js)
  const getColorFilterMatrix = useCallback(
    (pixels: Uint8ClampedArray, width: number, height: number): number[] => {
      // Magic values:
      const numOfPixels = width * height;
      const thresholdRatio = 2000;
      const thresholdLevel = numOfPixels / thresholdRatio;
      const minAvgRed = 60;
      const maxHueShift = 120;
      const blueMagicValue = 1.2;

      // Objects:
      const hist = {
        r: new Array(256).fill(0),
        g: new Array(256).fill(0),
        b: new Array(256).fill(0),
      };
      const normalize = { r: [0], g: [0], b: [0] };
      let hueShift = 0;

      const avg = calculateAverageColor(pixels, width, height);

      // Calculate shift amount:
      let newAvgRed = avg.r;
      while (newAvgRed < minAvgRed) {
        const shifted = hueShiftRed(avg.r, avg.g, avg.b, hueShift);
        newAvgRed = shifted.r + shifted.g + shifted.b;
        hueShift++;
        if (hueShift > maxHueShift) newAvgRed = 60;
      }

      // Create histogram with new red values:
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const pos = (y * width + x) * 4;

          let red = Math.round(pixels[pos]);
          const green = Math.round(pixels[pos + 1]);
          const blue = Math.round(pixels[pos + 2]);

          const shifted = hueShiftRed(red, green, blue, hueShift);
          red = shifted.r + shifted.g + shifted.b;
          red = Math.min(255, Math.max(0, red));
          red = Math.round(red);

          hist.r[red] += 1;
          hist.g[green] += 1;
          hist.b[blue] += 1;
        }
      }

      // Find values under threshold:
      for (let i = 0; i < 256; i++) {
        if (hist.r[i] - thresholdLevel < 2) normalize.r.push(i);
        if (hist.g[i] - thresholdLevel < 2) normalize.g.push(i);
        if (hist.b[i] - thresholdLevel < 2) normalize.b.push(i);
      }

      // Push 255 as end value:
      normalize.r.push(255);
      normalize.g.push(255);
      normalize.b.push(255);

      const adjust = {
        r: normalizingInterval(normalize.r),
        g: normalizingInterval(normalize.g),
        b: normalizingInterval(normalize.b),
      };

      const shifted = hueShiftRed(1, 1, 1, hueShift);

      const redGain = 256 / (adjust.r.high - adjust.r.low);
      const greenGain = 256 / (adjust.g.high - adjust.g.low);
      const blueGain = 256 / (adjust.b.high - adjust.b.low);

      const redOffset = (-adjust.r.low / 256) * redGain;
      const greenOffset = (-adjust.g.low / 256) * greenGain;
      const blueOffset = (-adjust.b.low / 256) * blueGain;

      const adjstRed = shifted.r * redGain;
      const adjstRedGreen = shifted.g * redGain;
      const adjstRedBlue = shifted.b * redGain * blueMagicValue;

      return [
        adjstRed,
        adjstRedGreen,
        adjstRedBlue,
        0,
        redOffset,
        0,
        greenGain,
        0,
        0,
        greenOffset,
        0,
        0,
        blueGain,
        0,
        blueOffset,
        0,
        0,
        0,
        1,
        0,
      ];
    },
    []
  );

  // Helper functions from your original code
  const calculateAverageColor = useCallback(
    (pixels: Uint8ClampedArray, width: number, height: number) => {
      const avg = { r: 0, g: 0, b: 0 };

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const pos = (y * width + x) * 4;
          avg.r += pixels[pos];
          avg.g += pixels[pos + 1];
          avg.b += pixels[pos + 2];
        }
      }

      avg.r = avg.r / (width * height);
      avg.g = avg.g / (width * height);
      avg.b = avg.b / (width * height);

      return avg;
    },
    []
  );

  const hueShiftRed = useCallback(
    (r: number, g: number, b: number, h: number) => {
      const U = Math.cos((h * Math.PI) / 180);
      const W = Math.sin((h * Math.PI) / 180);

      return {
        r: (0.299 + 0.701 * U + 0.168 * W) * r,
        g: (0.587 - 0.587 * U + 0.33 * W) * g,
        b: (0.114 - 0.114 * U - 0.497 * W) * b,
      };
    },
    []
  );

  const normalizingInterval = useCallback((normArray: number[]) => {
    let high = 255;
    let low = 0;
    let maxDist = 0;

    for (let i = 1; i < normArray.length; i++) {
      const dist = normArray[i] - normArray[i - 1];
      if (dist > maxDist) {
        maxDist = dist;
        high = normArray[i];
        low = normArray[i - 1];
      }
    }

    return { low, high };
  }, []);

  const processVideo = useCallback(
    async (file: File, intensityValue: number) => {
      setIsProcessing(true);
      setError(null);
      setVideoProgress(0);
      setProcessedFrames(0);

      try {
        // Create video element
        const video = document.createElement('video');
        const videoUrl = URL.createObjectURL(file);
        video.src = videoUrl;
        video.muted = true;
        video.preload = 'metadata';

        // Wait for video metadata to load
        await new Promise((resolve, reject) => {
          video.onloadedmetadata = resolve;
          video.onerror = reject;
        });

        // MATCH original video properties exactly
        const duration = video.duration;
        
        // Try to detect original frame rate (approximation)
        // Most videos are 24, 25, 30, or 60 fps
        const possibleFps = [24, 25, 30, 60];
        let detectedFps = 30; // default fallback
        
        // Simple heuristic: try to match common frame rates
        for (const fps of possibleFps) {
          const expectedFrames = duration * fps;
          if (Math.abs(expectedFrames - Math.round(expectedFrames)) < 0.1) {
            detectedFps = fps;
            break;
          }
        }
        
        const targetFps = detectedFps;
        const totalFrames = Math.round(duration * targetFps); // Use round for exact match
        
        console.log('Video analysis:', {
          videoDuration: duration,
          detectedFps,
          targetFps,
          totalFrames,
          expectedDuration: totalFrames / targetFps,
          durationDiff: Math.abs(duration - (totalFrames / targetFps)),
          resolution: `${video.videoWidth}x${video.videoHeight}`,
          aspectRatio: (video.videoWidth / video.videoHeight).toFixed(2)
        });
        
        // Limit video length for performance (max 60 seconds for now)
        if (duration > 60) {
          throw new Error('Video too long. Please select a video under 60 seconds.');
        }

        setTotalFrames(totalFrames);

        // Create canvas for frame processing
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          throw new Error('Could not get canvas context');
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Create MediaRecorder with adaptive bitrate for better quality
        const stream = canvas.captureStream(targetFps);
        
        // MATCH original bitrate as closely as possible
        const originalBitrate = (file.size * 8) / duration; // Original bitrate in bits/second
        
        // Use original bitrate exactly, with small safety margins
        const adaptiveBitrate = Math.min(
          Math.max(originalBitrate * 0.98, 1000000), // Use 98% of original, minimum 1Mbps
          originalBitrate * 1.02  // Allow up to 102% of original (tiny margin for encoding differences)
        );
        
        // Try different codecs for better quality/compatibility
        let mediaRecorder;
        const codecOptions = [
          { mimeType: 'video/webm;codecs=vp9', name: 'VP9' },
          { mimeType: 'video/webm;codecs=vp8', name: 'VP8' },
          { mimeType: 'video/mp4;codecs=avc1', name: 'H.264' },
          { mimeType: 'video/webm', name: 'WebM' }
        ];
        
        let selectedCodec = codecOptions[0]; // Default to VP9
        for (const codec of codecOptions) {
          if (MediaRecorder.isTypeSupported(codec.mimeType)) {
            selectedCodec = codec;
            break;
          }
        }
        
        mediaRecorder = new MediaRecorder(stream, {
          mimeType: selectedCodec.mimeType,
          videoBitsPerSecond: adaptiveBitrate
        });
        
        console.log(`Using codec: ${selectedCodec.name} (${selectedCodec.mimeType})`);
        
        // Debug info
        console.log('Video processing settings:', {
          originalSize: `${(file.size / 1024 / 1024).toFixed(1)}MB`,
          resolution: `${canvas.width}x${canvas.height}`,
          duration: `${duration.toFixed(1)}s`,
          targetFps,
          originalBitrate: `${(originalBitrate / 1000000).toFixed(1)}Mbps`,
          adaptiveBitrate: `${(adaptiveBitrate / 1000000).toFixed(1)}Mbps`
        });

        const chunks: Blob[] = [];
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        // Start recording with optimized chunk size
        mediaRecorder.start(100); // Record in 100ms chunks for better memory management

        // Process EXACT number of frames to match original duration
        const frameInterval = 1000 / targetFps; // Time between frames in milliseconds
        
        for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
          const currentTime = frameIndex / targetFps;
          
          // Process every frame up to exact duration
          if (currentTime >= duration) {
            console.log(`Reached end: frame ${frameIndex}, time ${currentTime}s, duration ${duration}s`);
            break;
          }
          
          // Seek to EXACT frame position
          video.currentTime = Math.min(currentTime, duration - (1 / targetFps)); // Leave exactly 1 frame buffer
          
          // Wait for seek to complete with timeout fallback
          await new Promise((resolve) => {
            const onSeeked = () => {
              video.removeEventListener('seeked', onSeeked);
              resolve(void 0);
            };
            video.addEventListener('seeked', onSeeked);
            
            // Fallback timeout in case seeked event doesn't fire
            setTimeout(() => {
              video.removeEventListener('seeked', onSeeked);
              resolve(void 0);
            }, 100);
          });

          // Draw frame to canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          // Get image data and apply correction
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const correctedImageData = applyUnderwaterCorrection(imageData, intensityValue / 100);
          
          // Put corrected data back to canvas
          ctx.putImageData(correctedImageData, 0, 0);

          // Update progress
          setProcessedFrames(frameIndex + 1);
          setVideoProgress(((frameIndex + 1) / totalFrames) * 100);

          // EXACT timing to match original frame rate
          // Wait the precise frame interval for perfect timing
          await new Promise(resolve => setTimeout(resolve, frameInterval / 2));
        }

        // No extra wait - stop immediately after last frame
        // await new Promise(resolve => setTimeout(resolve, 50)); // Minimal if needed

        // Stop recording and get result
        mediaRecorder.stop();
        
        const processedVideoBlob = await new Promise<Blob>((resolve) => {
          mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            resolve(blob);
          };
        });

        const correctedUrl = URL.createObjectURL(processedVideoBlob);

        const newResult = {
          original: videoUrl,
          corrected: correctedUrl,
          filename: file.name.replace(/\.[^/.]+$/, '_underwater_corrected.webm'),
          isVideo: true,
          correctedBlob: processedVideoBlob, // Store the blob for potential future use
        };

        if (isBatchMode) {
          setResults(prev => [...prev, newResult]);
        } else {
          setResults([newResult]);
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Video processing failed');
      } finally {
        setIsProcessing(false);
        setVideoProgress(0);
      }
    },
    [applyUnderwaterCorrection]
  );

  // Batch processing function
  const processBatch = useCallback(
    async (files: File[], intensityValue: number) => {
      setIsProcessing(true);
      setError(null);
      setResults([]);
      setBatchProgress(0);
      setCurrentProcessingIndex(0);

      try {
        for (let i = 0; i < files.length; i++) {
          setCurrentProcessingIndex(i + 1);
          setBatchProgress((i / files.length) * 100);
          
          await processImage(files[i], intensityValue, true);
        }
        
        setBatchProgress(100);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Batch processing failed');
      } finally {
        setIsProcessing(false);
        setCurrentProcessingIndex(0);
      }
    },
    [processImage]
  );

  // Debounced processing for better mobile performance
  const debouncedProcessFile = useCallback(
    (file: File, intensityValue: number) => {
      // Clear existing timeout
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }

      // Set new timeout for processing
      const delay = isVideoFile ? 500 : 150; // Longer delay for videos to avoid excessive processing
      processingTimeoutRef.current = setTimeout(() => {
        if (isVideoFile) {
          processVideo(file, intensityValue);
        } else {
          processImage(file, intensityValue, false);
        }
      }, delay);
    },
    [processImage, processVideo, isVideoFile]
  );

  const handleIntensityChange = useCallback(
    (newIntensity: number[]) => {
      setIntensity(newIntensity);
      if (selectedFiles.length === 1 && !isBatchMode) {
        debouncedProcessFile(selectedFiles[0], newIntensity[0]);
      }
    },
    [selectedFiles, isBatchMode, debouncedProcessFile]
  );

  const handleDownload = useCallback(async (result?: ProcessedResult) => {
    const targetResult = result || results[0];
    if (!targetResult) return;

    try {
      // Convert data URL to blob for proper mobile sharing
      const response = await fetch(targetResult.corrected);
      const blob = await response.blob();

      // Use enhanced download function with mobile sharing support
      await downloadFile(blob, targetResult.filename);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback to traditional download
      const link = document.createElement('a');
      link.href = targetResult.corrected;
      link.download = targetResult.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [results]);

  const handleDownloadAll = useCallback(async () => {
    if (results.length === 0) return;

    try {
      // Create ZIP file with all processed images using stored blobs
      const files = results.map((result, index) => {
        if (!result.correctedBlob) {
          throw new Error(`No blob data available for image ${index + 1}`);
        }
        
        // Clean filename for ZIP compatibility
        const cleanFilename = result.filename
          .replace(/[<>:"/\\|?*]/g, '_') // Replace invalid characters
          .replace(/\s+/g, '_'); // Replace spaces with underscores
        
        return { name: cleanFilename, blob: result.correctedBlob };
      });

      // Create and download ZIP file
      console.log('Creating ZIP with files:', files.map(f => ({ name: f.name, size: f.blob.size })));
      const zipBlob = await createZip(files);
      console.log('ZIP created successfully, size:', zipBlob.size);
      downloadZip(zipBlob, 'underwater_corrected_batch.zip');
    } catch (error) {
      console.error('Batch download failed:', error);
      setError(`Failed to create ZIP file: ${error instanceof Error ? error.message : 'Unknown error'}. Please try downloading individual files.`);
    }
  }, [results]);

  const handleReset = useCallback(() => {
    // Clean up blob URLs before clearing results
    results.forEach(result => {
      if (result.original) {
        URL.revokeObjectURL(result.original);
      }
      if (result.corrected) {
        URL.revokeObjectURL(result.corrected);
      }
    });

    setSelectedFiles([]);
    setResults([]);
    setError(null);
    setIntensity([100]);
    setIsVideoFile(false);
    setIsBatchMode(false);
    setVideoProgress(0);
    setProcessedFrames(0);
    setTotalFrames(0);
    setBatchProgress(0);
    setCurrentProcessingIndex(0);

    // Clear any pending processing
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
      processingTimeoutRef.current = null;
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [results]);

  // Mobile detection for performance optimizations
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(
        window.innerWidth < 768 ||
          /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
          )
      );
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
    };
  }, []);

  // Cleanup blob URLs when results change to prevent memory leaks
  useEffect(() => {
    return () => {
      results.forEach(result => {
        if (result.original) {
          URL.revokeObjectURL(result.original);
        }
        if (result.corrected) {
          URL.revokeObjectURL(result.corrected);
        }
      });
    };
  }, [results]);

  // Cleanup all blob URLs on component unmount
  useEffect(() => {
    return () => {
      results.forEach(result => {
        if (result.original) {
          URL.revokeObjectURL(result.original);
        }
        if (result.corrected) {
          URL.revokeObjectURL(result.corrected);
        }
      });
    };
  }, []);

  // Memoized hero section to prevent unnecessary re-renders
  const heroSection = useMemo(
    () => (
      <div className="relative overflow-hidden">
        {/* Mobile-optimized background - Reduced effects on small screens */}
        <div className="absolute inset-0 opacity-10">
          {/* Reduce blur and animations on mobile for better performance */}
          <div className="absolute top-20 left-20 w-32 h-32 bg-blue-400/20 rounded-full md:blur-3xl blur-xl md:animate-pulse will-change-transform"></div>
          <div
            className="absolute top-40 right-32 w-24 h-24 bg-cyan-400/20 rounded-full md:blur-2xl blur-lg md:animate-pulse will-change-transform"
            style={{ animationDelay: '1s' }}
          ></div>
          <div
            className="absolute bottom-32 left-1/3 w-40 h-40 bg-blue-500/20 rounded-full md:blur-3xl blur-xl md:animate-pulse will-change-transform"
            style={{ animationDelay: '2s' }}
          ></div>
        </div>
        <div className="relative max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Waves className="w-12 h-12 text-blue-400" />
            <h1 className="text-4xl md:text-6xl font-bold text-white">
              Underwater Color Correction
            </h1>
          </div>
          <p className="text-xl text-blue-200 mb-8 max-w-2xl mx-auto">
            Restore natural colors to your underwater photos and videos with advanced
            algorithmic color correction
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="flex items-center gap-2 text-blue-200">
              <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                🌊
              </div>
              <span className="font-medium">Auto Detection</span>
            </div>
            <div className="flex items-center gap-2 text-blue-200">
              <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center">
                🎨
              </div>
              <span className="font-medium">Color Restoration</span>
            </div>
            <div className="flex items-center gap-2 text-blue-200">
              <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                ⚡
              </div>
              <span className="font-medium">Instant Preview</span>
            </div>
            <div className="flex items-center gap-2 text-blue-200">
              <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center">
                🎯
              </div>
              <span className="font-medium">Adjustable</span>
            </div>
          </div>
        </div>
      </div>
    ),
    []
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Hero Section - Memoized for performance */}
      {heroSection}

      {/* Main Tool */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <Card className="shadow-2xl border border-blue-800/50 bg-slate-800/80 md:backdrop-blur-sm relative overflow-hidden will-change-transform">
          {/* Subtle animated background - mobile optimized */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/15 md:from-blue-900/20 via-transparent to-cyan-900/15 md:to-cyan-900/20"></div>
          <div className="relative z-10">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl text-white">
                Upload Your Underwater Photo
              </CardTitle>
              <p className="text-blue-300">
                Automatically restores reds and balances colors lost underwater
              </p>
            </CardHeader>
            <CardContent>
              {selectedFiles.length === 0 ? (
                <div className="space-y-6">
                  <div
                    className="border-2 border-dashed border-blue-400 rounded-lg p-12 text-center hover:border-blue-300 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                    <p className="text-white text-lg mb-2">
                      Click to upload your underwater photos or video
                    </p>
                    <p className="text-blue-300 text-sm">
                      Supports JPG, PNG, WebP images and MP4, WebM, MOV videos (max 100MB, 60 seconds)
                    </p>
                    <p className="text-blue-200 text-xs mt-2">
                      Select multiple images for batch processing
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files && files.length > 0) handleFileSelect(files);
                    }}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* File List for Batch Mode */}
                  {isBatchMode && (
                    <div className="space-y-3">
                      <h3 className="text-white font-medium">
                        Selected Images ({selectedFiles.length})
                      </h3>
                      <div className="max-h-32 overflow-y-auto space-y-2">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between bg-slate-700/50 rounded-lg p-2">
                            <span className="text-blue-200 text-sm truncate flex-1">
                              {file.name}
                            </span>
                            <span className="text-blue-300 text-xs">
                              {(file.size / 1024 / 1024).toFixed(1)}MB
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Controls - Mobile Responsive */}
                  <div className="space-y-4">
                    {/* Intensity Control */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <span className="text-white font-medium text-sm sm:text-base">
                        Correction Intensity:
                      </span>
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-blue-300 text-sm">0%</span>
                        <Slider
                          value={intensity}
                          onValueChange={handleIntensityChange}
                          max={150}
                          min={0}
                          step={5}
                          className="flex-1 min-w-0"
                          disabled={isProcessing}
                        />
                        <span className="text-blue-300 text-sm">150%</span>
                        <span className="text-blue-400 font-mono text-sm ml-2 flex items-center gap-1">
                          {intensity[0]}%
                          {isProcessing && (
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        variant="outline"
                        onClick={handleReset}
                        size="sm"
                        className="w-full sm:w-auto"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reset
                      </Button>
                      
                      {/* Batch Process Button */}
                      {isBatchMode && !isProcessing && results.length === 0 && (
                        <Button
                          onClick={() => processBatch(selectedFiles, intensity[0])}
                          size="sm"
                          className="w-full sm:w-auto"
                        >
                          <Waves className="w-4 h-4 mr-2" />
                          Process {selectedFiles.length} Images
                        </Button>
                      )}
                      
                      {/* Single Download Button */}
                      {!isBatchMode && results.length > 0 && (
                        <Button
                          onClick={() => handleDownload()}
                          size="sm"
                          className="w-full sm:w-auto"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      )}
                      
                      {/* Batch Download Buttons */}
                      {isBatchMode && results.length > 0 && (
                        <>
                          <Button
                            onClick={handleDownloadAll}
                            size="sm"
                            className="w-full sm:w-auto"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download All as ZIP
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Results Display */}
                  {results.length > 0 && (
                    <div className="space-y-4">
                      {!isBatchMode ? (
                        // Single file display (existing layout)
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <h3 className="text-white font-medium">Original</h3>
                            <div className="relative rounded-lg overflow-hidden bg-slate-700">
                              {results[0].isVideo ? (
                                <video
                                  src={results[0].original}
                                  controls
                                  muted
                                  className="w-full h-auto"
                                  style={{ maxHeight: '400px' }}
                                />
                              ) : (
                                <img
                                  src={results[0].original}
                                  alt="Original underwater photo"
                                  className="w-full h-auto"
                                />
                              )}
                              <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
                                Original
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-white font-medium">
                              Color Corrected
                            </h3>
                            <div className="relative rounded-lg overflow-hidden bg-slate-700">
                              {results[0].isVideo ? (
                                <video
                                  src={results[0].corrected}
                                  controls
                                  muted
                                  className="w-full h-auto"
                                  style={{ maxHeight: '400px' }}
                                />
                              ) : (
                                <img
                                  src={results[0].corrected}
                                  alt="Color corrected underwater photo"
                                  className="w-full h-auto"
                                />
                              )}
                              <div className="absolute top-2 left-2 bg-emerald-600/80 text-white px-2 py-1 rounded text-sm">
                                Corrected
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        // Batch results grid
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-white font-medium">
                              Processed Images ({results.length})
                            </h3>
                            <Button
                              onClick={handleDownloadAll}
                              size="sm"
                              variant="outline"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download All
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {results.map((result, index) => (
                              <div key={index} className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-blue-200 text-sm truncate">
                                    {result.filename.replace('_underwater_corrected.jpg', '')}
                                  </span>
                                  <Button
                                    onClick={() => handleDownload(result)}
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 px-2 text-xs"
                                  >
                                    <Download className="w-3 h-3" />
                                  </Button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="relative rounded-lg overflow-hidden bg-slate-700">
                                    <img
                                      src={result.original}
                                      alt={`Original ${index + 1}`}
                                      className="w-full h-24 object-cover"
                                    />
                                    <div className="absolute top-1 left-1 bg-black/70 text-white px-1 py-0.5 rounded text-xs">
                                      Original
                                    </div>
                                  </div>
                                  <div className="relative rounded-lg overflow-hidden bg-slate-700">
                                    <img
                                      src={result.corrected}
                                      alt={`Corrected ${index + 1}`}
                                      className="w-full h-24 object-cover"
                                    />
                                    <div className="absolute top-1 left-1 bg-emerald-600/80 text-white px-1 py-0.5 rounded text-xs">
                                      Corrected
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {isProcessing && (
                    <div className="text-center py-8">
                      <div className="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
                      <p className="text-blue-300 mb-4">
                        {isBatchMode ? (
                          `Processing image ${currentProcessingIndex} of ${selectedFiles.length}...`
                        ) : (
                          `Processing your underwater ${isVideoFile ? 'video' : 'photo'}...`
                        )}
                      </p>
                      
                      {/* Batch Progress */}
                      {isBatchMode && selectedFiles.length > 1 && (
                        <div className="space-y-2">
                          <div className="w-full bg-slate-700 rounded-full h-2">
                            <div 
                              className="bg-blue-400 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${batchProgress}%` }}
                            ></div>
                          </div>
                          <p className="text-blue-300 text-sm">
                            {Math.round(batchProgress)}% complete
                          </p>
                        </div>
                      )}
                      
                      {/* Video Progress */}
                      {isVideoFile && totalFrames > 0 && (
                        <div className="space-y-2">
                          <div className="w-full bg-slate-700 rounded-full h-2">
                            <div 
                              className="bg-blue-400 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${videoProgress}%` }}
                            ></div>
                          </div>
                          <p className="text-blue-300 text-sm">
                            Frame {processedFrames} of {totalFrames} ({Math.round(videoProgress)}%)
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
                      <p className="text-red-300">{error}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </div>
        </Card>

        {/* Info Section - Lazy loaded with mobile optimizations */}
        <div
          className="mt-12 grid md:grid-cols-3 gap-6"
          style={{ contentVisibility: 'auto' }}
        >
          <Card className="bg-slate-800/60 border-blue-800/50 md:backdrop-blur-sm md:hover:bg-slate-800/70 md:transition-all md:duration-300 md:hover:scale-105 will-change-transform">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 md:from-blue-500/30 to-cyan-500/20 md:to-cyan-500/30 rounded-full flex items-center justify-center mx-auto mb-4 md:shadow-lg">
                🧠
              </div>
              <h3 className="text-white font-semibold mb-2">Smart Algorithm</h3>
              <p className="text-blue-300 text-sm">
                Analyzes your photo's color histogram to automatically detect
                and correct underwater color cast
              </p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/60 border-blue-800/50 md:backdrop-blur-sm md:hover:bg-slate-800/70 md:transition-all md:duration-300 md:hover:scale-105 will-change-transform">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 md:from-emerald-500/30 to-green-500/20 md:to-green-500/30 rounded-full flex items-center justify-center mx-auto mb-4 md:shadow-lg">
                🎨
              </div>
              <h3 className="text-white font-semibold mb-2">Red Recovery</h3>
              <p className="text-blue-300 text-sm">
                Restores red wavelengths that are naturally filtered out by
                water, bringing back natural skin tones
              </p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/60 border-blue-800/50 md:backdrop-blur-sm md:hover:bg-slate-800/70 md:transition-all md:duration-300 md:hover:scale-105 will-change-transform">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 md:from-purple-500/30 to-pink-500/20 md:to-pink-500/30 rounded-full flex items-center justify-center mx-auto mb-4 md:shadow-lg">
                ⚙️
              </div>
              <h3 className="text-white font-semibold mb-2">Fine Control</h3>
              <p className="text-blue-300 text-sm">
                Adjust the correction intensity from 0% to 150% to get the
                perfect balance for your specific photo
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
