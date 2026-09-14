# AI development log

## Stage 01 — Foundation

### Generated as-is (lightly edited)

- Vite/React/TS project wiring: absolute imports via `resolve.tsconfigPaths`,
  scripts (`dev`, `dev:server`, `dev:all`), `.env` from `env.example`
- Mock server: seeded mulberry32 PRNG + `generateOrgTree` (60 nodes, 3 levels),
  `GET /api/org-tree`, CORS, `MOCK_FORCE=empty|error` for state checks
- Client API layer: zod `OrgNode` / `OrgTree` schemas, `ApiValidationError` /
  `ApiHttpError`, `fetchOrgTree`
- Custom SWR cache (`src/cache`): module-level store + `useQueryCache` with 5s
  stale time, request dedupe, AbortSignal release when the last subscriber
  unmounts
- Tree view: pure `buildTree` over the flat array, expand/collapse UI,
  performance color thresholds as named constants, styled-components theme /
  global styles / status panels
- App shell with loading / error / empty branches
- ADRs 001–003

### Rewritten by hand (and why)

- **Cache abort / subscriber ref-counting** — first pass aborted the shared
  fetch on any unmount; rewritten so only the last subscriber releases the
  `AbortController`, avoiding cancelled requests for remaining consumers.
- **`useQueryCache` hook shape** — dropped render-time ref writes (eslint
  `react-hooks/refs`) and setState-in-effect patterns; settled on
  `useSyncExternalStore` + effects keyed by stale epoch.
- **Default expansion** — initially expanded roots only (second level
  visible); corrected to expand roots **and** their children so the second
  level is actually expanded (teams visible), per review of requirements.
- **Loading / empty flash on reload** — `ensureEntry` notified with
  `data: undefined` before the promise was attached, and App treated
  `!data` as empty; fixed `isLoading` + empty-only-when-`data.length === 0`.
- **Triple fetch on first load** — Strict Mode mount/abort/remount plus an
  abort race wiping the in-flight promise; deferred abort via
  `queueMicrotask` so remount joins the same request, and abort only clears
  the entry when it still owns the controller.
- **Vite path resolution** — removed `vite-tsconfig-paths` after Vite 8
  warned it is redundant; use native `resolve.tsconfigPaths: true`.
- **OrgTreeView expand re-seed** — avoided setState-in-effect by adjusting
  expanded ids during render when the root-id signature changes.

### Flag for manual review

- Cache abort semantics under React Strict Mode (mount → release/abort → remount
  refetch) — correct but chatty in dev
- `useSyncExternalStore` snapshot identity if the store later mutates entries
  in place without replacing the object
- Performance thresholds (high ≥ 70, medium ≥ 40) — product choice, not specified
- Mock delay 400ms — fine for loading UI, may want it configurable later

### Autonomous decisions

1. **Source of truth stays flat.** API cache stores `OrgNode[]`; `buildTree` is a
   pure view helper in `src/tree` (ADR 002).
2. **Expanded state** = `Set<string>` of expanded node ids; defaults expand
   roots + children; re-seed on root-id signature change (ADR 003).
3. **Shared-cache cancellation** uses subscriber ref-counting (ADR 001).
4. **Mock data is generated**, not hardcoded; fixed seed `424242` for
   determinism across restarts.
5. **No Express** — Node `http` only for the mock server (YAGNI).
