# 004. Split-view at 1280px with a narrow-screen toggle

Status: accepted
Date: 2026-09-14
Stage: 02

## Context

Stage 02 requires a Tree / Table toggle **or** a split-view at ≥1280px, plus
row-click highlighting of the corresponding tree node. Both views must read
the same cached `OrgNode[]` (ADR 002). A toggle-only UI hides the tree while
the table is open, so the required highlight is not visible until the user
switches back. A split-only UI is cramped on typical laptop/phone widths.

## Decision

Use **both**, switched by viewport width (`SPLIT_VIEW_MIN_WIDTH_PX` = 1280):

- **≥1280px** — tree and table side by side. Row click highlights the tree
  node immediately; tree click highlights the table row.
- **&lt;1280px** — a Tree / Table toggle. Selection is still a single
  `selectedId` in `OrgDashboard`, so switching views shows the same highlight.

Both panes stay mounted; CSS `display` shows or hides them. That keeps table
filter/sort state when toggling and avoids a second data fetch.

## Alternatives considered

- **Toggle only at every width** — Simplest, but the Stage 02 acceptance
  criterion (“clicking a row highlights the node in the tree”) is invisible
  while the table is showing.
- **Split only at every width** — Makes sync obvious, but two dense panes
  below ~1280px fight for space; the assignment explicitly offers a
  breakpoint.
- **Toggle that auto-switches to the tree on row click** — Shows the
  highlight, but yanks the user out of the table they were reading.
- **MatchMedia in JS to unmount the hidden pane** — Saves a little work,
  resets filter/sort on toggle, and duplicates the CSS breakpoint.

## Consequences

- Positive: Sync is visible on desktop; small screens stay usable; one
  selection state; no extra fetch.
- Negative / trade-offs: Below 1280px the highlight is only seen after a
  toggle (selection is still stored). Both views render even when one is
  hidden (~60 nodes, acceptable).
- Follow-ups: Stage 03 keyboard navigation is table-only; split-view does
  not change that. If the table grows large, consider virtualizing rather
  than unmounting the hidden pane.
