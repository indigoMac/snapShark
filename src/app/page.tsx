'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dropzone } from '@/components/Dropzone';
import { SettingsPanel, ImageSettings } from '@/components/SettingsPanel';
import { PreviewGrid } from '@/components/PreviewGrid';
import { ProgressBar } from '@/components/ProgressBar';
import { PaywallDialog } from '@/components/PaywallDialog';
import { Badge } from '@/components/ui/badge';
import { Zap, Shield, Cpu, Sparkles } from 'lucide-react';
import { useImageProcessor } from '@/hooks/useImageProcessor';
import { usePaywall } from '@/hooks/usePaywall';
import { loadImage } from '@/lib/canvas';

export default function HomePage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [settings, setSettings] = useState<ImageSettings>({
    format: 'image/webp' as const,
    quality: 0.85,
    scale: 1.0,
    lockAspectRatio: true,
    usePica: true,
    stripMetadata: false
  });
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number } | undefined>();

  const { 
    processImages, 
    isProcessing, 
    progress, 
    error, 
    results, 
    reset 
  } = useImageProcessor();

  const { 
    isPro, 
    showPaywallDialog, 
    paywallFeature, 
    closePaywallDialog,
    requestFeatureAccess 
  } = usePaywall();

  // Load first image dimensions for settings panel
  useEffect(() => {
    if (selectedFiles.length > 0) {
      loadImage(selectedFiles[0])
        .then(img => {
          setOriginalDimensions({
            width: img.naturalWidth,
            height: img.naturalHeight
          });
        })
        .catch(console.error);
    } else {
      setOriginalDimensions(undefined);
    }
  }, [selectedFiles]);

  const handleFilesSelected = (files: File[]) => {
    // Check if batch processing requires Pro
    if (files.length > 1 && !isPro) {
      if (!requestFeatureAccess('batch', `Process ${files.length} images at once`)) {
        return;
      }
    }

    setSelectedFiles(files);
    reset(); // Clear previous results
  };

  const handleConvert = async () => {
    if (selectedFiles.length === 0) return;

    await processImages(selectedFiles, settings);
  };

  const handleClearResults = () => {
    reset();
    setSelectedFiles([]);
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Badge variant="secondary" className="text-xs">
            <Shield className="w-3 h-3 mr-1" />
            Privacy-First
          </Badge>
          <Badge variant="secondary" className="text-xs">
            <Cpu className="w-3 h-3 mr-1" />
            Client-Side
          </Badge>
        </div>
        
        <h1 className="text-4xl font-bold tracking-tight">
          Convert & Resize Images
          <span className="text-primary"> Instantly</span>
        </h1>
        
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Professional image processing directly in your browser. 
          No uploads, complete privacy, lightning fast.
        </p>
        
        <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Shield className="w-4 h-4" />
            <span>100% Private</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="w-4 h-4" />
            <span>Instant Processing</span>
          </div>
          <div className="flex items-center gap-1">
            <Sparkles className="w-4 h-4" />
            <span>Professional Quality</span>
          </div>
        </div>
      </div>

      {/* Main Interface */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - File Upload */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Images</CardTitle>
              <CardDescription>
                Drag and drop or click to select images. Supports PNG, JPG, WebP, and HEIC formats.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Dropzone 
                onFilesSelected={handleFilesSelected}
                maxFiles={isPro ? 50 : 10}
                disabled={isProcessing}
              />
            </CardContent>
          </Card>

          {/* Processing Progress */}
          {isProcessing && (
            <ProgressBar 
              current={progress.current}
              total={progress.total}
              currentFileName={progress.currentFileName}
            />
          )}

          {/* Error Display */}
          {error && (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <p className="text-destructive font-medium">Error:</p>
                <p className="text-sm">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Convert Button */}
          {selectedFiles.length > 0 && !isProcessing && (
            <Button 
              onClick={handleConvert}
              size="lg"
              className="w-full"
              disabled={isProcessing}
            >
              <Zap className="w-4 h-4 mr-2" />
              Convert {selectedFiles.length > 1 ? `${selectedFiles.length} Images` : 'Image'}
            </Button>
          )}

          {/* Results Grid */}
          {results.length > 0 && (
            <PreviewGrid 
              images={results}
              onClear={handleClearResults}
            />
          )}
        </div>

        {/* Right Column - Settings */}
        <div className="space-y-6">
          <SettingsPanel
            settings={settings}
            onSettingsChange={setSettings}
            originalDimensions={originalDimensions}
            disabled={isProcessing}
          />

          {/* Pro Features Card */}
          {!isPro && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Pro Features
                </CardTitle>
                <CardDescription>
                  Unlock advanced tools and batch processing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                    <span>Batch process up to 50 images</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                    <span>Professional presets & templates</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                    <span>AVIF & HEIC format support</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                    <span>ZIP download for batches</span>
                  </div>
                </div>
                <Button size="sm" className="w-full">
                  Upgrade to Pro - £3/month
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Paywall Dialog */}
      <PaywallDialog
        open={showPaywallDialog}
        onOpenChange={closePaywallDialog}
        feature={paywallFeature}
      />
    </div>
  );
}
