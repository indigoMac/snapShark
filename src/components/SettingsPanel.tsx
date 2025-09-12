'use client';

import { useState, useEffect, useMemo } from 'react';
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
}

export function SettingsPanel({
  settings,
  onSettingsChange,
  originalDimensions,
  disabled = false,
  selectedFiles = [],
  onGenerateLogoPackage,
  onGeneratePrintPackage,
}: SettingsPanelProps) {
  const { selectedPreset, applyPreset, clearSelection } = usePresets();
  const { isPro, requestFeatureAccess } = usePaywall();

  const [localWidth, setLocalWidth] = useState<string>(
    settings.width?.toString() || ''
  );
  const [localHeight, setLocalHeight] = useState<string>(
    settings.height?.toString() || ''
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

  const handleScaleChange = (values: number[]) => {
    const scale = values[0] / 100;
    onSettingsChange({
      ...settings,
      scale,
      width: undefined,
      height: undefined,
    });
  };

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
        <CardTitle>Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Professional Packages */}
        <div className="space-y-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Professional Packages
            </h3>
            <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-2 py-1 rounded">
              Multi-Format Output
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Logo Package */}
            <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border border-blue-200 dark:border-blue-700 hover:shadow-md transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🌐</span>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    Web Developer Logo Package
                  </h4>
                </div>
                {!isPro && <ProBadge />}
              </div>

              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                Upload 1 logo → Get all web-ready formats instantly
              </p>

              <div className="text-xs text-gray-500 dark:text-gray-500 space-y-1 mb-4">
                <div>• Favicons: 16px, 32px, 48px PNG (ready)</div>
                <div>• PWA Icons: 192px, 512px PNG (ready)</div>
                <div>• Apple Touch: 180px PNG (ready)</div>
                <div>• Website Logos: 200px, 400px, 800px PNG (ready)</div>
                <div className="text-blue-600 dark:text-blue-400 font-medium">
                  • Coming Soon: favicon.ico + SVG formats!
                </div>
              </div>

              <button
                onClick={async () => {
                  if (!isPro) {
                    requestFeatureAccess('packages', 'Logo Package');
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
                  try {
                    await onGenerateLogoPackage(selectedFiles[0]);
                  } catch (error) {
                    alert(
                      'Failed to generate logo package: ' +
                        (error instanceof Error
                          ? error.message
                          : 'Unknown error')
                    );
                  }
                }}
                className="w-full py-2 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors disabled:opacity-50"
                disabled={disabled || !isPro}
              >
                {isPro ? 'Generate Web Package' : 'Upgrade for Web Package'}
              </button>
            </div>

            {/* Print Package */}
            <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border border-blue-200 dark:border-blue-700 hover:shadow-md transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🖼️</span>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    Print Package
                  </h4>
                </div>
                {!isPro && <ProBadge />}
              </div>

              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                Upload 1 photo → Get all standard print sizes at 300 PPI
              </p>

              <div className="text-xs text-gray-500 dark:text-gray-500 space-y-1 mb-4">
                <div>• Standard: 4×6", 5×7", 8×10", 11×14"</div>
                <div>• Large: 16×20", 20×24", 24×36"</div>
                <div>• International: A4, A3, A2, A1</div>
                <div>• All with smart upscaling & 300 PPI</div>
              </div>

              <button
                onClick={async () => {
                  if (!isPro) {
                    requestFeatureAccess('packages', 'Print Package');
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

                  try {
                    await onGeneratePrintPackage(selectedFiles[0]);
                  } catch (error) {
                    console.error('Print package generation failed:', error);
                    alert('Print package generation failed. Please try again.');
                  }
                }}
                className="w-full py-2 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors disabled:opacity-50"
                disabled={disabled || !selectedFiles || selectedFiles.length === 0}
              >
                {isPro ? 'Generate Print Package' : 'Upgrade for Print Package'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* E-commerce Package */}
            <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all group opacity-75">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🛒</span>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    E-commerce Package
                  </h4>
                </div>
                <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                  Coming Soon
                </span>
              </div>

              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                Product photos → All marketplace formats
              </p>

              <div className="text-xs text-gray-500 dark:text-gray-500 space-y-1">
                <div>• Amazon: 1000×1000px, 2000×2000px</div>
                <div>• eBay: 500×500px, 1600×1600px</div>
                <div>• Shopify: Multiple thumbnail sizes</div>
              </div>
            </div>

            {/* Real Estate Package */}
            <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all group opacity-75">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🏠</span>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    Real Estate Package
                  </h4>
                </div>
                <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                  Coming Soon
                </span>
              </div>

              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                Property photos → MLS + marketing ready
              </p>

              <div className="text-xs text-gray-500 dark:text-gray-500 space-y-1">
                <div>• MLS listing: 1024×768px</div>
                <div>• Zillow hero: 1200×800px</div>
                <div>• Social media + print flyers</div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-blue-200 dark:border-blue-700">
            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
              💡 Need single custom sizes? Use the manual controls below
            </p>
          </div>
        </div>

        {/* Traditional Presets */}
        <div className="space-y-2">
          <Label>Traditional Presets</Label>
          <PresetsSelect
            value={selectedPreset?.id || null}
            onValueChange={handlePresetChange}
            disabled={disabled}
          />
        </div>

        {/* Format */}
        <div className="space-y-2">
          <Label>Output Format</Label>
          <FormatSelect
            value={settings.format}
            onValueChange={handleFormatChange}
            disabled={disabled}
          />
        </div>

        {/* Quality */}
        {isLossyFormat(settings.format) && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Quality</Label>
              <span className="text-sm text-muted-foreground">
                {Math.round(settings.quality * 100)}%
              </span>
            </div>
            <Slider
              value={[settings.quality * 100]}
              onValueChange={(values) =>
                onSettingsChange({ ...settings, quality: values[0] / 100 })
              }
              min={1}
              max={100}
              step={1}
              disabled={disabled}
            />
          </div>
        )}

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
                  onSettingsChange({ ...settings, lockAspectRatio: checked })
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
              Original: {originalDimensions.width} × {originalDimensions.height}
            </p>
          )}

          {/* PPI/Resolution Section */}
          <div className="space-y-2 pt-3 border-t">
            <Label className="text-sm font-medium">Print Resolution</Label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => onSettingsChange({ ...settings, targetPPI: 72 })}
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
                <h4 className="text-sm font-medium">Advanced Upscaling</h4>
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
                      onValueChange={(value: UpscalingOptions['method']) =>
                        handleUpscalingChange({ method: value })
                      }
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bicubic">Bicubic (Free)</SelectItem>
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
      </CardContent>
    </Card>
  );
}
