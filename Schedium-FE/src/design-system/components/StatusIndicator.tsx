import React from 'react'

export interface StatusIndicatorProps {
  status: 'active' | 'inactive' | 'pending' | 'error' | 'success' | 'warning'
  label?: string
  showDot?: boolean
  className?: string
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  showDot = true,
  className = ''
}) => {
  const statusConfig = {
    active: {
      color: 'bg-green-500',
      textColor: 'text-green-800',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      label: label || 'Activo'
    },
    inactive: {
      color: 'bg-gray-500',
      textColor: 'text-gray-800',
      bgColor: 'bg-gray-100 dark:bg-gray-900/20',
      label: label || 'Inactivo'
    },
    pending: {
      color: 'bg-yellow-500',
      textColor: 'text-yellow-800',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
      label: label || 'Pendiente'
    },
    error: {
      color: 'bg-red-500',
      textColor: 'text-red-800',
      bgColor: 'bg-red-100 dark:bg-red-900/20',
      label: label || 'Error'
    },
    success: {
      color: 'bg-green-500',
      textColor: 'text-green-800',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      label: label || 'Éxito'
    },
    warning: {
      color: 'bg-orange-500',
      textColor: 'text-orange-800',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
      label: label || 'Advertencia'
    }
  }

  const config = statusConfig[status] || statusConfig.inactive

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor} ${className}`}>
      {showDot && (
        <span className={`w-2 h-2 rounded-full ${config.color} mr-2`} />
      )}
      {config.label}
    </span>
  )
}