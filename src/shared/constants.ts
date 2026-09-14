/** Cache considers data fresh for this duration; after that, SWR revalidates. */
export const CACHE_STALE_TIME_MS = 5_000

/** Performance metric thresholds (0–100). Inclusive lower bounds. */
export const PERFORMANCE_THRESHOLD_HIGH = 70
export const PERFORMANCE_THRESHOLD_MEDIUM = 40

export const ORG_TREE_QUERY_KEY = 'org-tree'

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? 'http://localhost:4000'
