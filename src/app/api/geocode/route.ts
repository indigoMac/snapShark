import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import type { GeocodeResult } from '@/lib/geocode';

const COORD_RE =
  /^\s*(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$/;

function parseCoordinates(query: string): GeocodeResult | null {
  const match = query.match(COORD_RE);
  if (!match) return null;
  const latitude = Number(match[1]);
  const longitude = Number(match[2]);
  if (
    Number.isNaN(latitude) ||
    Number.isNaN(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }
  return {
    id: `coords:${latitude},${longitude}`,
    label: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
    latitude,
    longitude,
    kind: 'coordinates',
  };
}

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) {
    return NextResponse.json({ results: [] as GeocodeResult[] });
  }

  const asCoords = parseCoordinates(q);
  if (asCoords) {
    return NextResponse.json({ results: [asCoords] });
  }

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', q);
  url.searchParams.set('format', 'json');
  url.searchParams.set('addressdetails', '0');
  url.searchParams.set('limit', '5');

  try {
    const res = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
        // Nominatim requires an identifying User-Agent
        'User-Agent':
          'SnapSharkLogbook/1.0 (https://snap-shark.com; dive logbook)',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Location search is temporarily unavailable' },
        { status: 502 }
      );
    }

    const data = (await res.json()) as Array<{
      place_id: number;
      display_name: string;
      lat: string;
      lon: string;
    }>;

    const results: GeocodeResult[] = data.map((item) => ({
      id: String(item.place_id),
      label: item.display_name,
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      kind: 'place',
    }));

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json(
      { error: 'Location search failed' },
      { status: 502 }
    );
  }
}
