# Architecture

Status: describes **Stage 02** as implemented. Later-stage sections are
placeholders — fill them in when that stage lands; do not invent transports
or modules that are not in the repo yet.

## Layers

```
mock-server/          in-memory Node HTTP API (no database)
        │  GET /api/org-tree  →  OrgNode[]
        ▼
src/api/              fetch + zod validation
        ▼
src/cache/            module-level stale-while-revalidate store
        ▼
src/App.tsx           loading / error / empty branches
        ▼
src/OrgDashboard.tsx  shared selectedId; memoized rollups + table rows
        ├─ src/tree/          derived forest view
        ├─ src/table/         derived analytical table (sort / name filter)
        ├─ src/aggregation/   pure rollups (Map<id, NodeRollup>)
        └─ src/shared/        theme, constants, debounce hook, UI primitives
```

Planned directories (do **not** create until their stage): `src/realtime`
(03), `src/ai-search` (04).

The mock server is a standalone Node process (`tsx mock-server/index.ts`),
kept out of `src/` so the client never imports server code.

## Data flow (Stage 02)

1. `App` calls `useOrgTree`, which is a thin wrapper around `useQueryCache`
   with query key `org-tree` (`ORG_TREE_QUERY_KEY`) and `fetchOrgTree`.
2. `fetchOrgTree` `GET`s `${VITE_API_URL}/api/org-tree`, throws `ApiHttpError`
   on non-OK status, then `OrgTreeSchema.safeParse`. Invalid JSON is
   `ApiValidationError` — treated as a failed request, not as empty data.
3. `queryCacheStore` holds one entry per key: `{ data, error, updatedAt,
   promise, controller, subscriberCount }`. Fresh hits (younger than
   `CACHE_STALE_TIME_MS` = 5s) skip the network. After the stale window,
   subscribers keep showing the last `data` while a background revalidate
   runs (`isValidating`).
4. In-flight work is deduped per key. The shared `AbortController` aborts
   only when the last subscriber releases (unmount / `enabled: false`).
5. `App` maps cache state to UI: `isLoading` → loading panel; `error` →
   error panel; `data.length === 0` → empty panel; otherwise
   `<OrgDashboard nodes={data} />`.
6. `OrgDashboard` memoizes `aggregateOrgTree(nodes)` and `buildTableRows`
   (depends on `nodes` only). It owns one `selectedId` passed into both views.
7. `OrgTreeView` memoizes `buildTree(nodes)` and keeps **expansion** as local
   React state keyed by node id. Selection is controlled by the dashboard.
8. `OrgTable` derives visible rows from the memoized row list plus local sort
   / debounced name-filter state. It does not refetch and does not re-run
   aggregation.

```
GET /api/org-tree
        → fetchOrgTree (zod)
        → queryCacheStore (OrgNode[])
        → useOrgTree / useQueryCache
        → App (status) + OrgDashboard
                → aggregateOrgTree → Map<id, NodeRollup>   (useMemo)
                → buildTableRows   → OrgTableRow[]         (useMemo)
                → OrgTreeView (buildTree) + OrgTable (sort/filter)
                → selectedId (one piece of UI state, both views)
```

## Layout (Stage 02)

Viewport ≥ `SPLIT_VIEW_MIN_WIDTH_PX` (1280): tree and table side by side.
Narrower: Tree / Table toggle. ADR 004.

## Single source of truth

The only stored dataset is the validated flat `OrgNode[]` in the query cache.
The tree and the table both read that array. Aggregates are a memoized `Map`
derived from it, never written back onto `OrgNode` and never a parallel cache
entry.

Do not transform to a nested tree inside `fetchOrgTree` or the cache.
Do not keep a parallel nested structure that must be kept in sync.
Do not keep a second `selectedId` inside the tree after Stage 02 — the
dashboard lifts it so a table row click can highlight the tree node.

## Client / server split

| | Client (`src/`) | Mock server (`mock-server/`) |
|---|---|---|
| Runtime | Vite + React, port 5173 | Node `http`, port `PORT` (default 4000) |
| Data | Cache of last validated tree | Seeded in-memory array, regenerated on process start |
| Config | `VITE_API_URL` | `PORT`, `MOCK_FORCE` |

CORS is open (`Access-Control-Allow-Origin: *`) because the dev client and
API are on different origins. Stage 04 may replace that with same-origin
nginx proxying.

## What is not here yet

- **Stage 03** — live transport, in-place cache patch, ancestor-only
  aggregate invalidation (`rollupFromSelfAndChildren` is the hook; see
  ADR 005), connection indicator. Contract: `docs/data-model.md`
  (section still a stub).
- **Stage 04** — Docker / nginx / gzip budget; AI search module.
