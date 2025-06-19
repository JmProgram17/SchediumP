/**
 * TemplateLibrary Component - Pre-built report templates gallery
 * Academic report templates with customization options
 */

import React, { useState, useCallback, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { ReportTemplate } from '../../hooks/useReportBuilder'

interface TemplateLibraryProps {
  onSelectTemplate?: (template: ReportTemplate) => void
  onCreateFromTemplate?: (templateId: string) => void
  onClose?: () => void
  className?: string
}

interface TemplateCardProps {
  template: ReportTemplate
  onSelect: (template: ReportTemplate) => void
  onPreview: (template: ReportTemplate) => void
  isSelected?: boolean
}

// Pre-built academic templates
const ACADEMIC_TEMPLATES: ReportTemplate[] = [
  {
    id: 'academic-schedule-summary',
    name: 'Resumen de Horarios Académicos',
    description: 'Reporte completo de horarios por programa académico con estadísticas de utilización de aulas e instructores.',
    category: 'academic',
    thumbnail: '/templates/schedule-summary.png',
    config: {
      pageSize: 'A4',
      orientation: 'landscape',
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
      header: { enabled: true, content: 'Resumen de Horarios Académicos - {{semester}}', height: 50 },
      footer: { enabled: true, content: 'Generado el {{date}} | Página {{page}} de {{totalPages}}', height: 30 }
    },
    visualizations: [
      {
        id: 'schedule-overview-table',
        type: 'table',
        title: 'Horarios por Programa',
        position: { x: 20, y: 80, width: 800, height: 300 },
        config: {
          columns: ['program_name', 'schedule_title', 'instructor_name', 'classroom_name', 'schedule_day', 'schedule_start_time', 'schedule_duration'],
          pagination: true,
          rowsPerPage: 20,
          sorting: [{ field: 'program_name', direction: 'asc' }],
          showTitle: true
        },
        dataSource: 'schedules',
        fields: ['program_name', 'schedule_title', 'instructor_name', 'classroom_name', 'schedule_day', 'schedule_start_time', 'schedule_duration']
      },
      {
        id: 'classroom-utilization-chart',
        type: 'chart',
        title: 'Utilización de Aulas',
        position: { x: 20, y: 400, width: 380, height: 250 },
        config: {
          chartType: 'bar',
          xAxis: 'classroom_name',
          yAxis: ['classroom_capacity'],
          showLegend: true,
          showGrid: true,
          colorScheme: ['#3B82F6', '#EF4444', '#10B981']
        },
        dataSource: 'schedules',
        fields: ['classroom_name', 'classroom_capacity']
      },
      {
        id: 'instructor-workload-chart',
        type: 'chart',
        title: 'Carga de Trabajo por Instructor',
        position: { x: 420, y: 400, width: 380, height: 250 },
        config: {
          chartType: 'pie',
          xAxis: 'instructor_name',
          yAxis: ['schedule_duration'],
          showLegend: true,
          colorScheme: ['#8B5CF6', '#F59E0B', '#EF4444', '#10B981']
        },
        dataSource: 'schedules',
        fields: ['instructor_name', 'schedule_duration']
      }
    ],
    globalFilters: [],
    permissions: { canView: ['*'], canEdit: ['administrator', 'coordinator'], canDelete: ['administrator'], isPublic: true },
    metadata: {
      createdBy: 'system',
      createdAt: '2024-01-01T00:00:00Z',
      lastModified: '2024-01-01T00:00:00Z',
      version: 1,
      tags: ['académico', 'horarios', 'resumen', 'estadísticas']
    }
  },
  {
    id: 'conflict-analysis-report',
    name: 'Análisis de Conflictos',
    description: 'Reporte detallado de conflictos de horarios con análisis de patrones y recomendaciones de resolución.',
    category: 'operational',
    thumbnail: '/templates/conflict-analysis.png',
    config: {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { top: 25, right: 20, bottom: 25, left: 20 },
      header: { enabled: true, content: 'Análisis de Conflictos de Horarios', height: 60 },
      footer: { enabled: true, content: 'Confidencial - Solo para uso interno', height: 30 }
    },
    visualizations: [
      {
        id: 'conflict-summary-metrics',
        type: 'metric',
        title: 'Total de Conflictos',
        position: { x: 20, y: 80, width: 180, height: 120 },
        config: {
          primaryMetric: 'conflict_count',
          format: 'number',
          showTitle: true
        },
        dataSource: 'conflicts',
        fields: ['conflict_count']
      },
      {
        id: 'conflict-severity-chart',
        type: 'chart',
        title: 'Conflictos por Severidad',
        position: { x: 220, y: 80, width: 300, height: 200 },
        config: {
          chartType: 'pie',
          xAxis: 'conflict_severity',
          yAxis: ['conflict_count'],
          showLegend: true,
          colorScheme: ['#EF4444', '#F59E0B', '#10B981']
        },
        dataSource: 'conflicts',
        fields: ['conflict_severity', 'conflict_count']
      },
      {
        id: 'conflict-types-table',
        type: 'table',
        title: 'Detalle de Conflictos por Tipo',
        position: { x: 20, y: 300, width: 500, height: 250 },
        config: {
          columns: ['conflict_type', 'conflict_severity', 'conflict_count', 'resolution_time'],
          pagination: false,
          sorting: [{ field: 'conflict_count', direction: 'desc' }]
        },
        dataSource: 'conflicts',
        fields: ['conflict_type', 'conflict_severity', 'conflict_count', 'resolution_time']
      },
      {
        id: 'resolution-time-trend',
        type: 'chart',
        title: 'Tendencia de Tiempo de Resolución',
        position: { x: 20, y: 570, width: 500, height: 200 },
        config: {
          chartType: 'line',
          xAxis: 'conflict_type',
          yAxis: ['resolution_time'],
          showGrid: true,
          colorScheme: ['#3B82F6']
        },
        dataSource: 'conflicts',
        fields: ['conflict_type', 'resolution_time']
      }
    ],
    globalFilters: [
      {
        id: 'severity-filter',
        field: 'conflict_severity',
        operator: 'in',
        values: ['high', 'medium', 'low'],
        dataType: 'string',
        label: 'Severidad'
      }
    ],
    permissions: { canView: ['administrator', 'coordinator'], canEdit: ['administrator'], canDelete: ['administrator'], isPublic: false },
    metadata: {
      createdBy: 'system',
      createdAt: '2024-01-01T00:00:00Z',
      lastModified: '2024-01-01T00:00:00Z',
      version: 1,
      tags: ['conflictos', 'análisis', 'operacional', 'resolución']
    }
  },
  {
    id: 'usage-analytics-dashboard',
    name: 'Dashboard de Analíticas de Uso',
    description: 'Métricas de uso del sistema con indicadores de rendimiento y patrones de actividad de usuarios.',
    category: 'administrative',
    thumbnail: '/templates/usage-analytics.png',
    config: {
      pageSize: 'A3',
      orientation: 'landscape',
      margins: { top: 15, right: 15, bottom: 15, left: 15 },
      header: { enabled: true, content: 'Dashboard de Analíticas de Uso del Sistema', height: 40 }
    },
    visualizations: [
      {
        id: 'active-users-metric',
        type: 'metric',
        title: 'Usuarios Activos',
        position: { x: 20, y: 60, width: 200, height: 100 },
        config: {
          primaryMetric: 'active_users',
          comparisonMetric: 'previous_period',
          format: 'number'
        },
        dataSource: 'usage',
        fields: ['active_users']
      },
      {
        id: 'session-duration-metric',
        type: 'metric',
        title: 'Duración Promedio de Sesión',
        position: { x: 240, y: 60, width: 200, height: 100 },
        config: {
          primaryMetric: 'session_duration',
          format: 'time'
        },
        dataSource: 'usage',
        fields: ['session_duration']
      },
      {
        id: 'page-views-metric',
        type: 'metric',
        title: 'Vistas de Página Totales',
        position: { x: 460, y: 60, width: 200, height: 100 },
        config: {
          primaryMetric: 'page_views',
          format: 'number'
        },
        dataSource: 'usage',
        fields: ['page_views']
      },
      {
        id: 'usage-trends-chart',
        type: 'chart',
        title: 'Tendencias de Uso Semanal',
        position: { x: 20, y: 180, width: 800, height: 300 },
        config: {
          chartType: 'area',
          showGrid: true,
          colorScheme: ['#3B82F6', '#10B981', '#F59E0B']
        },
        dataSource: 'usage',
        fields: ['active_users', 'session_duration', 'page_views']
      },
      {
        id: 'feature-usage-chart',
        type: 'chart',
        title: 'Uso de Funcionalidades',
        position: { x: 20, y: 500, width: 400, height: 250 },
        config: {
          chartType: 'bar',
          showLegend: true,
          colorScheme: ['#8B5CF6', '#EC4899', '#F59E0B']
        },
        dataSource: 'usage',
        fields: ['page_views']
      },
      {
        id: 'performance-indicators',
        type: 'table',
        title: 'Indicadores de Rendimiento',
        position: { x: 440, y: 500, width: 380, height: 250 },
        config: {
          pagination: false,
          showTitle: true
        },
        dataSource: 'usage',
        fields: ['active_users', 'session_duration', 'page_views']
      }
    ],
    globalFilters: [
      {
        id: 'date-range',
        field: 'date',
        operator: 'between',
        dataType: 'date',
        label: 'Rango de Fechas'
      }
    ],
    permissions: { canView: ['administrator'], canEdit: ['administrator'], canDelete: ['administrator'], isPublic: false },
    metadata: {
      createdBy: 'system',
      createdAt: '2024-01-01T00:00:00Z',
      lastModified: '2024-01-01T00:00:00Z',
      version: 1,
      tags: ['analytics', 'uso', 'rendimiento', 'métricas', 'dashboard']
    }
  },
  {
    id: 'instructor-performance-report',
    name: 'Reporte de Desempeño de Instructores',
    description: 'Análisis detallado del desempeño y carga de trabajo de instructores con métricas de eficiencia.',
    category: 'academic',
    thumbnail: '/templates/instructor-performance.png',
    config: {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
      header: { enabled: true, content: 'Reporte de Desempeño de Instructores - {{period}}', height: 50 }
    },
    visualizations: [
      {
        id: 'instructor-summary-table',
        type: 'table',
        title: 'Resumen por Instructor',
        position: { x: 20, y: 70, width: 550, height: 300 },
        config: {
          columns: ['instructor_name', 'schedule_duration', 'group_size', 'classroom_capacity'],
          pagination: true,
          rowsPerPage: 15,
          sorting: [{ field: 'schedule_duration', direction: 'desc' }]
        },
        dataSource: 'schedules',
        fields: ['instructor_name', 'schedule_duration', 'group_size', 'classroom_capacity']
      },
      {
        id: 'workload-distribution',
        type: 'chart',
        title: 'Distribución de Carga de Trabajo',
        position: { x: 20, y: 390, width: 270, height: 200 },
        config: {
          chartType: 'bar',
          xAxis: 'instructor_name',
          yAxis: ['schedule_duration'],
          colorScheme: ['#3B82F6']
        },
        dataSource: 'schedules',
        fields: ['instructor_name', 'schedule_duration']
      },
      {
        id: 'student-capacity-chart',
        type: 'chart',
        title: 'Capacidad de Estudiantes',
        position: { x: 300, y: 390, width: 270, height: 200 },
        config: {
          chartType: 'scatter',
          xAxis: 'group_size',
          yAxis: ['classroom_capacity'],
          colorScheme: ['#10B981']
        },
        dataSource: 'schedules',
        fields: ['group_size', 'classroom_capacity']
      }
    ],
    globalFilters: [
      {
        id: 'instructor-filter',
        field: 'instructor_name',
        operator: 'contains',
        dataType: 'string',
        label: 'Instructor'
      }
    ],
    permissions: { canView: ['administrator', 'coordinator'], canEdit: ['administrator'], canDelete: ['administrator'], isPublic: false },
    metadata: {
      createdBy: 'system',
      createdAt: '2024-01-01T00:00:00Z',
      lastModified: '2024-01-01T00:00:00Z',
      version: 1,
      tags: ['instructores', 'desempeño', 'académico', 'carga', 'trabajo']
    }
  },
  {
    id: 'financial-summary-report',
    name: 'Resumen Financiero Académico',
    description: 'Reporte financiero con costos de operación, utilización de recursos y análisis de eficiencia.',
    category: 'financial',
    thumbnail: '/templates/financial-summary.png',
    config: {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { top: 25, right: 20, bottom: 25, left: 20 },
      header: { enabled: true, content: 'Resumen Financiero - Período {{period}}', height: 60 },
      footer: { enabled: true, content: 'Confidencial - Información Financiera', height: 30 },
      watermark: { enabled: true, text: 'CONFIDENCIAL', opacity: 0.1 }
    },
    visualizations: [
      {
        id: 'cost-summary-metrics',
        type: 'metric',
        title: 'Costo Total de Operación',
        position: { x: 20, y: 80, width: 250, height: 100 },
        config: {
          primaryMetric: 'total_cost',
          format: 'currency'
        },
        dataSource: 'schedules',
        fields: ['schedule_duration'] // Would be calculated field
      },
      {
        id: 'efficiency-metric',
        type: 'metric',
        title: 'Eficiencia de Utilización',
        position: { x: 290, y: 80, width: 250, height: 100 },
        config: {
          primaryMetric: 'efficiency_rate',
          format: 'percentage'
        },
        dataSource: 'schedules',
        fields: ['classroom_capacity', 'group_size']
      },
      {
        id: 'cost-breakdown-chart',
        type: 'chart',
        title: 'Desglose de Costos por Programa',
        position: { x: 20, y: 200, width: 520, height: 250 },
        config: {
          chartType: 'pie',
          xAxis: 'program_name',
          yAxis: ['schedule_duration'],
          showLegend: true,
          colorScheme: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6']
        },
        dataSource: 'schedules',
        fields: ['program_name', 'schedule_duration']
      },
      {
        id: 'resource-utilization-table',
        type: 'table',
        title: 'Utilización de Recursos',
        position: { x: 20, y: 470, width: 520, height: 200 },
        config: {
          columns: ['classroom_name', 'classroom_capacity', 'utilization_rate', 'cost_per_hour'],
          pagination: false,
          sorting: [{ field: 'utilization_rate', direction: 'desc' }]
        },
        dataSource: 'schedules',
        fields: ['classroom_name', 'classroom_capacity']
      }
    ],
    globalFilters: [
      {
        id: 'period-filter',
        field: 'date',
        operator: 'between',
        dataType: 'date',
        label: 'Período'
      }
    ],
    permissions: { canView: ['administrator'], canEdit: ['administrator'], canDelete: ['administrator'], isPublic: false },
    metadata: {
      createdBy: 'system',
      createdAt: '2024-01-01T00:00:00Z',
      lastModified: '2024-01-01T00:00:00Z',
      version: 1,
      tags: ['financiero', 'costos', 'eficiencia', 'recursos', 'operación']
    }
  }
]

// Template Card Component
const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onSelect,
  onPreview,
  isSelected = false
}) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'academic': return '🎓'
      case 'administrative': return '📊'
      case 'financial': return '💰'
      case 'operational': return '⚙️'
      case 'custom': return '🔧'
      default: return '📋'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'academic': return 'bg-blue-100 text-blue-800'
      case 'administrative': return 'bg-green-100 text-green-800'
      case 'financial': return 'bg-yellow-100 text-yellow-800'
      case 'operational': return 'bg-purple-100 text-purple-800'
      case 'custom': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div 
      className={`
        bg-white border rounded-lg overflow-hidden cursor-pointer transition-all duration-200
        hover:shadow-lg transform hover:-translate-y-1
        ${isSelected ? 'border-blue-500 shadow-md' : 'border-gray-200'}
      `}
      onClick={() => onSelect(template)}
    >
      {/* Thumbnail */}
      <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
        {template.thumbnail ? (
          <img 
            src={template.thumbnail} 
            alt={template.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to icon if image fails to load
              e.currentTarget.style.display = 'none'
            }}
          />
        ) : (
          <div className="text-4xl">{getCategoryIcon(template.category)}</div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 flex-1">
            {template.name}
          </h3>
          <span className={`px-2 py-1 text-xs rounded-full ml-2 ${getCategoryColor(template.category)}`}>
            {template.category}
          </span>
        </div>

        <p className="text-xs text-gray-600 line-clamp-3 mb-3">
          {template.description}
        </p>

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <span>{template.visualizations.length} visualizaciones</span>
          <span>v{template.metadata.version}</span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {template.metadata.tags.slice(0, 3).map((tag, index) => (
            <span 
              key={index}
              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
            >
              {tag}
            </span>
          ))}
          {template.metadata.tags.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
              +{template.metadata.tags.length - 3}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onPreview(template)
            }}
            className="flex-1 px-3 py-2 border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            👀 Vista Previa
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onSelect(template)
            }}
            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors"
          >
            ✨ Usar Plantilla
          </button>
        </div>
      </div>
    </div>
  )
}

// Template Preview Modal
interface TemplatePreviewProps {
  template: ReportTemplate | null
  onClose: () => void
  onUse: (template: ReportTemplate) => void
}

const TemplatePreview: React.FC<TemplatePreviewProps> = ({
  template,
  onClose,
  onUse
}) => {
  if (!template) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{template.name}</h2>
            <p className="text-sm text-gray-600 mt-1">{template.description}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Template Info */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Información General</h3>
              <div className="space-y-2 text-sm">
                <div><strong>Categoría:</strong> {template.category}</div>
                <div><strong>Visualizaciones:</strong> {template.visualizations.length}</div>
                <div><strong>Filtros globales:</strong> {template.globalFilters.length}</div>
                <div><strong>Versión:</strong> {template.metadata.version}</div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Configuración de Página</h3>
              <div className="space-y-2 text-sm">
                <div><strong>Tamaño:</strong> {template.config.pageSize}</div>
                <div><strong>Orientación:</strong> {template.config.orientation}</div>
                <div><strong>Encabezado:</strong> {template.config.header?.enabled ? 'Sí' : 'No'}</div>
                <div><strong>Pie de página:</strong> {template.config.footer?.enabled ? 'Sí' : 'No'}</div>
              </div>
            </div>
          </div>

          {/* Visualizations Preview */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Visualizaciones Incluidas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {template.visualizations.map((viz, index) => (
                <div key={viz.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-lg">
                      {viz.type === 'table' ? '📋' : 
                       viz.type === 'chart' ? '📊' : 
                       viz.type === 'metric' ? '🎯' : 
                       viz.type === 'pivot' ? '🔄' : '📈'}
                    </span>
                    <h4 className="font-medium text-gray-900">{viz.title}</h4>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{viz.description}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="bg-gray-100 px-2 py-1 rounded">{viz.type}</span>
                    <span className="text-gray-500">{viz.fields.length} campos</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">Etiquetas</h3>
            <div className="flex flex-wrap gap-2">
              {template.metadata.tags.map((tag, index) => (
                <span 
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => onUse(template)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            ✨ Usar Esta Plantilla
          </button>
        </div>
      </div>
    </div>
  )
}

// Main TemplateLibrary Component
export const TemplateLibrary: React.FC<TemplateLibraryProps> = ({
  onSelectTemplate,
  onCreateFromTemplate,
  onClose,
  className = ''
}) => {
  const [templates] = useState<ReportTemplate[]>(ACADEMIC_TEMPLATES)
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<ReportTemplate | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.metadata.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter
    
    return matchesSearch && matchesCategory
  })

  const handleSelectTemplate = useCallback((template: ReportTemplate) => {
    setSelectedTemplate(template)
    onSelectTemplate?.(template)
    onCreateFromTemplate?.(template.id)
    toast.success(`Plantilla "${template.name}" seleccionada`)
  }, [onSelectTemplate, onCreateFromTemplate])

  const handlePreviewTemplate = useCallback((template: ReportTemplate) => {
    setPreviewTemplate(template)
  }, [])

  const handleUseTemplate = useCallback((template: ReportTemplate) => {
    setPreviewTemplate(null)
    handleSelectTemplate(template)
  }, [handleSelectTemplate])

  const categories = ['all', ...Array.from(new Set(templates.map(t => t.category)))]

  return (
    <>
      <div className={`bg-white ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Biblioteca de Plantillas</h2>
            <p className="text-gray-600 mt-1">
              Elige una plantilla prediseñada para comenzar rápidamente
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Buscar plantillas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todas las categorías</option>
                {categories.filter(c => c !== 'all').map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="p-6">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No se encontraron plantillas
              </h3>
              <p className="text-gray-500">
                Intenta con otros términos de búsqueda o cambia el filtro de categoría
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onSelect={handleSelectTemplate}
                  onPreview={handlePreviewTemplate}
                  isSelected={selectedTemplate?.id === template.id}
                />
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Mostrando {filteredTemplates.length} de {templates.length} plantillas
            </span>
            <span>
              {categories.length - 1} categorías disponibles
            </span>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <TemplatePreview
        template={previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        onUse={handleUseTemplate}
      />
    </>
  )
}

export default TemplateLibrary