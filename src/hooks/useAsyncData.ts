import { useCallback, useEffect, useState } from 'react';

import { useDataStore } from '@/store/data';

/**
 * Loads data with an async function and tracks loading / error state.
 *
 * - Re-runs when any value in `deps` changes.
 * - Also re-runs automatically whenever app data changes (add/edit/delete/sync).
 * - Only the first load shows the loading state; later refreshes keep the
 *   old data on screen to avoid flicker.
 *
 * Example:
 *   const { data, isLoading, error, reload } = useAsyncData(() => getRecentExpenses(5), []);
 */
export function useAsyncData<T>(loader: () => Promise<T>, deps: unknown[]) {
  const version = useDataStore((s) => s.version);
  const [reloadCount, setReloadCount] = useState(0);
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If deps change before the request finishes, ignore the outdated result.
    let cancelled = false;
    loader()
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setError(null);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Something went wrong');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // `loader` is recreated every render, so we list its inputs (`deps`) instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, reloadCount, ...deps]);

  const reload = useCallback(() => setReloadCount((n) => n + 1), []);

  return { data, isLoading, error, reload };
}
