'use client';

import { useState } from 'react';
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ShareBar } from '@/components/ShareBar';
import { sharePath } from '@/lib/share-url';
import { SITE_URL } from '@/lib/seo';

type ShareKind = 'trip' | 'place';

type ShareDialogButtonProps = {
  kind: ShareKind;
  id: string;
  name: string;
  shareToken?: string | null;
  coverUrl?: string | null;
  onShareTokenChange: (token: string | null) => void;
};

export function ShareDialogButton({
  kind,
  id,
  name,
  shareToken,
  coverUrl,
  onShareTokenChange,
}: ShareDialogButtonProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState(shareToken ?? null);

  const endpoint =
    kind === 'trip' ? `/api/trips/${id}` : `/api/dive-sites/${id}`;
  const live = Boolean(token);
  const origin =
    typeof window !== 'undefined' ? window.location.origin : SITE_URL;
  const url = token ? `${origin}${sharePath(token)}` : '';

  const setSharing = async (shareEnabled: boolean) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shareEnabled }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Could not update sharing');
      }
      const json = (await res.json()) as { shareToken?: string | null };
      const next = json.shareToken ?? null;
      setToken(next);
      onShareTokenChange(next);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not update sharing');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        title={live ? 'Sharing is on' : 'Share'}
        onClick={() => setOpen(true)}
        className={live ? 'text-[#2f6f6a]' : undefined}
      >
        <Share2 className="h-4 w-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {kind === 'trip' ? 'Share this trip' : 'Share this place'}
            </DialogTitle>
            <DialogDescription>
              Anyone with the link can see the photos and notes on “{name}”.
              Your logbook stays private until you turn this on. Turn it off and
              the old link stops working.
            </DialogDescription>
          </DialogHeader>

          {!live ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                This makes a page you can paste into WhatsApp, Messages, or
                Instagram — not a public feed.
              </p>
              <Button
                type="button"
                disabled={busy}
                onClick={() => void setSharing(true)}
              >
                {busy ? 'Creating link…' : 'Create a share link'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <ShareBar
                url={url}
                title={name}
                text={`Look at this dive ${kind === 'trip' ? 'trip' : 'site'} on SnapShark`}
                imageUrl={coverUrl ?? null}
              />
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => void setSharing(false)}
              >
                {busy ? 'Stopping…' : 'Stop sharing'}
              </Button>
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </DialogContent>
      </Dialog>
    </>
  );
}
