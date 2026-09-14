import {
  FIELD_ALIASES,
  FIELD_PATTERN,
  NUMBER_PATTERN,
  OPERATOR_ALIASES,
  OPERATOR_PATTERN,
  OPTIONAL_UNIT_PATTERN,
  OR_PATTERN,
  RANKING_PATTERN,
} from '@/ai-search/constants'
import type { ParseResult } from '@/ai-search/types'
import type { NumericFilterField, NumericPredicate } from '@/table/tableQuery'

const FIELD_THEN_OPERATOR = new RegExp(
  `^(${FIELD_PATTERN})\\s+(${OPERATOR_PATTERN})\\s+(${NUMBER_PATTERN})\\s*(${OPTIONAL_UNIT_PATTERN})?$`,
  'i',
)

const OPERATOR_THEN_FIELD = new RegExp(
  `^(${OPERATOR_PATTERN})\\s+(${NUMBER_PATTERN})\\s+(${FIELD_PATTERN})\\s*(${OPTIONAL_UNIT_PATTERN})?$`,
  'i',
)

function parseNumber(raw: string): number | null {
  const normalized = raw.replaceAll(/[$,]/g, '')
  if (normalized.length === 0) {
    return null
  }
  const value = Number(normalized)
  if (!Number.isFinite(value)) {
    return null
  }
  return value
}

function resolveField(raw: string): NumericFilterField | null {
  return FIELD_ALIASES[raw.toLowerCase()] ?? null
}

function resolveOperator(raw: string): NumericPredicate['operator'] | null {
  return OPERATOR_ALIASES[raw.toLowerCase()] ?? null
}

function unitAgrees(
  field: NumericFilterField,
  unit: string | undefined,
): boolean {
  if (unit === undefined || unit.length === 0) {
    return true
  }

  const normalized = unit.toLowerCase()
  if (normalized === '%' || normalized === 'percent') {
    return field === 'performance'
  }
  if (
    normalized === 'people' ||
    normalized === 'employees' ||
    normalized === 'staff'
  ) {
    return field === 'headcount'
  }
  if (normalized === 'dollars') {
    return field === 'budget'
  }
  return false
}

function predicateFromParts(
  fieldRaw: string,
  operatorRaw: string,
  valueRaw: string,
  unit: string | undefined,
): NumericPredicate | null {
  const field = resolveField(fieldRaw)
  const operator = resolveOperator(operatorRaw)
  const value = parseNumber(valueRaw)
  if (field === null || operator === null || value === null) {
    return null
  }
  if (!unitAgrees(field, unit)) {
    return null
  }
  return { field, operator, value }
}

function parseClause(clause: string): NumericPredicate | null {
  const fieldFirst = clause.match(FIELD_THEN_OPERATOR)
  if (fieldFirst) {
    return predicateFromParts(
      fieldFirst[1] ?? '',
      fieldFirst[2] ?? '',
      fieldFirst[3] ?? '',
      fieldFirst[4],
    )
  }

  const operatorFirst = clause.match(OPERATOR_THEN_FIELD)
  if (operatorFirst) {
    return predicateFromParts(
      operatorFirst[3] ?? '',
      operatorFirst[1] ?? '',
      operatorFirst[2] ?? '',
      operatorFirst[4],
    )
  }

  return null
}

function isUnsupportedPattern(query: string): boolean {
  return RANKING_PATTERN.test(query) || OR_PATTERN.test(query)
}

/**
 * Turns a natural-language query into comparison predicates, or a text
 * fallback. Never ranks or returns a static id list.
 */
export function parseNaturalLanguageQuery(raw: string): ParseResult {
  const query = raw.trim()
  if (query.length === 0) {
    return { kind: 'empty' }
  }

  if (isUnsupportedPattern(query)) {
    return { kind: 'text', query }
  }

  const clauses = query.split(/\s+and\s+/i)
  const filters: NumericPredicate[] = []

  for (const clause of clauses) {
    const trimmed = clause.trim()
    if (trimmed.length === 0) {
      return { kind: 'text', query }
    }
    const predicate = parseClause(trimmed)
    if (predicate === null) {
      return { kind: 'text', query }
    }
    filters.push(predicate)
  }

  return { kind: 'structured', filters }
}
