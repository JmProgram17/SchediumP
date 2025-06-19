/**
 * Feature-specific Error Boundary
 * Specialized error handling for academic modules
 */

import { ReactNode } from 'react'
import { BaseErrorBoundary } from './BaseErrorBoundary'
import { Button, Card } from '@/design-system/components'
import { AlertCircle, BookOpen, Users, Calendar, MapPin, GraduationCap, ClipboardList } from 'lucide-react'

interface FeatureErrorBoundaryProps {
  children: ReactNode
  moduleName: 'student' | 'instructor' | 'program' | 'course' | 'classroom' | 'schedule' | 'enrollment'
  onRetry?: () => void
}

const moduleConfig = {
  student: {
    displayName: 'Estudiantes',
    icon: GraduationCap,
    description: 'Gestión de estudiantes y matrículas',
    suggestions: [
      'Verificar conexión a internet',
      'Revisar permisos de usuario',
      'Contactar soporte académico'
    ]
  },
  instructor: {
    displayName: 'Instructores',
    icon: Users,
    description: 'Gestión de profesores y personal académico',
    suggestions: [
      'Verificar permisos de administrador',
      'Revisar estado del servidor',
      'Contactar departamento de RRHH'
    ]
  },
  program: {
    displayName: 'Programas Académicos',
    icon: BookOpen,
    description: 'Gestión de programas de formación',
    suggestions: [
      'Verificar configuración académica',
      'Revisar base de datos de programas',
      'Contactar coordinación académica'
    ]
  },
  course: {
    displayName: 'Cursos',
    icon: BookOpen,
    description: 'Gestión de materias y asignaturas',
    suggestions: [
      'Verificar estructura curricular',
      'Revisar datos de cursos',
      'Contactar coordinación académica'
    ]
  },
  classroom: {
    displayName: 'Aulas',
    icon: MapPin,
    description: 'Gestión de espacios físicos',
    suggestions: [
      'Verificar inventario de aulas',
      'Revisar configuración de espacios',
      'Contactar infraestructura'
    ]
  },
  schedule: {
    displayName: 'Horarios',
    icon: Calendar,
    description: 'Gestión de programación académica',
    suggestions: [
      'Verificar calendario académico',
      'Revisar conflictos de horarios',
      'Contactar coordinación académica'
    ]
  },
  enrollment: {
    displayName: 'Matrículas',
    icon: ClipboardList,
    description: 'Gestión de inscripciones estudiantiles',
    suggestions: [
      'Verificar período de matrículas',
      'Revisar cupos disponibles',
      'Contactar registro académico'
    ]
  }
}

/**
 * Feature Error Boundary with module-specific context
 */
export const FeatureErrorBoundary = ({ 
  children, 
  moduleName, 
  onRetry 
}: FeatureErrorBoundaryProps) => {
  const config = moduleConfig[moduleName]
  const IconComponent = config.icon

  const handleModuleRetry = () => {
    if (onRetry) {
      onRetry()
    }
  }

  const customFallback = (
    <Card className="p-6 m-4">
      <div className="text-center">
        {/* Module Icon */}
        <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full mb-4">
          <IconComponent className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>

        {/* Error Title */}
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Error en {config.displayName}
        </h2>

        {/* Module Description */}
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {config.description}
        </p>

        {/* Error Message */}
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center mb-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
            <span className="font-medium text-red-800 dark:text-red-300">
              No se pudo cargar el módulo
            </span>
          </div>
          <p className="text-sm text-red-700 dark:text-red-400">
            Ha ocurrido un error inesperado al cargar la información de {config.displayName.toLowerCase()}.
          </p>
        </div>

        {/* Suggestions */}
        <div className="text-left mb-6">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
            Posibles soluciones:
          </h3>
          <ul className="space-y-2">
            {config.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start">
                <span className="flex-shrink-0 w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-3" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {suggestion}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={handleModuleRetry}
            variant="primary"
            className="min-w-32"
          >
            Reintentar
          </Button>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="min-w-32"
          >
            Recargar Página
          </Button>
          <Button
            onClick={() => window.location.href = '/dashboard'}
            variant="ghost"
            className="min-w-32"
          >
            Ir al Dashboard
          </Button>
        </div>

        {/* Development Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-3 bg-gray-100 dark:bg-gray-800 rounded text-left">
            <p className="text-xs text-gray-600 dark:text-gray-400 font-mono">
              Module: {moduleName}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 font-mono">
              Boundary: FeatureErrorBoundary
            </p>
          </div>
        )}
      </div>
    </Card>
  )

  return (
    <BaseErrorBoundary
      level="feature"
      moduleName={config.displayName}
      fallback={customFallback}
      onError={(error, _errorInfo) => {
        // Module-specific error reporting
        console.error(`Feature Error in ${config.displayName}:`, error)
        
        // You could send module-specific telemetry here
        // analytics.track('feature_error', {
        //   module: moduleName,
        //   error: error.message,
        //   component_stack: errorInfo.componentStack
        // })
      }}
    >
      {children}
    </BaseErrorBoundary>
  )
}