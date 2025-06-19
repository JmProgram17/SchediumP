import React, { forwardRef } from 'react'

export interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode
}

export const FormLabel = forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={`
          block text-sm font-medium text-gray-700 dark:text-gray-300
          mb-1
          ${className}
        `}
        {...props}
      >
        {children}
      </label>
    )
  }
)

FormLabel.displayName = 'FormLabel'

// Export as Label for backward compatibility
export const Label = FormLabel