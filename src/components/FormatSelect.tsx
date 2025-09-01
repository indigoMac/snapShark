'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OutputFormat, FORMAT_NAMES, SUPPORTED_OUTPUT_FORMATS } from '@/lib/formats';
import { usePaywall } from '@/hooks/usePaywall';
import { ProBadge } from './ProBadge';

interface FormatSelectProps {
  value: OutputFormat;
  onValueChange: (value: OutputFormat) => void;
  disabled?: boolean;
}

export function FormatSelect({ value, onValueChange, disabled = false }: FormatSelectProps) {
  const { isPro } = usePaywall();

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SUPPORTED_OUTPUT_FORMATS.map(format => {
          const isAdvanced = format === 'image/avif';
          const isDisabled = isAdvanced && !isPro;
          
          return (
            <SelectItem 
              key={format} 
              value={format}
              disabled={isDisabled}
              className={isDisabled ? 'opacity-50' : ''}
            >
              <div className="flex items-center justify-between w-full">
                <span>{FORMAT_NAMES[format]}</span>
                {isAdvanced && !isPro && <ProBadge />}
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
