import { useReducedMotion } from 'framer-motion'
import { useMemo } from 'react'
import { motionConfig } from './motion-config'
import type { Variants } from 'framer-motion'

/**
 * Hook for handling reduced motion preferences
 * Automatically adjusts animations based on user's accessibility settings
 */
export const useAnimationSettings = () => {
  const shouldReduceMotion = useReducedMotion()

  return useMemo(() => ({
    shouldReduceMotion,
    // Disable complex animations for reduced motion users
    animate: !shouldReduceMotion,
    // Use simpler transitions
    transition: shouldReduceMotion 
      ? { ...motionConfig.fast, duration: 0.1 }
      : motionConfig.transition,
    // Disable spring animations for reduced motion
    spring: shouldReduceMotion 
      ? motionConfig.fast 
      : motionConfig.spring,
  }), [shouldReduceMotion])
}

/**
 * Hook for page transition animations
 * Handles enter/exit animations for route changes
 */
export const usePageTransition = () => {
  const { shouldReduceMotion, transition } = useAnimationSettings()

  return useMemo(() => ({
    initial: shouldReduceMotion ? false : "hidden",
    animate: shouldReduceMotion ? false : "visible",
    exit: shouldReduceMotion ? false : "exit",
    transition,
    variants: shouldReduceMotion ? {} : {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
      exit: { opacity: 0 }
    }
  }), [shouldReduceMotion, transition])
}

/**
 * Hook for staggered list animations
 * Creates smooth reveal animations for lists of items
 */
export const useStaggerAnimation = (delay: number = 0.1) => {
  const { shouldReduceMotion } = useAnimationSettings()

  return useMemo(() => ({
    initial: shouldReduceMotion ? false : "hidden",
    animate: shouldReduceMotion ? false : "visible",
    variants: shouldReduceMotion ? {} : {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: delay,
          delayChildren: delay,
        }
      }
    }
  }), [shouldReduceMotion, delay])
}

/**
 * Hook for modal/dialog animations
 */
export const useModalAnimation = () => {
  const { shouldReduceMotion, spring } = useAnimationSettings()

  return useMemo(() => ({
    backdrop: {
      initial: shouldReduceMotion ? false : "hidden",
      animate: shouldReduceMotion ? false : "visible",
      exit: shouldReduceMotion ? false : "exit",
      variants: shouldReduceMotion ? {} : {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
        exit: { opacity: 0 }
      }
    },
    content: {
      initial: shouldReduceMotion ? false : "hidden",
      animate: shouldReduceMotion ? false : "visible",
      exit: shouldReduceMotion ? false : "exit",
      transition: spring,
      variants: shouldReduceMotion ? {} : {
        hidden: { scale: 0.9, opacity: 0 },
        visible: { scale: 1, opacity: 1 },
        exit: { scale: 0.9, opacity: 0 }
      }
    }
  }), [shouldReduceMotion, spring])
}

/**
 * Hook for hover animations on interactive elements
 */
export const useHoverAnimation = () => {
  const { shouldReduceMotion, transition } = useAnimationSettings()

  return useMemo(() => ({
    whileHover: shouldReduceMotion ? {} : { scale: 1.02 },
    whileTap: shouldReduceMotion ? {} : { scale: 0.98 },
    transition,
  }), [shouldReduceMotion, transition])
}

/**
 * Hook for form field animations
 * Includes focus states and error shaking
 */
export const useFieldAnimation = (hasError: boolean = false) => {
  const { shouldReduceMotion, transition } = useAnimationSettings()

  return useMemo(() => {
    if (shouldReduceMotion) {
      return { animate: false }
    }

    return {
      animate: hasError ? "error" : "rest",
      whileFocus: "focus",
      variants: {
        rest: { x: 0 },
        focus: { scale: 1.01 },
        error: {
          x: [-2, 2, -2, 2, 0],
          transition: { duration: 0.4 }
        }
      },
      transition,
    }
  }, [shouldReduceMotion, hasError, transition])
}

/**
 * Hook for loading animations
 */
export const useLoadingAnimation = () => {
  const { shouldReduceMotion } = useAnimationSettings()

  return useMemo(() => ({
    animate: shouldReduceMotion ? false : {
      opacity: [0.5, 1, 0.5],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  }), [shouldReduceMotion])
}

/**
 * Hook for notification/toast animations
 */
export const useToastAnimation = () => {
  const { shouldReduceMotion, spring } = useAnimationSettings()

  return useMemo(() => ({
    initial: shouldReduceMotion ? false : { x: '100%', opacity: 0 },
    animate: shouldReduceMotion ? false : { x: 0, opacity: 1 },
    exit: shouldReduceMotion ? false : { x: '100%', opacity: 0 },
    transition: spring,
  }), [shouldReduceMotion, spring])
}

/**
 * Hook for creating custom variants with reduced motion support
 */
export const useCustomVariants = (variants: Variants) => {
  const { shouldReduceMotion } = useAnimationSettings()

  return useMemo(() => {
    if (shouldReduceMotion) {
      // Return simplified variants for reduced motion
      return Object.keys(variants).reduce((acc, key) => {
        acc[key] = { opacity: key === 'hidden' ? 0 : 1 }
        return acc
      }, {} as Variants)
    }
    return variants
  }, [variants, shouldReduceMotion])
}

/**
 * Hook for performance-optimized animations
 * Automatically enables GPU acceleration for transform properties
 */
export const useOptimizedAnimation = () => {
  const { shouldReduceMotion } = useAnimationSettings()

  return useMemo(() => ({
    // Force GPU acceleration for better performance
    style: {
      willChange: shouldReduceMotion ? 'auto' : 'transform, opacity',
      backfaceVisibility: 'hidden' as const,
      perspective: 1000,
    },
    // Optimize for transforms
    layoutId: undefined, // Avoid layout animations unless specifically needed
    transformTemplate: ({ scale, x, y }: any) => 
      `translate3d(${x || 0}, ${y || 0}, 0) scale(${scale || 1})`,
  }), [shouldReduceMotion])
}