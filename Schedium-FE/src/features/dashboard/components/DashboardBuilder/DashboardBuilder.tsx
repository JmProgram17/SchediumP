/**
 * Dashboard Builder Component - Visual dashboard creation interface
 * Provides drag & drop dashboard building with real-time preview
 */

import React, { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Settings, 
  Save, 
  Eye, 
  Edit3, 
  Copy, 
  Trash2, 
  Grid3X3, 
  Layout,
  Palette,
  RefreshCw,
  Download,
  Upload,
  Undo,
  Redo,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Grip,
  Maximize2,
  Minimize2
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/design-system/components/Card'
import { Button } from '@/design-system/components/Button'
import { Badge } from '@/design-system/components/Badge'
import { LoadingSpinner } from '@/design-system/components/LoadingSpinner'
import { Tooltip } from '@/design-system/components/Tooltip'

import { useDashboardBuilder, DashboardWidget, WidgetTemplate } from './useDashboardBuilder'

interface DashboardBuilderProps {
  dashboardId?: string
  initialLayout?: any
  enableCollaboration?: boolean
  className?: string
}

// Widget template card component
const WidgetTemplateCard: React.FC<{
  template: WidgetTemplate
  onAdd: (template: WidgetTemplate) => void
  disabled?: boolean
}> = ({ template, onAdd, disabled = false }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        p-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer
        transition-all duration-200 hover:border-blue-400 hover:bg-blue-50
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      onClick={() => !disabled && onAdd(template)}
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl">{template.icon}</div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{template.name}</h4>
          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{template.description}</p>
          <div className="flex items-center justify-between mt-2">
            <Badge variant="secondary" size="sm">
              {template.category}
            </Badge>
            <span className="text-xs text-gray-500">
              {template.defaultSize.w}×{template.defaultSize.h}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Dashboard widget component with edit capabilities
const DashboardWidgetCard: React.FC<{
  widget: DashboardWidget
  isSelected: boolean
  isEditing: boolean
  onSelect: () => void
  onUpdate: (updates: Partial<DashboardWidget>) => void
  onRemove: () => void
  onCopy: () => void
}> = ({ widget, isSelected, isEditing, onSelect, onUpdate, onRemove, onCopy }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const getWidgetIcon = () => {
    const icons = {
      chart: '📊',
      metric: '📈',
      table: '📋',
      calendar: '📅',
      alert: '⚠️',
      activity: '🔄',
      custom: '⚙️'
    }
    return icons[widget.type] || '📊'
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`
        relative bg-white border-2 rounded-lg shadow-sm transition-all duration-200
        ${isSelected ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-gray-300'}
        ${isEditing ? 'cursor-move' : 'cursor-pointer'}
      `}
      style={{
        gridColumn: `span ${widget.position.w}`,
        gridRow: `span ${widget.position.h}`,
        minHeight: `${widget.position.h * 60}px`
      }}
      onClick={onSelect}
    >
      {/* Widget header */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-lg">{getWidgetIcon()}</span>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm truncate">{widget.title}</h3>
            {widget.description && (
              <p className="text-xs text-gray-600 truncate">{widget.description}</p>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="flex items-center gap-1">
            <Tooltip content="Copiar widget">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onCopy()
                }}
              >
                <Copy className="w-3 h-3" />
              </Button>
            </Tooltip>
            
            <Tooltip content="Configurar widget">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsExpanded(!isExpanded)
                }}
              >
                <Settings className="w-3 h-3" />
              </Button>
            </Tooltip>
            
            {widget.permissions.canDelete && (
              <Tooltip content="Eliminar widget">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemove()
                  }}
                >
                  <Trash2 className="w-3 h-3 text-red-500" />
                </Button>
              </Tooltip>
            )}
          </div>
        )}
      </div>

      {/* Widget content */}
      <div className="p-3 flex-1">
        {widget.isLoading ? (
          <div className="flex items-center justify-center h-20">
            <LoadingSpinner size="sm" />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
            {widget.data ? 'Widget con datos' : 'Vista previa del widget'}
          </div>
        )}
      </div>

      {/* Widget configuration panel */}
      <AnimatePresence>
        {isExpanded && isEditing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t bg-gray-50 p-3 space-y-3"
          >
            <div>
              <label className="text-xs font-medium text-gray-700">Título</label>
              <input
                type="text"
                value={widget.title}
                onChange={(e) => onUpdate({ title: e.target.value })}
                className="w-full text-sm border rounded px-2 py-1 mt-1"
              />
            </div>
            
            <div>
              <label className="text-xs font-medium text-gray-700">Intervalo de actualización (ms)</label>
              <input
                type="number"
                value={widget.config.refreshInterval}
                onChange={(e) => onUpdate({ 
                  config: { ...widget.config, refreshInterval: parseInt(e.target.value) || 300000 }
                })}
                className="w-full text-sm border rounded px-2 py-1 mt-1"
              />
            </div>

            {widget.type === 'chart' && (
              <div>
                <label className="text-xs font-medium text-gray-700">Tipo de gráfico</label>
                <select
                  value={widget.config.chartType || 'line'}
                  onChange={(e) => onUpdate({ 
                    config: { ...widget.config, chartType: e.target.value as any }
                  })}
                  className="w-full text-sm border rounded px-2 py-1 mt-1"
                >
                  <option value="line">Líneas</option>
                  <option value="bar">Barras</option>
                  <option value="pie">Circular</option>
                  <option value="area">Área</option>
                  <option value="scatter">Dispersión</option>
                </select>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resize handle */}
      {isEditing && widget.permissions.canResize && (
        <div className="absolute bottom-1 right-1 w-3 h-3 cursor-se-resize">
          <Grip className="w-3 h-3 text-gray-400" />
        </div>
      )}

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none" />
      )}
    </motion.div>
  )
}

export const DashboardBuilder: React.FC<DashboardBuilderProps> = ({
  dashboardId,
  initialLayout,
  enableCollaboration = false,
  className
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState<'widgets' | 'settings'>('widgets')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const {
    builderState,
    currentLayout,
    isEditing,
    isDirty,
    selectedWidget,
    widgetTemplates,
    createLayout,
    saveLayout,
    addWidget,
    removeWidget,
    updateWidget,
    copyWidget,
    pasteWidget,
    toggleEditMode,
    selectWidget,
    canPaste,
    hasUnsavedChanges,
    updateLayoutSettings
  } = useDashboardBuilder({
    dashboardId,
    enableAutoSave: true,
    enableCollaboration
  })

  // Filter widget templates
  const filteredTemplates = widgetTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleAddWidget = useCallback((template: WidgetTemplate) => {
    addWidget(template)
  }, [addWidget])

  const handleSave = useCallback(async () => {
    const success = await saveLayout()
    if (success) {
      // Handle success
    }
  }, [saveLayout])

  const categories = ['all', 'analytics', 'monitoring', 'scheduling', 'user_activity']

  if (!currentLayout) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">No hay dashboard cargado</h3>
          <Button onClick={() => createLayout('Nuevo Dashboard', 'Dashboard personalizado')}>
            Crear Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex h-screen bg-gray-50 ${className}`}>
      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{ width: sidebarCollapsed ? 60 : 320 }}
        className="bg-white border-r shadow-sm flex flex-col"
      >
        {/* Sidebar header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <h2 className="font-semibold text-gray-900">Constructor</h2>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {!sidebarCollapsed && (
          <>
            {/* Sidebar tabs */}
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab('widgets')}
                className={`flex-1 px-4 py-2 text-sm font-medium ${
                  activeTab === 'widgets' 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Widgets
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex-1 px-4 py-2 text-sm font-medium ${
                  activeTab === 'settings' 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Configuración
              </button>
            </div>

            {/* Sidebar content */}
            <div className="flex-1 overflow-auto p-4">
              {activeTab === 'widgets' && (
                <div className="space-y-4">
                  {/* Search and filter */}
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar widgets..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                    
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    >
                      <option value="all">Todas las categorías</option>
                      <option value="analytics">Analíticas</option>
                      <option value="monitoring">Monitoreo</option>
                      <option value="scheduling">Programación</option>
                      <option value="user_activity">Actividad</option>
                    </select>
                  </div>

                  {/* Widget templates */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-700">
                      Widgets Disponibles ({filteredTemplates.length})
                    </h3>
                    <div className="space-y-2">
                      {filteredTemplates.map((template) => (
                        <WidgetTemplateCard
                          key={template.id}
                          template={template}
                          onAdd={handleAddWidget}
                          disabled={!isEditing}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-700">Configuración del Dashboard</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-700">Nombre</label>
                      <input
                        type="text"
                        value={currentLayout.name}
                        onChange={(e) => updateLayoutSettings({ 
                          metadata: { ...currentLayout.metadata, lastModified: new Date().toISOString() }
                        })}
                        className="w-full text-sm border rounded px-2 py-1 mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-700">Columnas</label>
                      <input
                        type="number"
                        min="6"
                        max="24"
                        value={currentLayout.settings.columns}
                        onChange={(e) => updateLayoutSettings({ 
                          columns: parseInt(e.target.value) || 12 
                        })}
                        className="w-full text-sm border rounded px-2 py-1 mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-700">Altura de fila (px)</label>
                      <input
                        type="number"
                        min="40"
                        max="120"
                        value={currentLayout.settings.rowHeight}
                        onChange={(e) => updateLayoutSettings({ 
                          rowHeight: parseInt(e.target.value) || 60 
                        })}
                        className="w-full text-sm border rounded px-2 py-1 mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-700">Tema</label>
                      <select
                        value={currentLayout.settings.theme}
                        onChange={(e) => updateLayoutSettings({ 
                          theme: e.target.value as 'light' | 'dark' | 'auto' 
                        })}
                        className="w-full text-sm border rounded px-2 py-1 mt-1"
                      >
                        <option value="light">Claro</option>
                        <option value="dark">Oscuro</option>
                        <option value="auto">Automático</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </motion.div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-medium">{currentLayout.name}</h1>
            {hasUnsavedChanges && (
              <Badge variant="secondary" size="sm">Sin guardar</Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleEditMode}
              className="flex items-center gap-2"
            >
              {isEditing ? <Eye className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
              {isEditing ? 'Vista previa' : 'Editar'}
            </Button>

            {canPaste && isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => pasteWidget()}
              >
                Pegar
              </Button>
            )}

            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={!hasUnsavedChanges}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Guardar
            </Button>
          </div>
        </div>

        {/* Dashboard grid */}
        <div className="flex-1 overflow-auto p-6">
          <div
            className="grid gap-4 auto-rows-min"
            style={{
              gridTemplateColumns: `repeat(${currentLayout.settings.columns}, 1fr)`,
              gridAutoRows: `${currentLayout.settings.rowHeight}px`
            }}
          >
            <AnimatePresence>
              {currentLayout.widgets.map((widget) => (
                <DashboardWidgetCard
                  key={widget.id}
                  widget={widget}
                  isSelected={selectedWidget === widget.id}
                  isEditing={isEditing}
                  onSelect={() => selectWidget(widget.id)}
                  onUpdate={(updates) => updateWidget(widget.id, updates)}
                  onRemove={() => removeWidget(widget.id)}
                  onCopy={() => copyWidget(widget.id)}
                />
              ))}
            </AnimatePresence>

            {/* Empty state */}
            {currentLayout.widgets.length === 0 && (
              <div className="col-span-full flex items-center justify-center py-12">
                <div className="text-center">
                  <Layout className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Dashboard vacío
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Arrastra widgets desde el panel lateral para comenzar
                  </p>
                  {!isEditing && (
                    <Button onClick={toggleEditMode}>
                      Comenzar a editar
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardBuilder