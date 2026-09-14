# 003. Tree expansion state and default depth

Status: accepted
Date: 2026-09-14
Stage: 01

## Context

Requirements ask for an interactive expand/collapse tree with the
**second level expanded by default**. Expansion is UI state, not API data, and
must survive stale-while-revalidate updates that replace the flat `OrgNode[]`
with a new array of the same ids. Stage 02 will sync selection with the table
by node id; expansion should not fight that model.

## Decision

Track expansion as a `Set<string>` of expanded node ids in `OrgTreeView`.
Default set = every root id plus every direct child id (divisions and
departments expanded → teams visible). Re-seed defaults only when the
root-id signature changes (new dataset), not on every referential cache
update of the same tree.

## Alternatives considered

- **Expand roots only** — Shows the second level but leaves it collapsed
  (teams hidden). Rejected: fails a strict reading of “second level
  expanded by default.”
- **Boolean / depth counter (“expand to level N”)** — Simple defaults, but
  poorly supports mixed expand/collapse after user interaction.
- **Remount the tree on every fetch (`key={data}`)** — Resets expansion on
  each SWR revalidate; bad UX once stale-while-revalidate is active.
- **Lift expansion into the query cache / global store** — Unnecessary for
  Stage 01; selection sync in Stage 02 can stay id-based without owning
  expansion centrally yet.

## Consequences

- Positive: Matches the Stage 01 acceptance wording; user toggles persist
  across background revalidates of the same org; ids align with the flat SoT
  (ADR 002).
- Negative / trade-offs: First paint shows more nodes (~all teams); denser
  default UI on large orgs.
- Follow-ups: Stage 03 may animate expand/collapse and respect
  `prefers-reduced-motion`; Stage 02 selection highlight should use
  `selectedId`, not expand state.
