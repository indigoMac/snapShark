'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

type DiveSite = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
};

type Dive = {
  id: string;
  diveDate: string;
  site?: DiveSite | null;
  notes?: string | null;
};

const defaultCenter: [number, number] = [20, 0]; // global view

// Work around missing default icon assets in Leaflet with bundlers
const markerIcon = new L.Icon({
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function BoundsFetcher({
  onBoundsChange,
}: {
  onBoundsChange: (bbox: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  }) => void;
}) {
  useMapEvents({
    moveend: (event) => {
      const bounds = event.target.getBounds();
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      onBoundsChange({
        minLat: sw.lat,
        maxLat: ne.lat,
        minLng: sw.lng,
        maxLng: ne.lng,
      });
    },
  });
  return null;
}

export default function LogbookMap({ refreshToken }: { refreshToken?: number }) {
  const [sites, setSites] = useState<DiveSite[]>([]);
  const [dives, setDives] = useState<Dive[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastBoundsRef = useRef<
    { minLat: number; maxLat: number; minLng: number; maxLng: number } | undefined
  >(undefined);

  const fetchData = useMemo(
    () => async (bbox?: { minLat: number; maxLat: number; minLng: number; maxLng: number }) => {
      setLoading(true);
      setError(null);
      try {
        const params = bbox
          ? `?minLat=${bbox.minLat}&maxLat=${bbox.maxLat}&minLng=${bbox.minLng}&maxLng=${bbox.maxLng}`
          : '';
        const [sitesRes, divesRes] = await Promise.all([
          fetch(`/api/dive-sites${params}`),
          fetch(`/api/dives${params}`),
        ]);
        if (!sitesRes.ok || !divesRes.ok) {
          throw new Error('Failed to load data');
        }
        const sitesJson = (await sitesRes.json()) as DiveSite[];
        const divesJson = (await divesRes.json()) as Dive[];
        setSites(sitesJson);
        setDives(divesJson);
      } catch (err: any) {
        setError(err.message || 'Failed to load map data');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    // initial fetch without bbox
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (refreshToken) {
      fetchData(lastBoundsRef.current);
    }
  }, [refreshToken, fetchData]);

  return (
    <div className="relative h-full w-full">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/5 backdrop-blur-sm text-sm text-slate-600 dark:text-slate-300">
          Loading map data...
        </div>
      )}
      {error && (
        <div className="absolute top-2 left-2 z-10 bg-red-100 text-red-700 px-3 py-2 rounded shadow">
          {error}
        </div>
      )}
      <MapContainer
        center={defaultCenter}
        zoom={2}
        className="h-full w-full"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <BoundsFetcher
          onBoundsChange={(bbox) => {
            lastBoundsRef.current = bbox;
            fetchData(bbox);
          }}
        />

        {sites.map((site) => (
          <Marker
            key={site.id}
            position={[site.latitude, site.longitude]}
            icon={markerIcon}
          >
            <Popup>
              <div className="space-y-1">
                <div className="font-semibold">{site.name}</div>
                <div className="text-xs text-muted-foreground">
                  {site.latitude.toFixed(4)}, {site.longitude.toFixed(4)}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {dives
          .filter((d) => d.site)
          .map((dive) => (
            <Marker
              key={dive.id}
              position={[
                dive.site!.latitude,
                dive.site!.longitude,
              ]}
              icon={markerIcon}
            >
              <Popup>
                <div className="space-y-1">
                  <div className="font-semibold">
                    Dive on {new Date(dive.diveDate).toLocaleDateString()}
                  </div>
                  {dive.site && (
                    <div className="text-sm text-muted-foreground">
                      {dive.site.name}
                    </div>
                  )}
                  {dive.notes && (
                    <div className="text-xs text-muted-foreground">
                      {dive.notes}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
}
