export const theme = {
  colors: {
    background: '#f3f5f2',
    backgroundAccent: '#e4ebe3',
    surface: '#ffffff',
    text: '#1c2420',
    textMuted: '#5c6b63',
    border: '#cfd8d2',
    brand: '#1f6b4a',
    brandSoft: '#d7eee3',
    focus: '#2a8f64',
    danger: '#9b2c2c',
    dangerSoft: '#fce8e8',
    flash: '#ffe08a',
    warning: '#b5811a',
    performance: {
      high: '#2f7d4a',
      medium: '#b5811a',
      low: '#b33a3a',
    },
  },
  fonts: {
    sans: '"IBM Plex Sans", "Segoe UI", sans-serif',
    mono: '"IBM Plex Mono", ui-monospace, monospace',
  },
  radii: {
    sm: '6px',
    md: '10px',
  },
  space: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '40px',
  },
  shadow: '0 10px 30px rgba(28, 36, 32, 0.08)',
} as const

export type AppTheme = typeof theme
