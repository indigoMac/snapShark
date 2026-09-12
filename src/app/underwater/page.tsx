'use client';

import { useState, useRef, useCallback, useMemo, useEffect, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useRouter } from 'next/navigation';
import { BookImage, Download, Upload, RotateCcw, Waves } from 'lucide-react';
import { downloadFile, createZip, downloadZip } from '@/lib/zip';
import { compressImageForLogbook } from '@/lib/compress-image';
import { storePendingPhoto } from '@/lib/logbook';
import { usePaywall } from '@/hooks/usePaywall';
import { PaywallDialog } from '@/components/PaywallDialog';
import {
  FREE_COLOUR_BATCH_LIMIT,
  PRO_COLOUR_BATCH_LIMIT,
} from '@/lib/plan';
import { isImageMediaFile, isVideoMediaFile } from '@/lib/media-file';
import {
  applyColorMatrix,
  attachFramePump,
  captureElementAudio,
  clampVideoBitrate,
  createColorMatrixRenderer,
  DEFAULT_FRAME_RATE,
  evenOutputSize,
  imageDataToJpegUrl,
  mountOffscreen,
  probeFrameRate,
  readBlobDuration,
  recorderContainerType,
  requestCanvasFrame,
  scaleColorMatrix,
  startCanvasRecorder,
  waitForVideoData,
  waitForVideoTime,
  waitOneFrame,
  type ColorMatrixRenderer,
  type ElementAudioCapture,
} from '@/lib/underwater-video';

interface ProcessedResult {
  original: string;
  corrected: string;
  filename: string;
  isVideo?: boolean;
  correctedBlob?: Blob; // Store the actual blob for ZIP creation
}

const PROGRESS_INTERVAL_MS = 100;

/**
 * Keeps the source audio in the output. The element has to be unmuted for the
 * Web Audio graph to receive samples, which autoplay policies can refuse; when
 * that happens we encode video only rather than failing the whole clip.
 */
async function setUpAudioPassthrough(
  video: HTMLVideoElement
): Promise<ElementAudioCapture | null> {
  let capture: ElementAudioCapture | null = null;
  try {
    capture = captureElementAudio(video);
    if (!capture) return null;
    await video.play();
    video.pause();
    return capture;
  } catch {
    capture?.dispose();
    return null;
  }
}

export default function UnderwaterPage() {
  const router = useRouter();
  const {
    isPro,
    requestFeatureAccess,
    showPaywallDialog,
    closePaywallDialog,
    paywallFeature,
  } = usePaywall();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ProcessedResult[]>([]);
  const [intensity, setIntensity] = useState([100]);
  const [error, setError] = useState<string | null>(null);
  const [savingToLogbook, setSavingToLogbook] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const videoJobRef = useRef(0);
  const videoMatrixRef = useRef<number[] | null>(null);
  const videoSourceFrameRef = useRef<ImageData | null>(null);
  const sourcePreviewUrlRef = useRef<string | null>(null);
  const stillPreviewUrlRef = useRef<string | null>(null);
  const processVideoRef = useRef<(file: File, intensityValue: number) => Promise<void>>(
    async () => {}
  );
  const processImageRef = useRef<
    (file: File, intensityValue: number, isBatchProcessing?: boolean) => Promise<void>
  >(async () => {});
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
  const [sourcePreviewUrl, setSourcePreviewUrl] = useState<string | null>(null);
  const [stillPreviewUrl, setStillPreviewUrl] = useState<string | null>(null);
  const [encodedIntensity, setEncodedIntensity] = useState<number | null>(null);

  const handleFileSelect = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const imageFiles = fileArray.filter(isImageMediaFile);
      const videoFiles = fileArray.filter(isVideoMediaFile);
      
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
        const file = fileArray[0];
        const isVideo = isVideoMediaFile(file);
        setSelectedFiles([file]);
        setIsVideoFile(isVideo);
        setIsBatchMode(false);

        if (sourcePreviewUrlRef.current) {
          URL.revokeObjectURL(sourcePreviewUrlRef.current);
        }
        const previewUrl = URL.createObjectURL(file);
        sourcePreviewUrlRef.current = previewUrl;
        setSourcePreviewUrl(previewUrl);

        if (stillPreviewUrlRef.current) {
          URL.revokeObjectURL(stillPreviewUrlRef.current);
          stillPreviewUrlRef.current = null;
        }
        setStillPreviewUrl(null);
        videoMatrixRef.current = null;
        videoSourceFrameRef.current = null;
        setEncodedIntensity(null);

        if (isVideo) {
          await processVideoRef.current(file, intensity[0]);
        } else {
          await processImageRef.current(file, intensity[0], false);
        }
      } else {
        // Batch mode (images only)
        if (videoFiles.length > 0) {
          setError('Batch processing only supports images. Please select image files only.');
          return;
        }

        let batch = imageFiles;
        if (batch.length > PRO_COLOUR_BATCH_LIMIT) {
          batch = batch.slice(0, PRO_COLOUR_BATCH_LIMIT);
        }
        if (batch.length > FREE_COLOUR_BATCH_LIMIT) {
          const allowed = requestFeatureAccess(
            'colour-batch',
            'Colour-fix a whole memory card'
          );
          if (!allowed) {
            batch = batch.slice(0, FREE_COLOUR_BATCH_LIMIT);
            setError(
              `Free colour-fix is ${FREE_COLOUR_BATCH_LIMIT} photos at a time. Upgrade to do a whole card.`
            );
          }
        }

        setSelectedFiles(batch);
        setIsVideoFile(false);
        setIsBatchMode(batch.length > 1);
        return;
      }
    },
    [intensity, requestFeatureAccess]
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
          img.onerror = () =>
            reject(
              new Error(
                'Could not read that photo. iPhone HEIC shots work in Safari; otherwise save as JPEG first.'
              )
            );
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
      const matrix = getColorFilterMatrix(
        imageData.data,
        imageData.width,
        imageData.height
      );
      return applyColorMatrix(imageData, scaleColorMatrix(matrix, intensity));
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
      const jobId = ++videoJobRef.current;
      setIsProcessing(true);
      setError(null);
      setVideoProgress(0);
      setProcessedFrames(0);

      const video = document.createElement('video');
      const videoUrl = URL.createObjectURL(file);
      let stream: MediaStream | null = null;
      let recordCanvas: HTMLCanvasElement | null = null;
      let renderer: ColorMatrixRenderer | null = null;
      let audio: ElementAudioCapture | null = null;
      let stopPump: (() => void) | null = null;

      video.muted = true;
      video.playsInline = true;
      video.preload = 'auto';
      video.setAttribute('playsinline', 'true');
      video.setAttribute('muted', 'true');
      mountOffscreen(video);
      video.src = videoUrl;

      try {
        await waitForVideoData(video);
        let frameRate = DEFAULT_FRAME_RATE;
        try {
          await video.play();
          frameRate = await probeFrameRate(video);
          video.pause();
        } catch {
          // Muted play unlocks decoding; seeking still works if play is blocked.
        }

        const duration = video.duration;
        if (!Number.isFinite(duration) || duration <= 0) {
          throw new Error(
            'Could not read that video. Try an MP4 or WebM clip under 60 seconds.'
          );
        }
        if (duration > 60) {
          throw new Error(
            'Video too long. Please select a video under 60 seconds.'
          );
        }
        if (!video.videoWidth || !video.videoHeight) {
          throw new Error(
            'Could not read that video. Try an MP4 or WebM clip under 60 seconds.'
          );
        }

        const { width, height } = evenOutputSize(
          video.videoWidth,
          video.videoHeight
        );
        video.style.width = `${width}px`;
        video.style.height = `${height}px`;
        setTotalFrames(Math.max(1, Math.round(duration * frameRate)));

        await waitForVideoTime(video, 0);

        // One-shot analysis frame: the matrix and the still preview are both
        // derived on the CPU, where the cost is paid once rather than per frame.
        const sampleCanvas = document.createElement('canvas');
        sampleCanvas.width = width;
        sampleCanvas.height = height;
        const sampleCtx = sampleCanvas.getContext('2d', {
          willReadFrequently: true,
        });
        if (!sampleCtx) {
          throw new Error('Could not get canvas context');
        }
        sampleCtx.imageSmoothingEnabled = true;
        sampleCtx.imageSmoothingQuality = 'high';
        sampleCtx.drawImage(video, 0, 0, width, height);
        const sample = sampleCtx.getImageData(0, 0, width, height);
        const matrix = getColorFilterMatrix(sample.data, width, height);
        videoMatrixRef.current = matrix;
        videoSourceFrameRef.current = sample;
        const scaled = scaleColorMatrix(matrix, intensityValue / 100);

        const preview = applyColorMatrix(sample, scaled);
        const previewUrl = await imageDataToJpegUrl(preview);
        if (stillPreviewUrlRef.current) {
          URL.revokeObjectURL(stillPreviewUrlRef.current);
        }
        stillPreviewUrlRef.current = previewUrl;
        setStillPreviewUrl(previewUrl);

        recordCanvas = document.createElement('canvas');
        recordCanvas.width = width;
        recordCanvas.height = height;
        if (typeof recordCanvas.captureStream !== 'function') {
          throw new Error(
            'Video colour-fix is not supported in this browser. Try the latest Chrome, Firefox, or Safari.'
          );
        }
        mountOffscreen(recordCanvas);
        recordCanvas.style.width = `${width}px`;
        recordCanvas.style.height = `${height}px`;
        renderer = createColorMatrixRenderer(
          recordCanvas,
          video.videoWidth,
          video.videoHeight
        );
        renderer.setMatrix(scaled);

        audio = await setUpAudioPassthrough(video);

        await waitForVideoTime(video, 0);

        // Rate 0 means frames are captured only via requestFrame(), so every
        // decoded frame lands in the encoder exactly once.
        stream = recordCanvas.captureStream(0);
        if (audio) stream.addTrack(audio.track);
        renderer.render(video);
        requestCanvasFrame(stream);
        await waitOneFrame();

        const session = await startCanvasRecorder(stream, {
          videoBitsPerSecond: clampVideoBitrate(
            file.size,
            duration,
            width * height,
            frameRate
          ),
          withAudio: Boolean(audio),
        });

        if (jobId !== videoJobRef.current) {
          if (session.recorder.state !== 'inactive') session.recorder.stop();
          return;
        }

        const ended = new Promise<void>((resolve, reject) => {
          const timeoutId = window.setTimeout(() => {
            reject(new Error('Video encoding timed out. Try a shorter clip.'));
          }, (duration + 8) * 1000);
          video.onended = () => {
            window.clearTimeout(timeoutId);
            resolve();
          };
        });

        const activeRenderer = renderer;
        const activeStream = stream;
        let lastProgressAt = 0;
        stopPump = attachFramePump(video, () => {
          if (jobId !== videoJobRef.current) return;
          activeRenderer.render(video);
          requestCanvasFrame(activeStream);
          // Re-rendering this page on every frame would itself cost frames.
          const now = performance.now();
          if (now - lastProgressAt < PROGRESS_INTERVAL_MS) return;
          lastProgressAt = now;
          setVideoProgress(Math.min(100, (video.currentTime / duration) * 100));
          setProcessedFrames(
            Math.max(1, Math.round(video.currentTime * frameRate))
          );
        });
        await video.play();
        await ended;
        stopPump();
        stopPump = null;
        renderer.render(video);
        requestCanvasFrame(stream);
        await waitOneFrame();

        if (jobId !== videoJobRef.current) {
          if (session.recorder.state !== 'inactive') session.recorder.stop();
          return;
        }

        const processedVideoBlob = await session.stop();
        if (processedVideoBlob.size < 8 * 1024) {
          throw new Error(
            'Video encoding produced no data. Try a shorter MP4 or WebM clip.'
          );
        }
        const encodedDuration = await readBlobDuration(processedVideoBlob);
        if (encodedDuration !== null && encodedDuration < 0.2) {
          throw new Error(
            'Video encoding produced an empty clip. Try Chrome or Firefox with an MP4 file.'
          );
        }

        const outputType = recorderContainerType(session.mimeType);
        const correctedUrl = URL.createObjectURL(processedVideoBlob);
        const extension = outputType === 'video/mp4' ? 'mp4' : 'webm';
        setResults([
          {
            original: sourcePreviewUrlRef.current || videoUrl,
            corrected: correctedUrl,
            filename: file.name.replace(
              /\.[^/.]+$/,
              `_underwater_corrected.${extension}`
            ),
            isVideo: true,
            correctedBlob: processedVideoBlob,
          },
        ]);
        setEncodedIntensity(intensityValue);
      } catch (err) {
        if (jobId === videoJobRef.current) {
          setError(
            err instanceof Error ? err.message : 'Video processing failed'
          );
        }
      } finally {
        stopPump?.();
        audio?.dispose();
        renderer?.dispose();
        stream?.getTracks().forEach((track) => track.stop());
        recordCanvas?.remove();
        video.remove();
        URL.revokeObjectURL(videoUrl);
        if (jobId === videoJobRef.current) {
          setIsProcessing(false);
          setVideoProgress(0);
        }
      }
    },
    [getColorFilterMatrix]
  );

  processVideoRef.current = processVideo;
  processImageRef.current = processImage;

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
      const delay = isVideoFile ? 1000 : 150;
      processingTimeoutRef.current = setTimeout(() => {
        if (isVideoFile) {
          processVideoRef.current(file, intensityValue);
        } else {
          processImageRef.current(file, intensityValue, false);
        }
      }, delay);
    },
    [isVideoFile]
  );

  const handleIntensityChange = useCallback(
    (newIntensity: number[]) => {
      setIntensity(newIntensity);
      if (selectedFiles.length !== 1 || isBatchMode) return;

      if (isVideoFile) {
        videoJobRef.current += 1;
        setIsProcessing(false);
        setError(null);
      }

      if (isVideoFile && videoSourceFrameRef.current && videoMatrixRef.current) {
        const preview = applyColorMatrix(
          videoSourceFrameRef.current,
          scaleColorMatrix(videoMatrixRef.current, newIntensity[0] / 100)
        );
        void imageDataToJpegUrl(preview)
          .then((url) => {
            if (stillPreviewUrlRef.current) {
              URL.revokeObjectURL(stillPreviewUrlRef.current);
            }
            stillPreviewUrlRef.current = url;
            setStillPreviewUrl(url);
          })
          .catch(() => {});
      }

      debouncedProcessFile(selectedFiles[0], newIntensity[0]);
    },
    [selectedFiles, isBatchMode, isVideoFile, debouncedProcessFile]
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

  const handleSaveToLogbook = useCallback(
    async (result?: ProcessedResult) => {
      const targetResult = result || results[0];
      if (!targetResult || targetResult.isVideo) {
        setError('Only photos can be saved to the dive logbook right now.');
        return;
      }

      setSavingToLogbook(true);
      setError(null);
      try {
        let source: Blob;
        if (targetResult.correctedBlob) {
          source = targetResult.correctedBlob;
        } else {
          source = await fetch(targetResult.corrected).then((r) => r.blob());
        }
        const dataUrl = await compressImageForLogbook(source);
        storePendingPhoto({
          dataUrl,
          filename: targetResult.filename,
        });
        router.push('/logbook?attach=1');
      } catch (err) {
        console.error('Save to logbook failed:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Could not prepare photo for the logbook'
        );
      } finally {
        setSavingToLogbook(false);
      }
    },
    [results, router]
  );

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
    videoJobRef.current += 1;
    results.forEach((result) => {
      if (result.original && result.original !== sourcePreviewUrlRef.current) {
        URL.revokeObjectURL(result.original);
      }
      if (result.corrected && result.corrected !== stillPreviewUrlRef.current) {
        URL.revokeObjectURL(result.corrected);
      }
    });
    if (sourcePreviewUrlRef.current) {
      URL.revokeObjectURL(sourcePreviewUrlRef.current);
      sourcePreviewUrlRef.current = null;
    }
    if (stillPreviewUrlRef.current) {
      URL.revokeObjectURL(stillPreviewUrlRef.current);
      stillPreviewUrlRef.current = null;
    }
    videoMatrixRef.current = null;
    videoSourceFrameRef.current = null;
    setSourcePreviewUrl(null);
    setStillPreviewUrl(null);
    setEncodedIntensity(null);

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

  useEffect(() => {
    return () => {
      results.forEach((result) => {
        if (result.original && result.original !== sourcePreviewUrlRef.current) {
          URL.revokeObjectURL(result.original);
        }
        if (result.corrected && result.corrected !== stillPreviewUrlRef.current) {
          URL.revokeObjectURL(result.corrected);
        }
      });
    };
  }, [results]);

  useEffect(() => {
    return () => {
      videoJobRef.current += 1;
      if (sourcePreviewUrlRef.current) {
        URL.revokeObjectURL(sourcePreviewUrlRef.current);
      }
      if (stillPreviewUrlRef.current) {
        URL.revokeObjectURL(stillPreviewUrlRef.current);
      }
    };
  }, []);

  // Memoized hero section to prevent unnecessary re-renders
  const heroSection = useMemo(
    () => (
      <div className="relative overflow-hidden pb-4 pt-6 sm:pt-10">
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:text-left">
          <p className="brand-eyebrow">Colour Fix</p>
          <h1 className="brand-title mt-3 text-4xl sm:text-5xl">
            Underwater colour correction
          </h1>
          <p className="brand-lede mx-auto mt-4 max-w-2xl sm:mx-0">
            Restore the reds lost underwater — in your browser, with no upload
            and no watermark. Save the result straight into a dive.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-[#9bb8b3] sm:justify-start">
            <span>Instant preview</span>
            <span>Adjustable intensity</span>
            <span>Images & short video</span>
          </div>
        </div>
      </div>
    ),
    []
  );

  return (
    <div className="min-h-screen">
      {/* Hero Section - Memoized for performance */}
      {heroSection}

      {/* Main Tool */}
      <div className="mx-auto max-w-6xl px-0 pb-16 sm:px-4">
        <Card className="relative overflow-hidden border-[rgb(126_200_192_/_0.2)] bg-[rgb(6_38_47_/_0.65)] shadow-none">
          <div className="relative z-10">
            <CardHeader className="pb-4 text-center">
              <CardTitle className="text-2xl text-[#e8f4f1]">
                Upload your underwater photo
              </CardTitle>
              <p className="text-[#9bb8b3]">
                Automatically restores reds and balances colours lost underwater
              </p>
            </CardHeader>
            <CardContent>
              {selectedFiles.length === 0 ? (
                <div className="space-y-6">
                  <div
                    className="cursor-pointer rounded-lg border-2 border-dashed border-[#7ec8c0]/50 p-8 text-center transition-colors hover:border-[#7ec8c0] sm:p-12"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mx-auto mb-4 h-12 w-12 text-[#7ec8c0] sm:h-16 sm:w-16" />
                    <p className="mb-2 text-base text-[#e8f4f1] sm:text-lg">
                      Tap to upload underwater photos or video
                    </p>
                    <p className="text-sm text-[#9bb8b3]">
                      JPG, PNG, WebP, HEIC on iPhone · MP4, WebM, MOV (max 100MB)
                    </p>
                    <p className="mt-2 text-xs text-[#7a9a95]">
                      {isPro
                        ? `Select up to ${PRO_COLOUR_BATCH_LIMIT} photos`
                        : `Free: ${FREE_COLOUR_BATCH_LIMIT} photos at a time · Pro for a whole card`}
                    </p>
                  </div>
                  {error && (
                    <div className="rounded-lg border border-red-500 bg-red-900/20 p-4">
                      <p className="text-red-300">{error}</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*,.mp4,.webm,.mov,.m4v"
                    multiple
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files && files.length > 0) handleFileSelect(files);
                      e.target.value = '';
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
                    {isVideoFile && (
                      <p className="text-xs text-[#7a9a95]">
                        The still preview follows the slider immediately. The
                        clip re-encodes about a second after you stop dragging.
                      </p>
                    )}

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
                      
                      {/* Single Download / Logbook Buttons */}
                      {!isBatchMode && results.length > 0 && (
                        <>
                          <Button
                            onClick={() => handleDownload()}
                            size="sm"
                            className="w-full sm:w-auto"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                          {!results[0]?.isVideo && (
                            <Button
                              onClick={() => handleSaveToLogbook()}
                              size="sm"
                              variant="outline"
                              disabled={savingToLogbook}
                              className="w-full sm:w-auto"
                            >
                              <BookImage className="w-4 h-4 mr-2" />
                              {savingToLogbook
                                ? 'Preparing…'
                                : 'Save to Logbook'}
                            </Button>
                          )}
                        </>
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
                  {(results.length > 0 || (!isBatchMode && sourcePreviewUrl)) && (
                    <div className="space-y-4">
                      {!isBatchMode ? (
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <h3 className="text-white font-medium">Original</h3>
                            <div className="relative rounded-lg overflow-hidden bg-slate-700">
                              {isVideoFile ? (
                                <video
                                  src={sourcePreviewUrl || results[0]?.original}
                                  controls
                                  muted
                                  className="w-full h-auto"
                                  style={{ maxHeight: '400px' }}
                                />
                              ) : (
                                <img
                                  src={results[0]?.original}
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
                              {isVideoFile &&
                              stillPreviewUrl &&
                              (isProcessing ||
                                encodedIntensity !== intensity[0] ||
                                !results[0]?.corrected) ? (
                                <img
                                  src={stillPreviewUrl}
                                  alt="Color corrected preview frame"
                                  className="w-full h-auto"
                                />
                              ) : isVideoFile && results[0]?.corrected ? (
                                <video
                                  src={results[0].corrected}
                                  controls
                                  muted
                                  className="w-full h-auto"
                                  style={{ maxHeight: '400px' }}
                                />
                              ) : results[0]?.corrected ? (
                                <img
                                  src={results[0].corrected}
                                  alt="Color corrected underwater photo"
                                  className="w-full h-auto"
                                />
                              ) : (
                                <div className="flex h-40 items-center justify-center text-sm text-blue-300">
                                  Preparing preview…
                                </div>
                              )}
                              <div className="absolute top-2 left-2 bg-emerald-600/80 text-white px-2 py-1 rounded text-sm">
                                {isVideoFile && isProcessing
                                  ? 'Preview'
                                  : 'Corrected'}
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
                                  <div className="flex items-center gap-1">
                                    <Button
                                      onClick={() => handleDownload(result)}
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 px-2 text-xs"
                                      title="Download"
                                    >
                                      <Download className="w-3 h-3" />
                                    </Button>
                                    {!result.isVideo && (
                                      <Button
                                        onClick={() =>
                                          handleSaveToLogbook(result)
                                        }
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 px-2 text-xs"
                                        disabled={savingToLogbook}
                                        title="Save to Logbook"
                                      >
                                        <BookImage className="w-3 h-3" />
                                      </Button>
                                    )}
                                  </div>
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
      <PaywallDialog
        open={showPaywallDialog}
        onOpenChange={closePaywallDialog}
        feature={paywallFeature}
      />
    </div>
  );
}
