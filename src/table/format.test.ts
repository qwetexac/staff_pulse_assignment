import { describe, expect, it } from 'vitest'
import { formatBudget } from '@/table/format'

function withRegularSpaces(value: string): string {
  return value.replaceAll(/[\u00A0\u202F]/g, ' ')
}

describe('formatBudget', () => {
  it('groups thousands with spaces and suffixes руб.', () => {
    expect(withRegularSpaces(formatBudget(4_569_028))).toBe('4 569 028 руб.')
  })
})
