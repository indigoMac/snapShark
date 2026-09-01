'use client';

import { useEffect, useState } from 'react';
import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { LogbookDive, LogbookPhoto } from '@/lib/logbook';
import {
  diveTypeLabel,
  emptyDiveDetails,
  parseDiveDetails,
  type DiveDetailsInput,
} from '@/lib/dive-details';
import { DiveDetailsFields } from './DiveDetailsFields';
import { DiveDetailDialog } from './DiveDetailDialog';

type MemoryCardProps = {
  dive: LogbookDive;
  placeName?: string;
  highlight?: boolean;
  pendingPhotoDataUrl?: string | null;
  onPhotoAdded?: (photo: LogbookPhoto) => void;
  onPhotoRemoved?: (photoId: string) => void;
  onUpdated?: (dive: LogbookDive) => void;
  onDeleted?: (diveId: string) => void;
  onAttachedPending?: () => void;
};

export function MemoryCard({
  dive,
  placeName,
  highlight = false,
  pendingPhotoDataUrl,
  onPhotoAdded,
  onPhotoRemoved,
  onUpdated,
  onDeleted,
  onAttachedPending,
}: MemoryCardProps) {
  const [open, setOpen] = useState(false);
  const [photos, setPhotos] = useState(dive.photos);

  useEffect(() => {
    setPhotos(dive.photos);
  }, [dive.photos]);

  const detailLine = [
    diveTypeLabel(dive.diveType),
    dive.depthMeters != null ? `${dive.depthMeters} m` : null,
    dive.bottomTimeMinutes != null ? `${dive.bottomTimeMinutes} min` : null,
    dive.buddy ? `with ${dive.buddy}` : null,
  ].filter(Boolean);

  return (
    <>
      <article
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={`cursor-pointer overflow-hidden rounded-xl border bg-white shadow-sm transition hover:border-blue-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 dark:bg-slate-900 dark:hover:border-blue-500 ${
          highlight
            ? 'border-blue-400 ring-2 ring-blue-400/40 dark:border-blue-400'
            : 'border-slate-200 dark:border-slate-700'
        }`}
      >
        {photos.length > 0 ? (
          <div
            className={`grid gap-0.5 ${
              photos.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
            }`}
          >
            {photos.slice(0, 4).map((photo) => (
              <div key={photo.id} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={photo.caption || 'Dive photo'}
                  className={`w-full object-cover ${
                    photos.length === 1 ? 'max-h-56' : 'h-28'
                  }`}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-36 w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-sky-50 via-cyan-50 to-teal-100 px-4 text-center dark:from-slate-800 dark:via-slate-800 dark:to-slate-700">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/80 shadow-sm ring-1 ring-blue-100 dark:bg-slate-900/80 dark:ring-slate-600">
              <Camera className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Open to add photos & details
              </p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Tap to view this dive
              </p>
            </div>
          </div>
        )}

        <div className="space-y-2 p-4">
          <div>
            <time className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {new Date(dive.diveDate).toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </time>
            {placeName && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {placeName}
              </p>
            )}
          </div>

          {dive.notes ? (
            <p className="line-clamp-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {dive.notes}
            </p>
          ) : (
            <p className="text-sm italic text-slate-400">No note for this dive</p>
          )}

          {detailLine.length > 0 && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {detailLine.join(' · ')}
            </p>
          )}

          <p className="pt-1 text-xs font-medium text-blue-600 dark:text-blue-400">
            View full entry →
          </p>
        </div>
      </article>

      <DiveDetailDialog
        dive={{ ...dive, photos }}
        placeName={placeName}
        open={open}
        onOpenChange={setOpen}
        pendingPhotoDataUrl={pendingPhotoDataUrl}
        onPhotoAdded={(photo) => {
          setPhotos((prev) => [...prev, photo]);
          onPhotoAdded?.(photo);
        }}
        onPhotoRemoved={(photoId) => {
          setPhotos((prev) => prev.filter((p) => p.id !== photoId));
          onPhotoRemoved?.(photoId);
        }}
        onUpdated={onUpdated}
        onDeleted={onDeleted}
        onAttachedPending={onAttachedPending}
      />
    </>
  );
}

type AddMemoryFormProps = {
  siteId: string;
  onCreated: (dive: LogbookDive) => void;
  defaultNote?: string;
};

export function AddMemoryForm({
  siteId,
  onCreated,
  defaultNote = '',
}: AddMemoryFormProps) {
  const [diveDate, setDiveDate] = useState(
    () => new Date().toISOString().slice(0, 16)
  );
  const [notes, setNotes] = useState(defaultNote);
  const [details, setDetails] = useState<DiveDetailsInput>(emptyDiveDetails);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const parsed = parseDiveDetails(details);
      const res = await fetch('/api/dives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId,
          diveDate,
          notes: notes.trim() || undefined,
          ...parsed,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save dive');
      }
      const dive = (await res.json()) as LogbookDive;
      setNotes('');
      setDetails(emptyDiveDetails());
      onCreated(dive);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save dive');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-xl border border-dashed border-slate-300 p-4 dark:border-slate-600"
    >
      <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
        Log another dive
      </div>
      <div className="space-y-2">
        <Label htmlFor="dive-date">When</Label>
        <Input
          id="dive-date"
          type="datetime-local"
          value={diveDate}
          onChange={(e) => setDiveDate(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="dive-note">What do you remember?</Label>
        <Input
          id="dive-note"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Turquoise water, curious turtles…"
        />
      </div>
      <DiveDetailsFields
        idPrefix={`add-dive-${siteId}`}
        value={details}
        onChange={setDetails}
        compact
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <Button type="submit" disabled={saving} className="w-full">
        {saving ? 'Saving…' : 'Save dive'}
      </Button>
    </form>
  );
}
