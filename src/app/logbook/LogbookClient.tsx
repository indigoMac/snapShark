'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { SignInButton, useUser } from '@clerk/nextjs';
import { ArrowLeft, CheckCircle2, Compass, MapPinned, Pencil, Trash2, Waves, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  clearPendingPhoto,
  coverPhotoForSite,
  readPendingPhoto,
  type LogbookDive,
  type LogbookPhoto,
  type LogbookSite,
  type LogbookTrip,
  type PendingLogbookPhoto,
} from '@/lib/logbook';
import { CreatePlaceDialog } from './CreatePlaceDialog';
import { AddMemoryForm, MemoryCard } from './MemoryCard';
import { PlacesBrowse } from './PlacesBrowse';
import { TripsBrowse } from './TripsBrowse';
import { ShareDialogButton } from './ShareDialogButton';

const LogbookMap = dynamic(() => import('./LogbookMap'), { ssr: false });

export default function LogbookClient() {
  const { isSignedIn, isLoaded } = useUser();
  const searchParams = useSearchParams();
  const [sites, setSites] = useState<LogbookSite[]>([]);
  const [trips, setTrips] = useState<LogbookTrip[]>([]);
  const [selectedTripFilter, setSelectedTripFilter] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authTimedOut, setAuthTimedOut] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [relocatingSiteId, setRelocatingSiteId] = useState<string | null>(null);
  const [relocateDraft, setRelocateDraft] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [pendingPin, setPendingPin] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [placeNameDraft, setPlaceNameDraft] = useState('');
  const [placeBusy, setPlaceBusy] = useState(false);
  const [pendingPhoto, setPendingPhoto] = useState<PendingLogbookPhoto | null>(
    null
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [highlightedDiveId, setHighlightedDiveId] = useState<string | null>(
    null
  );

  const selectedSite = sites.find((s) => s.id === selectedSiteId) ?? null;
  const visibleSites = selectedTripFilter
    ? sites.filter((s) => s.tripId === selectedTripFilter)
    : sites;

  const loadSites = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sitesRes, tripsRes] = await Promise.all([
        fetch('/api/dive-sites'),
        fetch('/api/trips'),
      ]);
      if (sitesRes.status === 401) {
        setSites([]);
        setTrips([]);
        return;
      }
      if (!sitesRes.ok) throw new Error('Failed to load your places');
      const sitesJson = (await sitesRes.json()) as LogbookSite[];
      setSites(sitesJson);
      if (tripsRes.ok) {
        setTrips((await tripsRes.json()) as LogbookTrip[]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load logbook');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoaded) {
      setAuthTimedOut(false);
      return;
    }
    const timer = window.setTimeout(() => setAuthTimedOut(true), 8000);
    return () => window.clearTimeout(timer);
  }, [isLoaded]);

  useEffect(() => {
    if (isSignedIn) {
      loadSites();
    } else if (isLoaded) {
      setLoading(false);
    }
  }, [isSignedIn, isLoaded, loadSites]);

  useEffect(() => {
    const pending = readPendingPhoto();
    if (pending) setPendingPhoto(pending);
  }, [searchParams]);

  useEffect(() => {
    if (!successMessage) return;
    const timer = window.setTimeout(() => setSuccessMessage(null), 4500);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  useEffect(() => {
    if (!highlightedDiveId) return;
    const timer = window.setTimeout(() => setHighlightedDiveId(null), 4500);
    return () => window.clearTimeout(timer);
  }, [highlightedDiveId]);

  const dismissPendingPhoto = () => {
    clearPendingPhoto();
    setPendingPhoto(null);
  };

  const handleMapClick = (lat: number, lng: number) => {
    // Drop a draggable pin first — don't open the form until they confirm.
    setPendingPin({ lat, lng });
    setCreateOpen(false);
  };

  const clearPendingPin = () => {
    setPendingPin(null);
    setCreateOpen(false);
  };

  const handlePlaceCreated = (site: LogbookSite) => {
    setSites((prev) => {
      const without = prev.filter((s) => s.id !== site.id);
      return [site, ...without];
    });
    setSelectedSiteId(site.id);
    setPendingPin(null);
    setCreateOpen(false);
    const firstDive = site.dives[0];
    if (firstDive) {
      setHighlightedDiveId(firstDive.id);
      setSuccessMessage(
        `Saved “${site.name}”. Add a photo to bring this dive to life.`
      );
    } else {
      setSuccessMessage(`Saved “${site.name}” to your logbook.`);
    }
  };

  const updateSiteDives = (
    siteId: string,
    updater: (dives: LogbookDive[]) => LogbookDive[]
  ) => {
    setSites((prev) =>
      prev.map((site) =>
        site.id === siteId ? { ...site, dives: updater(site.dives) } : site
      )
    );
  };

  const handleMemoryCreated = (dive: LogbookDive) => {
    if (!selectedSiteId) return;
    updateSiteDives(selectedSiteId, (dives) => [dive, ...dives]);
    setHighlightedDiveId(dive.id);
    setSuccessMessage('Dive saved. Add a photo when you have one.');
  };

  const handlePhotoAdded = (diveId: string, photo: LogbookPhoto) => {
    if (!selectedSiteId) return;
    updateSiteDives(selectedSiteId, (dives) =>
      dives.map((d) =>
        d.id === diveId ? { ...d, photos: [...d.photos, photo] } : d
      )
    );
  };

  const handlePhotoRemoved = (diveId: string, photoId: string) => {
    if (!selectedSiteId) return;
    updateSiteDives(selectedSiteId, (dives) =>
      dives.map((d) =>
        d.id === diveId
          ? { ...d, photos: d.photos.filter((p) => p.id !== photoId) }
          : d
      )
    );
  };

  const handleMemoryUpdated = (dive: LogbookDive) => {
    if (!selectedSiteId) return;
    updateSiteDives(selectedSiteId, (dives) =>
      dives.map((d) => (d.id === dive.id ? dive : d))
    );
  };

  const handleMemoryDeleted = (diveId: string) => {
    if (!selectedSiteId) return;
    updateSiteDives(selectedSiteId, (dives) =>
      dives.filter((d) => d.id !== diveId)
    );
  };

  const startRename = () => {
    if (!selectedSite) return;
    setPlaceNameDraft(selectedSite.name);
    setRenaming(true);
  };

  const saveRename = async () => {
    if (!selectedSiteId || !placeNameDraft.trim()) return;
    setPlaceBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/dive-sites/${selectedSiteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: placeNameDraft.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to rename place');
      }
      const updated = (await res.json()) as LogbookSite;
      setSites((prev) =>
        prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s))
      );
      setRenaming(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to rename place');
    } finally {
      setPlaceBusy(false);
    }
  };

  const deletePlace = async () => {
    if (!selectedSiteId || !selectedSite) return;
    if (
      !window.confirm(
        `Delete “${selectedSite.name}” and all dives there? This cannot be undone.`
      )
    ) {
      return;
    }
    setPlaceBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/dive-sites/${selectedSiteId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete place');
      }
      setSites((prev) => prev.filter((s) => s.id !== selectedSiteId));
      setSelectedSiteId(null);
      setRenaming(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete place');
    } finally {
      setPlaceBusy(false);
    }
  };

  const startRelocate = () => {
    if (!selectedSite) return;
    setPendingPin(null);
    setCreateOpen(false);
    setRelocatingSiteId(selectedSite.id);
    setRelocateDraft({
      lat: selectedSite.latitude,
      lng: selectedSite.longitude,
    });
  };

  const cancelRelocate = () => {
    setRelocatingSiteId(null);
    setRelocateDraft(null);
  };

  const saveRelocate = async () => {
    if (!relocatingSiteId || !relocateDraft) return;
    setPlaceBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/dive-sites/${relocatingSiteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: relocateDraft.lat,
          longitude: relocateDraft.lng,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to move place');
      }
      const updated = (await res.json()) as LogbookSite;
      setSites((prev) =>
        prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s))
      );
      setRelocatingSiteId(null);
      setRelocateDraft(null);
      setSuccessMessage(`Moved “${updated.name}” to the new spot.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to move place');
    } finally {
      setPlaceBusy(false);
    }
  };

  const assignTrip = async (tripId: string) => {
    if (!selectedSiteId) return;
    setPlaceBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/dive-sites/${selectedSiteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: tripId === '' ? null : tripId,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update trip');
      }
      const updated = (await res.json()) as LogbookSite;
      setSites((prev) =>
        prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s))
      );
      await loadSites();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update trip');
    } finally {
      setPlaceBusy(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="mx-auto max-w-lg space-y-3 py-20 text-center">
        <p className="text-sm text-slate-500">
          {authTimedOut ? 'Sign-in is not loading…' : 'Loading…'}
        </p>
        {authTimedOut && (
          <p className="text-sm text-muted-foreground">
            Preview deployments need Clerk <span className="font-medium">Development</span> keys
            (production keys only work on snap-shark.com). Set Preview env vars in Vercel, or
            test the logbook locally with <code className="text-xs">npm run dev</code>.
          </p>
        )}
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="mx-auto max-w-lg space-y-6 py-16 text-center">
        <Compass className="mx-auto h-12 w-12 text-blue-500" />
        <h1 className="text-3xl font-bold tracking-tight">Dive logbook</h1>
        <p className="text-muted-foreground">
        Sign in to pin places, keep photos with them, and send a trip to
          someone who wasn&apos;t there.
        </p>
        <SignInButton mode="modal">
          <Button size="lg">Sign in to open logbook</Button>
        </SignInButton>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="brand-eyebrow">Logbook</p>
          <h1 className="brand-title text-3xl sm:text-4xl">Dive logbook</h1>
          <p className="max-w-xl text-sm leading-relaxed text-[#9bb8b3] sm:text-base">
            Pin a place, attach a photo, send the trip. Depth and time can wait.
          </p>
        </div>
        <Button
          variant="outline"
          asChild
          className="min-h-11 w-full rounded-none border-[rgb(126_200_192_/_0.35)] sm:w-auto"
        >
          <Link href="/underwater">
            <Waves className="mr-2 h-4 w-4" />
            Fix a photo first
          </Link>
        </Button>
      </header>

      {pendingPhoto && (
        <div className="flex flex-col gap-3 rounded-xl border border-cyan-200 bg-cyan-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-cyan-800 dark:bg-cyan-950/40">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pendingPhoto.dataUrl}
              alt="Pending corrected photo"
              className="h-14 w-14 rounded-lg object-cover"
            />
            <div>
              <p className="text-sm font-medium text-cyan-950 dark:text-cyan-100">
                Corrected photo ready to attach
              </p>
              <p className="text-xs text-cyan-800 dark:text-cyan-300">
                Open a place, pick a dive, then tap &quot;Attach corrected
                photo&quot;.
              </p>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={dismissPendingPhoto}
          >
            <X className="mr-1 h-4 w-4" />
            Dismiss
          </Button>
        </div>
      )}

      {successMessage && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="flex-1">{successMessage}</p>
          <button
            type="button"
            className="text-emerald-700/70 hover:text-emerald-900 dark:text-emerald-200/70"
            onClick={() => setSuccessMessage(null)}
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm dark:border-slate-800">
          <div className="h-[min(58dvh,560px)] min-h-[260px] sm:h-[min(70vh,640px)] sm:min-h-[420px]">
            <LogbookMap
              sites={visibleSites}
              selectedSiteId={selectedSiteId}
              relocatingSiteId={relocatingSiteId}
              pendingPin={pendingPin}
              onMapClick={handleMapClick}
              onPendingPinMove={(lat, lng) => setPendingPin({ lat, lng })}
              onRelocatePinMove={(lat, lng) => setRelocateDraft({ lat, lng })}
              onSelectSite={(id) => {
                setSelectedSiteId(id);
                setRenaming(false);
                setRelocatingSiteId(null);
                setRelocateDraft(null);
              }}
            />
          </div>
          {relocatingSiteId && relocateDraft && (
            <div className="flex flex-col gap-2 border-t border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900 dark:bg-amber-950/40 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-amber-950 dark:text-amber-100">
                Drag the pin ·{' '}
                <span className="font-mono text-xs">
                  {relocateDraft.lat.toFixed(5)}, {relocateDraft.lng.toFixed(5)}
                </span>
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={placeBusy}
                  onClick={cancelRelocate}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={placeBusy}
                  onClick={saveRelocate}
                >
                  {placeBusy ? 'Saving…' : 'Save location'}
                </Button>
              </div>
            </div>
          )}
          {pendingPin && !createOpen && !relocatingSiteId && (
            <div className="flex flex-col gap-2 border-t border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Drag the pin to fine-tune ·{' '}
                <span className="font-mono text-xs text-slate-500">
                  {pendingPin.lat.toFixed(5)}, {pendingPin.lng.toFixed(5)}
                </span>
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearPendingPin}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setCreateOpen(true)}
                >
                  Name this place
                </Button>
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          {selectedSite ? (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => {
                  setSelectedSiteId(null);
                  setRenaming(false);
                }}
                className="inline-flex items-center text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                All places
              </button>

              <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                {coverPhotoForSite(selectedSite) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={coverPhotoForSite(selectedSite)!}
                    alt=""
                    className="h-36 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-28 items-center justify-center bg-gradient-to-br from-sky-100 to-blue-200 dark:from-slate-800 dark:to-slate-700">
                    <Compass className="h-10 w-10 text-blue-500/70" />
                  </div>
                )}
                <div className="space-y-2 p-4">
                  {renaming ? (
                    <div className="flex gap-2">
                      <Input
                        value={placeNameDraft}
                        onChange={(e) => setPlaceNameDraft(e.target.value)}
                        disabled={placeBusy}
                        autoFocus
                      />
                      <Button
                        type="button"
                        size="sm"
                        disabled={placeBusy}
                        onClick={saveRename}
                      >
                        Save
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={placeBusy}
                        onClick={() => setRenaming(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="text-xl font-semibold">
                          {selectedSite.name}
                        </h2>
                        <p className="text-xs text-slate-500">
                          {selectedSite.latitude.toFixed(4)},{' '}
                          {selectedSite.longitude.toFixed(4)}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <ShareDialogButton
                          kind="place"
                          id={selectedSite.id}
                          name={selectedSite.name}
                          shareToken={selectedSite.shareToken}
                          coverUrl={coverPhotoForSite(selectedSite)}
                          labeled
                          onShareTokenChange={(token) => {
                            setSites((prev) =>
                              prev.map((s) =>
                                s.id === selectedSite.id
                                  ? { ...s, shareToken: token }
                                  : s
                              )
                            );
                          }}
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={placeBusy || !!relocatingSiteId}
                          onClick={startRelocate}
                          title="Move pin"
                        >
                          <MapPinned className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={placeBusy}
                          onClick={startRename}
                          title="Rename place"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={placeBusy}
                          onClick={deletePlace}
                          title="Delete place"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="space-y-1 pt-1">
                    <label
                      htmlFor="place-trip"
                      className="text-xs font-medium text-slate-500"
                    >
                      Trip
                    </label>
                    <select
                      id="place-trip"
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
                      value={selectedSite.tripId ?? ''}
                      disabled={placeBusy}
                      onChange={(e) => assignTrip(e.target.value)}
                    >
                      <option value="">No trip</option>
                      {trips.map((trip) => (
                        <option key={trip.id} value={trip.id}>
                          {trip.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Dive entries
                </h3>
                {selectedSite.dives.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No dives logged here yet — add the first one below.
                  </p>
                ) : (
                  selectedSite.dives.map((dive) => (
                    <MemoryCard
                      key={dive.id}
                      dive={dive}
                      placeName={selectedSite.name}
                      placeId={selectedSite.id}
                      shareToken={selectedSite.shareToken}
                      coverUrl={coverPhotoForSite(selectedSite)}
                      highlight={dive.id === highlightedDiveId}
                      pendingPhotoDataUrl={pendingPhoto?.dataUrl}
                      onPhotoAdded={(photo) =>
                        handlePhotoAdded(dive.id, photo)
                      }
                      onPhotoRemoved={(photoId) =>
                        handlePhotoRemoved(dive.id, photoId)
                      }
                      onUpdated={handleMemoryUpdated}
                      onDeleted={handleMemoryDeleted}
                      onAttachedPending={dismissPendingPhoto}
                      onShareTokenChange={(token) => {
                        setSites((prev) =>
                          prev.map((s) =>
                            s.id === selectedSite.id
                              ? { ...s, shareToken: token }
                              : s
                          )
                        );
                      }}
                    />
                  ))
                )}
                <AddMemoryForm
                  siteId={selectedSite.id}
                  onCreated={handleMemoryCreated}
                />
              </div>
            </div>
          ) : loading ? (
            <p className="text-sm text-slate-500">Loading places…</p>
          ) : (
            <div className="space-y-6">
              <TripsBrowse
                trips={trips}
                selectedTripId={selectedTripFilter}
                onSelectTrip={setSelectedTripFilter}
                onCreated={(trip) => {
                  setTrips((prev) => [trip, ...prev]);
                  setSelectedTripFilter(trip.id);
                  setSuccessMessage(
                    `Trip “${trip.name}” created — assign places to it from a place’s details.`
                  );
                }}
                onDeleted={(tripId) => {
                  setTrips((prev) => prev.filter((t) => t.id !== tripId));
                  setSites((prev) =>
                    prev.map((s) =>
                      s.tripId === tripId
                        ? { ...s, tripId: null, trip: null }
                        : s
                    )
                  );
                  if (selectedTripFilter === tripId) {
                    setSelectedTripFilter(null);
                  }
                }}
                onShareTokenChange={(tripId, token) => {
                  setTrips((prev) =>
                    prev.map((t) =>
                      t.id === tripId ? { ...t, shareToken: token } : t
                    )
                  );
                }}
              />
              <PlacesBrowse
                sites={visibleSites}
                selectedSiteId={selectedSiteId}
                onSelect={setSelectedSiteId}
              />
            </div>
          )}
        </aside>
      </div>

      <CreatePlaceDialog
        open={createOpen}
        lat={pendingPin?.lat ?? null}
        lng={pendingPin?.lng ?? null}
        onOpenChange={(open) => {
          setCreateOpen(open);
          // Keep the pin if they close the form — they can still drag and try again.
        }}
        onCreated={handlePlaceCreated}
      />
    </div>
  );
}
