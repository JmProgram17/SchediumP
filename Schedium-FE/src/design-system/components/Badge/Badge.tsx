import { forwardRef, HTMLAttributes, ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/utils/cn'

const badgeVariants = cva(
  [
    'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5',
    'text-xs font-semibold transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  ],
  {
    variants: {
      variant: {
        default: [
          'border-transparent bg-gray-100 text-gray-900',
          'dark:bg-gray-800 dark:text-gray-100',
        ],
        primary: [
          'border-transparent bg-primary-100 text-primary-900',
          'dark:bg-primary-900 dark:text-primary-100',
        ],
        secondary: [
          'border-transparent bg-secondary-100 text-secondary-900',
          'dark:bg-secondary-900 dark:text-secondary-100',
        ],
        success: [
          'border-transparent bg-success-100 text-success-900',
          'dark:bg-success-900 dark:text-success-100',
        ],
        warning: [
          'border-transparent bg-warning-100 text-warning-900',
          'dark:bg-warning-900 dark:text-warning-100',
        ],
        error: [
          'border-transparent bg-error-100 text-error-900',
          'dark:bg-error-900 dark:text-error-100',
        ],
        info: [
          'border-transparent bg-info-100 text-info-900',
          'dark:bg-info-900 dark:text-info-100',
        ],
        outline: [
          'border-gray-300 bg-transparent text-gray-700',
          'dark:border-gray-600 dark:text-gray-300',
        ],
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

export interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  children: ReactNode
  dot?: boolean
  removable?: boolean
  onRemove?: () => void
}

export const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  (
    {
      className,
      variant,
      size,
      children,
      dot = false,
      removable = false,
      onRemove,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant, size }), className)}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              'h-2 w-2 rounded-full',
              variant === 'primary' && 'bg-primary-500',
              variant === 'secondary' && 'bg-secondary-500',
              variant === 'success' && 'bg-success-500',
              variant === 'warning' && 'bg-warning-500',
              variant === 'error' && 'bg-error-500',
              variant === 'info' && 'bg-info-500',
              (variant === 'default' || variant === 'outline') && 'bg-gray-500'
            )}
          />
        )}
        
        <span>{children}</span>
        
        {removable && onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className={cn(
              'ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full',
              'hover:bg-black/10 focus:bg-black/10 focus:outline-none',
              'dark:hover:bg-white/10 dark:focus:bg-white/10'
            )}
            aria-label="Remove badge"
          >
            <svg
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    )
  }
)

Badge.displayName = 'Badge'