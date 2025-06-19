/**
 * ReportQueue Component - Queue management for heavy report processing
 * Real-time progress tracking and queue prioritization
 */

import React, { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { ReportExecution } from '../../hooks/useReportBuilder'

interface ReportQueueProps {
  executions: ReportExecution[]
  onCancel?: (executionId: string) => void
  onRetry?: (executionId: string) => void
  onDownload?: (executionId: string) => void
  onClearCompleted?: () => void
  className?: string
}

interface QueueStatsProps {
  executions: ReportExecution[]
}

// Queue Statistics Component
const QueueStats: React.FC<QueueStatsProps> = ({ executions }) => {
  const stats = {
    total: executions.length,
    pending: executions.filter(e => e.status === 'pending').length,
    running: executions.filter(e => e.status === 'running').length,
    completed: executions.filter(e => e.status === 'completed').length,
    failed: executions.filter(e => e.status === 'failed').length
  }

  const avgExecutionTime = executions
    .filter(e => e.status === 'completed' && e.endTime)
    .reduce((acc, e) => acc + (e.endTime! - e.startTime), 0) / 
    (executions.filter(e => e.status === 'completed').length || 1)

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Estadísticas de Cola</h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500">Total</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          <div className="text-sm text-gray-500">Pendientes</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.running}</div>
          <div className="text-sm text-gray-500">Ejecutando</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          <div className="text-sm text-gray-500">Completados</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
          <div className="text-sm text-gray-500">Fallidos</div>
        </div>
      </div>
      {stats.completed > 0 && (
        <div className="mt-4 text-center text-sm text-gray-600">
          Tiempo promedio de ejecución: {Math.round(avgExecutionTime / 1000)}s
        </div>
      )}
    </div>
  )
}

// Individual Queue Item Component
interface QueueItemProps {
  execution: ReportExecution
  onCancel?: (executionId: string) => void
  onRetry?: (executionId: string) => void
  onDownload?: (executionId: string) => void
}

const QueueItem: React.FC<QueueItemProps> = ({
  execution,
  onCancel,
  onRetry,
  onDownload
}) => {
  const getStatusIcon = (status: ReportExecution['status']) => {
    switch (status) {
      case 'pending': return '⏳'
      case 'running': return '🔄'
      case 'completed': return '✅'
      case 'failed': return '❌'
      case 'cancelled': return '🚫'
      default: return '❓'
    }
  }

  const getStatusColor = (status: ReportExecution['status']) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-50'
      case 'running': return 'text-blue-600 bg-blue-50'
      case 'completed': return 'text-green-600 bg-green-50'
      case 'failed': return 'text-red-600 bg-red-50'
      case 'cancelled': return 'text-gray-600 bg-gray-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    }
    return `${seconds}s`
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const executionTime = execution.endTime 
    ? execution.endTime - execution.startTime
    : Date.now() - execution.startTime

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center space-x-3 mb-2">
            <span className="text-lg">{getStatusIcon(execution.status)}</span>
            <div>
              <h4 className="text-sm font-medium text-gray-900">
                Reporte #{execution.id.slice(-8)}
              </h4>
              <p className="text-xs text-gray-500">
                Plantilla: {execution.templateId}
              </p>
            </div>
            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(execution.status)}`}>
              {execution.status.toUpperCase()}
            </span>
          </div>

          {/* Progress Bar */}
          {execution.status === 'running' && (
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>Progreso</span>
                <span>{execution.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${execution.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
            <div>
              <span className="font-medium">Ejecutado por:</span> {execution.executedBy}
            </div>
            <div>
              <span className="font-medium">Tiempo:</span> {formatDuration(executionTime)}
            </div>
            
            {execution.output && (
              <>
                <div>
                  <span className="font-medium">Formato:</span> {execution.output.format.toUpperCase()}
                </div>
                {execution.output.size && (
                  <div>
                    <span className="font-medium">Tamaño:</span> {formatFileSize(execution.output.size)}
                  </div>
                )}
              </>
            )}

            {execution.metadata.dataRows > 0 && (
              <div>
                <span className="font-medium">Filas:</span> {execution.metadata.dataRows.toLocaleString()}
              </div>
            )}

            {execution.metadata.cacheHit && (
              <div className="text-green-600">
                <span className="font-medium">Cache:</span> Hit
              </div>
            )}
          </div>

          {/* Error Message */}
          {execution.error && (
            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
              <span className="font-medium">Error:</span> {execution.error}
            </div>
          )}

          {/* Filters Applied */}
          {execution.filters.length > 0 && (
            <div className="mt-3">
              <div className="text-xs font-medium text-gray-600 mb-1">Filtros aplicados:</div>
              <div className="flex flex-wrap gap-1">
                {execution.filters.map((filter, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                  >
                    {filter.field}: {filter.value}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col space-y-2 ml-4">
          {execution.status === 'completed' && execution.output?.url && (
            <button
              onClick={() => onDownload?.(execution.id)}
              className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
            >
              📥 Descargar
            </button>
          )}

          {execution.status === 'failed' && (
            <button
              onClick={() => onRetry?.(execution.id)}
              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
            >
              🔄 Reintentar
            </button>
          )}

          {(execution.status === 'pending' || execution.status === 'running') && (
            <button
              onClick={() => onCancel?.(execution.id)}
              className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
            >
              🚫 Cancelar
            </button>
          )}

          <div className="text-xs text-gray-500 text-center">
            {new Date(execution.startTime).toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  )
}

// Filter and Sort Controls
interface QueueControlsProps {
  onStatusFilter: (status: ReportExecution['status'] | 'all') => void
  onSort: (field: 'startTime' | 'progress' | 'status') => void
  onClearCompleted?: () => void
  statusFilter: ReportExecution['status'] | 'all'
  sortField: string
}

const QueueControls: React.FC<QueueControlsProps> = ({
  onStatusFilter,
  onSort,
  onClearCompleted,
  statusFilter,
  sortField
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Status Filter */}
          <div>
            <label className="text-sm font-medium text-gray-700 mr-2">
              Filtrar por estado:
            </label>
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilter(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos</option>
              <option value="pending">Pendientes</option>
              <option value="running">Ejecutando</option>
              <option value="completed">Completados</option>
              <option value="failed">Fallidos</option>
              <option value="cancelled">Cancelados</option>
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="text-sm font-medium text-gray-700 mr-2">
              Ordenar por:
            </label>
            <select
              value={sortField}
              onChange={(e) => onSort(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="startTime">Fecha de inicio</option>
              <option value="progress">Progreso</option>
              <option value="status">Estado</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onClearCompleted}
            className="px-4 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
          >
            🗑️ Limpiar Completados
          </button>
        </div>
      </div>
    </div>
  )
}

// Main ReportQueue Component
export const ReportQueue: React.FC<ReportQueueProps> = ({
  executions,
  onCancel,
  onRetry,
  onDownload,
  onClearCompleted,
  className = ''
}) => {
  const [statusFilter, setStatusFilter] = useState<ReportExecution['status'] | 'all'>('all')
  const [sortField, setSortField] = useState<'startTime' | 'progress' | 'status'>('startTime')
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Auto-refresh for running reports
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      const hasRunningReports = executions.some(e => e.status === 'running' || e.status === 'pending')
      if (hasRunningReports) {
        // In real implementation, would refetch data
        console.log('Auto-refreshing queue...')
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [autoRefresh, executions])

  // Filter and sort executions
  const filteredAndSortedExecutions = executions
    .filter(execution => {
      if (statusFilter === 'all') return true
      return execution.status === statusFilter
    })
    .sort((a, b) => {
      switch (sortField) {
        case 'startTime':
          return b.startTime - a.startTime
        case 'progress':
          return b.progress - a.progress
        case 'status':
          return a.status.localeCompare(b.status)
        default:
          return 0
      }
    })

  const handleClearCompleted = useCallback(() => {
    if (window.confirm('¿Estás seguro de que quieres limpiar todos los reportes completados?')) {
      onClearCompleted?.()
      toast.success('Reportes completados eliminados')
    }
  }, [onClearCompleted])

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Cola de Reportes</h2>
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-600 flex items-center">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="mr-2"
            />
            Auto-actualizar
          </label>
        </div>
      </div>

      {/* Statistics */}
      <QueueStats executions={executions} />

      {/* Controls */}
      <QueueControls
        statusFilter={statusFilter}
        sortField={sortField}
        onStatusFilter={setStatusFilter}
        onSort={setSortField}
        onClearCompleted={handleClearCompleted}
      />

      {/* Queue Items */}
      <div className="space-y-4">
        {filteredAndSortedExecutions.length === 0 ? (
          <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay reportes {statusFilter !== 'all' ? statusFilter : ''}
            </h3>
            <p className="text-gray-500">
              {statusFilter === 'all' 
                ? 'No tienes reportes en cola actualmente'
                : `No hay reportes con estado "${statusFilter}"`
              }
            </p>
          </div>
        ) : (
          filteredAndSortedExecutions.map((execution) => (
            <QueueItem
              key={execution.id}
              execution={execution}
              onCancel={onCancel}
              onRetry={onRetry}
              onDownload={onDownload}
            />
          ))
        )}
      </div>

      {/* Running Reports Indicator */}
      {executions.filter(e => e.status === 'running').length > 0 && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2">
            <div className="animate-spin">🔄</div>
            <span className="text-sm">
              {executions.filter(e => e.status === 'running').length} reporte(s) ejecutándose
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReportQueue