import type { AppTheme } from '@/shared/theme'

declare module 'styled-components' {
  export interface DefaultTheme extends AppTheme {
    readonly _staffPulseTheme?: true
  }
}
