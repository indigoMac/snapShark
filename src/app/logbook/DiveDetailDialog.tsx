'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Loader2,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { LogbookDive, LogbookPhoto } from '@/lib/logbook';
import { compressImageForLogbook } from '@/lib/compress-image';
import {
  detailsFromDive,
  diveTypeLabel,
  parseDiveDetails,
  type DiveDetailsInput,
} from '@/lib/dive-details';
import { DiveDetailsFields } from './DiveDetailsFields';
import { ShareDialogButton } from './ShareDialogButton';

type DiveDetailDialogProps = {
  dive: LogbookDive;
  placeName?: string;
  placeId?: string;
  shareToken?: string | null;
  coverUrl?: string | null;
  onShareTokenChange?: (token: string | null) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

function formatDiveDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDiveTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function DiveDetailDialog({
  dive,
  placeName,
  placeId,
  shareToken,
  coverUrl,
  onShareTokenChange,
  open,
  onOpenChange,
  pendingPhotoDataUrl,
  onPhotoAdded,
  onPhotoRemoved,
  onUpdated,
  onDeleted,
  onAttachedPending,
}: DiveDetailDialogProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photos, setPhotos] = useState(dive.photos);
  const [activeIndex, setActiveIndex] = useState(0);
  const [diveDate, setDiveDate] = useState(() =>
    toDatetimeLocalValue(dive.diveDate)
  );
  const [notes, setNotes] = useState(dive.notes ?? '');
  const [details, setDetails] = useState<DiveDetailsInput>(() =>
    detailsFromDive(dive)
  );

  useEffect(() => {
    if (!open) return;
    setPhotos(dive.photos);
    setActiveIndex(0);
    setDiveDate(toDatetimeLocalValue(dive.diveDate));
    setNotes(dive.notes ?? '');
    setDetails(detailsFromDive(dive));
    setEditing(false);
    setError(null);
  }, [dive, open]);

  useEffect(() => {
    if (activeIndex >= photos.length && photos.length > 0) {
      setActiveIndex(photos.length - 1);
    }
  }, [photos.length, activeIndex]);

  const activePhoto = photos[activeIndex] ?? null;

  const stats: Array<{ label: string; value: string }> = [
    diveTypeLabel(dive.diveType)
      ? { label: 'Type', value: diveTypeLabel(dive.diveType)! }
      : null,
    dive.depthMeters != null
      ? { label: 'Max depth', value: `${dive.depthMeters} m` }
      : null,
    dive.bottomTimeMinutes != null
      ? { label: 'Bottom time', value: `${dive.bottomTimeMinutes} min` }
      : null,
    dive.buddy ? { label: 'Buddy', value: dive.buddy } : null,
    dive.conditions?.visibilityMeters != null
      ? {
          label: 'Visibility',
          value: `${dive.conditions.visibilityMeters} m`,
        }
      : null,
    dive.conditions?.waterTempC != null
      ? { label: 'Water temp', value: `${dive.conditions.waterTempC}°C` }
      : null,
  ].filter((s): s is { label: string; value: string } => s != null);

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
      setPhotos((prev) => {
        const next = [...prev, photo];
        setActiveIndex(next.length - 1);
        return next;
      });
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
      const parsed = parseDiveDetails(details);
      const res = await fetch(`/api/dives/${dive.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diveDate,
          notes: notes.trim() || null,
          diveType: parsed.diveType ?? null,
          depthMeters: parsed.depthMeters ?? null,
          bottomTimeMinutes: parsed.bottomTimeMinutes ?? null,
          buddy: parsed.buddy ?? null,
          conditions: parsed.conditions ?? null,
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
      onOpenChange(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex h-[100dvh] max-h-[100dvh] w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-0 p-0 left-0 top-0 sm:left-[50%] sm:top-[50%] sm:h-[min(92dvh,900px)] sm:max-w-3xl sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-2xl sm:border"
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />

        <DialogHeader className="shrink-0 space-y-1 border-b border-slate-200 px-4 py-3 pr-12 text-left dark:border-slate-700 sm:px-6">
          <DialogTitle className="text-base sm:text-lg">
            {placeName || 'Dive entry'}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {formatDiveDate(dive.diveDate)}
            <span className="text-slate-400"> · </span>
            {formatDiveTime(dive.diveDate)}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {/* Photo stage */}
          <div className="relative bg-slate-950">
            {activePhoto ? (
              <>
                <div className="relative flex aspect-[4/3] w-full items-center justify-center sm:aspect-[16/10]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activePhoto.url}
                    alt={activePhoto.caption || 'Dive photo'}
                    className="h-full w-full object-contain"
                  />
                  {photos.length > 1 && (
                    <>
                      <button
                        type="button"
                        aria-label="Previous photo"
                        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm transition hover:bg-black/70"
                        onClick={() =>
                          setActiveIndex(
                            (i) => (i - 1 + photos.length) % photos.length
                          )
                        }
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        aria-label="Next photo"
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm transition hover:bg-black/70"
                        onClick={() =>
                          setActiveIndex((i) => (i + 1) % photos.length)
                        }
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-2.5 py-1 text-xs text-white">
                        {activeIndex + 1} / {photos.length}
                      </div>
                    </>
                  )}
                  <button
                    type="button"
                    title="Remove photo"
                    disabled={busy}
                    onClick={() => handleDeletePhoto(activePhoto.id)}
                    className="absolute right-3 top-3 rounded-full bg-black/55 p-2 text-white transition hover:bg-red-600/90"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {activePhoto.caption && (
                  <p className="px-4 py-2 text-center text-xs text-slate-300">
                    {activePhoto.caption}
                  </p>
                )}
              </>
            ) : (
              <button
                type="button"
                disabled={uploading || busy}
                onClick={() => fileRef.current?.click()}
                className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-950 px-6 text-center transition hover:from-slate-800 sm:aspect-[16/10]"
              >
                {uploading ? (
                  <Loader2 className="h-10 w-10 animate-spin text-cyan-300" />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20">
                    <Camera className="h-7 w-7 text-cyan-200" />
                  </div>
                )}
                <div>
                  <p className="text-base font-semibold text-white">
                    {uploading ? 'Adding photo…' : 'Add a photo of this dive'}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    Photos make the memory feel real
                  </p>
                </div>
              </button>
            )}
          </div>

          {photos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/80">
              {photos.map((photo, index) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg ring-2 transition ${
                    index === activeIndex
                      ? 'ring-blue-500'
                      : 'ring-transparent opacity-80 hover:opacity-100'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          <div className="space-y-5 px-4 py-5 sm:px-6">
            {editing ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={`detail-date-${dive.id}`}>When</Label>
                  <Input
                    id={`detail-date-${dive.id}`}
                    type="datetime-local"
                    value={diveDate}
                    onChange={(e) => setDiveDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`detail-notes-${dive.id}`}>Dive note</Label>
                  <textarea
                    id={`detail-notes-${dive.id}`}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    placeholder="What do you remember?"
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>
                <DiveDetailsFields
                  idPrefix={`detail-dive-${dive.id}`}
                  value={details}
                  onChange={setDetails}
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    disabled={busy}
                    onClick={handleSaveEdit}
                  >
                    Save changes
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy}
                    onClick={() => {
                      setEditing(false);
                      setDiveDate(toDatetimeLocalValue(dive.diveDate));
                      setNotes(dive.notes ?? '');
                      setDetails(detailsFromDive(dive));
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <section className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Memory
                  </h3>
                  {dive.notes ? (
                    <p className="text-base leading-relaxed text-slate-800 dark:text-slate-100">
                      {dive.notes}
                    </p>
                  ) : (
                    <p className="text-sm italic text-slate-400">
                      No note for this dive yet
                    </p>
                  )}
                </section>

                <section className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Dive details
                  </h3>
                  {stats.length > 0 ? (
                    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {stats.map((stat) => (
                        <div
                          key={stat.label}
                          className="rounded-xl bg-slate-50 px-3 py-3 dark:bg-slate-800/70"
                        >
                          <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                            {stat.label}
                          </dt>
                          <dd className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {stat.value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className="text-sm text-slate-500">
                      No depth, time, or conditions logged yet — tap Edit to
                      add them.
                    </p>
                  )}
                </section>
              </>
            )}

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
          </div>
        </div>

        {!editing && (
          <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900 sm:px-6">
            <div className="flex flex-wrap gap-2">
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
              {placeId && onShareTokenChange && (
                <ShareDialogButton
                  kind="place"
                  id={placeId}
                  name={placeName || 'Dive place'}
                  shareToken={shareToken}
                  coverUrl={coverUrl ?? dive.photos[0]?.url ?? null}
                  onShareTokenChange={onShareTokenChange}
                  labeled
                />
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
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
