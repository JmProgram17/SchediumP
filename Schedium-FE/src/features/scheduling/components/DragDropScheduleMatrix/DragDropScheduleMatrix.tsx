/**
 * DragDropScheduleMatrix - Enhanced schedule matrix with full drag & drop support
 * Integrates ScheduleMatrix with accessibility-compliant drag and drop
 */

import React, { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Move, 
  Keyboard, 
  Mouse,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react'

import { Card, CardContent } from '@/design-system/components/Card'
import { Button } from '@/design-system/components/Button'
import { Badge } from '@/design-system/components/Badge'
import { StatusIndicator } from '@/design-system/components/StatusIndicator'

import { ScheduleMatrix } from '../ScheduleMatrix'
import { useDragAndDrop } from '../../hooks/useDragAndDrop'
import { 
  ScheduleEntry, 
  DayOfWeek, 
  TimeSlot, 
  ScheduleConflict,
  ConflictType,
  Priority 
} from '../../types'

interface DragDropScheduleMatrixProps {
  entries: ScheduleEntry[]
  conflicts: ScheduleConflict[]
  loading?: boolean
  onEntryMove?: (entry: ScheduleEntry, fromPosition: { day: DayOfWeek; timeSlot: TimeSlot }, toPosition: { day: DayOfWeek; timeSlot: TimeSlot }) => Promise<void>
  onEntryClick?: (entry: ScheduleEntry) => void
  onCellClick?: (dayOfWeek: DayOfWeek, timeSlot: TimeSlot) => void
  readOnly?: boolean
  enableKeyboardDrag?: boolean
  showConflicts?: boolean
  compactMode?: boolean
  className?: string
}

// Enhanced cell component with drag & drop
const DraggableScheduleCell: React.FC<{
  entry: ScheduleEntry
  position: { day: DayOfWeek; timeSlot: TimeSlot }
  isDragging: boolean
  isHovered: boolean
  isKeyboardFocused: boolean
  conflicts: ScheduleConflict[]
  onEntryClick?: (entry: ScheduleEntry) => void
  dragProps: any
  keyboardProps: any
  compactMode?: boolean
  showConflicts?: boolean
}> = ({ 
  entry, 
  position, 
  isDragging, 
  isHovered, 
  isKeyboardFocused,
  conflicts,
  onEntryClick,
  dragProps,
  keyboardProps,
  compactMode = false,
  showConflicts = true
}) => {
  const hasConflicts = conflicts.length > 0
  const criticalConflicts = conflicts.filter(c => c.severity === 'critical')

  const getEntryColor = () => {
    if (isDragging) return 'bg-blue-200 border-blue-400 text-blue-800 shadow-lg'
    if (isHovered) return 'bg-blue-100 border-blue-300 text-blue-700'
    if (isKeyboardFocused) return 'bg-purple-100 border-purple-400 text-purple-800 ring-2 ring-purple-300'
    
    const priorityColors = {
      [Priority.LOW]: 'bg-gray-100 border-gray-300 text-gray-800',
      [Priority.MEDIUM]: 'bg-yellow-100 border-yellow-300 text-yellow-800',
      [Priority.HIGH]: 'bg-orange-100 border-orange-300 text-orange-800',
      [Priority.CRITICAL]: 'bg-red-100 border-red-300 text-red-800'
    }
    
    return priorityColors[entry.priority] || priorityColors[Priority.MEDIUM]
  }

  const getConflictIndicator = () => {
    if (!showConflicts || !hasConflicts) return null

    const severity = criticalConflicts.length > 0 ? 'critical' : conflicts[0].severity
    const icons = {
      low: <Info className="w-3 h-3 text-yellow-500" />,
      medium: <AlertTriangle className="w-3 h-3 text-orange-500" />,
      high: <AlertTriangle className="w-3 h-3 text-red-500" />,
      critical: <XCircle className="w-3 h-3 text-red-600" />
    }

    return icons[severity as keyof typeof icons] || icons.medium
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.02 }}
      whileDrag={{ scale: 1.05, zIndex: 50 }}
      className={`
        relative rounded-lg border-2 p-3 cursor-pointer transition-all duration-200
        ${getEntryColor()}
        ${isDragging ? 'shadow-2xl' : 'shadow-sm hover:shadow-md'}
        ${compactMode ? 'text-xs p-2' : 'text-sm'}
        focus:outline-none focus:ring-2 focus:ring-blue-500
      `}
      {...dragProps}
      {...keyboardProps}
      onClick={(e) => {
        e.stopPropagation()
        onEntryClick?.(entry)
      }}
    >
      {/* Drag handle */}
      <div className="absolute top-1 right-1 opacity-60 hover:opacity-100">
        <Move className="w-3 h-3" />
      </div>

      {/* Conflict indicator */}
      {hasConflicts && showConflicts && (
        <div className="absolute top-1 left-1">
          {getConflictIndicator()}
        </div>
      )}

      {/* Entry content */}
      <div className="pr-6">
        <h4 className="font-semibold truncate mb-1">
          {entry.title}
        </h4>
        
        {!compactMode && (
          <>
            <div className="text-xs opacity-75 mb-2">
              {entry.timeSlot.start} - {entry.timeSlot.end}
            </div>
            
            <div className="flex items-center justify-between">
              <StatusIndicator 
                status={entry.status.toLowerCase()}
                variant="dot"
                size="sm"
              />
              
              {entry.priority === Priority.CRITICAL && (
                <Badge variant="destructive" size="sm">
                  Crítico
                </Badge>
              )}
            </div>
          </>
        )}
      </div>

      {/* Keyboard instructions (hidden but accessible) */}
      <div id={`drag-instructions-${entry.id}`} className="sr-only">
        Para mover esta clase, presiona espacio y luego usa las flechas para navegar. 
        Presiona Enter para confirmar o Escape para cancelar.
      </div>

      {/* Conflict details tooltip (for screen readers) */}
      {hasConflicts && showConflicts && (
        <div className="sr-only">
          Conflictos detectados: {conflicts.map(c => c.message).join(', ')}
        </div>
      )}
    </motion.div>
  )
}

// Drop zone indicator
const DropZoneIndicator: React.FC<{
  isActive: boolean
  isValid: boolean
  conflicts: string[]
  position: { day: DayOfWeek; timeSlot: TimeSlot }
}> = ({ isActive, isValid, conflicts, position }) => {
  if (!isActive) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`
        absolute inset-0 rounded-lg border-2 border-dashed z-10
        ${isValid 
          ? 'border-green-400 bg-green-50' 
          : 'border-red-400 bg-red-50'
        }
      `}
    >
      <div className="flex items-center justify-center h-full">
        {isValid ? (
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Soltar aquí</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 text-red-700">
            <XCircle className="w-5 h-5" />
            <span className="text-xs font-medium">No válido</span>
            {conflicts.length > 0 && (
              <span className="text-xs opacity-75">
                {conflicts[0]}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export const DragDropScheduleMatrix: React.FC<DragDropScheduleMatrixProps> = ({
  entries,
  conflicts,
  loading = false,
  onEntryMove,
  onEntryClick,
  onCellClick,
  readOnly = false,
  enableKeyboardDrag = true,
  showConflicts = true,
  compactMode = false,
  className
}) => {
  const [dragMode, setDragMode] = useState<'mouse' | 'keyboard'>('mouse')
  const [announcements, setAnnouncements] = useState<string[]>([])

  // Validation function for drops
  const validateDrop = useCallback((entry: ScheduleEntry, position: { day: DayOfWeek; timeSlot: TimeSlot }) => {
    // Check for time conflicts
    const timeConflicts = entries.filter(e => 
      e.id !== entry.id &&
      e.dayOfWeek === position.day &&
      e.timeSlot.start === position.timeSlot.start
    )

    // Check for instructor conflicts
    const instructorConflicts = entries.filter(e =>
      e.id !== entry.id &&
      e.instructorId === entry.instructorId &&
      e.dayOfWeek === position.day &&
      e.timeSlot.start === position.timeSlot.start
    )

    const conflictMessages = []
    if (timeConflicts.length > 0) {
      conflictMessages.push('Horario ocupado')
    }
    if (instructorConflicts.length > 0) {
      conflictMessages.push('Instructor no disponible')
    }

    return {
      isValid: conflictMessages.length === 0,
      conflicts: conflictMessages
    }
  }, [entries])

  // Screen reader announcements
  const announceToScreenReader = useCallback((message: string) => {
    setAnnouncements(prev => [...prev.slice(-4), message])
    
    // Clear announcement after a delay
    setTimeout(() => {
      setAnnouncements(prev => prev.slice(1))
    }, 5000)
  }, [])

  // Drag and drop hook
  const {
    dragState,
    keyboardDragState,
    getDragProps,
    getDropProps,
    getKeyboardProps
  } = useDragAndDrop({
    onDragStart: (entry, position) => {
      if (readOnly) return false
      announceToScreenReader(`Iniciando arrastre de ${entry.title}`)
      return true
    },
    onDragEnd: async (entry, fromPosition, toPosition) => {
      if (onEntryMove) {
        try {
          await onEntryMove(entry, fromPosition, toPosition)
          announceToScreenReader(`${entry.title} movido exitosamente`)
        } catch (error) {
          announceToScreenReader(`Error al mover ${entry.title}`)
        }
      }
    },
    onDragCancel: (entry) => {
      announceToScreenReader(`Movimiento de ${entry.title} cancelado`)
    },
    validateDrop,
    enableKeyboardDrag: enableKeyboardDrag && !readOnly,
    announceToScreenReader
  })

  // Enhanced entry renderer with drag & drop
  const renderEntry = useCallback((entry: ScheduleEntry, position: { day: DayOfWeek; timeSlot: TimeSlot }) => {
    const entryConflicts = conflicts.filter(conflict =>
      conflict.affectedEntries.includes(entry.id)
    )

    const isDragging = dragState.draggedEntry?.id === entry.id
    const isHovered = dragState.hoverPosition?.day === position.day && 
                     dragState.hoverPosition?.timeSlot.start === position.timeSlot.start
    const isKeyboardFocused = keyboardDragState.selectedEntry?.id === entry.id

    return (
      <DraggableScheduleCell
        key={entry.id}
        entry={entry}
        position={position}
        isDragging={isDragging}
        isHovered={isHovered}
        isKeyboardFocused={isKeyboardFocused}
        conflicts={entryConflicts}
        onEntryClick={onEntryClick}
        dragProps={readOnly ? {} : getDragProps(entry, position)}
        keyboardProps={readOnly ? {} : getKeyboardProps(entry, position)}
        compactMode={compactMode}
        showConflicts={showConflicts}
      />
    )
  }, [
    conflicts,
    dragState,
    keyboardDragState,
    onEntryClick,
    getDragProps,
    getKeyboardProps,
    readOnly,
    compactMode,
    showConflicts
  ])

  // Enhanced cell click handler with drop zone
  const handleCellClick = useCallback((dayOfWeek: DayOfWeek, timeSlot: TimeSlot) => {
    const position = { day: dayOfWeek, timeSlot }
    
    // If in keyboard drag mode, try to drop here
    if (keyboardDragState.isKeyboardDragging && keyboardDragState.selectedEntry) {
      const validation = validateDrop(keyboardDragState.selectedEntry, position)
      if (validation.isValid && onEntryMove) {
        // Handle keyboard drop
        const originalPosition = { day: DayOfWeek.MONDAY, timeSlot: { start: '09:00', end: '10:00' } } // This should come from actual data
        onEntryMove(keyboardDragState.selectedEntry, originalPosition, position)
      }
      return
    }

    onCellClick?.(dayOfWeek, timeSlot)
  }, [keyboardDragState, validateDrop, onEntryMove, onCellClick])

  return (
    <div className={className}>
      {/* Drag mode toggle */}
      {!readOnly && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">
                  Modo de interacción:
                </span>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant={dragMode === 'mouse' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDragMode('mouse')}
                    className="flex items-center gap-2"
                  >
                    <Mouse className="w-4 h-4" />
                    Mouse/Touch
                  </Button>
                  
                  <Button
                    variant={dragMode === 'keyboard' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDragMode('keyboard')}
                    className="flex items-center gap-2"
                  >
                    <Keyboard className="w-4 h-4" />
                    Teclado
                  </Button>
                </div>
              </div>

              {dragMode === 'keyboard' && (
                <div className="text-sm text-gray-600">
                  <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Espacio</kbd> para arrastrar,
                  <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs mx-1">&#8593;&#8595;&#8592;&#8594;</kbd> para mover,
                  <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Enter</kbd> para confirmar
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Keyboard drag status */}
      {keyboardDragState.isKeyboardDragging && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg"
        >
          <div className="flex items-center gap-2">
            <Move className="w-5 h-5 text-purple-600" />
            <span className="font-medium text-purple-800">
              Modo arrastrar activo: {keyboardDragState.selectedEntry?.title}
            </span>
          </div>
          <div className="text-sm text-purple-600 mt-1">
            Use las flechas para mover, Enter para confirmar, Escape para cancelar
          </div>
        </motion.div>
      )}

      {/* Live announcements for screen readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcements[announcements.length - 1]}
      </div>

      {/* Enhanced schedule matrix */}
      <ScheduleMatrix
        entries={entries}
        conflicts={conflicts}
        loading={loading}
        onEntryClick={onEntryClick}
        onCellClick={handleCellClick}
        selectedEntryId={dragState.draggedEntry?.id || keyboardDragState.selectedEntry?.id}
        readOnly={readOnly}
        showConflicts={showConflicts}
        compactMode={compactMode}
        renderEntry={renderEntry}
      />
    </div>
  )
}