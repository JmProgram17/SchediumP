import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/utils/cn'
import { AnimatedButton } from '../../animations/AnimatedComponents'

const buttonVariants = cva(
  // Base styles
  [
    'inline-flex items-center justify-center',
    'rounded-md font-medium transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'active:scale-95',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-primary-500 text-white shadow-sm',
          'hover:bg-primary-600 focus:ring-primary-500',
          'dark:bg-primary-400 dark:hover:bg-primary-300 dark:text-gray-900',
        ],
        secondary: [
          'bg-secondary-500 text-white shadow-sm',
          'hover:bg-secondary-600 focus:ring-secondary-500',
          'dark:bg-secondary-400 dark:hover:bg-secondary-300 dark:text-gray-900',
        ],
        outline: [
          'border border-gray-300 bg-white text-gray-700 shadow-sm',
          'hover:bg-gray-50 focus:ring-primary-500',
          'dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300',
          'dark:hover:bg-gray-700',
        ],
        ghost: [
          'text-gray-700 hover:bg-gray-100 focus:ring-primary-500',
          'dark:text-gray-300 dark:hover:bg-gray-800',
        ],
        link: [
          'text-primary-500 underline-offset-4 hover:underline',
          'focus:ring-primary-500 dark:text-primary-400',
        ],
        destructive: [
          'bg-error-500 text-white shadow-sm',
          'hover:bg-error-600 focus:ring-error-500',
        ],
      },
      size: {
        xs: 'h-7 px-2 text-xs',
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        xl: 'h-14 px-8 text-lg',
      },
      fullWidth: {
        true: 'w-full',
        false: 'w-auto',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  children: ReactNode
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      loading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading

    return (
      <AnimatedButton
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        variant={isDisabled ? 'none' : 'hover'}
        {...props}
      >
        {loading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        
        {!loading && leftIcon && (
          <span className="mr-2 flex-shrink-0">{leftIcon}</span>
        )}
        
        <span className={loading ? 'opacity-70' : ''}>{children}</span>
        
        {!loading && rightIcon && (
          <span className="ml-2 flex-shrink-0">{rightIcon}</span>
        )}
      </AnimatedButton>
    )
  }
)

Button.displayName = 'Button'