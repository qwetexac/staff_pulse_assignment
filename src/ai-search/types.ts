import type { NumericPredicate } from '@/table/tableQuery'

export type { NumericPredicate }

export type ParseResult =
  | { kind: 'empty' }
  | { kind: 'structured'; filters: NumericPredicate[] }
  | { kind: 'text'; query: string }
