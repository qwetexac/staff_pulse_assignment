# 006. SSE for live org-tree patches

Status: accepted
Date: 2026-09-14
Stage: 03

## Context

Stage 03 requires the mock server to push metric updates on random nodes and
the client to apply them without a full refetch. The assignment allows SSE,
WebSocket, or efficient polling. Constraints: updates are **server → client
only**; frequency is a few patches per second at most; disconnects must
exponential-backoff (capped) with a visible connection status.

## Decision

Use **Server-Sent Events** on `GET /api/org-tree/stream` (`VITE_REALTIME_URL`).
The server writes one JSON patch per event (`data: …\\n\\n`) plus SSE comment
heartbeats. The client uses `EventSource`, **closes it on error** (so the
browser’s built-in 3s retry does not fight our backoff), then reconnects with
`nextReconnectDelayMs` (1s → 2s → 4s … cap 30s).

While the stream is `connected`, `useOrgTree` uses `staleTime: Infinity` so
SWR does not refetch the full tree and overwrite in-place patches. After a
later reconnect, one `revalidate` GET catches nodes that changed while the
stream was down.

## Alternatives considered

- **WebSocket** — Bidirectional, extra handshake and frame protocol. We never
  send client → server messages; a socket would be unused half of the API.
  Reconnect/backoff would still be custom. Rejected as more surface for no
  product need.
- **Efficient polling** (`GET /api/org-tree` every N seconds, or
  `If-Modified-Since`) — Simple, but either lags (long interval) or hammers
  the server with full-array responses (short interval). Conflicts with
  “apply patches without a full refetch” and with the 400ms mock delay.
- **Native EventSource auto-reconnect only** — No control over backoff or the
  disconnected/reconnecting labels; the default retry is a flat ~3s.

## Consequences

- Positive: One long-lived HTTP connection; payload is a single node; CORS is
  the same `Access-Control-Allow-Origin: *` as `GET /api/org-tree`.
- Negative / trade-offs: EventSource cannot set custom headers; we close-and-
  reopen instead of using the spec retry field. A reconnect GET can race a
  patch that arrives during the 400ms mock delay (rare; next event heals it).
- Follow-ups: Stage 04 nginx must not buffer `text/event-stream`
  (`X-Accel-Buffering: no` is already set on the mock response).
