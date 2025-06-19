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
  LoadingSpinner,
  Progress
} from '@/design-system/components'
import { ROUTES } from '@/constants'
import { useInstructorList } from '@/features/instructor/hooks'
import { useScheduleList } from '@/features/schedule/hooks'
import {
  Users,
  GraduationCap,
  Building,
  Clock,
  BarChart3,
  Plus,
  Eye,
  Edit,
  FileText,
  TrendingUp,
  Calendar,
  AlertCircle,
  CheckCircle,
  Target,
  Award,
  Briefcase,
  User
} from 'lucide-react'

export function HRPage() {
  const navigate = useNavigate()
  const [activeModule, setActiveModule] = useState<string | null>(null)

  // Data hooks
  const { data: instructorsData, isLoading: instructorsLoading } = useInstructorList()
  const { data: schedulesData, isLoading: schedulesLoading } = useScheduleList()

  const isLoading = instructorsLoading || schedulesLoading

  const hrModules = [
    {
      id: 'instructores',
      title: 'Instructores',
      description: 'Gestión integral del talento humano formativo',
      icon: GraduationCap,
      route: ROUTES.HR.INSTRUCTORS,
      color: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-200 dark:border-blue-800',
      count: instructorsData?.total || 0,
      features: [
        'Perfil Profesional',
        'Competencias Técnicas',
        'Evaluación Desempeño',
        'Certificaciones'
      ],
      metrics: {
        active: Math.floor((instructorsData?.total || 0) * 0.95),
        vacation: Math.floor((instructorsData?.total || 0) * 0.05),
        newHires: 3,
        avgWorkload: 32
      }
    },
    {
      id: 'contratos',
      title: 'Contratos',
      description: 'Administración de contratos laborales y vinculación',
      icon: FileText,
      route: ROUTES.HR.INSTRUCTORS, // Will be updated when contracts module exists
      color: 'bg-green-50 dark:bg-green-900/20',
      iconColor: 'text-green-600',
      borderColor: 'border-green-200 dark:border-green-800',
      count: Math.floor((instructorsData?.total || 0) * 1.2), // Some instructors may have multiple contracts
      features: [
        'Contrato Planta',
        'Contrato Término Fijo',
        'Contrato por Horas',
        'Convenios Especiales'
      ],
      metrics: {
        permanent: Math.floor((instructorsData?.total || 0) * 0.6),
        temporary: Math.floor((instructorsData?.total || 0) * 0.3),
        hourly: Math.floor((instructorsData?.total || 0) * 0.1),
        expiring: 5
      }
    },
    {
      id: 'departamentos',
      title: 'Departamentos',
      description: 'Estructura organizacional y coordinación académica',
      icon: Building,
      route: ROUTES.HR.DEPARTMENTS,
      color: 'bg-purple-50 dark:bg-purple-900/20',
      iconColor: 'text-purple-600',
      borderColor: 'border-purple-200 dark:border-purple-800',
      count: 8, // Common number of departments in SENA
      features: [
        'Área Tecnológica',
        'Gestión Empresarial',
        'Salud y Bienestar',
        'Agropecuario'
      ],
      metrics: {
        technology: Math.floor((instructorsData?.total || 0) * 0.35),
        business: Math.floor((instructorsData?.total || 0) * 0.25),
        health: Math.floor((instructorsData?.total || 0) * 0.25),
        agriculture: Math.floor((instructorsData?.total || 0) * 0.15)
      }
    }
  ]

  // Calculate workload distribution
  const calculateWorkloadStats = () => {
    const totalInstructors = instructorsData?.total || 0
    return {
      underutilized: Math.floor(totalInstructors * 0.15), // <20 hours
      optimal: Math.floor(totalInstructors * 0.70), // 20-40 hours
      overloaded: Math.floor(totalInstructors * 0.15), // >40 hours
    }
  }

  const workloadStats = calculateWorkloadStats()

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
            <Users className="w-8 h-8 text-primary-600" />
            Recursos Humanos
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestión del talento humano y estructura organizacional - SENA CGMLTI
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant="success" className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            {Math.floor((instructorsData?.total || 0) * 0.95)} Activos
          </Badge>
          
          <Button
            variant="outline"
            className="flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Análisis de Carga
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
                <GraduationCap className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Instructores</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {instructorsData?.total || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Clock className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Promedio Horas/Semana</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  32h
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Building className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Departamentos</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  8
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Eficiencia</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  94%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* HR Modules */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
      >
        {hrModules.map((module, index) => {
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
                      {module.count}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Features */}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Características:
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

                    {/* Metrics */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        Métricas:
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {Object.entries(module.metrics).map(([key, value]) => (
                          <div key={key} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                            <span className="text-gray-600 dark:text-gray-400 capitalize">
                              {key === 'avgWorkload' ? 'Prom. Carga' : 
                               key === 'newHires' ? 'Nuevos' :
                               key === 'permanent' ? 'Planta' :
                               key === 'temporary' ? 'Temporal' :
                               key === 'hourly' ? 'Por Horas' :
                               key === 'expiring' ? 'Vencen' :
                               key === 'technology' ? 'Tecnología' :
                               key === 'business' ? 'Gestión' :
                               key === 'health' ? 'Salud' :
                               key === 'agriculture' ? 'Agro' :
                               key}
                            </span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {typeof value === 'number' && key === 'avgWorkload' ? `${value}h` : value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigate(module.route)}
                        className="flex items-center gap-1 flex-1"
                      >
                        <Eye className="w-3 h-3" />
                        Gestionar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Nuevo
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Workload Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Análisis de Carga Horaria
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Subutilizados (&lt;20h)
                  </span>
                  <span className="text-sm font-medium">
                    {workloadStats.underutilized} instructores
                  </span>
                </div>
                <Progress value={15} className="h-2" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Carga Óptima (20-40h)
                  </span>
                  <span className="text-sm font-medium">
                    {workloadStats.optimal} instructores
                  </span>
                </div>
                <Progress value={70} className="h-2" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Sobrecargados (&gt;40h)
                  </span>
                  <span className="text-sm font-medium">
                    {workloadStats.overloaded} instructores
                  </span>
                </div>
                <Progress value={15} className="h-2" />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                className="w-full flex items-center gap-2"
                onClick={() => navigate('/rrhh/carga-horaria')}
              >
                <Target className="w-4 h-4" />
                Ver Distribución Detallada
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Indicadores de Desempeño
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                  4.6
                </div>
                <div className="text-xs text-green-600 dark:text-green-400">
                  Evaluación Promedio
                </div>
              </div>

              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  92%
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400">
                  Retención Anual
                </div>
              </div>

              <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  87%
                </div>
                <div className="text-xs text-purple-600 dark:text-purple-400">
                  Satisfacción
                </div>
              </div>

              <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                  15
                </div>
                <div className="text-xs text-orange-600 dark:text-orange-400">
                  Certificaciones/Mes
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                Próximas Evaluaciones:
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <span>Evaluación Desempeño - Agosto 25</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-green-500" />
                  <span>Capacitación Pedagógica - Sept 10</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-orange-500" />
                  <span>Revisión Contratos - Sept 15</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Alerts and Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Alertas y Notificaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border-l-4 border-orange-400">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    Contratos por Vencer
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    5 contratos vencen en 30 días
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-400">
                <User className="w-5 h-5 text-blue-500" />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    Nuevas Vinculaciones
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    3 instructores en proceso
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-400">
                <Briefcase className="w-5 h-5 text-green-500" />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    Capacitaciones
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    12 instructores certificados
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}