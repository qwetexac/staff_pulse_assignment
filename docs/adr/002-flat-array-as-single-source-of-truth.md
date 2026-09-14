# 002. Flat array as single source of truth

Status: accepted
Date: 2026-09-14
Stage: 01

## Context

The mock API returns a flat list of org nodes (`id`, `parentId`, metrics). The
UI needs a hierarchical tree now (Stage 01) and will add an analytical table
with rollups (Stage 02) plus in-place realtime patches (Stage 03).
`AGENTS.md` states the core principle: **single source of truth, multiple
derived views** — do not keep separate copies that can drift, and do not bake
tree-specific shapes into the fetch/cache layer.

## Decision

Treat the validated flat `OrgNode[]` from the API as the only stored dataset
(held in the query cache). Derive the interactive tree with a pure
`buildTree` helper in `src/tree` at render time (memoized by the view). Do not
persist a nested tree in the cache or transform to tree shape inside
`fetchOrgTree`.

## Alternatives considered

- **Cache a nested tree** — Convenient for the Stage 01 tree alone, but Stage 02
  aggregation and Stage 03 patches operate naturally on flat ids/parent links;
  converting back and forth invites dual sources of truth.
- **Store both flat and tree, keep them in sync** — Avoids recomputing the
  forest, but any missed update desyncs views; higher complexity for no
  requirement-driven win at this scale (~60 nodes).
- **Normalize into an entity map (`Record<id, node>`) as the SoT** — Clean for
  patches by id; deferred. A flat array already matches the API contract and
  is enough for Stage 01; an id-index can be derived later without changing the
  SoT principle.

## Consequences

- Positive: Tree and (later) table always read the same array; patches can
  replace or update nodes by `id` without rebuilding a parallel structure;
  `buildTree` stays pure and unit-testable.
- Negative / trade-offs: Each tree render rebuilds the forest (cheap at
  current size). Call sites must remember that nested `TreeNode`s are views,
  not mutable cache entries.
- Follow-ups: Stage 02 should memoize aggregations from the same flat array;
  Stage 03 should patch that array (and invalidate only affected aggregates),
  not refetch-and-replace a nested tree. Selection sync (tree ↔ table) should
  key off node ids against this SoT.
