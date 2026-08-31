'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { LogbookDive, LogbookPhoto } from '@/lib/logbook';
import { compressImageForLogbook } from '@/lib/compress-image';

type MemoryCardProps = {
  dive: LogbookDive;
  placeName?: string;
  pendingPhotoDataUrl?: string | null;
  onPhotoAdded?: (photo: LogbookPhoto) => void;
  onAttachedPending?: () => void;
};

export function MemoryCard({
  dive,
  placeName,
  pendingPhotoDataUrl,
  onPhotoAdded,
  onAttachedPending,
}: MemoryCardProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photos, setPhotos] = useState(dive.photos);

  useEffect(() => {
    setPhotos(dive.photos);
  }, [dive.photos]);

  const uploadDataUrl = async (dataUrl: string, caption?: string) => {
    setUploading(true);
    setError(null);
    try {
      const res = await fetch('/api/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diveId: dive.id,
          url: dataUrl,
          caption,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to attach photo');
      }
      const photo = (await res.json()) as LogbookPhoto;
      setPhotos((prev) => [...prev, photo]);
      onPhotoAdded?.(photo);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to attach photo');
    } finally {
      setUploading(false);
    }
  };

  const handleFile = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file');
      return;
    }
    try {
      const dataUrl = await compressImageForLogbook(file);
      await uploadDataUrl(dataUrl);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not process photo');
    }
  };

  const handleAttachPending = async () => {
    if (!pendingPhotoDataUrl) return;
    await uploadDataUrl(pendingPhotoDataUrl, 'From underwater correction');
    onAttachedPending?.();
  };

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      {photos.length > 0 ? (
        <div
          className={`grid gap-0.5 ${
            photos.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
          }`}
        >
          {photos.slice(0, 4).map((photo) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={photo.id}
              src={photo.url}
              alt={photo.caption || 'Dive memory'}
              className={`w-full object-cover ${
                photos.length === 1 ? 'max-h-56' : 'h-28'
              }`}
            />
          ))}
        </div>
      ) : (
        <div className="flex h-28 items-center justify-center bg-gradient-to-br from-sky-50 to-cyan-100 text-slate-400 dark:from-slate-800 dark:to-slate-700">
          <Camera className="h-8 w-8 opacity-50" />
        </div>
      )}

      <div className="space-y-3 p-4">
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
            <p className="text-xs text-slate-500 dark:text-slate-400">{placeName}</p>
          )}
        </div>

        {dive.notes ? (
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            {dive.notes}
          </p>
        ) : (
          <p className="text-sm italic text-slate-400">No note for this dive</p>
        )}

        {(dive.depthMeters != null || dive.bottomTimeMinutes != null) && (
          <p className="text-xs text-slate-500">
            {[
              dive.depthMeters != null ? `${dive.depthMeters} m` : null,
              dive.bottomTimeMinutes != null
                ? `${dive.bottomTimeMinutes} min`
                : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        )}

        {error && (
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        )}

        <div className="flex flex-wrap gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <ImagePlus className="mr-1.5 h-3.5 w-3.5" />
            )}
            Add photo
          </Button>
          {pendingPhotoDataUrl && (
            <Button
              type="button"
              size="sm"
              disabled={uploading}
              onClick={handleAttachPending}
            >
              Attach corrected photo
            </Button>
          )}
        </div>
      </div>
    </article>
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/dives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId,
          diveDate,
          notes: notes.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save memory');
      }
      const dive = (await res.json()) as LogbookDive;
      setNotes('');
      onCreated(dive);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save memory');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-dashed border-slate-300 p-4 dark:border-slate-600">
      <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
        Add a dive memory
      </div>
      <div className="space-y-2">
        <Label htmlFor="memory-date">When</Label>
        <Input
          id="memory-date"
          type="datetime-local"
          value={diveDate}
          onChange={(e) => setDiveDate(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="memory-note">What do you remember?</Label>
        <Input
          id="memory-note"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Turquoise water, curious turtles…"
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <Button type="submit" disabled={saving} className="w-full">
        {saving ? 'Saving…' : 'Save memory'}
      </Button>
    </form>
  );
}
