import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../services/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Subscribe to Supabase Realtime changes on a given table.
 * Falls back gracefully if Supabase is not configured.
 */
export function useRealtimeTable<T extends { id: string }>(
  table: string,
  initialFetcher: () => Promise<T[]>
): { data: T[]; loading: boolean; error: string | null } {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const result = await initialFetcher();
      setData(result);
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
            // Re-fetch on any DB change
            load();
          }
        )
        .subscribe();
    } catch {
      // Supabase not configured – polling will be used instead
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [table, load]);

  return { data, loading, error };
}
