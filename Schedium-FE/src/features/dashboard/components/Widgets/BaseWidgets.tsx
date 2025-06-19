/**
 * Base Widgets - Core widget implementations for the dashboard
 * Provides essential widgets for analytics, monitoring, and scheduling
 */

import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar, 
  AlertTriangle, 
  Activity,
  BarChart3,
  PieChart,
  Clock,
  RefreshCw,
  ExternalLink,
  Settings
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/design-system/components/Card'
import { Button } from '@/design-system/components/Button'
import { Badge } from '@/design-system/components/Badge'
import { LoadingSpinner } from '@/design-system/components/LoadingSpinner'
import { Progress } from '@/design-system/components/Progress'

import { WidgetProps, WidgetConfigProps, WidgetDefinition, createWidgetDefinition } from './WidgetRegistry'

// Metric Widget - Displays single numerical value with trend
export const MetricWidget: React.FC<WidgetProps> = ({ 
  widget, 
  data, 
  isLoading, 
  error, 
  onRefresh 
}) => {
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable')
  
  const formatValue = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
    return value.toString()
  }

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'down': return <TrendingDown className="w-4 h-4 text-red-500" />
      default: return <Activity className="w-4 h-4 text-gray-500" />
    }
  }

  useEffect(() => {
    if (data?.trend) {
      setTrend(data.trend)
    }
  }, [data])

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
          {onRefresh && (
            <Button variant="ghost" size="sm" onClick={onRefresh}>
              <RefreshCw className="w-3 h-3" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-16">
            <LoadingSpinner size="sm" />
          </div>
        ) : error ? (
          <div className="text-red-500 text-sm">{error}</div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">
                {data?.value ? formatValue(data.value) : '---'}
              </span>
              {getTrendIcon()}
            </div>
            {data?.change && (
              <div className="text-sm text-gray-600">
                {data.change > 0 ? '+' : ''}{data.change}% desde ayer
              </div>
            )}
            {data?.subtitle && (
              <div className="text-xs text-gray-500">{data.subtitle}</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Chart Widget - Generic chart display with multiple types
export const ChartWidget: React.FC<WidgetProps> = ({ 
  widget, 
  data, 
  isLoading, 
  error, 
  onRefresh 
}) => {
  const chartType = widget.config.chartType || 'line'

  const renderChart = () => {
    if (!data?.chartData) {
      return (
        <div className="flex items-center justify-center h-32 text-gray-400">
          <BarChart3 className="w-8 h-8 mr-2" />
          No hay datos disponibles
        </div>
      )
    }

    // Simple chart representation (would integrate with actual charting library)
    return (
      <div className="h-32 flex items-end justify-center gap-2 p-4">
        {data.chartData.map((value: number, index: number) => (
          <motion.div
            key={index}
            initial={{ height: 0 }}
            animate={{ height: `${(value / Math.max(...data.chartData)) * 100}%` }}
            className="bg-blue-500 w-4 min-h-[4px] rounded-t"
          />
        ))}
      </div>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" size="sm">{chartType}</Badge>
            {onRefresh && (
              <Button variant="ghost" size="sm" onClick={onRefresh}>
                <RefreshCw className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <LoadingSpinner size="sm" />
          </div>
        ) : error ? (
          <div className="text-red-500 text-sm h-32 flex items-center justify-center">
            {error}
          </div>
        ) : (
          renderChart()
        )}
      </CardContent>
    </Card>
  )
}

// Alert Widget - Displays system alerts and notifications
export const AlertWidget: React.FC<WidgetProps> = ({ 
  widget, 
  data, 
  isLoading, 
  error 
}) => {
  const alerts = data?.alerts || []
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200'
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      default: return 'text-blue-600 bg-blue-50 border-blue-200'
    }
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {widget.title}
          </CardTitle>
          <Badge variant={alerts.length > 0 ? 'destructive' : 'secondary'}>
            {alerts.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <LoadingSpinner size="sm" />
        ) : error ? (
          <div className="text-red-500 text-sm">{error}</div>
        ) : alerts.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No hay alertas activas</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {alerts.map((alert: any, index: number) => (
              <div
                key={index}
                className={`p-2 rounded border text-xs ${getSeverityColor(alert.severity)}`}
              >
                <div className="font-medium">{alert.title}</div>
                <div className="opacity-75">{alert.message}</div>
                <div className="text-xs opacity-60 mt-1">
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Activity Widget - Shows recent activity timeline
export const ActivityWidget: React.FC<WidgetProps> = ({ 
  widget, 
  data, 
  isLoading, 
  error 
}) => {
  const activities = data?.activities || []

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'schedule_update': return <Calendar className="w-3 h-3" />
      case 'user_login': return <Users className="w-3 h-3" />
      case 'alert': return <AlertTriangle className="w-3 h-3" />
      default: return <Activity className="w-3 h-3" />
    }
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="w-4 h-4" />
          {widget.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <LoadingSpinner size="sm" />
        ) : error ? (
          <div className="text-red-500 text-sm">{error}</div>
        ) : activities.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No hay actividad reciente</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {activities.map((activity: any, index: number) => (
              <div key={index} className="flex items-start gap-2">
                <div className="text-gray-400 mt-0.5">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {activity.title}
                  </div>
                  <div className="text-xs text-gray-600 truncate">
                    {activity.description}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(activity.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Table Widget - Displays tabular data
export const TableWidget: React.FC<WidgetProps> = ({ 
  widget, 
  data, 
  isLoading, 
  error 
}) => {
  const tableData = data?.tableData || { headers: [], rows: [] }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <LoadingSpinner size="sm" />
        ) : error ? (
          <div className="text-red-500 text-sm">{error}</div>
        ) : (
          <div className="overflow-auto max-h-48">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  {tableData.headers.map((header: string, index: number) => (
                    <th key={index} className="text-left py-1 px-2 font-medium">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.rows.map((row: any[], rowIndex: number) => (
                  <tr key={rowIndex} className="border-b border-gray-100">
                    {row.map((cell: any, cellIndex: number) => (
                      <td key={cellIndex} className="py-1 px-2">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Configuration components
export const MetricWidgetConfig: React.FC<WidgetConfigProps> = ({ 
  config, 
  onChange 
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Formato de número</label>
        <select
          value={config.numberFormat || 'auto'}
          onChange={(e) => onChange({ ...config, numberFormat: e.target.value })}
          className="w-full p-2 border rounded"
        >
          <option value="auto">Automático</option>
          <option value="decimal">Decimal</option>
          <option value="percentage">Porcentaje</option>
          <option value="currency">Moneda</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Mostrar tendencia</label>
        <input
          type="checkbox"
          checked={config.showTrend || false}
          onChange={(e) => onChange({ ...config, showTrend: e.target.checked })}
          className="rounded"
        />
      </div>
    </div>
  )
}

export const ChartWidgetConfig: React.FC<WidgetConfigProps> = ({ 
  config, 
  onChange 
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Tipo de gráfico</label>
        <select
          value={config.chartType || 'line'}
          onChange={(e) => onChange({ ...config, chartType: e.target.value })}
          className="w-full p-2 border rounded"
        >
          <option value="line">Líneas</option>
          <option value="bar">Barras</option>
          <option value="pie">Circular</option>
          <option value="area">Área</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Mostrar leyenda</label>
        <input
          type="checkbox"
          checked={config.showLegend || false}
          onChange={(e) => onChange({ ...config, showLegend: e.target.checked })}
          className="rounded"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Mostrar cuadrícula</label>
        <input
          type="checkbox"
          checked={config.showGrid || true}
          onChange={(e) => onChange({ ...config, showGrid: e.target.checked })}
          className="rounded"
        />
      </div>
    </div>
  )
}

// Widget definitions for registration
export const metricWidgetDefinition = createWidgetDefinition({
  id: 'core.metric',
  name: 'Métrica',
  description: 'Muestra un valor numérico con tendencia',
  category: 'analytics',
  icon: '📊',
  component: MetricWidget,
  configComponent: MetricWidgetConfig,
  defaultConfig: {
    numberFormat: 'auto',
    showTrend: true,
    refreshInterval: 60000
  },
  defaultSize: { w: 3, h: 2 },
  resizable: true,
  requiredPermissions: ['analytics.read'],
  supportedDataSources: ['api', 'websocket', 'static'],
  schema: {
    config: {
      numberFormat: {
        type: 'select',
        label: 'Formato de número',
        required: false,
        default: 'auto',
        options: [
          { label: 'Automático', value: 'auto' },
          { label: 'Decimal', value: 'decimal' },
          { label: 'Porcentaje', value: 'percentage' },
          { label: 'Moneda', value: 'currency' }
        ]
      },
      showTrend: {
        type: 'boolean',
        label: 'Mostrar tendencia',
        required: false,
        default: true
      }
    },
    data: {}
  }
})

export const chartWidgetDefinition = createWidgetDefinition({
  id: 'core.chart',
  name: 'Gráfico',
  description: 'Gráfico personalizable con múltiples tipos',
  category: 'analytics',
  icon: '📈',
  component: ChartWidget,
  configComponent: ChartWidgetConfig,
  defaultConfig: {
    chartType: 'line',
    showLegend: false,
    showGrid: true,
    refreshInterval: 300000
  },
  defaultSize: { w: 6, h: 4 },
  resizable: true,
  requiredPermissions: ['analytics.read'],
  supportedDataSources: ['api', 'websocket'],
  schema: {
    config: {
      chartType: {
        type: 'select',
        label: 'Tipo de gráfico',
        required: true,
        default: 'line',
        options: [
          { label: 'Líneas', value: 'line' },
          { label: 'Barras', value: 'bar' },
          { label: 'Circular', value: 'pie' },
          { label: 'Área', value: 'area' }
        ]
      }
    },
    data: {}
  }
})

export const alertWidgetDefinition = createWidgetDefinition({
  id: 'core.alert',
  name: 'Alertas',
  description: 'Muestra alertas y notificaciones del sistema',
  category: 'monitoring',
  icon: '⚠️',
  component: AlertWidget,
  defaultConfig: {
    maxAlerts: 10,
    severityFilter: 'all',
    refreshInterval: 30000
  },
  defaultSize: { w: 4, h: 3 },
  resizable: true,
  requiredPermissions: ['alerts.read'],
  supportedDataSources: ['api', 'websocket']
})

export const activityWidgetDefinition = createWidgetDefinition({
  id: 'core.activity',
  name: 'Actividad',
  description: 'Timeline de actividades recientes',
  category: 'user_activity',
  icon: '🔄',
  component: ActivityWidget,
  defaultConfig: {
    maxItems: 20,
    showTimestamps: true,
    refreshInterval: 120000
  },
  defaultSize: { w: 5, h: 4 },
  resizable: true,
  requiredPermissions: ['activity.read'],
  supportedDataSources: ['api', 'websocket']
})

export const tableWidgetDefinition = createWidgetDefinition({
  id: 'core.table',
  name: 'Tabla',
  description: 'Muestra datos en formato tabular',
  category: 'analytics',
  icon: '📋',
  component: TableWidget,
  defaultConfig: {
    maxRows: 50,
    sortable: true,
    searchable: false,
    refreshInterval: 300000
  },
  defaultSize: { w: 6, h: 4 },
  resizable: true,
  requiredPermissions: ['data.read'],
  supportedDataSources: ['api']
})