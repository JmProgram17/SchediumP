/**
 * Dashboard Builder Hook - Drag & drop dashboard creation and management
 * Provides comprehensive dashboard building capabilities with widget management
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

export interface DashboardWidget {
  id: string
  type: 'chart' | 'metric' | 'table' | 'calendar' | 'alert' | 'activity' | 'custom'
  title: string
  description?: string
  position: {
    x: number
    y: number
    w: number
    h: number
  }
  config: {
    dataSource: string
    refreshInterval: number
    filters?: Record<string, any>
    chartType?: 'line' | 'bar' | 'pie' | 'area' | 'scatter'
    displayOptions?: {
      showLegend: boolean
      showGrid: boolean
      showValues: boolean
      theme: 'light' | 'dark'
    }
    alertConfig?: {
      threshold: number
      condition: 'gt' | 'lt' | 'eq'
      severity: 'low' | 'medium' | 'high' | 'critical'
    }
  }
  data?: any
  isLoading?: boolean
  lastUpdated?: number
  permissions: {
    canEdit: boolean
    canDelete: boolean
    canMove: boolean
    canResize: boolean
  }
}

export interface DashboardLayout {
  id: string
  name: string
  description?: string
  widgets: DashboardWidget[]
  settings: {
    columns: number
    rowHeight: number
    margin: [number, number]
    autoResize: boolean
    isDraggable: boolean
    isResizable: boolean
    theme: 'light' | 'dark' | 'auto'
  }
  metadata: {
    createdBy: string
    createdAt: string
    lastModified: string
    version: number
    isPublic: boolean
    tags: string[]
  }
}

export interface WidgetTemplate {
  id: string
  name: string
  type: DashboardWidget['type']
  icon: string
  description: string
  defaultConfig: Partial<DashboardWidget['config']>
  defaultSize: { w: number; h: number }
  category: 'analytics' | 'monitoring' | 'scheduling' | 'user_activity'
  requiredPermissions: string[]
}

interface UseDashboardBuilderOptions {
  dashboardId?: string
  enableAutoSave?: boolean
  autoSaveInterval?: number
  enableCollaboration?: boolean
  enableVersioning?: boolean
  onWidgetUpdate?: (widget: DashboardWidget) => void
  onLayoutChange?: (layout: DashboardLayout) => void
  onError?: (error: string) => void
}

export const useDashboardBuilder = (options: UseDashboardBuilderOptions = {}) => {
  const {
    dashboardId,
    enableAutoSave = true,
    autoSaveInterval = 30000,
    enableCollaboration = false,
    enableVersioning = true,
    onWidgetUpdate,
    onLayoutChange,
    onError
  } = options

  const [builderState, setBuilderState] = useState({
    currentLayout: null as DashboardLayout | null,
    isEditing: false,
    isDirty: false,
    selectedWidget: null as string | null,
    clipboardWidget: null as DashboardWidget | null,
    draggedWidget: null as WidgetTemplate | null,
    gridSnapEnabled: true,
    showGrid: true
  })

  const [widgetTemplates] = useState<WidgetTemplate[]>([
    {
      id: 'schedule-overview',
      name: 'Vista General de Horarios',
      type: 'chart',
      icon: '📅',
      description: 'Gráfico de distribución de horarios por día',
      defaultConfig: {
        dataSource: '/api/v1/analytics/schedule-overview',
        refreshInterval: 300000,
        chartType: 'bar'
      },
      defaultSize: { w: 6, h: 4 },
      category: 'scheduling',
      requiredPermissions: ['schedules.read']
    },
    {
      id: 'active-users',
      name: 'Usuarios Activos',
      type: 'metric',
      icon: '👥',
      description: 'Contador de usuarios activos en tiempo real',
      defaultConfig: {
        dataSource: '/api/v1/analytics/active-users',
        refreshInterval: 60000
      },
      defaultSize: { w: 3, h: 2 },
      category: 'user_activity',
      requiredPermissions: ['users.read']
    },
    {
      id: 'conflict-alerts',
      name: 'Alertas de Conflictos',
      type: 'alert',
      icon: '⚠️',
      description: 'Lista de conflictos de horarios activos',
      defaultConfig: {
        dataSource: '/api/v1/analytics/conflicts',
        refreshInterval: 120000,
        alertConfig: {
          threshold: 0,
          condition: 'gt',
          severity: 'medium'
        }
      },
      defaultSize: { w: 4, h: 3 },
      category: 'monitoring',
      requiredPermissions: ['schedules.read']
    },
    {
      id: 'instructor-workload',
      name: 'Carga de Trabajo',
      type: 'chart',
      icon: '📊',
      description: 'Distribución de carga por instructor',
      defaultConfig: {
        dataSource: '/api/v1/analytics/instructor-workload',
        refreshInterval: 600000,
        chartType: 'pie'
      },
      defaultSize: { w: 5, h: 4 },
      category: 'analytics',
      requiredPermissions: ['instructors.read']
    },
    {
      id: 'recent-activity',
      name: 'Actividad Reciente',
      type: 'activity',
      icon: '🔄',
      description: 'Timeline de actividades recientes',
      defaultConfig: {
        dataSource: '/api/v1/analytics/recent-activity',
        refreshInterval: 180000
      },
      defaultSize: { w: 6, h: 5 },
      category: 'user_activity',
      requiredPermissions: ['activity.read']
    },
    {
      id: 'system-performance',
      name: 'Rendimiento del Sistema',
      type: 'chart',
      icon: '⚡',
      description: 'Métricas de rendimiento en tiempo real',
      defaultConfig: {
        dataSource: '/api/v1/analytics/system-performance',
        refreshInterval: 30000,
        chartType: 'line'
      },
      defaultSize: { w: 8, h: 4 },
      category: 'monitoring',
      requiredPermissions: ['system.read']
    }
  ])

  const queryClient = useQueryClient()
  const autoSaveTimerRef = useRef<NodeJS.Timeout>()
  const layoutHistoryRef = useRef<DashboardLayout[]>([])

  // Create new dashboard layout
  const createLayout = useCallback((name: string, description?: string): DashboardLayout => {
    const newLayout: DashboardLayout = {
      id: `layout-${Date.now()}`,
      name,
      description,
      widgets: [],
      settings: {
        columns: 12,
        rowHeight: 60,
        margin: [10, 10],
        autoResize: true,
        isDraggable: true,
        isResizable: true,
        theme: 'light'
      },
      metadata: {
        createdBy: 'current-user', // Should come from auth context
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        version: 1,
        isPublic: false,
        tags: []
      }
    }

    setBuilderState(prev => ({
      ...prev,
      currentLayout: newLayout,
      isEditing: true,
      isDirty: true
    }))

    return newLayout
  }, [])

  // Load existing dashboard layout
  const loadLayout = useCallback(async (layoutId: string) => {
    try {
      // This would typically fetch from API
      const response = await fetch(`/api/v1/dashboards/${layoutId}`)
      const layout: DashboardLayout = await response.json()

      setBuilderState(prev => ({
        ...prev,
        currentLayout: layout,
        isEditing: false,
        isDirty: false
      }))

      return layout
    } catch (error) {
      onError?.('Failed to load dashboard layout')
      console.error('Error loading layout:', error)
      return null
    }
  }, [onError])

  // Save dashboard layout
  const saveLayout = useCallback(async (layout?: DashboardLayout) => {
    const layoutToSave = layout || builderState.currentLayout
    if (!layoutToSave) return false

    try {
      const updatedLayout = {
        ...layoutToSave,
        metadata: {
          ...layoutToSave.metadata,
          lastModified: new Date().toISOString(),
          version: layoutToSave.metadata.version + 1
        }
      }

      // Save to API
      const response = await fetch(`/api/v1/dashboards/${layoutToSave.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(updatedLayout)
      })

      if (!response.ok) throw new Error('Failed to save')

      // Update version history
      if (enableVersioning) {
        layoutHistoryRef.current.push(structuredClone(layoutToSave))
        if (layoutHistoryRef.current.length > 10) {
          layoutHistoryRef.current.shift()
        }
      }

      setBuilderState(prev => ({
        ...prev,
        currentLayout: updatedLayout,
        isDirty: false
      }))

      onLayoutChange?.(updatedLayout)
      toast.success('Dashboard guardado exitosamente')
      return true

    } catch (error) {
      onError?.('Failed to save dashboard')
      toast.error('Error al guardar el dashboard')
      return false
    }
  }, [builderState.currentLayout, enableVersioning, onLayoutChange, onError])

  // Add widget to dashboard
  const addWidget = useCallback((template: WidgetTemplate, position?: { x: number; y: number }) => {
    if (!builderState.currentLayout) return

    // Find available position if not specified
    const finalPosition = position || findAvailablePosition(
      builderState.currentLayout.widgets,
      template.defaultSize
    )

    const newWidget: DashboardWidget = {
      id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: template.type,
      title: template.name,
      description: template.description,
      position: {
        ...finalPosition,
        w: template.defaultSize.w,
        h: template.defaultSize.h
      },
      config: {
        dataSource: template.defaultConfig.dataSource || '',
        refreshInterval: template.defaultConfig.refreshInterval || 300000,
        ...template.defaultConfig
      },
      permissions: {
        canEdit: true,
        canDelete: true,
        canMove: true,
        canResize: true
      }
    }

    setBuilderState(prev => ({
      ...prev,
      currentLayout: prev.currentLayout ? {
        ...prev.currentLayout,
        widgets: [...prev.currentLayout.widgets, newWidget]
      } : null,
      isDirty: true,
      selectedWidget: newWidget.id
    }))

    onWidgetUpdate?.(newWidget)
    toast.success(`Widget "${template.name}" agregado`)
  }, [builderState.currentLayout, onWidgetUpdate])

  // Remove widget from dashboard
  const removeWidget = useCallback((widgetId: string) => {
    if (!builderState.currentLayout) return

    const widget = builderState.currentLayout.widgets.find(w => w.id === widgetId)
    if (!widget?.permissions.canDelete) {
      toast.error('No tienes permisos para eliminar este widget')
      return
    }

    setBuilderState(prev => ({
      ...prev,
      currentLayout: prev.currentLayout ? {
        ...prev.currentLayout,
        widgets: prev.currentLayout.widgets.filter(w => w.id !== widgetId)
      } : null,
      isDirty: true,
      selectedWidget: prev.selectedWidget === widgetId ? null : prev.selectedWidget
    }))

    toast.success('Widget eliminado')
  }, [builderState.currentLayout])

  // Update widget configuration
  const updateWidget = useCallback((widgetId: string, updates: Partial<DashboardWidget>) => {
    if (!builderState.currentLayout) return

    setBuilderState(prev => ({
      ...prev,
      currentLayout: prev.currentLayout ? {
        ...prev.currentLayout,
        widgets: prev.currentLayout.widgets.map(widget =>
          widget.id === widgetId ? { ...widget, ...updates } : widget
        )
      } : null,
      isDirty: true
    }))

    const updatedWidget = builderState.currentLayout.widgets.find(w => w.id === widgetId)
    if (updatedWidget) {
      onWidgetUpdate?.({ ...updatedWidget, ...updates })
    }
  }, [builderState.currentLayout, onWidgetUpdate])

  // Move widget position
  const moveWidget = useCallback((widgetId: string, newPosition: { x: number; y: number; w?: number; h?: number }) => {
    updateWidget(widgetId, { position: { ...newPosition, w: newPosition.w || 4, h: newPosition.h || 3 } })
  }, [updateWidget])

  // Copy widget to clipboard
  const copyWidget = useCallback((widgetId: string) => {
    const widget = builderState.currentLayout?.widgets.find(w => w.id === widgetId)
    if (widget) {
      setBuilderState(prev => ({ ...prev, clipboardWidget: widget }))
      toast.success('Widget copiado al portapapeles')
    }
  }, [builderState.currentLayout])

  // Paste widget from clipboard
  const pasteWidget = useCallback((position?: { x: number; y: number }) => {
    if (!builderState.clipboardWidget || !builderState.currentLayout) return

    const newWidget: DashboardWidget = {
      ...structuredClone(builderState.clipboardWidget),
      id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: `${builderState.clipboardWidget.title} (Copia)`,
      position: position || findAvailablePosition(
        builderState.currentLayout.widgets,
        builderState.clipboardWidget.position
      )
    }

    setBuilderState(prev => ({
      ...prev,
      currentLayout: prev.currentLayout ? {
        ...prev.currentLayout,
        widgets: [...prev.currentLayout.widgets, newWidget]
      } : null,
      isDirty: true
    }))

    toast.success('Widget pegado')
  }, [builderState.clipboardWidget, builderState.currentLayout])

  // Find available position for widget
  const findAvailablePosition = useCallback((
    existingWidgets: DashboardWidget[],
    size: { w: number; h: number }
  ): { x: number; y: number } => {
    const columns = builderState.currentLayout?.settings.columns || 12
    
    // Create a grid to track occupied spaces
    const grid = Array(100).fill(null).map(() => Array(columns).fill(false))
    
    // Mark occupied positions
    existingWidgets.forEach(widget => {
      for (let y = widget.position.y; y < widget.position.y + widget.position.h; y++) {
        for (let x = widget.position.x; x < widget.position.x + widget.position.w; x++) {
          if (grid[y] && grid[y][x] !== undefined) {
            grid[y][x] = true
          }
        }
      }
    })
    
    // Find first available position
    for (let y = 0; y < grid.length - size.h; y++) {
      for (let x = 0; x <= columns - size.w; x++) {
        let canPlace = true
        
        for (let dy = 0; dy < size.h && canPlace; dy++) {
          for (let dx = 0; dx < size.w && canPlace; dx++) {
            if (grid[y + dy][x + dx]) {
              canPlace = false
            }
          }
        }
        
        if (canPlace) {
          return { x, y }
        }
      }
    }
    
    // If no space found, place at bottom
    const maxY = Math.max(0, ...existingWidgets.map(w => w.position.y + w.position.h))
    return { x: 0, y: maxY }
  }, [builderState.currentLayout])

  // Toggle edit mode
  const toggleEditMode = useCallback(() => {
    setBuilderState(prev => ({
      ...prev,
      isEditing: !prev.isEditing
    }))
  }, [])

  // Auto-save functionality
  useEffect(() => {
    if (!enableAutoSave || !builderState.isDirty || !builderState.currentLayout) return

    autoSaveTimerRef.current = setTimeout(() => {
      saveLayout()
    }, autoSaveInterval)

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [builderState.isDirty, builderState.currentLayout, enableAutoSave, autoSaveInterval, saveLayout])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [])

  return {
    // State
    builderState,
    currentLayout: builderState.currentLayout,
    isEditing: builderState.isEditing,
    isDirty: builderState.isDirty,
    selectedWidget: builderState.selectedWidget,
    
    // Widget templates
    widgetTemplates,
    
    // Layout management
    createLayout,
    loadLayout,
    saveLayout,
    
    // Widget operations
    addWidget,
    removeWidget,
    updateWidget,
    moveWidget,
    copyWidget,
    pasteWidget,
    
    // UI state
    toggleEditMode,
    selectWidget: (widgetId: string | null) => setBuilderState(prev => ({ ...prev, selectedWidget: widgetId })),
    
    // Utilities
    findAvailablePosition,
    canPaste: !!builderState.clipboardWidget,
    hasUnsavedChanges: builderState.isDirty,
    
    // Version history
    layoutHistory: layoutHistoryRef.current,
    
    // Settings
    updateLayoutSettings: (settings: Partial<DashboardLayout['settings']>) => {
      if (builderState.currentLayout) {
        setBuilderState(prev => ({
          ...prev,
          currentLayout: prev.currentLayout ? {
            ...prev.currentLayout,
            settings: { ...prev.currentLayout.settings, ...settings }
          } : null,
          isDirty: true
        }))
      }
    }
  }
}