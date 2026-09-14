import type { ParseResult } from '@/ai-search/types'
import type { OrgTableRow } from '@/table/tableModel'
import type { NumericPredicate } from '@/table/tableQuery'
import {
  filterRowsByName,
  filterRowsByPredicates,
} from '@/table/tableQuery'

/**
 * Applies the parsed search to the current table rows. Callers must re-run
 * this whenever `rows` or `parsed` change so live patches stay in the result.
 */
export function applyOrgTableSearch(
  rows: readonly OrgTableRow[],
  parsed: ParseResult,
): OrgTableRow[] {
  switch (parsed.kind) {
    case 'empty':
      return [...rows]
    case 'text':
      return filterRowsByName(rows, parsed.query)
    case 'structured':
      return filterRowsByPredicates(rows, parsed.filters)
  }
}

export function formatPredicate(predicate: NumericPredicate): string {
  const operator = predicate.operator === 'gt' ? '>' : '<'
  return `${predicate.field} ${operator} ${predicate.value}`
}

export function searchStatusMessage(parsed: ParseResult): string | null {
  switch (parsed.kind) {
    case 'empty':
      return null
    case 'text':
      return 'No structured filter matched — searching names instead.'
    case 'structured':
      return `Using structured filter: ${parsed.filters.map(formatPredicate).join(' and ')}`
  }
}

export function emptySearchMessage(parsed: ParseResult): string {
  switch (parsed.kind) {
    case 'text':
      return 'No units match that name.'
    case 'structured':
      return 'No units match that filter.'
    case 'empty':
      return 'No units to show.'
  }
}
