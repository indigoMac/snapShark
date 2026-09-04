'use client';

import { useState } from 'react';
import { Check, Copy, Download, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { composeShareCard } from '@/lib/share-card';

type ShareBarProps = {
  url: string;
  title: string;
  text: string;
  imageUrl?: string | null;
  tone?: 'app' | 'ocean';
};

export function ShareBar({
  url,
  title,
  text,
  imageUrl,
  tone = 'app',
}: ShareBarProps) {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const copyLink = async () => {
    setError(null);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy the link');
    }
  };

  const nativeShare = async () => {
    setError(null);
    if (!navigator.share) {
      await copyLink();
      return;
    }
    try {
      await navigator.share({ title, text, url });
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      await copyLink();
    }
  };

  const shareImage = async () => {
    setBusy(true);
    setError(null);
    try {
      const blob = await composeShareCard({
        title,
        imageUrl: imageUrl ?? null,
      });
      const file = new File([blob], `${slugify(title)}-snapshark.jpg`, {
        type: 'image/jpeg',
      });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title,
          text,
          files: [file],
        });
        return;
      }

      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(
        err instanceof Error ? err.message : 'Could not make a share image'
      );
    } finally {
      setBusy(false);
    }
  };

  const oceanPrimary =
    'rounded-none bg-[#e8f4f1] text-[#06262f] hover:bg-white';
  const oceanOutline =
    'rounded-none border-[rgb(126_200_192_/_0.4)] text-[#e8f4f1]';

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button
          type="button"
          onClick={() => void nativeShare()}
          className={tone === 'ocean' ? oceanPrimary : undefined}
        >
          <Share2 className="mr-2 h-4 w-4" />
          Send to WhatsApp or Messages
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => void copyLink()}
          className={tone === 'ocean' ? oceanOutline : undefined}
        >
          {copied ? (
            <Check className="mr-2 h-4 w-4" />
          ) : (
            <Copy className="mr-2 h-4 w-4" />
          )}
          {copied ? 'Link copied' : 'Copy link'}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => void shareImage()}
          className={tone === 'ocean' ? oceanOutline : undefined}
        >
          <Download className="mr-2 h-4 w-4" />
          {busy ? 'Making card…' : 'Image for Instagram'}
        </Button>
      </div>
      {error && (
        <p className={tone === 'ocean' ? 'text-xs text-red-300' : 'text-xs text-red-600'}>
          {error}
        </p>
      )}
    </div>
  );
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'dive'
  );
}
