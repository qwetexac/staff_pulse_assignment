import { BUDGET_CURRENCY_LABEL } from '@/shared/constants'

const budgetNumberFormat = new Intl.NumberFormat('ru-RU', {
  maximumFractionDigits: 0,
})

const performanceNumberFormat = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
})

const headcountNumberFormat = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
})

/** Thousands grouping plus currency label, e.g. `4 569 028 руб.`. */
export function formatBudget(amount: number): string {
  return `${budgetNumberFormat.format(amount)} ${BUDGET_CURRENCY_LABEL}`
}

export function formatHeadcount(value: number): string {
  return headcountNumberFormat.format(value)
}

export function formatAveragePerformance(value: number): string {
  return performanceNumberFormat.format(value)
}
