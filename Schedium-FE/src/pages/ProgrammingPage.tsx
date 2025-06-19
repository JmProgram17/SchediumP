import { useState, useEffect } from 'react'
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
  LoadingSpinner
} from '@/design-system/components'
import { DragDropScheduleMatrix } from '@/features/scheduling/components/DragDropScheduleMatrix'
import { useScheduleList } from '@/features/schedule/hooks'
import { useInstructorList } from '@/features/instructor/hooks'
import { useProgramList } from '@/features/program/hooks'
import { useClassroomList } from '@/features/classroom/hooks'
import {
  Calendar,
  Filter,
  Users,
  Clock,
  MapPin,
  BookOpen,
  ChevronDown,
  RefreshCw,
  Settings,
  AlertCircle,
  CheckCircle,
  Save,
  Undo,
  Redo
} from 'lucide-react'

type FilterState = {
  trimester: string
  shift: string
  day: string
  instructor: string
  program: string
  classroom: string
}

export function ProgrammingPage() {
  const [filters, setFilters] = useState<FilterState>({
    trimester: 'all',
    shift: 'all',
    day: 'all',
    instructor: 'all',
    program: 'all',
    classroom: 'all'
  })
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week')
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [conflicts, setConflicts] = useState(0)

  // Data hooks
  const { data: schedulesData, isLoading: schedulesLoading } = useScheduleList()
  const { data: instructorsData, isLoading: instructorsLoading } = useInstructorList()
  const { data: programsData, isLoading: programsLoading } = useProgramList()
  const { data: classroomsData, isLoading: classroomsLoading } = useClassroomList()

  const isLoading = schedulesLoading || instructorsLoading || programsLoading || classroomsLoading

  // Get current trimester
  const getCurrentTrimester = () => {
    const month = new Date().getMonth() + 1
    if (month >= 1 && month <= 4) return '2024-1'
    if (month >= 5 && month <= 8) return '2024-2'
    return '2024-3'
  }

  const trimesters = [
    { value: 'all', label: 'Todos los trimestres' },
    { value: '2024-1', label: 'Primer Trimestre 2024' },
    { value: '2024-2', label: 'Segundo Trimestre 2024' },
    { value: '2024-3', label: 'Tercer Trimestre 2024' }
  ]

  const shifts = [
    { value: 'all', label: 'Todas las jornadas' },
    { value: 'morning', label: 'Mañana (6:00 - 12:00)' },
    { value: 'afternoon', label: 'Tarde (12:00 - 18:00)' },
    { value: 'night', label: 'Noche (18:00 - 22:00)' },
    { value: 'mixed', label: 'Mixta' }
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

  const updateFilter = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearAllFilters = () => {
    setFilters({
      trimester: getCurrentTrimester(),
      shift: 'all',
      day: 'all',
      instructor: 'all',
      program: 'all',
      classroom: 'all'
    })
  }

  const formatWeekDate = (date: Date) => {
    const startOfWeek = new Date(date)
    startOfWeek.setDate(date.getDate() - date.getDay() + 1) // Start on Monday
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 5) // End on Saturday

    return `${startOfWeek.toLocaleDateString('es-CO', { 
      day: 'numeric', 
      month: 'short' 
    })} - ${endOfWeek.toLocaleDateString('es-CO', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    })}`
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeek)
    newDate.setDate(currentWeek.getDate() + (direction === 'next' ? 7 : -7))
    setCurrentWeek(newDate)
  }

  const goToCurrentWeek = () => {
    setCurrentWeek(new Date())
  }

  useEffect(() => {
    // Initialize with current trimester
    setFilters(prev => ({ ...prev, trimester: getCurrentTrimester() }))
  }, [])

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
            <Calendar className="w-8 h-8 text-primary-600" />
            Programación de Horarios
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestión interactiva de la programación académica - SENA CGMLTI
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {hasUnsavedChanges && (
            <Badge variant="warning" className="flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Cambios sin guardar
            </Badge>
          )}
          {conflicts > 0 && (
            <Badge variant="error" className="flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {conflicts} conflictos
            </Badge>
          )}
          <Badge variant="success" className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Sistema activo
          </Badge>
        </div>
      </motion.div>

      {/* Filters Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filtros Avanzados
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              >
                <ChevronDown 
                  className={`w-4 h-4 transition-transform ${isFiltersOpen ? 'rotate-180' : ''}`} 
                />
              </Button>
            </div>
          </CardHeader>
          
          {isFiltersOpen && (
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
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
                    Instructor
                  </label>
                  <Select
                    value={filters.instructor}
                    onValueChange={(value) => updateFilter('instructor', value)}
                  >
                    <option value="all">Todos los instructores</option>
                    {instructorsData?.items?.map((instructor) => (
                      <option key={instructor.id} value={instructor.id}>
                        {instructor.first_name} {instructor.last_name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Programa
                  </label>
                  <Select
                    value={filters.program}
                    onValueChange={(value) => updateFilter('program', value)}
                  >
                    <option value="all">Todos los programas</option>
                    {programsData?.items?.map((program) => (
                      <option key={program.id} value={program.id}>
                        {program.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Aula
                  </label>
                  <Select
                    value={filters.classroom}
                    onValueChange={(value) => updateFilter('classroom', value)}
                  >
                    <option value="all">Todas las aulas</option>
                    {classroomsData?.items?.map((classroom) => (
                      <option key={classroom.id} value={classroom.id}>
                        {classroom.name} - {classroom.building?.name}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Limpiar Filtros
                </Button>
                
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span>Filtros activos:</span>
                  <Badge variant="secondary">
                    {Object.values(filters).filter(val => val !== 'all').length}
                  </Badge>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      </motion.div>

      {/* Week Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateWeek('prev')}
                >
                  &#8592; Semana Anterior
                </Button>
                
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {formatWeekDate(currentWeek)}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Semana {Math.ceil((currentWeek.getTime() - new Date(currentWeek.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))}
                  </p>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateWeek('next')}
                >
                  Semana Siguiente &#8594;
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToCurrentWeek}
                  className="flex items-center gap-2"
                >
                  <Clock className="w-4 h-4" />
                  Hoy
                </Button>
                
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                  <Button
                    variant={viewMode === 'week' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('week')}
                  >
                    Semana
                  </Button>
                  <Button
                    variant={viewMode === 'day' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('day')}
                  >
                    Día
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Instructores</p>
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
                <BookOpen className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Programas</p>
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
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <MapPin className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Aulas</p>
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
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
                <Calendar className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Horarios</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {schedulesData?.total || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            className="flex items-center gap-2"
            disabled={!hasUnsavedChanges}
          >
            <Save className="w-4 h-4" />
            Guardar Cambios
          </Button>
          
          <Button
            variant="outline"
            className="flex items-center gap-2"
          >
            <Undo className="w-4 h-4" />
            Deshacer
          </Button>
          
          <Button
            variant="outline"
            className="flex items-center gap-2"
          >
            <Redo className="w-4 h-4" />
            Rehacer
          </Button>
        </div>

        <Button
          variant="ghost"
          className="flex items-center gap-2"
        >
          <Settings className="w-4 h-4" />
          Configuración
        </Button>
      </motion.div>

      {/* Schedule Matrix */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardContent className="p-0">
            <DragDropScheduleMatrix
              schedules={schedulesData?.items || []}
              onScheduleUpdate={(schedule) => {
                setHasUnsavedChanges(true)
                // Handle schedule update
              }}
              onConflictDetected={(conflictCount) => {
                setConflicts(conflictCount)
              }}
              filters={{
                instructorId: filters.instructor !== 'all' ? filters.instructor : undefined,
                programId: filters.program !== 'all' ? filters.program : undefined,
                classroomId: filters.classroom !== 'all' ? filters.classroom : undefined,
                day: filters.day !== 'all' ? filters.day : undefined,
                shift: filters.shift !== 'all' ? filters.shift : undefined
              }}
              viewMode={viewMode}
              currentWeek={currentWeek}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
              Instrucciones de Uso
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>Haz clic en una celda vacía para crear un nuevo horario</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>Arrastra los horarios existentes para reprogramarlos</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>Los conflictos se detectan automáticamente</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>Usa los filtros para encontrar horarios específicos</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}