import { prisma } from '@/lib/db';
import { toNumber } from '@/lib/logbook';
import { sharePhotoSrc } from '@/lib/share-url';

export {
  createShareToken,
  nextShareToken,
  sharePath,
  sharePhotoSrc,
} from '@/lib/share-url';

export type PublicSharePhoto = {
  id: string;
  url: string;
  caption: string | null;
};

export type PublicShareDive = {
  id: string;
  diveDate: string;
  notes: string | null;
  depthMeters: number | null;
  bottomTimeMinutes: number | null;
  photos: PublicSharePhoto[];
};

export type PublicSharePlace = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  country: string | null;
  region: string | null;
  dives: PublicShareDive[];
};

export type PublicShare = {
  kind: 'trip' | 'place';
  token: string;
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  places: PublicSharePlace[];
};

const diveInclude = {
  photos: { orderBy: { createdAt: 'asc' as const } },
} as const;

function serializePublicDive(
  token: string,
  dive: {
    id: string;
    diveDate: Date;
    notes: string | null;
    depthMeters: unknown;
    bottomTimeMinutes: number | null;
    photos: Array<{ id: string; caption: string | null }>;
  }
): PublicShareDive {
  return {
    id: dive.id,
    diveDate: dive.diveDate.toISOString(),
    notes: dive.notes,
    depthMeters:
      dive.depthMeters === null || dive.depthMeters === undefined
        ? null
        : toNumber(dive.depthMeters),
    bottomTimeMinutes: dive.bottomTimeMinutes,
    photos: dive.photos.map((photo) => ({
      id: photo.id,
      url: sharePhotoSrc(token, photo.id),
      caption: photo.caption,
    })),
  };
}

function serializePublicPlace(
  token: string,
  site: {
    id: string;
    name: string;
    latitude: unknown;
    longitude: unknown;
    country: string | null;
    region: string | null;
    dives: Array<Parameters<typeof serializePublicDive>[1]>;
  }
): PublicSharePlace {
  return {
    id: site.id,
    name: site.name,
    latitude: toNumber(site.latitude),
    longitude: toNumber(site.longitude),
    country: site.country,
    region: site.region,
    dives: site.dives.map((dive) => serializePublicDive(token, dive)),
  };
}

export function coverPhotoFromShare(share: PublicShare): PublicSharePhoto | null {
  for (const place of share.places) {
    for (const dive of place.dives) {
      if (dive.photos[0]) return dive.photos[0];
    }
  }
  return null;
}

export async function loadPublicShare(
  token: string
): Promise<PublicShare | null> {
  if (!token || token.length < 16) return null;

  const trip = await prisma.trip.findUnique({
    where: { shareToken: token },
    include: {
      places: {
        include: {
          dives: {
            include: diveInclude,
            orderBy: { diveDate: 'desc' },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (trip) {
    return {
      kind: 'trip',
      token,
      name: trip.name,
      description: trip.description,
      startDate: trip.startDate?.toISOString() ?? null,
      endDate: trip.endDate?.toISOString() ?? null,
      places: trip.places.map((place) => serializePublicPlace(token, place)),
    };
  }

  const site = await prisma.diveSite.findUnique({
    where: { shareToken: token },
    include: {
      dives: {
        include: diveInclude,
        orderBy: { diveDate: 'desc' },
      },
    },
  });

  if (!site) return null;

  return {
    kind: 'place',
    token,
    name: site.name,
    description: site.description,
    startDate: null,
    endDate: null,
    places: [serializePublicPlace(token, site)],
  };
}

export async function photoBelongsToShare(
  token: string,
  photoId: string
): Promise<{ storageRef: string } | null> {
  const photo = await prisma.photo.findFirst({
    where: {
      id: photoId,
      OR: [
        { dive: { site: { shareToken: token } } },
        { dive: { site: { trip: { shareToken: token } } } },
      ],
    },
    select: { storageRef: true },
  });
  return photo;
}
