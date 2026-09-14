import { describe, expect, it } from 'vitest'
import { nextReconnectDelayMs } from '@/realtime/connectionBackoff'

describe('nextReconnectDelayMs', () => {
  it('starts at the initial delay and doubles until the cap', () => {
    expect(nextReconnectDelayMs(0, 1_000, 30_000, 2)).toBe(1_000)
    expect(nextReconnectDelayMs(1, 1_000, 30_000, 2)).toBe(2_000)
    expect(nextReconnectDelayMs(2, 1_000, 30_000, 2)).toBe(4_000)
    expect(nextReconnectDelayMs(3, 1_000, 30_000, 2)).toBe(8_000)
    expect(nextReconnectDelayMs(4, 1_000, 30_000, 2)).toBe(16_000)
    expect(nextReconnectDelayMs(5, 1_000, 30_000, 2)).toBe(30_000)
    expect(nextReconnectDelayMs(8, 1_000, 30_000, 2)).toBe(30_000)
  })
})
