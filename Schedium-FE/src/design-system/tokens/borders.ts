// Border tokens for consistency
export const borders = {
  // Border widths
  width: {
    0: '0',
    1: '1px',
    2: '2px',
    4: '4px',
    8: '8px',
  },
  
  // Border radius
  radius: {
    none: '0',
    xs: '0.125rem',   // 2px
    sm: '0.25rem',    // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    '3xl': '1.5rem',  // 24px
    full: '9999px',
  },
  
  // Border styles
  style: {
    solid: 'solid',
    dashed: 'dashed',
    dotted: 'dotted',
    double: 'double',
    none: 'none',
  },
} as const

// Component-specific border configurations
export const componentBorders = {
  // Input elements
  input: {
    default: {
      width: borders.width[1],
      style: borders.style.solid,
      radius: borders.radius.md,
    },
    focus: {
      width: borders.width[2],
      style: borders.style.solid,
      radius: borders.radius.md,
    },
    error: {
      width: borders.width[1],
      style: borders.style.solid,
      radius: borders.radius.md,
    },
  },
  
  // Button elements
  button: {
    default: {
      width: borders.width[1],
      style: borders.style.solid,
      radius: borders.radius.md,
    },
    rounded: {
      width: borders.width[1],
      style: borders.style.solid,
      radius: borders.radius.full,
    },
  },
  
  // Card elements
  card: {
    default: {
      width: borders.width[1],
      style: borders.style.solid,
      radius: borders.radius.lg,
    },
    elevated: {
      width: borders.width[0],
      style: borders.style.none,
      radius: borders.radius.xl,
    },
  },
  
  // Modal elements
  modal: {
    default: {
      width: borders.width[0],
      style: borders.style.none,
      radius: borders.radius['2xl'],
    },
  },
  
  // Divider elements
  divider: {
    horizontal: {
      width: borders.width[1],
      style: borders.style.solid,
      radius: borders.radius.none,
    },
    vertical: {
      width: borders.width[1],
      style: borders.style.solid,
      radius: borders.radius.none,
    },
  },
} as const

// Interactive state borders
export const interactiveBorders = {
  default: {
    width: borders.width[1],
    style: borders.style.solid,
  },
  hover: {
    width: borders.width[1],
    style: borders.style.solid,
  },
  focus: {
    width: borders.width[2],
    style: borders.style.solid,
  },
  active: {
    width: borders.width[1],
    style: borders.style.solid,
  },
  disabled: {
    width: borders.width[1],
    style: borders.style.dashed,
  },
} as const

export type BorderScale = typeof borders
export type ComponentBorders = typeof componentBorders