// Shadow tokens for depth and elevation
export const shadows = {
  // Elevation shadows
  none: 'none',
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  
  // Component-specific shadows
  button: {
    default: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    hover: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    active: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    focus: '0 0 0 3px rgb(59 130 246 / 0.15)',
  },
  
  card: {
    default: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    hover: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    elevated: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  },
  
  modal: {
    overlay: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    content: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },
  
  dropdown: {
    default: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  },
  
  tooltip: {
    default: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  },
} as const

// Focus ring shadows for accessibility
export const focusRings = {
  default: '0 0 0 3px rgb(59 130 246 / 0.15)',
  primary: '0 0 0 3px rgb(57 169 0 / 0.15)',   // SENA Green
  secondary: '0 0 0 3px rgb(255 107 0 / 0.15)', // SENA Orange
  success: '0 0 0 3px rgb(34 197 94 / 0.15)',
  warning: '0 0 0 3px rgb(245 158 11 / 0.15)',
  error: '0 0 0 3px rgb(239 68 68 / 0.15)',
  info: '0 0 0 3px rgb(59 130 246 / 0.15)',
} as const

// Dark theme shadows
export const darkShadows = {
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.3)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.4), 0 1px 2px -1px rgb(0 0 0 / 0.4)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.4)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.4)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.4), 0 8px 10px -6px rgb(0 0 0 / 0.4)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.6)',
} as const

// Glow effects for special elements
export const glowEffects = {
  primary: '0 0 20px rgb(57 169 0 / 0.3)',
  secondary: '0 0 20px rgb(255 107 0 / 0.3)',
  success: '0 0 20px rgb(34 197 94 / 0.3)',
  warning: '0 0 20px rgb(245 158 11 / 0.3)',
  error: '0 0 20px rgb(239 68 68 / 0.3)',
  info: '0 0 20px rgb(59 130 246 / 0.3)',
} as const

export type ShadowScale = typeof shadows
export type FocusRings = typeof focusRings