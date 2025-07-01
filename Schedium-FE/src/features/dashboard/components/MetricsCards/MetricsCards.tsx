/**
 * MetricsCards Component - Advanced KPI Cards for Dashboard
 */

import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, Typography } from '@/design-system/components'

interface MetricCardProps {
  title: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon: string
  description?: string
  loading?: boolean
}

interface MetricsCardsProps {
  className?: string
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  description,
  loading = false
}) => {
  const getChangeColor = () => {
    switch (changeType) {
      case 'positive':
        return 'text-green-600 dark:text-green-400'
      case 'negative':
        return 'text-red-600 dark:text-red-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  const getIconBackground = () => {
    switch (changeType) {
      case 'positive':
        return 'bg-green-100 dark:bg-green-900/30'
      case 'negative':
        return 'bg-red-100 dark:bg-red-900/30'
      default:
        return 'bg-blue-100 dark:bg-blue-900/30'
    }
  }

  if (loading) {
    return (
      <Card variant="elevated" className="h-32">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
            <div className="w-20 h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="w-32 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card variant="elevated" className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-lg ${getIconBackground()} group-hover:scale-110 transition-transform duration-200`}>
            <span className="text-2xl">{icon}</span>
          </div>
          {change && (
            <div className={`text-sm font-semibold ${getChangeColor()}`}>
              {changeType === 'positive' && '+'}
              {change}
            </div>
          )}
        </div>
        
        <div className="space-y-1">
          <Typography variant="h2" className="text-gray-900 dark:text-gray-100 text-2xl font-bold">
            {value}
          </Typography>
          <Typography variant="body" className="text-gray-600 dark:text-gray-400 font-medium">
            {title}
          </Typography>
          {description && (
            <Typography variant="caption" className="text-gray-500 dark:text-gray-500">
              {description}
            </Typography>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({ className = '' }) => {
  // Mock data - esto se reemplazará con datos reales de la API
  const metrics = [
    {
      title: 'Ocupación General',
      value: '78%',
      change: '+5%',
      changeType: 'positive' as const,
      icon: '📊',
      description: 'vs. semana anterior'
    },
    {
      title: 'Ambientes Activos',
      value: '42',
      change: '89%',
      changeType: 'positive' as const,
      icon: '🏫',
      description: 'de 47 disponibles'
    },
    {
      title: 'Instructores en Clase',
      value: '28',
      change: '↔️',
      changeType: 'neutral' as const,
      icon: '👨‍🏫',
      description: 'ahora mismo'
    },
    {
      title: 'Conflictos Detectados',
      value: '3',
      change: '-2',
      changeType: 'positive' as const,
      icon: '⚠️',
      description: 'pendientes por resolver'
    }
  ]

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      {metrics.map((metric, index) => (
        <motion.div
          key={metric.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <MetricCard {...metric} />
        </motion.div>
      ))}
    </div>
  )
}

export default MetricsCards