'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Settings, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormatSelect } from './FormatSelect';
import { PresetsSelect } from './PresetsSelect';
import { ProBadge } from './ProBadge';
import { OutputFormat, isLossyFormat } from '@/lib/formats';
import { usePresets } from '@/hooks/usePresets';
import { usePaywall } from '@/hooks/usePaywall';
import type { UpscalingOptions } from '@/workers/imageWorker';

export interface ImageSettings {
  format: OutputFormat;
  quality: number;
  width?: number;
  height?: number;
  scale?: number;
  lockAspectRatio: boolean;
  usePica: boolean;
  stripMetadata: boolean;
  targetPPI?: number;
  upscaling?: UpscalingOptions;
}

interface SettingsPanelProps {
  settings: ImageSettings;
  onSettingsChange: (settings: ImageSettings) => void;
  originalDimensions?: { width: number; height: number };
  disabled?: boolean;
  selectedFiles?: File[];
  onGenerateLogoPackage?: (logoFile: File) => Promise<void>;
  onGeneratePrintPackage?: (printFile: File) => Promise<void>;
  onGenerateEcommercePackage?: (productFile: File) => Promise<void>;
  onGenerateRealEstatePackage?: (propertyFile: File) => Promise<void>;
}

export function SettingsPanel({
  settings,
  onSettingsChange,
  originalDimensions,
  disabled = false,
  selectedFiles = [],
  onGenerateLogoPackage,
  onGeneratePrintPackage,
  onGenerateEcommercePackage,
  onGenerateRealEstatePackage,
}: SettingsPanelProps) {
  const { selectedPreset, applyPreset, clearSelection } = usePresets();
  const { isPro, requestFeatureAccess } = usePaywall();

  const [localWidth, setLocalWidth] = useState<string>(
    settings.width?.toString() || ''
  );
  const [localHeight, setLocalHeight] = useState<string>(
    settings.height?.toString() || ''
  );

  const [activeTab, setActiveTab] = useState<'settings' | 'packages'>(
    'settings'
  );

  useEffect(() => {
    setLocalWidth(settings.width?.toString() || '');
    setLocalHeight(settings.height?.toString() || '');
  }, [settings.width, settings.height]);

  const handleFormatChange = (format: OutputFormat) => {
    // Check if advanced format requires Pro
    if (format === 'image/avif' && !isPro) {
      if (!requestFeatureAccess('advanced-formats', 'AVIF format')) {
        return;
      }
    }

    onSettingsChange({ ...settings, format });
  };

  const handlePresetChange = (presetId: string | null) => {
    if (!presetId) {
      clearSelection();
      return;
    }

    const presetData = applyPreset(presetId);
    if (!presetData) return;

    // Check if preset requires Pro access
    const preset = selectedPreset;
    if (preset && 'isPro' in preset && preset.isPro && !isPro) {
      if (!requestFeatureAccess('presets', preset.name)) {
        return;
      }
    }

    // Apply preset settings
    if (presetData.dimensions.length === 1) {
      const { width, height } = presetData.dimensions[0];
      onSettingsChange({
        ...settings,
        width,
        height,
        format: presetData.format || settings.format,
        quality: presetData.quality || settings.quality,
        scale: undefined,
      });
    }
  };

  const handleWidthChange = (value: string) => {
    setLocalWidth(value);
    const numValue = parseInt(value) || undefined;

    if (settings.lockAspectRatio && numValue && originalDimensions) {
      const ratio = originalDimensions.height / originalDimensions.width;
      const newHeight = Math.round(numValue * ratio);
      setLocalHeight(newHeight.toString());
      onSettingsChange({
        ...settings,
        width: numValue,
        height: newHeight,
        scale: undefined,
      });
    } else {
      onSettingsChange({
        ...settings,
        width: numValue,
        scale: undefined,
      });
    }
  };

  const handleHeightChange = (value: string) => {
    setLocalHeight(value);
    const numValue = parseInt(value) || undefined;

    if (settings.lockAspectRatio && numValue && originalDimensions) {
      const ratio = originalDimensions.width / originalDimensions.height;
      const newWidth = Math.round(numValue * ratio);
      setLocalWidth(newWidth.toString());
      onSettingsChange({
        ...settings,
        height: numValue,
        width: newWidth,
        scale: undefined,
      });
    } else {
      onSettingsChange({
        ...settings,
        height: numValue,
        scale: undefined,
      });
    }
  };

  const handleScaleChange = useCallback(
    (values: number[]) => {
      const scale = values[0] / 100;
      onSettingsChange({
        ...settings,
        scale,
        width: undefined,
        height: undefined,
      });
    },
    [settings, onSettingsChange]
  );

  // Debounced quality handler for better mobile performance
  const handleQualityChange = useCallback(
    (values: number[]) => {
      onSettingsChange({ ...settings, quality: values[0] / 100 });
    },
    [settings, onSettingsChange]
  );

  const handleMetadataToggle = (enabled: boolean) => {
    if (!isPro && enabled) {
      if (!requestFeatureAccess('advanced-formats', 'Metadata stripping')) {
        return;
      }
    }

    onSettingsChange({ ...settings, stripMetadata: enabled });
  };

  const handleUpscalingChange = (updates: Partial<UpscalingOptions>) => {
    const currentUpscaling = settings.upscaling || {
      method: 'bicubic',
      quality: 'standard',
      preserveDetails: true,
    };

    onSettingsChange({
      ...settings,
      upscaling: { ...currentUpscaling, ...updates },
    });
  };

  // Calculate if upscaling is happening
  const isUpscaling = useMemo(() => {
    if (!originalDimensions) return false;

    if (settings.scale && settings.scale > 1.0) return true;

    if (settings.width && settings.width > originalDimensions.width)
      return true;
    if (settings.height && settings.height > originalDimensions.height)
      return true;

    return false;
  }, [originalDimensions, settings.scale, settings.width, settings.height]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Image Settings</CardTitle>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            🔒 Files stay on your device
          </div>
        </div>

        {/* Two-Tab Navigation */}
        <div className="flex space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg mt-4">
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded transition-colors ${
              activeTab === 'settings'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
          <button
            onClick={() => setActiveTab('packages')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded transition-colors ${
              activeTab === 'packages'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Package className="w-4 h-4" />
            Packages
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {activeTab === 'settings' && (
          <>
            {/* Quick Settings - Most Used */}
            <div className="space-y-4 p-4 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800/30 dark:to-gray-800/30 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Quick Settings
                </h3>
                <span className="text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 px-2 py-1 rounded">
                  Most Used
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Quick Presets */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Presets</Label>
                  <PresetsSelect
                    value={selectedPreset?.id || null}
                    onValueChange={handlePresetChange}
                    disabled={disabled}
                  />
                </div>

                {/* Format */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Format</Label>
                  <FormatSelect
                    value={settings.format}
                    onValueChange={handleFormatChange}
                    disabled={disabled}
                  />
                </div>

                {/* Quality */}
                {isLossyFormat(settings.format) && (
                  <div className="space-y-2 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Quality</Label>
                      <span className="text-sm text-slate-500">
                        {Math.round(settings.quality * 100)}%
                      </span>
                    </div>
                    <Slider
                      value={[settings.quality * 100]}
                      onValueChange={handleQualityChange}
                      min={1}
                      max={100}
                      step={1}
                      disabled={disabled}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Tip for Packages */}
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                💡 Need multiple formats at once? Check out the{' '}
                <button
                  onClick={() => setActiveTab('packages')}
                  className="underline hover:no-underline"
                >
                  Packages tab
                </button>{' '}
                for professional workflows!
              </p>
            </div>

            {/* Advanced Controls */}
            <div className="space-y-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-amber-900 dark:text-amber-100">
                  Advanced Controls
                </h3>
                <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 px-2 py-1 rounded">
                  Manual Settings
                </span>
              </div>

              {/* Scale */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Scale</Label>
                  <span className="text-sm text-muted-foreground">
                    {settings.scale
                      ? `${Math.round(settings.scale * 100)}%`
                      : 'Custom'}
                  </span>
                </div>
                <Slider
                  value={[settings.scale ? settings.scale * 100 : 100]}
                  onValueChange={handleScaleChange}
                  min={5}
                  max={600}
                  step={5}
                  disabled={disabled}
                />
              </div>

              {/* Dimensions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Dimensions</Label>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="lock-aspect" className="text-sm">
                      Lock aspect
                    </Label>
                    <Switch
                      id="lock-aspect"
                      checked={settings.lockAspectRatio}
                      onCheckedChange={(checked) =>
                        onSettingsChange({
                          ...settings,
                          lockAspectRatio: checked,
                        })
                      }
                      disabled={disabled}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="width" className="text-xs">
                      Width (px)
                    </Label>
                    <Input
                      id="width"
                      type="number"
                      value={localWidth}
                      onChange={(e) => handleWidthChange(e.target.value)}
                      placeholder="Auto"
                      disabled={disabled}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="height" className="text-xs">
                      Height (px)
                    </Label>
                    <Input
                      id="height"
                      type="number"
                      value={localHeight}
                      onChange={(e) => handleHeightChange(e.target.value)}
                      placeholder="Auto"
                      disabled={disabled}
                    />
                  </div>
                </div>

                {originalDimensions && (
                  <p className="text-xs text-muted-foreground">
                    Original: {originalDimensions.width} ×{' '}
                    {originalDimensions.height}
                  </p>
                )}

                {/* PPI/Resolution Section */}
                <div className="space-y-2 pt-3 border-t">
                  <Label className="text-sm font-medium">
                    Print Resolution
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() =>
                        onSettingsChange({ ...settings, targetPPI: 72 })
                      }
                      className={`p-2 text-xs rounded border ${
                        settings.targetPPI === 72 || !settings.targetPPI
                          ? 'bg-blue-50 border-blue-200 text-blue-700'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      72 PPI
                      <br />
                      <span className="text-xs opacity-75">Web</span>
                    </button>
                    <button
                      onClick={() =>
                        onSettingsChange({ ...settings, targetPPI: 150 })
                      }
                      className={`p-2 text-xs rounded border ${
                        settings.targetPPI === 150
                          ? 'bg-blue-50 border-blue-200 text-blue-700'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      150 PPI
                      <br />
                      <span className="text-xs opacity-75">Draft</span>
                    </button>
                    <button
                      onClick={() =>
                        onSettingsChange({ ...settings, targetPPI: 300 })
                      }
                      className={`p-2 text-xs rounded border ${
                        settings.targetPPI === 300
                          ? 'bg-blue-50 border-blue-200 text-blue-700'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      300 PPI
                      <br />
                      <span className="text-xs opacity-75">Print</span>
                    </button>
                  </div>
                  {settings.targetPPI &&
                    settings.targetPPI > 72 &&
                    originalDimensions && (
                      <div className="text-xs text-muted-foreground p-2 bg-blue-50 rounded">
                        For {settings.targetPPI} PPI printing:{' '}
                        {Math.round(
                          (originalDimensions.width / 72) * settings.targetPPI
                        )}{' '}
                        ×{' '}
                        {Math.round(
                          (originalDimensions.height / 72) * settings.targetPPI
                        )}{' '}
                        pixels recommended
                      </div>
                    )}
                </div>
              </div>

              {/* Advanced Options */}
              <div className="space-y-3 pt-3 border-t">
                <Label className="text-sm font-medium">Advanced Options</Label>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm">High-quality resize</Label>
                    <p className="text-xs text-muted-foreground">
                      Use Pica for better image quality
                    </p>
                  </div>
                  <Switch
                    checked={settings.usePica}
                    onCheckedChange={(checked) =>
                      onSettingsChange({ ...settings, usePica: checked })
                    }
                    disabled={disabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 flex-1">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Strip metadata</Label>
                      {!isPro && <ProBadge />}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Remove EXIF data for privacy
                    </p>
                  </div>
                  <Switch
                    checked={settings.stripMetadata}
                    onCheckedChange={handleMetadataToggle}
                    disabled={disabled || (!isPro && !settings.stripMetadata)}
                  />
                </div>

                {/* Simple Upscaling Section */}
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium">
                        Advanced Upscaling
                      </h4>
                      {!isPro && <ProBadge />}
                    </div>
                    {!isUpscaling && (
                      <div className="text-xs text-muted-foreground">
                        Scale above 100% to activate
                      </div>
                    )}
                  </div>

                  {isUpscaling && (
                    <div className="space-y-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-xs font-medium">
                          Upscaling detected
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="upscaling-method" className="text-xs">
                            Method
                          </Label>
                          <Select
                            value={settings.upscaling?.method || 'bicubic'}
                            onValueChange={(
                              value: UpscalingOptions['method']
                            ) => handleUpscalingChange({ method: value })}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="bicubic">
                                Bicubic (Free)
                              </SelectItem>
                              <SelectItem value="lanczos" disabled={!isPro}>
                                Lanczos (Pro)
                              </SelectItem>
                              <SelectItem value="ai-enhanced" disabled={!isPro}>
                                AI Enhanced (Pro)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'packages' && (
          <div className="space-y-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Professional Packages
              </h3>
              <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-2 py-1 rounded">
                Pro Features
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Web Developer Logo Package */}
              <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-slate-900 dark:text-slate-100">
                    Web Developer Package
                  </h4>
                  {!isPro && (
                    <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 px-2 py-1 rounded-full">
                      Pro
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  Complete logo set: 16×16 to 512×512 PNG, Apple Touch icons,
                  and responsive website logos
                </p>
                <ul className="text-xs text-gray-500 dark:text-gray-400 mb-3 space-y-1">
                  <li>• 16×16, 32×32, 48×48 favicons</li>
                  <li>• 128×128, 256×256, 512×512 PWA icons</li>
                  <li>• Apple Touch icons (180×180)</li>
                  <li>• Responsive website logos</li>
                </ul>
                <button
                  onClick={() => {
                    if (!isPro) {
                      window.location.href = '/pricing';
                      return;
                    }

                    if (!onGenerateLogoPackage) {
                      alert('Logo package function not available');
                      return;
                    }

                    if (selectedFiles.length === 0) {
                      alert('Please select a logo file first');
                      return;
                    }

                    // Use the first file as the logo
                    onGenerateLogoPackage(selectedFiles[0]).catch((error) => {
                      alert(
                        'Failed to generate logo package: ' +
                          (error instanceof Error
                            ? error.message
                            : 'Unknown error')
                      );
                    });
                  }}
                  className={`w-full py-3 sm:py-2 px-3 text-sm sm:text-xs rounded font-medium transition-colors disabled:opacity-50 min-h-[44px] sm:min-h-[auto] touch-manipulation active:scale-95 active:transition-transform active:duration-75 ${
                    !isPro
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white'
                  }`}
                  disabled={
                    isPro &&
                    (disabled || !selectedFiles || selectedFiles.length === 0)
                  }
                >
                  {isPro ? 'Generate Web Package' : 'Get Pro for Web Package'}
                </button>
              </div>

              {/* Print Package */}
              <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-slate-900 dark:text-slate-100">
                    Print Package
                  </h4>
                  {!isPro && (
                    <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 px-2 py-1 rounded-full">
                      Pro
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  Smart print sizes based on your image's aspect ratio,
                  optimized for poster printing at 300 PPI
                </p>
                <ul className="text-xs text-gray-500 dark:text-gray-400 mb-3 space-y-1">
                  <li>• Auto-detects best print sizes</li>
                  <li>• 300 PPI for sharp printing</li>
                  <li>• 95% JPEG quality</li>
                  <li>• Maintains aspect ratio</li>
                </ul>
                <button
                  onClick={() => {
                    if (!isPro) {
                      window.location.href = '/pricing';
                      return;
                    }

                    if (!onGeneratePrintPackage) {
                      alert('Print Package generation not available');
                      return;
                    }

                    if (!selectedFiles || selectedFiles.length === 0) {
                      alert('Please select an image first');
                      return;
                    }

                    onGeneratePrintPackage(selectedFiles[0]).catch((error) => {
                      console.error('Print package generation failed:', error);
                      alert(
                        'Print package generation failed. Please try again.'
                      );
                    });
                  }}
                  className={`w-full py-3 sm:py-2 px-3 text-sm sm:text-xs rounded font-medium transition-colors disabled:opacity-50 min-h-[44px] sm:min-h-[auto] touch-manipulation active:scale-95 active:transition-transform active:duration-75 ${
                    !isPro
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white'
                  }`}
                  disabled={
                    isPro &&
                    (disabled || !selectedFiles || selectedFiles.length === 0)
                  }
                >
                  {isPro
                    ? 'Generate Print Package'
                    : 'Get Pro for Print Package'}
                </button>
              </div>

              {/* E-commerce Package */}
              <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-slate-900 dark:text-slate-100">
                    E-commerce Package
                  </h4>
                  {!isPro && (
                    <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 px-2 py-1 rounded-full">
                      Pro
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  Square product images for all major marketplaces: Amazon,
                  eBay, Etsy, Shopify, and more
                </p>
                <ul className="text-xs text-gray-500 dark:text-gray-400 mb-3 space-y-1">
                  <li>• Amazon (1000×1000, 1500×1500)</li>
                  <li>• eBay, Etsy (500×500, 800×800)</li>
                  <li>• Shopify (600×600, 1200×1200)</li>
                  <li>• Social media squares</li>
                </ul>
                <button
                  onClick={() => {
                    if (!isPro) {
                      window.location.href = '/pricing';
                      return;
                    }

                    if (!onGenerateEcommercePackage) {
                      alert('E-commerce Package generation not available');
                      return;
                    }

                    if (!selectedFiles || selectedFiles.length === 0) {
                      alert('Please select a product image first');
                      return;
                    }

                    onGenerateEcommercePackage(selectedFiles[0]).catch(
                      (error) => {
                        console.error(
                          'E-commerce package generation failed:',
                          error
                        );
                        alert(
                          'E-commerce package generation failed. Please try again.'
                        );
                      }
                    );
                  }}
                  className={`w-full py-3 sm:py-2 px-3 text-sm sm:text-xs rounded font-medium transition-colors disabled:opacity-50 min-h-[44px] sm:min-h-[auto] touch-manipulation active:scale-95 active:transition-transform active:duration-75 ${
                    !isPro
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white'
                  }`}
                  disabled={
                    isPro &&
                    (disabled || !selectedFiles || selectedFiles.length === 0)
                  }
                >
                  {isPro
                    ? 'Generate E-commerce Package'
                    : 'Get Pro for E-commerce Package'}
                </button>
              </div>

              {/* Real Estate Package */}
              <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-slate-900 dark:text-slate-100">
                    Real Estate Package
                  </h4>
                  {!isPro && (
                    <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 px-2 py-1 rounded-full">
                      Pro
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  Property photos for MLS listings, social media, and marketing
                  materials
                </p>
                <ul className="text-xs text-gray-500 dark:text-gray-400 mb-3 space-y-1">
                  <li>• MLS standard (1024×768, 1200×800)</li>
                  <li>• Social media (1080×1080, 1200×630)</li>
                  <li>• Marketing flyers (1500×1000)</li>
                  <li>• Website galleries (800×600)</li>
                </ul>
                <button
                  onClick={() => {
                    if (!isPro) {
                      window.location.href = '/pricing';
                      return;
                    }

                    if (!onGenerateRealEstatePackage) {
                      alert('Real Estate Package generation not available');
                      return;
                    }

                    if (!selectedFiles || selectedFiles.length === 0) {
                      alert('Please select a property image first');
                      return;
                    }

                    onGenerateRealEstatePackage(selectedFiles[0]).catch(
                      (error) => {
                        console.error(
                          'Real Estate package generation failed:',
                          error
                        );
                        alert(
                          'Real Estate package generation failed. Please try again.'
                        );
                      }
                    );
                  }}
                  className={`w-full py-3 sm:py-2 px-3 text-sm sm:text-xs rounded font-medium transition-colors disabled:opacity-50 min-h-[44px] sm:min-h-[auto] touch-manipulation active:scale-95 active:transition-transform active:duration-75 ${
                    !isPro
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white'
                  }`}
                  disabled={
                    isPro &&
                    (disabled || !selectedFiles || selectedFiles.length === 0)
                  }
                >
                  {isPro
                    ? 'Generate Real Estate Package'
                    : 'Get Pro for Real Estate Package'}
                </button>
              </div>

              {/* Background Removal Feature */}
              <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm sm:col-span-2">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-slate-900 dark:text-slate-100">
                    Background Removal Feature
                  </h4>
                  {!isPro && (
                    <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 px-2 py-1 rounded-full">
                      Pro
                    </span>
                  )}
                </div>

                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  Remove backgrounds with professional AI precision - Perfect
                  for Logo Creation from an image
                </p>

                <ul className="text-xs text-gray-500 dark:text-gray-400 mb-3 space-y-1">
                  <li>• Advanced computer vision algorithms</li>
                  <li>• Professional edge refinement</li>
                  <li>• Perfect for logo creation</li>
                  <li>• High-quality transparent PNGs</li>
                </ul>

                <button
                  onClick={() => {
                    if (!isPro) {
                      window.location.href = '/pricing';
                      return;
                    }
                    window.location.href = '/background-removal';
                  }}
                  className={`w-full py-3 sm:py-2 px-3 text-sm sm:text-xs rounded font-medium transition-colors disabled:opacity-50 min-h-[44px] sm:min-h-[auto] touch-manipulation active:scale-95 active:transition-transform active:duration-75 ${
                    !isPro
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white'
                  }`}
                  disabled={disabled}
                >
                  {isPro
                    ? 'Open Background Removal'
                    : 'Get Pro for Background Removal'}
                </button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
