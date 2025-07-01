/**
 * Time Block & Schedule Configuration Component
 * Manages time blocks and weekdays for scheduling with visual preview
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Clock, 
  Calendar,
  AlertTriangle,
  Info,
  RefreshCw,
  Check,
  ChevronDown,
  Settings
} from 'lucide-react'
import { Typography, Button } from '@/design-system/components'
import { cn } from '@/utils/cn'
import toast from 'react-hot-toast'

// Import hooks
import { 
  useTimeBlocks, 
  useCreateTimeBlock, 
  useDeleteTimeBlock,
  useUpdateTimeBlock,
  useDays,
  useUpdateDayConfig,
  useActiveScheduleConfig
} from '@/services/query/hooks/academic-config.hooks'
import type { TimeBlock, TimeBlockCreate, DayConfig } from '@/services/api/academic-config.api'
import { ScheduleConfigSettings } from './ScheduleConfigSettings'

interface GeneratedBlock {
  start_time: string
  end_time: string
  name: string
  description?: string
}

export function TimeBlockManagement() {
  const [uniformDuration, setUniformDuration] = useState<number>(120) // minutes
  const [startTime, setStartTime] = useState<string>('06:00')
  const [endTime, setEndTime] = useState<string>('22:00')
  const [isApplying, setIsApplying] = useState(false)
  const [previewBlocks, setPreviewBlocks] = useState<GeneratedBlock[]>([])
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]) // Monday to Friday by default
  const [isCompactView, setIsCompactView] = useState<boolean>(true) // Default to compact view
  const [showDaysDropdown, setShowDaysDropdown] = useState<boolean>(false)
  const [showScheduleConfig, setShowScheduleConfig] = useState<boolean>(false)
  
  // Query hooks
  const { data: timeBlocksData, isLoading: isLoadingBlocks, error: blocksError } = useTimeBlocks()
  const { data: daysData, isLoading: isLoadingDays, error: daysError } = useDays()
  const { data: scheduleConfigData } = useActiveScheduleConfig()
  
  // Mutation hooks
  const createMutation = useCreateTimeBlock()
  const deleteMutation = useDeleteTimeBlock()
  const updateTimeBlockMutation = useUpdateTimeBlock()
  const updateDayMutation = useUpdateDayConfig()

  const timeBlocks = timeBlocksData?.time_blocks || []
  const days = daysData?.days || []
  const isLoading = isLoadingBlocks || isLoadingDays
  const error = blocksError || daysError

  const addMinutesToTime = (time: string, minutes: number): string => {
    const [hour, min] = time.split(':').map(Number)
    const totalMinutes = hour * 60 + min + minutes
    const newHour = Math.floor(totalMinutes / 60)
    const newMin = totalMinutes % 60
    return `${newHour.toString().padStart(2, '0')}:${newMin.toString().padStart(2, '0')}`
  }

  const getTimeDifferenceInMinutes = (start: string, end: string): number => {
    const [startHour, startMin] = start.split(':').map(Number)
    const [endHour, endMin] = end.split(':').map(Number)
    return (endHour * 60 + endMin) - (startHour * 60 + startMin)
  }

  const generateUniformBlocks = (): GeneratedBlock[] => {
    const blocks: GeneratedBlock[] = []
    let currentTime = startTime
    const totalMinutes = getTimeDifferenceInMinutes(startTime, endTime)
    const maxBlocks = Math.floor(totalMinutes / uniformDuration)
    
    for (let i = 0; i < maxBlocks; i++) {
      const blockEndTime = addMinutesToTime(currentTime, uniformDuration)
      
      // Check if block end time exceeds day end time
      if (getTimeDifferenceInMinutes(blockEndTime, endTime) < 0) {
        break
      }
      
      blocks.push({
        start_time: currentTime,
        end_time: blockEndTime,
        name: `Bloque ${i + 1}`,
        description: `Bloque de ${uniformDuration} minutos`
      })
      
      currentTime = blockEndTime
    }
    
    return blocks
  }

  // Generate time slots every 30 minutes for the schedule view
  const generateTimeSlots = (): string[] => {
    const slots: string[] = []
    const startMinutes = getTimeDifferenceInMinutes('00:00', startTime)
    const endMinutes = getTimeDifferenceInMinutes('00:00', endTime)
    
    for (let minutes = startMinutes; minutes <= endMinutes; minutes += 30) {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      const timeString = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
      slots.push(timeString)
    }
    
    return slots
  }

  // Generate compact blocks view (first 3 blocks + ... + last block)
  const generateCompactBlocks = (): (GeneratedBlock | string)[] => {
    if (previewBlocks.length <= 4) return previewBlocks // If 4 or fewer blocks, show all
    
    const compactBlocks: (GeneratedBlock | string)[] = []
    
    // Add first 3 blocks
    for (let i = 0; i < 3; i++) {
      compactBlocks.push(previewBlocks[i])
    }
    
    // Add ellipsis indicator
    compactBlocks.push('...')
    
    // Add last block
    compactBlocks.push(previewBlocks[previewBlocks.length - 1])
    
    return compactBlocks
  }

  // Generate preview blocks when duration or times change
  useEffect(() => {
    setPreviewBlocks(generateUniformBlocks())
  }, [uniformDuration, startTime, endTime])

  // Helper function for day configuration (used internally by handleApplyConfiguration)
  const updateDaysConfiguration = async () => {
    const dayUpdatePromises = days.map(day => {
      const shouldBeActive = selectedDays.includes(day.day_id)
      if (day.is_active !== shouldBeActive) {
        return updateDayMutation.mutateAsync({
          id: day.day_id,
          data: { is_active: shouldBeActive }
        })
      }
      return Promise.resolve()
    })
    
    await Promise.all(dayUpdatePromises)
  }

  // Handle all configuration changes (time blocks + days) in one operation
  const handleApplyConfiguration = async () => {
    setIsApplying(true)
    
    try {
      // Step 1: Always update days configuration first
      console.log('📅 Aplicando configuración de días...')
      await updateDaysConfiguration()
      
      // Step 2: Handle time blocks configuration
      console.log('⏰ Aplicando configuración de bloques de tiempo...')
      
      // Deactivate existing blocks (safer than deleting)
      if (timeBlocks.length > 0) {
        const deactivatePromises = timeBlocks.map(block => 
          updateTimeBlockMutation.mutateAsync({
            id: block.time_block_id,
            data: { is_active: false }
          })
        )
        await Promise.all(deactivatePromises)
      }
      
      // Create new uniform blocks
      const blocksToCreate = generateUniformBlocks()
      if (blocksToCreate.length > 0) {
        await Promise.all(blocksToCreate.map(block => 
          createMutation.mutateAsync(block as TimeBlockCreate)
        ))
      }
      
      toast.success('✅ Configuración de estructura horaria aplicada exitosamente')
      setIsApplying(false)
    } catch (error) {
      console.error('Error applying configuration:', error)
      toast.error('❌ Error al aplicar la configuración')
      setIsApplying(false)
    }
  }

  // Initialize selected days from current configuration
  useEffect(() => {
    if (days.length > 0) {
      const activeDayIds = days.filter(day => day.is_active).map(day => day.day_id)
      setSelectedDays(activeDayIds)
    }
  }, [days])

  // Initialize time range from schedule configuration
  useEffect(() => {
    if (scheduleConfigData?.config) {
      setStartTime(scheduleConfigData.config.day_start_time.substring(0, 5)) // Remove seconds
      setEndTime(scheduleConfigData.config.day_end_time.substring(0, 5)) // Remove seconds
    }
  }, [scheduleConfigData])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('[data-days-dropdown]')) {
        setShowDaysDropdown(false)
      }
    }

    if (showDaysDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDaysDropdown])

  const formatTime = (time: string) => {
    const [hour, minute] = time.split(':')
    const h = parseInt(hour)
    const period = h >= 12 ? 'PM' : 'AM'
    const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h
    return `${displayHour}:${minute} ${period}`
  }

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} minutos`
    } else if (minutes === 60) {
      return '1 hora'
    } else if (minutes % 60 === 0) {
      return `${minutes / 60} horas`
    } else {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return `${hours} hora${hours > 1 ? 's' : ''} ${mins} minutos`
    }
  }

  const getHoursEquivalent = (minutes: number): string => {
    if (minutes === 60) return '(1 hora)'
    if (minutes === 120) return '(2 horas)'
    if (minutes === 180) return '(3 horas)'
    if (minutes === 240) return '(4 horas)'
    if (minutes < 60) return ''
    if (minutes % 60 === 0) {
      return `(${minutes / 60} horas)`
    }
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `(${hours}h ${mins}min)`
  }

  const getDayNameInSpanish = (dayName: string): string => {
    const dayTranslations: { [key: string]: string } = {
      'Monday': 'Lunes',
      'Tuesday': 'Martes', 
      'Wednesday': 'Miércoles',
      'Thursday': 'Jueves',
      'Friday': 'Viernes',
      'Saturday': 'Sábado',
      'Sunday': 'Domingo',
      'Lunes': 'Lunes',
      'Martes': 'Martes',
      'Miércoles': 'Miércoles', 
      'Jueves': 'Jueves',
      'Viernes': 'Viernes',
      'Sábado': 'Sábado',
      'Domingo': 'Domingo'
    }
    return dayTranslations[dayName] || dayName
  }

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <Typography variant="body" className="text-gray-600 dark:text-gray-400">
          Cargando configuración de bloques...
        </Typography>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-4" />
        <Typography variant="h3" className="text-gray-900 dark:text-gray-100 mb-2">
          Error al cargar configuración
        </Typography>
        <Typography variant="body" className="text-gray-600 dark:text-gray-400 mb-4">
          No se pudo obtener la configuración de bloques.
        </Typography>
        <Button onClick={() => window.location.reload()} variant="outline">
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <Typography variant="h2" className="text-gray-900 dark:text-gray-100">
              Configuración de Estructura Horaria
            </Typography>
          </div>
          <Typography variant="body" className="text-gray-600 dark:text-gray-400">
            Define los días lectivos y la duración de los bloques de tiempo
          </Typography>
        </div>

        {/* Combined Configuration Section */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {/* Days Selection - Compact */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Días Lectivos
              </label>
              <div className="space-y-2">
                <div className="relative" data-days-dropdown>
                  <button
                    type="button"
                    onClick={() => setShowDaysDropdown(!showDaysDropdown)}
                    disabled={isApplying}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left flex items-center justify-between"
                  >
                    <span className="truncate">
                      {selectedDays.length === 0 
                        ? "Seleccionar días" 
                        : selectedDays.length === days.length 
                        ? "Todos los días"
                        : selectedDays.length <= 2
                        ? days
                            .filter(day => selectedDays.includes(day.day_id))
                            .sort((a, b) => a.sort_order - b.sort_order)
                            .map(day => getDayNameInSpanish(day.name))
                            .join(", ")
                        : `${selectedDays.length} día${selectedDays.length > 1 ? 's' : ''} seleccionado${selectedDays.length > 1 ? 's' : ''}`
                      }
                    </span>
                    <ChevronDown className={cn(
                      "w-4 h-4 transition-transform",
                      showDaysDropdown && "rotate-180"
                    )} />
                  </button>
                  
                  {showDaysDropdown && (
                    <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {days
                        .sort((a, b) => a.sort_order - b.sort_order)
                        .map((day) => (
                          <label
                            key={day.day_id}
                            className="flex items-center px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer last:mb-2"
                          >
                            <input
                              type="checkbox"
                              checked={selectedDays.includes(day.day_id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedDays([...selectedDays, day.day_id])
                                } else {
                                  setSelectedDays(selectedDays.filter(id => id !== day.day_id))
                                }
                              }}
                              disabled={isApplying}
                              className="sr-only"
                            />
                            <div className={cn(
                              "w-4 h-4 rounded border-2 flex items-center justify-center transition-colors mr-3",
                              selectedDays.includes(day.day_id)
                                ? "bg-blue-600 border-blue-600"
                                : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                            )}>
                              {selectedDays.includes(day.day_id) && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </div>
                            <span className="text-sm text-gray-900 dark:text-gray-100">
                              {getDayNameInSpanish(day.name)}
                            </span>
                          </label>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Start Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hora de Inicio
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={isApplying}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Typography variant="caption" className="text-gray-500 dark:text-gray-400 mt-1">
                Primera clase del día
              </Typography>
            </div>

            {/* End Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hora de Fin
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={isApplying}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Typography variant="caption" className="text-gray-500 dark:text-gray-400 mt-1">
                Última clase del día
              </Typography>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duración en minutos
              </label>
              <div className="space-y-2">
                <input
                  type="number"
                  value={uniformDuration}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 60
                    if (value >= 60 && value <= 240) {
                      setUniformDuration(value)
                    }
                  }}
                  disabled={isApplying}
                  min="60"
                  max="240"
                  step="30"
                  placeholder="120"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Typography variant="caption" className="text-gray-500 dark:text-gray-400">
                  {uniformDuration >= 60 && getHoursEquivalent(uniformDuration)}
                  {uniformDuration < 60 && ' Mínimo 60 minutos (1 hora)'}
                </Typography>
              </div>
            </div>

            {/* Apply Button */}
            <div className="flex items-center">
              <Button
                onClick={handleApplyConfiguration}
                disabled={
                  isApplying || 
                  createMutation.isPending || 
                  updateTimeBlockMutation.isPending || 
                  updateDayMutation.isPending ||
                  previewBlocks.length === 0 || 
                  selectedDays.length === 0 || 
                  uniformDuration < 60
                }
                className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 h-10 flex items-center justify-center mt-6"
              >
                {isApplying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Aplicando...
                  </>
                ) : (
                  "Aplicar Configuración"
                )}
              </Button>
            </div>
          </div>

        </div>

        {/* Schedule Preview */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <Typography variant="h3" className="text-gray-900 dark:text-gray-100">
              Vista Previa del Horario
            </Typography>
            
            {/* View Toggle */}
            <div className="flex items-center gap-2">
              <Typography variant="caption" className="text-gray-600 dark:text-gray-400">
                Vista:
              </Typography>
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setIsCompactView(true)}
                  className={cn(
                    "px-3 py-1 text-sm font-medium rounded-md transition-colors",
                    isCompactView
                      ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                  )}
                >
                  Compacta
                </button>
                <button
                  onClick={() => setIsCompactView(false)}
                  className={cn(
                    "px-3 py-1 text-sm font-medium rounded-md transition-colors",
                    !isCompactView
                      ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                  )}
                >
                  Completa
                </button>
              </div>
            </div>
          </div>

          {selectedDays.length > 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Days Header */}
              <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 overflow-x-auto">
                  <Typography variant="body2" className="text-gray-600 dark:text-gray-400 font-medium whitespace-nowrap">
                    Días:
                  </Typography>
                  {days
                    .filter(day => selectedDays.includes(day.day_id))
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map((day, index) => (
                      <span
                        key={day.day_id}
                        className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-sm font-medium rounded whitespace-nowrap"
                      >
                        {day.short_name}
                      </span>
                    ))}
                </div>
              </div>

              {/* Schedule Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="sticky left-0 z-10 px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-w-[80px]">
                        Hora
                      </th>
                      {days
                        .filter(day => selectedDays.includes(day.day_id))
                        .sort((a, b) => a.sort_order - b.sort_order)
                        .map(day => (
                          <th
                            key={day.day_id}
                            className="px-3 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-w-[60px]"
                          >
                            {day.short_name}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(isCompactView ? generateCompactBlocks() : previewBlocks).map((block, index) => {
                      // Handle ellipsis row
                      if (block === '...') {
                        return (
                          <motion.tr
                            key="ellipsis"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <td className="px-4 py-3 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                              <div className="flex flex-col items-center">
                                <span className="text-xl font-bold">⋯</span>
                                <span className="text-xs">
                                  {previewBlocks.length - 4} bloques más
                                </span>
                              </div>
                            </td>
                            {days
                              .filter(day => selectedDays.includes(day.day_id))
                              .sort((a, b) => a.sort_order - b.sort_order)
                              .map(day => (
                                <td
                                  key={`ellipsis-${day.day_id}`}
                                  className="px-4 py-6 text-center bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                                >
                                  <span className="text-gray-400 dark:text-gray-500 text-xl">⋯</span>
                                </td>
                              ))}
                          </motion.tr>
                        )
                      }
                      
                      // Handle block rows
                      const currentBlock = block as GeneratedBlock
                      
                      return (
                        <motion.tr
                          key={`${currentBlock.start_time}-${currentBlock.end_time}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                            {formatTime(currentBlock.start_time)} - {formatTime(currentBlock.end_time)}
                            <br />
                            <span className="text-xs text-blue-600 dark:text-blue-400">
                              ({uniformDuration} min)
                            </span>
                          </td>
                          {days
                            .filter(day => selectedDays.includes(day.day_id))
                            .sort((a, b) => a.sort_order - b.sort_order)
                            .map(day => (
                              <td
                                key={`${currentBlock.start_time}-${day.day_id}`}
                                className="px-4 py-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                              >
                                {/* Empty cell representing available time slot */}
                              </td>
                            ))}
                        </motion.tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between text-sm">
                  <Typography variant="caption" className="text-gray-600 dark:text-gray-400">
                    Total: {previewBlocks.length} bloques × {selectedDays.length} días = {previewBlocks.length * selectedDays.length} espacios de horario
                    {isCompactView && previewBlocks.length > 4 && (
                      <span className="ml-2 text-amber-600 dark:text-amber-400">
                        (Vista compacta: mostrando {Math.min(4, previewBlocks.length)} de {previewBlocks.length})
                      </span>
                    )}
                  </Typography>
                  <Typography variant="caption" className="text-blue-600 dark:text-blue-400">
                    Duración por bloque: {uniformDuration} min {getHoursEquivalent(uniformDuration)}
                  </Typography>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <Typography variant="body" className="text-gray-500 dark:text-gray-400">
                Selecciona al menos un día lectivo para ver la vista previa
              </Typography>
            </div>
          )}
        </div>

        {/* Schedule Configuration Settings */}
        <div className="mt-8">
          <button
            onClick={() => setShowScheduleConfig(!showScheduleConfig)}
            className="flex items-center gap-2 mb-4 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            <Settings className={cn(
              "w-4 h-4 transition-transform",
              showScheduleConfig && "rotate-90"
            )} />
            Configuración Avanzada de Horarios
            <ChevronDown className={cn(
              "w-4 h-4 transition-transform",
              showScheduleConfig && "rotate-180"
            )} />
          </button>
          
          {showScheduleConfig && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <ScheduleConfigSettings 
                onUpdate={() => {
                  // Refresh preview blocks when schedule config updates
                  setPreviewBlocks(generateUniformBlocks())
                }}
              />
            </motion.div>
          )}
        </div>
    </div>
  )
}

export default TimeBlockManagement