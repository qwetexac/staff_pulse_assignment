import type { ComparisonOperator, NumericFilterField } from '@/table/tableQuery'

export const SEARCH_PLACEHOLDER =
  'performance below 60 and more than 50 people'

export const FIELD_ALIASES: Readonly<Record<string, NumericFilterField>> = {
  performance: 'performance',
  perf: 'performance',
  headcount: 'headcount',
  'head count': 'headcount',
  people: 'headcount',
  employees: 'headcount',
  staff: 'headcount',
  budget: 'budget',
}

export const OPERATOR_ALIASES: Readonly<Record<string, ComparisonOperator>> = {
  below: 'lt',
  under: 'lt',
  'less than': 'lt',
  'fewer than': 'lt',
  above: 'gt',
  over: 'gt',
  'more than': 'gt',
  'greater than': 'gt',
}

/** Longer phrases first so "less than" wins over a shorter token. */
export const FIELD_PATTERN =
  'performance|perf|head count|headcount|people|employees|staff|budget'

export const OPERATOR_PATTERN =
  'less than|fewer than|more than|greater than|below|under|above|over'

export const NUMBER_PATTERN =
  '\\$?\\d{1,3}(?:,\\d{3})+(?:\\.\\d+)?|\\$?\\d+(?:\\.\\d+)?'

export const OPTIONAL_UNIT_PATTERN = '%|percent|people|employees|staff|dollars'

export const RANKING_PATTERN = /\b(?:top|bottom)\s+\d+\b|\b(?:highest|lowest|best|worst)\b/i

export const OR_PATTERN = /\bor\b/i
