/**
 * Academic Integrity Guard Component
 * Blocks access to scheduling functionality when academic configuration is incomplete
 * Provides clear guidance on what needs to be configured
 */

import React from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  Settings,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  RefreshCw
} from 'lucide-react'
import { Button, Typography } from '@/design-system/components'
import { cn } from '@/utils/cn'
import { useAcademicIntegrity } from '@/hooks/useAcademicIntegrity'

export interface AcademicIntegrityGuardProps {
  children: React.ReactNode
  requiresConfiguration?: boolean
  showWarnings?: boolean
  allowPartialAccess?: boolean
  fallbackMessage?: string
  className?: string
}

export const AcademicIntegrityGuard: React.FC<AcademicIntegrityGuardProps> = ({
  children,
  requiresConfiguration = true,
  showWarnings = true,
  allowPartialAccess = false,
  fallbackMessage,
  className
}) => {
  const navigate = useNavigate()
  const {
    isConfigurationReady,
    missingConfiguration,
    criticalErrors,
    warnings,
    activeQuarter,
    activeTimeBlocks,
    activeDays
  } = useAcademicIntegrity()

  // Determine if we should block access
  const shouldBlock = requiresConfiguration && !isConfigurationReady && !allowPartialAccess
  const shouldShowWarnings = showWarnings && (warnings.length > 0 || criticalErrors.length > 0)

  // If configuration is ready, show children with optional warnings
  if (!shouldBlock) {
    return (
      <div className={cn("space-y-4", className)}>
        {/* Show warnings if enabled */}
        {shouldShowWarnings && warnings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <Typography variant="body2" className="text-amber-800 dark:text-amber-200 font-medium mb-2">
                  Advertencias de Configuración
                </Typography>
                <ul className="space-y-1">
                  {warnings.map((warning, index) => (
                    <li key={index} className="text-sm text-amber-700 dark:text-amber-300">
                      {warning}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Show success status */}
        {isConfigurationReady && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <Typography variant="body2" className="text-green-800 dark:text-green-200">
                ✅ Configuración académica completa - Sistema listo para programación
              </Typography>
            </div>
          </motion.div>
        )}

        {children}
      </div>
    )
  }

  // Configuration is incomplete - show blocking screen
  return (
    <div className={cn("space-y-6", className)}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-[400px] flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-8"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-amber-100 dark:bg-amber-900/30 rounded-full">
              <Settings className="w-12 h-12 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          
          <Typography variant="h2" className="text-gray-900 dark:text-gray-100 mb-2">
            Configuración Académica Requerida
          </Typography>
          
          <Typography variant="body" className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            {fallbackMessage || 
             "Antes de programar clases, debe completar la configuración académica básica del sistema."
            }
          </Typography>
        </div>

        {/* Critical Errors */}
        {criticalErrors.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-full max-w-lg mb-6"
          >
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <Typography variant="body2" className="text-red-800 dark:text-red-200 font-medium mb-2">
                    Errores Críticos
                  </Typography>
                  <ul className="space-y-1">
                    {criticalErrors.map((error, index) => (
                      <li key={index} className="text-sm text-red-700 dark:text-red-300">
                        • {error}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Configuration Checklist */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-lg mb-8"
        >
          <Typography variant="h3" className="text-gray-900 dark:text-gray-100 mb-4 text-center">
            Lista de Verificación
          </Typography>
          
          <div className="space-y-3">
            {/* Quarters */}
            <ConfigurationItem
              icon={Calendar}
              title="Trimestre Académico"
              isComplete={!missingConfiguration.quarters}
              description={
                missingConfiguration.quarters 
                  ? "Configure un trimestre académico activo"
                  : `Trimestre activo: ${activeQuarter?.name || 'Configurado'}`
              }
            />

            {/* Time Blocks */}
            <ConfigurationItem
              icon={Clock}
              title="Bloques de Tiempo"
              isComplete={!missingConfiguration.timeBlocks}
              description={
                missingConfiguration.timeBlocks
                  ? "Configure bloques de tiempo para las clases"
                  : `${activeTimeBlocks.length} bloques de tiempo configurados`
              }
            />

            {/* Days */}
            <ConfigurationItem
              icon={Calendar}
              title="Días Laborables"
              isComplete={!missingConfiguration.activeDays}
              description={
                missingConfiguration.activeDays
                  ? "Active los días laborables de la semana"
                  : `${activeDays.length} días laborables activos`
              }
            />

            {/* Schedule Config */}
            <ConfigurationItem
              icon={Settings}
              title="Configuración de Horarios"
              isComplete={!missingConfiguration.scheduleConfig}
              description={
                missingConfiguration.scheduleConfig
                  ? "Configure parámetros generales de horarios"
                  : "Configuración de horarios establecida"
              }
            />
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Button
            onClick={() => navigate('/configuracion-academica')}
            variant="primary"
            size="lg"
            className="flex items-center gap-2"
          >
            <Settings className="w-5 h-5" />
            Ir a Configuración Académica
            <ArrowRight className="w-4 h-4" />
          </Button>
          
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            size="lg"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar Estado
          </Button>
        </motion.div>

        {/* Help Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <Typography variant="caption" className="text-gray-500 dark:text-gray-400">
            Una vez completada la configuración, podrá acceder a la programación de clases
          </Typography>
        </motion.div>
      </motion.div>
    </div>
  )
}

// Configuration Item Component
interface ConfigurationItemProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  isComplete: boolean
  description: string
}

const ConfigurationItem: React.FC<ConfigurationItemProps> = ({
  icon: Icon,
  title,
  isComplete,
  description
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg border",
        isComplete
          ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
          : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
      )}
    >
      <div className={cn(
        "p-2 rounded-lg",
        isComplete
          ? "bg-green-100 dark:bg-green-900/30"
          : "bg-gray-100 dark:bg-gray-700"
      )}>
        <Icon className={cn(
          "w-4 h-4",
          isComplete
            ? "text-green-600 dark:text-green-400"
            : "text-gray-500 dark:text-gray-400"
        )} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Typography variant="body2" className={cn(
            "font-medium",
            isComplete
              ? "text-green-800 dark:text-green-200"
              : "text-gray-900 dark:text-gray-100"
          )}>
            {title}
          </Typography>
          {isComplete ? (
            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
          ) : (
            <XCircle className="w-4 h-4 text-red-500 dark:text-red-400" />
          )}
        </div>
        
        <Typography variant="caption" className={cn(
          isComplete
            ? "text-green-700 dark:text-green-300"
            : "text-gray-600 dark:text-gray-400"
        )}>
          {description}
        </Typography>
      </div>
    </motion.div>
  )
}

export default AcademicIntegrityGuard