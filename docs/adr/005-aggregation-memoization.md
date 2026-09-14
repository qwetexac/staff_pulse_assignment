# 005. Memoized full-forest aggregation with a reusable rollup helper

Status: accepted
Date: 2026-09-14
Stage: 02

## Context

Requirements: totals include the node and all descendants; average
performance is **headcount-weighted**; aggregation is computed **once after
data loads and memoized** — not on every render or on unrelated UI state
(sort, filter, selection). Stage 03 will need to recompute only the patched
node and its ancestors, not the whole forest. Rollups must not be stored on
`OrgNode` (ADR 002: derived data, not a second source of truth).

## Decision

1. **Pure function** `aggregateOrgTree(nodes) → Map<id, NodeRollup>` in
   `src/aggregation`. One bottom-up walk. Empty input → empty Map (no throw).
2. **Decomposition** `rollupFromSelfAndChildren(node, childRollups)` is the
   actual formula, including `weightedPerformanceSum` (Σ headcount ×
   performance). A parent’s rollup is its own metrics plus children’s
   rollups — no descendant walk required.
3. **Memoization** in `OrgDashboard` via `useMemo(..., [nodes])`. Sort,
   filter, expansion, and `selectedId` do not appear in that dependency list,
   so they cannot retrigger aggregation. Table rows are a second memo from
   `(nodes, rollups)`.

This is enough for Stage 02: the cache replaces `nodes` only when a fetch
completes.

## Alternatives considered

- **Recompute inside the table on each sort/filter** — Violates “once after
  data loads”; wasteful even at current size.
- **Store rollups on `OrgNode` / in the query cache** — Mixes derived data
  into the source of truth; Stage 03 patches would have to keep both in sync.
- **Module-level aggregate cache keyed by array identity** — Survives
  unmount, but the dashboard is the only consumer; `useMemo` is sufficient.
- **Incremental ancestor updates in Stage 02** — No live patches yet; would
  be building Stage 03 early.

## Consequences

- Positive: Aggregation is isolated, unit-tested, and independent of UI
  state. The helper is the unit Stage 03 needs.
- Negative / trade-offs: `useMemo` is keyed on **array identity**. An
  in-place mutation of the same `OrgNode[]` would not recompute. A whole-array
  replacement recomputes **every** node, not only ancestors.
- Follow-ups **for Stage 03** (do not implement now):
  - Do not rely on this `useMemo` for patches.
  - After patching a node, call `rollupFromSelfAndChildren` for that id and
    each ancestor (`parentId` chain), writing into the existing `Map`.
  - Keep `weightedPerformanceSum` on the rollup so children can be combined
    without re-walking subtrees.
  - If the cache keeps the same array reference after a mutation, bump a
    generation or update the Map directly rather than waiting for `useMemo`.
