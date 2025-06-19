import React from 'react'

export interface ProgressProps {
  value: number
  max?: number
  className?: string
  showValue?: boolean
}

export const Progress: React.FC<ProgressProps> = ({ 
  value, 
  max = 100, 
  className = '',
  showValue = false
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div className={`w-full ${className}`}>
      <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
        <div 
          className="bg-primary-600 h-2 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showValue && (
        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {Math.round(percentage)}%
        </div>
      )}
    </div>
  )
}