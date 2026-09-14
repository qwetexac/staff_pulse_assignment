# Architecture

Status: describes **Stage 04** as implemented.

## Layers

```
mock-server/          in-memory Node HTTP API (no database)
        │  GET /api/org-tree           → OrgNode[]
        │  GET /api/org-tree/stream    → SSE OrgNodePatch events
        ▼
nginx (Docker)        gzip static client; proxies /api to mock-server
        ▼
src/api/              fetch + zod validation (full tree)
src/realtime/         EventSource client, backoff, in-place cache patch
        ▼
src/cache/            module-level stale-while-revalidate store
                      (+ patchData / revalidate; revision bump on writes)
        ▼
src/App.tsx           loading / error / empty; connection status in header
        ▼
src/OrgDashboard.tsx  shared selectedId; incremental rollups + table rows
        ├─ src/tree/          derived forest view (height collapse)
        ├─ src/table/         derived analytical table (sort / filter / keys)
        ├─ src/aggregation/   pure rollups + ancestor-only recompute
        ├─ src/ai-search/     NL → NumericPredicate[] or name fallback
        └─ src/shared/        theme, constants, debounce hook, UI primitives
```

The mock server is a standalone Node process (`tsx mock-server/index.ts` in
dev; `node --experimental-strip-types` in the Docker image), kept out of
`src/` so the client never imports server code.

## Data flow (Stage 04)

1. `App` calls `useOrgTree` (initial `GET /api/org-tree`) and
   `useOrgTreeStream` (`EventSource` on `VITE_REALTIME_URL`).
2. `fetchOrgTree` validates with `OrgTreeSchema`. The cache holds the flat
   `OrgNode[]` plus a `revision` counter.
3. While the stream is **connected**, `staleTime` is `Infinity` so SWR does
   not replace the array out from under live patches. On a later SSE
   reconnect, `queryCacheStore.revalidate` runs one GET to catch missed
   updates.
4. Each SSE message is `OrgNodePatchSchema`. `applyOrgNodePatch` mutates the
   matching object in the cached array (metrics + `updatedAt` only). The
   cache replaces the **entry** (not the array) so `useSyncExternalStore`
   re-renders.
5. `useOrgTableRows` full-aggregates when `nodes` is a new array; on a patch
   it runs `recomputeAncestorRollups` (ADR 007) and records per-cell fade
   tokens. `OrgTreeView` rebuilds `buildTree` when `dataRevision` changes
   because `buildTree` copies node fields.
6. Table keyboard: arrow keys / Home / End move focus; Enter calls the same
   `onSelect` as a row click. Tree expand/collapse uses a CSS height
   transition skipped under `prefers-reduced-motion: reduce`.
7. `OrgTable` parses the search box with `parseNaturalLanguageQuery` (ADR 008)
   and `useMemo`s `applyOrgTableSearch(rows, parsed)` so live row patches
   re-evaluate the same predicates. Unrecognized input falls back to name
   substring search with a visible status note.

```
GET /api/org-tree
        → fetchOrgTree (zod)
        → queryCacheStore (OrgNode[])
        → useOrgTree / useQueryCache
        → App + OrgDashboard
                → aggregateOrgTree | recomputeAncestorRollups
                → OrgTreeView + OrgTable
                        → parseNaturalLanguageQuery
                        → applyOrgTableSearch(rows, parsed)
                → selectedId

GET /api/org-tree/stream  (SSE)
        → useOrgTreeStream (EventSource + backoff)
        → applyOrgNodePatch (in-place on cached array)
        → lastPatch → ancestor rollups + cell flashes
        → ConnectionStatus (header)
        → new table `rows` → search predicates re-run
```

## Layout (Stage 02, unchanged)

Viewport ≥ `SPLIT_VIEW_MIN_WIDTH_PX` (1280): tree and table side by side.
Narrower: Tree / Table toggle. ADR 004.

## Single source of truth

The only stored dataset is the validated flat `OrgNode[]` in the query cache.
Live updates **mutate that array in place**. The tree and the table both read
it. Aggregates stay a derived `Map`, never written back onto `OrgNode`.
Search results are derived from the current table rows + the active parse;
they are not a stored list of ids.

## Client / server split

| | Client (`src/`) | Mock server (`mock-server/`) |
|---|---|---|
| Runtime | Vite + React (dev :5173); nginx :80 in Docker | Node `http`, port `PORT` (default 4000) |
| Data | Cache of last validated tree, patched live | Seeded in-memory array; random metric jitter ~2.5s |
| Config | `VITE_API_URL`, `VITE_REALTIME_URL` | `PORT`, `HOST`, `MOCK_FORCE` |

Local dev still uses CORS (`Access-Control-Allow-Origin: *`) because Vite
and the mock API are different origins. Docker serves the client and `/api`
from one nginx origin (gzip for static files; SSE location unbuffered).

## Production (Docker)

`docker-compose up --build` starts `mock-server` and `client` (nginx). The
production Vite build is baked with empty `VITE_API_URL` and
`VITE_REALTIME_URL=/api/org-tree/stream` so the browser stays same-origin.
Nginx gzip-compresses JS/CSS and proxies `/api` (including the SSE stream)
to the mock-server container.
