# 008. Rule-based natural-language search (no LLM)

Status: accepted
Date: 2026-09-14
Stage: 04

## Context

Stage 04 asks for an “AI search” box that accepts natural language and
turns it into a **structured filter** applied on the client against the
existing table rows. The assignment’s examples are threshold comparisons
(“performance below 60 and more than 50 people”, “budget over 1000000”).
The dashboard already has the full org tree in memory (Stage 02 table +
Stage 03 live patches). Docker Compose must work out of the box with no
API keys or extra services. Filters must stay correct as SSE patches
change metrics — a one-shot ranked list of ids would go stale.

## Decision

Parse queries with a **deterministic rule-based grammar**, not an external
LLM. The parser (`src/ai-search/parseQuery.ts`) emits
`{ field, operator, value }[]` using the table’s `NumericPredicate` shape
(`headcount` | `budget` | `performance`, `gt` | `lt`).

Supported patterns:

- Field then operator then number: `performance below 60`, `budget over 1,000,000`
- Operator then number then field/unit: `more than 50 people`
- AND of those clauses (`… and …`)
- Operator words: below / under / less than / fewer than; above / over / more than / greater than
- Field aliases: performance, headcount / people / employees / staff, budget
- Optional `$`, commas, and `%` / `percent` / `dollars` when they agree with the field

OrgTable `useMemo`s `applyOrgTableSearch(rows, parsed)` on **both** the
current row array and the parsed filter. Live patches produce a new `rows`
array, so membership is recomputed; we never cache matching ids.

If the query is empty, every row is shown. If it is not a full match of
the grammar (including ranking phrases like `top 5`, OR-clauses, or a
bare name), we fall back to Stage 02 substring search on `name` and show
a status note on the right, above the input.

## Alternatives considered

- **Remote LLM (OpenAI / similar)** — Natural language coverage would be
  wider, but it needs an API key, network, cost, and a non-deterministic
  schema. `docker-compose up` would not work from a clean clone. Rejected.
- **On-device LLM / WASM model** — No key, but a large download, slow
  first run, and still non-deterministic structured output. Breaks the
  gzip budget. Rejected.
- **Ranking queries (“top N”, “highest budget”)** — Would snapshot an
  ordered id list that drifts as Stage 03 patches arrive. Out of scope;
  those strings fall back to name search.

## Consequences

- Positive: Same Docker image for everyone; filters are predicates over
  live aggregated rows; parser is unit-tested; fallback is visible.
- Negative / trade-offs: Only comparison + AND. No OR, no BETWEEN, no
  “teams in Engineering with low performance” beyond what AND+name
  fallback can do. “below 60” is strict `<`, not `<=`.
- Follow-ups: A later LLM could emit the same `NumericPredicate[]` and
  reuse `filterRowsByPredicates` without changing the table.
