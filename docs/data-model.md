# Data model

Status: node shape, tree construction, and aggregation are **implemented**
(Stage 02). The live-update patch contract is a stub until Stage 03.

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

Aggregation is computed once after data loads and memoized in `OrgDashboard`
(`useMemo` on `nodes`; ADR 005). Do not store rollups on `OrgNode`. The
returned `NodeRollup` includes `weightedPerformanceSum` so Stage 03 can
recompute only the patched node and its ancestors via
`rollupFromSelfAndChildren`, not the whole forest.

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

## Live-update patch contract (Stage 03 — not implemented)

No realtime endpoint exists yet. `env.example` reserves
`VITE_REALTIME_URL` for when one does.

When Stage 03 lands, this section must document:

- Transport (SSE, WebSocket, or polling) and URL
- Payload: which fields of which `id` changed
- How the client patches the cached `OrgNode[]` **in place** (no full
  refetch) and which aggregates to invalidate (affected node + ancestors)

Until then, do not add a client or server stream “for later”.
