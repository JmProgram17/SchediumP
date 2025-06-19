import React from 'react'

export interface AlertProps {
  children: React.ReactNode
  variant?: 'info' | 'success' | 'warning' | 'error'
  className?: string
}

export const Alert: React.FC<AlertProps> = ({ 
  children, 
  variant = 'info', 
  className = '' 
}) => {
  const variantClasses = {
    info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300',
    success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300',
    error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'
  }

  return (
    <div
      className={`
        border rounded-lg p-4 flex items-start gap-3
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {children}
    </div>
  )
}