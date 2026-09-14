# Staff Pulse Dashboard

Org-structure monitoring dashboard: interactive tree view + analytical table
over a hierarchical dataset (divisions → departments → teams), with real-time
updates.

## Stack

React · Vite · TypeScript · styled-components

## Quick start

```bash
npm install
cp env.example .env   # once
npm run dev:all       # client (Vite) + mock API together
```

Or in two terminals:

```bash
npm run dev:server    # mock API on :4000
npm run dev           # client on :5173
```

Open http://localhost:5173. The client reads `VITE_API_URL` from `.env`.

## Project structure

```
src/            # client (see AGENTS.md for the target layout)
mock-server/    # standalone mock API (in-memory; live updates in stage 03)
docs/           # architecture.md, data-model.md, requirements.md, adr/
```

Stage 03 adds SSE live patches over the same cached array, ancestor-only
rollup updates, cell fade, keyboard table nav, and animated tree collapse.
AI search and Docker live in Stage 04 — do not expect `src/ai-search`.

## Development stages

| Stage | Tag | Description |
|---|---|---|
| 01 Foundation | `step/1` | scaffold, mock API, tree view |
| 02 Core | `step/2` | analytical table, aggregation |
| 03 Polish | `step/3` | live updates, keyboard nav, animations |
| 04 Bonus | `step/4` | Docker, production build, AI search |

## AI in development

See [`AI_LOG.md`](AI_LOG.md) for the stage-by-stage log. Summary so far:

- **Tools used**: Cursor (agent)
- **Generated as-is**: scaffold, mock org-tree, SWR cache, tree view,
  aggregation + table, SSE live patches, Vitest cases, ADRs 001–007
- **Rewritten / decided**: cache abort semantics (stage 01); split-view at
  1280px plus a narrow toggle; ancestor-only rollups instead of `useMemo` on
  array identity for live patches; SSE over WebSocket/polling — see
  `AI_LOG.md`
- **Rough split**: mostly agent-generated with review against requirements
  (weighted average, debounce, single `selectedId`)

## Testing

```bash
npm run test          # aggregation, ancestor recompute, patch, backoff, keyboard (Vitest)
```

Cases required by [`docs/data-model.md`](docs/data-model.md): empty tree, a
leaf with no children, a node with one descendant (headcount-weighted
average). Zero-headcount → average 0 is also covered.

To exercise client empty / error UI against the mock API:

```bash
MOCK_FORCE=empty npm run dev:server
MOCK_FORCE=error npm run dev:server
```

## Screenshots / demo

TODO — add screenshots or a GIF of the final result here.

## Documentation

- [`AGENTS.md`](AGENTS.md) — conventions and constraints for AI agents
- [`docs/requirements.md`](docs/requirements.md) — assignment scope and stages
- [`docs/architecture.md`](docs/architecture.md) — layers and data flow
  (Stage 03 as implemented)
- [`docs/data-model.md`](docs/data-model.md) — node shape, tree, aggregation,
  SSE patch contract
- [`docs/adr/`](docs/adr/) — architecture decision records