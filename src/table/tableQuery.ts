import type { OrgTableRow, SortColumn, SortState } from '@/table/tableModel'

/** Table-column comparisons produced by Stage 04 AI search (and reusable by tests). */
export type NumericFilterField = 'headcount' | 'budget' | 'performance'

export type ComparisonOperator = 'gt' | 'lt'

export type NumericPredicate = {
  field: NumericFilterField
  operator: ComparisonOperator
  value: number
}

const ROW_VALUE: Record<NumericFilterField, (row: OrgTableRow) => number> = {
  headcount: (row) => row.totalHeadcount,
  budget: (row) => row.totalBudget,
  performance: (row) => row.averagePerformance,
}

export function matchesNumericPredicate(
  row: OrgTableRow,
  predicate: NumericPredicate,
): boolean {
  const actual = ROW_VALUE[predicate.field](row)
  switch (predicate.operator) {
    case 'gt':
      return actual > predicate.value
    case 'lt':
      return actual < predicate.value
  }
}

export function filterRowsByPredicates(
  rows: readonly OrgTableRow[],
  predicates: readonly NumericPredicate[],
): OrgTableRow[] {
  if (predicates.length === 0) {
    return [...rows]
  }

  return rows.filter((row) =>
    predicates.every((predicate) => matchesNumericPredicate(row, predicate)),
  )
}

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
