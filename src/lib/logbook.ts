/** Shared logbook types and serialization helpers. */

export type LogbookPhoto = {
  id: string;
  url: string;
  caption?: string | null;
  takenAt?: string | null;
};

export type LogbookDive = {
  id: string;
  diveDate: string;
  notes?: string | null;
  depthMeters?: number | null;
  bottomTimeMinutes?: number | null;
  siteId?: string | null;
  photos: LogbookPhoto[];
};

export type LogbookSite = {
  id: string;
  name: string;
  description?: string | null;
  latitude: number;
  longitude: number;
  country?: string | null;
  region?: string | null;
  dives: LogbookDive[];
};

export const PENDING_PHOTO_KEY = 'snapshark:pendingLogbookPhoto';

export type PendingLogbookPhoto = {
  dataUrl: string;
  filename?: string;
};

export function toNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value);
  if (value != null && typeof value === 'object' && 'toNumber' in value) {
    return (value as { toNumber: () => number }).toNumber();
  }
  return Number(value);
}

function serializePhoto(photo: {
  id: string;
  url: string;
  caption?: string | null;
  takenAt?: Date | string | null;
}): LogbookPhoto {
  return {
    id: photo.id,
    url: photo.url,
    caption: photo.caption ?? null,
    takenAt: photo.takenAt
      ? new Date(photo.takenAt).toISOString()
      : null,
  };
}

export function serializeDive(dive: {
  id: string;
  diveDate: Date | string;
  notes?: string | null;
  depthMeters?: unknown;
  bottomTimeMinutes?: number | null;
  siteId?: string | null;
  photos?: Array<{
    id: string;
    url: string;
    caption?: string | null;
    takenAt?: Date | string | null;
  }>;
}): LogbookDive {
  return {
    id: dive.id,
    diveDate: new Date(dive.diveDate).toISOString(),
    notes: dive.notes ?? null,
    depthMeters:
      dive.depthMeters === null || dive.depthMeters === undefined
        ? null
        : toNumber(dive.depthMeters),
    bottomTimeMinutes: dive.bottomTimeMinutes ?? null,
    siteId: dive.siteId ?? null,
    photos: (dive.photos ?? []).map(serializePhoto),
  };
}

export function serializeSite(site: {
  id: string;
  name: string;
  description?: string | null;
  latitude: unknown;
  longitude: unknown;
  country?: string | null;
  region?: string | null;
  dives?: Array<Parameters<typeof serializeDive>[0]>;
}): LogbookSite {
  return {
    id: site.id,
    name: site.name,
    description: site.description ?? null,
    latitude: toNumber(site.latitude),
    longitude: toNumber(site.longitude),
    country: site.country ?? null,
    region: site.region ?? null,
    dives: (site.dives ?? []).map(serializeDive),
  };
}

export function readPendingPhoto(): PendingLogbookPhoto | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(PENDING_PHOTO_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingLogbookPhoto;
    if (!parsed?.dataUrl) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingPhoto() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(PENDING_PHOTO_KEY);
}

export function storePendingPhoto(photo: PendingLogbookPhoto) {
  sessionStorage.setItem(PENDING_PHOTO_KEY, JSON.stringify(photo));
}

export function coverPhotoForSite(site: LogbookSite): string | null {
  for (const dive of site.dives) {
    if (dive.photos[0]?.url) return dive.photos[0].url;
  }
  return null;
}
