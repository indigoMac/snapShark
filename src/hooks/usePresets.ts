import { useState, useEffect, useCallback } from 'react';
import { Preset, BUILT_IN_PRESETS, getPresetById } from '@/lib/presets';
import { OutputFormat } from '@/lib/formats';

const CUSTOM_PRESETS_KEY = 'snapshark-custom-presets';

export interface CustomPreset extends Omit<Preset, 'isPro'> {
  createdAt: string;
}

export function usePresets() {
  const [customPresets, setCustomPresets] = useState<CustomPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  
  // Load custom presets from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CUSTOM_PRESETS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setCustomPresets(parsed);
      }
    } catch (error) {
      console.warn('Failed to load custom presets:', error);
    }
  }, []);
  
  // Save custom presets to localStorage
  const saveCustomPresets = useCallback((presets: CustomPreset[]) => {
    try {
      localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(presets));
      setCustomPresets(presets);
    } catch (error) {
      console.warn('Failed to save custom presets:', error);
    }
  }, []);
  
  const createCustomPreset = useCallback((preset: Omit<CustomPreset, 'id' | 'createdAt' | 'isPro'>) => {
    const newPreset: CustomPreset = {
      ...preset,
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      category: 'custom'
    };
    
    const updated = [...customPresets, newPreset];
    saveCustomPresets(updated);
    return newPreset;
  }, [customPresets, saveCustomPresets]);
  
  const deleteCustomPreset = useCallback((id: string) => {
    const updated = customPresets.filter(preset => preset.id !== id);
    saveCustomPresets(updated);
    
    // Clear selection if deleted preset was selected
    if (selectedPresetId === id) {
      setSelectedPresetId(null);
    }
  }, [customPresets, saveCustomPresets, selectedPresetId]);
  
  const getAllPresets = useCallback((): (Preset | CustomPreset)[] => {
    return [...BUILT_IN_PRESETS, ...customPresets];
  }, [customPresets]);
  
  const getPresetsByCategory = useCallback((category: Preset['category']) => {
    return getAllPresets().filter(preset => preset.category === category);
  }, [getAllPresets]);
  
  const getFreePresets = useCallback(() => {
    return getAllPresets().filter(preset => 
      'isPro' in preset ? !preset.isPro : true // Custom presets are always free
    );
  }, [getAllPresets]);
  
  const getProPresets = useCallback(() => {
    return BUILT_IN_PRESETS.filter(preset => preset.isPro);
  }, []);
  
  const getSelectedPreset = useCallback((): (Preset | CustomPreset) | null => {
    if (!selectedPresetId) return null;
    
    const builtIn = getPresetById(selectedPresetId);
    if (builtIn) return builtIn;
    
    return customPresets.find(preset => preset.id === selectedPresetId) || null;
  }, [selectedPresetId, customPresets]);
  
  const applyPreset = useCallback((presetId: string) => {
    const preset = getAllPresets().find(p => p.id === presetId);
    if (!preset) return null;
    
    setSelectedPresetId(presetId);
    
    // Return settings to apply to the image processor
    return {
      dimensions: preset.dimensions,
      format: preset.format,
      quality: preset.quality,
      description: preset.description
    };
  }, [getAllPresets]);
  
  const clearSelection = useCallback(() => {
    setSelectedPresetId(null);
  }, []);
  
  return {
    // Presets
    allPresets: getAllPresets(),
    customPresets,
    builtInPresets: BUILT_IN_PRESETS,
    
    // Filtering
    getPresetsByCategory,
    getFreePresets,
    getProPresets,
    
    // Selection
    selectedPresetId,
    selectedPreset: getSelectedPreset(),
    applyPreset,
    clearSelection,
    
    // Custom preset management
    createCustomPreset,
    deleteCustomPreset
  };
}
