import { useEffect, useState, useSyncExternalStore } from 'react'
import { CACHE_STALE_TIME_MS } from '@/shared/constants'
import { queryCacheStore } from '@/cache/queryCacheStore'

type UseQueryCacheOptions<T> = {
  queryKey: string
  queryFn: (signal: AbortSignal) => Promise<T>
  staleTime?: number
  enabled?: boolean
}

export type UseQueryCacheResult<T> = {
  data: T | undefined
  error: Error | null
  isLoading: boolean
  isValidating: boolean
  isStale: boolean
  /** Bumped on fetch and in-place patch so views can rebuild derived copies. */
  revision: number
}

/**
 * Stale-while-revalidate query hook backed by a module-level cache.
 * In-flight requests are aborted via AbortSignal when the last subscriber
 * for a key unmounts (or disables the query).
 */
export function useQueryCache<T>(
  options: UseQueryCacheOptions<T>,
): UseQueryCacheResult<T> {
  const {
    queryKey,
    queryFn,
    staleTime = CACHE_STALE_TIME_MS,
    enabled = true,
  } = options

  const entry = useSyncExternalStore(
    (onStoreChange) => queryCacheStore.subscribe(queryKey, onStoreChange),
    () => queryCacheStore.getEntry<T>(queryKey),
    () => queryCacheStore.getEntry<T>(queryKey),
  )

  // Forces a re-render when the stale window elapses so SWR can revalidate.
  const [staleEpoch, setStaleEpoch] = useState(0)

  const isStale =
    entry?.data === undefined ||
    !queryCacheStore.isFresh(entry.updatedAt, staleTime)

  useEffect(() => {
    if (!enabled || !entry?.updatedAt || isStale) {
      return
    }

    const remaining = staleTime - (Date.now() - entry.updatedAt)
    if (remaining <= 0) {
      return
    }

    const timer = window.setTimeout(() => {
      setStaleEpoch((value) => value + 1)
    }, remaining)

    return () => {
      window.clearTimeout(timer)
    }
  }, [enabled, entry?.updatedAt, staleTime, isStale, queryKey])

  useEffect(() => {
    if (!enabled) {
      return
    }

    const current = queryCacheStore.getEntry<T>(queryKey)
    const needsFetch =
      current?.data === undefined ||
      !queryCacheStore.isFresh(current.updatedAt, staleTime) ||
      current.error !== null

    if (!needsFetch) {
      return
    }

    void queryCacheStore.acquireQuery(queryKey, queryFn).catch(() => {
      // Error is stored on the cache entry; hook consumers read `error`.
    })

    return () => {
      queryCacheStore.releaseQuery(queryKey)
    }
    // Revalidate when staleEpoch ticks; do not depend on `isStale` itself —
    // flipping stale→fresh after a success would only re-run cleanup.
  }, [enabled, queryKey, queryFn, staleTime, staleEpoch, entry?.error])

  const isValidating = Boolean(entry?.promise)
  // No successful payload yet and no error → still loading (covers the gap
  // before a promise is attached and after Strict Mode aborts a first fetch).
  const isLoading =
    enabled && entry?.data === undefined && (entry?.error ?? null) === null

  return {
    data: entry?.data,
    error: entry?.error ?? null,
    isLoading,
    isValidating,
    isStale,
    revision: entry?.revision ?? 0,
  }
}
