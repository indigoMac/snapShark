'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Loader2, MapPinned, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { GeocodeResult } from '@/lib/geocode';

type MapSearchProps = {
  onSelect: (result: GeocodeResult) => void;
};

export function MapSearch({ onSelect }: MapSearchProps) {
  const listId = useId();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const abortRef = useRef<AbortController | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    const timer = window.setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Search failed');
        }
        const data = (await res.json()) as { results: GeocodeResult[] };
        setResults(data.results);
        setOpen(true);
        setActiveIndex(data.results.length ? 0 : -1);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setResults([]);
        setError(err instanceof Error ? err.message : 'Search failed');
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => {
      window.clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [query]);

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const pick = (result: GeocodeResult) => {
    onSelect(result);
    setQuery(result.kind === 'coordinates' ? result.label : result.label.split(',')[0] ?? result.label);
    setOpen(false);
    setResults([]);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || results.length === 0) {
      if (event.key === 'Escape') setOpen(false);
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      pick(results[activeIndex]);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (results.length) setOpen(true);
          }}
          onKeyDown={onKeyDown}
          placeholder="Search a place or paste lat, lng"
          className="h-10 bg-white/95 pl-9 pr-9 shadow-md dark:bg-slate-900/95"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
          ) : query ? (
            <button
              type="button"
              className="rounded p-1 text-slate-400 hover:text-slate-700"
              onClick={() => {
                setQuery('');
                setResults([]);
                setError(null);
                setOpen(false);
              }}
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      {open && (results.length > 0 || error || (query.trim().length >= 2 && !loading)) && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-[1001] mt-1 max-h-64 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900"
        >
          {error && (
            <li className="px-3 py-2 text-sm text-red-600">{error}</li>
          )}
          {!error && results.length === 0 && !loading && (
            <li className="px-3 py-2 text-sm text-slate-500">No places found</li>
          )}
          {results.map((result, index) => (
            <li key={result.id} role="option" aria-selected={index === activeIndex}>
              <button
                type="button"
                className={`flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800 ${
                  index === activeIndex ? 'bg-slate-100 dark:bg-slate-800' : ''
                }`}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => pick(result)}
              >
                <MapPinned className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                <span className="min-w-0">
                  <span className="block truncate font-medium text-slate-900 dark:text-slate-100">
                    {result.kind === 'coordinates'
                      ? 'Go to coordinates'
                      : result.label.split(',')[0]}
                  </span>
                  <span className="block truncate text-xs text-slate-500">
                    {result.label}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
