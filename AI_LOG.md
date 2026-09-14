# AI development log

## Stage 01 — Foundation

### Generated as-is (lightly edited)

- Vite/React/TS project wiring: absolute imports via `resolve.tsconfigPaths`,
  scripts (`dev`, `dev:server`, `dev:all`), `.env` from `env.example`
- Mock server: seeded mulberry32 PRNG + `generateOrgTree` (60 nodes, 3 levels),
  `GET /api/org-tree`, CORS, `MOCK_FORCE=empty|error` for state checks
- Client API layer: zod `OrgNode` / `OrgTree` schemas, `ApiValidationError` /
  `ApiHttpError`, `fetchOrgTree`
- Custom SWR cache (`src/cache`): module-level store + `useQueryCache` with 5s
  stale time, request dedupe, AbortSignal release when the last subscriber
  unmounts
- Tree view: pure `buildTree` over the flat array, expand/collapse UI,
  performance color thresholds as named constants, styled-components theme /
  global styles / status panels
- App shell with loading / error / empty branches
- ADRs 001–003

### Rewritten by hand (and why)

- **Cache abort / subscriber ref-counting** — first pass aborted the shared
  fetch on any unmount; rewritten so only the last subscriber releases the
  `AbortController`, avoiding cancelled requests for remaining consumers.
- **`useQueryCache` hook shape** — dropped render-time ref writes (eslint
  `react-hooks/refs`) and setState-in-effect patterns; settled on
  `useSyncExternalStore` + effects keyed by stale epoch.
- **Default expansion** — initially expanded roots only (second level
  visible); corrected to expand roots **and** their children so the second
  level is actually expanded (teams visible), per review of requirements.
- **Loading / empty flash on reload** — `ensureEntry` notified with
  `data: undefined` before the promise was attached, and App treated
  `!data` as empty; fixed `isLoading` + empty-only-when-`data.length === 0`.
- **Triple fetch on first load** — Strict Mode mount/abort/remount plus an
  abort race wiping the in-flight promise; deferred abort via
  `queueMicrotask` so remount joins the same request, and abort only clears
  the entry when it still owns the controller.
- **Vite path resolution** — removed `vite-tsconfig-paths` after Vite 8
  warned it is redundant; use native `resolve.tsconfigPaths: true`.
- **OrgTreeView expand re-seed** — avoided setState-in-effect by adjusting
  expanded ids during render when the root-id signature changes.

### Flag for manual review

- Cache abort semantics under React Strict Mode (mount → release/abort → remount
  refetch) — correct but chatty in dev
- `useSyncExternalStore` snapshot identity if the store later mutates entries
  in place without replacing the object
- Performance thresholds (high ≥ 70, medium ≥ 40) — product choice, not specified
- Mock delay 400ms — fine for loading UI, may want it configurable later

### Autonomous decisions

1. **Source of truth stays flat.** API cache stores `OrgNode[]`; `buildTree` is a
   pure view helper in `src/tree` (ADR 002).
2. **Expanded state** = `Set<string>` of expanded node ids; defaults expand
   roots + children; re-seed on root-id signature change (ADR 003).
3. **Shared-cache cancellation** uses subscriber ref-counting (ADR 001).
4. **Mock data is generated**, not hardcoded; fixed seed `424242` for
   determinism across restarts.
5. **No Express** — Node `http` only for the mock server (YAGNI).

## Stage 02 — Core

### Generated as-is (lightly edited)

- `src/aggregation`: `aggregateOrgTree` + `rollupFromSelfAndChildren`, Vitest
  cases (empty tree, leaf, one descendant, zero headcount)
- `src/table`: analytical table, column sort (click / double-click reverse),
  name filter, budget `$12,345,678` formatting, row → `selectedId`
- `src/OrgDashboard`: memoized rollups/rows, shared selection, split-view at
  1280px with a Tree/Table toggle below that
- `useDebouncedValue` (250ms) and named layout/filter constants
- ADRs 004 (layout) and 005 (aggregation memoization)
- Vitest runner (`npm run test`) wired through `vite.config.ts`

### Rewritten by hand (and why)

- **Selection is lifted, not copied.** First sketch kept `selectedId` inside
  `OrgTreeView` and added a second copy for the table; that violates the
  single-source rule for UI selection. Dashboard owns one `selectedId`.
- **Sort click vs double-click.** A naive “click toggles direction” fights
  the `dblclick` sequence (click, click, dblclick). Click on a new column
  sets ascending and is a no-op if that column is already active; double-click
  reverses.
- **Aggregation helper split.** Full-forest `useMemo` is enough for Stage 02,
  but a single DFS function would make Stage 03 ancestor-only updates awkward.
  `rollupFromSelfAndChildren` + `weightedPerformanceSum` are the seam; they
  are not a live-update implementation.

### Flag for Stage 03

- `useMemo(..., [nodes])` recomputes the **entire** Map when the array
  identity changes, and **nothing** if the same array is mutated in place.
  Live patches should update the rollup `Map` via `parentId` +
  `rollupFromSelfAndChildren` (ADR 005), not reuse this memo.
- Below 1280px, a table row click stores selection but the tree is hidden
  until the user toggles — expected for the chosen layout (ADR 004).

### Autonomous decisions

1. **Hybrid layout**: split-view ≥1280px, toggle on narrower screens (ADR 004),
   so row→tree highlight is visible on desktop without crowding small viewports.
2. **Both panes stay mounted**; CSS hides the inactive one so filter/sort
   survive toggling.
3. **Table-only name filter** (spec sits under the table). Tree is not
   filtered.
4. **Expand ancestors** when `selectedId` changes so a table click can reveal
   a collapsed node.
5. **Vitest** as the test runner (same Vite config, node environment, no jsdom
   for a pure function).

## Stage 03 — Polish

### Generated as-is (lightly edited)

- Mock SSE endpoint `GET /api/org-tree/stream` plus random in-memory metric
  jitter (~2.5s) on the same array as `GET /api/org-tree`
- `src/realtime`: EventSource client, exponential backoff (1s…30s), zod
  patch schema, in-place `applyOrgNodePatch`, header `ConnectionStatus`
- Cache `patchData` / `revalidate` and a `revision` bump so
  `useSyncExternalStore` re-renders when the array reference is unchanged
- `recomputeAncestorRollups` + tests (chain-only writes, identity of
  unrelated rollups, match full re-aggregate)
- Table cell fade (~1.5s) keyed by `(nodeId, metric)` from the rollup diff;
  keyboard grid (arrows, Home/End, Enter → `selectedId`)
- Tree collapse via `grid-template-rows` 0fr/1fr; `transition: none` under
  `prefers-reduced-motion: reduce`
- ADRs 006 (SSE) and 007 (ancestor-only recompute); data-model patch contract

### Rewritten by hand (and why)

- **Did not reuse Stage 02 `useMemo(..., [nodes])` for patches.** As flagged
  in this log, that memo either skips in-place mutations or recomputes the
  whole forest. `useOrgTableRows` full-aggregates only when the array is
  replaced (GET / reconnect).
- **Close EventSource on error** instead of using the browser’s built-in
  retry, so backoff and the disconnected/reconnecting labels are ours.
- **Pause SWR while connected** (`staleTime: Infinity`) so a 5s revalidate
  cannot overwrite a live patch with a slightly older GET.
- **Cell fade without `Date.now()` / refs during render** (react-hooks
  purity). Flash tokens live in the rollup state; a CSS animation class is
  remounted only when the token changes, not on sort/filter.
- **Keyboard focus via `data-focus-cell` + querySelector** rather than
  callback refs through cell wrappers (eslint `react-hooks/refs`).

### Flag for Stage 04 / review

- Reconnect GET vs a patch that lands during the 400ms mock delay can briefly
  lose that one event; the next SSE message heals it.
- Below 1280px, Enter still sets `selectedId` while the tree pane is hidden
  (same layout trade-off as Stage 02).
- `buildTree` still copies node fields, so the tree depends on `dataRevision`
  to pick up in-place metric edits.

### Autonomous decisions

1. **SSE, not WebSocket or polling** (ADR 006): one-way updates, one HTTP
   connection, custom backoff after we close the EventSource.
2. **In-place object mutation** of the cached node; cache entry identity
   changes so React notices.
3. **Ancestor walk only** for rollups (ADR 007); children maps are structural
   O(n), the formula runs at depth.
4. **Connection states**: reconnecting on first mount / retry attempt,
   disconnected after error while backing off, connected on `EventSource`
   open.

