'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { LogbookSite } from '@/lib/logbook';
import type { GeocodeResult } from '@/lib/geocode';
import { MapSearch } from './MapSearch';

const defaultCenter: [number, number] = [20, 0];

const markerIcon = new L.Icon({
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const pendingIcon = new L.Icon({
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  className: 'opacity-70',
});

function ClickToPlace({
  enabled,
  onPlaceClick,
}: {
  enabled: boolean;
  onPlaceClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(event) {
      if (!enabled) return;
      onPlaceClick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

function FitSites({
  sites,
  focusSiteId,
}: {
  sites: LogbookSite[];
  focusSiteId?: string | null;
}) {
  const map = useMap();
  const fittedRef = useRef(false);

  useEffect(() => {
    if (focusSiteId) {
      const site = sites.find((s) => s.id === focusSiteId);
      if (site) {
        map.flyTo([site.latitude, site.longitude], Math.max(map.getZoom(), 8), {
          duration: 0.6,
        });
      }
      return;
    }

    if (fittedRef.current || sites.length === 0) return;
    fittedRef.current = true;
    if (sites.length === 1) {
      map.setView([sites[0].latitude, sites[0].longitude], 8);
      return;
    }
    const bounds = L.latLngBounds(
      sites.map((s) => [s.latitude, s.longitude] as [number, number])
    );
    map.fitBounds(bounds.pad(0.25));
  }, [sites, focusSiteId, map]);

  return null;
}

function FlyToTarget({
  target,
}: {
  target: { lat: number; lng: number; zoom: number; token: number } | null;
}) {
  const map = useMap();
  const lastToken = useRef<number | null>(null);

  useEffect(() => {
    if (!target || lastToken.current === target.token) return;
    lastToken.current = target.token;
    map.flyTo([target.lat, target.lng], target.zoom, { duration: 1.1 });
  }, [target, map]);

  return null;
}

type LogbookMapProps = {
  sites: LogbookSite[];
  selectedSiteId?: string | null;
  pendingPin?: { lat: number; lng: number } | null;
  clickToCreate?: boolean;
  onMapClick?: (lat: number, lng: number) => void;
  onPendingPinMove?: (lat: number, lng: number) => void;
  onSelectSite?: (siteId: string) => void;
};

export default function LogbookMap({
  sites,
  selectedSiteId,
  pendingPin,
  clickToCreate = true,
  onMapClick,
  onPendingPinMove,
  onSelectSite,
}: LogbookMapProps) {
  const [ready, setReady] = useState(false);
  const [flyTarget, setFlyTarget] = useState<{
    lat: number;
    lng: number;
    zoom: number;
    token: number;
  } | null>(null);

  useEffect(() => {
    setReady(true);
  }, []);

  const center = useMemo((): [number, number] => {
    if (selectedSiteId) {
      const site = sites.find((s) => s.id === selectedSiteId);
      if (site) return [site.latitude, site.longitude];
    }
    if (sites[0]) return [sites[0].latitude, sites[0].longitude];
    return defaultCenter;
  }, [sites, selectedSiteId]);

  const handleSearchSelect = (result: GeocodeResult) => {
    setFlyTarget({
      lat: result.latitude,
      lng: result.longitude,
      zoom: result.kind === 'coordinates' ? 12 : 11,
      token: Date.now(),
    });
  };

  if (!ready) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-100 text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-300">
        Loading map…
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <div className="absolute left-3 right-3 top-3 z-[1000] flex flex-col gap-2 sm:right-auto sm:w-[min(100%,28rem)]">
        <MapSearch onSelect={handleSearchSelect} />
        {clickToCreate && (
          <div className="pointer-events-none w-fit rounded-md bg-white/95 px-3 py-2 text-xs font-medium text-slate-700 shadow dark:bg-slate-900/95 dark:text-slate-200">
            {pendingPin
              ? 'Drag the pin to fine-tune, then name this place'
              : 'Search to find an area, then click the map to drop a pin'}
          </div>
        )}
      </div>
      <MapContainer
        center={center}
        zoom={sites.length ? 4 : 2}
        className="h-full w-full"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickToPlace
          enabled={Boolean(clickToCreate && onMapClick)}
          onPlaceClick={(lat, lng) => onMapClick?.(lat, lng)}
        />
        <FitSites sites={sites} focusSiteId={selectedSiteId} />
        <FlyToTarget target={flyTarget} />

        {pendingPin && (
          <Marker
            position={[pendingPin.lat, pendingPin.lng]}
            icon={pendingIcon}
            draggable
            eventHandlers={{
              dragend: (event) => {
                const { lat, lng } = event.target.getLatLng();
                onPendingPinMove?.(lat, lng);
              },
            }}
          />
        )}

        {sites.map((site) => {
          const diveCount = site.dives.length;
          const latest = site.dives[0];
          const cover = latest?.photos[0]?.url;
          return (
            <Marker
              key={site.id}
              position={[site.latitude, site.longitude]}
              icon={markerIcon}
              eventHandlers={{
                click: () => onSelectSite?.(site.id),
              }}
            >
              <Popup>
                <div className="min-w-[160px] space-y-1.5">
                  <div className="font-semibold text-slate-900">{site.name}</div>
                  <div className="text-xs text-slate-600">
                    {diveCount === 0
                      ? 'No dives yet'
                      : `${diveCount} dive${diveCount === 1 ? '' : 's'}`}
                  </div>
                  {latest && (
                    <div className="text-xs text-slate-500">
                      Last dive{' '}
                      {new Date(latest.diveDate).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                  )}
                  {cover && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cover}
                      alt=""
                      className="mt-1 h-16 w-full rounded object-cover"
                    />
                  )}
                  <button
                    type="button"
                    className="mt-1 text-xs font-medium text-blue-600 hover:underline"
                    onClick={() => onSelectSite?.(site.id)}
                  >
                    Open logbook
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
