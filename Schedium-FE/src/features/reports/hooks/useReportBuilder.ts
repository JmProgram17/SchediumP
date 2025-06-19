/**
 * Report Builder Hook - Visual report creation and management system
 * Provides drag & drop report building with advanced customization
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

export interface ReportField {
  id: string
  name: string
  label: string
  type: 'string' | 'number' | 'date' | 'boolean' | 'array' | 'object'
  dataType: 'dimension' | 'measure' | 'calculated'
  source: string // table.column
  description?: string
  format?: {
    type: 'currency' | 'percentage' | 'date' | 'time' | 'number' | 'text'
    pattern?: string
    locale?: string
  }
  aggregation?: {
    function: 'sum' | 'count' | 'avg' | 'min' | 'max' | 'distinct'
    groupBy?: string[]
  }
  validation?: {
    required?: boolean
    min?: number
    max?: number
    pattern?: RegExp
  }
}

export interface ReportVisualization {
  id: string
  type: 'table' | 'chart' | 'pivot' | 'metric' | 'text' | 'image'
  title: string
  description?: string
  position: {
    x: number
    y: number
    width: number
    height: number
  }
  config: {
    // Table config
    columns?: string[]
    sorting?: Array<{ field: string; direction: 'asc' | 'desc' }>
    pagination?: boolean
    rowsPerPage?: number
    
    // Chart config
    chartType?: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'heatmap'
    xAxis?: string
    yAxis?: string[]
    colorScheme?: string[]
    showLegend?: boolean
    showGrid?: boolean
    
    // Pivot config
    rows?: string[]
    columns?: string[]
    values?: string[]
    
    // Metric config
    primaryMetric?: string
    comparisonMetric?: string
    format?: string
    
    // Text config
    content?: string
    fontSize?: number
    fontWeight?: 'normal' | 'bold'
    alignment?: 'left' | 'center' | 'right'
    
    // Common config
    showTitle?: boolean
    titleSize?: 'small' | 'medium' | 'large'
    border?: boolean
    backgroundColor?: string
    padding?: number
  }
  filters?: ReportFilter[]
  dataSource: string
  fields: string[]
}

export interface ReportFilter {
  id: string
  field: string
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'between' | 'in' | 'not_in' | 'is_null' | 'is_not_null'
  value: any
  values?: any[]
  dataType: 'string' | 'number' | 'date' | 'boolean'
  label?: string
  required?: boolean
}

export interface ReportTemplate {
  id: string
  name: string
  description: string
  category: 'academic' | 'administrative' | 'financial' | 'operational' | 'custom'
  thumbnail?: string
  config: {
    pageSize: 'A4' | 'A3' | 'Letter' | 'Legal' | 'Custom'
    orientation: 'portrait' | 'landscape'
    margins: {
      top: number
      right: number
      bottom: number
      left: number
    }
    header?: {
      enabled: boolean
      content: string
      height: number
    }
    footer?: {
      enabled: boolean
      content: string
      height: number
    }
    watermark?: {
      enabled: boolean
      text: string
      opacity: number
    }
  }
  visualizations: ReportVisualization[]
  globalFilters: ReportFilter[]
  schedule?: {
    enabled: boolean
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
    time: string
    recipients: string[]
    format: 'pdf' | 'excel' | 'csv'
  }
  permissions: {
    canView: string[]
    canEdit: string[]
    canDelete: string[]
    isPublic: boolean
  }
  metadata: {
    createdBy: string
    createdAt: string
    lastModified: string
    version: number
    tags: string[]
  }
}

export interface ReportExecution {
  id: string
  templateId: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  progress: number
  startTime: number
  endTime?: number
  executedBy: string
  parameters: Record<string, any>
  filters: ReportFilter[]
  output?: {
    format: 'pdf' | 'excel' | 'csv' | 'json'
    url?: string
    size?: number
    pageCount?: number
  }
  error?: string
  metadata: {
    dataRows: number
    executionTime: number
    cacheHit: boolean
  }
}

interface UseReportBuilderOptions {
  enableRealTimePreview?: boolean
  enableAutoSave?: boolean
  autoSaveInterval?: number
  maxVisualizationsPerReport?: number
  enableCollaboration?: boolean
  onTemplateChange?: (template: ReportTemplate) => void
  onExecutionComplete?: (execution: ReportExecution) => void
}

export const useReportBuilder = (options: UseReportBuilderOptions = {}) => {
  const {
    enableRealTimePreview = true,
    enableAutoSave = true,
    autoSaveInterval = 30000,
    maxVisualizationsPerReport = 20,
    enableCollaboration = false,
    onTemplateChange,
    onExecutionComplete
  } = options

  const [builderState, setBuilderState] = useState({
    currentTemplate: null as ReportTemplate | null,
    isEditing: false,
    isDirty: false,
    selectedVisualization: null as string | null,
    draggedField: null as ReportField | null,
    previewMode: false,
    executionQueue: [] as ReportExecution[],
    availableFields: [] as ReportField[],
    availableTemplates: [] as ReportTemplate[]
  })

  const queryClient = useQueryClient()
  const autoSaveTimerRef = useRef<NodeJS.Timeout>()
  const previewDataRef = useRef<Map<string, any>>(new Map())

  // Available data sources and fields
  const [dataSources] = useState<Record<string, ReportField[]>>({
    schedules: [
      {
        id: 'schedule_id',
        name: 'schedule_id',
        label: 'ID del Horario',
        type: 'string',
        dataType: 'dimension',
        source: 'schedules.id'
      },
      {
        id: 'schedule_title',
        name: 'title',
        label: 'Título de la Clase',
        type: 'string',
        dataType: 'dimension',
        source: 'schedules.title'
      },
      {
        id: 'schedule_day',
        name: 'day_of_week',
        label: 'Día de la Semana',
        type: 'string',
        dataType: 'dimension',
        source: 'schedules.day_of_week'
      },
      {
        id: 'schedule_start_time',
        name: 'start_time',
        label: 'Hora de Inicio',
        type: 'string',
        dataType: 'dimension',
        source: 'schedules.start_time',
        format: { type: 'time', pattern: 'HH:mm' }
      },
      {
        id: 'schedule_duration',
        name: 'duration',
        label: 'Duración (minutos)',
        type: 'number',
        dataType: 'measure',
        source: 'schedules.duration',
        aggregation: { function: 'sum' }
      },
      {
        id: 'instructor_name',
        name: 'instructor_name',
        label: 'Nombre del Instructor',
        type: 'string',
        dataType: 'dimension',
        source: 'instructors.full_name'
      },
      {
        id: 'classroom_name',
        name: 'classroom_name',
        label: 'Nombre del Aula',
        type: 'string',
        dataType: 'dimension',
        source: 'classrooms.name'
      },
      {
        id: 'classroom_capacity',
        name: 'classroom_capacity',
        label: 'Capacidad del Aula',
        type: 'number',
        dataType: 'measure',
        source: 'classrooms.capacity',
        aggregation: { function: 'avg' }
      },
      {
        id: 'program_name',
        name: 'program_name',
        label: 'Programa Académico',
        type: 'string',
        dataType: 'dimension',
        source: 'programs.name'
      },
      {
        id: 'group_size',
        name: 'group_size',
        label: 'Tamaño del Grupo',
        type: 'number',
        dataType: 'measure',
        source: 'groups.student_count',
        aggregation: { function: 'sum' }
      }
    ],
    conflicts: [
      {
        id: 'conflict_id',
        name: 'conflict_id',
        label: 'ID del Conflicto',
        type: 'string',
        dataType: 'dimension',
        source: 'conflicts.id'
      },
      {
        id: 'conflict_type',
        name: 'type',
        label: 'Tipo de Conflicto',
        type: 'string',
        dataType: 'dimension',
        source: 'conflicts.type'
      },
      {
        id: 'conflict_severity',
        name: 'severity',
        label: 'Severidad',
        type: 'string',
        dataType: 'dimension',
        source: 'conflicts.severity'
      },
      {
        id: 'conflict_count',
        name: 'conflict_count',
        label: 'Número de Conflictos',
        type: 'number',
        dataType: 'measure',
        source: 'conflicts.id',
        aggregation: { function: 'count' }
      },
      {
        id: 'resolution_time',
        name: 'resolution_time',
        label: 'Tiempo de Resolución (min)',
        type: 'number',
        dataType: 'measure',
        source: 'conflicts.resolution_time',
        aggregation: { function: 'avg' }
      }
    ],
    usage: [
      {
        id: 'active_users',
        name: 'active_users',
        label: 'Usuarios Activos',
        type: 'number',
        dataType: 'measure',
        source: 'analytics.active_users',
        aggregation: { function: 'count' }
      },
      {
        id: 'session_duration',
        name: 'session_duration',
        label: 'Duración de Sesión (min)',
        type: 'number',
        dataType: 'measure',
        source: 'analytics.session_duration',
        aggregation: { function: 'avg' }
      },
      {
        id: 'page_views',
        name: 'page_views',
        label: 'Vistas de Página',
        type: 'number',
        dataType: 'measure',
        source: 'analytics.page_views',
        aggregation: { function: 'sum' }
      }
    ]
  })

  // Create new report template
  const createTemplate = useCallback((name: string, category: ReportTemplate['category'] = 'custom'): ReportTemplate => {
    const newTemplate: ReportTemplate = {
      id: `template-${Date.now()}`,
      name,
      description: '',
      category,
      config: {
        pageSize: 'A4',
        orientation: 'portrait',
        margins: { top: 20, right: 20, bottom: 20, left: 20 },
        header: { enabled: true, content: name, height: 50 },
        footer: { enabled: true, content: 'Generado por Schedium - {{date}}', height: 30 }
      },
      visualizations: [],
      globalFilters: [],
      permissions: {
        canView: ['*'],
        canEdit: ['administrator', 'coordinator'],
        canDelete: ['administrator'],
        isPublic: false
      },
      metadata: {
        createdBy: 'current-user',
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        version: 1,
        tags: []
      }
    }

    setBuilderState(prev => ({
      ...prev,
      currentTemplate: newTemplate,
      isEditing: true,
      isDirty: true
    }))

    return newTemplate
  }, [])

  // Load existing template
  const loadTemplate = useCallback(async (templateId: string) => {
    try {
      const response = await fetch(`/api/v1/reports/templates/${templateId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })

      if (!response.ok) throw new Error('Failed to load template')

      const template: ReportTemplate = await response.json()
      
      setBuilderState(prev => ({
        ...prev,
        currentTemplate: template,
        isEditing: false,
        isDirty: false
      }))

      return template
    } catch (error) {
      console.error('Error loading template:', error)
      toast.error('Error al cargar la plantilla')
      return null
    }
  }, [])

  // Save template
  const saveTemplate = useCallback(async (template?: ReportTemplate) => {
    const templateToSave = template || builderState.currentTemplate
    if (!templateToSave) return false

    try {
      const updatedTemplate = {
        ...templateToSave,
        metadata: {
          ...templateToSave.metadata,
          lastModified: new Date().toISOString(),
          version: templateToSave.metadata.version + 1
        }
      }

      const response = await fetch(`/api/v1/reports/templates/${templateToSave.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(updatedTemplate)
      })

      if (!response.ok) throw new Error('Failed to save template')

      setBuilderState(prev => ({
        ...prev,
        currentTemplate: updatedTemplate,
        isDirty: false
      }))

      onTemplateChange?.(updatedTemplate)
      toast.success('Plantilla guardada exitosamente')
      return true

    } catch (error) {
      console.error('Error saving template:', error)
      toast.error('Error al guardar la plantilla')
      return false
    }
  }, [builderState.currentTemplate, onTemplateChange])

  // Add visualization to template
  const addVisualization = useCallback((type: ReportVisualization['type'], position?: { x: number; y: number }) => {
    if (!builderState.currentTemplate) return null
    if (builderState.currentTemplate.visualizations.length >= maxVisualizationsPerReport) {
      toast.error(`Máximo ${maxVisualizationsPerReport} visualizaciones por reporte`)
      return null
    }

    const newVisualization: ReportVisualization = {
      id: `viz-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      title: `Nueva ${type === 'table' ? 'Tabla' : type === 'chart' ? 'Gráfico' : 'Visualización'}`,
      position: {
        x: position?.x || 0,
        y: position?.y || 0,
        width: getDefaultSize(type).width,
        height: getDefaultSize(type).height
      },
      config: getDefaultConfig(type),
      dataSource: 'schedules',
      fields: []
    }

    setBuilderState(prev => ({
      ...prev,
      currentTemplate: prev.currentTemplate ? {
        ...prev.currentTemplate,
        visualizations: [...prev.currentTemplate.visualizations, newVisualization]
      } : null,
      isDirty: true,
      selectedVisualization: newVisualization.id
    }))

    return newVisualization
  }, [builderState.currentTemplate, maxVisualizationsPerReport])

  // Update visualization
  const updateVisualization = useCallback((vizId: string, updates: Partial<ReportVisualization>) => {
    if (!builderState.currentTemplate) return

    setBuilderState(prev => ({
      ...prev,
      currentTemplate: prev.currentTemplate ? {
        ...prev.currentTemplate,
        visualizations: prev.currentTemplate.visualizations.map(viz =>
          viz.id === vizId ? { ...viz, ...updates } : viz
        )
      } : null,
      isDirty: true
    }))

    // Trigger preview update if enabled
    if (enableRealTimePreview) {
      const updatedViz = builderState.currentTemplate.visualizations.find(v => v.id === vizId)
      if (updatedViz) {
        generatePreviewData(updatedViz)
      }
    }
  }, [builderState.currentTemplate, enableRealTimePreview])

  // Remove visualization
  const removeVisualization = useCallback((vizId: string) => {
    if (!builderState.currentTemplate) return

    setBuilderState(prev => ({
      ...prev,
      currentTemplate: prev.currentTemplate ? {
        ...prev.currentTemplate,
        visualizations: prev.currentTemplate.visualizations.filter(viz => viz.id !== vizId)
      } : null,
      isDirty: true,
      selectedVisualization: prev.selectedVisualization === vizId ? null : prev.selectedVisualization
    }))

    previewDataRef.current.delete(vizId)
    toast.success('Visualización eliminada')
  }, [builderState.currentTemplate])

  // Execute report
  const executeReport = useCallback(async (
    templateId: string,
    filters: ReportFilter[] = [],
    format: 'pdf' | 'excel' | 'csv' = 'pdf'
  ) => {
    const execution: ReportExecution = {
      id: `exec-${Date.now()}`,
      templateId,
      status: 'pending',
      progress: 0,
      startTime: Date.now(),
      executedBy: 'current-user',
      parameters: {},
      filters,
      metadata: {
        dataRows: 0,
        executionTime: 0,
        cacheHit: false
      }
    }

    setBuilderState(prev => ({
      ...prev,
      executionQueue: [...prev.executionQueue, execution]
    }))

    try {
      // Update status to running
      setBuilderState(prev => ({
        ...prev,
        executionQueue: prev.executionQueue.map(exec =>
          exec.id === execution.id ? { ...exec, status: 'running' as const } : exec
        )
      }))

      const response = await fetch('/api/v1/reports/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          templateId,
          filters,
          format,
          executionId: execution.id
        })
      })

      if (!response.ok) throw new Error('Failed to execute report')

      const result = await response.json()
      
      const completedExecution: ReportExecution = {
        ...execution,
        status: 'completed',
        progress: 100,
        endTime: Date.now(),
        output: result.output,
        metadata: {
          ...execution.metadata,
          ...result.metadata,
          executionTime: Date.now() - execution.startTime
        }
      }

      setBuilderState(prev => ({
        ...prev,
        executionQueue: prev.executionQueue.map(exec =>
          exec.id === execution.id ? completedExecution : exec
        )
      }))

      onExecutionComplete?.(completedExecution)
      toast.success('Reporte generado exitosamente')
      
      return completedExecution

    } catch (error) {
      const failedExecution: ReportExecution = {
        ...execution,
        status: 'failed',
        progress: 0,
        endTime: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          ...execution.metadata,
          executionTime: Date.now() - execution.startTime
        }
      }

      setBuilderState(prev => ({
        ...prev,
        executionQueue: prev.executionQueue.map(exec =>
          exec.id === execution.id ? failedExecution : exec
        )
      }))

      toast.error('Error al generar el reporte')
      return failedExecution
    }
  }, [onExecutionComplete])

  // Generate preview data
  const generatePreviewData = useCallback(async (visualization: ReportVisualization) => {
    try {
      // Simulate API call for preview data
      const previewData = await generateMockData(visualization)
      previewDataRef.current.set(visualization.id, previewData)
      
      return previewData
    } catch (error) {
      console.error('Error generating preview:', error)
      return null
    }
  }, [])

  // Get available fields for data source
  const getFieldsForDataSource = useCallback((dataSource: string): ReportField[] => {
    return dataSources[dataSource] || []
  }, [dataSources])

  // Validate template
  const validateTemplate = useCallback((template: ReportTemplate): { valid: boolean; errors: string[] } => {
    const errors: string[] = []

    if (!template.name.trim()) {
      errors.push('El nombre de la plantilla es requerido')
    }

    if (template.visualizations.length === 0) {
      errors.push('Se requiere al menos una visualización')
    }

    template.visualizations.forEach((viz, index) => {
      if (!viz.title.trim()) {
        errors.push(`Visualización ${index + 1}: El título es requerido`)
      }

      if (viz.fields.length === 0) {
        errors.push(`Visualización ${index + 1}: Se requiere al menos un campo`)
      }

      if (viz.type === 'chart' && !viz.config.chartType) {
        errors.push(`Visualización ${index + 1}: Tipo de gráfico requerido`)
      }
    })

    return { valid: errors.length === 0, errors }
  }, [])

  // Auto-save functionality
  useEffect(() => {
    if (!enableAutoSave || !builderState.isDirty || !builderState.currentTemplate) return

    autoSaveTimerRef.current = setTimeout(() => {
      saveTemplate()
    }, autoSaveInterval)

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [builderState.isDirty, builderState.currentTemplate, enableAutoSave, autoSaveInterval, saveTemplate])

  return {
    // State
    builderState,
    currentTemplate: builderState.currentTemplate,
    isEditing: builderState.isEditing,
    isDirty: builderState.isDirty,
    selectedVisualization: builderState.selectedVisualization,
    
    // Template management
    createTemplate,
    loadTemplate,
    saveTemplate,
    validateTemplate,
    
    // Visualization management
    addVisualization,
    updateVisualization,
    removeVisualization,
    
    // Data sources
    dataSources,
    getFieldsForDataSource,
    
    // Execution
    executeReport,
    executionQueue: builderState.executionQueue,
    
    // Preview
    generatePreviewData,
    getPreviewData: (vizId: string) => previewDataRef.current.get(vizId),
    
    // UI state
    toggleEditMode: () => setBuilderState(prev => ({ ...prev, isEditing: !prev.isEditing })),
    selectVisualization: (vizId: string | null) => setBuilderState(prev => ({ ...prev, selectedVisualization: vizId })),
    togglePreviewMode: () => setBuilderState(prev => ({ ...prev, previewMode: !prev.previewMode })),
    
    // Utilities
    hasUnsavedChanges: builderState.isDirty,
    getVisualizationCount: () => builderState.currentTemplate?.visualizations.length || 0,
    canAddVisualization: () => (builderState.currentTemplate?.visualizations.length || 0) < maxVisualizationsPerReport
  }
}

// Helper functions
function getDefaultSize(type: ReportVisualization['type']): { width: number; height: number } {
  switch (type) {
    case 'table': return { width: 800, height: 400 }
    case 'chart': return { width: 600, height: 400 }
    case 'pivot': return { width: 700, height: 500 }
    case 'metric': return { width: 200, height: 150 }
    case 'text': return { width: 400, height: 100 }
    case 'image': return { width: 300, height: 200 }
    default: return { width: 400, height: 300 }
  }
}

function getDefaultConfig(type: ReportVisualization['type']): ReportVisualization['config'] {
  const baseConfig = {
    showTitle: true,
    titleSize: 'medium' as const,
    border: true,
    backgroundColor: '#ffffff',
    padding: 16
  }

  switch (type) {
    case 'table':
      return {
        ...baseConfig,
        pagination: true,
        rowsPerPage: 25,
        sorting: []
      }
    case 'chart':
      return {
        ...baseConfig,
        chartType: 'bar',
        showLegend: true,
        showGrid: true,
        colorScheme: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B']
      }
    case 'pivot':
      return {
        ...baseConfig,
        rows: [],
        columns: [],
        values: []
      }
    case 'metric':
      return {
        ...baseConfig,
        format: 'number'
      }
    case 'text':
      return {
        ...baseConfig,
        content: 'Texto de ejemplo',
        fontSize: 14,
        fontWeight: 'normal',
        alignment: 'left'
      }
    default:
      return baseConfig
  }
}

async function generateMockData(visualization: ReportVisualization) {
  // Generate realistic mock data based on visualization type and fields
  const rowCount = Math.floor(Math.random() * 100) + 20
  const data = []

  for (let i = 0; i < rowCount; i++) {
    const row: Record<string, any> = {}
    
    visualization.fields.forEach(fieldId => {
      switch (fieldId) {
        case 'schedule_title':
          row[fieldId] = `Clase ${i + 1}`
          break
        case 'schedule_day':
          row[fieldId] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][Math.floor(Math.random() * 6)]
          break
        case 'schedule_duration':
          row[fieldId] = [60, 90, 120][Math.floor(Math.random() * 3)]
          break
        case 'instructor_name':
          row[fieldId] = `Instructor ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`
          break
        case 'classroom_capacity':
          row[fieldId] = Math.floor(Math.random() * 50) + 10
          break
        default:
          row[fieldId] = Math.floor(Math.random() * 100)
      }
    })
    
    data.push(row)
  }

  return data
}