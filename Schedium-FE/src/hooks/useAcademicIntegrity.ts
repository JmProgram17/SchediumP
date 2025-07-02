/**
 * Academic Integrity Hook
 * Manages the integrity and validation between Academic Config and Scheduling modules
 * Ensures proper flow: Configuration → Programming
 */

import { useMemo } from 'react'
import { useTimeBlocks, useDays, useActiveScheduleConfig } from '@/services/query/hooks/academic-config.hooks'
import { useQuarterList } from '@/features/scheduling/hooks'

export interface AcademicIntegrityState {
  // Status indicators
  isConfigurationReady: boolean
  canScheduleClasses: boolean
  hasActiveQuarter: boolean
  hasActiveTimeBlocks: boolean
  hasActiveDays: boolean
  hasScheduleConfig: boolean
  
  // Missing configuration details
  missingConfiguration: {
    quarters: boolean
    timeBlocks: boolean
    activeDays: boolean
    scheduleConfig: boolean
  }
  
  // Configuration data
  activeQuarter: any | null
  activeTimeBlocks: any[]
  activeDays: any[]
  scheduleConfig: any | null
  
  // Validation messages
  validationMessages: string[]
  criticalErrors: string[]
  warnings: string[]
}

export const useAcademicIntegrity = (): AcademicIntegrityState => {
  // Load all required data
  const { data: timeBlocksData, isLoading: timeBlocksLoading, error: timeBlocksError } = useTimeBlocks({})
  const { data: daysData, isLoading: daysLoading, error: daysError } = useDays()
  const { data: scheduleConfigData, isLoading: scheduleConfigLoading, error: scheduleConfigError } = useActiveScheduleConfig()
  const { data: quartersData, isLoading: quartersLoading, error: quartersError } = useQuarterList({ 
    enabled: true 
  })

  // Process and validate configuration data
  const processedData = useMemo(() => {
    // Handle quarters
    const quarters = (quartersData as any)?.data || []
    const currentDate = new Date()
    const activeQuarter = quarters.find((q: any) => {
      const startDate = new Date(q.start_date)
      const endDate = new Date(q.end_date)
      return currentDate >= startDate && currentDate <= endDate
    })

    // Handle time blocks
    const timeBlocks = timeBlocksData?.time_blocks || []
    const activeTimeBlocks = timeBlocks.filter((block: any) => block.is_active)

    // Handle days
    const days = daysData?.days || []
    const activeDays = days.filter((day: any) => day.is_active)

    // Handle schedule config
    const scheduleConfig = scheduleConfigData?.config || null

    return {
      activeQuarter,
      activeTimeBlocks,
      activeDays,
      scheduleConfig,
      allQuarters: quarters,
      allTimeBlocks: timeBlocks,
      allDays: days
    }
  }, [timeBlocksData, daysData, scheduleConfigData, quartersData])

  // Validation logic
  const validation = useMemo(() => {
    const {
      activeQuarter,
      activeTimeBlocks,
      activeDays,
      scheduleConfig
    } = processedData

    // Basic availability checks
    const hasActiveQuarter = !!activeQuarter
    const hasActiveTimeBlocks = activeTimeBlocks.length > 0
    const hasActiveDays = activeDays.length > 0
    const hasScheduleConfig = !!scheduleConfig

    // Missing configuration
    const missingConfiguration = {
      quarters: !hasActiveQuarter,
      timeBlocks: !hasActiveTimeBlocks,
      activeDays: !hasActiveDays,
      scheduleConfig: !hasScheduleConfig
    }

    // Overall status
    const isConfigurationReady = hasActiveQuarter && hasActiveTimeBlocks && hasActiveDays && hasScheduleConfig
    const canScheduleClasses = isConfigurationReady

    // Generate validation messages
    const validationMessages: string[] = []
    const criticalErrors: string[] = []
    const warnings: string[] = []

    // Critical errors (prevent scheduling)
    if (!hasActiveQuarter) {
      criticalErrors.push('No hay trimestre académico activo configurado')
    }
    if (!hasActiveTimeBlocks) {
      criticalErrors.push('No hay bloques de tiempo activos configurados')
    }
    if (!hasActiveDays) {
      criticalErrors.push('No hay días laborables activos configurados')
    }
    if (!hasScheduleConfig) {
      criticalErrors.push('No hay configuración de horarios definida')
    }

    // Warnings (potential issues)
    if (hasActiveTimeBlocks && activeTimeBlocks.length < 4) {
      warnings.push(`Solo ${activeTimeBlocks.length} bloques de tiempo configurados. Se recomiendan al menos 4 bloques`)
    }
    if (hasActiveDays && activeDays.length < 5) {
      warnings.push(`Solo ${activeDays.length} días activos. Se recomiendan al menos 5 días laborables`)
    }

    // Success messages
    if (isConfigurationReady) {
      validationMessages.push('✅ Configuración académica completa y lista para programación')
      validationMessages.push(`📅 Trimestre activo: ${activeQuarter?.name || 'Sin nombre'}`)
      validationMessages.push(`⏰ ${activeTimeBlocks.length} bloques de tiempo disponibles`)
      validationMessages.push(`📆 ${activeDays.length} días laborables configurados`)
    }

    // Loading state messages
    if (timeBlocksLoading || daysLoading || scheduleConfigLoading || quartersLoading) {
      validationMessages.push('🔄 Cargando configuración académica...')
    }

    // Error state messages
    if (timeBlocksError || daysError || scheduleConfigError || quartersError) {
      criticalErrors.push('❌ Error al cargar configuración académica')
    }

    return {
      isConfigurationReady,
      canScheduleClasses,
      hasActiveQuarter,
      hasActiveTimeBlocks,
      hasActiveDays,
      hasScheduleConfig,
      missingConfiguration,
      validationMessages,
      criticalErrors,
      warnings
    }
  }, [
    processedData,
    timeBlocksLoading,
    daysLoading,
    scheduleConfigLoading,
    quartersLoading,
    timeBlocksError,
    daysError,
    scheduleConfigError,
    quartersError
  ])

  return {
    ...validation,
    activeQuarter: processedData.activeQuarter,
    activeTimeBlocks: processedData.activeTimeBlocks,
    activeDays: processedData.activeDays,
    scheduleConfig: processedData.scheduleConfig
  }
}

// Helper hook for quick checks
export const useCanSchedule = (): boolean => {
  const { canScheduleClasses } = useAcademicIntegrity()
  return canScheduleClasses
}

// Helper hook for critical error checking
export const useAcademicIntegrityErrors = (): { 
  hasErrors: boolean
  errors: string[]
  warnings: string[]
} => {
  const { criticalErrors, warnings } = useAcademicIntegrity()
  return {
    hasErrors: criticalErrors.length > 0,
    errors: criticalErrors,
    warnings
  }
}

export default useAcademicIntegrity