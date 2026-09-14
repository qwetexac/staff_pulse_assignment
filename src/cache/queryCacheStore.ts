type CacheEntry<T> = {
  data: T | undefined
  updatedAt: number
  error: Error | null
  promise: Promise<T> | null
  controller: AbortController | null
  subscriberCount: number
  /**
   * Bumped on every `setEntry` so `useSyncExternalStore` sees a new snapshot
   * even when `data` is the same array mutated in place.
   */
  revision: number
}

type Listener = () => void

type CacheEntryWrite<T> = Omit<CacheEntry<T>, 'revision'>

const cache = new Map<string, CacheEntry<unknown>>()
const listeners = new Map<string, Set<Listener>>()

function getEntry<T>(key: string): CacheEntry<T> | undefined {
  return cache.get(key) as CacheEntry<T> | undefined
}

function setEntry<T>(key: string, entry: CacheEntryWrite<T>): void {
  const previous = getEntry<T>(key)
  const next: CacheEntry<T> = {
    ...entry,
    revision: (previous?.revision ?? 0) + 1,
  }
  cache.set(key, next as CacheEntry<unknown>)
  notify(key)
}

function notify(key: string): void {
  const keyListeners = listeners.get(key)
  if (!keyListeners) {
    return
  }
  for (const listener of keyListeners) {
    listener()
  }
}

function subscribe(key: string, listener: Listener): () => void {
  let keyListeners = listeners.get(key)
  if (!keyListeners) {
    keyListeners = new Set()
    listeners.set(key, keyListeners)
  }
  keyListeners.add(listener)
  return () => {
    keyListeners.delete(listener)
    if (keyListeners.size === 0) {
      listeners.delete(key)
    }
  }
}

function isFresh(updatedAt: number, staleTime: number): boolean {
  return updatedAt > 0 && Date.now() - updatedAt < staleTime
}

function ensureEntry<T>(key: string): CacheEntry<T> {
  const existing = getEntry<T>(key)
  if (existing) {
    return existing
  }
  const created: CacheEntry<T> = {
    data: undefined,
    updatedAt: 0,
    error: null,
    promise: null,
    controller: null,
    subscriberCount: 0,
    revision: 0,
  }
  // Insert without notifying — subscribers must not see a settled empty
  // entry before the in-flight promise is attached.
  cache.set(key, created as CacheEntry<unknown>)
  return created
}

function startFetch<T>(
  key: string,
  queryFn: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  const entry = ensureEntry<T>(key)

  if (entry.promise) {
    return entry.promise
  }

  const controller = new AbortController()
  const promise = queryFn(controller.signal)
    .then((data) => {
      const current = getEntry<T>(key)
      setEntry<T>(key, {
        data,
        updatedAt: Date.now(),
        error: null,
        promise: null,
        controller: null,
        subscriberCount: current?.subscriberCount ?? 0,
      })
      return data
    })
    .catch((error: unknown) => {
      const normalized =
        error instanceof Error ? error : new Error(String(error))
      const current = getEntry<T>(key)

      // Only clear the in-flight slot if this controller still owns it —
      // a newer acquire must not be wiped by a stale abort.
      if (controller.signal.aborted) {
        if (current?.controller === controller) {
          setEntry<T>(key, {
            data: current.data,
            updatedAt: current.updatedAt,
            error: current.error,
            promise: null,
            controller: null,
            subscriberCount: current.subscriberCount,
          })
        }
        throw normalized
      }

      setEntry<T>(key, {
        data: current?.data,
        updatedAt: current?.updatedAt ?? 0,
        error: normalized,
        promise: null,
        controller: null,
        subscriberCount: current?.subscriberCount ?? 0,
      })
      throw normalized
    })

  setEntry<T>(key, {
    data: entry.data,
    updatedAt: entry.updatedAt,
    error: entry.error,
    subscriberCount: entry.subscriberCount,
    promise,
    controller,
  })

  return promise
}

/**
 * Starts (or joins) a fetch for `key`. Each caller should pair this with
 * `releaseQuery` so the shared AbortController only fires when the last
 * subscriber unmounts / disables.
 */
function acquireQuery<T>(
  key: string,
  queryFn: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  const entry = ensureEntry<T>(key)
  entry.subscriberCount += 1
  return startFetch(key, queryFn)
}

/**
 * Re-runs the query without bumping subscriberCount. Used after an SSE
 * reconnect to catch updates missed while the stream was down.
 */
function revalidate<T>(
  key: string,
  queryFn: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  return startFetch(key, queryFn)
}

/**
 * Mutates the cached value in place and notifies subscribers. `mutate`
 * must return `null` to skip the notify (e.g. unknown id / stale patch).
 * Replaces the cache entry object so `useSyncExternalStore` re-renders
 * even when the array reference is unchanged.
 */
function patchData<T, R>(key: string, mutate: (data: T) => R | null): R | null {
  const entry = getEntry<T>(key)
  if (entry?.data === undefined) {
    return null
  }

  const applied = mutate(entry.data)
  if (applied === null) {
    return null
  }

  setEntry<T>(key, {
    data: entry.data,
    updatedAt: Date.now(),
    error: null,
    promise: entry.promise,
    controller: entry.controller,
    subscriberCount: entry.subscriberCount,
  })
  return applied
}

function releaseQuery(key: string): void {
  const entry = getEntry<unknown>(key)
  if (!entry) {
    return
  }

  entry.subscriberCount = Math.max(0, entry.subscriberCount - 1)

  if (entry.subscriberCount !== 0 || !entry.controller) {
    return
  }

  const controller = entry.controller

  // Defer abort so React Strict Mode remount can re-acquire and join the
  // same in-flight request instead of cancelling and starting another.
  queueMicrotask(() => {
    const current = getEntry<unknown>(key)
    if (
      !current ||
      current.subscriberCount > 0 ||
      current.controller !== controller
    ) {
      return
    }

    controller.abort()
    setEntry(key, {
      data: current.data,
      updatedAt: current.updatedAt,
      error: current.error,
      subscriberCount: current.subscriberCount,
      promise: null,
      controller: null,
    })
  })
}

/** Test helper — clears the in-memory cache between scenarios. */
export function clearQueryCache(): void {
  cache.clear()
}

export const queryCacheStore = {
  getEntry,
  setEntry,
  subscribe,
  isFresh,
  acquireQuery,
  releaseQuery,
  revalidate,
  patchData,
}
