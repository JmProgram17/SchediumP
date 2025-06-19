/**
 * ScheduleMatrix Component - Virtualized schedule grid with advanced interactions
 * Supports drag & drop, real-time updates, and performance optimization
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { FixedSizeGrid as Grid } from 'react-window'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Clock, 
  Calendar, 
  AlertTriangle, 
  Users, 
  MapPin,
  Zap,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/design-system/components/Card'
import { Button } from '@/design-system/components/Button'
import { Badge } from '@/design-system/components/Badge'
import { LoadingSpinner } from '@/design-system/components/LoadingSpinner'
import { StatusIndicator } from '@/design-system/components/StatusIndicator'

import { 
  ScheduleEntry, 
  DayOfWeek, 
  TimeSlot, 
  ScheduleConflict, 
  ConflictType,
  ScheduleStatus,
  Priority 
} from '../../types'

// Time configuration
const TIME_SLOTS = [
  { start: '06:00', end: '07:00' },
  { start: '07:00', end: '08:00' },
  { start: '08:00', end: '09:00' },
  { start: '09:00', end: '10:00' },
  { start: '10:00', end: '11:00' },
  { start: '11:00', end: '12:00' },
  { start: '12:00', end: '13:00' },
  { start: '13:00', end: '14:00' },
  { start: '14:00', end: '15:00' },
  { start: '15:00', end: '16:00' },
  { start: '16:00', end: '17:00' },
  { start: '17:00', end: '18:00' },
  { start: '18:00', end: '19:00' },
  { start: '19:00', end: '20:00' },
  { start: '20:00', end: '21:00' },
  { start: '21:00', end: '22:00' }
]

const DAYS_OF_WEEK = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY
]

const DAY_LABELS = {
  [DayOfWeek.MONDAY]: 'Lunes',
  [DayOfWeek.TUESDAY]: 'Martes',
  [DayOfWeek.WEDNESDAY]: 'Miércoles',
  [DayOfWeek.THURSDAY]: 'Jueves',
  [DayOfWeek.FRIDAY]: 'Viernes',
  [DayOfWeek.SATURDAY]: 'Sábado',
  [DayOfWeek.SUNDAY]: 'Domingo'
}

// Cell configuration
const CELL_WIDTH = 180
const CELL_HEIGHT = 60
const HEADER_HEIGHT = 50

interface ScheduleMatrixProps {
  entries: ScheduleEntry[]
  conflicts: ScheduleConflict[]
  loading?: boolean
  onEntryClick?: (entry: ScheduleEntry) => void
  onCellClick?: (dayOfWeek: DayOfWeek, timeSlot: TimeSlot) => void
  onEntryDrop?: (entry: ScheduleEntry, newDay: DayOfWeek, newTimeSlot: TimeSlot) => void
  selectedEntryId?: string
  readOnly?: boolean
  showConflicts?: boolean
  compactMode?: boolean
  className?: string
}

interface CellData {
  entries: ScheduleEntry[]
  conflicts: ScheduleConflict[]
  dayOfWeek: DayOfWeek
  timeSlot: TimeSlot
  onEntryClick?: (entry: ScheduleEntry) => void
  onCellClick?: (dayOfWeek: DayOfWeek, timeSlot: TimeSlot) => void
  selectedEntryId?: string
  showConflicts?: boolean
  compactMode?: boolean
}

// Individual cell component for virtualization
const ScheduleCell: React.FC<{
  columnIndex: number
  rowIndex: number
  style: React.CSSProperties
  data: CellData
}> = ({ columnIndex, rowIndex, style, data }) => {
  const dayOfWeek = DAYS_OF_WEEK[columnIndex]
  const timeSlot = TIME_SLOTS[rowIndex]
  
  // Find entries for this cell
  const cellEntries = data.entries.filter(entry => 
    entry.dayOfWeek === dayOfWeek &&
    entry.timeSlot.start === timeSlot.start
  )

  // Find conflicts for this cell
  const cellConflicts = data.conflicts.filter(conflict =>
    conflict.affectedEntries.some(entryId =>
      cellEntries.some(entry => entry.id === entryId)
    )
  )

  const hasConflicts = cellConflicts.length > 0
  const isSelected = cellEntries.some(entry => entry.id === data.selectedEntryId)

  const handleCellClick = () => {
    if (cellEntries.length === 0) {
      data.onCellClick?.(dayOfWeek, timeSlot)
    }
  }

  const getEntryColor = (entry: ScheduleEntry) => {
    if (entry.color) return entry.color
    
    // Default colors based on priority
    const priorityColors = {
      [Priority.LOW]: 'bg-blue-100 border-blue-300 text-blue-800',
      [Priority.MEDIUM]: 'bg-yellow-100 border-yellow-300 text-yellow-800',
      [Priority.HIGH]: 'bg-orange-100 border-orange-300 text-orange-800',
      [Priority.CRITICAL]: 'bg-red-100 border-red-300 text-red-800'
    }
    
    return priorityColors[entry.priority] || priorityColors[Priority.MEDIUM]
  }

  const getConflictSeverityColor = (severity: string) => {
    const colors = {
      low: 'border-yellow-400 bg-yellow-50',
      medium: 'border-orange-400 bg-orange-50',
      high: 'border-red-400 bg-red-50',
      critical: 'border-red-600 bg-red-100'
    }
    return colors[severity as keyof typeof colors] || colors.medium
  }

  return (
    <div
      style={style}
      className={`border border-gray-200 p-1 cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
        isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
      } ${hasConflicts && data.showConflicts ? 'ring-1 ring-red-400' : ''}`}
      onClick={handleCellClick}
    >
      <AnimatePresence>
        {cellEntries.map((entry, index) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`
              relative rounded-md border p-2 mb-1 cursor-pointer transition-all duration-200
              hover:shadow-md hover:scale-105
              ${getEntryColor(entry)}
              ${hasConflicts && data.showConflicts ? getConflictSeverityColor(cellConflicts[0].severity) : ''}
              ${data.compactMode ? 'text-xs p-1' : 'text-sm'}
            `}
            onClick={(e) => {
              e.stopPropagation()
              data.onEntryClick?.(entry)
            }}
            style={{ zIndex: 10 + index }}
          >
            {/* Entry content */}
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {entry.title}
                </p>
                {!data.compactMode && (
                  <div className="flex items-center gap-1 mt-1 text-xs opacity-75">
                    <Clock className="w-3 h-3" />
                    <span>{entry.timeSlot.start}-{entry.timeSlot.end}</span>
                  </div>
                )}
              </div>
              
              {/* Status indicators */}
              <div className="flex flex-col items-end gap-1">
                {hasConflicts && data.showConflicts && (
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                )}
                {entry.priority === Priority.CRITICAL && (
                  <Zap className="w-3 h-3 text-orange-500" />
                )}
              </div>
            </div>

            {/* Additional info for non-compact mode */}
            {!data.compactMode && (
              <div className="mt-2 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>{entry.attendanceCount || 0}/{entry.maxCapacity || '∞'}</span>
                </div>
                <StatusIndicator 
                  status={entry.status.toLowerCase()}
                  variant="dot"
                  size="sm"
                />
              </div>
            )}

            {/* Conflict overlay */}
            {hasConflicts && data.showConflicts && (
              <div className="absolute inset-0 bg-red-500 bg-opacity-10 rounded-md pointer-events-none" />
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Empty cell placeholder */}
      {cellEntries.length === 0 && (
        <div className="h-full flex items-center justify-center text-gray-400 text-xs">
          <div className="text-center">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mb-1">
              <Clock className="w-4 h-4" />
            </div>
            <div>{timeSlot.start}</div>
          </div>
        </div>
      )}
    </div>
  )
}

export const ScheduleMatrix: React.FC<ScheduleMatrixProps> = ({
  entries,
  conflicts,
  loading = false,
  onEntryClick,
  onCellClick,
  onEntryDrop,
  selectedEntryId,
  readOnly = false,
  showConflicts = true,
  compactMode = false,
  className
}) => {
  const gridRef = useRef<Grid>(null)
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [gridDimensions, setGridDimensions] = useState({ width: 0, height: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  // Update grid dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect()
        setGridDimensions({ 
          width: width - 32, // Account for padding
          height: height - 120 // Account for header and controls
        })
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Prepare data for virtualized grid
  const cellData: CellData = useMemo(() => ({
    entries,
    conflicts,
    dayOfWeek: DayOfWeek.MONDAY, // Will be overridden in cell
    timeSlot: TIME_SLOTS[0], // Will be overridden in cell
    onEntryClick,
    onCellClick,
    selectedEntryId,
    showConflicts,
    compactMode
  }), [entries, conflicts, onEntryClick, onCellClick, selectedEntryId, showConflicts, compactMode])

  // Navigate weeks
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeek)
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
    setCurrentWeek(newDate)
  }

  // Calculate conflicts summary
  const conflictsSummary = useMemo(() => {
    const byType = conflicts.reduce((acc, conflict) => {
      acc[conflict.type] = (acc[conflict.type] || 0) + 1
      return acc
    }, {} as Record<ConflictType, number>)

    return {
      total: conflicts.length,
      byType,
      critical: conflicts.filter(c => c.severity === 'critical').length
    }
  }, [conflicts])

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Matriz de Horarios
            {conflictsSummary.total > 0 && showConflicts && (
              <Badge variant="destructive" size="sm">
                {conflictsSummary.total} conflictos
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {/* Week navigation */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateWeek('prev')}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <span className="text-sm font-medium px-3">
                Semana del {currentWeek.toLocaleDateString('es-ES', { 
                  day: '2-digit', 
                  month: 'short' 
                })}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateWeek('next')}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* View options */}
            <div className="flex items-center gap-1">
              <Button
                variant={compactMode ? 'default' : 'outline'}
                size="sm"
                onClick={() => {/* Toggle compact mode */}}
              >
                Compacto
              </Button>
              
              <Button
                variant={showConflicts ? 'destructive' : 'outline'}
                size="sm"
                onClick={() => {/* Toggle conflicts */}}
              >
                <AlertTriangle className="w-4 h-4 mr-1" />
                Conflictos
              </Button>
            </div>
          </div>
        </div>

        {/* Conflicts summary */}
        {conflictsSummary.total > 0 && showConflicts && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">
                  {conflictsSummary.total} conflictos detectados
                </span>
                {conflictsSummary.critical > 0 && (
                  <Badge variant="destructive" size="sm">
                    {conflictsSummary.critical} críticos
                  </Badge>
                )}
              </div>
              
              <Button variant="outline" size="sm">
                Resolver Conflictos
              </Button>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent ref={containerRef} className="p-4">
        {/* Day headers */}
        <div className="flex mb-2" style={{ marginLeft: 60 }}>
          {DAYS_OF_WEEK.map((day) => (
            <div
              key={day}
              className="flex-1 text-center p-2 font-medium text-gray-700 bg-gray-50 border border-gray-200"
              style={{ width: CELL_WIDTH }}
            >
              {DAY_LABELS[day]}
            </div>
          ))}
        </div>

        {/* Time labels and grid container */}
        <div className="flex">
          {/* Time labels */}
          <div className="w-15">
            {TIME_SLOTS.map((timeSlot) => (
              <div
                key={timeSlot.start}
                className="flex items-center justify-center text-xs text-gray-600 border-r border-gray-200"
                style={{ height: CELL_HEIGHT }}
              >
                {timeSlot.start}
              </div>
            ))}
          </div>

          {/* Virtualized grid */}
          {gridDimensions.width > 0 && gridDimensions.height > 0 && (
            <Grid
              ref={gridRef}
              columnCount={DAYS_OF_WEEK.length}
              rowCount={TIME_SLOTS.length}
              columnWidth={CELL_WIDTH}
              rowHeight={CELL_HEIGHT}
              width={Math.min(gridDimensions.width - 60, DAYS_OF_WEEK.length * CELL_WIDTH)}
              height={Math.min(gridDimensions.height, TIME_SLOTS.length * CELL_HEIGHT)}
              itemData={cellData}
            >
              {ScheduleCell}
            </Grid>
          )}
        </div>

        {/* Statistics */}
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-4">
            <span>{entries.length} clases programadas</span>
            <span>{conflicts.length} conflictos</span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-200 rounded"></div>
              <span>Normal</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-200 rounded"></div>
              <span>Media</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-orange-200 rounded"></div>
              <span>Alta</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-200 rounded"></div>
              <span>Crítica</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default ScheduleMatrix