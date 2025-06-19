// Typography tokens following SENA guidelines
export const typography = {
  // Font Families
  fontFamily: {
    sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
    mono: ['ui-monospace', 'SFMono-Regular', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
  },

  // Font Weights
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },

  // Font Sizes - Mobile First with Desktop scales
  fontSize: {
    xs: {
      size: '0.75rem',    // 12px
      lineHeight: '1rem', // 16px
      letterSpacing: '0.025em',
    },
    sm: {
      size: '0.875rem',   // 14px
      lineHeight: '1.25rem', // 20px
      letterSpacing: '0.025em',
    },
    base: {
      size: '1rem',       // 16px
      lineHeight: '1.5rem', // 24px
      letterSpacing: '0',
    },
    lg: {
      size: '1.125rem',   // 18px
      lineHeight: '1.75rem', // 28px
      letterSpacing: '-0.025em',
    },
    xl: {
      size: '1.25rem',    // 20px
      lineHeight: '1.75rem', // 28px
      letterSpacing: '-0.025em',
    },
    '2xl': {
      size: '1.5rem',     // 24px
      lineHeight: '2rem', // 32px
      letterSpacing: '-0.025em',
    },
    '3xl': {
      size: '1.875rem',   // 30px
      lineHeight: '2.25rem', // 36px
      letterSpacing: '-0.025em',
    },
    '4xl': {
      size: '2.25rem',    // 36px
      lineHeight: '2.5rem', // 40px
      letterSpacing: '-0.025em',
    },
    '5xl': {
      size: '3rem',       // 48px
      lineHeight: '1',
      letterSpacing: '-0.025em',
    },
    '6xl': {
      size: '3.75rem',    // 60px
      lineHeight: '1',
      letterSpacing: '-0.025em',
    },
  },

  // Semantic Typography Scales
  heading: {
    h1: {
      fontSize: '3rem',
      fontWeight: '700',
      lineHeight: '1.1',
      letterSpacing: '-0.025em',
      // Responsive
      mobile: {
        fontSize: '2.25rem',
        lineHeight: '1.1',
      },
    },
    h2: {
      fontSize: '2.25rem',
      fontWeight: '600',
      lineHeight: '1.2',
      letterSpacing: '-0.025em',
      mobile: {
        fontSize: '1.875rem',
        lineHeight: '1.2',
      },
    },
    h3: {
      fontSize: '1.875rem',
      fontWeight: '600',
      lineHeight: '1.3',
      letterSpacing: '-0.025em',
      mobile: {
        fontSize: '1.5rem',
        lineHeight: '1.3',
      },
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: '600',
      lineHeight: '1.4',
      letterSpacing: '-0.025em',
      mobile: {
        fontSize: '1.25rem',
        lineHeight: '1.4',
      },
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: '600',
      lineHeight: '1.5',
      letterSpacing: '0',
      mobile: {
        fontSize: '1.125rem',
        lineHeight: '1.5',
      },
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: '600',
      lineHeight: '1.5',
      letterSpacing: '0',
      mobile: {
        fontSize: '1rem',
        lineHeight: '1.5',
      },
    },
  },

  // Body Text
  body: {
    large: {
      fontSize: '1.125rem',
      fontWeight: '400',
      lineHeight: '1.7',
      letterSpacing: '0',
    },
    base: {
      fontSize: '1rem',
      fontWeight: '400',
      lineHeight: '1.6',
      letterSpacing: '0',
    },
    small: {
      fontSize: '0.875rem',
      fontWeight: '400',
      lineHeight: '1.5',
      letterSpacing: '0.025em',
    },
    xs: {
      fontSize: '0.75rem',
      fontWeight: '400',
      lineHeight: '1.4',
      letterSpacing: '0.025em',
    },
  },

  // Interactive Elements
  interactive: {
    button: {
      fontSize: '0.875rem',
      fontWeight: '500',
      lineHeight: '1.25rem',
      letterSpacing: '0.025em',
    },
    link: {
      fontSize: '1rem',
      fontWeight: '500',
      lineHeight: '1.5rem',
      letterSpacing: '0',
      textDecoration: 'underline',
      textUnderlineOffset: '2px',
    },
    label: {
      fontSize: '0.875rem',
      fontWeight: '500',
      lineHeight: '1.25rem',
      letterSpacing: '0.025em',
    },
  },

  // Utility Classes
  utility: {
    caption: {
      fontSize: '0.75rem',
      fontWeight: '400',
      lineHeight: '1rem',
      letterSpacing: '0.025em',
      color: 'var(--text-secondary)',
    },
    overline: {
      fontSize: '0.75rem',
      fontWeight: '600',
      lineHeight: '1rem',
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
    },
    code: {
      fontSize: '0.875rem',
      fontWeight: '400',
      lineHeight: '1.25rem',
      letterSpacing: '0',
      fontFamily: 'var(--font-mono)',
    },
  },
} as const

// Responsive typography utilities
export const responsiveTypography = {
  // Clamp function for fluid typography
  fluidScale: (minSize: number, maxSize: number, minViewport = 320, maxViewport = 1200) => {
    const slope = (maxSize - minSize) / (maxViewport - minViewport)
    const intersection = -minViewport * slope + minSize
    return `clamp(${minSize}rem, ${intersection}rem + ${slope * 100}vw, ${maxSize}rem)`
  },
  
  // Breakpoint-specific scales
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
} as const

export type TypographyScale = typeof typography