# Architecture

Status: describes **Stage 01** as implemented. Later-stage sections are
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
src/tree/             derived forest view over the same flat array
src/shared/           theme, constants, UI primitives
```

Planned directories (do **not** create until their stage): `src/table` and
`src/aggregation` (02), `src/realtime` (03), `src/ai-search` (04).

The mock server is a standalone Node process (`tsx mock-server/index.ts`),
kept out of `src/` so the client never imports server code.

## Data flow (Stage 01)

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
   `<OrgTreeView nodes={data} />`.
6. `OrgTreeView` memoizes `buildTree(nodes)` and keeps expansion / selection
   as local React state keyed by node id. The nested `TreeNode` objects are
   a view — they are not written back into the cache (ADR 002, ADR 003).

```
GET /api/org-tree
        → fetchOrgTree (zod)
        → queryCacheStore (OrgNode[])
        → useOrgTree / useQueryCache
        → App (status) + OrgTreeView
                → buildTree → TreeNodeItem
```

## Single source of truth

The only stored dataset is the validated flat `OrgNode[]` in the query cache.
The tree (Stage 01) and the table (Stage 02) must both read that array.
Aggregates are derived and memoized, never a second copy of the tree.

Do not transform to a nested tree inside `fetchOrgTree` or the cache.
Do not keep a parallel nested structure that must be kept in sync.

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

- **Stage 02** — analytical table over the same cache entry; pure aggregation
  in `src/aggregation`; selection sync by node id (tree already has
  `selectedId`).
- **Stage 03** — live transport, in-place cache patch, ancestor-only
  aggregate invalidation, connection indicator. Contract: `docs/data-model.md`
  (section still a stub).
- **Stage 04** — Docker / nginx / gzip budget; AI search module.
