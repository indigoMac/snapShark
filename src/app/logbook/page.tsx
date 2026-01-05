'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, PlusCircle, Compass } from 'lucide-react';

// Leaflet needs window; load client-side only
const LogbookMap = dynamic(() => import('./LogbookMap'), { ssr: false });

type DiveSiteOption = {
  id: string;
  name: string;
};

export default function LogbookPage() {
  const [refreshToken, setRefreshToken] = useState(0);
  const [siteOptions, setSiteOptions] = useState<DiveSiteOption[]>([]);
  const [loadingSites, setLoadingSites] = useState(false);
  const [siteForm, setSiteForm] = useState({
    name: '',
    latitude: '',
    longitude: '',
    description: '',
    country: '',
    region: '',
  });
  const [diveForm, setDiveForm] = useState({
    diveDate: '',
    depthMeters: '',
    bottomTimeMinutes: '',
    siteId: '',
    notes: '',
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSites = useMemo(
    () => async () => {
      setLoadingSites(true);
      try {
        const res = await fetch('/api/dive-sites');
        if (!res.ok) throw new Error('Failed to load sites');
        const json = (await res.json()) as DiveSiteOption[];
        setSiteOptions(json);
      } catch (err: any) {
        setError(err.message || 'Failed to load sites');
      } finally {
        setLoadingSites(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  const handleCreateSite = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    try {
      const payload = {
        name: siteForm.name,
        latitude: parseFloat(siteForm.latitude),
        longitude: parseFloat(siteForm.longitude),
        description: siteForm.description || undefined,
        country: siteForm.country || undefined,
        region: siteForm.region || undefined,
      };
      if (!payload.name || Number.isNaN(payload.latitude) || Number.isNaN(payload.longitude)) {
        throw new Error('Name, latitude, and longitude are required');
      }
      const res = await fetch('/api/dive-sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create site');
      }
      setMessage('Site created');
      setSiteForm({
        name: '',
        latitude: '',
        longitude: '',
        description: '',
        country: '',
        region: '',
      });
      await fetchSites();
      setRefreshToken(Date.now());
    } catch (err: any) {
      setError(err.message || 'Failed to create site');
    }
  };

  const handleCreateDive = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    try {
      const payload = {
        diveDate: diveForm.diveDate,
        depthMeters: diveForm.depthMeters ? parseFloat(diveForm.depthMeters) : undefined,
        bottomTimeMinutes: diveForm.bottomTimeMinutes
          ? parseInt(diveForm.bottomTimeMinutes, 10)
          : undefined,
        siteId: diveForm.siteId || undefined,
        notes: diveForm.notes || undefined,
      };
      if (!payload.diveDate) {
        throw new Error('Dive date is required');
      }
      const res = await fetch('/api/dives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to log dive');
      }
      setMessage('Dive logged');
      setDiveForm({
        diveDate: '',
        depthMeters: '',
        bottomTimeMinutes: '',
        siteId: '',
        notes: '',
      });
      setRefreshToken(Date.now());
    } catch (err: any) {
      setError(err.message || 'Failed to log dive');
    }
  };

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">Dive Logbook</h1>
        <p className="text-muted-foreground max-w-2xl">
          A map-first view for your dives. You&apos;ll add sites, log dives, and
          pin photos to locations. Data stays tied to your account via the new
          logbook API.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/logbook/new">
              <PlusCircle className="w-4 h-4 mr-2" />
              New Dive (coming soon)
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">
              <Compass className="w-4 h-4 mr-2" />
              Back to Processor
            </Link>
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            Map View
          </CardTitle>
          <CardDescription>
            Interactive map showing your dive sites and dives.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[500px] rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800">
            <LogbookMap refreshToken={refreshToken} />
          </div>
        </CardContent>
      </Card>

      {(message || error) && (
        <div
          className={`p-3 rounded border text-sm ${
            message
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {message || error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Add Site</CardTitle>
            <CardDescription>Create a dive site with coordinates.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleCreateSite}>
              <div className="space-y-2">
                <Label htmlFor="site-name">Name</Label>
                <Input
                  id="site-name"
                  value={siteForm.name}
                  onChange={(e) => setSiteForm((s) => ({ ...s, name: e.target.value }))}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="site-lat">Latitude</Label>
                  <Input
                    id="site-lat"
                    type="number"
                    step="0.000001"
                    value={siteForm.latitude}
                    onChange={(e) =>
                      setSiteForm((s) => ({ ...s, latitude: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site-lng">Longitude</Label>
                  <Input
                    id="site-lng"
                    type="number"
                    step="0.000001"
                    value={siteForm.longitude}
                    onChange={(e) =>
                      setSiteForm((s) => ({ ...s, longitude: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="site-desc">Description (optional)</Label>
                <Input
                  id="site-desc"
                  value={siteForm.description}
                  onChange={(e) =>
                    setSiteForm((s) => ({ ...s, description: e.target.value }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="site-country">Country (optional)</Label>
                  <Input
                    id="site-country"
                    value={siteForm.country}
                    onChange={(e) =>
                      setSiteForm((s) => ({ ...s, country: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site-region">Region (optional)</Label>
                  <Input
                    id="site-region"
                    value={siteForm.region}
                    onChange={(e) =>
                      setSiteForm((s) => ({ ...s, region: e.target.value }))
                    }
                  />
                </div>
              </div>
              <Button type="submit" className="w-full">
                Save Site
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Log Dive</CardTitle>
            <CardDescription>Attach a dive to a site.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleCreateDive}>
              <div className="space-y-2">
                <Label htmlFor="dive-date">Date / Time</Label>
                <Input
                  id="dive-date"
                  type="datetime-local"
                  value={diveForm.diveDate}
                  onChange={(e) =>
                    setDiveForm((d) => ({ ...d, diveDate: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="dive-depth">Depth (m)</Label>
                  <Input
                    id="dive-depth"
                    type="number"
                    step="0.1"
                    value={diveForm.depthMeters}
                    onChange={(e) =>
                      setDiveForm((d) => ({ ...d, depthMeters: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dive-time">Bottom Time (min)</Label>
                  <Input
                    id="dive-time"
                    type="number"
                    value={diveForm.bottomTimeMinutes}
                    onChange={(e) =>
                      setDiveForm((d) => ({
                        ...d,
                        bottomTimeMinutes: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dive-site">Site</Label>
                <select
                  id="dive-site"
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                  value={diveForm.siteId}
                  onChange={(e) =>
                    setDiveForm((d) => ({ ...d, siteId: e.target.value }))
                  }
                  disabled={loadingSites || siteOptions.length === 0}
                >
                  <option value="">Select a site</option>
                  {siteOptions.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </select>
                {siteOptions.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Create a site first.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="dive-notes">Notes (optional)</Label>
                <Input
                  id="dive-notes"
                  value={diveForm.notes}
                  onChange={(e) =>
                    setDiveForm((d) => ({ ...d, notes: e.target.value }))
                  }
                />
              </div>
              <Button type="submit" className="w-full" disabled={siteOptions.length === 0}>
                Log Dive
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
