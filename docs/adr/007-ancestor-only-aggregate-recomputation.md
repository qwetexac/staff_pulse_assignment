# 007. Ancestor-only rollup recomputation

Status: accepted
Date: 2026-09-14
Stage: 03

## Context

Stage 02 memoized `aggregateOrgTree(nodes)` on **array identity** (ADR 005).
A live patch mutates one `OrgNode` **in the same array**, so that `useMemo`
would not run — and replacing the array on every patch would recompute the
whole forest, which Stage 03 forbids. Totals still include the node and all
descendants; average performance is headcount-weighted. Structure (`parentId`)
does not change on a patch.

## Decision

Keep the Stage 02 `Map<id, NodeRollup>` as derived state in `useOrgTableRows`:

1. When `nodes` is a **new array** (initial GET or reconnect refetch), run
   `aggregateOrgTree` once.
2. When a patch arrives against the **same array**, call
   `recomputeAncestorRollups(nodes, previous, changedId)`: walk `parentId`
   from the patched node to the root; at each step call
   `rollupFromSelfAndChildren(node, childRollups)` using **already-stored**
   child rollups. Sibling and cousin entries keep the same object identity.

The query cache notifies via a new entry object (`revision++`) even though the
`OrgNode[]` reference is unchanged, so React re-renders. Table rows are patched
only for ids in the ancestor chain. Cell fade tokens are recorded per
`(nodeId, metric)` from that diff, so sort/filter re-renders do not start a
new fade.

## Alternatives considered

- **Keep `useMemo(..., [nodes])` and replace the array on every patch** —
  Simple, but recomputes every node and breaks the Stage 03 requirement.
- **Mutate the rollup Map in place without copying** — Cheap, but
  `useSyncExternalStore` / React would not see a change unless we bump some
  other version; a new Map that shares unchanged entries is enough.
- **Re-walk descendants of the patched node** — Unnecessary: children did not
  change, only the node’s own metrics did. `weightedPerformanceSum` on each
  child is the whole subtree.
- **Store rollups on `OrgNode`** — Rejected in ADR 002 / 005; patches would
  have to keep two representations in sync.

## Consequences

- Positive: O(depth) rollup math per event (depth ≤ 2 in this dataset);
  unit-tested against a full re-aggregate; unrelated branches keep the same
  `NodeRollup` objects.
- Negative / trade-offs: Building a children index is still O(n) per patch
  (structural, not a descendant walk). Acceptable at ~60 nodes.
- Follow-ups: If patches ever include parent moves or inserts, this path is
  invalid — fall back to `aggregateOrgTree`.
