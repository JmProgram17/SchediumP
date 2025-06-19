/**
 * TouchScheduleMatrix Component - Mobile-optimized schedule matrix with touch gestures
 * Provides intuitive touch interactions for mobile schedule management
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { 
  Calendar, 
  Clock, 
  Plus, 
  Edit3, 
  Trash2, 
  Move, 
  Copy,
  ZoomIn,
  ZoomOut,
  Grid,
  List,
  Search,
  Filter,
  MoreVertical,
  Vibrate,
  Smartphone
} from 'lucide-react'

import { Card, CardContent } from '@/design-system/components/Card'
import { Button } from '@/design-system/components/Button'
import { Badge } from '@/design-system/components/Badge'
import { Tooltip } from '@/design-system/components/Tooltip'

import { ScheduleEntry, TimeSlot, DayOfWeek, ScheduleStatus } from '../../types'
import { useScheduleMobileGestures, MobileScheduleGestures } from '../../hooks/useMobileGestures'

interface TouchScheduleMatrixProps {
  entries: ScheduleEntry[]
  onEntryCreate?: (day: DayOfWeek, timeSlot: TimeSlot) => void
  onEntryUpdate?: (entry: ScheduleEntry) => void
  onEntryDelete?: (entryId: string) => void
  onEntryMove?: (entryId: string, newDay: DayOfWeek, newTimeSlot: TimeSlot) => void
  onSelectionChange?: (selectedEntries: ScheduleEntry[]) => void
  viewMode?: 'grid' | 'list'
  zoomLevel?: number
  onZoomChange?: (zoom: number) => void
  className?: string
}

interface CellPosition {
  day: DayOfWeek
  timeSlot: TimeSlot
  x: number
  y: number
}

interface TouchFeedback {
  type: 'success' | 'warning' | 'error' | 'info'
  message: string
  position: { x: number; y: number }
  id: string
}

// Touch-optimized entry card
const TouchEntryCard: React.FC<{
  entry: ScheduleEntry
  isDragging: boolean
  isSelected: boolean
  onTap: () => void
  onLongPress: () => void
  onDragStart: () => void
  scale?: number
}> = ({ entry, isDragging, isSelected, onTap, onLongPress, onDragStart, scale = 1 }) => {
  const getStatusColor = () => {
    const colors = {
      [ScheduleStatus.DRAFT]: 'bg-gray-100 border-gray-300',
      [ScheduleStatus.PENDING]: 'bg-yellow-100 border-yellow-300',
      [ScheduleStatus.CONFIRMED]: 'bg-green-100 border-green-300',
      [ScheduleStatus.CANCELLED]: 'bg-red-100 border-red-300'
    }
    return colors[entry.status] || colors[ScheduleStatus.DRAFT]
  }

  const getPriorityIndicator = () => {
    const indicators = {
      low: 'bg-blue-400',
      medium: 'bg-orange-400',
      high: 'bg-red-400'
    }
    return indicators[entry.priority] || indicators.medium
  }

  return (
    <motion.div
      layout
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ 
        scale: isDragging ? 1.05 * scale : scale, 
        opacity: 1,
        zIndex: isDragging ? 1000 : 1
      }}
      exit={{ scale: 0.8, opacity: 0 }}
      whileTap={{ scale: scale * 0.95 }}
      drag={isDragging}
      dragElastic={0.1}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      className={`
        relative p-3 rounded-lg border-2 cursor-pointer touch-none select-none
        ${getStatusColor()}
        ${isSelected ? 'ring-2 ring-blue-500' : ''}
        ${isDragging ? 'shadow-lg' : 'shadow-sm'}
        transition-all duration-200
      `}
      style={{
        minHeight: '60px',
        fontSize: `${0.875 * scale}rem`
      }}
    >
      {/* Priority indicator */}
      <div className={`absolute top-1 left-1 w-2 h-2 rounded-full ${getPriorityIndicator()}`} />
      
      {/* Entry content */}
      <div className="space-y-1">
        <h4 className="font-medium text-gray-900 leading-tight line-clamp-2">
          {entry.title}
        </h4>
        
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <Clock className="w-3 h-3" />
          <span>{entry.timeSlot.start}-{entry.timeSlot.end}</span>
        </div>
        
        {entry.classroomId && (
          <div className="text-xs text-gray-500 truncate">
            Aula: {entry.classroomId}
          </div>
        )}
      </div>
      
      {/* Status badge */}
      <Badge 
        variant={entry.status === ScheduleStatus.CONFIRMED ? 'default' : 'outline'}
        size="sm"
        className="absolute top-1 right-1 text-xs"
      >
        {entry.status}
      </Badge>
      
      {/* Touch indicators */}
      {isDragging && (
        <motion.div
          className="absolute inset-0 border-2 border-dashed border-blue-400 rounded-lg bg-blue-50 bg-opacity-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
      )}
    </motion.div>
  )
}

// Touch feedback component
const TouchFeedback: React.FC<{
  feedback: TouchFeedback
  onComplete: () => void
}> = ({ feedback, onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2000)
    return () => clearTimeout(timer)
  }, [onComplete])

  const getColorClass = () => {
    const colors = {
      success: 'bg-green-500 text-white',
      warning: 'bg-yellow-500 text-white',
      error: 'bg-red-500 text-white',
      info: 'bg-blue-500 text-white'
    }
    return colors[feedback.type]
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -20 }}
      className={`
        fixed z-50 px-3 py-2 rounded-lg text-sm font-medium shadow-lg
        ${getColorClass()}
      `}
      style={{
        left: feedback.position.x - 60,
        top: feedback.position.y - 40,
        pointerEvents: 'none'
      }}
    >
      <Vibrate className="w-4 h-4 inline mr-1" />
      {feedback.message}
    </motion.div>
  )
}

// Grid cell component
const GridCell: React.FC<{
  day: DayOfWeek
  timeSlot: TimeSlot
  entries: ScheduleEntry[]
  isHighlighted: boolean
  onTap: () => void
  onLongPress: () => void
  scale: number
}> = ({ day, timeSlot, entries, isHighlighted, onTap, onLongPress, scale }) => {
  const cellHeight = 80 * scale

  return (
    <div
      className={`
        relative border border-gray-200 bg-white transition-colors duration-200
        ${isHighlighted ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'}
      `}
      style={{ minHeight: cellHeight }}
    >
      {/* Time indicator */}
      <div className="absolute top-1 left-1 text-xs text-gray-500">
        {timeSlot.start}
      </div>
      
      {/* Entries in this cell */}
      <div className="p-2 pt-6 space-y-2">
        {entries.map((entry) => (
          <TouchEntryCard
            key={entry.id}
            entry={entry}
            isDragging={false}
            isSelected={false}
            onTap={onTap}
            onLongPress={onLongPress}
            onDragStart={() => {}}
            scale={scale * 0.8}
          />
        ))}
      </div>
      
      {/* Add button */}
      {entries.length === 0 && (
        <button
          className="absolute inset-0 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
          onClick={onTap}
        >
          <Plus className={`w-${4 * scale} h-${4 * scale}`} />
        </button>
      )}
    </div>
  )
}

export const TouchScheduleMatrix: React.FC<TouchScheduleMatrixProps> = ({
  entries,
  onEntryCreate,
  onEntryUpdate,
  onEntryDelete,
  onEntryMove,
  onSelectionChange,
  viewMode = 'grid',
  zoomLevel = 1,
  onZoomChange,
  className
}) => {
  const [selectedEntries, setSelectedEntries] = useState<ScheduleEntry[]>([])
  const [draggedEntry, setDraggedEntry] = useState<ScheduleEntry | null>(null)
  const [highlightedCell, setHighlightedCell] = useState<CellPosition | null>(null)
  const [touchFeedbacks, setTouchFeedbacks] = useState<TouchFeedback[]>([])
  const [showActions, setShowActions] = useState(false)
  
  const matrixRef = useRef<HTMLDivElement>(null)

  // Days and time slots
  const days: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  const timeSlots: TimeSlot[] = useMemo(() => {
    const slots: TimeSlot[] = []
    for (let hour = 8; hour < 20; hour++) {
      slots.push({
        start: `${hour.toString().padStart(2, '0')}:00`,
        end: `${(hour + 1).toString().padStart(2, '0')}:00`
      })
    }
    return slots
  }, [])

  // Group entries by position
  const entriesByPosition = useMemo(() => {
    const grouped: Record<string, ScheduleEntry[]> = {}
    
    entries.forEach(entry => {
      const key = `${entry.dayOfWeek}-${entry.timeSlot.start}`
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(entry)
    })
    
    return grouped
  }, [entries])

  // Add touch feedback
  const addTouchFeedback = useCallback((
    type: TouchFeedback['type'],
    message: string,
    position: { x: number; y: number }
  ) => {
    const feedback: TouchFeedback = {
      type,
      message,
      position,
      id: `feedback_${Date.now()}`
    }
    
    setTouchFeedbacks(prev => [...prev, feedback])
  }, [])

  // Remove touch feedback
  const removeTouchFeedback = useCallback((id: string) => {
    setTouchFeedbacks(prev => prev.filter(f => f.id !== id))
  }, [])

  // Get position from coordinates
  const getPositionFromCoordinates = useCallback((x: number, y: number): CellPosition | null => {
    if (!matrixRef.current) return null
    
    const rect = matrixRef.current.getBoundingClientRect()
    const relativeX = x - rect.left
    const relativeY = y - rect.top
    
    // Calculate grid position based on layout
    const cellWidth = rect.width / days.length
    const cellHeight = (80 * zoomLevel)
    
    const dayIndex = Math.floor(relativeX / cellWidth)
    const timeIndex = Math.floor((relativeY - 40) / cellHeight) // Account for header
    
    if (dayIndex < 0 || dayIndex >= days.length || timeIndex < 0 || timeIndex >= timeSlots.length) {
      return null
    }
    
    return {
      day: days[dayIndex],
      timeSlot: timeSlots[timeIndex],
      x: relativeX,
      y: relativeY
    }
  }, [days, timeSlots, zoomLevel])

  // Mobile gesture handlers
  const gestureHandlers: MobileScheduleGestures = {
    onEntryTap: (entry, point) => {
      if (selectedEntries.includes(entry)) {
        setSelectedEntries(prev => prev.filter(e => e.id !== entry.id))
      } else {
        setSelectedEntries(prev => [...prev, entry])
      }
      addTouchFeedback('info', 'Entrada seleccionada', point)
      onSelectionChange?.(selectedEntries)
    },

    onEntryLongPress: (entry, point) => {
      setShowActions(true)
      addTouchFeedback('info', 'Opciones disponibles', point)
    },

    onEntryDragStart: (entry, point) => {
      setDraggedEntry(entry)
      addTouchFeedback('info', 'Arrastrando entrada', point)
    },

    onEntryDrag: (entry, delta, newPosition) => {
      setHighlightedCell(getPositionFromCoordinates(delta.x, delta.y))
    },

    onEntryDragEnd: (entry, finalPosition) => {
      if (finalPosition) {
        onEntryMove?.(entry.id, finalPosition.day, finalPosition.timeSlot)
        addTouchFeedback('success', 'Entrada movida', { x: 0, y: 0 })
      }
      setDraggedEntry(null)
      setHighlightedCell(null)
    },

    onCellTap: (day, timeSlot, point) => {
      onEntryCreate?.(day, timeSlot)
      addTouchFeedback('success', 'Nueva entrada', point)
    },

    onCellLongPress: (day, timeSlot, point) => {
      addTouchFeedback('info', 'Opciones de celda', point)
    },

    onPinchToZoom: (scale, center) => {
      const newZoom = Math.max(0.5, Math.min(2, scale))
      onZoomChange?.(newZoom)
    },

    onSwipeToNavigate: (direction) => {
      if (direction === 'left' || direction === 'right') {
        // Navigate between weeks
        addTouchFeedback('info', direction === 'left' ? 'Semana siguiente' : 'Semana anterior', { x: 0, y: 0 })
      }
    }
  }

  // Use mobile gestures hook
  const { bind, gestureState, supportsTouchActions } = useScheduleMobileGestures(gestureHandlers, {
    enableHapticFeedback: true,
    longPressDelay: 600
  })

  // Handle zoom controls
  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(2, zoomLevel + 0.25)
    onZoomChange?.(newZoom)
  }, [zoomLevel, onZoomChange])

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(0.5, zoomLevel - 0.25)
    onZoomChange?.(newZoom)
  }, [zoomLevel, onZoomChange])

  // Render grid view
  const renderGridView = () => (
    <div className="overflow-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b">
        <div className="grid grid-cols-8 gap-0">
          <div className="p-2 text-sm font-medium text-gray-600 border-r">
            Hora
          </div>
          {days.map((day) => (
            <div key={day} className="p-2 text-sm font-medium text-gray-900 text-center border-r last:border-r-0">
              {day.charAt(0).toUpperCase() + day.slice(1, 3)}
            </div>
          ))}
        </div>
      </div>

      {/* Time slots */}
      <div className="space-y-0">
        {timeSlots.map((timeSlot) => (
          <div key={timeSlot.start} className="grid grid-cols-8 gap-0 border-b">
            {/* Time label */}
            <div className="p-2 text-sm text-gray-600 border-r bg-gray-50 flex items-center">
              {timeSlot.start}
            </div>
            
            {/* Day cells */}
            {days.map((day) => {
              const cellKey = `${day}-${timeSlot.start}`
              const cellEntries = entriesByPosition[cellKey] || []
              const isHighlighted = highlightedCell?.day === day && highlightedCell?.timeSlot.start === timeSlot.start
              
              return (
                <GridCell
                  key={cellKey}
                  day={day}
                  timeSlot={timeSlot}
                  entries={cellEntries}
                  isHighlighted={isHighlighted}
                  onTap={() => gestureHandlers.onCellTap?.(day, timeSlot, { x: 0, y: 0, timestamp: Date.now(), identifier: 0 })}
                  onLongPress={() => gestureHandlers.onCellLongPress?.(day, timeSlot, { x: 0, y: 0, timestamp: Date.now(), identifier: 0 })}
                  scale={zoomLevel}
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )

  // Render list view
  const renderListView = () => (
    <div className="space-y-2 p-4">
      {entries.map((entry) => (
        <TouchEntryCard
          key={entry.id}
          entry={entry}
          isDragging={draggedEntry?.id === entry.id}
          isSelected={selectedEntries.some(e => e.id === entry.id)}
          onTap={() => gestureHandlers.onEntryTap?.(entry, { x: 0, y: 0, timestamp: Date.now(), identifier: 0 })}
          onLongPress={() => gestureHandlers.onEntryLongPress?.(entry, { x: 0, y: 0, timestamp: Date.now(), identifier: 0 })}
          onDragStart={() => gestureHandlers.onEntryDragStart?.(entry, { x: 0, y: 0, timestamp: Date.now(), identifier: 0 })}
          scale={zoomLevel}
        />
      ))}
    </div>
  )

  return (
    <div className={`relative h-full ${className}`}>
      {/* Mobile controls */}
      <div className="flex items-center justify-between p-4 bg-white border-b">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {/* Handle view mode change */}}
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {/* Handle view mode change */}}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {supportsTouchActions && (
            <Badge variant="outline" size="sm" className="flex items-center gap-1">
              <Smartphone className="w-3 h-3" />
              Touch
            </Badge>
          )}
          
          <Button variant="outline" size="sm" onClick={handleZoomOut} disabled={zoomLevel <= 0.5}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          
          <span className="text-sm font-medium px-2">
            {Math.round(zoomLevel * 100)}%
          </span>
          
          <Button variant="outline" size="sm" onClick={handleZoomIn} disabled={zoomLevel >= 2}>
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Matrix content */}
      <div
        ref={matrixRef}
        className="flex-1 overflow-hidden"
        {...bind()}
        style={{ touchAction: 'none' }}
      >
        {viewMode === 'grid' ? renderGridView() : renderListView()}
      </div>

      {/* Selection actions */}
      <AnimatePresence>
        {selectedEntries.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg border p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedEntries.length} entrada{selectedEntries.length !== 1 ? 's' : ''} seleccionada{selectedEntries.length !== 1 ? 's' : ''}
              </span>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Edit3 className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Copy className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Move className="w-4 h-4" />
                </Button>
                <Button variant="destructive" size="sm">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Touch feedback */}
      <AnimatePresence>
        {touchFeedbacks.map((feedback) => (
          <TouchFeedback
            key={feedback.id}
            feedback={feedback}
            onComplete={() => removeTouchFeedback(feedback.id)}
          />
        ))}
      </AnimatePresence>

      {/* Gesture state indicator */}
      {gestureState.isActive && (
        <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
          {gestureState.type || 'touch'}
        </div>
      )}
    </div>
  )
}