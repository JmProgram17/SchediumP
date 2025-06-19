// Motion configuration and presets for consistent animations across the app
import type { Transition, Variants } from 'framer-motion'

// Global animation configuration for performance
export const motionConfig = {
  // Reduce motion for users who prefer reduced motion
  respectsReducedMotion: true,
  
  // Default transition settings optimized for performance
  transition: {
    type: 'tween',
    ease: [0.25, 0.1, 0.25, 1], // Custom easing for SENA feel
    duration: 0.2,
  } as Transition,

  // Spring settings for interactive elements
  spring: {
    type: 'spring',
    stiffness: 100,
    damping: 10,
    mass: 0.5,
  } as Transition,

  // Faster transitions for micro-interactions
  fast: {
    type: 'tween',
    ease: 'easeOut',
    duration: 0.15,
  } as Transition,

  // Slower transitions for dramatic reveals
  slow: {
    type: 'tween',
    ease: 'easeInOut',
    duration: 0.4,
  } as Transition,
}

// Common animation variants
export const fadeIn: Variants = {
  hidden: { 
    opacity: 0,
    transition: motionConfig.transition
  },
  visible: { 
    opacity: 1,
    transition: motionConfig.transition
  },
  exit: {
    opacity: 0,
    transition: motionConfig.fast
  }
}

export const slideUp: Variants = {
  hidden: { 
    y: 20, 
    opacity: 0,
    transition: motionConfig.transition
  },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: motionConfig.transition
  },
  exit: {
    y: -20,
    opacity: 0,
    transition: motionConfig.fast
  }
}

export const slideDown: Variants = {
  hidden: { 
    y: -20, 
    opacity: 0,
    transition: motionConfig.transition
  },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: motionConfig.transition
  },
  exit: {
    y: 20,
    opacity: 0,
    transition: motionConfig.fast
  }
}

export const slideLeft: Variants = {
  hidden: { 
    x: 20, 
    opacity: 0,
    transition: motionConfig.transition
  },
  visible: { 
    x: 0, 
    opacity: 1,
    transition: motionConfig.transition
  },
  exit: {
    x: -20,
    opacity: 0,
    transition: motionConfig.fast
  }
}

export const slideRight: Variants = {
  hidden: { 
    x: -20, 
    opacity: 0,
    transition: motionConfig.transition
  },
  visible: { 
    x: 0, 
    opacity: 1,
    transition: motionConfig.transition
  },
  exit: {
    x: 20,
    opacity: 0,
    transition: motionConfig.fast
  }
}

export const scaleIn: Variants = {
  hidden: { 
    scale: 0.95, 
    opacity: 0,
    transition: motionConfig.transition
  },
  visible: { 
    scale: 1, 
    opacity: 1,
    transition: motionConfig.spring
  },
  exit: {
    scale: 0.95,
    opacity: 0,
    transition: motionConfig.fast
  }
}

export const scaleOut: Variants = {
  hidden: { 
    scale: 1.05, 
    opacity: 0,
    transition: motionConfig.transition
  },
  visible: { 
    scale: 1, 
    opacity: 1,
    transition: motionConfig.spring
  },
  exit: {
    scale: 1.05,
    opacity: 0,
    transition: motionConfig.fast
  }
}

// Container variants for staggered animations
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    }
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    }
  }
}

export const staggerItem: Variants = {
  hidden: { 
    y: 20, 
    opacity: 0,
    transition: motionConfig.fast
  },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: motionConfig.transition
  },
  exit: {
    y: -10,
    opacity: 0,
    transition: motionConfig.fast
  }
}

// Button and interactive element animations
export const buttonHover: Variants = {
  rest: { 
    scale: 1,
    transition: motionConfig.fast
  },
  hover: { 
    scale: 1.02,
    transition: motionConfig.fast
  },
  tap: { 
    scale: 0.98,
    transition: motionConfig.fast
  }
}

export const cardHover: Variants = {
  rest: { 
    y: 0,
    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
    transition: motionConfig.transition
  },
  hover: { 
    y: -2,
    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
    transition: motionConfig.transition
  }
}

// Navigation and page transitions
export const pageTransition: Variants = {
  hidden: { 
    opacity: 0, 
    x: -20,
    transition: motionConfig.transition
  },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: motionConfig.transition
  },
  exit: { 
    opacity: 0, 
    x: 20,
    transition: motionConfig.fast
  }
}

// Modal and overlay animations
export const modalBackdrop: Variants = {
  hidden: { 
    opacity: 0,
    transition: motionConfig.fast
  },
  visible: { 
    opacity: 1,
    transition: motionConfig.transition
  },
  exit: {
    opacity: 0,
    transition: motionConfig.fast
  }
}

export const modalContent: Variants = {
  hidden: { 
    scale: 0.8, 
    opacity: 0,
    y: 20,
    transition: motionConfig.fast
  },
  visible: { 
    scale: 1, 
    opacity: 1,
    y: 0,
    transition: motionConfig.spring
  },
  exit: {
    scale: 0.8,
    opacity: 0,
    y: 20,
    transition: motionConfig.fast
  }
}

// Loading and skeleton animations
export const pulse: Variants = {
  pulse: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
}

export const shimmer: Variants = {
  shimmer: {
    x: ['-100%', '100%'],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
}

// Notification animations
export const toast: Variants = {
  hidden: { 
    x: '100%', 
    opacity: 0,
    transition: motionConfig.fast
  },
  visible: { 
    x: 0, 
    opacity: 1,
    transition: motionConfig.spring
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: motionConfig.transition
  }
}

// Form field animations
export const fieldFocus: Variants = {
  rest: { 
    scale: 1,
    transition: motionConfig.fast
  },
  focus: { 
    scale: 1.01,
    transition: motionConfig.fast
  },
  error: {
    x: [-2, 2, -2, 2, 0],
    transition: {
      duration: 0.4,
      ease: "easeInOut"
    }
  }
}

// List item animations for CRUD operations
export const listItem: Variants = {
  hidden: { 
    opacity: 0, 
    height: 0,
    transition: motionConfig.transition
  },
  visible: { 
    opacity: 1, 
    height: 'auto',
    transition: motionConfig.transition
  },
  exit: { 
    opacity: 0, 
    height: 0,
    transition: motionConfig.transition
  }
}