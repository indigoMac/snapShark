'use client';

import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Download, Upload, RotateCcw, Waves } from 'lucide-react';

interface ProcessedResult {
  original: string;
  corrected: string;
  filename: string;
}

export default function UnderwaterPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessedResult | null>(null);
  const [intensity, setIntensity] = useState([100]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }

      setSelectedFile(file);
      setError(null);
      setResult(null);

      // Create preview of original image
      const originalUrl = URL.createObjectURL(file);

      // Start processing immediately with default intensity
      await processImage(file, intensity[0]);
    },
    [intensity]
  );

  const processImage = useCallback(
    async (file: File, intensityValue: number) => {
      setIsProcessing(true);
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

        setResult({
          original: imageUrl,
          corrected: correctedUrl,
          filename: file.name.replace(/\.[^/.]+$/, '_underwater_corrected.jpg'),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Processing failed');
      } finally {
        setIsProcessing(false);
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

  const handleIntensityChange = useCallback(
    async (newIntensity: number[]) => {
      setIntensity(newIntensity);
      if (selectedFile) {
        await processImage(selectedFile, newIntensity[0]);
      }
    },
    [selectedFile, processImage]
  );

  const handleDownload = useCallback(() => {
    if (!result) return;

    const link = document.createElement('a');
    link.href = result.corrected;
    link.download = result.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [result]);

  const handleReset = useCallback(() => {
    setSelectedFile(null);
    setResult(null);
    setError(null);
    setIntensity([100]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/snapshark-logo-embedded.svg')] opacity-5 bg-center bg-no-repeat bg-contain"></div>
        <div className="relative max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Waves className="w-12 h-12 text-blue-400" />
            <h1 className="text-4xl md:text-6xl font-bold text-white">
              Underwater Color Correction
            </h1>
          </div>
          <p className="text-xl text-blue-200 mb-8 max-w-2xl mx-auto">
            Restore natural colors to your underwater photos with advanced
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

      {/* Main Tool */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <Card className="shadow-2xl border border-blue-800/50 bg-slate-800/50 backdrop-blur">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl text-white">
              Upload Your Underwater Photo
            </CardTitle>
            <p className="text-blue-300">
              Automatically restores reds and balances colors lost underwater
            </p>
          </CardHeader>
          <CardContent>
            {!selectedFile ? (
              <div className="space-y-6">
                <div
                  className="border-2 border-dashed border-blue-400 rounded-lg p-12 text-center hover:border-blue-300 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                  <p className="text-white text-lg mb-2">
                    Click to upload your underwater photo
                  </p>
                  <p className="text-blue-300 text-sm">
                    Supports JPG, PNG, WebP formats
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-6">
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
                      <span className="text-blue-400 font-mono text-sm ml-2">
                        {intensity[0]}%
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
                    {result && (
                      <Button
                        onClick={handleDownload}
                        size="sm"
                        className="w-full sm:w-auto"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    )}
                  </div>
                </div>

                {/* Before/After Preview */}
                {result && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h3 className="text-white font-medium">Original</h3>
                      <div className="relative rounded-lg overflow-hidden bg-slate-700">
                        <img
                          src={result.original}
                          alt="Original underwater photo"
                          className="w-full h-auto"
                        />
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
                        <img
                          src={result.corrected}
                          alt="Color corrected underwater photo"
                          className="w-full h-auto"
                        />
                        <div className="absolute top-2 left-2 bg-emerald-600/80 text-white px-2 py-1 rounded text-sm">
                          Corrected
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {isProcessing && (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-blue-300">
                      Processing your underwater photo...
                    </p>
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
        </Card>

        {/* Info Section */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <Card className="bg-slate-800/50 border-blue-800/50">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                🧠
              </div>
              <h3 className="text-white font-semibold mb-2">Smart Algorithm</h3>
              <p className="text-blue-300 text-sm">
                Analyzes your photo's color histogram to automatically detect
                and correct underwater color cast
              </p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-blue-800/50">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                🎨
              </div>
              <h3 className="text-white font-semibold mb-2">Red Recovery</h3>
              <p className="text-blue-300 text-sm">
                Restores red wavelengths that are naturally filtered out by
                water, bringing back natural skin tones
              </p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-blue-800/50">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
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
