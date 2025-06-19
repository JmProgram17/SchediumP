/**
 * HistoryPanel Component - Visual interface for undo/redo history management
 * Provides comprehensive history tracking and action management UI
 */

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  History, 
  Undo2, 
  Redo2, 
  Trash2, 
  Clock, 
  User, 
  Filter,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Settings,
  Download,
  Upload,
  Zap,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/design-system/components/Card'
import { Button } from '@/design-system/components/Button'
import { Badge } from '@/design-system/components/Badge'
import { StatusIndicator } from '@/design-system/components/StatusIndicator'
import { LoadingSpinner } from '@/design-system/components/LoadingSpinner'
import { Tooltip } from '@/design-system/components/Tooltip'

import { useHistoryManager, HistoryAction } from '../../hooks/useHistoryManager'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface HistoryPanelProps {
  isOpen: boolean
  onToggle: () => void
  onActionSelect?: (action: HistoryAction) => void
  compact?: boolean
  className?: string
}

// Individual history item component
const HistoryItem: React.FC<{
  action: HistoryAction
  isActive: boolean
  isCurrent: boolean
  onSelect: (action: HistoryAction) => void
  compact?: boolean
}> = ({ action, isActive, isCurrent, onSelect, compact = false }) => {
  const getActionIcon = () => {
    const icons = {
      move: <RefreshCw className="w-4 h-4" />,
      create: <CheckCircle className="w-4 h-4" />,
      update: <Settings className="w-4 h-4" />,
      delete: <Trash2 className="w-4 h-4" />,
      batch: <BarChart3 className="w-4 h-4" />
    }
    return icons[action.type] || <Info className="w-4 h-4" />
  }

  const getActionColor = () => {
    const colors = {
      move: 'text-blue-600',
      create: 'text-green-600',
      update: 'text-orange-600',
      delete: 'text-red-600',
      batch: 'text-purple-600'
    }
    return colors[action.type] || 'text-gray-600'
  }

  const getSourceBadge = () => {
    const source = action.metadata?.source || 'manual'
    const variants = {
      manual: 'secondary',
      drag_drop: 'default',
      conflict_resolution: 'destructive',
      bulk_operation: 'outline'
    } as const

    return (
      <Badge variant={variants[source] || 'secondary'} size="sm">
        {source.replace('_', ' ')}
      </Badge>
    )
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`
        p-3 border rounded-lg cursor-pointer transition-all duration-200
        ${isActive 
          ? 'border-blue-300 bg-blue-50' 
          : isCurrent 
            ? 'border-green-300 bg-green-50' 
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        }
        ${compact ? 'p-2' : ''}
      `}
      onClick={() => onSelect(action)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div className={`${getActionColor()} mt-0.5`}>
            {getActionIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`font-medium ${compact ? 'text-sm' : ''} truncate`}>
                {action.description}
              </span>
              {isCurrent && (
                <Badge variant="success" size="sm">
                  Actual
                </Badge>
              )}
            </div>
            
            {!compact && (
              <>
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  <Clock className="w-3 h-3" />
                  <span>
                    {formatDistanceToNow(action.timestamp, { addSuffix: true, locale: es })}
                  </span>
                  {action.data.affectedIds.length > 0 && (
                    <>
                      <span>•</span>
                      <span>{action.data.affectedIds.length} elemento(s)</span>
                    </>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  {getSourceBadge()}
                  
                  {action.metadata && (
                    <div className="flex items-center gap-2">
                      <StatusIndicator 
                        status={action.metadata.estimatedImpact}
                        variant="dot"
                        size="sm"
                      />
                      <span className="text-xs text-gray-500">
                        {Math.round(action.metadata.confidence * 100)}%
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Statistics panel
const HistoryStats: React.FC<{
  stats: any
  onCompress: () => void
  onClear: () => void
}> = ({ stats, onCompress, onClear }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{stats.totalActions}</div>
          <div className="text-sm text-blue-600">Total Acciones</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{stats.currentIndex + 1}</div>
          <div className="text-sm text-green-600">Posición Actual</div>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">Por Tipo:</h4>
        {Object.entries(stats.actionsByType).map(([type, count]) => (
          <div key={type} className="flex justify-between text-sm">
            <span className="capitalize">{type}:</span>
            <span className="font-medium">{count as number}</span>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">Memoria:</h4>
        <div className="text-sm text-gray-600">
          {Math.round(stats.memoryUsage / 1024)} KB utilizados
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onCompress}
          className="flex-1 flex items-center gap-2"
        >
          <Zap className="w-3 h-3" />
          Comprimir
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={onClear}
          className="flex-1 flex items-center gap-2"
        >
          <Trash2 className="w-3 h-3" />
          Limpiar
        </Button>
      </div>
    </div>
  )
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  isOpen,
  onToggle,
  onActionSelect,
  compact = false,
  className
}) => {
  const [filter, setFilter] = useState<string>('all')
  const [showStats, setShowStats] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const {
    historyState,
    canUndo,
    canRedo,
    hasUnsavedChanges,
    undo,
    redo,
    clearHistory,
    getActionStats,
    compressOldActions,
    saveHistoryToStorage,
    undoDescription,
    redoDescription
  } = useHistoryManager({
    maxHistorySize: 100,
    enablePersistence: true
  })

  const stats = getActionStats()

  // Filter actions based on selected filter
  const filteredActions = useMemo(() => {
    if (filter === 'all') return historyState.actions
    return historyState.actions.filter(action => action.type === filter)
  }, [historyState.actions, filter])

  // Handle action selection
  const handleActionSelect = (action: HistoryAction) => {
    onActionSelect?.(action)
  }

  // Export history
  const handleExport = async () => {
    setIsExporting(true)
    try {
      const exportData = {
        timestamp: Date.now(),
        version: '1.0',
        stats,
        actions: historyState.actions
      }
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      })
      
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `schedium-history-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onToggle}
        className={`fixed bottom-4 right-4 z-50 ${className}`}
      >
        <History className="w-4 h-4" />
      </Button>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className={`
        fixed top-4 right-4 bottom-4 w-80 z-50 
        ${compact ? 'w-64' : ''}
        ${className}
      `}
    >
      <Card className="h-full flex flex-col shadow-xl border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Historial
            </CardTitle>
            
            <div className="flex items-center gap-1">
              {hasUnsavedChanges && (
                <Tooltip content="Cambios sin guardar">
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                </Tooltip>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
              >
                <ChevronUp className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-2">
            <Tooltip content={undoDescription || 'No hay acciones para deshacer'}>
              <Button
                variant="outline"
                size="sm"
                onClick={undo}
                disabled={!canUndo}
                className="flex items-center gap-2"
              >
                <Undo2 className="w-3 h-3" />
                {!compact && 'Deshacer'}
              </Button>
            </Tooltip>
            
            <Tooltip content={redoDescription || 'No hay acciones para rehacer'}>
              <Button
                variant="outline"
                size="sm"
                onClick={redo}
                disabled={!canRedo}
                className="flex items-center gap-2"
              >
                <Redo2 className="w-3 h-3" />
                {!compact && 'Rehacer'}
              </Button>
            </Tooltip>
          </div>

          {/* Filter and options */}
          <div className="flex items-center justify-between">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="text-sm border rounded px-2 py-1"
            >
              <option value="all">Todas</option>
              <option value="move">Movimientos</option>
              <option value="create">Creaciones</option>
              <option value="update">Actualizaciones</option>
              <option value="delete">Eliminaciones</option>
              <option value="batch">Lotes</option>
            </select>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowStats(!showStats)}
              >
                <BarChart3 className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExport}
                disabled={isExporting}
              >
                {isExporting ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-4 pt-0">
          {showStats ? (
            <HistoryStats
              stats={stats}
              onCompress={() => compressOldActions()}
              onClear={clearHistory}
            />
          ) : (
            <div className="h-full overflow-y-auto space-y-2">
              <AnimatePresence>
                {filteredActions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No hay acciones en el historial</p>
                  </div>
                ) : (
                  filteredActions.map((action, index) => (
                    <HistoryItem
                      key={action.id}
                      action={action}
                      isActive={false}
                      isCurrent={index === historyState.currentIndex}
                      onSelect={handleActionSelect}
                      compact={compact}
                    />
                  ))
                )}
              </AnimatePresence>
            </div>
          )}
        </CardContent>

        {/* Status bar */}
        <div className="border-t p-3 bg-gray-50">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>
              {filteredActions.length} de {historyState.actions.length} acciones
            </span>
            <div className="flex items-center gap-2">
              {hasUnsavedChanges && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => saveHistoryToStorage()}
                  className="text-xs"
                >
                  Guardar
                </Button>
              )}
              <kbd className="px-1 bg-gray-200 rounded text-xs">Ctrl+Z</kbd>
              <kbd className="px-1 bg-gray-200 rounded text-xs">Ctrl+Y</kbd>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}