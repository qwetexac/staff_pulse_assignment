import { BUDGET_CURRENCY_LABEL } from '@/shared/constants'

const budgetNumberFormat = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
})

const performanceNumberFormat = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
})

const headcountNumberFormat = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
})

/** Thousands grouping plus currency label, e.g. `$12,345,678`. */
export function formatBudget(amount: number): string {
  return `${BUDGET_CURRENCY_LABEL}${budgetNumberFormat.format(amount)}`
}

export function formatHeadcount(value: number): string {
  return headcountNumberFormat.format(value)
}

export function formatAveragePerformance(value: number): string {
  return performanceNumberFormat.format(value)
}
