'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Scissors,
  Download,
  Loader2,
  Sparkles,
  Crown,
  Settings,
  RefreshCcw,
} from 'lucide-react';
import {
  removeBackground,
  BackgroundRemovalOptions,
  BackgroundRemovalResult,
} from '@/lib/background-removal';
import {
  removeBackgroundAdvanced,
  AdvancedBackgroundRemovalOptions,
  AdvancedBackgroundRemovalResult,
} from '@/lib/advanced-background-removal';
import { downloadFile } from '@/lib/zip';
import { usePaywall } from '@/hooks/usePaywall';
import { formatFileSize } from '@/lib/utils';

interface BackgroundRemovalProps {
  selectedFile?: File;
  onFileSelect?: (file: File) => void;
}

export function BackgroundRemoval({
  selectedFile,
  onFileSelect,
}: BackgroundRemovalProps) {
  const { isPro, requestFeatureAccess } = usePaywall();

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<
    BackgroundRemovalResult | AdvancedBackgroundRemovalResult | null
  >(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [processedPreview, setProcessedPreview] = useState<string | null>(null);
  const [internalFile, setInternalFile] = useState<File | null>(null);
  const [useAdvancedMode, setUseAdvancedMode] = useState(true);

  // Settings state
  const [options, setOptions] = useState<BackgroundRemovalOptions>({
    modelSelection: 1,
    threshold: 0.5, // Lower threshold for better edge detection
    outputFormat: 'png',
    quality: 0.98, // Higher quality
    edgeSmoothing: true,
    featherRadius: 4, // Increased feathering for smoother edges
  });

  // Handle file selection
  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        // Store file internally
        setInternalFile(file);

        // Create preview
        const previewUrl = URL.createObjectURL(file);
        setOriginalPreview(previewUrl);
        setResult(null);
        setProcessedPreview(null);

        if (onFileSelect) {
          onFileSelect(file);
        }
      }
    },
    [onFileSelect]
  );

  // Get the current file to process
  const currentFile = selectedFile || internalFile;

  // Process background removal
  const handleRemoveBackground = useCallback(async () => {
    if (!currentFile) return;

    // Check Pro access
    if (!isPro) {
      if (!requestFeatureAccess('background-removal', 'Background Removal')) {
        return;
      }
    }

    setIsProcessing(true);

    try {
      console.log('🎯 Starting background removal...');

      let result;
      if (useAdvancedMode) {
        console.log('🚀 Using advanced computer vision algorithm...');
        result = await removeBackgroundAdvanced(currentFile, {
          useAI: false,
          useEdgeDetection: true,
          cannyLowThreshold: 50,
          cannyHighThreshold: 150,
          morphologyKernelSize: 3,
          gaussianBlurRadius: 2,
          gradientFeathering: 8,
          outputFormat: options.outputFormat,
          quality: options.quality,
        });
      } else {
        console.log('🤖 Using AI-based algorithm...');
        result = await removeBackground(currentFile, options);
      }

      console.log(
        `✅ Background removal completed in ${result.processingTime.toFixed(0)}ms`
      );
      console.log(`📊 Method: ${result.method || 'AI Segmentation'}`);
      console.log(
        `📊 Average confidence: ${(result.confidence * 100).toFixed(1)}%`
      );

      // Create preview URL
      const previewUrl = URL.createObjectURL(result.blob);
      setProcessedPreview(previewUrl);
      setResult(result);
    } catch (error) {
      console.error('❌ Background removal failed:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';

      if (
        errorMessage.includes('MediaPipe') ||
        errorMessage.includes('initialize')
      ) {
        alert(
          'Background removal engine failed to load. Please check your internet connection and refresh the page.'
        );
      } else {
        alert(`Background removal failed: ${errorMessage}`);
      }
    } finally {
      setIsProcessing(false);
    }
  }, [currentFile, options, isPro, requestFeatureAccess]);

  // Download result
  const handleDownload = useCallback(() => {
    if (!result || !currentFile) return;

    const filename =
      currentFile.name.replace(/\.[^/.]+$/, '') +
      '_no_bg.' +
      options.outputFormat;
    downloadFile(result.blob, filename);
  }, [result, currentFile, options.outputFormat]);

  // Reset processing
  const handleReset = useCallback(() => {
    setResult(null);
    setProcessedPreview(null);
    setInternalFile(null);
    if (originalPreview) {
      URL.revokeObjectURL(originalPreview);
    }
    if (processedPreview) {
      URL.revokeObjectURL(processedPreview);
    }
    setOriginalPreview(null);
    setProcessedPreview(null);
  }, [originalPreview, processedPreview]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Scissors className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Background Removal</h2>
          {!isPro && <Crown className="w-5 h-5 text-amber-500" />}
        </div>
        <p className="text-muted-foreground">
          AI-powered background removal for professional results
        </p>
        {!isPro && (
          <Badge variant="outline" className="mt-2">
            Pro Feature
          </Badge>
        )}
      </div>

      {/* File Upload */}
      {!currentFile && !originalPreview && (
        <Card>
          <CardContent className="pt-6">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <Scissors className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                Upload Image for Background Removal
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Supports PNG, JPG, and WebP formats
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="bg-removal-upload"
              />
              <label htmlFor="bg-removal-upload">
                <Button asChild>
                  <span>Choose Image</span>
                </Button>
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview and Controls */}
      {(currentFile || originalPreview) && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Image Previews */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Before & After
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Original */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Original</Label>
                <div className="aspect-square bg-muted rounded-lg overflow-hidden border">
                  {originalPreview && (
                    <img
                      src={originalPreview}
                      alt="Original"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              </div>

              {/* Processed */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Background Removed
                </Label>
                <div className="aspect-square bg-muted rounded-lg overflow-hidden border relative">
                  {/* Checkerboard pattern for transparency */}
                  <div
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage: `
                        linear-gradient(45deg, #ccc 25%, transparent 25%), 
                        linear-gradient(-45deg, #ccc 25%, transparent 25%), 
                        linear-gradient(45deg, transparent 75%, #ccc 75%), 
                        linear-gradient(-45deg, transparent 75%, #ccc 75%)
                      `,
                      backgroundSize: '20px 20px',
                      backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                    }}
                  />
                  {processedPreview && (
                    <img
                      src={processedPreview}
                      alt="Background removed"
                      className="relative w-full h-full object-cover"
                    />
                  )}
                  {!processedPreview && !isProcessing && (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                      Click "Remove Background" to process
                    </div>
                  )}
                  {isProcessing && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Results Info */}
            {result && (
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Processing Results</h4>
                <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                  <div>
                    <span className="text-muted-foreground">
                      Processing time:
                    </span>
                    <div className="font-medium">
                      {result.processingTime.toFixed(0)}ms
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Confidence:</span>
                    <div className="font-medium">
                      {(result.confidence * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">File size:</span>
                    <div className="font-medium">
                      {formatFileSize(result.blob.size)}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Dimensions:</span>
                    <div className="font-medium">
                      {result.width}×{result.height}
                    </div>
                  </div>
                </div>

                {/* Quality Indicators */}
                <div className="flex flex-wrap gap-2">
                  {result && 'method' in result && (
                    <Badge variant="default" className="text-xs">
                      🚀 {result.method}
                    </Badge>
                  )}
                  {useAdvancedMode && (
                    <Badge variant="secondary" className="text-xs">
                      🔬 Computer Vision
                    </Badge>
                  )}
                  {!useAdvancedMode && options.edgeSmoothing && (
                    <Badge variant="secondary" className="text-xs">
                      ✨ Edge Smoothing
                    </Badge>
                  )}
                  {!useAdvancedMode && options.featherRadius > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      🎨 Anti-Aliasing
                    </Badge>
                  )}
                  {!useAdvancedMode && options.threshold <= 0.5 && (
                    <Badge variant="secondary" className="text-xs">
                      🔍 Precision Mode
                    </Badge>
                  )}
                  {options.quality >= 0.98 && (
                    <Badge variant="secondary" className="text-xs">
                      💎 Ultra Quality
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Settings Panel */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Settings
            </h3>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Background Removal Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Model Selection */}
                <div className="space-y-2">
                  <Label>AI Model</Label>
                  <Select
                    value={options.modelSelection.toString()}
                    onValueChange={(value) =>
                      setOptions((prev) => ({
                        ...prev,
                        modelSelection: parseInt(value) as 0 | 1,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">
                        General (256×256) - Faster
                      </SelectItem>
                      <SelectItem value="1">
                        Landscape (144×256) - Better Quality
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Threshold */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Detection Threshold</Label>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(options.threshold * 100)}%
                    </span>
                  </div>
                  <Slider
                    value={[options.threshold * 100]}
                    onValueChange={(values) =>
                      setOptions((prev) => ({
                        ...prev,
                        threshold: values[0] / 100,
                      }))
                    }
                    min={10}
                    max={90}
                    step={5}
                  />
                </div>

                {/* Edge Smoothing */}
                <div className="flex items-center justify-between">
                  <Label>Edge Smoothing</Label>
                  <Switch
                    checked={options.edgeSmoothing}
                    onCheckedChange={(checked) =>
                      setOptions((prev) => ({
                        ...prev,
                        edgeSmoothing: checked,
                      }))
                    }
                  />
                </div>

                {/* Algorithm Selection */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Advanced CV Algorithm</Label>
                    <Switch
                      checked={useAdvancedMode}
                      onCheckedChange={setUseAdvancedMode}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {useAdvancedMode
                      ? 'Uses computer vision for better edge quality'
                      : 'Uses AI for general purpose removal'}
                  </p>
                </div>

                {/* High Quality Mode - only for AI mode */}
                {!useAdvancedMode && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>High Quality Mode</Label>
                      <Switch
                        checked={
                          options.threshold <= 0.5 && options.featherRadius >= 4
                        }
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setOptions((prev) => ({
                              ...prev,
                              threshold: 0.4,
                              featherRadius: 6,
                              quality: 0.99,
                            }));
                          } else {
                            setOptions((prev) => ({
                              ...prev,
                              threshold: 0.6,
                              featherRadius: 2,
                              quality: 0.95,
                            }));
                          }
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Enables maximum edge quality with advanced processing
                    </p>
                  </div>
                )}

                {/* Feather Radius */}
                {options.edgeSmoothing && (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Feather Radius</Label>
                      <span className="text-sm text-muted-foreground">
                        {options.featherRadius}px
                      </span>
                    </div>
                    <Slider
                      value={[options.featherRadius]}
                      onValueChange={(values) =>
                        setOptions((prev) => ({
                          ...prev,
                          featherRadius: values[0],
                        }))
                      }
                      min={0}
                      max={10}
                      step={1}
                    />
                  </div>
                )}

                {/* Output Format */}
                <div className="space-y-2">
                  <Label>Output Format</Label>
                  <Select
                    value={options.outputFormat}
                    onValueChange={(value: 'png' | 'webp') =>
                      setOptions((prev) => ({ ...prev, outputFormat: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="png">
                        PNG (Best Compatibility)
                      </SelectItem>
                      <SelectItem value="webp">
                        WebP (Smaller File Size)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Quality */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Quality</Label>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(options.quality * 100)}%
                    </span>
                  </div>
                  <Slider
                    value={[options.quality * 100]}
                    onValueChange={(values) =>
                      setOptions((prev) => ({
                        ...prev,
                        quality: values[0] / 100,
                      }))
                    }
                    min={50}
                    max={100}
                    step={5}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleRemoveBackground}
                disabled={!currentFile || isProcessing}
                className="w-full"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Scissors className="w-4 h-4 mr-2" />
                    Remove Background
                  </>
                )}
              </Button>

              {result && (
                <Button
                  onClick={handleDownload}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Result
                </Button>
              )}

              <Button
                onClick={handleReset}
                variant="ghost"
                className="w-full"
                size="sm"
              >
                <RefreshCcw className="w-4 h-4 mr-2" />
                Start Over
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
