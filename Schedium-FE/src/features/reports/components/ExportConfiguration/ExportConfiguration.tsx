/**
 * ExportConfiguration Component - Advanced export settings and format options
 * Comprehensive export configuration with scheduling and email integration
 */

import React, { useState, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { ReportTemplate, ReportFilter } from '../../hooks/useReportBuilder'

interface ExportConfigurationProps {
  template: ReportTemplate
  onExport: (config: ExportConfig) => void
  onCancel: () => void
  className?: string
}

interface ExportConfig {
  format: 'pdf' | 'excel' | 'csv' | 'json' | 'powerpoint'
  filename?: string
  filters: ReportFilter[]
  scheduling?: {
    enabled: boolean
    frequency: 'once' | 'daily' | 'weekly' | 'monthly' | 'quarterly'
    time: string
    date?: string
    dayOfWeek?: number
    dayOfMonth?: number
    recipients: string[]
    subject?: string
    message?: string
  }
  formatting?: {
    orientation?: 'portrait' | 'landscape'
    pageSize?: 'A4' | 'A3' | 'Letter' | 'Legal'
    includeHeader?: boolean
    includeFooter?: boolean
    includeWatermark?: boolean
    compress?: boolean
    password?: string
  }
  dataOptions?: {
    includeRawData?: boolean
    aggregateData?: boolean
    includeFilters?: boolean
    includeMetadata?: boolean
    dateFormat?: string
    numberFormat?: string
  }
  delivery?: {
    method: 'download' | 'email' | 'storage' | 'webhook'
    webhook?: {
      url: string
      headers?: Record<string, string>
    }
    storage?: {
      provider: 'cloud' | 'network'
      path: string
    }
  }
}

// Format Configuration Component
interface FormatConfigProps {
  config: ExportConfig
  onChange: (updates: Partial<ExportConfig>) => void
}

const FormatConfig: React.FC<FormatConfigProps> = ({ config, onChange }) => {
  const formats = [
    { value: 'pdf', label: 'PDF', icon: '📄', description: 'Documento portable con diseño fijo' },
    { value: 'excel', label: 'Excel', icon: '📊', description: 'Hoja de cálculo editable con fórmulas' },
    { value: 'csv', label: 'CSV', icon: '📋', description: 'Datos tabulares simples' },
    { value: 'powerpoint', label: 'PowerPoint', icon: '📈', description: 'Presentación con diapositivas' },
    { value: 'json', label: 'JSON', icon: '🔧', description: 'Datos estructurados para APIs' }
  ]

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Formato de Exportación</h3>
      
      {/* Format Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {formats.map((format) => (
          <button
            key={format.value}
            onClick={() => onChange({ format: format.value as any })}
            className={`
              p-4 border rounded-lg text-left transition-all duration-200 hover:shadow-md
              ${config.format === format.value 
                ? 'border-blue-500 bg-blue-50 shadow-md' 
                : 'border-gray-200 hover:border-gray-300'
              }
            `}
          >
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-2xl">{format.icon}</span>
              <span className="font-medium text-gray-900">{format.label}</span>
            </div>
            <p className="text-sm text-gray-600">{format.description}</p>
          </button>
        ))}
      </div>

      {/* Format-specific options */}
      {config.format === 'pdf' && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">Opciones de PDF</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Orientación
              </label>
              <select
                value={config.formatting?.orientation || 'portrait'}
                onChange={(e) => onChange({
                  formatting: { ...config.formatting, orientation: e.target.value as any }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="portrait">Vertical</option>
                <option value="landscape">Horizontal</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tamaño de Página
              </label>
              <select
                value={config.formatting?.pageSize || 'A4'}
                onChange={(e) => onChange({
                  formatting: { ...config.formatting, pageSize: e.target.value as any }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="A4">A4</option>
                <option value="A3">A3</option>
                <option value="Letter">Carta</option>
                <option value="Legal">Legal</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4 space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.formatting?.includeHeader !== false}
                onChange={(e) => onChange({
                  formatting: { ...config.formatting, includeHeader: e.target.checked }
                })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Incluir encabezado</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.formatting?.includeFooter !== false}
                onChange={(e) => onChange({
                  formatting: { ...config.formatting, includeFooter: e.target.checked }
                })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Incluir pie de página</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.formatting?.includeWatermark || false}
                onChange={(e) => onChange({
                  formatting: { ...config.formatting, includeWatermark: e.target.checked }
                })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Incluir marca de agua</span>
            </label>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Proteger con contraseña (opcional)
            </label>
            <input
              type="password"
              placeholder="Dejar vacío para no proteger"
              value={config.formatting?.password || ''}
              onChange={(e) => onChange({
                formatting: { ...config.formatting, password: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>
      )}

      {config.format === 'excel' && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">Opciones de Excel</h4>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.dataOptions?.includeRawData !== false}
                onChange={(e) => onChange({
                  dataOptions: { ...config.dataOptions, includeRawData: e.target.checked }
                })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Incluir datos sin procesar</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.dataOptions?.aggregateData || false}
                onChange={(e) => onChange({
                  dataOptions: { ...config.dataOptions, aggregateData: e.target.checked }
                })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Incluir datos agregados</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.formatting?.compress || false}
                onChange={(e) => onChange({
                  formatting: { ...config.formatting, compress: e.target.checked }
                })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Comprimir archivo</span>
            </label>
          </div>
        </div>
      )}
    </div>
  )
}

// Scheduling Configuration Component
interface SchedulingConfigProps {
  config: ExportConfig
  onChange: (updates: Partial<ExportConfig>) => void
}

const SchedulingConfig: React.FC<SchedulingConfigProps> = ({ config, onChange }) => {
  const [emailList, setEmailList] = useState('')

  const handleEmailAdd = () => {
    if (emailList.trim()) {
      const emails = emailList.split(',').map(e => e.trim()).filter(e => e)
      onChange({
        scheduling: {
          ...config.scheduling,
          enabled: true,
          recipients: [...(config.scheduling?.recipients || []), ...emails]
        }
      })
      setEmailList('')
    }
  }

  const handleEmailRemove = (email: string) => {
    onChange({
      scheduling: {
        ...config.scheduling,
        recipients: config.scheduling?.recipients?.filter(e => e !== email) || []
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Programación Automática</h3>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={config.scheduling?.enabled || false}
            onChange={(e) => onChange({
              scheduling: { ...config.scheduling, enabled: e.target.checked }
            })}
            className="mr-2"
          />
          <span className="text-sm font-medium text-gray-700">Habilitar programación</span>
        </label>
      </div>

      {config.scheduling?.enabled && (
        <div className="bg-blue-50 p-4 rounded-lg space-y-4">
          {/* Frequency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Frecuencia
            </label>
            <select
              value={config.scheduling.frequency || 'once'}
              onChange={(e) => onChange({
                scheduling: { ...config.scheduling, frequency: e.target.value as any }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="once">Una vez</option>
              <option value="daily">Diario</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensual</option>
              <option value="quarterly">Trimestral</option>
            </select>
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hora
              </label>
              <input
                type="time"
                value={config.scheduling.time || '09:00'}
                onChange={(e) => onChange({
                  scheduling: { ...config.scheduling, time: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            {config.scheduling.frequency === 'once' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha
                </label>
                <input
                  type="date"
                  value={config.scheduling.date || ''}
                  onChange={(e) => onChange({
                    scheduling: { ...config.scheduling, date: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            )}

            {config.scheduling.frequency === 'weekly' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Día de la semana
                </label>
                <select
                  value={config.scheduling.dayOfWeek || 1}
                  onChange={(e) => onChange({
                    scheduling: { ...config.scheduling, dayOfWeek: parseInt(e.target.value) }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value={1}>Lunes</option>
                  <option value={2}>Martes</option>
                  <option value={3}>Miércoles</option>
                  <option value={4}>Jueves</option>
                  <option value={5}>Viernes</option>
                  <option value={6}>Sábado</option>
                  <option value={0}>Domingo</option>
                </select>
              </div>
            )}

            {config.scheduling.frequency === 'monthly' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Día del mes
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={config.scheduling.dayOfMonth || 1}
                  onChange={(e) => onChange({
                    scheduling: { ...config.scheduling, dayOfMonth: parseInt(e.target.value) }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            )}
          </div>

          {/* Email Configuration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Destinatarios de Email
            </label>
            
            {/* Add emails */}
            <div className="flex space-x-2 mb-3">
              <input
                type="email"
                placeholder="correo@ejemplo.com, otro@ejemplo.com"
                value={emailList}
                onChange={(e) => setEmailList(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
              />
              <button
                onClick={handleEmailAdd}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Agregar
              </button>
            </div>

            {/* Email list */}
            {config.scheduling.recipients && config.scheduling.recipients.length > 0 && (
              <div className="space-y-2">
                {config.scheduling.recipients.map((email, index) => (
                  <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                    <span className="text-sm">{email}</span>
                    <button
                      onClick={() => handleEmailRemove(email)}
                      className="text-red-600 hover:text-red-800"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Email customization */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Asunto del email
              </label>
              <input
                type="text"
                placeholder="Reporte automático - {{template_name}}"
                value={config.scheduling.subject || ''}
                onChange={(e) => onChange({
                  scheduling: { ...config.scheduling, subject: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mensaje del email
              </label>
              <textarea
                rows={3}
                placeholder="Adjunto encontrarás el reporte generado automáticamente..."
                value={config.scheduling.message || ''}
                onChange={(e) => onChange({
                  scheduling: { ...config.scheduling, message: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Filter Configuration Component
interface FilterConfigProps {
  template: ReportTemplate
  filters: ReportFilter[]
  onChange: (filters: ReportFilter[]) => void
}

const FilterConfig: React.FC<FilterConfigProps> = ({ template, filters, onChange }) => {
  const availableFields = ['program_name', 'instructor_name', 'classroom_name', 'schedule_day']

  const addFilter = () => {
    const newFilter: ReportFilter = {
      id: `filter-${Date.now()}`,
      field: availableFields[0],
      operator: 'equals',
      value: '',
      dataType: 'string',
      label: 'Nuevo filtro'
    }
    onChange([...filters, newFilter])
  }

  const updateFilter = (index: number, updates: Partial<ReportFilter>) => {
    const updatedFilters = filters.map((filter, i) => 
      i === index ? { ...filter, ...updates } : filter
    )
    onChange(updatedFilters)
  }

  const removeFilter = (index: number) => {
    onChange(filters.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Filtros de Datos</h3>
        <button
          onClick={addFilter}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
        >
          ➕ Agregar Filtro
        </button>
      </div>

      {filters.length === 0 ? (
        <div className="text-center py-6 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No hay filtros configurados</p>
          <p className="text-sm text-gray-400 mt-1">
            Los filtros te permiten exportar solo datos específicos
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filters.map((filter, index) => (
            <div key={filter.id} className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-12 gap-3 items-end">
                <div className="col-span-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Campo
                  </label>
                  <select
                    value={filter.field}
                    onChange={(e) => updateFilter(index, { field: e.target.value })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  >
                    {availableFields.map(field => (
                      <option key={field} value={field}>{field}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Operador
                  </label>
                  <select
                    value={filter.operator}
                    onChange={(e) => updateFilter(index, { operator: e.target.value as any })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  >
                    <option value="equals">Igual a</option>
                    <option value="not_equals">Diferente a</option>
                    <option value="contains">Contiene</option>
                    <option value="not_contains">No contiene</option>
                    <option value="in">En lista</option>
                    <option value="not_in">No en lista</option>
                  </select>
                </div>

                <div className="col-span-5">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Valor
                  </label>
                  <input
                    type="text"
                    value={filter.value}
                    onChange={(e) => updateFilter(index, { value: e.target.value })}
                    placeholder="Valor del filtro"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                </div>

                <div className="col-span-2">
                  <button
                    onClick={() => removeFilter(index)}
                    className="w-full px-2 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Main ExportConfiguration Component
export const ExportConfiguration: React.FC<ExportConfigurationProps> = ({
  template,
  onExport,
  onCancel,
  className = ''
}) => {
  const [config, setConfig] = useState<ExportConfig>({
    format: 'pdf',
    filename: `${template.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`,
    filters: [],
    delivery: { method: 'download' }
  })

  const [currentTab, setCurrentTab] = useState<'format' | 'filters' | 'scheduling'>('format')

  const updateConfig = useCallback((updates: Partial<ExportConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }))
  }, [])

  const handleExport = useCallback(() => {
    // Validate configuration
    if (!config.format) {
      toast.error('Selecciona un formato de exportación')
      return
    }

    if (config.scheduling?.enabled) {
      if (!config.scheduling.recipients?.length) {
        toast.error('Agrega al menos un destinatario de email')
        return
      }
      
      if (config.scheduling.frequency === 'once' && !config.scheduling.date) {
        toast.error('Selecciona una fecha para la exportación programada')
        return
      }
    }

    onExport(config)
    toast.success('Configuración de exportación aplicada')
  }, [config, onExport])

  const tabs = [
    { id: 'format', label: 'Formato', icon: '📄' },
    { id: 'filters', label: 'Filtros', icon: '🔍' },
    { id: 'scheduling', label: 'Programación', icon: '📅' }
  ]

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Configurar Exportación
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Plantilla: {template.name}
          </p>
        </div>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id as any)}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${currentTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6 max-h-96 overflow-y-auto">
        {currentTab === 'format' && (
          <FormatConfig config={config} onChange={updateConfig} />
        )}
        {currentTab === 'filters' && (
          <FilterConfig 
            template={template}
            filters={config.filters}
            onChange={(filters) => updateConfig({ filters })}
          />
        )}
        {currentTab === 'scheduling' && (
          <SchedulingConfig config={config} onChange={updateConfig} />
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
        <div className="text-sm text-gray-600">
          <span className="font-medium">Archivo:</span> {config.filename}
          {config.filters.length > 0 && (
            <span className="ml-4">
              <span className="font-medium">Filtros:</span> {config.filters.length}
            </span>
          )}
          {config.scheduling?.enabled && (
            <span className="ml-4 text-blue-600">
              📅 Programado
            </span>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleExport}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            {config.scheduling?.enabled ? '📅 Programar Exportación' : '📤 Exportar Ahora'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ExportConfiguration