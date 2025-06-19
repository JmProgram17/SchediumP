// SENA Brand Colors - Based on official SENA guidelines
export const colors = {
  // SENA Primary Colors
  sena: {
    green: {
      50: '#f0fdf0',
      100: '#dcfcdc',
      200: '#bbf7bb',
      300: '#86ef86',
      400: '#4ade4a',
      500: '#39A900', // SENA Primary Green
      600: '#2e8700',
      700: '#236500',
      800: '#1a4d00',
      900: '#143d00',
      950: '#052e00',
    },
    orange: {
      50: '#fff7ed',
      100: '#ffedd5',
      200: '#fed7aa',
      300: '#fdba74',
      400: '#fb923c',
      500: '#FF6B00', // SENA Secondary Orange
      600: '#ea580c',
      700: '#c2410c',
      800: '#9a3412',
      900: '#7c2d12',
      950: '#431407',
    },
  },

  // Semantic Colors
  semantic: {
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
      950: '#052e16',
    },
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
      950: '#451a03',
    },
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
      950: '#450a0a',
    },
    info: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554',
    },
  },

  // Neutral Colors
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0a0a0a',
  },

  // Background Colors
  background: {
    light: '#ffffff',
    subtle: '#fafafa',
    muted: '#f5f5f5',
    dark: '#0a0a0a',
    darkSubtle: '#171717',
    darkMuted: '#262626',
  },

  // Text Colors
  text: {
    primary: '#171717',
    secondary: '#525252',
    tertiary: '#737373',
    inverse: '#ffffff',
    disabled: '#a3a3a3',
    link: '#2563eb',
    linkHover: '#1d4ed8',
  },

  // Border Colors
  border: {
    light: '#e5e5e5',
    medium: '#d4d4d4',
    strong: '#a3a3a3',
    inverse: '#404040',
  },
} as const

// Theme-specific color mappings
export const lightTheme: ThemeColors = {
  primary: colors.sena.green[500],
  primaryHover: colors.sena.green[600],
  primaryActive: colors.sena.green[700],
  secondary: colors.sena.orange[500],
  secondaryHover: colors.sena.orange[600],
  secondaryActive: colors.sena.orange[700],
  
  background: colors.background.light,
  backgroundSubtle: colors.background.subtle,
  backgroundMuted: colors.background.muted,
  
  text: colors.text.primary,
  textSecondary: colors.text.secondary,
  textTertiary: colors.text.tertiary,
  textInverse: colors.text.inverse,
  
  border: colors.border.light,
  borderMedium: colors.border.medium,
  borderStrong: colors.border.strong,
  
  success: colors.semantic.success[500],
  warning: colors.semantic.warning[500],
  error: colors.semantic.error[500],
  info: colors.semantic.info[500],
} as const

export const darkTheme: ThemeColors = {
  primary: colors.sena.green[400],
  primaryHover: colors.sena.green[300],
  primaryActive: colors.sena.green[200],
  secondary: colors.sena.orange[400],
  secondaryHover: colors.sena.orange[300],
  secondaryActive: colors.sena.orange[200],
  
  background: colors.background.dark,
  backgroundSubtle: colors.background.darkSubtle,
  backgroundMuted: colors.background.darkMuted,
  
  text: colors.text.inverse,
  textSecondary: colors.neutral[300],
  textTertiary: colors.neutral[400],
  textInverse: colors.text.primary,
  
  border: colors.border.inverse,
  borderMedium: colors.neutral[600],
  borderStrong: colors.neutral[500],
  
  success: colors.semantic.success[400],
  warning: colors.semantic.warning[400],
  error: colors.semantic.error[400],
  info: colors.semantic.info[400],
} as const

// Define the shape of theme colors
export interface ThemeColors {
  primary: string
  primaryHover: string
  primaryActive: string
  secondary: string
  secondaryHover: string
  secondaryActive: string
  background: string
  backgroundSubtle: string
  backgroundMuted: string
  text: string
  textSecondary: string
  textTertiary: string
  textInverse: string
  border: string
  borderMedium: string
  borderStrong: string
  success: string
  warning: string
  error: string
  info: string
}