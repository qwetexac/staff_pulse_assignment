export type TableFocus = {
  rowIndex: number
  columnIndex: number
}

export function clampTableFocus(
  focus: TableFocus,
  rowCount: number,
  columnCount: number,
): TableFocus | null {
  if (rowCount <= 0 || columnCount <= 0) {
    return null
  }

  return {
    rowIndex: Math.min(focus.rowIndex, rowCount - 1),
    columnIndex: Math.min(focus.columnIndex, columnCount - 1),
  }
}

/**
 * Arrow keys move one cell; Home/End jump to the first/last row (same column).
 * Returns `null` for keys this table does not handle.
 */
export function moveTableFocus(
  current: TableFocus,
  key: string,
  rowCount: number,
  columnCount: number,
): TableFocus | null {
  if (rowCount <= 0 || columnCount <= 0) {
    return null
  }

  switch (key) {
    case 'ArrowUp':
      return {
        rowIndex: Math.max(0, current.rowIndex - 1),
        columnIndex: current.columnIndex,
      }
    case 'ArrowDown':
      return {
        rowIndex: Math.min(rowCount - 1, current.rowIndex + 1),
        columnIndex: current.columnIndex,
      }
    case 'ArrowLeft':
      return {
        rowIndex: current.rowIndex,
        columnIndex: Math.max(0, current.columnIndex - 1),
      }
    case 'ArrowRight':
      return {
        rowIndex: current.rowIndex,
        columnIndex: Math.min(columnCount - 1, current.columnIndex + 1),
      }
    case 'Home':
      return { rowIndex: 0, columnIndex: current.columnIndex }
    case 'End':
      return {
        rowIndex: rowCount - 1,
        columnIndex: current.columnIndex,
      }
    default:
      return null
  }
}
