import React, { forwardRef } from 'react'

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`
          block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
          focus:outline-none focus:ring-primary-500 focus:border-primary-500
          bg-white text-gray-900
          disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200
          dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100
          dark:focus:ring-primary-400 dark:focus:border-primary-400
          ${className}
        `}
        {...props}
      >
        {children}
      </select>
    )
  }
)

Select.displayName = 'Select'