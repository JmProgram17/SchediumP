/**
 * Academic Integrity Provider
 * Global context provider for academic integrity monitoring
 */

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { useAcademicIntegrity } from '@/hooks/useAcademicIntegrity'
import { AcademicIntegrityAlert } from '@/components/AcademicIntegrityAlert'

export interface AcademicIntegrityContextType {
  isMonitoring: boolean
  enableMonitoring: () => void
  disableMonitoring: () => void
  showGlobalAlert: boolean
  setShowGlobalAlert: (show: boolean) => void
  forceValidation: () => void
  integrityHistory: IntegrityHistoryEntry[]
}

interface IntegrityHistoryEntry {
  timestamp: Date
  type: 'error' | 'warning' | 'success' | 'info'
  message: string
  details?: any
}

const AcademicIntegrityContext = createContext<AcademicIntegrityContextType | undefined>(undefined)

export interface AcademicIntegrityProviderProps {
  children: React.ReactNode
  enableGlobalAlert?: boolean
  alertPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center'
  monitoringInterval?: number // ms
}

export const AcademicIntegrityProvider: React.FC<AcademicIntegrityProviderProps> = ({
  children,
  enableGlobalAlert = true,
  alertPosition = 'top-right',
  monitoringInterval = 30000 // 30 seconds
}) => {
  const queryClient = useQueryClient()
  const {
    isConfigurationReady,
    canScheduleClasses,
    criticalErrors,
    warnings,
    validationMessages
  } = useAcademicIntegrity()

  const [isMonitoring, setIsMonitoring] = useState(true)
  const [showGlobalAlert, setShowGlobalAlert] = useState(enableGlobalAlert)
  const [integrityHistory, setIntegrityHistory] = useState<IntegrityHistoryEntry[]>([])
  const [lastKnownState, setLastKnownState] = useState<{
    isReady: boolean
    errorCount: number
    warningCount: number
  }>({
    isReady: isConfigurationReady,
    errorCount: criticalErrors.length,
    warningCount: warnings.length
  })

  // Add entry to integrity history
  const addHistoryEntry = (entry: Omit<IntegrityHistoryEntry, 'timestamp'>) => {
    setIntegrityHistory(prev => [
      {
        ...entry,
        timestamp: new Date()
      },
      ...prev.slice(0, 49) // Keep last 50 entries
    ])
  }

  // Monitor configuration changes
  useEffect(() => {
    if (!isMonitoring) return

    const currentState = {
      isReady: isConfigurationReady,
      errorCount: criticalErrors.length,
      warningCount: warnings.length
    }

    // Check for state changes
    if (currentState.isReady !== lastKnownState.isReady) {
      if (currentState.isReady) {
        addHistoryEntry({
          type: 'success',
          message: 'Configuración académica completada',
          details: { validationMessages }
        })
        toast.success('✅ Sistema académico listo para programación')
      } else {
        addHistoryEntry({
          type: 'error',
          message: 'Configuración académica incompleta detectada',
          details: { criticalErrors }
        })
        toast.error('⚠️ Sistema de programación bloqueado')
      }
    }

    // Check for new errors
    if (currentState.errorCount > lastKnownState.errorCount) {
      const newErrors = criticalErrors.slice(0, currentState.errorCount - lastKnownState.errorCount)
      newErrors.forEach(error => {
        addHistoryEntry({
          type: 'error',
          message: error,
          details: { source: 'critical_validation' }
        })
      })
    }

    // Check for new warnings
    if (currentState.warningCount > lastKnownState.warningCount) {
      const newWarnings = warnings.slice(0, currentState.warningCount - lastKnownState.warningCount)
      newWarnings.forEach(warning => {
        addHistoryEntry({
          type: 'warning',
          message: warning,
          details: { source: 'warning_validation' }
        })
      })
    }

    // Check for resolved issues
    if (currentState.errorCount < lastKnownState.errorCount) {
      addHistoryEntry({
        type: 'info',
        message: `${lastKnownState.errorCount - currentState.errorCount} errores críticos resueltos`,
        details: { resolved_errors: lastKnownState.errorCount - currentState.errorCount }
      })
    }

    setLastKnownState(currentState)
  }, [
    isMonitoring,
    isConfigurationReady,
    criticalErrors,
    warnings,
    validationMessages,
    lastKnownState
  ])

  // Periodic integrity checks
  useEffect(() => {
    if (!isMonitoring) return

    const interval = setInterval(() => {
      console.log('🔍 [Academic Integrity] Periodic check:', {
        timestamp: new Date().toISOString(),
        isReady: isConfigurationReady,
        canSchedule: canScheduleClasses,
        errors: criticalErrors.length,
        warnings: warnings.length
      })

      // Force re-validation of academic configuration
      queryClient.invalidateQueries({ queryKey: ['academic-config'] })
    }, monitoringInterval)

    return () => clearInterval(interval)
  }, [isMonitoring, monitoringInterval, queryClient, isConfigurationReady, canScheduleClasses, criticalErrors.length, warnings.length])

  // Context value
  const contextValue: AcademicIntegrityContextType = {
    isMonitoring,
    enableMonitoring: () => {
      setIsMonitoring(true)
      addHistoryEntry({
        type: 'info',
        message: 'Monitoreo de integridad académica habilitado'
      })
    },
    disableMonitoring: () => {
      setIsMonitoring(false)
      addHistoryEntry({
        type: 'info',
        message: 'Monitoreo de integridad académica deshabilitado'
      })
    },
    showGlobalAlert,
    setShowGlobalAlert,
    forceValidation: () => {
      addHistoryEntry({
        type: 'info',
        message: 'Validación forzada solicitada'
      })
      queryClient.invalidateQueries({ queryKey: ['academic-config'] })
      queryClient.invalidateQueries({ queryKey: ['scheduling'] })
    },
    integrityHistory
  }

  return (
    <AcademicIntegrityContext.Provider value={contextValue}>
      {children}
      
      {/* Global Alert */}
      {showGlobalAlert && (
        <AcademicIntegrityAlert
          position={alertPosition}
          autoHide={false}
          showOnlyErrors={false}
        />
      )}
    </AcademicIntegrityContext.Provider>
  )
}

// Hook to use the academic integrity context
export const useAcademicIntegrityContext = (): AcademicIntegrityContextType => {
  const context = useContext(AcademicIntegrityContext)
  if (context === undefined) {
    throw new Error('useAcademicIntegrityContext must be used within an AcademicIntegrityProvider')
  }
  return context
}

// Helper component for debugging integrity state
export const AcademicIntegrityDebugPanel: React.FC<{ show?: boolean }> = ({ show = false }) => {
  const { integrityHistory, isMonitoring, forceValidation } = useAcademicIntegrityContext()
  const {
    isConfigurationReady,
    canScheduleClasses,
    criticalErrors,
    warnings,
    activeQuarter,
    activeTimeBlocks,
    activeDays
  } = useAcademicIntegrity()

  if (!show || process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 max-w-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-50">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          🔍 Academic Integrity Debug
        </h4>
        <button
          onClick={forceValidation}
          className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded"
        >
          Force Check
        </button>
      </div>
      
      <div className="space-y-2 text-xs">
        <div className="grid grid-cols-2 gap-2">
          <div className={`p-2 rounded ${isConfigurationReady ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            Config: {isConfigurationReady ? '✅' : '❌'}
          </div>
          <div className={`p-2 rounded ${canScheduleClasses ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            Schedule: {canScheduleClasses ? '✅' : '❌'}
          </div>
        </div>
        
        <div className="text-gray-600 dark:text-gray-400">
          <div>Monitoring: {isMonitoring ? '🟢' : '🔴'}</div>
          <div>Errors: {criticalErrors.length}</div>
          <div>Warnings: {warnings.length}</div>
          <div>Quarter: {activeQuarter ? '✅' : '❌'}</div>
          <div>Blocks: {activeTimeBlocks.length}</div>
          <div>Days: {activeDays.length}</div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
          <div className="text-gray-500 dark:text-gray-400 font-medium mb-1">Recent Events:</div>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {integrityHistory.slice(0, 5).map((entry, index) => (
              <div key={index} className="text-xs">
                <span className={`inline-block w-2 h-2 rounded-full mr-1 ${
                  entry.type === 'error' ? 'bg-red-500' :
                  entry.type === 'warning' ? 'bg-amber-500' :
                  entry.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
                }`} />
                {entry.message.substring(0, 40)}...
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AcademicIntegrityProvider