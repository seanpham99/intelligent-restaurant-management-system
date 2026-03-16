import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../services/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Subscribe to Supabase Realtime changes on a given table.
 * Re-fetches via `initialFetcher` on every Postgres change event.
 *
 * @param table            Postgres table name to watch.
 * @param initialFetcher   Async function that retrieves the current data set.
 * @param pollIntervalMs   Optional fallback polling interval (milliseconds).
 *                         Should be a stable value (e.g. a constant) to avoid
 *                         subscription teardown/recreate on every render.
 */
export function useRealtimeTable<T extends { id: string }>(
  table: string,
  initialFetcher: () => Promise<T[]>,
  pollIntervalMs?: number
): { data: T[]; loading: boolean; error: string | null; refresh: () => void } {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Stabilise pollIntervalMs so it never triggers a subscription recreate
  const pollIntervalRef = useRef(pollIntervalMs);

  const load = useCallback(async () => {
    try {
      const result = await initialFetcher();
      setData(result);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error loading data');
    } finally {
      setLoading(false);
    }
  }, [initialFetcher]);

  useEffect(() => {
    load();

    let channel: RealtimeChannel | null = null;

    try {
      channel = supabase
        .channel(`realtime:${table}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table },
          () => {
            // Re-fetch on any DB change for instant UI updates
            load();
          }
        )
        .subscribe();
    } catch {
      // Supabase not configured – polling fallback will be used instead
    }

    // Optional polling fallback (e.g. when Supabase Realtime is unavailable)
    if (pollIntervalRef.current) {
      pollRef.current = setInterval(load, pollIntervalRef.current);
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  // table and load are the only reactive deps; pollIntervalMs is read via ref
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, load]);

  return { data, loading, error, refresh: load };
}
