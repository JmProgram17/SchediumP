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
  useActiveScheduleConfig,
  useUpdateScheduleConfig
} from '@/services/query/hooks/academic-config.hooks'
import { useFreshDataOnMount, useFreshDataOnFocus, useCacheCleaner } from '@/services/query/use-fresh-data'
import { useForceRefreshAfterMutation } from '@/services/query/no-cache-hooks'
import { useAcademicConfigWebSocket } from '@/services/websocket/websocket-client'
import { useWebSocketContext, useRealTimeStatus } from '@/services/websocket/websocket-provider'
import { RealTimeStatusBadge } from '@/components/ui/RealTimeStatus'
import { useClassScheduleList } from '@/features/scheduling/hooks'
import { useQueryClient } from '@tanstack/react-query'
import type { TimeBlock, TimeBlockCreate, DayConfig } from '@/services/api/academic-config.api'
import { academicConfigApi } from '@/services/api/academic-config.api'
import { ScheduleConfigSettings } from './ScheduleConfigSettings'

interface GeneratedBlock {
  start_time: string
  end_time: string
  name: string
  description?: string
}

export function TimeBlockManagement() {
  // REAL-TIME UPDATES: Use WebSocket for instant notifications instead of polling
  const webSocket = useAcademicConfigWebSocket()
  const { isConnected: isRealTimeConnected } = useRealTimeStatus()
  
  // TEMPORARILY DISABLED: Fresh data hooks causing unwanted reloads during UI interaction
  // useFreshDataOnMount(['academic-config'])
  // useFreshDataOnFocus(true)
  // useCacheCleaner(10000) // Clean cache every 10 seconds
  
  const forceRefresh = useForceRefreshAfterMutation()
  
  const [uniformDuration, setUniformDuration] = useState<number>(120) // Will be detected from active blocks
  const [startTime, setStartTime] = useState<string>('06:00') // Will be loaded from schedule config
  const [endTime, setEndTime] = useState<string>('22:00') // Will be loaded from schedule config
  const [isApplying, setIsApplying] = useState(false)
  const [previewBlocks, setPreviewBlocks] = useState<GeneratedBlock[]>([])
  const [selectedDays, setSelectedDays] = useState<number[]>([]) // Will be loaded from backend
  const [isCompactView, setIsCompactView] = useState<boolean>(true) // Default to compact view
  const [showDaysDropdown, setShowDaysDropdown] = useState<boolean>(false)
  const [showScheduleConfig, setShowScheduleConfig] = useState<boolean>(false)
  const [operationProgress, setOperationProgress] = useState<string>('')
  // State removed - no longer needed since we only save on Apply Configuration
  
  // Query hooks
  const { data: timeBlocksData, isLoading: isLoadingBlocks, error: blocksError } = useTimeBlocks()
  const { data: daysData, isLoading: isLoadingDays, error: daysError } = useDays()
  const { data: scheduleConfigData } = useActiveScheduleConfig()
  
  // Mutation hooks
  const createMutation = useCreateTimeBlock()
  const deleteMutation = useDeleteTimeBlock()
  const updateTimeBlockMutation = useUpdateTimeBlock()
  const updateDayMutation = useUpdateDayConfig()
  const updateScheduleConfigMutation = useUpdateScheduleConfig()
  const queryClient = useQueryClient()
  
  // DEBUG: Monitor any unexpected mutations
  useEffect(() => {
    const originalMutate = updateDayMutation.mutate
    const originalMutateAsync = updateDayMutation.mutateAsync
    
    // Override to detect unexpected calls
    updateDayMutation.mutate = (...args) => {
      console.warn('🚨 [UNEXPECTED] updateDayMutation.mutate called unexpectedly!', args)
      console.trace('Stack trace:')
      return originalMutate.apply(updateDayMutation, args)
    }
    
    updateDayMutation.mutateAsync = (...args) => {
      console.warn('🚨 [UNEXPECTED] updateDayMutation.mutateAsync called unexpectedly!', args)
      console.trace('Stack trace:')
      return originalMutateAsync.apply(updateDayMutation, args)
    }
    
    return () => {
      updateDayMutation.mutate = originalMutate
      updateDayMutation.mutateAsync = originalMutateAsync
    }
  }, [updateDayMutation])
  
  // Check for existing schedules
  const { data: existingSchedulesData } = useClassScheduleList({}, { enabled: true })

  const timeBlocks = timeBlocksData?.time_blocks || []
  const days = daysData?.days || []
  const isLoading = isLoadingBlocks || isLoadingDays
  const error = blocksError || daysError
  
  // DEBUG: Log raw data from backend
  useEffect(() => {
    console.log('🔍 [DEBUG] Raw data from backend:', {
      daysData: daysData,
      days: days,
      daysLength: days.length,
      isLoadingDays: isLoadingDays,
      daysError: daysError
    })
    
    if (days.length > 0) {
      console.log('🔍 [DEBUG] Days details:', days.map(d => ({
        id: d.day_id,
        name: d.name,
        is_active: d.is_active,
        sort_order: d.sort_order
      })))
      
      const activeDays = days.filter(day => day.is_active)
      const inactiveDays = days.filter(day => !day.is_active)
      
      console.log('🔍 [DEBUG] SUMMARY:', {
        totalDays: days.length,
        activeDaysCount: activeDays.length,
        inactiveDaysCount: inactiveDays.length
      })
      
      console.log('🔍 [DEBUG] Active days from backend:', activeDays.map(d => ({
        id: d.day_id,
        name: d.name
      })))
      
      console.log('🔍 [DEBUG] Inactive days from backend:', inactiveDays.map(d => ({
        id: d.day_id,
        name: d.name
      })))
    }
  }, [daysData, days, isLoadingDays, daysError])

  // DEBUG: Monitor selectedDays state changes
  useEffect(() => {
    console.log('📊 [DEBUG] selectedDays state changed:', selectedDays)
    
    if (days.length > 0 && selectedDays.length > 0) {
      const selectedDayNames = days
        .filter(day => selectedDays.includes(day.day_id))
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(day => ({
          id: day.day_id,
          name: getDayNameInSpanish(day.name),
          short: getDayShortName(day.name)
        }))
      console.log('📊 [DEBUG] Selected days for dropdown display:', selectedDayNames)
    }
  }, [selectedDays, days])

  // Initialize configuration once when component mounts
  const [hasInitialized, setHasInitialized] = useState(false)
  const [hasBackendDataLoaded, setHasBackendDataLoaded] = useState(false)
  
  // DEBUG: Monitor initial state immediately on mount
  useEffect(() => {
    console.log('🎬 [MOUNT] Component just mounted with initial state:')
    console.log('🎬 selectedDays initial:', selectedDays)
    console.log('🎬 days initial:', days)
    console.log('🎬 days length:', days.length)
  }, [])
  
  useEffect(() => {
    if (!hasInitialized) {
      console.log('🚀 Component mounted - Initializing once...')
      console.log('📊 Current state before backend sync:', {
        selectedDays,
        startTime,
        endTime,
        uniformDuration
      })
      setHasInitialized(true)
    }
  }, [hasInitialized])

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

  // Function to check if a time block matches the current configuration
  const blockMatchesConfiguration = (block: TimeBlock): boolean => {
    const blockStart = block.start_time.substring(0, 5) // HH:MM format
    const blockEnd = block.end_time.substring(0, 5)
    const blockDurationMinutes = getTimeDifferenceInMinutes(blockStart, blockEnd)
    
    // Check if block fits within current time range
    const blockStartMinutes = getTimeDifferenceInMinutes('00:00', blockStart)
    const blockEndMinutes = getTimeDifferenceInMinutes('00:00', blockEnd)
    const configStartMinutes = getTimeDifferenceInMinutes('00:00', startTime)
    const configEndMinutes = getTimeDifferenceInMinutes('00:00', endTime)
    
    // Block must be within time range
    if (blockStartMinutes < configStartMinutes || blockEndMinutes > configEndMinutes) {
      return false
    }
    
    // Block duration must match configured duration
    if (blockDurationMinutes !== uniformDuration) {
      return false
    }
    
    // Check if block aligns with the generated blocks
    const generatedBlocks = generateUniformBlocks()
    return generatedBlocks.some(generated => 
      generated.start_time === blockStart && generated.end_time === blockEnd
    )
  }

  // Helper function for day configuration (used internally by handleApplyConfiguration)
  const updateDaysConfiguration = async () => {
    console.log('📅 Updating days configuration...')
    console.log('📅 Selected days:', selectedDays)
    console.log('📅 All days:', days.map(d => ({ id: d.day_id, name: d.name, current: d.is_active })))
    
    for (const day of days) {
      const shouldBeActive = selectedDays.includes(day.day_id)
      if (day.is_active !== shouldBeActive) {
        console.log(`📅 Updating ${day.name} (${day.day_id}): ${day.is_active} → ${shouldBeActive}`)
        try {
          await updateDayMutation.mutateAsync({
            id: day.day_id,
            data: { is_active: shouldBeActive }
          })
          console.log(`✅ Day ${day.name} updated successfully`)
          // Small delay to prevent API overload
          await new Promise(resolve => setTimeout(resolve, 50))
        } catch (error) {
          console.warn(`❌ Error updating day ${day.name}:`, error)
          // Continue with other days
        }
      } else {
        console.log(`⏭️ Day ${day.name} (${day.day_id}) already in correct state: ${shouldBeActive}`)
      }
    }
    console.log('📅 Days configuration update completed')
  }

  // Helper function to manage existing time blocks according to configuration
  const manageExistingTimeBlocks = async () => {
    console.log(`📊 Evaluating ${timeBlocks.length} existing time blocks...`)
    
    for (const block of timeBlocks) {
      const shouldBeActive = blockMatchesConfiguration(block)
      
      // Only update if status needs to change
      if (block.is_active !== shouldBeActive) {
        try {
          console.log(`🔄 ${shouldBeActive ? 'Activating' : 'Deactivating'} block ${block.time_block_id}: ${block.start_time}-${block.end_time}`)
          
          await updateTimeBlockMutation.mutateAsync({
            id: block.time_block_id,
            data: { is_active: shouldBeActive }
          })
          
          // Small delay to prevent API overload
          await new Promise(resolve => setTimeout(resolve, 100))
        } catch (error) {
          console.warn(`Error updating block ${block.time_block_id}:`, error)
          // Continue with other blocks
        }
      } else {
        console.log(`✓ Block ${block.time_block_id} already has correct status: ${shouldBeActive ? 'active' : 'inactive'}`)
      }
    }
  }

  // Validation function for configuration
  const validateConfiguration = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []
    
    // Validate time range
    if (startTime >= endTime) {
      errors.push('La hora de inicio debe ser anterior a la hora de fin')
    }
    
    // Validate duration
    if (uniformDuration < 60) {
      errors.push('La duración mínima debe ser de 60 minutos')
    }
    
    if (uniformDuration > 480) {
      errors.push('La duración máxima debe ser de 480 minutos (8 horas)')
    }
    
    // Validate selected days
    if (selectedDays.length === 0) {
      errors.push('Debe seleccionar al menos un día lectivo')
    }
    
    // Validate that the configuration generates at least one block
    const generatedBlocks = generateUniformBlocks()
    if (generatedBlocks.length === 0) {
      errors.push('La configuración no genera ningún bloque de tiempo válido')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Handle all configuration changes (time blocks + days) in one operation
  const handleApplyConfiguration = async () => {
    // Validate configuration before applying
    const validation = validateConfiguration()
    if (!validation.isValid) {
      const errorMessage = `❌ Configuración inválida:\n${validation.errors.join('\n')}`
      toast.error(errorMessage)
      console.error('🚨 Configuration validation failed:', validation.errors)
      return
    }
    
    // Check for existing schedules and warn user
    const existingSchedules = (existingSchedulesData as any)?.items || []
    
    if (existingSchedules.length > 0) {
      const confirmMessage = `⚠️ ADVERTENCIA: Se encontraron ${existingSchedules.length} horarios programados.\n\nCambiar la configuración académica puede afectar los horarios existentes.\n\n¿Desea continuar?`
      
      if (!window.confirm(confirmMessage)) {
        toast.error('Operación cancelada por el usuario')
        return
      }
      
      console.log('🚨 User confirmed configuration change with existing schedules:', existingSchedules.length)
    }
    
    setIsApplying(true)
    setOperationProgress('')
    
    // Debug: Check authentication state
    console.log('🔐 DEBUG: Starting configuration apply')
    console.log('🔐 DEBUG: Access token in localStorage:', localStorage.getItem('access_token') ? 'EXISTS' : 'MISSING')
    console.log('🔐 DEBUG: Document cookies:', document.cookie)
    
    try {
      // Step 1: Update schedule configuration (start/end times) first
      setOperationProgress('Actualizando configuración de horarios...')
      console.log('⏰ Guardando configuración de horarios en backend...')
      
      await updateScheduleConfigMutation.mutateAsync({
        day_start_time: `${startTime}:00`,
        day_end_time: `${endTime}:00`
      })
      console.log('✅ Schedule configuration saved:', { start: startTime, end: endTime })
      
      // Step 2: Update days configuration
      setOperationProgress('Configurando días lectivos...')
      console.log('📅 Aplicando configuración de días...')
      await updateDaysConfiguration()
      
      // Step 3: Handle time blocks configuration
      setOperationProgress('Preparando bloques de tiempo...')
      console.log('⏰ Aplicando configuración de bloques de tiempo...')
      
      // First, update existing blocks according to new configuration
      if (timeBlocks.length > 0) {
        setOperationProgress('Evaluando bloques existentes...')
        await manageExistingTimeBlocks()
      }
      
      // Create missing blocks that don't exist yet
      const blocksToCreate = generateUniformBlocks()
      const blocksToActuallyCreate = blocksToCreate.filter(newBlock => {
        return !timeBlocks.some(existingBlock => {
          const existingStart = existingBlock.start_time.substring(0, 5)
          const existingEnd = existingBlock.end_time.substring(0, 5)
          return existingStart === newBlock.start_time && existingEnd === newBlock.end_time
        })
      })
      
      if (blocksToActuallyCreate.length > 0) {
        console.log(`⏰ Creando ${blocksToActuallyCreate.length} nuevos bloques...`)
        for (let i = 0; i < blocksToActuallyCreate.length; i++) {
          const block = blocksToActuallyCreate[i]
          setOperationProgress(`Creando bloque ${i + 1} de ${blocksToActuallyCreate.length}...`)
          try {
            console.log(`🔧 Creating new block ${i + 1}:`, block)
            const result = await createMutation.mutateAsync(block as TimeBlockCreate)
            console.log(`✅ Bloque ${i + 1}/${blocksToActuallyCreate.length} creado:`, result)
            // Small delay to prevent API overload
            await new Promise(resolve => setTimeout(resolve, 150))
          } catch (error) {
            console.error(`🚨 Error creating block ${i + 1}:`, error)
            console.error(`🚨 Block data:`, block)
            console.error(`🚨 Error response:`, (error as any)?.response)
            
            // Check if it's a duplicate error (which is acceptable)
            const errorMessage = (error as any)?.response?.data?.message || ''
            if (errorMessage.includes('already exists') || errorMessage.includes('duplicate')) {
              console.log(`ℹ️ Block ${i + 1} already exists, continuing...`)
              continue
            }
            
            throw error // Stop on non-duplicate creation errors
          }
        }
      } else {
        console.log('ℹ️ No new blocks to create - all required blocks already exist')
      }
      
      setOperationProgress('Finalizando configuración...')
      await new Promise(resolve => setTimeout(resolve, 500)) // Final delay
      
      // Force refresh data immediately
      setOperationProgress('Actualizando datos...')
      console.log('🔄 Invalidating and refetching all caches...')
      
      // Invalidate all related queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['classSchedules'] }),
        queryClient.invalidateQueries({ queryKey: ['dayTimeBlocks'] }),
        queryClient.invalidateQueries({ queryKey: ['scheduleData'] }),
        queryClient.invalidateQueries({ queryKey: ['timeBlocks'] }),
        queryClient.invalidateQueries({ queryKey: ['days'] }),
        queryClient.invalidateQueries({ queryKey: ['academic-config'] })
      ])
      
      // Force refetch all configuration data to see changes immediately
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['academic-config', 'time-blocks'] }),
        queryClient.refetchQueries({ queryKey: ['academic-config', 'days'] }),
        queryClient.refetchQueries({ queryKey: ['academic-config', 'schedule-config', 'active'] })
      ])
      
      // After successful configuration, refetch and sync local state with backend
      try {
        console.log('🔄 [POST-CONFIG] Waiting for database operations to complete...')
        // Small delay to ensure all database operations are complete
        await new Promise(resolve => setTimeout(resolve, 500))
        
        console.log('🔄 [POST-CONFIG] Fetching fresh data from backend to sync local state...')
        
        // Force fresh fetch by removing cached data first
        queryClient.removeQueries({ queryKey: ['academic-config', 'days'] })
        queryClient.removeQueries({ queryKey: ['academic-config', 'schedule-config', 'active'] })
        
        const [freshDaysData, freshScheduleConfigData] = await Promise.all([
          queryClient.fetchQuery({ 
            queryKey: ['academic-config', 'days'],
            queryFn: () => academicConfigApi.getDays(),
            staleTime: 0  // Force fresh fetch
          }),
          queryClient.fetchQuery({ 
            queryKey: ['academic-config', 'schedule-config', 'active'],
            queryFn: () => academicConfigApi.getActiveScheduleConfig(),
            staleTime: 0  // Force fresh fetch
          })
        ])
        
        console.log('🔄 [POST-CONFIG] Fresh data received:', {
          freshDaysData: freshDaysData?.data?.days?.length || 0,
          freshScheduleConfig: !!freshScheduleConfigData?.data?.config
        })
        
        // Sync days
        if (freshDaysData?.data?.days) {
          console.log('🔄 [POST-CONFIG] Processing fresh days data:')
          console.log('🔄 All fresh days:', freshDaysData.data.days.map((d: any) => `${d.name}(${d.day_id}): ${d.is_active}`))
          
          const updatedActiveDays = freshDaysData.data.days
            .filter((day: any) => day.is_active)
            .map((day: any) => day.day_id)
            
          console.log('🔄 [POST-CONFIG] Active days from fresh data:', updatedActiveDays)
          console.log('🔄 [POST-CONFIG] Previous selectedDays:', selectedDays)
          console.log('📝 [SET STATE] Setting selectedDays from post-configuration sync:', updatedActiveDays)
          setSelectedDays(updatedActiveDays)
          console.log('✅ [POST-CONFIG] selectedDays updated to reflect backend changes')
        } else {
          console.warn('⚠️ [POST-CONFIG] No fresh days data received')
        }
        
        // Sync schedule configuration
        if (freshScheduleConfigData?.data?.config) {
          const config = freshScheduleConfigData.data.config
          const newStartTime = config.day_start_time.substring(0, 5)
          const newEndTime = config.day_end_time.substring(0, 5)
          
          setStartTime(newStartTime)
          setEndTime(newEndTime)
          console.log('🔄 Synced schedule config with backend:', { start: newStartTime, end: newEndTime })
        }
        
        console.log('✅ All local state synchronized with backend')
        
        // Ensure backend data loaded flag reflects current state
        setHasBackendDataLoaded(true)
        console.log('🏁 [POST-CONFIG] Synchronization completed successfully')
        
        // Add additional delay to ensure React state updates are completed
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        console.warn('⚠️ Could not sync local state after configuration:', error)
      }
      
      const successMessage = existingSchedules.length > 0 
        ? `✅ Configuración aplicada. ${existingSchedules.length} horarios existentes pueden requerir revisión.`
        : '✅ Configuración de estructura horaria aplicada exitosamente'
      
      toast.success(successMessage)
      setIsApplying(false)
      setOperationProgress('')
    } catch (error) {
      console.error('🚨 Error applying configuration:', error)
      
      const errorDetails = {
        message: error instanceof Error ? error.message : 'Unknown error',
        response: (error as any)?.response?.data,
        status: (error as any)?.response?.status,
        timestamp: new Date().toISOString()
      }
      
      console.error('🚨 Error details:', errorDetails)
      
      // Provide specific error messages based on error type
      let errorMessage = '❌ Error al aplicar la configuración'
      
      if ((error as any)?.response?.status === 401) {
        errorMessage = '❌ Error de autenticación. Por favor, inicie sesión nuevamente.'
      } else if ((error as any)?.response?.status === 403) {
        errorMessage = '❌ No tiene permisos para realizar esta operación.'
      } else if ((error as any)?.response?.status === 409) {
        errorMessage = '❌ Conflicto con la configuración existente. Verifique los datos.'
      } else if ((error as any)?.response?.status >= 500) {
        errorMessage = '❌ Error del servidor. Intente nuevamente más tarde.'
      } else if ((error as any)?.response?.data?.detail) {
        errorMessage = `❌ Error: ${(error as any).response.data.detail}`
      } else if ((error as any)?.response?.data?.message) {
        errorMessage = `❌ Error: ${(error as any).response.data.message}`
      }
      
      toast.error(errorMessage)
      setIsApplying(false)
      setOperationProgress('')
      
      // Force refresh to ensure UI is in sync with backend
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['academic-config', 'time-blocks'] }),
        queryClient.invalidateQueries({ queryKey: ['academic-config', 'days'] })
      ])
    }
  }

  // Load configuration from backend data - triggers when data becomes available
  useEffect(() => {
    console.log('🔍 [SYNC TRIGGER] Checking sync conditions:', {
      daysLength: days.length,
      hasInitialized,
      hasBackendDataLoaded,
      isLoadingDays,
      isApplying,
      shouldSync: days.length > 0 && !hasBackendDataLoaded && !isLoadingDays && !isApplying
    })
    
    // CRITICAL FIX: Don't run initial sync during configuration apply to prevent race condition
    if (days.length > 0 && !hasBackendDataLoaded && !isLoadingDays && !isApplying) {
      console.log('🔄 [INITIAL LOAD] Syncing frontend state with backend data...')
      console.log('Backend days data:', days.map(d => ({ id: d.day_id, name: d.name, active: d.is_active })))
      
      // Load selected days from backend data
      const activeDaysFromBackend = days.filter(day => day.is_active)
      const activeDayIds = activeDaysFromBackend.map(day => day.day_id)
      
      console.log('🔄 [INITIAL LOAD] Filtering active days:')
      console.log('🔄 All days:', days.map(d => `${d.name}(${d.day_id}): ${d.is_active}`))
      console.log('🔄 Active days filtered:', activeDaysFromBackend.map(d => `${d.name}(${d.day_id})`))
      console.log('🔄 Active day IDs to set:', activeDayIds)
      
      console.log('📝 [SET STATE] Setting selectedDays from initial backend sync:', activeDayIds)
      setSelectedDays(activeDayIds)
      console.log('✅ [INITIAL LOAD] selectedDays state has been updated')
      
      // Load time configuration from schedule config if available
      if (scheduleConfigData?.config) {
        const config = scheduleConfigData.config
        const newStartTime = config.day_start_time.substring(0, 5)
        const newEndTime = config.day_end_time.substring(0, 5)
        
        console.log('🔄 [INITIAL LOAD] Setting time config from backend:', { start: newStartTime, end: newEndTime })
        setStartTime(newStartTime)
        setEndTime(newEndTime)
      } else {
        console.log('⚠️ [INITIAL LOAD] No schedule config found in backend, keeping default values:', { start: startTime, end: endTime })
      }
      
      // Load duration from active blocks if available
      if (timeBlocks.length > 0) {
        const activeBlocks = timeBlocks.filter(block => block.is_active)
        if (activeBlocks.length > 0) {
          const firstBlock = activeBlocks[0]
          const blockDuration = getTimeDifferenceInMinutes(
            firstBlock.start_time.substring(0, 5),
            firstBlock.end_time.substring(0, 5)
          )
          
          if (blockDuration >= 60 && blockDuration <= 480) {
            console.log('🔄 [INITIAL LOAD] Setting duration from backend:', blockDuration, 'minutes')
            setUniformDuration(blockDuration)
          } else {
            console.log('⚠️ [INITIAL LOAD] Invalid block duration found:', blockDuration, 'minutes - keeping default:', uniformDuration)
          }
        } else {
          console.log('⚠️ [INITIAL LOAD] No active blocks found - keeping default duration:', uniformDuration)
        }
      } else {
        console.log('⚠️ [INITIAL LOAD] No blocks found in backend - keeping default duration:', uniformDuration)
      }
      
      // Mark that backend data has been loaded
      setHasBackendDataLoaded(true)
      console.log('✅ [INITIAL LOAD] Frontend state synchronized with backend')
      console.log('📊 Final state after backend sync:', {
        selectedDays: activeDayIds,
        startTime: scheduleConfigData?.config ? scheduleConfigData.config.day_start_time.substring(0, 5) : startTime,
        endTime: scheduleConfigData?.config ? scheduleConfigData.config.day_end_time.substring(0, 5) : endTime,
        uniformDuration
      })
    }
  }, [days.length, hasBackendDataLoaded, isLoadingDays, isApplying, scheduleConfigData?.config, timeBlocks.length])


  // Handle day toggle - immediate save to database with UI update
  const handleDayToggle = (dayId: number, isChecked: boolean, event?: React.ChangeEvent<HTMLInputElement>) => {
    console.log(`📅 [LOCAL ONLY] Toggling day ${dayId} to ${isChecked ? 'active' : 'inactive'} (no save until Apply)`)
    console.log('Current selectedDays before change:', selectedDays)
    
    // Prevent any default behavior
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }
    
    // Only update local state - NO DATABASE SAVE
    const newSelectedDays = isChecked 
      ? [...selectedDays, dayId]
      : selectedDays.filter(id => id !== dayId)
    
    console.log('New selectedDays after change:', newSelectedDays)
    console.log('📝 [SET STATE] Setting selectedDays from user toggle:', newSelectedDays)
    setSelectedDays(newSelectedDays)
    
    console.log(`✅ Day ${dayId} ${isChecked ? 'selected' : 'deselected'} locally - NO NETWORK REQUEST MADE`)
  }

  // Time configuration is now handled in the main loadFreshConfiguration useEffect above

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  const getDayShortName = (dayName: string): string => {
    const shortTranslations: { [key: string]: string } = {
      'Monday': 'Lun',
      'Tuesday': 'Mar', 
      'Wednesday': 'Mié',
      'Thursday': 'Jue',
      'Friday': 'Vie',
      'Saturday': 'Sáb',
      'Sunday': 'Dom',
      'Lunes': 'Lun',
      'Martes': 'Mar',
      'Miércoles': 'Mié', 
      'Jueves': 'Jue',
      'Viernes': 'Vie',
      'Sábado': 'Sáb',
      'Domingo': 'Dom'
    }
    return shortTranslations[dayName] || dayName.substring(0, 3)
  }

  // DEBUG: Log render state
  console.log('🖥️ [RENDER] Component is rendering with state:', {
    selectedDays,
    selectedDaysLength: selectedDays.length,
    daysFromBackend: days.length,
    isLoading,
    hasInitialized,
    hasBackendDataLoaded
  })

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
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex items-center gap-3">
                <Typography variant="h2" className="text-gray-900 dark:text-gray-100">
                  Configuración de Estructura Horaria
                </Typography>
                <RealTimeStatusBadge />
              </div>
            </div>
            
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
                        : selectedDays.length <= 3
                        ? days
                            .filter(day => selectedDays.includes(day.day_id))
                            .sort((a, b) => a.sort_order - b.sort_order)
                            .map(day => getDayNameInSpanish(day.name))
                            .join(", ")
                        : selectedDays.length === days.length 
                        ? "Todos los días (" + days
                            .filter(day => selectedDays.includes(day.day_id))
                            .sort((a, b) => a.sort_order - b.sort_order)
                            .map(day => day.short_name || getDayShortName(day.name))
                            .join(", ") + ")"
                        : days
                            .filter(day => selectedDays.includes(day.day_id))
                            .sort((a, b) => a.sort_order - b.sort_order)
                            .map(day => day.short_name || getDayShortName(day.name))
                            .join(", ")
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
                        .map((day) => {
                          const isSelected = selectedDays.includes(day.day_id)
                          console.log(`🎯 [RENDER] Day ${day.day_id} (${getDayNameInSpanish(day.name)}): backend active=${day.is_active}, frontend selected=${isSelected}`)
                          return (
                          <label
                            key={day.day_id}
                            className="flex items-center px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer last:mb-2"
                          >
                            <input
                              type="checkbox"
                              checked={selectedDays.includes(day.day_id)}
                              onChange={(e) => {
                                console.log(`🎯 [CHECKBOX] Day ${day.day_id} (${getDayNameInSpanish(day.name)}) toggled to: ${e.target.checked}`)
                                console.log(`🎯 [CHECKBOX] Current selectedDays:`, selectedDays)
                                console.log(`🎯 [CHECKBOX] Day is currently selected:`, selectedDays.includes(day.day_id))
                                handleDayToggle(day.day_id, e.target.checked, e)
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
                              {selectedDays.includes(day.day_id) ? (
                                <Check className="w-3 h-3 text-white" />
                              ) : null}
                            </div>
                            <span className="text-sm text-gray-900 dark:text-gray-100">
                              {getDayNameInSpanish(day.name)}
                            </span>
                          </label>
                          )
                        })}
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
                    {operationProgress || 'Aplicando...'}
                  </>
                ) : (
                  "Aplicar Configuración"
                )}
              </Button>
            </div>
          </div>

        </div>

        {/* Existing Blocks Status */}
        {timeBlocks.length > 0 && (
          <div className="mb-6">
            <Typography variant="h3" className="text-gray-900 dark:text-gray-100 mb-4">
              Estado de Bloques Existentes
            </Typography>
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {timeBlocks.map(block => {
                  const willBeActive = blockMatchesConfiguration(block)
                  const statusChanged = block.is_active !== willBeActive
                  
                  return (
                    <div
                      key={block.time_block_id}
                      className={cn(
                        "p-3 rounded-lg border-2 transition-colors",
                        willBeActive 
                          ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                          : "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50",
                        statusChanged && "ring-2 ring-blue-500 ring-opacity-50"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {block.start_time.substring(0, 5)} - {block.end_time.substring(0, 5)}
                        </span>
                        <div className="flex items-center gap-2">
                          {statusChanged && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                          )}
                          <span className={cn(
                            "text-xs px-2 py-1 rounded",
                            willBeActive 
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                          )}>
                            {willBeActive ? "Activo" : "Inactivo"}
                          </span>
                        </div>
                      </div>
                      {block.name && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {block.name}
                        </p>
                      )}
                      {statusChanged && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          {willBeActive ? "Se activará" : "Se desactivará"}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
              <div className="mt-4 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
                  <span className="text-gray-600 dark:text-gray-400">Bloques que se activarán</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded"></div>
                  <span className="text-gray-600 dark:text-gray-400">Bloques que se desactivarán</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-600 dark:text-gray-400">Cambios pendientes</span>
                </div>
              </div>
            </div>
          </div>
        )}

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
                  <Typography variant="body" className="text-gray-600 dark:text-gray-400 font-medium whitespace-nowrap">
                    Días:
                  </Typography>
                  {days
                    .filter(day => selectedDays.includes(day.day_id))
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map((day) => (
                      <span
                        key={day.day_id}
                        className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-sm font-medium rounded whitespace-nowrap"
                      >
                        {day.short_name || getDayShortName(day.name)}
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