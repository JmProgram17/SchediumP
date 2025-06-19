// Theme exports
export { ThemeProvider, useTheme } from './ThemeProvider'
export { ThemeToggle } from './ThemeToggle'

// Simple theme configuration
export const theme = {
  colors: {
    primary: '#3b82f6',
    secondary: '#64748b',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#06b6d4'
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem'
  }
}

export type Theme = typeof theme
export default theme