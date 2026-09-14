/** Cache considers data fresh for this duration; after that, SWR revalidates. */
export const CACHE_STALE_TIME_MS = 5_000

/** Performance metric thresholds (0–100). Inclusive lower bounds. */
export const PERFORMANCE_THRESHOLD_HIGH = 70
export const PERFORMANCE_THRESHOLD_MEDIUM = 40

export const ORG_TREE_QUERY_KEY = 'org-tree'

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

/** Name filter waits this long after the last keystroke before applying. */
export const NAME_FILTER_DEBOUNCE_MS = 250

/** Viewport width at which tree and table are shown side by side. */
export const SPLIT_VIEW_MIN_WIDTH_PX = 1280

/** Max height of a split-view pane (and of a single-pane scroll area). */
export const PANE_BODY_MAX_HEIGHT = 'min(70vh, 720px)'

/** Prefix shown with thousand-grouped budget figures (e.g. $12,345,678). */
export const BUDGET_CURRENCY_LABEL = '$'
