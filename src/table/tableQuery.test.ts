import { describe, expect, it } from 'vitest'
import type { OrgTableRow } from '@/table/tableModel'
import {
  filterRowsByName,
  filterRowsByPredicates,
  matchesNumericPredicate,
} from '@/table/tableQuery'

function row(overrides: Partial<OrgTableRow> = {}): OrgTableRow {
  return {
    id: 'n1',
    name: 'Quality',
    depth: 1,
    levelLabel: 'Department',
    totalHeadcount: 12,
    totalBudget: 90_000,
    averagePerformance: 40,
    ...overrides,
  }
}

describe('filterRowsByName', () => {
  it('is case-insensitive and copies on empty query', () => {
    const rows = [row(), row({ id: 'n2', name: 'Analytics' })]
    expect(filterRowsByName(rows, '')).toEqual(rows)
    expect(filterRowsByName(rows, 'qual').map((item) => item.id)).toEqual(['n1'])
  })
})

describe('filterRowsByPredicates', () => {
  it('treats an empty predicate list as pass-through', () => {
    const rows = [row()]
    expect(filterRowsByPredicates(rows, [])).toEqual(rows)
  })

  it('compares aggregated table fields', () => {
    const sample = row({ totalHeadcount: 20, averagePerformance: 70 })
    expect(
      matchesNumericPredicate(sample, {
        field: 'headcount',
        operator: 'gt',
        value: 19,
      }),
    ).toBe(true)
    expect(
      matchesNumericPredicate(sample, {
        field: 'performance',
        operator: 'lt',
        value: 70,
      }),
    ).toBe(false)
    expect(
      filterRowsByPredicates([sample], [
        { field: 'budget', operator: 'gt', value: 1_000 },
      ]),
    ).toEqual([sample])
  })
})
