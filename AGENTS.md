# Staff Pulse Dashboard — Agent Instructions

Persistent context for AI coding agents working on this repository. Read this
before generating any code.

## Document precedence

1. **`AGENTS.md` (this file)** — tooling, architecture, conventions, what
   not to build yet.
2. **`docs/requirements.md`** — functional scope and stage acceptance
   criteria. Wins if it conflicts with this file on *what to build*.
3. **`docs/architecture.md` / `docs/data-model.md` / `docs/adr/`** —
   how the current stage is actually shaped. Prefer these over inferring
   from folder names.

There is no `CLAUDE.md`. Do not create one.

## Current stage

**04 Bonus** is implemented (`step/1`–`step/3` plus Docker/nginx/gzip and
`src/ai-search`). Do not rebuild earlier stages from scratch.

## What this project is

A dashboard for monitoring a company's org structure: divisions → departments →
teams. Each node has headcount, budget, and a performance metric (0–100). The
project needs an interactive tree view and an analytical table with aggregated
metrics, backed by a self-implemented mock API with real-time updates.

This is a take-home assignment. Code quality, architectural decisions, and
documentation matter as much as functionality.

## Tech stack (fixed — do not substitute)

- React + Vite + TypeScript (strict mode)
- styled-components for all styling — no inline `style={{}}`, no bare CSS files
  imported into components
- zod for runtime validation of API responses
- No UI component libraries (MUI, Ant Design, Chakra, etc.)
- No state management libraries unless justified in an ADR — prefer React
  built-ins (`useState`, `useReducer`, `useSyncExternalStore`, Context)
- No data-fetching libraries (react-query, SWR, apollo) — the caching layer is
  implemented from scratch on purpose, to demonstrate understanding of
  stale-while-revalidate mechanics
- No auth, no database

## Repository layout

Target layout for the finished project. Directories marked *planned* must
not exist until that stage.

```
src/
  api/            # types, zod schemas, fetch functions
  cache/          # custom query-cache hook (stale-while-revalidate)
  tree/           # tree view components and logic
  table/          # analytical table (stage 02)
  aggregation/    # pure rollups (stage 02)
  realtime/       # SSE client, backoff, connection status (stage 03)
  ai-search/      # NL → structured filter or name fallback (stage 04)
  shared/         # UI primitives, styled-components theme, named constants
mock-server/      # standalone Node server, kept separate from src/
docs/
  architecture.md
  data-model.md
  requirements.md
  adr/
```

Absolute imports: `@/*` → `src/*` (`tsconfig.app.json` + Vite
`resolve.tsconfigPaths: true`). Do not add `vite-tsconfig-paths`.

## Operations (local)

```bash
npm install
cp env.example .env   # once
npm run dev:all       # Vite :5173 + mock API :4000
# or
docker compose up --build   # nginx :8080 (CLIENT_PORT) + mock API
```

- Client base URL: `VITE_API_URL` (default `http://localhost:4000`).
- Force mock states: `MOCK_FORCE=empty` or `MOCK_FORCE=error` on the
  server process (empty `200 []` vs `500`).
- Org tree is generated with seed `424242` (≥40 nodes, three levels).
- Artificial API delay: 400ms (`MOCK_API_DELAY_MS`).
- Named constants live in `src/shared/constants.ts` (stale time 5s,
  performance thresholds high ≥ 70 / medium ≥ 40, name-filter debounce 250ms,
  split-view min width 1280px, cell flash 1.5s, tree expand 200ms, SSE
  backoff 1s…30s).
- Aggregation, ancestor-recompute, realtime, and AI-search parser tests:
  `npm run test` (Vitest). `npm run analyze` writes `reports/bundle-stats.html`;
  `npm run gzip-size` reports dist gzip vs the 200KB budget.

## Core architectural principle

**Single source of truth, multiple derived views.** The flat node array from
the API is stored once. The tree and the table are both *views* computed from
that same array — never separate copies that can drift out of sync. Aggregates
are derived data (memoized), not stored state.

This matters across all stages: stage 01 builds the source of truth and the
tree view; stage 02 adds a second view (the table) over the same data; stage 03
patches the source of truth in place and only invalidates the aggregates that
are actually affected. Do not design stage 01 in a way that makes this harder
later (e.g. do not bake tree-specific transformations into the fetch layer).

## The four stages (full roadmap, for context only)

Only implement the stage you are asked to implement. Do not build ahead — but
keep these in mind so early decisions don't block later ones.

- **01 Foundation** — scaffold, mock API (`GET /api/org-tree`), zod validation,
  custom cache hook with 5s stale time, interactive tree, loading/error/empty
  states.
- **02 Core** — analytical table with sortable/filterable columns, tree/table
  toggle or split-view ≥1280px, aggregation computed once and memoized, row
  click syncs selection with the tree.
- **03 Polish** — real-time updates (SSE/WebSocket/efficient polling), in-place
  patching without full refetch, fade-out animation on changed cells,
  recomputation limited to the affected node and its ancestors, connection
  indicator with exponential backoff, keyboard navigation, animated tree
  expand/collapse respecting `prefers-reduced-motion`.
- **04 Bonus** — Docker + docker-compose, nginx reverse proxy + gzip, production
  bundle ≤200KB gzip, natural-language AI search with structured-filter output
  and text-search fallback.

## Coding conventions

- No `any` without an inline comment justifying it.
- Business logic never lives inside JSX — extract to hooks/utilities.
- Aggregation and data-transformation functions must be pure (no side effects,
  no mutation of inputs) — they will be unit tested in isolation.
- Absolute imports via `@/` — no `../../..` chains.
- Constants (thresholds, timings) are named and centralized in
  `src/shared/constants.ts` (or a sibling constants module), never magic
  numbers inline.

## Git / commit conventions

- Each stage is delivered as one or more commits, tagged `step/N` when the
  stage is complete (`step/1`, `step/2`, `step/3`, `step/4`).
- Commit messages describe what changed, not "stage N work".

## AI-usage logging (required by the assignment)

After finishing each stage, append a short entry to `AI_LOG.md` at the repo
root:
- what was generated by the agent as-is
- what was rewritten by hand and why
- any non-trivial decision the agent made autonomously

This feeds directly into the README's "AI in development" section — do not
skip it, do not write it retroactively from memory at the end of the project.

## Things to never do in this project

- No authorization/authentication
- No database (mock server holds data in memory)
- No UI component libraries
- No inline styles
- No building features from a later stage while working on an earlier one
