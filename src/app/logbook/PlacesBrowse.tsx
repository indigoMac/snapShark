'use client';

import { MapPin } from 'lucide-react';
import type { LogbookSite } from '@/lib/logbook';
import { coverPhotoForSite } from '@/lib/logbook';

type PlacesBrowseProps = {
  sites: LogbookSite[];
  selectedSiteId?: string | null;
  onSelect: (siteId: string) => void;
};

export function PlacesBrowse({
  sites,
  selectedSiteId,
  onSelect,
}: PlacesBrowseProps) {
  if (sites.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center dark:border-slate-600">
        <MapPin className="mx-auto mb-2 h-8 w-8 text-slate-400" />
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
          No places yet
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Click the map to pin where you&apos;ve dived.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between px-1">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Your places
        </h2>
        <span className="text-xs text-slate-400">{sites.length}</span>
      </div>
      <ul className="space-y-2">
        {sites.map((site) => {
          const cover = coverPhotoForSite(site);
          const selected = site.id === selectedSiteId;
          const diveCount = site.dives.length;
          return (
            <li key={site.id}>
              <button
                type="button"
                onClick={() => onSelect(site.id)}
                className={`flex w-full items-center gap-3 rounded-xl border p-2 text-left transition ${
                  selected
                    ? 'border-blue-500 bg-blue-50/80 dark:border-blue-400 dark:bg-blue-950/40'
                    : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600'
                }`}
              >
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cover}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <MapPin className="h-5 w-5 text-slate-400" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-slate-900 dark:text-slate-100">
                    {site.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {diveCount === 0
                      ? 'Waiting for a memory'
                      : `${diveCount} memor${diveCount === 1 ? 'y' : 'ies'}`}
                  </div>
                  {(site.region || site.country) && (
                    <div className="truncate text-xs text-slate-400">
                      {[site.region, site.country].filter(Boolean).join(', ')}
                    </div>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
