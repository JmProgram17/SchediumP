import { motion, AnimatePresence } from 'framer-motion'
import { forwardRef } from 'react'
import { cn } from '@/utils/cn'
import { 
  fadeIn, 
  slideUp, 
  slideDown, 
  slideLeft, 
  slideRight,
  scaleIn,
  staggerContainer,
  staggerItem,
  pageTransition,
  modalBackdrop,
  modalContent,
  buttonHover,
  cardHover
} from './motion-config'
import { useAnimationSettings } from './useMotion'

// Base animated container
interface AnimatedContainerProps {
  children: React.ReactNode
  className?: string
  animation?: 'fadeIn' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'scaleIn'
  duration?: number
  delay?: number
}

export const AnimatedContainer = forwardRef<HTMLDivElement, AnimatedContainerProps>(
  ({ children, className, animation = 'fadeIn', duration, delay, ...props }, ref) => {
    const { shouldReduceMotion, transition } = useAnimationSettings()

    const variants = {
      fadeIn,
      slideUp,
      slideDown,
      slideLeft,
      slideRight,
      scaleIn,
    }

    const customTransition = duration ? { ...transition, duration } : transition
    const delayedTransition = delay ? { ...customTransition, delay } : customTransition

    return (
      <motion.div
        ref={ref}
        className={className}
        initial={shouldReduceMotion ? undefined : "hidden"}
        animate={shouldReduceMotion ? undefined : "visible"}
        variants={shouldReduceMotion ? {} : variants[animation]}
        transition={delayedTransition}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)

AnimatedContainer.displayName = 'AnimatedContainer'

// Staggered list container
interface StaggeredListProps {
  children: React.ReactNode
  className?: string
  staggerDelay?: number
}

export const StaggeredList = forwardRef<HTMLDivElement, StaggeredListProps>(
  ({ children, className, staggerDelay = 0.1, ...props }, ref) => {
    const { shouldReduceMotion } = useAnimationSettings()

    return (
      <motion.div
        ref={ref}
        className={className}
        initial={shouldReduceMotion ? undefined : "hidden"}
        animate={shouldReduceMotion ? undefined : "visible"}
        variants={shouldReduceMotion ? {} : {
          ...staggerContainer,
          visible: {
            ...staggerContainer.visible,
            transition: {
              staggerChildren: staggerDelay,
              delayChildren: staggerDelay,
            }
          }
        }}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)

StaggeredList.displayName = 'StaggeredList'

// Staggered list item
interface StaggeredItemProps {
  children: React.ReactNode
  className?: string
}

export const StaggeredItem = forwardRef<HTMLDivElement, StaggeredItemProps>(
  ({ children, className, ...props }, ref) => {
    const { shouldReduceMotion } = useAnimationSettings()

    return (
      <motion.div
        ref={ref}
        className={className}
        variants={shouldReduceMotion ? {} : staggerItem}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)

StaggeredItem.displayName = 'StaggeredItem'

// Page transition wrapper
interface PageTransitionProps {
  children: React.ReactNode
  className?: string
}

export const PageTransition = forwardRef<HTMLDivElement, PageTransitionProps>(
  ({ children, className, ...props }, ref) => {
    const { shouldReduceMotion } = useAnimationSettings()

    return (
      <motion.div
        ref={ref}
        className={className}
        initial={shouldReduceMotion ? undefined : "hidden"}
        animate={shouldReduceMotion ? undefined : "visible"}
        exit={shouldReduceMotion ? undefined : "exit"}
        variants={shouldReduceMotion ? {} : pageTransition}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)

PageTransition.displayName = 'PageTransition'

// Animated button
interface AnimatedButtonProps {
  children: React.ReactNode
  className?: string
  variant?: 'hover' | 'scale' | 'none'
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  onFocus?: (event: React.FocusEvent<HTMLButtonElement>) => void
  onBlur?: (event: React.FocusEvent<HTMLButtonElement>) => void
  'aria-label'?: string
  'aria-describedby'?: string
  id?: string
  tabIndex?: number
}

export const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ children, className, variant = 'hover', onClick, disabled, type = 'button', onFocus, onBlur, ...rest }, ref) => {
    const { shouldReduceMotion } = useAnimationSettings()

    const getMotionProps = () => {
      if (shouldReduceMotion || variant === 'none') {
        return {}
      }

      switch (variant) {
        case 'hover':
          return {
            whileHover: { scale: 1.02 },
            whileTap: { scale: 0.98 },
            transition: { duration: 0.15 }
          }
        case 'scale':
          return {
            variants: buttonHover,
            initial: "rest",
            whileHover: "hover",
            whileTap: "tap"
          }
        default:
          return {}
      }
    }

    return (
      <motion.button
        ref={ref}
        className={className}
        onClick={onClick}
        disabled={disabled}
        type={type}
        onFocus={onFocus}
        onBlur={onBlur}
        {...rest}
        {...getMotionProps()}
      >
        {children}
      </motion.button>
    )
  }
)

AnimatedButton.displayName = 'AnimatedButton'

// Animated card
interface AnimatedCardProps {
  children: React.ReactNode
  className?: string
  enableHover?: boolean
}

export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ children, className, enableHover = true, ...props }, ref) => {
    const { shouldReduceMotion } = useAnimationSettings()

    return (
      <motion.div
        ref={ref}
        className={className}
        variants={shouldReduceMotion || !enableHover ? {} : cardHover}
        initial="rest"
        whileHover={shouldReduceMotion || !enableHover ? {} : "hover"}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)

AnimatedCard.displayName = 'AnimatedCard'

// Modal/Dialog backdrop and content
interface ModalBackdropProps {
  children: React.ReactNode
  className?: string
  isOpen: boolean
}

export const ModalBackdrop = ({ children, className, isOpen }: ModalBackdropProps) => {
  const { shouldReduceMotion } = useAnimationSettings()

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={cn('fixed inset-0 z-50', className)}
          initial={shouldReduceMotion ? false : "hidden"}
          animate={shouldReduceMotion ? false : "visible"}
          exit={shouldReduceMotion ? undefined : "exit"}
          variants={shouldReduceMotion ? {} : modalBackdrop}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

interface ModalContentProps {
  children: React.ReactNode
  className?: string
}

export const ModalContent = forwardRef<HTMLDivElement, ModalContentProps>(
  ({ children, className, ...props }, ref) => {
    const { shouldReduceMotion } = useAnimationSettings()

    return (
      <motion.div
        ref={ref}
        className={className}
        initial={shouldReduceMotion ? undefined : "hidden"}
        animate={shouldReduceMotion ? undefined : "visible"}
        exit={shouldReduceMotion ? undefined : "exit"}
        variants={shouldReduceMotion ? {} : modalContent}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)

ModalContent.displayName = 'ModalContent'

// Loading skeleton
interface LoadingSkeletonProps {
  className?: string
  lines?: number
}

export const LoadingSkeleton = ({ className, lines = 3 }: LoadingSkeletonProps) => {
  const { shouldReduceMotion } = useAnimationSettings()

  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <motion.div
          key={index}
          className="h-4 bg-gray-200 dark:bg-gray-700 rounded"
          animate={shouldReduceMotion ? {} : {
            opacity: [0.5, 1, 0.5],
          }}
          transition={shouldReduceMotion ? {} : {
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: index * 0.1
          }}
        />
      ))}
    </div>
  )
}

// Toast notification
interface ToastProps {
  children: React.ReactNode
  className?: string
  isVisible: boolean
}

export const Toast = ({ children, className, isVisible }: ToastProps) => {
  const { shouldReduceMotion } = useAnimationSettings()

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={cn('fixed top-4 right-4 z-50', className)}
          initial={shouldReduceMotion ? undefined : { x: '100%', opacity: 0 }}
          animate={shouldReduceMotion ? undefined : { x: 0, opacity: 1 }}
          exit={shouldReduceMotion ? undefined : { x: '100%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 15 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Collapsible content
interface CollapsibleProps {
  children: React.ReactNode
  isOpen: boolean
  className?: string
}

export const Collapsible = ({ children, isOpen, className }: CollapsibleProps) => {
  const { shouldReduceMotion } = useAnimationSettings()

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          className={className}
          initial={shouldReduceMotion ? undefined : { height: 0, opacity: 0 }}
          animate={shouldReduceMotion ? undefined : { height: 'auto', opacity: 1 }}
          exit={shouldReduceMotion ? undefined : { height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          style={{ overflow: 'hidden' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Form field with error animation
interface AnimatedFieldProps {
  children: React.ReactNode
  className?: string
  hasError?: boolean
}

export const AnimatedField = forwardRef<HTMLDivElement, AnimatedFieldProps>(
  ({ children, className, hasError = false, ...props }, ref) => {
    const { shouldReduceMotion } = useAnimationSettings()

    return (
      <motion.div
        ref={ref}
        className={className}
        animate={shouldReduceMotion ? false : hasError ? {
          x: [-2, 2, -2, 2, 0],
        } : {}}
        transition={shouldReduceMotion ? {} : {
          duration: 0.4,
          ease: "easeInOut"
        }}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)

AnimatedField.displayName = 'AnimatedField'