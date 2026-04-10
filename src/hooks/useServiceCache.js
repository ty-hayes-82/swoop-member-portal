/**
 * useServiceCache — pilot hook replacing the service-module `_init()` + `_d`
 * fallback pattern (see SHIP_PLAN §2.3).
 *
 * Provides a real {data, isLoading, error, refetch} contract so consumers can
 * render loading shimmer instead of the static fallback, with one automatic
 * retry on thrown errors, in-flight dedupe across concurrent callers, a 60s
 * TTL, and optional multi-tenant cache invalidation scoped by clubId.
 *
 * Intentionally dependency-free: React only, no TanStack Query.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useCurrentClub } from './useCurrentClub';

const TTL_MS = 60_000;

// Module-scope cache: key -> { data, ts, promise }
const cache = new Map();

// Exposed for tests only — not part of the public API.
export function __resetServiceCache() {
  cache.clear();
}

function buildKey(key, clubIdScoped, clubId) {
  return clubIdScoped ? `${key}:${clubId ?? 'null'}` : key;
}

async function runFetcher(fetcher) {
  try {
    return await fetcher();
  } catch (e) {
    // Single retry on thrown error.
    return await fetcher();
  }
}

export function useServiceCache(key, fetcher, options = {}) {
  const { clubIdScoped = false } = options;
  // Always call useCurrentClub to satisfy rules-of-hooks; only use it when scoped.
  const currentClubId = useCurrentClub();
  const clubId = clubIdScoped ? currentClubId : null;
  const cacheKey = buildKey(key, clubIdScoped, clubId);

  const entry = cache.get(cacheKey);
  const fresh = entry && entry.data !== undefined && Date.now() - entry.ts <= TTL_MS;

  const [data, setData] = useState(fresh ? entry.data : undefined);
  const [isLoading, setIsLoading] = useState(!fresh);
  const [error, setError] = useState(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const load = useCallback(async (force = false) => {
    const existing = cache.get(cacheKey);
    if (!force && existing && existing.data !== undefined && Date.now() - existing.ts <= TTL_MS) {
      setData(existing.data);
      setIsLoading(false);
      setError(null);
      return;
    }
    // In-flight dedupe — await the pending promise if one exists.
    if (!force && existing?.promise) {
      setIsLoading(true);
      try {
        const d = await existing.promise;
        setData(d);
        setError(null);
      } catch (e) {
        setError(e);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);
    setError(null);
    const promise = runFetcher(fetcherRef.current);
    cache.set(cacheKey, { data: existing?.data, ts: existing?.ts ?? 0, promise });
    try {
      const d = await promise;
      cache.set(cacheKey, { data: d, ts: Date.now(), promise: null });
      setData(d);
    } catch (e) {
      cache.set(cacheKey, { data: existing?.data, ts: existing?.ts ?? 0, promise: null });
      setError(e);
    } finally {
      setIsLoading(false);
    }
  }, [cacheKey]);

  useEffect(() => {
    load(false);
  }, [load]);

  const refetch = useCallback(() => load(true), [load]);

  return { data, isLoading, error, refetch };
}
