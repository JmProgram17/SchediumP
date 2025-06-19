/**
 * LoadingSpinner Component
 * Professional loading indicator with multiple sizes and variants
 */

import React from 'react'
import { motion } from 'framer-motion'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/utils/cn'

const spinnerVariants = cva(
  "animate-spin rounded-full border-solid border-current",
  {
    variants: {
      size: {
        sm: "h-4 w-4 border-2",
        md: "h-6 w-6 border-2",
        lg: "h-8 w-8 border-3",
        xl: "h-12 w-12 border-4"
      },
      variant: {
        default: "border-gray-300 border-t-blue-600",
        primary: "border-blue-200 border-t-blue-600",
        secondary: "border-gray-200 border-t-gray-600",
        success: "border-green-200 border-t-green-600",
        warning: "border-yellow-200 border-t-yellow-600",
        danger: "border-red-200 border-t-red-600"
      }
    },
    defaultVariants: {
      size: "md",
      variant: "default"
    }
  }
)

export interface LoadingSpinnerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onAnimationStart' | 'onDragStart' | 'onDrag' | 'onDragEnd'>,
    VariantProps<typeof spinnerVariants> {
  label?: string
  center?: boolean
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size,
  variant,
  label = "Loading...",
  center = false,
  className,
  ...props
}) => {
  const spinnerElement = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(spinnerVariants({ size, variant }), className)}
      role="status"
      aria-label={label}
      {...props}
    >
      <span className="sr-only">{label}</span>
    </motion.div>
  )

  if (center) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        {spinnerElement}
      </div>
    )
  }

  return spinnerElement
}