import { useState, memo, useMemo, useCallback } from 'react'
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
  Checkbox,
  LoadingSpinner
} from '@/design-system/components'
import { useInstructorList } from '@/features/instructor/hooks'
import { useScheduleList } from '@/features/schedule/hooks'
import { useClassroomList } from '@/features/classroom/hooks'
import { useProgramList } from '@/features/program/hooks'
import {
  FileText,
  Download,
  Eye,
  Filter,
  Calendar,
  BarChart3,
  Users,
  Clock,
  MapPin,
  Building,
  Printer,
  Mail,
  Settings,
  RefreshCw,
  FileSpreadsheet,
  FileImage,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

type ReportType = 'schedule-matrix' | 'instructor-workload' | 'classroom-usage' | 'program-statistics' | 'attendance-summary'
type ExportFormat = 'pdf' | 'excel' | 'csv' | 'png'

function InformesPage() {
  const [selectedReport, setSelectedReport] = useState<ReportType>('schedule-matrix')
  const [isGenerating, setIsGenerating] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [filters, setFilters] = useState({
    trimester: '2024-2',
    sede: 'all',
    department: 'all',
    dateRange: 'current-week',
    includeConflicts: true,
    includeEmptySlots: false,
    groupByProgram: true
  })

  // Data hooks - Load only when needed for specific reports
  const { data: instructorsData, isLoading: instructorsLoading } = useInstructorList(
    { limit: 50 },
    { enabled: selectedReport === 'instructor-workload' }
  )
  const { data: schedulesData, isLoading: schedulesLoading } = useScheduleList(
    {},
    { enabled: selectedReport === 'schedule-matrix' || selectedReport === 'attendance-summary' }
  )
  const { data: classroomsData, isLoading: classroomsLoading } = useClassroomList(
    { limit: 50 },
    { enabled: selectedReport === 'classroom-usage' }
  )
  const { data: programsData, isLoading: programsLoading } = useProgramList(
    { limit: 50 },
    { enabled: selectedReport === 'program-statistics' }
  )

  const isLoading = (
    (selectedReport === 'instructor-workload' && instructorsLoading) ||
    (selectedReport === 'classroom-usage' && classroomsLoading) ||
    (selectedReport === 'program-statistics' && programsLoading) ||
    ((selectedReport === 'schedule-matrix' || selectedReport === 'attendance-summary') && schedulesLoading)
  )

  const reportTypes = useMemo(() => [
    {
      id: 'schedule-matrix',
      title: 'Matriz de Horarios',
      description: 'Visualización completa de la programación académica por semana',
      icon: Calendar,
      estimatedTime: '2-3 min',
      features: ['Vista semanal', 'Filtros por sede', 'Detección de conflictos']
    },
    {
      id: 'instructor-workload',
      title: 'Carga de Instructores',
      description: 'Análisis detallado de horas asignadas por instructor y departamento',
      icon: Users,
      estimatedTime: '1-2 min',
      features: ['Horas por instructor', 'Distribución semanal', 'Estadísticas comparativas']
    },
    {
      id: 'classroom-usage',
      title: 'Utilización de Aulas',
      description: 'Reporte de ocupación y disponibilidad de espacios físicos',
      icon: MapPin,
      estimatedTime: '1-2 min',
      features: ['Ocupación por aula', 'Horarios disponibles', 'Capacidad vs uso']
    },
    {
      id: 'program-statistics',
      title: 'Estadísticas de Programas',
      description: 'Métricas académicas por programa formativo y nivel',
      icon: BarChart3,
      estimatedTime: '2-4 min',
      features: ['Estudiantes por programa', 'Horas lectivas', 'Progreso académico']
    },
    {
      id: 'attendance-summary',
      title: 'Resumen de Asistencia',
      description: 'Consolidado de asistencia por fichas y competencias',
      icon: CheckCircle,
      estimatedTime: '3-5 min',
      features: ['Asistencia por ficha', 'Estadísticas semanales', 'Alertas de inasistencia']
    }
  ], [])

  const exportFormats = useMemo(() => [
    { value: 'pdf', label: 'PDF', icon: FileText, description: 'Documento imprimible' },
    { value: 'excel', label: 'Excel', icon: FileSpreadsheet, description: 'Hoja de cálculo' },
    { value: 'csv', label: 'CSV', icon: FileText, description: 'Datos separados por comas' },
    { value: 'png', label: 'Imagen PNG', icon: FileImage, description: 'Imagen de alta calidad' }
  ], [])

  const trimesters = useMemo(() => [
    { value: '2024-1', label: 'Primer Trimestre 2024' },
    { value: '2024-2', label: 'Segundo Trimestre 2024' },
    { value: '2024-3', label: 'Tercer Trimestre 2024' }
  ], [])

  const sedes = useMemo(() => [
    { value: 'all', label: 'Todas las sedes' },
    { value: 'principal', label: 'Sede Principal' },
    { value: 'anexo', label: 'Sede Anexo' },
    { value: 'satelite', label: 'Sede Satélite' }
  ], [])

  const dateRanges = useMemo(() => [
    { value: 'current-week', label: 'Semana actual' },
    { value: 'current-month', label: 'Mes actual' },
    { value: 'current-trimester', label: 'Trimestre actual' },
    { value: 'custom', label: 'Rango personalizado' }
  ], [])

  const updateFilter = useCallback((key: string, value: string | boolean) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const generateReport = useCallback(async (format: ExportFormat) => {
    setIsGenerating(true)
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsGenerating(false)
    
    // Simulate download
    console.log(`Generating ${selectedReport} report in ${format} format`)
  }, [selectedReport])

  const previewReport = useCallback(() => {
    setShowPreview(true)
  }, [])

  const scheduleReport = useCallback(() => {
    // Schedule report functionality
    console.log('Scheduling report for regular generation')
  }, [])

  // Show interface immediately with progressive loading
  const showLoadingForReport = isLoading && isGenerating

  const selectedReportData = reportTypes.find(r => r.id === selectedReport)

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
            <FileText className="w-8 h-8 text-primary-600" />
            Informes
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Generación de reportes académicos y administrativos - SENA CGMLTI
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Último reporte: Hace 2 horas
          </Badge>
          
          <Button
            variant="outline"
            onClick={scheduleReport}
            className="flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            Programar
          </Button>
        </div>
      </motion.div>

      {/* Report Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Selección de Reporte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reportTypes.map((report) => {
                const IconComponent = report.icon
                return (
                  <motion.div
                    key={report.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      className={`cursor-pointer transition-all duration-200 ${
                        selectedReport === report.id
                          ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => setSelectedReport(report.id as ReportType)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
                            <IconComponent className="w-5 h-5 text-primary-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                              {report.title}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              {report.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <Badge variant="secondary" size="sm">
                                {report.estimatedTime}
                              </Badge>
                              {selectedReport === report.id && (
                                <CheckCircle className="w-4 h-4 text-primary-600" />
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                          <div className="flex flex-wrap gap-1">
                            {report.features.map((feature, index) => (
                              <span
                                key={index}
                                className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded"
                              >
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters Configuration */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Filters */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Configuración de Filtros
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    Sede
                  </label>
                  <Select
                    value={filters.sede}
                    onValueChange={(value) => updateFilter('sede', value)}
                  >
                    {sedes.map((sede) => (
                      <option key={sede.value} value={sede.value}>
                        {sede.label}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Rango de Fechas
                  </label>
                  <Select
                    value={filters.dateRange}
                    onValueChange={(value) => updateFilter('dateRange', value)}
                  >
                    {dateRanges.map((range) => (
                      <option key={range.value} value={range.value}>
                        {range.label}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Departamento
                  </label>
                  <Select
                    value={filters.department}
                    onValueChange={(value) => updateFilter('department', value)}
                  >
                    <option value="all">Todos los departamentos</option>
                    <option value="tecnologia">Tecnología</option>
                    <option value="gestion">Gestión Empresarial</option>
                    <option value="salud">Salud</option>
                    <option value="agropecuario">Agropecuario</option>
                  </Select>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Opciones Adicionales
                </h4>
                
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <Checkbox
                      checked={filters.includeConflicts}
                      onCheckedChange={(checked) => updateFilter('includeConflicts', checked)}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Incluir detección de conflictos
                    </span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <Checkbox
                      checked={filters.includeEmptySlots}
                      onCheckedChange={(checked) => updateFilter('includeEmptySlots', checked)}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Mostrar espacios vacíos
                    </span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <Checkbox
                      checked={filters.groupByProgram}
                      onCheckedChange={(checked) => updateFilter('groupByProgram', checked)}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Agrupar por programa formativo
                    </span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Report Summary */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Resumen del Reporte
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedReportData && (
                <>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
                      <selectedReportData.icon className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {selectedReportData.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedReportData.estimatedTime}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h5 className="font-medium text-gray-900 dark:text-gray-100">
                      Datos Incluidos:
                    </h5>
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{instructorsData?.total || 0} Instructores</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{schedulesData?.total || 0} Horarios</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{classroomsData?.total || 0} Aulas</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        <span>{programsData?.total || 0} Programas</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      onClick={previewReport}
                      variant="outline"
                      className="w-full flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Vista Previa
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Export Options */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Opciones de Exportación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {exportFormats.map((format) => {
                const IconComponent = format.icon
                return (
                  <motion.div
                    key={format.value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                            <IconComponent className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">
                              {format.label}
                            </h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {format.description}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => generateReport(format.value as ExportFormat)}
                            disabled={isGenerating}
                            className="w-full"
                          >
                            {isGenerating ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Download className="w-4 h-4 mr-1" />
                                Generar
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Preview Modal */}
      {showPreview && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowPreview(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Vista Previa: {selectedReportData?.title}
                </h3>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Printer className="w-4 h-4 mr-1" />
                    Imprimir
                  </Button>
                  <Button variant="outline" size="sm">
                    <Mail className="w-4 h-4 mr-1" />
                    Enviar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPreview(false)}
                  >
                    ✕
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-8 text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Vista Previa del Reporte
                </h4>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Aquí se mostraría la vista previa del reporte {selectedReportData?.title.toLowerCase()}
                  con los filtros aplicados y formato seleccionado.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                    <div className="font-medium">Trimestre</div>
                    <div className="text-gray-600 dark:text-gray-400">{filters.trimester}</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                    <div className="font-medium">Sede</div>
                    <div className="text-gray-600 dark:text-gray-400">{filters.sede}</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                    <div className="font-medium">Fecha</div>
                    <div className="text-gray-600 dark:text-gray-400">{filters.dateRange}</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

export default memo(InformesPage)