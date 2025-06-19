// Spacing tokens following 8px grid system
export const spacing = {
  // Base spacing scale (8px grid)
  0: '0',
  px: '1px',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  3.5: '0.875rem',  // 14px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  7: '1.75rem',     // 28px
  8: '2rem',        // 32px
  9: '2.25rem',     // 36px
  10: '2.5rem',     // 40px
  11: '2.75rem',    // 44px
  12: '3rem',       // 48px
  14: '3.5rem',     // 56px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
  28: '7rem',       // 112px
  32: '8rem',       // 128px
  36: '9rem',       // 144px
  40: '10rem',      // 160px
  44: '11rem',      // 176px
  48: '12rem',      // 192px
  52: '13rem',      // 208px
  56: '14rem',      // 224px
  60: '15rem',      // 240px
  64: '16rem',      // 256px
  72: '18rem',      // 288px
  80: '20rem',      // 320px
  96: '24rem',      // 384px
} as const

// Semantic spacing for components
export const componentSpacing = {
  // Container spacing
  container: {
    xs: spacing[4],   // 16px
    sm: spacing[6],   // 24px
    md: spacing[8],   // 32px
    lg: spacing[12],  // 48px
    xl: spacing[16],  // 64px
  },
  
  // Section spacing
  section: {
    xs: spacing[8],   // 32px
    sm: spacing[12],  // 48px
    md: spacing[16],  // 64px
    lg: spacing[20],  // 80px
    xl: spacing[24],  // 96px
  },
  
  // Component internal spacing
  component: {
    xs: spacing[1],   // 4px
    sm: spacing[2],   // 8px
    md: spacing[3],   // 12px
    lg: spacing[4],   // 16px
    xl: spacing[6],   // 24px
  },
  
  // Interactive element spacing
  interactive: {
    xs: spacing[1.5], // 6px
    sm: spacing[2.5], // 10px
    md: spacing[3],   // 12px
    lg: spacing[4],   // 16px
    xl: spacing[5],   // 20px
  },
} as const

// Layout spacing
export const layoutSpacing = {
  // Page margins
  pageMargin: {
    mobile: spacing[4],  // 16px
    tablet: spacing[6],  // 24px
    desktop: spacing[8], // 32px
  },
  
  // Grid gaps
  gridGap: {
    xs: spacing[2],   // 8px
    sm: spacing[4],   // 16px
    md: spacing[6],   // 24px
    lg: spacing[8],   // 32px
    xl: spacing[12],  // 48px
  },
  
  // Navigation spacing
  nav: {
    height: spacing[16],     // 64px
    padding: spacing[4],     // 16px
    itemGap: spacing[6],     // 24px
  },
  
  // Form spacing
  form: {
    fieldGap: spacing[4],    // 16px
    sectionGap: spacing[8],  // 32px
    buttonGap: spacing[3],   // 12px
  },
} as const

// Responsive spacing utilities
export const responsiveSpacing = {
  // Responsive scale multipliers
  scale: {
    mobile: 1,
    tablet: 1.25,
    desktop: 1.5,
  },
  
  // Breakpoint-specific spacing
  breakpoints: {
    sm: '640px',
    md: '768px', 
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
} as const

export type SpacingScale = typeof spacing
export type ComponentSpacing = typeof componentSpacing