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
  Select,
  Input,
  LoadingSpinner
} from '@/design-system/components'
import { ROUTES } from '@/constants'
import { useClassroomList } from '@/features/classroom/hooks'
import { useScheduleList } from '@/features/schedule/hooks'
import {
  Building,
  MapPin,
  Users,
  Monitor,
  Wifi,
  Zap,
  Search,
  Filter,
  Eye,
  Edit,
  Plus,
  BarChart3,
  Settings,
  CheckCircle,
  AlertCircle,
  Clock,
  Target,
  Home,
  School
} from 'lucide-react'

export function InfrastructurePage() {
  const navigate = useNavigate()
  const [activeModule, setActiveModule] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    sede: 'all',
    building: 'all',
    capacity: 'all',
    equipment: 'all',
    availability: 'all'
  })

  // Data hooks
  const { data: classroomsData, isLoading: classroomsLoading } = useClassroomList()
  const { data: schedulesData, isLoading: schedulesLoading } = useScheduleList()

  const isLoading = classroomsLoading || schedulesLoading

  const infrastructureModules = [
    {
      id: 'sedes',
      title: 'Sedes / Campus',
      description: 'Gestión de sedes y centros de formación',
      icon: School,
      route: ROUTES.INFRASTRUCTURE.CAMPUS,
      color: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-200 dark:border-blue-800',
      count: 3, // Principal, Anexo, Satélite
      features: [
        'Sede Principal CGMLTI',
        'Sede Anexo Tecnológico',
        'Sede Satélite Rural',
        'Centros Especializados'
      ],
      metrics: {
        active: 3,
        total_area: '15,000m²',
        buildings: 12,
        students: 2450
      }
    },
    {
      id: 'edificios',
      title: 'Edificios',
      description: 'Administración de edificios y estructuras',
      icon: Building,
      route: ROUTES.INFRASTRUCTURE.BUILDINGS,
      color: 'bg-green-50 dark:bg-green-900/20',
      iconColor: 'text-green-600',
      borderColor: 'border-green-200 dark:border-green-800',
      count: 12,
      features: [
        'Edificio Administrativo',
        'Talleres Técnicos',
        'Laboratorios',
        'Aulas de Teoría'
      ],
      metrics: {
        administrative: 2,
        academic: 6,
        workshops: 3,
        services: 1
      }
    },
    {
      id: 'aulas',
      title: 'Aulas',
      description: 'Control de espacios de formación y equipamiento',
      icon: Home,
      route: ROUTES.INFRASTRUCTURE.CLASSROOMS,
      color: 'bg-purple-50 dark:bg-purple-900/20',
      iconColor: 'text-purple-600',
      borderColor: 'border-purple-200 dark:border-purple-800',
      count: classroomsData?.total || 0,
      features: [
        'Aulas Teóricas',
        'Laboratorios Especializados',
        'Talleres Prácticos',
        'Espacios Virtuales'
      ],
      metrics: {
        theory: Math.floor((classroomsData?.total || 0) * 0.4),
        labs: Math.floor((classroomsData?.total || 0) * 0.3),
        workshops: Math.floor((classroomsData?.total || 0) * 0.2),
        virtual: Math.floor((classroomsData?.total || 0) * 0.1)
      }
    }
  ]

  const capacityFilters = [
    { value: 'all', label: 'Todas las capacidades' },
    { value: '1-15', label: '1-15 personas' },
    { value: '16-30', label: '16-30 personas' },
    { value: '31-45', label: '31-45 personas' },
    { value: '46+', label: '46+ personas' }
  ]

  const equipmentFilters = [
    { value: 'all', label: 'Todo el equipamiento' },
    { value: 'basic', label: 'Básico (Proyector + Audio)' },
    { value: 'advanced', label: 'Avanzado (Smart Board)' },
    { value: 'lab', label: 'Laboratorio Especializado' },
    { value: 'workshop', label: 'Taller Técnico' }
  ]

  const availabilityFilters = [
    { value: 'all', label: 'Toda disponibilidad' },
    { value: 'available', label: 'Disponibles ahora' },
    { value: 'occupied', label: 'Ocupadas' },
    { value: 'maintenance', label: 'En mantenimiento' }
  ]

  const updateFilter = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  // Calculate utilization stats
  const calculateUtilization = () => {
    const totalClassrooms = classroomsData?.total || 0
    const totalSchedules = schedulesData?.total || 0
    const utilizationRate = totalClassrooms > 0 ? Math.min((totalSchedules / (totalClassrooms * 40)) * 100, 100) : 0

    return {
      available: Math.floor(totalClassrooms * 0.35),
      occupied: Math.floor(totalClassrooms * 0.45),
      maintenance: Math.floor(totalClassrooms * 0.05),
      reserved: Math.floor(totalClassrooms * 0.15),
      utilizationRate: Math.round(utilizationRate)
    }
  }

  const utilizationStats = calculateUtilization()

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
            <Building className="w-8 h-8 text-primary-600" />
            Infraestructura
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestión de sedes, edificios y espacios formativos - SENA CGMLTI
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant="success" className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            {utilizationStats.utilizationRate}% Utilización
          </Badge>
          
          <Button
            variant="outline"
            className="flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Análisis de Ocupación
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
                <p className="text-sm text-gray-600 dark:text-gray-400">Sedes Activas</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  3
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Building className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Edificios</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  12
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Home className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Espacios Formativos</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {classroomsData?.total || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <Users className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Capacidad Total</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {((classroomsData?.total || 0) * 30).toLocaleString('es-CO')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Infrastructure Modules */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {infrastructureModules.map((module, index) => {
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
                        Espacios disponibles:
                      </h4>
                      <div className="grid grid-cols-1 gap-2">
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
                        Distribución:
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {Object.entries(module.metrics).map(([key, value]) => (
                          <div key={key} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                            <span className="text-gray-600 dark:text-gray-400 capitalize">
                              {key === 'total_area' ? 'Área Total' :
                               key === 'administrative' ? 'Admin' :
                               key === 'academic' ? 'Académico' :
                               key === 'workshops' ? 'Talleres' :
                               key === 'services' ? 'Servicios' :
                               key === 'theory' ? 'Teoría' :
                               key === 'labs' ? 'Labs' :
                               key === 'virtual' ? 'Virtual' :
                               key}
                            </span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {value}
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

      {/* Advanced Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros por Capacidad y Equipamiento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Sede
                </label>
                <Select
                  value={filters.sede}
                  onValueChange={(value) => updateFilter('sede', value)}
                >
                  <option value="all">Todas las sedes</option>
                  <option value="principal">Sede Principal</option>
                  <option value="anexo">Sede Anexo</option>
                  <option value="satelite">Sede Satélite</option>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Edificio
                </label>
                <Select
                  value={filters.building}
                  onValueChange={(value) => updateFilter('building', value)}
                >
                  <option value="all">Todos los edificios</option>
                  <option value="admin">Administrativo</option>
                  <option value="academic">Académico A</option>
                  <option value="workshops">Talleres</option>
                  <option value="labs">Laboratorios</option>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Capacidad
                </label>
                <Select
                  value={filters.capacity}
                  onValueChange={(value) => updateFilter('capacity', value)}
                >
                  {capacityFilters.map((filter) => (
                    <option key={filter.value} value={filter.value}>
                      {filter.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Equipamiento
                </label>
                <Select
                  value={filters.equipment}
                  onValueChange={(value) => updateFilter('equipment', value)}
                >
                  {equipmentFilters.map((filter) => (
                    <option key={filter.value} value={filter.value}>
                      {filter.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Disponibilidad
                </label>
                <Select
                  value={filters.availability}
                  onValueChange={(value) => updateFilter('availability', value)}
                >
                  {availabilityFilters.map((filter) => (
                    <option key={filter.value} value={filter.value}>
                      {filter.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                Aplicar Filtros
              </Button>
              
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span>Resultados encontrados:</span>
                <Badge variant="secondary">
                  {Math.floor((classroomsData?.total || 0) * 0.8)} espacios
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Utilization Analysis */}
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
              Estado Actual de Espacios
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {utilizationStats.available}
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">
                  Disponibles
                </div>
              </div>

              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {utilizationStats.occupied}
                </div>
                <div className="text-sm text-blue-600 dark:text-blue-400">
                  En Uso
                </div>
              </div>

              <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                  {utilizationStats.maintenance}
                </div>
                <div className="text-sm text-orange-600 dark:text-orange-400">
                  Mantenimiento
                </div>
              </div>

              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {utilizationStats.reserved}
                </div>
                <div className="text-sm text-purple-600 dark:text-purple-400">
                  Reservados
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Tasa de Utilización</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {utilizationStats.utilizationRate}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-primary-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${utilizationStats.utilizationRate}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Equipamiento y Servicios
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <Monitor className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium">Proyectores/Smart Boards</span>
                </div>
                <Badge variant="success">85% Disponible</Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <Wifi className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium">Conectividad WiFi</span>
                </div>
                <Badge variant="success">100% Activa</Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm font-medium">Energía/Clima</span>
                </div>
                <Badge variant="success">98% Operativo</Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium">Equipos Especializados</span>
                </div>
                <Badge variant="warning">75% Disponible</Badge>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                Próximo Mantenimiento:
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span>Sistemas de Audio - 15 Agosto</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-green-500" />
                  <span>Equipos de Laboratorio - 20 Agosto</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <span>Sistemas HVAC - 25 Agosto</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}