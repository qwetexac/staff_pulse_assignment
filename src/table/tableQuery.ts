import type { OrgTableRow, SortColumn, SortState } from '@/table/tableModel'

function compareRows(
  left: OrgTableRow,
  right: OrgTableRow,
  column: SortColumn,
): number {
  switch (column) {
    case 'name':
      return left.name.localeCompare(right.name)
    case 'level':
      return left.depth - right.depth
    case 'headcount':
      return left.totalHeadcount - right.totalHeadcount
    case 'budget':
      return left.totalBudget - right.totalBudget
    case 'performance':
      return left.averagePerformance - right.averagePerformance
  }
}

export function sortRows(
  rows: readonly OrgTableRow[],
  sort: SortState | null,
): OrgTableRow[] {
  if (sort === null) {
    return [...rows]
  }

  const direction = sort.direction === 'asc' ? 1 : -1
  return [...rows].sort(
    (left, right) => compareRows(left, right, sort.column) * direction,
  )
}

export function filterRowsByName(
  rows: readonly OrgTableRow[],
  query: string,
): OrgTableRow[] {
  const normalized = query.trim().toLowerCase()
  if (normalized.length === 0) {
    return [...rows]
  }

  return rows.filter((row) => row.name.toLowerCase().includes(normalized))
}
