import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Select,
  Input,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  LoadingSpinner
} from '@/design-system/components'
import { useInstructorList } from '@/features/instructor/hooks'
import { useScheduleList } from '@/features/schedule/hooks'
import { useClassroomList } from '@/features/classroom/hooks'
import { useStudentList } from '@/features/student/hooks'
import {
  Search,
  Filter,
  Users,
  Clock,
  MapPin,
  Calendar,
  BarChart3,
  Download,
  Eye,
  User,
  Building,
  GraduationCap,
  BookOpen,
  Grid3x3
} from 'lucide-react'

type ViewMode = 'calendar' | 'table'

export function ConsultasPage() {
  const [activeTab, setActiveTab] = useState('instructor-schedule')
  const [viewMode, setViewMode] = useState<ViewMode>('calendar')
  const [filters, setFilters] = useState({
    instructor: '',
    ficha: '',
    trimester: '2024-2',
    shift: 'all',
    day: 'all',
    classroom: '',
    building: ''
  })

  // Data hooks
  const { data: instructorsData, isLoading: instructorsLoading } = useInstructorList()
  const { data: schedulesData, isLoading: schedulesLoading } = useScheduleList()
  const { data: classroomsData, isLoading: classroomsLoading } = useClassroomList()
  const { data: studentsData, isLoading: studentsLoading } = useStudentList()

  const isLoading = instructorsLoading || schedulesLoading || classroomsLoading || studentsLoading

  const trimesters = [
    { value: '2024-1', label: 'Primer Trimestre 2024' },
    { value: '2024-2', label: 'Segundo Trimestre 2024' },
    { value: '2024-3', label: 'Tercer Trimestre 2024' }
  ]

  const shifts = [
    { value: 'all', label: 'Todas las jornadas' },
    { value: 'morning', label: 'Mañana (6:00 - 12:00)' },
    { value: 'afternoon', label: 'Tarde (12:00 - 18:00)' },
    { value: 'night', label: 'Noche (18:00 - 22:00)' }
  ]

  const days = [
    { value: 'all', label: 'Todos los días' },
    { value: 'monday', label: 'Lunes' },
    { value: 'tuesday', label: 'Martes' },
    { value: 'wednesday', label: 'Miércoles' },
    { value: 'thursday', label: 'Jueves' },
    { value: 'friday', label: 'Viernes' },
    { value: 'saturday', label: 'Sábado' }
  ]

  const updateFilter = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const exportData = () => {
    // Export functionality
    console.log('Exporting data for:', activeTab)
  }

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
            <Search className="w-8 h-8 text-primary-600" />
            Consultas
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Consulta de horarios, disponibilidad y carga académica - SENA CGMLTI
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <Button
              variant={viewMode === 'calendar' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
            >
              <Calendar className="w-4 h-4 mr-1" />
              Calendario
            </Button>
            <Button
              variant={viewMode === 'table' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              <Grid3x3 className="w-4 h-4 mr-1" />
              Tabla
            </Button>
          </div>
          
          <Button
            variant="outline"
            onClick={exportData}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar
          </Button>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-1 md:grid-cols-4 gap-2 h-auto p-2">
            <TabsTrigger 
              value="instructor-schedule"
              className="flex items-center gap-2 py-3"
            >
              <GraduationCap className="w-4 h-4" />
              Horario de Instructores
            </TabsTrigger>
            <TabsTrigger 
              value="ficha-schedule"
              className="flex items-center gap-2 py-3"
            >
              <Users className="w-4 h-4" />
              Horario de Fichas
            </TabsTrigger>
            <TabsTrigger 
              value="classroom-availability"
              className="flex items-center gap-2 py-3"
            >
              <MapPin className="w-4 h-4" />
              Disponibilidad de Aulas
            </TabsTrigger>
            <TabsTrigger 
              value="instructor-workload"
              className="flex items-center gap-2 py-3"
            >
              <BarChart3 className="w-4 h-4" />
              Carga Horaria
            </TabsTrigger>
          </TabsList>

          {/* Instructor Schedule Tab */}
          <TabsContent value="instructor-schedule" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  Consulta de Horarios de Instructores
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Instructor
                    </label>
                    <Select
                      value={filters.instructor}
                      onValueChange={(value) => updateFilter('instructor', value)}
                      placeholder="Seleccionar instructor"
                    >
                      <option value="">Todos los instructores</option>
                      {instructorsData?.items?.map((instructor) => (
                        <option key={instructor.id} value={instructor.id}>
                          {instructor.first_name} {instructor.last_name}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Jornada
                    </label>
                    <Select
                      value={filters.shift}
                      onValueChange={(value) => updateFilter('shift', value)}
                    >
                      {shifts.map((shift) => (
                        <option key={shift.value} value={shift.value}>
                          {shift.label}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Trimestre
                    </label>
                    <Select
                      value={filters.trimester}
                      onValueChange={(value) => updateFilter('trimester', value)}
                    >
                      {trimesters.map((trimester) => (
                        <option key={trimester.value} value={trimester.value}>
                          {trimester.label}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button className="w-full">
                      <Search className="w-4 h-4 mr-2" />
                      Consultar
                    </Button>
                  </div>
                </div>

                {/* Results */}
                <div className="space-y-4">
                  {viewMode === 'calendar' ? (
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                      <div className="text-center py-12">
                        <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                          Vista de Calendario
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          Selecciona un instructor para ver su horario en formato calendario
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border border-gray-200 dark:border-gray-700 rounded-lg">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-gray-100">
                              Instructor
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-gray-100">
                              Día
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-gray-100">
                              Hora
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-gray-100">
                              Competencia
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-gray-100">
                              Ficha
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-gray-100">
                              Aula
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {schedulesData?.items?.slice(0, 5).map((schedule, index) => (
                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                              <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                {schedule.instructor?.first_name} {schedule.instructor?.last_name}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                {schedule.day_of_week}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                {schedule.start_time} - {schedule.end_time}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                {schedule.course?.name}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                {schedule.group?.name}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                {schedule.classroom?.name}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ficha Schedule Tab */}
          <TabsContent value="ficha-schedule" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Consulta de Horarios de Fichas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Número de Ficha
                    </label>
                    <Input
                      placeholder="Ej: 2786041"
                      value={filters.ficha}
                      onChange={(e) => updateFilter('ficha', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Jornada
                    </label>
                    <Select
                      value={filters.shift}
                      onValueChange={(value) => updateFilter('shift', value)}
                    >
                      {shifts.map((shift) => (
                        <option key={shift.value} value={shift.value}>
                          {shift.label}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button className="w-full">
                      <Search className="w-4 h-4 mr-2" />
                      Buscar Ficha
                    </Button>
                  </div>
                </div>

                {/* Results */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Horario Detallado de Ficha
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Ingresa el número de ficha para ver el horario completo de los aprendices
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Classroom Availability Tab */}
          <TabsContent value="classroom-availability" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Consulta de Disponibilidad de Aulas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Día
                    </label>
                    <Select
                      value={filters.day}
                      onValueChange={(value) => updateFilter('day', value)}
                    >
                      {days.map((day) => (
                        <option key={day.value} value={day.value}>
                          {day.label}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Bloque Horario
                    </label>
                    <Select
                      value={filters.shift}
                      onValueChange={(value) => updateFilter('shift', value)}
                    >
                      <option value="all">Todos los bloques</option>
                      <option value="6-8">06:00 - 08:00</option>
                      <option value="8-10">08:00 - 10:00</option>
                      <option value="10-12">10:00 - 12:00</option>
                      <option value="12-14">12:00 - 14:00</option>
                      <option value="14-16">14:00 - 16:00</option>
                      <option value="16-18">16:00 - 18:00</option>
                      <option value="18-20">18:00 - 20:00</option>
                      <option value="20-22">20:00 - 22:00</option>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Sede
                    </label>
                    <Select
                      value={filters.building}
                      onValueChange={(value) => updateFilter('building', value)}
                    >
                      <option value="">Todas las sedes</option>
                      <option value="principal">Sede Principal</option>
                      <option value="anexo">Sede Anexo</option>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button className="w-full">
                      <Search className="w-4 h-4 mr-2" />
                      Consultar
                    </Button>
                  </div>
                </div>

                {/* Availability Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {classroomsData?.items?.slice(0, 6).map((classroom) => (
                    <Card key={classroom.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">
                            {classroom.name}
                          </h4>
                          <Badge variant="success">Disponible</Badge>
                        </div>
                        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4" />
                            <span>{classroom.building?.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <span>Capacidad: {classroom.capacity} personas</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>Disponible: 06:00 - 18:00</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Instructor Workload Tab */}
          <TabsContent value="instructor-workload" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Consulta de Carga Horaria de Instructores
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {instructorsData?.total || 0}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Total Instructores
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          32
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Horas Promedio
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          85%
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Utilización
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          40
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Horas Máximo
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Workload Chart Placeholder */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <div className="text-center py-12">
                    <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Gráfico de Barras: Carga Horaria
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Visualización de horas asignadas vs. disponibles por instructor
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}