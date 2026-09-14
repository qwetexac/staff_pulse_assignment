import { describe, expect, it } from 'vitest'
import { clampTableFocus, moveTableFocus } from '@/table/tableKeyboard'

describe('moveTableFocus', () => {
  const start = { rowIndex: 2, columnIndex: 1 }

  it('moves one cell with arrow keys and clamps at the edges', () => {
    expect(moveTableFocus(start, 'ArrowUp', 5, 5)).toEqual({
      rowIndex: 1,
      columnIndex: 1,
    })
    expect(moveTableFocus(start, 'ArrowDown', 5, 5)).toEqual({
      rowIndex: 3,
      columnIndex: 1,
    })
    expect(moveTableFocus(start, 'ArrowLeft', 5, 5)).toEqual({
      rowIndex: 2,
      columnIndex: 0,
    })
    expect(moveTableFocus(start, 'ArrowRight', 5, 5)).toEqual({
      rowIndex: 2,
      columnIndex: 2,
    })
    expect(moveTableFocus({ rowIndex: 0, columnIndex: 0 }, 'ArrowUp', 5, 5)).toEqual({
      rowIndex: 0,
      columnIndex: 0,
    })
    expect(
      moveTableFocus({ rowIndex: 4, columnIndex: 4 }, 'ArrowRight', 5, 5),
    ).toEqual({ rowIndex: 4, columnIndex: 4 })
  })

  it('jumps to the first and last row with Home and End', () => {
    expect(moveTableFocus(start, 'Home', 5, 5)).toEqual({
      rowIndex: 0,
      columnIndex: 1,
    })
    expect(moveTableFocus(start, 'End', 5, 5)).toEqual({
      rowIndex: 4,
      columnIndex: 1,
    })
  })

  it('returns null for keys the table does not handle', () => {
    expect(moveTableFocus(start, 'Enter', 5, 5)).toBeNull()
    expect(moveTableFocus(start, 'Tab', 5, 5)).toBeNull()
  })
})

describe('clampTableFocus', () => {
  it('returns null when there are no rows', () => {
    expect(clampTableFocus({ rowIndex: 0, columnIndex: 0 }, 0, 5)).toBeNull()
  })

  it('keeps the cursor inside the filtered row set', () => {
    expect(clampTableFocus({ rowIndex: 9, columnIndex: 4 }, 3, 5)).toEqual({
      rowIndex: 2,
      columnIndex: 4,
    })
  })
})
