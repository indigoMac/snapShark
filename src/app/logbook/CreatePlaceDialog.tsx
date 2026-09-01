'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { LogbookDive, LogbookSite } from '@/lib/logbook';

type CreatePlaceDialogProps = {
  open: boolean;
  lat: number | null;
  lng: number | null;
  onOpenChange: (open: boolean) => void;
  onCreated: (site: LogbookSite, firstDive?: LogbookDive) => void;
};

export function CreatePlaceDialog({
  open,
  lat,
  lng,
  onOpenChange,
  onCreated,
}: CreatePlaceDialogProps) {
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [diveDate, setDiveDate] = useState(
    () => new Date().toISOString().slice(0, 16)
  );
  const [addMemory, setAddMemory] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setName('');
    setNotes('');
    setDiveDate(new Date().toISOString().slice(0, 16));
    setAddMemory(true);
    setError(null);
  };

  const handleSave = async () => {
    if (lat == null || lng == null) return;
    if (!name.trim()) {
      setError('Give this place a name');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const siteRes = await fetch('/api/dive-sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          latitude: lat,
          longitude: lng,
        }),
      });
      if (!siteRes.ok) {
        const data = await siteRes.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create place');
      }
      let site = (await siteRes.json()) as LogbookSite;
      let firstDive: LogbookDive | undefined;

      if (addMemory) {
        const diveRes = await fetch('/api/dives', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            siteId: site.id,
            diveDate,
            notes: notes.trim() || undefined,
          }),
        });
        if (!diveRes.ok) {
          const data = await diveRes.json().catch(() => ({}));
          throw new Error(data.error || 'Place saved, but dive failed');
        }
        firstDive = (await diveRes.json()) as LogbookDive;
        site = {
          ...site,
          dives: [firstDive, ...(site.dives ?? [])],
        };
      }

      reset();
      onCreated(site, firstDive);
      onOpenChange(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save place');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pin a dive place</DialogTitle>
          <DialogDescription>
            {lat != null && lng != null
              ? `Pin at ${lat.toFixed(4)}, ${lng.toFixed(4)}. Name it and optionally log your first dive.`
              : 'Choose a spot on the map first.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="place-name">Place name</Label>
            <Input
              id="place-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Blue Hole, Ras Mohamed…"
              autoFocus
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={addMemory}
              onChange={(e) => setAddMemory(e.target.checked)}
              className="rounded border-slate-300"
            />
            Log a dive here
          </label>

          {addMemory && (
            <div className="space-y-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
              <div className="space-y-2">
                <Label htmlFor="place-dive-date">When</Label>
                <Input
                  id="place-dive-date"
                  type="datetime-local"
                  value={diveDate}
                  onChange={(e) => setDiveDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="place-notes">What do you remember?</Label>
                <Input
                  id="place-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="What made this dive special?"
                />
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving || lat == null}>
            {saving ? 'Saving…' : 'Save place'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
