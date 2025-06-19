/**
 * EmptyState Component - Reusable empty state with actions
 * Provides consistent empty state UX across all list views
 */

import React from 'react'
import { Plus, Search, FileX, Database } from 'lucide-react'

import { Button } from '../Button'
import { Card, CardContent } from '../Card'

export interface EmptyStateProps {
  title: string
  description: string
  icon?: React.ReactNode
  action?: {
    label: string
    onClick: () => void
    icon?: React.ReactNode
  }
  variant?: 'default' | 'search' | 'error'
  className?: string
}

const variantConfig = {
  default: {
    icon: Database,
    iconColor: 'text-gray-400',
    titleColor: 'text-gray-900',
    descriptionColor: 'text-gray-600'
  },
  search: {
    icon: Search,
    iconColor: 'text-gray-400',
    titleColor: 'text-gray-900',
    descriptionColor: 'text-gray-600'
  },
  error: {
    icon: FileX,
    iconColor: 'text-red-400',
    titleColor: 'text-red-600',
    descriptionColor: 'text-red-500'
  }
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  variant = 'default',
  className
}) => {
  const config = variantConfig[variant]
  const IconComponent = config.icon

  return (
    <Card className={className}>
      <CardContent className="p-12">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-6">
            {icon || <IconComponent className={`w-8 h-8 ${config.iconColor}`} />}
          </div>
          
          <h3 className={`text-lg font-medium mb-2 ${config.titleColor}`}>
            {title}
          </h3>
          
          <p className={`text-sm mb-6 max-w-sm mx-auto ${config.descriptionColor}`}>
            {description}
          </p>
          
          {action && (
            <Button onClick={action.onClick} className="inline-flex items-center">
              {action.icon || <Plus className="w-4 h-4 mr-2" />}
              {action.label}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}