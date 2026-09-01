export const DIVE_TYPES = [
  { value: 'recreational', label: 'Recreational' },
  { value: 'night', label: 'Night' },
  { value: 'drift', label: 'Drift' },
  { value: 'wreck', label: 'Wreck' },
  { value: 'wall', label: 'Wall' },
  { value: 'reef', label: 'Reef' },
  { value: 'deep', label: 'Deep' },
  { value: 'cave', label: 'Cave / cavern' },
  { value: 'training', label: 'Training / course' },
  { value: 'other', label: 'Other' },
] as const;

export type DiveTypeValue = (typeof DIVE_TYPES)[number]['value'];

export type DiveConditions = {
  visibilityMeters?: number | null;
  waterTempC?: number | null;
};

export type DiveDetailsInput = {
  diveType?: string;
  depthMeters?: string;
  bottomTimeMinutes?: string;
  buddy?: string;
  visibilityMeters?: string;
  waterTempC?: string;
};

export function emptyDiveDetails(): DiveDetailsInput {
  return {
    diveType: '',
    depthMeters: '',
    bottomTimeMinutes: '',
    buddy: '',
    visibilityMeters: '',
    waterTempC: '',
  };
}

export function diveTypeLabel(value?: string | null): string | null {
  if (!value) return null;
  return DIVE_TYPES.find((t) => t.value === value)?.label ?? value;
}

export function parseDiveDetails(details: DiveDetailsInput) {
  const depthMeters = details.depthMeters
    ? parseFloat(details.depthMeters)
    : undefined;
  const bottomTimeMinutes = details.bottomTimeMinutes
    ? parseInt(details.bottomTimeMinutes, 10)
    : undefined;
  const visibilityMeters = details.visibilityMeters
    ? parseFloat(details.visibilityMeters)
    : undefined;
  const waterTempC = details.waterTempC
    ? parseFloat(details.waterTempC)
    : undefined;

  const conditions: DiveConditions | undefined =
    visibilityMeters !== undefined || waterTempC !== undefined
      ? {
          ...(visibilityMeters !== undefined && !Number.isNaN(visibilityMeters)
            ? { visibilityMeters }
            : {}),
          ...(waterTempC !== undefined && !Number.isNaN(waterTempC)
            ? { waterTempC }
            : {}),
        }
      : undefined;

  return {
    diveType: details.diveType?.trim() || undefined,
    depthMeters:
      depthMeters !== undefined && !Number.isNaN(depthMeters)
        ? depthMeters
        : undefined,
    bottomTimeMinutes:
      bottomTimeMinutes !== undefined && !Number.isNaN(bottomTimeMinutes)
        ? bottomTimeMinutes
        : undefined,
    buddy: details.buddy?.trim() || undefined,
    conditions:
      conditions && Object.keys(conditions).length > 0 ? conditions : undefined,
  };
}

export function detailsFromDive(dive: {
  diveType?: string | null;
  depthMeters?: number | null;
  bottomTimeMinutes?: number | null;
  buddy?: string | null;
  conditions?: DiveConditions | null;
}): DiveDetailsInput {
  return {
    diveType: dive.diveType ?? '',
    depthMeters:
      dive.depthMeters != null ? String(dive.depthMeters) : '',
    bottomTimeMinutes:
      dive.bottomTimeMinutes != null ? String(dive.bottomTimeMinutes) : '',
    buddy: dive.buddy ?? '',
    visibilityMeters:
      dive.conditions?.visibilityMeters != null
        ? String(dive.conditions.visibilityMeters)
        : '',
    waterTempC:
      dive.conditions?.waterTempC != null
        ? String(dive.conditions.waterTempC)
        : '',
  };
}
