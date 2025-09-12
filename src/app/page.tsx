'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Dropzone } from '@/components/Dropzone';
import { SettingsPanel, ImageSettings } from '@/components/SettingsPanel';
import { PreviewGrid } from '@/components/PreviewGrid';
import { ProgressBar } from '@/components/ProgressBar';
import { PaywallDialog } from '@/components/PaywallDialog';
import { Badge } from '@/components/ui/badge';
// Removed logo imports since we no longer show logo on homepage
import { Zap, Shield, Cpu, Sparkles } from 'lucide-react';
import { useImageProcessor } from '@/hooks/useImageProcessor';
import { usePaywall } from '@/hooks/usePaywall';
import { loadImage } from '@/lib/canvas';

export default function HomePage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [settings, setSettings] = useState<ImageSettings>({
    format: 'image/jpeg' as const,
    quality: 0.85,
    scale: 1.0,
    lockAspectRatio: true,
    usePica: true,
    stripMetadata: false,
    upscaling: {
      method: 'bicubic',
      quality: 'standard',
      preserveDetails: true,
    },
    targetPPI: 72,
  });
  const [originalDimensions, setOriginalDimensions] = useState<
    { width: number; height: number } | undefined
  >();

  const {
    processImages,
    generateLogoPackage,
    generatePrintPackage,
    generateEcommercePackage,
    generateRealEstatePackage,
    isProcessing,
    progress,
    error,
    results,
    reset,
  } = useImageProcessor();

  const {
    isPro,
    showPaywallDialog,
    paywallFeature,
    closePaywallDialog,
    requestFeatureAccess,
  } = usePaywall();

  // Load first image dimensions for settings panel
  useEffect(() => {
    if (selectedFiles.length > 0) {
      loadImage(selectedFiles[0])
        .then((img) => {
          setOriginalDimensions({
            width: img.naturalWidth,
            height: img.naturalHeight,
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
      if (
        !requestFeatureAccess('batch', `Process ${files.length} images at once`)
      ) {
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
    <div className="space-y-6">
      {/* Enhanced Hero Section */}
      <div className="relative bg-gradient-to-b from-blue-50 to-white dark:from-blue-950/20 dark:to-slate-900">
        <div className="text-center py-12 px-4">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                <span className="text-slate-900 dark:text-slate-100">
                  Convert & Resize Images
                </span>
                <br />
                <span className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-400 dark:to-blue-500 bg-clip-text text-transparent">
                  Instantly & Privately
                </span>
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
                Professional image processing directly in your browser.
                <span className="block text-blue-600 dark:text-blue-400 font-semibold mt-1">
                  No uploads • No tracking • Always free
                </span>
              </p>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-8 pt-4">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                  <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="font-medium">100% Private</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="font-medium">Lightning Fast</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <span className="font-medium">Pro Quality</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Centered Main Upload Section */}
      <div className="max-w-4xl mx-auto px-4">
        <Card className="shadow-lg border border-blue-200/50 dark:border-blue-800/50 bg-white dark:bg-slate-800">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl text-slate-800 dark:text-slate-100">
              Drop Your Images Here
            </CardTitle>
            <CardDescription className="text-base text-slate-600 dark:text-slate-300">
              Supports PNG, JPG, WebP, and HEIC formats • Max{' '}
              {isPro ? '50' : '10'} files • 100% private processing
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
      </div>

      {/* Horizontal Settings Layout */}
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        <SettingsPanel
          settings={settings}
          onSettingsChange={setSettings}
          originalDimensions={originalDimensions}
          disabled={isProcessing}
          selectedFiles={selectedFiles}
          onGenerateLogoPackage={generateLogoPackage}
          onGeneratePrintPackage={generatePrintPackage}
          onGenerateEcommercePackage={generateEcommercePackage}
          onGenerateRealEstatePackage={generateRealEstatePackage}
        />

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
          <div className="flex justify-center">
            <Button
              onClick={handleConvert}
              size="lg"
              className="px-12 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              disabled={isProcessing}
            >
              <Zap className="w-5 h-5 mr-2" />
              Convert{' '}
              {selectedFiles.length > 1
                ? `${selectedFiles.length} Images`
                : 'Image'}
            </Button>
          </div>
        )}

        {/* Results Grid */}
        {results.length > 0 && (
          <PreviewGrid images={results} onClear={handleClearResults} />
        )}

        {/* Clean Pro Features Card */}
        {!isPro && (
          <Card className="border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-slate-800 dark:text-slate-100">
                <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Upgrade to Pro
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-300">
                Unlock advanced tools and batch processing for £3/month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
                  <span>Batch process up to 50 images</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
                  <span>Professional presets & templates</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
                  <span>AVIF & HEIC format support</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
                  <span>ZIP download for batches</span>
                </div>
              </div>
              <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
                <Sparkles className="w-4 h-4 mr-2" />
                Upgrade to Pro - £3/month
              </Button>
            </CardContent>
          </Card>
        )}
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
