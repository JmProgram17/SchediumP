/**
 * Academic Integrity Alert System
 * Provides real-time alerts and notifications about academic configuration integrity
 */

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  X,
  Settings,
  Clock,
  Calendar,
  Zap
} from 'lucide-react'
import { Button, Typography } from '@/design-system/components'
import { cn } from '@/utils/cn'
import { useAcademicIntegrity } from '@/hooks/useAcademicIntegrity'
import { useNavigate } from 'react-router-dom'

export type AlertSeverity = 'success' | 'warning' | 'error' | 'info'
export type AlertPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center'

export interface AcademicIntegrityAlertProps {
  position?: AlertPosition
  autoHide?: boolean
  autoHideDelay?: number
  showOnlyErrors?: boolean
  className?: string
}

export const AcademicIntegrityAlert: React.FC<AcademicIntegrityAlertProps> = ({
  position = 'top-right',
  autoHide = false,
  autoHideDelay = 5000,
  showOnlyErrors = false,
  className
}) => {
  const navigate = useNavigate()
  const {
    isConfigurationReady,
    criticalErrors,
    warnings,
    hasActiveQuarter,
    hasActiveTimeBlocks,
    hasActiveDays,
    hasScheduleConfig
  } = useAcademicIntegrity()

  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([])
  const [showAlert, setShowAlert] = useState(true)

  // Auto hide functionality
  useEffect(() => {
    if (autoHide && isConfigurationReady && criticalErrors.length === 0) {
      const timer = setTimeout(() => {
        setShowAlert(false)
      }, autoHideDelay)

      return () => clearTimeout(timer)
    }
  }, [autoHide, autoHideDelay, isConfigurationReady, criticalErrors.length])

  // Determine alert severity and content
  const getAlertData = () => {
    if (criticalErrors.length > 0) {
      return {
        severity: 'error' as AlertSeverity,
        icon: XCircle,
        title: 'Configuración Académica Incompleta',
        messages: criticalErrors,
        action: 'Configurar Ahora',
        actionPath: '/configuracion-academica'
      }
    }

    if (warnings.length > 0 && !showOnlyErrors) {
      return {
        severity: 'warning' as AlertSeverity,
        icon: AlertTriangle,
        title: 'Advertencias de Configuración',
        messages: warnings,
        action: 'Optimizar',
        actionPath: '/configuracion-academica'
      }
    }

    if (isConfigurationReady && !showOnlyErrors) {
      return {
        severity: 'success' as AlertSeverity,
        icon: CheckCircle,
        title: 'Sistema Listo',
        messages: ['✅ Configuración académica completa'],
        action: null,
        actionPath: null
      }
    }

    return null
  }

  const alertData = getAlertData()

  // Don't render if no alerts or if dismissed
  if (!alertData || !showAlert) {
    return null
  }

  const alertId = `${alertData.severity}-${alertData.messages.join('-')}`
  if (dismissedAlerts.includes(alertId)) {
    return null
  }

  const handleDismiss = () => {
    setDismissedAlerts(prev => [...prev, alertId])
  }

  const handleAction = () => {
    if (alertData.actionPath) {
      navigate(alertData.actionPath)
    }
  }

  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4'
      case 'top-left':
        return 'top-4 left-4'
      case 'bottom-right':
        return 'bottom-4 right-4'
      case 'bottom-left':
        return 'bottom-4 left-4'
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2'
      default:
        return 'top-4 right-4'
    }
  }

  const getSeverityStyles = (severity: AlertSeverity) => {
    switch (severity) {
      case 'error':
        return {
          container: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
          icon: 'text-red-600 dark:text-red-400',
          title: 'text-red-800 dark:text-red-200',
          text: 'text-red-700 dark:text-red-300',
          button: 'bg-red-600 hover:bg-red-700 text-white'
        }
      case 'warning':
        return {
          container: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
          icon: 'text-amber-600 dark:text-amber-400',
          title: 'text-amber-800 dark:text-amber-200',
          text: 'text-amber-700 dark:text-amber-300',
          button: 'bg-amber-600 hover:bg-amber-700 text-white'
        }
      case 'success':
        return {
          container: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
          icon: 'text-green-600 dark:text-green-400',
          title: 'text-green-800 dark:text-green-200',
          text: 'text-green-700 dark:text-green-300',
          button: 'bg-green-600 hover:bg-green-700 text-white'
        }
      case 'info':
        return {
          container: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
          icon: 'text-blue-600 dark:text-blue-400',
          title: 'text-blue-800 dark:text-blue-200',
          text: 'text-blue-700 dark:text-blue-300',
          button: 'bg-blue-600 hover:bg-blue-700 text-white'
        }
    }
  }

  const styles = getSeverityStyles(alertData.severity)
  const Icon = alertData.icon

  return (
    <div className={cn('fixed z-50', getPositionClasses(), className)}>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className={cn(
            'max-w-sm rounded-lg border shadow-lg p-4',
            styles.container
          )}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Icon className={cn('w-5 h-5', styles.icon)} />
              <Typography variant="body2" className={cn('font-medium', styles.title)}>
                {alertData.title}
              </Typography>
            </div>
            
            <button
              onClick={handleDismiss}
              className={cn('p-1 rounded hover:bg-black/5 dark:hover:bg-white/5', styles.text)}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="space-y-1 mb-4">
            {alertData.messages.map((message, index) => (
              <Typography key={index} variant="caption" className={cn('block', styles.text)}>
                {message}
              </Typography>
            ))}
          </div>

          {/* Configuration Status Indicators */}
          {alertData.severity === 'error' && (
            <div className="grid grid-cols-2 gap-2 mb-4">
              <StatusIndicator
                icon={Calendar}
                label="Trimestre"
                isActive={hasActiveQuarter}
                severity={alertData.severity}
              />
              <StatusIndicator
                icon={Clock}
                label="Bloques"
                isActive={hasActiveTimeBlocks}
                severity={alertData.severity}
              />
              <StatusIndicator
                icon={Calendar}
                label="Días"
                isActive={hasActiveDays}
                severity={alertData.severity}
              />
              <StatusIndicator
                icon={Settings}
                label="Config"
                isActive={hasScheduleConfig}
                severity={alertData.severity}
              />
            </div>
          )}

          {/* Action Button */}
          {alertData.action && (
            <Button
              onClick={handleAction}
              size="sm"
              className={cn('w-full', styles.button)}
            >
              <Zap className="w-4 h-4 mr-2" />
              {alertData.action}
            </Button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// Status Indicator Component
interface StatusIndicatorProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  isActive: boolean
  severity: AlertSeverity
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  icon: Icon,
  label,
  isActive,
  severity
}) => {
  const getStyles = () => {
    if (isActive) {
      return {
        container: 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700',
        icon: 'text-green-600 dark:text-green-400',
        text: 'text-green-800 dark:text-green-200'
      }
    }
    
    switch (severity) {
      case 'error':
        return {
          container: 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700',
          icon: 'text-red-600 dark:text-red-400',
          text: 'text-red-800 dark:text-red-200'
        }
      default:
        return {
          container: 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600',
          icon: 'text-gray-600 dark:text-gray-400',
          text: 'text-gray-800 dark:text-gray-200'
        }
    }
  }

  const styles = getStyles()

  return (
    <div className={cn(
      'flex items-center gap-1 p-2 rounded border text-xs',
      styles.container
    )}>
      <Icon className={cn('w-3 h-3', styles.icon)} />
      <span className={cn('font-medium', styles.text)}>
        {label}
      </span>
      {isActive ? (
        <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400 ml-auto" />
      ) : (
        <XCircle className="w-3 h-3 text-red-600 dark:text-red-400 ml-auto" />
      )}
    </div>
  )
}

export default AcademicIntegrityAlert