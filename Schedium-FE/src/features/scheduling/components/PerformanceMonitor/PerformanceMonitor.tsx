/**
 * PerformanceMonitor Component - Real-time performance monitoring dashboard
 * Provides comprehensive performance insights and optimization suggestions
 */

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Cpu,
  HardDrive,
  Monitor,
  Network,
  Smartphone,
  TrendingDown,
  TrendingUp,
  Zap,
  Settings,
  Download,
  X,
  Eye,
  EyeOff,
  BarChart3,
  LineChart,
  PieChart
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/design-system/components/Card'
import { Button } from '@/design-system/components/Button'
import { Badge } from '@/design-system/components/Badge'
import { Progress } from '@/design-system/components/Progress'
import { Switch } from '@/design-system/components/Switch'
import { Tooltip } from '@/design-system/components/Tooltip'

import { 
  usePerformanceMonitoring, 
  PerformanceMetrics, 
  PerformanceAlert, 
  PerformanceOptimization 
} from '../../hooks/usePerformanceMonitoring'

interface PerformanceMonitorProps {
  isVisible: boolean
  onToggleVisibility: () => void
  className?: string
}

// Performance metric card component
const MetricCard: React.FC<{
  title: string
  value: string | number
  unit?: string
  icon: React.ReactNode
  status: 'good' | 'warning' | 'error'
  trend?: 'up' | 'down' | 'stable'
  details?: string
}> = ({ title, value, unit, icon, status, trend, details }) => {
  const getStatusColor = () => {
    const colors = {
      good: 'text-green-600 bg-green-50 border-green-200',
      warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      error: 'text-red-600 bg-red-50 border-red-200'
    }
    return colors[status]
  }

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="w-3 h-3 text-green-500" />
    if (trend === 'down') return <TrendingDown className="w-3 h-3 text-red-500" />
    return null
  }

  const formatValue = () => {
    if (typeof value === 'number') {
      if (value > 1000) {
        return (value / 1000).toFixed(1) + 'k'
      }
      return value.toFixed(1)
    }
    return value
  }

  return (
    <Card className={`border-2 ${getStatusColor()}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-sm font-medium text-gray-600">{title}</span>
          </div>
          {getTrendIcon()}
        </div>
        
        <div className="mt-2">
          <div className="text-2xl font-bold text-gray-900">
            {formatValue()}
            {unit && <span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>}
          </div>
          {details && (
            <div className="text-xs text-gray-500 mt-1">{details}</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Performance alert component
const AlertCard: React.FC<{
  alert: PerformanceAlert
  onDismiss: () => void
}> = ({ alert, onDismiss }) => {
  const getAlertIcon = () => {
    const icons = {
      warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
      error: <AlertTriangle className="w-5 h-5 text-red-500" />,
      info: <CheckCircle className="w-5 h-5 text-blue-500" />
    }
    return icons[alert.type]
  }

  const getImpactBadge = () => {
    const variants = {
      low: 'outline',
      medium: 'secondary',
      high: 'destructive'
    } as const
    return <Badge variant={variants[alert.impact]} size="sm">{alert.impact.toUpperCase()}</Badge>
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="border rounded-lg p-4 bg-white shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          {getAlertIcon()}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-gray-900">{alert.message}</h4>
              {getImpactBadge()}
            </div>
            <p className="text-sm text-gray-600 mb-2">{alert.details}</p>
            <div className="bg-blue-50 border border-blue-200 rounded p-2">
              <p className="text-sm text-blue-800">
                <strong>Sugerencia:</strong> {alert.suggestion}
              </p>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {alert.timestamp.toLocaleTimeString()}
            </div>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  )
}

// Optimization suggestion component
const OptimizationCard: React.FC<{
  optimization: PerformanceOptimization
  onMarkImplemented: () => void
}> = ({ optimization, onMarkImplemented }) => {
  const getImpactColor = () => {
    const colors = {
      low: 'text-green-600',
      medium: 'text-yellow-600',
      high: 'text-red-600'
    }
    return colors[optimization.impact]
  }

  const getEffortColor = () => {
    const colors = {
      low: 'text-green-600',
      medium: 'text-yellow-600',
      high: 'text-red-600'
    }
    return colors[optimization.effort]
  }

  return (
    <Card className={optimization.implemented ? 'opacity-60' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 mb-2">
              {optimization.description}
            </h4>
            
            <div className="flex items-center gap-4 text-sm mb-3">
              <div className="flex items-center gap-1">
                <span className="text-gray-500">Impacto:</span>
                <span className={`font-medium ${getImpactColor()}`}>
                  {optimization.impact}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-500">Esfuerzo:</span>
                <span className={`font-medium ${getEffortColor()}`}>
                  {optimization.effort}
                </span>
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded p-2 mb-3">
              <p className="text-sm text-green-800">
                <strong>Mejora estimada:</strong> {optimization.estimatedImprovement}
              </p>
            </div>
            
            <Badge variant="outline" size="sm">
              {optimization.category}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            {optimization.implemented ? (
              <Badge variant="default" size="sm">
                <CheckCircle className="w-3 h-3 mr-1" />
                Implementado
              </Badge>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={onMarkImplemented}
              >
                Marcar como hecho
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Performance overview chart component
const PerformanceOverview: React.FC<{
  metrics: PerformanceMetrics
}> = ({ metrics }) => {
  const overallScore = useMemo(() => {
    // Calculate overall performance score
    let score = 100
    
    // Deduct points based on various metrics
    if (metrics.renderTime > 16) score -= 20
    if (metrics.memoryUsage.usedJSHeapSize > 100 * 1024 * 1024) score -= 25
    if (metrics.networkLatency > 1000) score -= 15
    if (metrics.virtualScrollPerformance.scrollFPS < 30) score -= 20
    
    return Math.max(0, score)
  }, [metrics])

  const getScoreColor = () => {
    if (overallScore >= 80) return 'text-green-600'
    if (overallScore >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreStatus = () => {
    if (overallScore >= 80) return 'Excelente'
    if (overallScore >= 60) return 'Bueno'
    if (overallScore >= 40) return 'Regular'
    return 'Malo'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Resumen de rendimiento
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-6">
          <div className={`text-4xl font-bold ${getScoreColor()}`}>
            {overallScore}/100
          </div>
          <div className="text-lg text-gray-600 mt-1">
            {getScoreStatus()}
          </div>
          <Progress 
            value={overallScore} 
            className="mt-3"
            indicatorClassName={
              overallScore >= 80 ? 'bg-green-500' :
              overallScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded">
            <div className="text-lg font-bold text-gray-900">
              {metrics.renderTime.toFixed(1)}ms
            </div>
            <div className="text-sm text-gray-600">Tiempo de render</div>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded">
            <div className="text-lg font-bold text-gray-900">
              {metrics.virtualScrollPerformance.scrollFPS.toFixed(0)}
            </div>
            <div className="text-sm text-gray-600">FPS promedio</div>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded">
            <div className="text-lg font-bold text-gray-900">
              {(metrics.memoryUsage.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB
            </div>
            <div className="text-sm text-gray-600">Memoria usada</div>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded">
            <div className="text-lg font-bold text-gray-900">
              {metrics.networkLatency.toFixed(0)}ms
            </div>
            <div className="text-sm text-gray-600">Latencia de red</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  isVisible,
  onToggleVisibility,
  className
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'metrics' | 'alerts' | 'optimizations'>('overview')
  const [autoRefresh, setAutoRefresh] = useState(true)

  const {
    currentMetrics,
    activeAlerts,
    optimizations,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    generateReport,
    clearAlerts,
    dismissAlert,
    markOptimizationImplemented,
    connectionType,
    isPageVisible
  } = usePerformanceMonitoring({
    enableDetailedProfiling: true,
    enableMemoryMonitoring: true,
    samplingRate: 0.1
  })

  // Auto-start monitoring when component mounts
  useEffect(() => {
    if (isVisible && !isMonitoring) {
      startMonitoring()
    }
  }, [isVisible, isMonitoring, startMonitoring])

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh || !isVisible) return

    const interval = setInterval(() => {
      // Metrics are automatically updated by the hook
    }, 5000)

    return () => clearInterval(interval)
  }, [autoRefresh, isVisible])

  const handleDownloadReport = () => {
    const report = generateReport()
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `performance-report-${new Date().toISOString()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!isVisible) {
    return (
      <Button
        className="fixed bottom-4 left-4 z-50"
        onClick={onToggleVisibility}
        size="sm"
      >
        <Activity className="w-4 h-4 mr-2" />
        Performance
      </Button>
    )
  }

  const renderOverview = () => (
    <div className="space-y-6">
      <PerformanceOverview metrics={currentMetrics} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          title="Conexión"
          value={connectionType}
          icon={<Network className="w-4 h-4" />}
          status="good"
          details={isPageVisible ? 'Página visible' : 'Página oculta'}
        />
        
        <MetricCard
          title="Alertas activas"
          value={activeAlerts.length}
          icon={<AlertTriangle className="w-4 h-4" />}
          status={activeAlerts.length === 0 ? 'good' : activeAlerts.some(a => a.impact === 'high') ? 'error' : 'warning'}
        />
        
        <MetricCard
          title="Optimizaciones"
          value={optimizations.filter(o => !o.implemented).length}
          icon={<Zap className="w-4 h-4" />}
          status={optimizations.filter(o => !o.implemented).length === 0 ? 'good' : 'warning'}
          details="Pendientes"
        />
      </div>
    </div>
  )

  const renderMetrics = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Render Time"
          value={currentMetrics.renderTime}
          unit="ms"
          icon={<Monitor className="w-4 h-4" />}
          status={currentMetrics.renderTime < 16 ? 'good' : currentMetrics.renderTime < 33 ? 'warning' : 'error'}
          details="Target: <16ms"
        />
        
        <MetricCard
          title="FPS"
          value={currentMetrics.virtualScrollPerformance.scrollFPS}
          icon={<BarChart3 className="w-4 h-4" />}
          status={currentMetrics.virtualScrollPerformance.scrollFPS >= 30 ? 'good' : currentMetrics.virtualScrollPerformance.scrollFPS >= 20 ? 'warning' : 'error'}
          details={`Dropped: ${currentMetrics.virtualScrollPerformance.droppedFrames}`}
        />
        
        <MetricCard
          title="Memory"
          value={(currentMetrics.memoryUsage.usedJSHeapSize / 1024 / 1024)}
          unit="MB"
          icon={<HardDrive className="w-4 h-4" />}
          status={currentMetrics.memoryUsage.usedJSHeapSize < 50 * 1024 * 1024 ? 'good' : currentMetrics.memoryUsage.usedJSHeapSize < 100 * 1024 * 1024 ? 'warning' : 'error'}
          details={`Limit: ${(currentMetrics.memoryUsage.jsHeapSizeLimit / 1024 / 1024).toFixed(0)}MB`}
        />
        
        <MetricCard
          title="Network"
          value={currentMetrics.networkLatency}
          unit="ms"
          icon={<Network className="w-4 h-4" />}
          status={currentMetrics.networkLatency < 500 ? 'good' : currentMetrics.networkLatency < 1000 ? 'warning' : 'error'}
          details={connectionType}
        />
      </div>

      {/* Detailed metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Métricas detalladas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Interacciones</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Drag Start:</span>
                  <span>{currentMetrics.interactionLatency.dragStart.toFixed(1)}ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Drop Complete:</span>
                  <span>{currentMetrics.interactionLatency.dropComplete.toFixed(1)}ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Search Response:</span>
                  <span>{currentMetrics.interactionLatency.searchResponse.toFixed(1)}ms</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">WebSocket</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Connection Time:</span>
                  <span>{currentMetrics.websocketMetrics.connectionTime.toFixed(1)}ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Message Latency:</span>
                  <span>{currentMetrics.websocketMetrics.messageLatency.toFixed(1)}ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Queue Size:</span>
                  <span>{currentMetrics.websocketMetrics.messageQueueSize}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderAlerts = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">
          Alertas de rendimiento ({activeAlerts.length})
        </h3>
        {activeAlerts.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearAlerts}>
            Limpiar todas
          </Button>
        )}
      </div>

      {activeAlerts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Sin alertas activas
            </h3>
            <p className="text-gray-600">
              El rendimiento está funcionando dentro de los parámetros normales
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {activeAlerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onDismiss={() => dismissAlert(alert.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )

  const renderOptimizations = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">
          Optimizaciones sugeridas ({optimizations.filter(o => !o.implemented).length} pendientes)
        </h3>
      </div>

      {optimizations.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Zap className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Sin optimizaciones disponibles
            </h3>
            <p className="text-gray-600">
              El sistema está funcionando de manera óptima
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {optimizations.map((optimization) => (
            <OptimizationCard
              key={optimization.id}
              optimization={optimization}
              onMarkImplemented={() => markOptimizationImplemented(optimization.id)}
            />
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className={`fixed inset-4 z-50 bg-white rounded-lg shadow-2xl border ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">
            Monitor de rendimiento
          </h2>
          <Badge variant={isMonitoring ? 'default' : 'outline'} size="sm">
            {isMonitoring ? 'Activo' : 'Inactivo'}
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">
              Auto-refresh
            </label>
            <Switch
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
          </div>

          <Tooltip content="Descargar reporte">
            <Button variant="outline" size="sm" onClick={handleDownloadReport}>
              <Download className="w-4 h-4" />
            </Button>
          </Tooltip>

          <Button variant="ghost" size="sm" onClick={onToggleVisibility}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex border-b">
        {[
          { id: 'overview', label: 'Resumen', icon: PieChart },
          { id: 'metrics', label: 'Métricas', icon: BarChart3 },
          { id: 'alerts', label: 'Alertas', icon: AlertTriangle },
          { id: 'optimizations', label: 'Optimizaciones', icon: Zap }
        ].map((tab) => (
          <button
            key={tab.id}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab(tab.id as any)}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.id === 'alerts' && activeAlerts.length > 0 && (
              <Badge variant="destructive" size="sm">
                {activeAlerts.length}
              </Badge>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'metrics' && renderMetrics()}
            {activeTab === 'alerts' && renderAlerts()}
            {activeTab === 'optimizations' && renderOptimizations()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}