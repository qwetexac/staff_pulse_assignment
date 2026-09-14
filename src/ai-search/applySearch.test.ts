import { describe, expect, it } from 'vitest'
import {
  applyOrgTableSearch,
  emptySearchMessage,
  searchStatusMessage,
} from '@/ai-search/applySearch'
import type { ParseResult } from '@/ai-search/types'
import type { OrgTableRow } from '@/table/tableModel'

function row(overrides: Partial<OrgTableRow> = {}): OrgTableRow {
  return {
    id: 'n1',
    name: 'Engineering Division',
    depth: 0,
    levelLabel: 'Division',
    totalHeadcount: 40,
    totalBudget: 500_000,
    averagePerformance: 55,
    ...overrides,
  }
}

const structured: ParseResult = {
  kind: 'structured',
  filters: [
    { field: 'performance', operator: 'lt', value: 60 },
    { field: 'headcount', operator: 'gt', value: 50 },
  ],
}

describe('applyOrgTableSearch', () => {
  it('returns a copy of all rows for an empty query', () => {
    const rows = [row()]
    const result = applyOrgTableSearch(rows, { kind: 'empty' })
    expect(result).toEqual(rows)
    expect(result).not.toBe(rows)
  })

  it('falls back to name substring matching', () => {
    const rows = [row(), row({ id: 'n2', name: 'People Division' })]
    expect(
      applyOrgTableSearch(rows, { kind: 'text', query: 'people' }).map(
        (item) => item.id,
      ),
    ).toEqual(['n2'])
  })

  it('applies AND predicates against current row values', () => {
    const matching = row({
      id: 'match',
      totalHeadcount: 80,
      averagePerformance: 50,
    })
    const tooFewPeople = row({
      id: 'few',
      totalHeadcount: 10,
      averagePerformance: 50,
    })
    const tooHighPerf = row({
      id: 'high',
      totalHeadcount: 80,
      averagePerformance: 90,
    })

    expect(
      applyOrgTableSearch(
        [matching, tooFewPeople, tooHighPerf],
        structured,
      ).map((item) => item.id),
    ).toEqual(['match'])
  })

  it('recomputes matches when the same filter sees updated row values', () => {
    const before = row({
      id: 'live',
      totalHeadcount: 80,
      averagePerformance: 50,
    })
    expect(applyOrgTableSearch([before], structured).map((item) => item.id)).toEqual(
      ['live'],
    )

    const afterPatch = { ...before, averagePerformance: 72 }
    expect(applyOrgTableSearch([afterPatch], structured)).toEqual([])
  })
})

describe('search copy', () => {
  it('explains the text-search fallback', () => {
    expect(
      searchStatusMessage({ kind: 'text', query: 'Engineering' }),
    ).toBe('No structured filter matched — searching names instead.')
    expect(emptySearchMessage({ kind: 'text', query: 'zzz' })).toBe(
      'No units match that name.',
    )
  })

  it('summarizes a structured filter', () => {
    expect(searchStatusMessage(structured)).toBe(
      'Using structured filter: performance < 60 and headcount > 50',
    )
    expect(searchStatusMessage({ kind: 'empty' })).toBeNull()
  })
})
