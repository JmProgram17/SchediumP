/**
 * Quarter Transition Component
 * Provides guided transition process between academic quarters
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowRightLeft,
  Calendar,
  Database,
  FileText,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Upload,
  Settings,
  Info,
  Clock,
  Star
} from 'lucide-react'
import { Typography, Button } from '@/design-system/components'
import { cn } from '@/utils/cn'

// Types for transition process
interface TransitionStep {
  id: string
  title: string
  description: string
  icon: any
  status: 'pending' | 'in_progress' | 'completed' | 'error'
  required: boolean
  estimatedTime: string
  actions?: TransitionAction[]
}

interface TransitionAction {
  id: string
  label: string
  description: string
  type: 'button' | 'info' | 'warning'
}

export function QuarterTransition() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  // Mock data
  const currentQuarter = {
    name: 'Trimestre 1 - 2024',
    start_date: '2024-02-01',
    end_date: '2024-04-30'
  }

  const nextQuarter = {
    name: 'Trimestre 2 - 2024',
    start_date: '2024-05-01',
    end_date: '2024-07-31'
  }

  const [transitionSteps, setTransitionSteps] = useState<TransitionStep[]>([
    {
      id: 'backup',
      title: 'Respaldo de Datos',
      description: 'Crear respaldo completo del trimestre actual antes de la transición',
      icon: Database,
      status: 'pending',
      required: true,
      estimatedTime: '5-10 min',
      actions: [
        {
          id: 'create_backup',
          label: 'Crear Respaldo',
          description: 'Genera un respaldo completo de todos los datos del trimestre actual',
          type: 'button'
        },
        {
          id: 'download_backup',
          label: 'Descargar Respaldo',
          description: 'Descarga el archivo de respaldo para almacenamiento externo',
          type: 'button'
        }
      ]
    },
    {
      id: 'finalize_schedules',
      title: 'Finalizar Horarios',
      description: 'Completar y archivar todos los horarios del trimestre actual',
      icon: Calendar,
      status: 'pending',
      required: true,
      estimatedTime: '2-5 min',
      actions: [
        {
          id: 'review_schedules',
          label: 'Revisar Horarios Pendientes',
          description: 'Verificar que no hay horarios incompletos o en conflicto',
          type: 'info'
        },
        {
          id: 'archive_schedules',
          label: 'Archivar Horarios',
          description: 'Mover todos los horarios finalizados al archivo histórico',
          type: 'button'
        }
      ]
    },
    {
      id: 'generate_reports',
      title: 'Generar Reportes',
      description: 'Crear reportes finales de estadísticas y rendimiento del trimestre',
      icon: FileText,
      status: 'pending',
      required: false,
      estimatedTime: '3-8 min',
      actions: [
        {
          id: 'usage_report',
          label: 'Reporte de Uso de Aulas',
          description: 'Estadísticas de ocupación y utilización de espacios',
          type: 'button'
        },
        {
          id: 'instructor_report',
          label: 'Reporte de Carga Docente',
          description: 'Resumen de horas y distribución por instructor',
          type: 'button'
        }
      ]
    },
    {
      id: 'prepare_next',
      title: 'Preparar Nuevo Trimestre',
      description: 'Configurar y validar el setup del próximo trimestre',
      icon: Settings,
      status: 'pending',
      required: true,
      estimatedTime: '5-15 min',
      actions: [
        {
          id: 'validate_config',
          label: 'Validar Configuración',
          description: 'Verificar que la estructura horaria está lista para el nuevo trimestre',
          type: 'info'
        },
        {
          id: 'setup_quarters',
          label: 'Configurar Trimestre',
          description: 'Activar el nuevo trimestre y configurar parámetros iniciales',
          type: 'button'
        }
      ]
    },
    {
      id: 'migrate_data',
      title: 'Migrar Datos Relevantes',
      description: 'Transferir información necesaria al nuevo trimestre',
      icon: Upload,
      status: 'pending',
      required: true,
      estimatedTime: '2-5 min',
      actions: [
        {
          id: 'migrate_instructors',
          label: 'Migrar Instructores',
          description: 'Transferir información de instructores activos',
          type: 'button'
        },
        {
          id: 'migrate_classrooms',
          label: 'Migrar Aulas',
          description: 'Actualizar configuración de aulas disponibles',
          type: 'button'
        }
      ]
    },
    {
      id: 'finalize',
      title: 'Finalizar Transición',
      description: 'Completar el proceso y activar el nuevo trimestre',
      icon: CheckCircle,
      status: 'pending',
      required: true,
      estimatedTime: '1-2 min',
      actions: [
        {
          id: 'final_validation',
          label: 'Validación Final',
          description: 'Verificar que todos los pasos se completaron correctamente',
          type: 'info'
        },
        {
          id: 'activate_quarter',
          label: 'Activar Nuevo Trimestre',
          description: 'Hacer el cambio oficial al nuevo trimestre',
          type: 'button'
        }
      ]
    }
  ])

  const completedSteps = transitionSteps.filter(step => step.status === 'completed').length
  const totalSteps = transitionSteps.length
  const progressPercentage = (completedSteps / totalSteps) * 100

  const executeAction = async (stepId: string, actionId: string) => {
    setIsTransitioning(true)
    
    setTransitionSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status: 'in_progress' }
        : step
    ))

    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setTransitionSteps(prev => prev.map(step => 
        step.id === stepId 
          ? { ...step, status: 'completed' }
          : step
      ))

      if (transitionSteps[currentStep]?.id === stepId && currentStep < totalSteps - 1) {
        setCurrentStep(currentStep + 1)
      }
    } catch (error) {
      setTransitionSteps(prev => prev.map(step => 
        step.id === stepId 
          ? { ...step, status: 'error' }
          : step
      ))
    } finally {
      setIsTransitioning(false)
    }
  }

  const renderStepIcon = (step: TransitionStep) => {
    const Icon = step.icon
    
    if (step.status === 'completed') {
      return <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
    } else if (step.status === 'error') {
      return <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
    } else if (step.status === 'in_progress') {
      return <RefreshCw className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-spin" />
    } else {
      return <Icon className="w-6 h-6 text-gray-400 dark:text-gray-500" />
    }
  }

  const renderStepActions = (step: TransitionStep) => {
    if (!step.actions) return null

    return (
      <div className="mt-4 space-y-3">
        {step.actions.map((action) => (
          <div key={action.id} className="flex items-center justify-between">
            <div className="flex-1">
              <Typography variant="body2" className="font-medium text-gray-900 dark:text-gray-100">
                {action.label}
              </Typography>
              <Typography variant="caption" className="text-gray-500 dark:text-gray-400">
                {action.description}
              </Typography>
            </div>
            {action.type === 'button' && (
              <Button
                onClick={() => executeAction(step.id, action.id)}
                disabled={isTransitioning || step.status === 'completed'}
                size="sm"
                className="ml-4"
              >
                {step.status === 'completed' ? 'Completado' : 'Ejecutar'}
              </Button>
            )}
            {action.type === 'info' && (
              <Info className="w-4 h-4 text-blue-500 ml-4" />
            )}
            {action.type === 'warning' && (
              <AlertTriangle className="w-4 h-4 text-amber-500 ml-4" />
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
            <ArrowRightLeft className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <Typography variant="h2" className="text-gray-900 dark:text-gray-100">
            Transición de Trimestre
          </Typography>
        </div>
        <Typography variant="body" className="text-gray-600 dark:text-gray-400">
          Proceso guiado para realizar la transición entre trimestres académicos de forma segura
        </Typography>
      </div>

      {/* Quarter Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3 mb-3">
            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <Typography variant="h3" className="text-blue-900 dark:text-blue-100">
              Trimestre Actual
            </Typography>
          </div>
          <Typography variant="h4" className="text-blue-800 dark:text-blue-200 mb-2">
            {currentQuarter.name}
          </Typography>
          <Typography variant="body2" className="text-blue-700 dark:text-blue-300">
            {new Date(currentQuarter.start_date).toLocaleDateString('es-ES')} - {new Date(currentQuarter.end_date).toLocaleDateString('es-ES')}
          </Typography>
          <div className="mt-3 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <Typography variant="caption" className="text-blue-600 dark:text-blue-400 font-medium">
              Activo
            </Typography>
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-3 mb-3">
            <Star className="w-5 h-5 text-green-600 dark:text-green-400" />
            <Typography variant="h3" className="text-green-900 dark:text-green-100">
              Próximo Trimestre
            </Typography>
          </div>
          <Typography variant="h4" className="text-green-800 dark:text-green-200 mb-2">
            {nextQuarter.name}
          </Typography>
          <Typography variant="body2" className="text-green-700 dark:text-green-300">
            {new Date(nextQuarter.start_date).toLocaleDateString('es-ES')} - {new Date(nextQuarter.end_date).toLocaleDateString('es-ES')}
          </Typography>
          <div className="mt-3 flex items-center gap-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
            <Typography variant="caption" className="text-green-600 dark:text-green-400 font-medium">
              En Preparación
            </Typography>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <Typography variant="h3" className="text-gray-900 dark:text-gray-100">
            Progreso de Transición
          </Typography>
          <Typography variant="body2" className="text-gray-600 dark:text-gray-400">
            {completedSteps} de {totalSteps} pasos completados
          </Typography>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4">
          <motion.div
            className="bg-indigo-600 h-3 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {transitionSteps.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                "flex flex-col items-center p-3 rounded-lg transition-colors cursor-pointer",
                index === currentStep 
                  ? "bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800"
                  : "hover:bg-gray-50 dark:hover:bg-gray-700/50",
                step.status === 'completed' && "bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800"
              )}
              onClick={() => setCurrentStep(index)}
            >
              {renderStepIcon(step)}
              <Typography 
                variant="caption" 
                className={cn(
                  "text-center mt-2 font-medium",
                  step.status === 'completed' ? "text-green-700 dark:text-green-300" :
                  index === currentStep ? "text-indigo-700 dark:text-indigo-300" :
                  "text-gray-600 dark:text-gray-400"
                )}
              >
                {step.title}
              </Typography>
            </div>
          ))}
        </div>
      </div>

      {/* Current Step Details */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {transitionSteps[currentStep] && (
              <>
                <div className="flex items-center gap-4 mb-4">
                  {renderStepIcon(transitionSteps[currentStep])}
                  <div className="flex-1">
                    <Typography variant="h3" className="text-gray-900 dark:text-gray-100 mb-1">
                      {transitionSteps[currentStep].title}
                    </Typography>
                    <Typography variant="body" className="text-gray-600 dark:text-gray-400">
                      {transitionSteps[currentStep].description}
                    </Typography>
                  </div>
                  <div className="text-right">
                    <Typography variant="caption" className="text-gray-500 dark:text-gray-400">
                      Tiempo estimado
                    </Typography>
                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                      <Clock className="w-4 h-4" />
                      <Typography variant="body2">{transitionSteps[currentStep].estimatedTime}</Typography>
                    </div>
                  </div>
                </div>

                {transitionSteps[currentStep].required && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <Typography variant="body2" className="text-amber-800 dark:text-amber-200 font-medium">
                        Este paso es obligatorio para completar la transición
                      </Typography>
                    </div>
                  </div>
                )}

                {renderStepActions(transitionSteps[currentStep])}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation and Actions */}
      <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
        <Button
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0 || isTransitioning}
          variant="outline"
          className="gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </Button>

        <div className="flex items-center gap-3">
          {completedSteps === totalSteps ? (
            <Button
              onClick={() => setShowConfirmation(true)}
              disabled={isTransitioning}
              className="gap-2 bg-green-600 hover:bg-green-700 text-white"
            >
              <ArrowRightLeft className="w-4 h-4" />
              Completar Transición
            </Button>
          ) : (
            <Typography variant="body2" className="text-gray-600 dark:text-gray-400">
              Completa todos los pasos para proceder
            </Typography>
          )}
        </div>

        <Button
          onClick={() => setCurrentStep(Math.min(totalSteps - 1, currentStep + 1))}
          disabled={currentStep === totalSteps - 1 || isTransitioning}
          variant="outline"
          className="gap-2"
        >
          Siguiente
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <Typography variant="h3" className="text-gray-900 dark:text-gray-100">
                  Confirmar Transición
                </Typography>
              </div>
              
              <Typography variant="body" className="text-gray-600 dark:text-gray-400 mb-6">
                ¿Estás seguro de que deseas proceder con la transición de trimestre? 
                Esta acción activará el nuevo trimestre y archivará el actual.
              </Typography>

              <div className="flex items-center gap-3 justify-end">
                <Button
                  onClick={() => setShowConfirmation(false)}
                  variant="outline"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => setShowConfirmation(false)}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Confirmar Transición
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default QuarterTransition