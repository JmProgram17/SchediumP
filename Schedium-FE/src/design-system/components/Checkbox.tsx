import React, { forwardRef } from 'react'

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = '', label, id, ...props }, ref) => {
    const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`

    return (
      <div className={`flex items-center ${className}`}>
        <input
          ref={ref}
          type="checkbox"
          id={checkboxId}
          className="
            h-4 w-4 text-primary-600 border-gray-300 rounded
            focus:ring-primary-500 focus:ring-2
            dark:border-gray-600 dark:bg-gray-800
            dark:focus:ring-primary-400
          "
          {...props}
        />
        {label && (
          <label 
            htmlFor={checkboxId}
            className="ml-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
          >
            {label}
          </label>
        )}
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'