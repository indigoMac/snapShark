'use client';

import { useState } from 'react';
import { FolderPlus, MapPin, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { LogbookTrip } from '@/lib/logbook';

type TripsBrowseProps = {
  trips: LogbookTrip[];
  selectedTripId?: string | null;
  onSelectTrip: (tripId: string | null) => void;
  onCreated: (trip: LogbookTrip) => void;
  onDeleted: (tripId: string) => void;
};

export function TripsBrowse({
  trips,
  selectedTripId,
  onSelectTrip,
  onCreated,
  onDeleted,
}: TripsBrowseProps) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTrip = async () => {
    if (!name.trim()) {
      setError('Give the trip a name');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create trip');
      }
      const trip = (await res.json()) as LogbookTrip;
      setName('');
      setCreating(false);
      onCreated(trip);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create trip');
    } finally {
      setSaving(false);
    }
  };

  const deleteTrip = async (trip: LogbookTrip) => {
    if (
      !window.confirm(
        `Delete trip “${trip.name}”? Places stay in your logbook; they’re just ungrouped.`
      )
    ) {
      return;
    }
    const res = await fetch(`/api/trips/${trip.id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to delete trip');
    }
    onDeleted(trip.id);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Trips
        </h2>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setCreating((v) => !v)}
        >
          <FolderPlus className="mr-1 h-4 w-4" />
          New
        </Button>
      </div>

      {creating && (
        <div className="space-y-2 rounded-xl border border-dashed border-slate-300 p-3 dark:border-slate-600">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Philippines 2024"
            autoFocus
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              disabled={saving}
              onClick={createTrip}
            >
              {saving ? 'Saving…' : 'Create trip'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setCreating(false);
                setError(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <ul className="space-y-2">
        <li>
          <button
            type="button"
            onClick={() => onSelectTrip(null)}
            className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition ${
              !selectedTripId
                ? 'border-blue-500 bg-blue-50/80 dark:border-blue-400 dark:bg-blue-950/40'
                : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900'
            }`}
          >
            All places
          </button>
        </li>
        {trips.map((trip) => (
          <li key={trip.id}>
            <div
              className={`flex items-center gap-2 rounded-xl border p-2 transition ${
                selectedTripId === trip.id
                  ? 'border-blue-500 bg-blue-50/80 dark:border-blue-400 dark:bg-blue-950/40'
                  : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'
              }`}
            >
              <button
                type="button"
                onClick={() => onSelectTrip(trip.id)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                  {trip.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={trip.coverUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <MapPin className="h-5 w-5 text-slate-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-medium text-slate-900 dark:text-slate-100">
                    {trip.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {trip.placeCount} place{trip.placeCount === 1 ? '' : 's'} ·{' '}
                    {trip.diveCount} dive{trip.diveCount === 1 ? '' : 's'}
                  </div>
                </div>
              </button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="shrink-0 text-red-600"
                title="Delete trip"
                onClick={() => {
                  void deleteTrip(trip).catch((err: unknown) => {
                    setError(
                      err instanceof Error ? err.message : 'Failed to delete trip'
                    );
                  });
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
