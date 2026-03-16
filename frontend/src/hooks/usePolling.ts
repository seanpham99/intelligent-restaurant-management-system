import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Generic polling hook – used as a fallback / supplement to Supabase Realtime.
 * Polls `fetcher` every `intervalMs` milliseconds.
 */
export function usePolling<T>(
  fetcher: () => Promise<T>,
  intervalMs = 3000
): { data: T | null; loading: boolean; error: string | null; refresh: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const result = await fetcher();
      setData(result);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    load();
    intervalRef.current = setInterval(load, intervalMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [load, intervalMs]);

  return { data, loading, error, refresh: load };
}
