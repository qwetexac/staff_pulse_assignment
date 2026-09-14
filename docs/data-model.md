# Data model

Status: node shape, tree construction, aggregation, and the live-update
patch contract are **implemented** (Stage 03).

## `OrgNode` (API and cache)

`GET /api/org-tree` returns a JSON array. The client validates it with
`OrgNodeSchema` / `OrgTreeSchema` in `src/api/types.ts`.

| Field | Type | Constraints |
|---|---|---|
| `id` | `string` | Non-empty. Unique in the array. |
| `name` | `string` | Non-empty. |
| `parentId` | `string \| null` | `null` = root (division). Otherwise must match another node's `id`. |
| `headcount` | `number` | `≥ 0` |
| `budget` | `number` | `≥ 0` |
| `performance` | `number` | `0–100` inclusive |
| `updatedAt` | `string` | ISO-8601 datetime (`z.string().datetime()`) |

The cache stores this array as-is. There is no nested tree in storage.

### Hierarchy

Three levels, encoded only via `parentId` (no `level` field on the wire):

| Depth | Role | Typical `id` prefix (mock) |
|---|---|---|
| 0 | Division | `div-…` (`parentId === null`) |
| 1 | Department | `dept-…` |
| 2 | Team | `team-…` |

Mock generator (`mock-server/generateOrgTree.ts`): five named divisions,
3–4 departments each, 2–3 teams each, **≥ 40 nodes**. Seed `ORG_TREE_SEED`
(`424242`) so restarts are deterministic.

Orphans (`parentId` set but missing from the array) are treated as extra
roots by `buildTree` so they stay visible.

### Performance colour (UI, not API)

Inclusive lower bounds in `src/shared/constants.ts`:

| Level | Range |
|---|---|
| high | `performance ≥ 70` |
| medium | `performance ≥ 40` and `< 70` |
| low | `performance < 40` |

## Derived tree

`buildTree(nodes): TreeNode[]` in `src/tree/buildTree.ts` is pure: it does
not mutate the input. `TreeNode` is `OrgNode` plus `children: TreeNode[]`.
Sibling order follows the input array.

Default expansion (ADR 003): expand every root **and** every direct child
so the second level is expanded (teams visible). Re-seed only when the
root-id signature changes, not on every SWR array identity change.

## Aggregation (Stage 02 — implemented)

Code: `src/aggregation/aggregateOrgTree.ts`. Tests:
`src/aggregation/aggregateOrgTree.test.ts` (`npm run test`).

Totals for a node include **the node itself and all descendants**. Average
performance is **weighted by headcount**.

For node `n` and the set `S` = `{ n } ∪ descendants(n)`:

```
totalHeadcount(n)     = Σ s.headcount                         for s in S
totalBudget(n)        = Σ s.budget                            for s in S
averagePerformance(n) = (Σ s.headcount * s.performance) / totalHeadcount(n)
```

If `totalHeadcount(n) === 0`, `averagePerformance(n)` is `0` (avoid divide
by zero; a zero-headcount node contributes nothing to a parent's weighted
average).

Aggregation is computed once after data loads (`aggregateOrgTree`) and then
updated incrementally on live patches (`recomputeAncestorRollups` — ADR 007).
Do not store rollups on `OrgNode`. `NodeRollup.weightedPerformanceSum` lets
a parent recombine itself with children without re-walking the subtree.

### Worked examples (unit-test cases)

**Leaf, no children**

```
{ id: "t", parentId: "d", headcount: 10, budget: 1000, performance: 80 }
```

→ totalHeadcount 10, totalBudget 1000, averagePerformance 80.

**Node with one descendant**

```
{ id: "d", parentId: null, headcount: 4,  budget: 400,  performance: 50 }
{ id: "t", parentId: "d",  headcount: 6,  budget: 600,  performance: 100 }
```

→ for `d`: totalHeadcount 10, totalBudget 1000,
averagePerformance `(4*50 + 6*100) / 10 = 80`.
→ for `t`: same as the leaf case (6, 600, 100).

**Empty tree**

`[]` → no rows; the aggregator returns an empty structure (no throw).

## Live-update patch contract (Stage 03 — implemented)

Transport: **SSE** (ADR 006).

| | |
|---|---|
| URL | `VITE_REALTIME_URL` (default `http://localhost:4000/api/org-tree/stream`) |
| Method | `GET` |
| Response | `Content-Type: text/event-stream` |
| Heartbeat | SSE comment `: ping` every 15s (not a client event) |
| Client reconnect | Close `EventSource` on error; wait 1s, 2s, 4s, … cap 30s |

The server mutates the **same in-memory `OrgNode[]`** used by
`GET /api/org-tree`, then broadcasts one default `message` event:

```
data: {"id":"team-042","headcount":18,"budget":240000,"performance":73,"updatedAt":"2026-09-14T18:22:01.004Z"}

```

Payload (zod `OrgNodePatchSchema` in `src/realtime/types.ts`):

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | Existing node. Unknown ids are ignored. |
| `headcount` | `number` | `≥ 0`. Replaces the node’s own headcount. |
| `budget` | `number` | `≥ 0`. Replaces the node’s own budget. |
| `performance` | `number` | `0–100`. Replaces the node’s own performance. |
| `updatedAt` | ISO-8601 | Must be **newer** than the cached node’s `updatedAt` or the client skips. |

`name` and `parentId` are **not** in the patch. Hierarchy does not change.

### Client apply

1. Find the node in the cached `OrgNode[]` and mutate its metric fields
   (same object, same array).
2. Notify cache subscribers (`revision++`, `updatedAt` now) — **no refetch**.
3. Recompute rollups for that id and each ancestor via `parentId`
   (`recomputeAncestorRollups`). Other Map entries keep the same objects.
4. Fade table cells whose **rollup** values changed (patched node +
   ancestors). Tree headcount fades only on the patched node (own metrics).

Stale or no-op metric payloads do not notify the UI. After the stream
reconnects, one full GET resyncs any nodes missed while disconnected.
