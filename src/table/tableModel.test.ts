import { describe, expect, it } from 'vitest'
import {
  nextSortOnClick,
  nextSortOnDoubleClick,
} from '@/table/tableModel'

describe('nextSortOnClick', () => {
  it('starts a new column ascending', () => {
    expect(nextSortOnClick(null, 'budget')).toEqual({
      column: 'budget',
      direction: 'asc',
    })
    expect(
      nextSortOnClick({ column: 'name', direction: 'desc' }, 'budget'),
    ).toEqual({ column: 'budget', direction: 'asc' })
  })

  it('resets the active column from desc to asc', () => {
    expect(
      nextSortOnClick({ column: 'headcount', direction: 'desc' }, 'headcount'),
    ).toEqual({ column: 'headcount', direction: 'asc' })
  })

  it('is a no-op when the column is already ascending', () => {
    const current = { column: 'name' as const, direction: 'asc' as const }
    expect(nextSortOnClick(current, 'name')).toBe(current)
  })
})

describe('nextSortOnDoubleClick', () => {
  it('reverses the active column', () => {
    expect(
      nextSortOnDoubleClick({ column: 'name', direction: 'asc' }, 'name'),
    ).toEqual({ column: 'name', direction: 'desc' })
    expect(
      nextSortOnDoubleClick({ column: 'name', direction: 'desc' }, 'name'),
    ).toEqual({ column: 'name', direction: 'asc' })
  })

  it('starts a new column descending', () => {
    expect(nextSortOnDoubleClick(null, 'level')).toEqual({
      column: 'level',
      direction: 'desc',
    })
  })
})
