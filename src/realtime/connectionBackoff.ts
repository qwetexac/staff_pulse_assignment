/**
 * Exponential backoff: initial, initial*factor, … capped at max.
 * `failedAttempts` is 0 for the first retry after a drop.
 */
export function nextReconnectDelayMs(
  failedAttempts: number,
  initialMs: number,
  maxMs: number,
  factor: number,
): number {
  const exponent = Math.max(0, failedAttempts)
  return Math.min(maxMs, initialMs * factor ** exponent)
}
