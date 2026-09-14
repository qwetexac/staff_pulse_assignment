# Requirements — Staff Pulse Dashboard

Source: take-home assignment, frontend / React / TypeScript, 2–3 day deadline.
Translated and structured for use as agent context. If anything here conflicts
with `AGENTS.md`, `AGENTS.md` wins for tooling and architecture decisions; this
file wins for functional scope.

## Task

Build a dashboard for monitoring a company's org structure. The structure is hierarchical: divisions → departments → teams. Each node has headcount,
budget, and a performance metric. The dashboard needs an interactive tree view and an analytical table with aggregated metrics.

## Stack

React, Vite, TypeScript. styled-components for styling is a plus.

## Non-functional requirements

- **Reliability**: handle loading, error, and empty-response states correctly;
  properly cancel in-flight requests on component unmount.
- **API efficiency**: cache responses, avoid redundant requests
  (stale-while-revalidate or equivalent); invalidate cache only when data has actually changed.

## Mandatory: AI tools in the development process

Use AI tools (Claude, Cursor, Copilot, etc.) throughout development. The
README must include a section describing what was generated, what was rewritten by hand, and why.

## Mock API

Implement your own server. `GET /api/org-tree` returns a flat array:

```ts
{
  id: string;
  name: string;
  parentId: string | null;
  headcount: number;
  budget: number;
  performance: number; // 0–100
  updatedAt: string;    // ISO timestamp
}
```

Minimum 40 nodes, at least three levels of nesting.

## Stages

Each stage is a separate commit tagged `step/N`.

### 01 — Foundation (project, API, tree)

- Scaffold: Vite + React + TypeScript, absolute imports
- API response schema validated on the client; an invalid response is an error
- Requests go through a caching layer, stale time 5 seconds
- Interactive tree: expand/collapse branches, second level expanded by default
- Each node shows name, headcount, and a color indicator for performance
- States: loading, error, empty response; no inline CSS

### 02 — Core (analytical table)

- Tree / Table toggle (or split-view at ≥1280px)
- Columns: Division/Unit, Level, Total Headcount, Total Budget, Average
  Performance
- Totals include the node itself and all descendants; average performance is
  weighted by headcount
- Sortable by any column; double-click reverses sort order
- Name filter: real-time, 250ms debounce
- Clicking a row highlights the node in the tree; budgets formatted as
  `12,345,678` (thousands separator, currency label)
- Aggregation is computed once after data loads and memoized

### 03 — Live updates and UX

- Server supports real-time updates. Client implements one of: WebSocket, SSE,
  or efficient polling (accounting for update frequency, backoff, and
  minimizing redundant requests)
- Client applies patches without a full refetch; updated cells fade out over
  ~1.5s
- Aggregates are recomputed only for the affected node and its ancestors
- Connection status indicator in the header; exponential backoff on
  disconnect
- Keyboard navigation in the table: arrow keys, Home/End, Enter
- Tree expand/collapse animated via height transition; respects
  `prefers-reduced-motion`

### 04 — Bonus: production + AI feature

- Docker: `docker-compose up` brings up client and server; config via `.env`
- Nginx: proxies the API, serves static files with gzip; production build
  ≤200KB gzip
- AI search: search box accepts natural language; response is a structured
  filter applied on the client; falls back to plain text search

## Deliverables

- Public repository or source archive; each stage as a separate commit tagged
  `step/N`
- README: single-command startup instructions + a mandatory "AI in
  development" section
- Unit test for the aggregation function; screenshots or a GIF of the final
  result
- `docs/architecture.md` — application layers, data flow from API to UI
- `docs/data-model.md` — tree structure, aggregation algorithm, WebSocket/SSE
  patch contract
- `docs/adr/NNN-title.md` — an ADR for each non-trivial decision (context,
  decision, alternatives considered, consequences)

## Explicitly out of scope

Authorization, a database, UI component libraries (MUI, Ant Design, etc.).
Anything not explicitly specified is left to the developer's discretion.
