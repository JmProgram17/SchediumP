/**
 * ReportBuilder Component - Visual drag & drop report creation interface
 * Comprehensive report builder with real-time preview and template management
 */

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { DndProvider, useDrag, useDrop, DragSourceMonitor, DropTargetMonitor } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { Resizable } from 'react-resizable'
import { toast } from 'react-hot-toast'
import { 
  useReportBuilder,
  ReportTemplate,
  ReportVisualization,
  ReportField,
  ReportFilter 
} from '../../hooks/useReportBuilder'

// Drag & Drop types
const ItemTypes = {
  FIELD: 'field',
  VISUALIZATION: 'visualization',
  TEMPLATE: 'template'
}

// Interface definitions
interface ReportBuilderProps {
  templateId?: string
  onSave?: (template: ReportTemplate) => void
  onPreview?: (template: ReportTemplate) => void
  onExport?: (templateId: string, format: string) => void
  className?: string
}

interface DraggableFieldProps {
  field: ReportField
  onDrop?: (field: ReportField, targetType: string) => void
}

interface DroppableCanvasProps {
  template: ReportTemplate
  selectedVisualization: string | null
  onVisualizationUpdate: (vizId: string, updates: Partial<ReportVisualization>) => void
  onVisualizationSelect: (vizId: string | null) => void
  onVisualizationDelete: (vizId: string) => void
}

interface VisualizationEditorProps {
  visualization: ReportVisualization | null
  availableFields: ReportField[]
  onUpdate: (updates: Partial<ReportVisualization>) => void
  onClose: () => void
}

// Draggable Field Component
const DraggableField: React.FC<DraggableFieldProps> = ({ field }) => {
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.FIELD,
    item: { field },
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging()
    })
  })

  const getFieldIcon = (type: string) => {
    switch (type) {
      case 'string': return '📝'
      case 'number': return '🔢'
      case 'date': return '📅'
      case 'boolean': return '✓'
      default: return '📊'
    }
  }

  const getDataTypeColor = (dataType: string) => {
    switch (dataType) {
      case 'dimension': return 'bg-blue-100 text-blue-800'
      case 'measure': return 'bg-green-100 text-green-800'
      case 'calculated': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div
      ref={drag}
      className={`
        cursor-move p-3 mb-2 bg-white border border-gray-200 rounded-lg shadow-sm
        hover:shadow-md transition-all duration-200
        ${isDragging ? 'opacity-50' : 'opacity-100'}
      `}
    >
      <div className="flex items-center space-x-2">
        <span className="text-lg">{getFieldIcon(field.type)}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{field.label}</p>
          <p className="text-xs text-gray-500 truncate">{field.source}</p>
        </div>
        <span className={`px-2 py-1 text-xs rounded-full ${getDataTypeColor(field.dataType)}`}>
          {field.dataType}
        </span>
      </div>
      {field.description && (
        <p className="mt-1 text-xs text-gray-400 line-clamp-2">{field.description}</p>
      )}
    </div>
  )
}

// Droppable Canvas Component
const DroppableCanvas: React.FC<DroppableCanvasProps> = ({
  template,
  selectedVisualization,
  onVisualizationUpdate,
  onVisualizationSelect,
  onVisualizationDelete
}) => {
  const canvasRef = useRef<HTMLDivElement>(null)

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: [ItemTypes.FIELD, ItemTypes.VISUALIZATION],
    drop: (item: any, monitor: DropTargetMonitor) => {
      if (!monitor.didDrop()) {
        const offset = monitor.getClientOffset()
        const canvasRect = canvasRef.current?.getBoundingClientRect()
        
        if (offset && canvasRect) {
          const x = offset.x - canvasRect.left
          const y = offset.y - canvasRect.top
          
          if (item.field) {
            // Create new visualization from field
            const vizType = item.field.dataType === 'measure' ? 'chart' : 'table'
            // This would call addVisualization from the parent
            console.log('Creating visualization from field:', item.field, 'at position:', { x, y })
          }
        }
      }
    },
    collect: (monitor: DropTargetMonitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop()
    })
  })

  return (
    <div
      ref={(node) => {
        drop(node)
        canvasRef.current = node
      }}
      className={`
        relative w-full h-full bg-gray-50 border-2 border-dashed
        ${isOver && canDrop ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}
        transition-colors duration-200
      `}
      style={{ minHeight: '600px' }}
    >
      {/* Grid background */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}
      />

      {/* Visualizations */}
      {template.visualizations.map((viz) => (
        <ResizableVisualization
          key={viz.id}
          visualization={viz}
          isSelected={selectedVisualization === viz.id}
          onSelect={() => onVisualizationSelect(viz.id)}
          onUpdate={(updates) => onVisualizationUpdate(viz.id, updates)}
          onDelete={() => onVisualizationDelete(viz.id)}
        />
      ))}

      {/* Empty state */}
      {template.visualizations.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-medium mb-2">Canvas de Reporte Vacío</h3>
            <p className="text-sm">
              Arrastra campos desde el panel lateral para crear visualizaciones
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// Resizable Visualization Component
interface ResizableVisualizationProps {
  visualization: ReportVisualization
  isSelected: boolean
  onSelect: () => void
  onUpdate: (updates: Partial<ReportVisualization>) => void
  onDelete: () => void
}

const ResizableVisualization: React.FC<ResizableVisualizationProps> = ({
  visualization,
  isSelected,
  onSelect,
  onUpdate,
  onDelete
}) => {
  const [isDragging, setIsDragging] = useState(false)
  
  const handleResize = useCallback((event: any, { size }: { size: { width: number, height: number } }) => {
    onUpdate({
      position: {
        ...visualization.position,
        width: size.width,
        height: size.height
      }
    })
  }, [visualization.position, onUpdate])

  const handleDragStart = useCallback(() => {
    setIsDragging(true)
  }, [])

  const handleDragStop = useCallback((event: any, data: { x: number, y: number }) => {
    setIsDragging(false)
    onUpdate({
      position: {
        ...visualization.position,
        x: data.x,
        y: data.y
      }
    })
  }, [visualization.position, onUpdate])

  const getVisualizationPreview = () => {
    switch (visualization.type) {
      case 'table':
        return (
          <div className="p-4">
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="font-semibold p-2 bg-gray-100">Columna 1</div>
              <div className="font-semibold p-2 bg-gray-100">Columna 2</div>
              <div className="font-semibold p-2 bg-gray-100">Columna 3</div>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="p-2 border-t border-gray-200">Dato {i + 1}</div>
              ))}
            </div>
          </div>
        )
      case 'chart':
        return (
          <div className="p-4 flex items-center justify-center h-full">
            <div className="w-full h-32 bg-gradient-to-r from-blue-100 to-blue-200 rounded flex items-end justify-around px-4 pb-2">
              {[40, 70, 55, 80, 65].map((height, i) => (
                <div
                  key={i}
                  className="bg-blue-500 rounded-t w-6"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          </div>
        )
      case 'metric':
        return (
          <div className="p-4 flex flex-col items-center justify-center h-full">
            <div className="text-3xl font-bold text-blue-600">1,234</div>
            <div className="text-sm text-gray-500">Métrica Principal</div>
            <div className="text-xs text-green-500 mt-1">↗ +12.5%</div>
          </div>
        )
      case 'pivot':
        return (
          <div className="p-4">
            <div className="grid grid-cols-4 gap-1 text-xs">
              <div className="font-semibold p-1 bg-gray-100"></div>
              <div className="font-semibold p-1 bg-gray-100">Q1</div>
              <div className="font-semibold p-1 bg-gray-100">Q2</div>
              <div className="font-semibold p-1 bg-gray-100">Total</div>
              <div className="font-semibold p-1 bg-gray-100">Ventas</div>
              <div className="p-1 border-t">100</div>
              <div className="p-1 border-t">150</div>
              <div className="p-1 border-t">250</div>
            </div>
          </div>
        )
      default:
        return (
          <div className="p-4 flex items-center justify-center h-full">
            <div className="text-gray-400">
              <div className="text-2xl mb-2">📊</div>
              <div className="text-sm">Vista previa no disponible</div>
            </div>
          </div>
        )
    }
  }

  return (
    <Resizable
      width={visualization.position.width}
      height={visualization.position.height}
      onResize={handleResize}
      resizeHandles={['se']}
    >
      <div
        className={`
          absolute bg-white border rounded-lg shadow-sm overflow-hidden
          ${isSelected ? 'border-blue-500 shadow-md' : 'border-gray-200'}
          ${isDragging ? 'opacity-75' : 'opacity-100'}
          transition-all duration-200
        `}
        style={{
          left: visualization.position.x,
          top: visualization.position.y,
          width: visualization.position.width,
          height: visualization.position.height
        }}
        onClick={onSelect}
      >
        {/* Header */}
        <div 
          className={`
            px-3 py-2 border-b bg-gray-50 cursor-move flex items-center justify-between
            ${isSelected ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}
          `}
          onMouseDown={handleDragStart}
          onMouseUp={handleDragStop}
        >
          <h4 className="text-sm font-medium text-gray-900 truncate">
            {visualization.title}
          </h4>
          <div className="flex items-center space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                // Open configuration modal
              }}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
            >
              ⚙️
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              className="p-1 text-gray-400 hover:text-red-600 rounded"
            >
              🗑️
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {getVisualizationPreview()}
        </div>

        {/* Field indicators */}
        {visualization.fields.length > 0 && (
          <div className="absolute bottom-2 left-2 right-2">
            <div className="flex flex-wrap gap-1">
              {visualization.fields.slice(0, 3).map((fieldId, index) => (
                <span
                  key={fieldId}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                >
                  {fieldId}
                </span>
              ))}
              {visualization.fields.length > 3 && (
                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                  +{visualization.fields.length - 3}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </Resizable>
  )
}

// Visualization Configuration Panel
const VisualizationEditor: React.FC<VisualizationEditorProps> = ({
  visualization,
  availableFields,
  onUpdate,
  onClose
}) => {
  if (!visualization) return null

  const handleFieldAdd = (fieldId: string) => {
    if (!visualization.fields.includes(fieldId)) {
      onUpdate({
        fields: [...visualization.fields, fieldId]
      })
    }
  }

  const handleFieldRemove = (fieldId: string) => {
    onUpdate({
      fields: visualization.fields.filter(f => f !== fieldId)
    })
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Configurar Visualización
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Basic Configuration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Título
          </label>
          <input
            type="text"
            value={visualization.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descripción
          </label>
          <textarea
            value={visualization.description || ''}
            onChange={(e) => onUpdate({ description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Type-specific configuration */}
        {visualization.type === 'chart' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Gráfico
            </label>
            <select
              value={visualization.config.chartType || 'bar'}
              onChange={(e) => onUpdate({
                config: { ...visualization.config, chartType: e.target.value as any }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="bar">Barras</option>
              <option value="line">Líneas</option>
              <option value="pie">Circular</option>
              <option value="area">Área</option>
              <option value="scatter">Dispersión</option>
              <option value="heatmap">Mapa de Calor</option>
            </select>
          </div>
        )}

        {/* Fields Configuration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Campos Seleccionados ({visualization.fields.length})
          </label>
          <div className="space-y-2 mb-3">
            {visualization.fields.map((fieldId) => {
              const field = availableFields.find(f => f.id === fieldId)
              return field ? (
                <div key={fieldId} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                  <span className="text-sm text-blue-800">{field.label}</span>
                  <button
                    onClick={() => handleFieldRemove(fieldId)}
                    className="text-blue-600 hover:text-red-600"
                  >
                    ✕
                  </button>
                </div>
              ) : null
            })}
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Campos Disponibles</h4>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {availableFields
                .filter(field => !visualization.fields.includes(field.id))
                .map((field) => (
                  <button
                    key={field.id}
                    onClick={() => handleFieldAdd(field.id)}
                    className="w-full text-left p-2 text-sm bg-gray-50 hover:bg-gray-100 rounded"
                  >
                    {field.label}
                  </button>
                ))}
            </div>
          </div>
        </div>

        {/* Style Configuration */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Estilo</h4>
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showTitle"
                checked={visualization.config.showTitle !== false}
                onChange={(e) => onUpdate({
                  config: { ...visualization.config, showTitle: e.target.checked }
                })}
                className="mr-2"
              />
              <label htmlFor="showTitle" className="text-sm text-gray-600">
                Mostrar título
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="showBorder"
                checked={visualization.config.border !== false}
                onChange={(e) => onUpdate({
                  config: { ...visualization.config, border: e.target.checked }
                })}
                className="mr-2"
              />
              <label htmlFor="showBorder" className="text-sm text-gray-600">
                Mostrar borde
              </label>
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Color de fondo
              </label>
              <input
                type="color"
                value={visualization.config.backgroundColor || '#ffffff'}
                onChange={(e) => onUpdate({
                  config: { ...visualization.config, backgroundColor: e.target.value }
                })}
                className="w-full h-8 border border-gray-300 rounded"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Main ReportBuilder Component
export const ReportBuilder: React.FC<ReportBuilderProps> = ({
  templateId,
  onSave,
  onPreview,
  onExport,
  className = ''
}) => {
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false)
  const [showVisualizationEditor, setShowVisualizationEditor] = useState(false)

  const {
    currentTemplate,
    isEditing,
    isDirty,
    selectedVisualization,
    dataSources,
    createTemplate,
    loadTemplate,
    saveTemplate,
    addVisualization,
    updateVisualization,
    removeVisualization,
    selectVisualization,
    getFieldsForDataSource,
    executeReport,
    validateTemplate,
    hasUnsavedChanges,
    canAddVisualization
  } = useReportBuilder({
    enableRealTimePreview: true,
    enableAutoSave: true,
    onTemplateChange: onSave,
    onExecutionComplete: (execution) => {
      toast.success('Reporte generado exitosamente')
    }
  })

  // Initialize with template if provided
  useEffect(() => {
    if (templateId && !currentTemplate) {
      loadTemplate(templateId)
    }
  }, [templateId, currentTemplate, loadTemplate])

  const handleCreateNewTemplate = useCallback(() => {
    const name = prompt('Nombre del nuevo reporte:')
    if (name) {
      createTemplate(name)
      setShowTemplateLibrary(false)
    }
  }, [createTemplate])

  const handleSaveTemplate = useCallback(async () => {
    if (!currentTemplate) return

    const validation = validateTemplate(currentTemplate)
    if (!validation.valid) {
      toast.error(`Errores de validación: ${validation.errors.join(', ')}`)
      return
    }

    const success = await saveTemplate()
    if (success) {
      onSave?.(currentTemplate)
    }
  }, [currentTemplate, saveTemplate, validateTemplate, onSave])

  const handleExportReport = useCallback((format: 'pdf' | 'excel' | 'csv') => {
    if (!currentTemplate) return
    
    executeReport(currentTemplate.id, [], format)
    onExport?.(currentTemplate.id, format)
  }, [currentTemplate, executeReport, onExport])

  const selectedVisualizationData = currentTemplate?.visualizations.find(
    v => v.id === selectedVisualization
  )

  const allAvailableFields = Object.values(dataSources).flat()

  if (!currentTemplate) {
    return (
      <div className={`h-full flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Crear Nuevo Reporte
          </h2>
          <div className="space-x-4">
            <button
              onClick={handleCreateNewTemplate}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Crear Desde Cero
            </button>
            <button
              onClick={() => setShowTemplateLibrary(true)}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Usar Plantilla
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={`h-full flex flex-col ${className}`}>
        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">
                {currentTemplate.name}
                {isDirty && <span className="text-orange-500 ml-2">*</span>}
              </h1>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSaveTemplate}
                  disabled={!isDirty}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${isDirty 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }
                  `}
                >
                  💾 Guardar
                </button>
                <button
                  onClick={() => onPreview?.(currentTemplate)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  👀 Vista Previa
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative">
                <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium">
                  📤 Exportar
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg hidden">
                  <button 
                    onClick={() => handleExportReport('pdf')}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50"
                  >
                    📄 PDF
                  </button>
                  <button 
                    onClick={() => handleExportReport('excel')}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50"
                  >
                    📊 Excel
                  </button>
                  <button 
                    onClick={() => handleExportReport('csv')}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50"
                  >
                    📋 CSV
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Fields and Tools */}
          <div className="w-80 bg-gray-50 border-r border-gray-200 overflow-y-auto">
            <div className="p-4">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Campos de Datos</h2>
              
              {/* Add Visualization Buttons */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Agregar Visualización</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { type: 'table', icon: '📋', label: 'Tabla' },
                    { type: 'chart', icon: '📊', label: 'Gráfico' },
                    { type: 'metric', icon: '🎯', label: 'Métrica' },
                    { type: 'pivot', icon: '🔄', label: 'Pivot' }
                  ].map(({ type, icon, label }) => (
                    <button
                      key={type}
                      onClick={() => {
                        if (canAddVisualization()) {
                          const viz = addVisualization(type as any)
                          if (viz) selectVisualization(viz.id)
                        }
                      }}
                      disabled={!canAddVisualization()}
                      className={`
                        p-3 text-sm border rounded-lg transition-colors
                        ${canAddVisualization()
                          ? 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                          : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                        }
                      `}
                    >
                      <div className="text-lg mb-1">{icon}</div>
                      <div>{label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Data Sources */}
              {Object.entries(dataSources).map(([sourceName, fields]) => (
                <div key={sourceName} className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3 capitalize">
                    {sourceName}
                  </h3>
                  <div className="space-y-2">
                    {fields.map((field) => (
                      <DraggableField key={field.id} field={field} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Canvas */}
          <div className="flex-1 flex flex-col">
            <DroppableCanvas
              template={currentTemplate}
              selectedVisualization={selectedVisualization}
              onVisualizationUpdate={updateVisualization}
              onVisualizationSelect={selectVisualization}
              onVisualizationDelete={removeVisualization}
            />
          </div>

          {/* Right Sidebar - Visualization Editor */}
          {selectedVisualizationData && (
            <VisualizationEditor
              visualization={selectedVisualizationData}
              availableFields={allAvailableFields}
              onUpdate={(updates) => updateVisualization(selectedVisualizationData.id, updates)}
              onClose={() => selectVisualization(null)}
            />
          )}
        </div>

        {/* Status Bar */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-2">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <span>
                Visualizaciones: {currentTemplate.visualizations.length}
              </span>
              <span>
                Campos totales: {allAvailableFields.length}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              {hasUnsavedChanges && (
                <span className="text-orange-600">Cambios sin guardar</span>
              )}
              <span>
                Última modificación: {new Date(currentTemplate.metadata.lastModified).toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  )
}

export default ReportBuilder