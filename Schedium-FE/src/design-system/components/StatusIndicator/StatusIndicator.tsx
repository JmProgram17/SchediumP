/**
 * StatusIndicator Component - Reusable status display with consistent styling
 * Provides standardized status visualization across all modules
 */

import React from 'react'
import { CheckCircle, XCircle, AlertCircle, Clock, Minus } from 'lucide-react'

import { Badge } from '../Badge'

export type StatusType = 'active' | 'inactive' | 'pending' | 'success' | 'error' | 'warning' | 'neutral'

export interface StatusIndicatorProps {
  status: StatusType | string
  label?: string
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'badge' | 'dot' | 'text'
  customConfig?: Record<string, {
    variant: 'success' | 'destructive' | 'warning' | 'secondary' | 'outline'
    icon?: React.ReactNode
    label?: string
  }>
  className?: string
}

const defaultStatusConfig = {
  active: {
    variant: 'success' as const,
    icon: CheckCircle,
    label: 'Activo'
  },
  inactive: {
    variant: 'secondary' as const,
    icon: XCircle,
    label: 'Inactivo'
  },
  pending: {
    variant: 'warning' as const,
    icon: Clock,
    label: 'Pendiente'
  },
  success: {
    variant: 'success' as const,
    icon: CheckCircle,
    label: 'Exitoso'
  },
  error: {
    variant: 'destructive' as const,
    icon: XCircle,
    label: 'Error'
  },
  warning: {
    variant: 'warning' as const,
    icon: AlertCircle,
    label: 'Advertencia'
  },
  neutral: {
    variant: 'outline' as const,
    icon: Minus,
    label: 'Neutral'
  }
}

const sizeClasses = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5'
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  showIcon = true,
  size = 'sm',
  variant = 'badge',
  customConfig,
  className
}) => {
  const statusConfig = customConfig || defaultStatusConfig
  const config = (statusConfig as any)[status] || statusConfig.neutral
  
  const finalLabel = label || config.label || status
  const IconComponent = config.icon

  if (variant === 'dot') {
    const dotColors = {
      success: 'bg-green-400',
      destructive: 'bg-red-400',
      warning: 'bg-yellow-400',
      secondary: 'bg-gray-400',
      outline: 'bg-gray-300'
    }

    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className={`rounded-full ${sizeClasses[size]} ${(dotColors as any)[config.variant]}`} />
        <span className="text-sm text-gray-700">{finalLabel}</span>
      </div>
    )
  }

  if (variant === 'text') {
    const textColors = {
      success: 'text-green-600',
      destructive: 'text-red-600',
      warning: 'text-yellow-600',
      secondary: 'text-gray-600',
      outline: 'text-gray-500'
    }

    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {showIcon && IconComponent && (
          <IconComponent className={`${sizeClasses[size]} ${(textColors as any)[config.variant]}`} />
        )}
        <span className={`text-sm font-medium ${(textColors as any)[config.variant]}`}>
          {finalLabel}
        </span>
      </div>
    )
  }

  // Default badge variant
  return (
    <Badge 
      variant={config.variant} 
      size={size} 
      className={`inline-flex items-center gap-1 ${className}`}
    >
      {showIcon && IconComponent && (
        <IconComponent className={sizeClasses[size]} />
      )}
      {finalLabel}
    </Badge>
  )
}