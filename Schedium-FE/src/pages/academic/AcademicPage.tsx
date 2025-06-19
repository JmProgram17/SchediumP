import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  LoadingSpinner
} from '@/design-system/components'
import { ROUTES } from '@/constants'
import { useStudentList } from '@/features/student/hooks'
import { useProgramList } from '@/features/program/hooks'
import { useCourseList } from '@/features/course/hooks'
import { useEnrollmentList } from '@/features/enrollment/hooks'
import {
  GraduationCap,
  School,
  BookOpen,
  Users,
  UserCheck,
  Plus,
  Eye,
  Edit,
  BarChart3,
  TrendingUp,
  Calendar,
  ArrowRight,
  Award,
  Target,
  FileText
} from 'lucide-react'

export function AcademicPage() {
  const navigate = useNavigate()
  const [activeModule, setActiveModule] = useState<string | null>(null)

  // Data hooks
  const { data: studentsData, isLoading: studentsLoading } = useStudentList({ limit: 1 })
  const { data: programsData, isLoading: programsLoading } = useProgramList({ limit: 1 })
  const { data: coursesData, isLoading: coursesLoading } = useCourseList({ limit: 1 })
  const { data: enrollmentsData, isLoading: enrollmentsLoading } = useEnrollmentList({ limit: 1 })

  const isLoading = studentsLoading || programsLoading || coursesLoading || enrollmentsLoading

  const academicModules = [
    {
      id: 'programas',
      title: 'Programas Formativos',
      description: 'Gestión completa de programas académicos y competencias',
      icon: School,
      route: ROUTES.ACADEMIC.PROGRAMS,
      color: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-200 dark:border-blue-800',
      count: programsData?.total || 0,
      features: ['Programas Técnicos', 'Programas Tecnológicos', 'Especialización Técnica', 'Competencias Laborales'],
      actions: [
        { label: 'Crear Programa', icon: Plus },
        { label: 'Ver Todos', icon: Eye },
        { label: 'Estadísticas', icon: BarChart3 }
      ]
    },
    {
      id: 'grupos',
      title: 'Fichas / Grupos',
      description: 'Administración de fichas formativas y grupos de aprendices',
      icon: Users,
      route: ROUTES.ACADEMIC.GROUPS,
      color: 'bg-green-50 dark:bg-green-900/20',
      iconColor: 'text-green-600',
      borderColor: 'border-green-200 dark:border-green-800',
      count: Math.floor((studentsData?.total || 0) / 25), // Approximate groups
      features: ['Fichas por Jornada', 'Asignación de Instructores', 'Control de Cupos', 'Seguimiento Académico'],
      actions: [
        { label: 'Nueva Ficha', icon: Plus },
        { label: 'Gestionar', icon: Edit },
        { label: 'Reportes', icon: FileText }
      ]
    },
    {
      id: 'competencias',
      title: 'Competencias',
      description: 'Catálogo de competencias y resultados de aprendizaje',
      icon: BookOpen,
      route: ROUTES.ACADEMIC.COURSES,
      color: 'bg-orange-50 dark:bg-orange-900/20',
      iconColor: 'text-orange-600',
      borderColor: 'border-orange-200 dark:border-orange-800',
      count: coursesData?.total || 0,
      features: ['Competencias Específicas', 'Competencias Transversales', 'Resultados de Aprendizaje', 'Criterios de Evaluación'],
      actions: [
        { label: 'Nueva Competencia', icon: Plus },
        { label: 'Catálogo', icon: Eye },
        { label: 'Asociar Programa', icon: ArrowRight }
      ]
    },
    {
      id: 'matriculas',
      title: 'Matrículas',
      description: 'Control de inscripciones y seguimiento académico',
      icon: UserCheck,
      route: ROUTES.ACADEMIC.ENROLLMENTS,
      color: 'bg-purple-50 dark:bg-purple-900/20',
      iconColor: 'text-purple-600',
      borderColor: 'border-purple-200 dark:border-purple-800',
      count: enrollmentsData?.total || 0,
      features: ['Proceso de Matrícula', 'Estado Académico', 'Cambios de Programa', 'Certificaciones'],
      actions: [
        { label: 'Nueva Matrícula', icon: Plus },
        { label: 'Seguimiento', icon: TrendingUp },
        { label: 'Certificados', icon: Award }
      ]
    },
    {
      id: 'niveles',
      title: 'Niveles de Formación',
      description: 'Estructura de niveles formativos y cadenas de formación',
      icon: Target,
      route: ROUTES.ACADEMIC.LEVELS,
      color: 'bg-indigo-50 dark:bg-indigo-900/20',
      iconColor: 'text-indigo-600',
      borderColor: 'border-indigo-200 dark:border-indigo-800',
      count: 4, // Technical, Technological, Specialization, Labor
      features: ['Nivel Técnico', 'Nivel Tecnológico', 'Especialización', 'Formación Laboral'],
      actions: [
        { label: 'Configurar', icon: Edit },
        { label: 'Cadenas', icon: ArrowRight },
        { label: 'Nomenclaturas', icon: FileText }
      ]
    },
    {
      id: 'aprendices',
      title: 'Aprendices',
      description: 'Gestión integral de estudiantes y expedientes académicos',
      icon: GraduationCap,
      route: ROUTES.ACADEMIC.STUDENTS,
      color: 'bg-teal-50 dark:bg-teal-900/20',
      iconColor: 'text-teal-600',
      borderColor: 'border-teal-200 dark:border-teal-800',
      count: studentsData?.total || 0,
      features: ['Expediente Académico', 'Seguimiento Formativo', 'Evaluaciones', 'Proyecto Formativo'],
      actions: [
        { label: 'Registrar Aprendiz', icon: Plus },
        { label: 'Expedientes', icon: Eye },
        { label: 'Evaluaciones', icon: BarChart3 }
      ]
    }
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-primary-600" />
            Gestión Académica
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Administración integral del sistema formativo - SENA CGMLTI
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant="success" className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Trimestre 2024-2 Activo
          </Badge>
          
          <Button
            variant="outline"
            className="flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Estadísticas Generales
          </Button>
        </div>
      </motion.div>

      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <School className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Programas Activos</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {programsData?.total || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Fichas Formativas</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {Math.floor((studentsData?.total || 0) / 25)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-100 dark:bg-teal-900/20 rounded-lg">
                <GraduationCap className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Aprendices</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {(studentsData?.total || 0).toLocaleString('es-CO')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <UserCheck className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Matrículas</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {(enrollmentsData?.total || 0).toLocaleString('es-CO')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Academic Modules Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {academicModules.map((module, index) => {
          const IconComponent = module.icon
          return (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * index }}
              whileHover={{ scale: 1.02 }}
              onHoverStart={() => setActiveModule(module.id)}
              onHoverEnd={() => setActiveModule(null)}
            >
              <Card className={`transition-all duration-300 cursor-pointer hover:shadow-xl ${module.borderColor} ${
                activeModule === module.id ? 'shadow-lg' : ''
              }`}>
                <CardHeader className={`${module.color} border-b ${module.borderColor}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                        <IconComponent className={`w-6 h-6 ${module.iconColor}`} />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-gray-900 dark:text-gray-100">
                          {module.title}
                        </CardTitle>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {module.description}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-lg font-bold">
                      {module.count.toLocaleString('es-CO')}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Features */}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Características principales:
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {module.features.map((feature, featureIndex) => (
                          <div
                            key={featureIndex}
                            className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2"
                          >
                            <div className={`w-2 h-2 rounded-full ${module.iconColor.replace('text-', 'bg-')}`} />
                            {feature}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                      {module.actions.map((action, actionIndex) => {
                        const ActionIcon = action.icon
                        return (
                          <Button
                            key={actionIndex}
                            variant={actionIndex === 0 ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => navigate(module.route)}
                            className="flex items-center gap-1"
                          >
                            <ActionIcon className="w-3 h-3" />
                            {action.label}
                          </Button>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Quick Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="w-5 h-5" />
              Navegación Rápida
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              <Button
                variant="ghost"
                className="h-auto p-4 flex flex-col items-center gap-2"
                onClick={() => navigate(ROUTES.ACADEMIC.PROGRAMS)}
              >
                <School className="w-6 h-6 text-blue-600" />
                <span className="text-xs">Programas</span>
              </Button>
              
              <Button
                variant="ghost"
                className="h-auto p-4 flex flex-col items-center gap-2"
                onClick={() => navigate(ROUTES.ACADEMIC.GROUPS)}
              >
                <Users className="w-6 h-6 text-green-600" />
                <span className="text-xs">Fichas</span>
              </Button>
              
              <Button
                variant="ghost"
                className="h-auto p-4 flex flex-col items-center gap-2"
                onClick={() => navigate(ROUTES.ACADEMIC.COURSES)}
              >
                <BookOpen className="w-6 h-6 text-orange-600" />
                <span className="text-xs">Competencias</span>
              </Button>
              
              <Button
                variant="ghost"
                className="h-auto p-4 flex flex-col items-center gap-2"
                onClick={() => navigate(ROUTES.ACADEMIC.ENROLLMENTS)}
              >
                <UserCheck className="w-6 h-6 text-purple-600" />
                <span className="text-xs">Matrículas</span>
              </Button>
              
              <Button
                variant="ghost"
                className="h-auto p-4 flex flex-col items-center gap-2"
                onClick={() => navigate(ROUTES.ACADEMIC.LEVELS)}
              >
                <Target className="w-6 h-6 text-indigo-600" />
                <span className="text-xs">Niveles</span>
              </Button>
              
              <Button
                variant="ghost"
                className="h-auto p-4 flex flex-col items-center gap-2"
                onClick={() => navigate(ROUTES.ACADEMIC.STUDENTS)}
              >
                <GraduationCap className="w-6 h-6 text-teal-600" />
                <span className="text-xs">Aprendices</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Academic Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Indicadores Académicos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Tasa de Matrícula</span>
                <Badge variant="success">95%</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Deserción Académica</span>
                <Badge variant="warning">12%</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Certificación</span>
                <Badge variant="success">88%</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Evaluación Promedio</span>
                <Badge variant="success">4.2/5.0</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Próximas Actividades
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Inicio de matrículas - Trimestre 2024-3
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">15 de Septiembre</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Evaluación de competencias
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">20-25 de Agosto</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="w-2 h-2 bg-orange-500 rounded-full" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Revisión de proyectos formativos
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">30 de Agosto</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}