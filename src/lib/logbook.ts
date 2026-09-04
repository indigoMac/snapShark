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
  diveType?: string | null;
  notes?: string | null;
  depthMeters?: number | null;
  bottomTimeMinutes?: number | null;
  buddy?: string | null;
  conditions?: {
    visibilityMeters?: number | null;
    waterTempC?: number | null;
  } | null;
  siteId?: string | null;
  photos: LogbookPhoto[];
};

export type LogbookTripSummary = {
  id: string;
  name: string;
};

export type LogbookSite = {
  id: string;
  name: string;
  description?: string | null;
  latitude: number;
  longitude: number;
  country?: string | null;
  region?: string | null;
  tripId?: string | null;
  trip?: LogbookTripSummary | null;
  dives: LogbookDive[];
  shareToken?: string | null;
};

export type LogbookTrip = {
  id: string;
  name: string;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  placeCount: number;
  diveCount: number;
  coverUrl?: string | null;
  shareToken?: string | null;
};

export const PENDING_PHOTO_KEY = 'snapshark:pendingLogbookPhoto';

/** Prisma include used when loading a place with its dives/photos. */
export const diveSiteInclude = {
  trip: { select: { id: true, name: true } },
  dives: {
    include: { photos: { orderBy: { createdAt: 'asc' as const } } },
    orderBy: { diveDate: 'desc' as const },
  },
};

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

/**
 * Photos are held in private storage, so clients always load them through the
 * owner-checked streaming route rather than a direct storage URL.
 */
export function photoSrc(photoId: string): string {
  return `/api/photos/${photoId}/file`;
}

function serializePhoto(photo: {
  id: string;
  caption?: string | null;
  takenAt?: Date | string | null;
}): LogbookPhoto {
  return {
    id: photo.id,
    url: photoSrc(photo.id),
    caption: photo.caption ?? null,
    takenAt: photo.takenAt ? new Date(photo.takenAt).toISOString() : null,
  };
}

export function serializeDive(dive: {
  id: string;
  diveDate: Date | string;
  diveType?: string | null;
  notes?: string | null;
  depthMeters?: unknown;
  bottomTimeMinutes?: number | null;
  buddy?: string | null;
  conditions?: unknown;
  siteId?: string | null;
  photos?: Array<{
    id: string;
    caption?: string | null;
    takenAt?: Date | string | null;
  }>;
}): LogbookDive {
  const rawConditions =
    dive.conditions && typeof dive.conditions === 'object'
      ? (dive.conditions as {
          visibilityMeters?: number | null;
          waterTempC?: number | null;
        })
      : null;

  return {
    id: dive.id,
    diveDate: new Date(dive.diveDate).toISOString(),
    diveType: dive.diveType ?? null,
    notes: dive.notes ?? null,
    depthMeters:
      dive.depthMeters === null || dive.depthMeters === undefined
        ? null
        : toNumber(dive.depthMeters),
    bottomTimeMinutes: dive.bottomTimeMinutes ?? null,
    buddy: dive.buddy ?? null,
    conditions: rawConditions
      ? {
          visibilityMeters: rawConditions.visibilityMeters ?? null,
          waterTempC: rawConditions.waterTempC ?? null,
        }
      : null,
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
  tripId?: string | null;
  trip?: { id: string; name: string } | null;
  dives?: Array<Parameters<typeof serializeDive>[0]>;
  shareToken?: string | null;
}): LogbookSite {
  return {
    id: site.id,
    name: site.name,
    description: site.description ?? null,
    latitude: toNumber(site.latitude),
    longitude: toNumber(site.longitude),
    country: site.country ?? null,
    region: site.region ?? null,
    tripId: site.tripId ?? null,
    trip: site.trip
      ? { id: site.trip.id, name: site.trip.name }
      : null,
    dives: (site.dives ?? []).map(serializeDive),
    shareToken: site.shareToken ?? null,
  };
}

export function serializeTrip(trip: {
  id: string;
  name: string;
  description?: string | null;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  shareToken?: string | null;
  places?: Array<{
    dives?: Array<{ photos?: Array<{ id: string }> }>;
  }>;
}): LogbookTrip {
  const places = trip.places ?? [];
  let diveCount = 0;
  let coverUrl: string | null = null;
  for (const place of places) {
    for (const dive of place.dives ?? []) {
      diveCount += 1;
      if (!coverUrl && dive.photos?.[0]?.id) {
        coverUrl = photoSrc(dive.photos[0].id);
      }
    }
  }
  return {
    id: trip.id,
    name: trip.name,
    description: trip.description ?? null,
    startDate: trip.startDate
      ? new Date(trip.startDate).toISOString()
      : null,
    endDate: trip.endDate ? new Date(trip.endDate).toISOString() : null,
    placeCount: places.length,
    diveCount,
    coverUrl,
    shareToken: trip.shareToken ?? null,
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
