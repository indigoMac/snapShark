'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DIVE_TYPES, type DiveDetailsInput } from '@/lib/dive-details';

type DiveDetailsFieldsProps = {
  idPrefix: string;
  value: DiveDetailsInput;
  onChange: (next: DiveDetailsInput) => void;
  /** Collapse under a lighter heading for create flows */
  compact?: boolean;
  /** Hide depth/time/buddy until the diver asks — keeps the first save fast. */
  defaultCollapsed?: boolean;
};

export function DiveDetailsFields({
  idPrefix,
  value,
  onChange,
  compact = false,
  defaultCollapsed = false,
}: DiveDetailsFieldsProps) {
  const [open, setOpen] = useState(!defaultCollapsed);
  const set = (patch: Partial<DiveDetailsInput>) =>
    onChange({ ...value, ...patch });

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-slate-500 underline decoration-slate-300 underline-offset-4 hover:text-slate-800 dark:hover:text-slate-200"
      >
        Add depth, time, buddy…
      </button>
    );
  }

  return (
    <div className={compact ? 'space-y-3' : 'space-y-3'}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Dive details <span className="font-normal normal-case">(optional)</span>
      </p>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-type`}>Dive type</Label>
        <select
          id={`${idPrefix}-type`}
          value={value.diveType ?? ''}
          onChange={(e) => set({ diveType: e.target.value })}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="">—</option>
          {DIVE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-depth`}>Max depth (m)</Label>
          <Input
            id={`${idPrefix}-depth`}
            type="number"
            inputMode="decimal"
            min={0}
            step="0.1"
            value={value.depthMeters ?? ''}
            onChange={(e) => set({ depthMeters: e.target.value })}
            placeholder="18"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-time`}>Bottom time (min)</Label>
          <Input
            id={`${idPrefix}-time`}
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            value={value.bottomTimeMinutes ?? ''}
            onChange={(e) => set({ bottomTimeMinutes: e.target.value })}
            placeholder="45"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-buddy`}>Buddy</Label>
        <Input
          id={`${idPrefix}-buddy`}
          value={value.buddy ?? ''}
          onChange={(e) => set({ buddy: e.target.value })}
          placeholder="Dive buddy name"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-vis`}>Visibility (m)</Label>
          <Input
            id={`${idPrefix}-vis`}
            type="number"
            inputMode="decimal"
            min={0}
            step="0.1"
            value={value.visibilityMeters ?? ''}
            onChange={(e) => set({ visibilityMeters: e.target.value })}
            placeholder="20"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-temp`}>Water temp (°C)</Label>
          <Input
            id={`${idPrefix}-temp`}
            type="number"
            inputMode="decimal"
            step="0.1"
            value={value.waterTempC ?? ''}
            onChange={(e) => set({ waterTempC: e.target.value })}
            placeholder="26"
          />
        </div>
      </div>
    </div>
  );
}
