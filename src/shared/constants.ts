/** Cache considers data fresh for this duration; after that, SWR revalidates. */
export const CACHE_STALE_TIME_MS = 5_000

/** Performance metric thresholds (0–100). Inclusive lower bounds. */
export const PERFORMANCE_THRESHOLD_HIGH = 70
export const PERFORMANCE_THRESHOLD_MEDIUM = 40

export const ORG_TREE_QUERY_KEY = 'org-tree'

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

export const REALTIME_URL =
  import.meta.env.VITE_REALTIME_URL ??
  'http://localhost:4000/api/org-tree/stream'

/** Name / AI-search filter waits this long after the last keystroke before applying. */
export const NAME_FILTER_DEBOUNCE_MS = 250

/**
 * Delay before a sort click applies, so a double-click can cancel it and
 * reverse the current direction instead. Must sit inside the OS double-click window.
 */
export const SORT_CLICK_DELAY_MS = 300

/** Viewport width at which tree and table are shown side by side. */
export const SPLIT_VIEW_MIN_WIDTH_PX = 1280

/** Max height of a split-view pane (and of a single-pane scroll area). */
export const PANE_BODY_MAX_HEIGHT = 'min(70vh, 720px)'

/** Suffix shown with thousand-grouped budget figures (e.g. 4 569 028 руб.). */
export const BUDGET_CURRENCY_LABEL = 'руб.'

/** Table cells whose values changed from a live patch fade over this duration. */
export const CELL_FLASH_DURATION_MS = 1_500

/** Tree expand/collapse height transition. Skipped when reduced motion is set. */
export const TREE_EXPAND_DURATION_MS = 200

/** First reconnect wait after the live stream drops. */
export const REALTIME_BACKOFF_INITIAL_MS = 1_000

/** Cap for exponential reconnect backoff. */
export const REALTIME_BACKOFF_MAX_MS = 30_000

export const REALTIME_BACKOFF_FACTOR = 2
