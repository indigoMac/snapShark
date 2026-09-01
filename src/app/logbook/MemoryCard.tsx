'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus, Loader2, Pencil, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { LogbookDive, LogbookPhoto } from '@/lib/logbook';
import { compressImageForLogbook } from '@/lib/compress-image';

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

function toDatetimeLocalValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

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
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photos, setPhotos] = useState(dive.photos);
  const [diveDate, setDiveDate] = useState(() =>
    toDatetimeLocalValue(dive.diveDate)
  );
  const [notes, setNotes] = useState(dive.notes ?? '');

  useEffect(() => {
    setPhotos(dive.photos);
    setDiveDate(toDatetimeLocalValue(dive.diveDate));
    setNotes(dive.notes ?? '');
  }, [dive]);

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

  const handleSaveEdit = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/dives/${dive.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diveDate,
          notes: notes.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update dive');
      }
      const updated = (await res.json()) as LogbookDive;
      onUpdated?.(updated);
      setEditing(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update dive');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        'Delete this dive? Photos attached to it will be removed too.'
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/dives/${dive.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete dive');
      }
      onDeleted?.(dive.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete dive');
      setBusy(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!window.confirm('Remove this photo from the dive?')) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/photos/${photoId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete photo');
      }
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      onPhotoRemoved?.(photoId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete photo');
    } finally {
      setBusy(false);
    }
  };

  return (
    <article
      className={`overflow-hidden rounded-xl border bg-white shadow-sm transition dark:bg-slate-900 ${
        highlight
          ? 'border-blue-400 ring-2 ring-blue-400/40 dark:border-blue-400'
          : 'border-slate-200 dark:border-slate-700'
      }`}
    >
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />
      {photos.length > 0 ? (
        <div
          className={`grid gap-0.5 ${
            photos.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
          }`}
        >
          {photos.slice(0, 4).map((photo) => (
            <div key={photo.id} className="group relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={photo.caption || 'Dive photo'}
                className={`w-full object-cover ${
                  photos.length === 1 ? 'max-h-56' : 'h-28'
                }`}
              />
              <button
                type="button"
                title="Remove photo"
                disabled={busy}
                onClick={() => handleDeletePhoto(photo.id)}
                className="absolute right-1 top-1 rounded bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <button
          type="button"
          disabled={uploading || busy}
          onClick={() => fileRef.current?.click()}
          className="group flex h-36 w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-sky-50 via-cyan-50 to-teal-100 px-4 text-center transition hover:from-sky-100 hover:to-teal-100 dark:from-slate-800 dark:via-slate-800 dark:to-slate-700 dark:hover:from-slate-700"
        >
          {uploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/80 shadow-sm ring-1 ring-blue-100 transition group-hover:scale-105 dark:bg-slate-900/80 dark:ring-slate-600">
              <Camera className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {uploading ? 'Adding photo…' : 'Add a photo of this dive'}
            </p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Make this entry feel like you were there
            </p>
          </div>
        </button>
      )}

      <div className="space-y-3 p-4">
        {editing ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor={`edit-date-${dive.id}`}>When</Label>
              <Input
                id={`edit-date-${dive.id}`}
                type="datetime-local"
                value={diveDate}
                onChange={(e) => setDiveDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`edit-notes-${dive.id}`}>Dive note</Label>
              <Input
                id={`edit-notes-${dive.id}`}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What do you remember?"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                disabled={busy}
                onClick={handleSaveEdit}
              >
                Save
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => {
                  setEditing(false);
                  setDiveDate(toDatetimeLocalValue(dive.diveDate));
                  setNotes(dive.notes ?? '');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
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
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {dive.notes}
              </p>
            ) : (
              <p className="text-sm italic text-slate-400">
                No note for this dive
              </p>
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
          </>
        )}

        {error && (
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        )}

        {!editing && (
          <div className="flex flex-wrap gap-2">
            {photos.length > 0 && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={uploading || busy}
                onClick={() => fileRef.current?.click()}
              >
                {uploading ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ImagePlus className="mr-1.5 h-3.5 w-3.5" />
                )}
                Add photo
              </Button>
            )}
            {pendingPhotoDataUrl && (
              <Button
                type="button"
                size="sm"
                disabled={uploading || busy}
                onClick={handleAttachPending}
              >
                Attach corrected photo
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => setEditing(true)}
            >
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Edit
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={handleDelete}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        )}
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
        throw new Error(data.error || 'Failed to save dive');
      }
      const dive = (await res.json()) as LogbookDive;
      setNotes('');
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
      {error && <p className="text-xs text-red-600">{error}</p>}
      <Button type="submit" disabled={saving} className="w-full">
        {saving ? 'Saving…' : 'Save dive'}
      </Button>
    </form>
  );
}
