# 001. Custom cache layer vs data-fetching library

Status: accepted
Date: 2026-09-14
Stage: 01

## Context

Requirements ask for cached API responses with a stale-while-revalidate (or
equivalent) strategy, a 5-second stale time, and cancellation of in-flight
requests on unmount. `AGENTS.md` forbids data-fetching libraries (react-query,
SWR, Apollo, etc.): the caching layer must be implemented from scratch to
demonstrate understanding of those mechanics. No global state-management
library is allowed unless justified by its own ADR.

## Decision

Implement a project-owned query cache in `src/cache`: a module-level store
(`queryCacheStore`) plus a React hook (`useQueryCache`) that exposes
stale-while-revalidate behaviour.

Key details:

- Fresh hits return cached data immediately; after `CACHE_STALE_TIME_MS`
  (5s), subscribers keep showing stale data while a background revalidate
  runs.
- In-flight requests are deduplicated per query key.
- Cancellation uses subscriber ref-counting: the shared `AbortController`
  aborts only when the last subscriber for that key releases (unmount /
  disable), so one consumer leaving does not cancel work still needed
  elsewhere.
- Subscriptions use `useSyncExternalStore` so cache writes drive re-renders
  without a third-party store.

## Alternatives considered

- **TanStack Query / SWR / similar** — Correct product fit for SWR + abort,
  but explicitly disallowed by `AGENTS.md`; using one would fail the
  assignment’s learning goal.
- **Ad-hoc `useEffect` + `useState` per screen** — Simpler for a single fetch,
  but no shared cache, no request dedupe, and easy to drift when Stage 02 adds
  a second view over the same data.
- **React Context holding fetch results only** — Shares data across the tree,
  but does not by itself provide stale timing, background revalidate, or
  abort/ref-count semantics; would still need a custom store underneath.

## Consequences

- Positive: Meets the mandatory “build it yourself” constraint; cache behaviour
  is inspectable and tailored to this app; one cache entry can feed multiple
  views later.
- Negative / trade-offs: We own edge cases (Strict Mode double-mount abort/
  refetch chatter, snapshot identity if entries are mutated in place). No
  battle-tested retry/devtooling from a library.
- Follow-ups: Stage 03 may need an explicit cache-patch / invalidate API so
  realtime updates can mutate the flat array in place without a full refetch;
  revisit abort policy if many concurrent subscribers become common.
