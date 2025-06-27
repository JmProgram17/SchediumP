import { forwardRef, InputHTMLAttributes, ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/utils/cn'

const inputVariants = cva(
  [
    'flex w-full rounded-md border bg-white px-3 py-2',
    'text-sm text-gray-900 placeholder:text-gray-400',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'transition-colors duration-200',
    'dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500',
  ],
  {
    variants: {
      variant: {
        default: [
          'border-gray-300 focus:border-primary-500 focus:ring-primary-500',
          'dark:border-gray-600 dark:focus:border-primary-400',
        ],
        error: [
          'border-error-500 focus:border-error-500 focus:ring-error-500',
          'dark:border-error-400',
        ],
        success: [
          'border-success-500 focus:border-success-500 focus:ring-success-500',
          'dark:border-success-400',
        ],
      },
      size: {
        sm: 'h-8 px-2 text-xs',
        md: 'h-10 px-3 text-sm',
        lg: 'h-12 px-4 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  label?: string
  description?: string
  error?: string
  success?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  required?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant,
      size,
      label,
      description,
      error,
      success,
      leftIcon,
      rightIcon,
      required,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`
    const descriptionId = description ? `${inputId}-description` : undefined
    const errorId = error ? `${inputId}-error` : undefined
    const successId = success ? `${inputId}-success` : undefined

    // Determine variant based on error/success state
    const currentVariant = error ? 'error' : success ? 'success' : variant

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
            {required && (
              <span className="ml-1 text-error-500" aria-label="required">
                *
              </span>
            )}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <span className="text-gray-400 dark:text-gray-500">
                {leftIcon}
              </span>
            </div>
          )}
          
          <input
            ref={ref}
            id={inputId}
            type={props.type || "text"}
            required={required}
            aria-required={required}
            aria-disabled={props.disabled}
            className={cn(
              inputVariants({ variant: currentVariant, size }),
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            aria-describedby={cn(
              descriptionId,
              errorId,
              successId
            )}
            aria-invalid={error ? 'true' : 'false'}
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <span className="text-gray-400 dark:text-gray-500">
                {rightIcon}
              </span>
            </div>
          )}
        </div>
        
        {description && !error && !success && (
          <p
            id={descriptionId}
            className="mt-1 text-xs text-gray-500 dark:text-gray-400"
          >
            {description}
          </p>
        )}
        
        {error && (
          <p
            id={errorId}
            className="mt-1 text-xs text-error-600 dark:text-error-400"
            role="alert"
          >
            {error}
          </p>
        )}
        
        {success && !error && (
          <p
            id={successId}
            className="mt-1 text-xs text-success-600 dark:text-success-400"
          >
            {success}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'