/**
 * ConflictResolution Component - Advanced conflict resolution interface
 * Provides intelligent conflict resolution with multiple resolution strategies
 */

import React, { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  AlertTriangle, 
  XCircle, 
  CheckCircle, 
  Clock, 
  Users, 
  MapPin,
  Zap,
  RefreshCw,
  Eye,
  Settings,
  ChevronDown,
  ChevronRight,
  Lightbulb,
  ArrowRight,
  Calendar
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/design-system/components/Card'
import { Button } from '@/design-system/components/Button'
import { Badge } from '@/design-system/components/Badge'
import { LoadingSpinner } from '@/design-system/components/LoadingSpinner'
import { ScheduleConflict, ConflictType, ScheduleEntry, DayOfWeek, TimeSlot } from '../../types'

interface ConflictResolutionProps {
  conflicts: ScheduleConflict[]
  entries: ScheduleEntry[]
  onResolveConflict: (conflictId: string, resolution: ResolutionStrategy) => Promise<void>
  onPreviewResolution: (conflictId: string, strategy: ResolutionStrategy) => Promise<ResolutionPreview>
  onBatchResolve: (resolutions: Array<{ conflictId: string; strategy: ResolutionStrategy }>) => Promise<void>
  autoResolveEnabled?: boolean
  onToggleAutoResolve?: (enabled: boolean) => void
  isLoading?: boolean
  className?: string
}

interface ResolutionStrategy {
  id: string
  type: 'move' | 'swap' | 'split' | 'reassign' | 'ignore' | 'auto'
  name: string
  description: string
  impact: 'low' | 'medium' | 'high'
  confidence: number
  data?: {
    newPosition?: { day: DayOfWeek; timeSlot: TimeSlot }
    swapWith?: string
    alternativeInstructor?: string
    alternativeClassroom?: string
    splitDuration?: number
  }
}

interface ResolutionPreview {
  strategy: ResolutionStrategy
  affectedEntries: ScheduleEntry[]
  newConflicts: ScheduleConflict[]
  resolvedConflicts: string[]
  estimatedTime: number
  riskLevel: 'low' | 'medium' | 'high'
}

// Conflict severity colors and icons
const getSeverityConfig = (severity: string) => {
  const configs = {
    low: {
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      icon: AlertTriangle
    },
    medium: {
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      icon: AlertTriangle
    },
    high: {
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      icon: XCircle
    },
    critical: {
      color: 'text-red-800',
      bgColor: 'bg-red-100',
      borderColor: 'border-red-300',
      icon: XCircle
    }
  }
  return configs[severity as keyof typeof configs] || configs.medium
}

// Individual conflict component
const ConflictItem: React.FC<{
  conflict: ScheduleConflict
  entries: ScheduleEntry[]
  onResolve: (strategy: ResolutionStrategy) => void
  onPreview: (strategy: ResolutionStrategy) => void
  isExpanded: boolean
  onToggleExpanded: () => void
  isLoading: boolean
}> = ({ conflict, entries, onResolve, onPreview, isExpanded, onToggleExpanded, isLoading }) => {
  const [selectedStrategy, setSelectedStrategy] = useState<ResolutionStrategy | null>(null)
  const [preview, setPreview] = useState<ResolutionPreview | null>(null)
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)

  const severityConfig = getSeverityConfig(conflict.severity)
  const SeverityIcon = severityConfig.icon

  // Generate resolution strategies based on conflict type
  const strategies = useMemo((): ResolutionStrategy[] => {
    switch (conflict.type) {
      case ConflictType.TIME_OVERLAP:
        return [
          {
            id: 'move-later',
            type: 'move',
            name: 'Mover a horario posterior',
            description: 'Buscar el siguiente horario disponible',
            impact: 'low',
            confidence: 0.9
          },
          {
            id: 'swap-entries',
            type: 'swap',
            name: 'Intercambiar horarios',
            description: 'Intercambiar con otra clase compatible',
            impact: 'medium',
            confidence: 0.7
          },
          {
            id: 'split-class',
            type: 'split',
            name: 'Dividir clase',
            description: 'Crear dos sesiones más cortas',
            impact: 'medium',
            confidence: 0.6
          }
        ]

      case ConflictType.INSTRUCTOR_UNAVAILABLE:
        return [
          {
            id: 'reassign-instructor',
            type: 'reassign',
            name: 'Reasignar instructor',
            description: 'Buscar instructor alternativo disponible',
            impact: 'low',
            confidence: 0.8
          },
          {
            id: 'move-time',
            type: 'move',
            name: 'Cambiar horario',
            description: 'Mover a cuando el instructor esté disponible',
            impact: 'medium',
            confidence: 0.9
          }
        ]

      case ConflictType.CLASSROOM_UNAVAILABLE:
        return [
          {
            id: 'reassign-classroom',
            type: 'reassign',
            name: 'Cambiar aula',
            description: 'Buscar aula alternativa con capacidad suficiente',
            impact: 'low',
            confidence: 0.8
          },
          {
            id: 'move-time',
            type: 'move',
            name: 'Reprogramar',
            description: 'Mover a cuando el aula esté disponible',
            impact: 'medium',
            confidence: 0.7
          }
        ]

      default:
        return [
          {
            id: 'auto-resolve',
            type: 'auto',
            name: 'Resolución automática',
            description: 'Dejar que el sistema resuelva automáticamente',
            impact: 'low',
            confidence: 0.6
          },
          {
            id: 'ignore',
            type: 'ignore',
            name: 'Ignorar conflicto',
            description: 'Mantener como está y revisar manualmente',
            impact: 'high',
            confidence: 1.0
          }
        ]
    }
  }, [conflict.type])

  // Handle strategy preview
  const handlePreview = useCallback(async (strategy: ResolutionStrategy) => {
    setIsPreviewLoading(true)
    try {
      const previewResult = await onPreview(strategy)
      setPreview(previewResult)
      setSelectedStrategy(strategy)
    } catch (error) {
      console.error('Error previewing resolution:', error)
    } finally {
      setIsPreviewLoading(false)
    }
  }, [onPreview])

  // Handle strategy application
  const handleApplyStrategy = useCallback(async (strategy: ResolutionStrategy) => {
    if (isLoading) return
    await onResolve(strategy)
    setPreview(null)
    setSelectedStrategy(null)
  }, [onResolve, isLoading])

  return (
    <Card className={`${severityConfig.borderColor} transition-all duration-200`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${severityConfig.bgColor}`}>
              <SeverityIcon className={`w-5 h-5 ${severityConfig.color}`} />
            </div>
            
            <div>
              <CardTitle className="text-lg">{conflict.message}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={conflict.severity === 'critical' ? 'destructive' : 'secondary'} size="sm">
                  {conflict.severity.toUpperCase()}
                </Badge>
                <span className="text-sm text-gray-500">
                  {conflict.affectedEntries.length} clase(s) afectada(s)
                </span>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleExpanded}
            className="flex items-center gap-2"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            {isExpanded ? 'Contraer' : 'Expandir'}
          </Button>
        </div>
      </CardHeader>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="pt-0">
              {/* Conflict Details */}
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Detalles del Conflicto</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{conflict.details?.position?.day} {conflict.details?.position?.timeSlot.start}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>Detectado: {new Date(conflict.detectedAt).toLocaleTimeString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span>ID: {conflict.id}</span>
                  </div>
                </div>
              </div>

              {/* Resolution Strategies */}
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Estrategias de Resolución
                </h4>
                
                <div className="grid grid-cols-1 gap-3">
                  {strategies.map((strategy) => (
                    <div
                      key={strategy.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedStrategy?.id === strategy.id
                          ? 'border-blue-300 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{strategy.name}</span>
                            <Badge
                              variant={strategy.impact === 'low' ? 'success' : strategy.impact === 'medium' ? 'secondary' : 'destructive'}
                              size="sm"
                            >
                              {strategy.impact} impact
                            </Badge>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-500">Confianza:</span>
                              <span className="text-xs font-medium">{Math.round(strategy.confidence * 100)}%</span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">{strategy.description}</p>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePreview(strategy)}
                            disabled={isPreviewLoading}
                            className="flex items-center gap-2"
                          >
                            <Eye className="w-3 h-3" />
                            Vista Previa
                          </Button>
                          
                          <Button
                            size="sm"
                            onClick={() => handleApplyStrategy(strategy)}
                            disabled={isLoading}
                            className="flex items-center gap-2"
                          >
                            {isLoading ? (
                              <LoadingSpinner size="sm" />
                            ) : (
                              <>
                                <CheckCircle className="w-3 h-3" />
                                Aplicar
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview Results */}
              {preview && selectedStrategy && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <h5 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Vista Previa: {selectedStrategy.name}
                  </h5>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700 font-medium">Clases afectadas:</span>
                      <span className="ml-2">{preview.affectedEntries.length}</span>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">Tiempo estimado:</span>
                      <span className="ml-2">{preview.estimatedTime}s</span>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">Riesgo:</span>
                      <Badge 
                        variant={preview.riskLevel === 'low' ? 'success' : preview.riskLevel === 'medium' ? 'secondary' : 'destructive'} 
                        size="sm" 
                        className="ml-2"
                      >
                        {preview.riskLevel}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">Nuevos conflictos:</span>
                      <span className="ml-2">{preview.newConflicts.length}</span>
                    </div>
                  </div>

                  {preview.newConflicts.length > 0 && (
                    <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <span className="text-yellow-800 text-sm font-medium">
                        ⚠️ Esta resolución podría crear {preview.newConflicts.length} nuevo(s) conflicto(s)
                      </span>
                    </div>
                  )}
                </motion.div>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

export const ConflictResolution: React.FC<ConflictResolutionProps> = ({
  conflicts,
  entries,
  onResolveConflict,
  onPreviewResolution,
  onBatchResolve,
  autoResolveEnabled = false,
  onToggleAutoResolve,
  isLoading = false,
  className
}) => {
  const [expandedConflicts, setExpandedConflicts] = useState<Set<string>>(new Set())
  const [selectedConflicts, setSelectedConflicts] = useState<Set<string>>(new Set())
  const [batchStrategy, setBatchStrategy] = useState<ResolutionStrategy | null>(null)

  // Group conflicts by severity
  const groupedConflicts = useMemo(() => {
    const groups = {
      critical: conflicts.filter(c => c.severity === 'critical'),
      high: conflicts.filter(c => c.severity === 'high'),
      medium: conflicts.filter(c => c.severity === 'medium'),
      low: conflicts.filter(c => c.severity === 'low')
    }
    return groups
  }, [conflicts])

  // Toggle conflict expansion
  const toggleConflictExpansion = useCallback((conflictId: string) => {
    setExpandedConflicts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(conflictId)) {
        newSet.delete(conflictId)
      } else {
        newSet.add(conflictId)
      }
      return newSet
    })
  }, [])

  // Handle conflict resolution
  const handleResolveConflict = useCallback(async (conflictId: string, strategy: ResolutionStrategy) => {
    await onResolveConflict(conflictId, strategy)
  }, [onResolveConflict])

  // Handle batch resolution
  const handleBatchResolve = useCallback(async () => {
    if (!batchStrategy || selectedConflicts.size === 0) return

    const resolutions = Array.from(selectedConflicts).map(conflictId => ({
      conflictId,
      strategy: batchStrategy
    }))

    await onBatchResolve(resolutions)
    setSelectedConflicts(new Set())
    setBatchStrategy(null)
  }, [batchStrategy, selectedConflicts, onBatchResolve])

  if (conflicts.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            ¡No hay conflictos!
          </h3>
          <p className="text-gray-600">
            Todos los horarios están funcionando correctamente.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Resolución de Conflictos</h2>
          <p className="text-gray-600 mt-1">
            {conflicts.length} conflicto(s) detectado(s) en el sistema
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onToggleAutoResolve && (
            <Button
              variant={autoResolveEnabled ? 'default' : 'outline'}
              size="sm"
              onClick={() => onToggleAutoResolve(!autoResolveEnabled)}
              className="flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Auto-resolver
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpandedConflicts(new Set(conflicts.map(c => c.id)))}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Expandir Todo
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(groupedConflicts).map(([severity, conflictList]) => {
          const config = getSeverityConfig(severity)
          const SeverityIcon = config.icon

          return (
            <Card key={severity} className={config.borderColor}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 capitalize">{severity}</p>
                    <p className="text-2xl font-bold text-gray-900">{conflictList.length}</p>
                  </div>
                  <div className={`p-2 rounded-lg ${config.bgColor}`}>
                    <SeverityIcon className={`w-6 h-6 ${config.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Batch Operations */}
      {selectedConflicts.size > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-900">
                  {selectedConflicts.size} conflicto(s) seleccionado(s)
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <select
                  value={batchStrategy?.id || ''}
                  onChange={(e) => {
                    const strategy = e.target.value ? { 
                      id: e.target.value, 
                      type: 'auto' as const, 
                      name: 'Resolución automática', 
                      description: 'Aplicar resolución automática', 
                      impact: 'low' as const, 
                      confidence: 0.8 
                    } : null
                    setBatchStrategy(strategy)
                  }}
                  className="px-3 py-1 border border-blue-300 rounded text-sm"
                >
                  <option value="">Seleccionar estrategia...</option>
                  <option value="auto">Resolución automática</option>
                  <option value="ignore">Ignorar conflictos</option>
                </select>
                
                <Button
                  size="sm"
                  onClick={handleBatchResolve}
                  disabled={!batchStrategy || isLoading}
                  className="flex items-center gap-2"
                >
                  <Zap className="w-3 h-3" />
                  Resolver en Lote
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conflicts List */}
      <div className="space-y-4">
        {Object.entries(groupedConflicts).map(([severity, conflictList]) => {
          if (conflictList.length === 0) return null

          return (
            <div key={severity}>
              <h3 className="text-lg font-medium text-gray-900 mb-3 capitalize">
                Conflictos {severity} ({conflictList.length})
              </h3>
              
              <div className="space-y-3">
                {conflictList.map((conflict) => (
                  <ConflictItem
                    key={conflict.id}
                    conflict={conflict}
                    entries={entries}
                    onResolve={(strategy) => handleResolveConflict(conflict.id, strategy)}
                    onPreview={(strategy) => onPreviewResolution(conflict.id, strategy)}
                    isExpanded={expandedConflicts.has(conflict.id)}
                    onToggleExpanded={() => toggleConflictExpansion(conflict.id)}
                    isLoading={isLoading}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ConflictResolution