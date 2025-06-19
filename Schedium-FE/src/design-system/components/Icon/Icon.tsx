import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/utils/cn'

const iconVariants = cva(
  'inline-block shrink-0',
  {
    variants: {
      size: {
        xs: 'h-3 w-3',
        sm: 'h-4 w-4',
        md: 'h-5 w-5',
        lg: 'h-6 w-6',
        xl: 'h-8 w-8',
        '2xl': 'h-10 w-10',
      },
      color: {
        current: 'text-current',
        primary: 'text-primary-600 dark:text-primary-400',
        secondary: 'text-secondary-600 dark:text-secondary-400',
        success: 'text-success-600 dark:text-success-400',
        warning: 'text-warning-600 dark:text-warning-400',
        error: 'text-error-600 dark:text-error-400',
        muted: 'text-gray-500 dark:text-gray-400',
      },
    },
    defaultVariants: {
      size: 'md',
      color: 'current',
    },
  }
)

export interface IconProps extends VariantProps<typeof iconVariants> {
  children: React.ReactNode
  className?: string
}

export const Icon = forwardRef<SVGSVGElement, IconProps>(
  ({ children, size, color, className, ...props }, ref) => {
    return (
      <svg
        ref={ref}
        className={cn(iconVariants({ size, color }), className)}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        {...props}
      >
        {children}
      </svg>
    )
  }
)

Icon.displayName = 'Icon'