import {
  PERFORMANCE_THRESHOLD_HIGH,
  PERFORMANCE_THRESHOLD_MEDIUM,
} from '@/shared/constants'

export type PerformanceLevel = 'high' | 'medium' | 'low'

export function getPerformanceLevel(performance: number): PerformanceLevel {
  if (performance >= PERFORMANCE_THRESHOLD_HIGH) {
    return 'high'
  }
  if (performance >= PERFORMANCE_THRESHOLD_MEDIUM) {
    return 'medium'
  }
  return 'low'
}
