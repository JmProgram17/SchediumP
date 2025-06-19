// Design tokens index - Single source of truth for design system
import { colors, lightTheme, darkTheme } from './colors'
import { typography } from './typography'
import { spacing, componentSpacing, layoutSpacing } from './spacing'
import { shadows, focusRings } from './shadows'
import { borders } from './borders'

export { colors, lightTheme, darkTheme, type ThemeColors } from './colors'
export { typography, responsiveTypography, type TypographyScale } from './typography'
export { spacing, componentSpacing, layoutSpacing, responsiveSpacing, type SpacingScale } from './spacing'
export { shadows, focusRings, darkShadows, glowEffects, type ShadowScale } from './shadows'
export { borders, componentBorders, interactiveBorders, type BorderScale } from './borders'

// Combined design tokens
export const designTokens = {
  colors: colors,
  typography: typography,
  spacing: spacing,
  shadows: shadows,
  borders: borders,
  componentSpacing: componentSpacing,
  layoutSpacing: layoutSpacing,
  focusRings: focusRings,
} as const

// Theme definitions
export const themes = {
  light: lightTheme,
  dark: darkTheme,
} as const

export type Theme = 'light' | 'dark'
export type DesignTokens = typeof designTokens