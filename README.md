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

Stage 01 is the tree + cache. Table, aggregation, and realtime modules are
not in the repo yet — do not expect those folders.

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
- **Generated as-is**: scaffold wiring, seeded mock org-tree generator, zod
  schemas, SWR cache hook, tree view + styled-components shell
- **Rewritten by hand**: cache abort ref-counting, hook/lint fixes, default
  expansion (roots + children), native Vite tsconfig paths — see `AI_LOG.md`
- **Rough split (stage 01)**: mostly agent-generated with targeted rewrites
  for lint, SWR abort semantics, and requirements review fixes

## Testing

No test runner yet (lands with the Stage 02 aggregation function). The
algorithm those tests must implement is specified in
[`docs/data-model.md`](docs/data-model.md).

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
  (Stage 01 as implemented)
- [`docs/data-model.md`](docs/data-model.md) — node shape, tree, aggregation
  spec; live-update patch contract is a Stage 03 stub
- [`docs/adr/`](docs/adr/) — architecture decision records