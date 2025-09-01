'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
  SelectLabel,
  SelectGroup,
} from '@/components/ui/select';
import { usePresets } from '@/hooks/usePresets';
import { usePaywall } from '@/hooks/usePaywall';
import { ProBadge } from './ProBadge';

interface PresetsSelectProps {
  value: string | null;
  onValueChange: (value: string | null) => void;
  disabled?: boolean;
}

export function PresetsSelect({
  value,
  onValueChange,
  disabled = false,
}: PresetsSelectProps) {
  const { getPresetsByCategory } = usePresets();
  const { isPro } = usePaywall();

  const socialPresets = getPresetsByCategory('social');
  const webPresets = getPresetsByCategory('web');
  const printPresets = getPresetsByCategory('print');
  const customPresets = getPresetsByCategory('custom');

  return (
    <Select
      value={value || 'none'}
      onValueChange={(val) => onValueChange(val === 'none' ? null : val)}
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue placeholder="Choose a preset..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">None</SelectItem>

        {socialPresets.length > 0 && (
          <>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>Social Media</SelectLabel>
              {socialPresets.map((preset) => {
                const isProPreset = 'isPro' in preset && preset.isPro;
                const isDisabled = isProPreset && !isPro;

                return (
                  <SelectItem
                    key={preset.id}
                    value={preset.id}
                    disabled={isDisabled}
                    className={isDisabled ? 'opacity-50' : ''}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex flex-col">
                        <span>{preset.name}</span>
                        {preset.description && (
                          <span className="text-xs text-muted-foreground">
                            {preset.description}
                          </span>
                        )}
                      </div>
                      {isProPreset && !isPro && <ProBadge />}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectGroup>
          </>
        )}

        {webPresets.length > 0 && (
          <>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>Web & App</SelectLabel>
              {webPresets.map((preset) => {
                const isProPreset = 'isPro' in preset && preset.isPro;
                const isDisabled = isProPreset && !isPro;

                return (
                  <SelectItem
                    key={preset.id}
                    value={preset.id}
                    disabled={isDisabled}
                    className={isDisabled ? 'opacity-50' : ''}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex flex-col">
                        <span>{preset.name}</span>
                        {preset.description && (
                          <span className="text-xs text-muted-foreground">
                            {preset.description}
                          </span>
                        )}
                      </div>
                      {isProPreset && !isPro && <ProBadge />}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectGroup>
          </>
        )}

        {printPresets.length > 0 && (
          <>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>Print</SelectLabel>
              {printPresets.map((preset) => {
                const isProPreset = 'isPro' in preset && preset.isPro;
                const isDisabled = isProPreset && !isPro;

                return (
                  <SelectItem
                    key={preset.id}
                    value={preset.id}
                    disabled={isDisabled}
                    className={isDisabled ? 'opacity-50' : ''}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex flex-col">
                        <span>{preset.name}</span>
                        {preset.description && (
                          <span className="text-xs text-muted-foreground">
                            {preset.description}
                          </span>
                        )}
                      </div>
                      {isProPreset && !isPro && <ProBadge />}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectGroup>
          </>
        )}

        {customPresets.length > 0 && (
          <>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>Custom</SelectLabel>
              {customPresets.map((preset) => (
                <SelectItem key={preset.id} value={preset.id}>
                  <div className="flex flex-col">
                    <span>{preset.name}</span>
                    {preset.description && (
                      <span className="text-xs text-muted-foreground">
                        {preset.description}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          </>
        )}
      </SelectContent>
    </Select>
  );
}
