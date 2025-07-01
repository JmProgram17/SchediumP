import React from 'react'
import { Clock, Calendar, Info } from 'lucide-react'
import { useActiveScheduleConfig, useUpdateScheduleConfig } from '@/services/query/hooks/academic-config.hooks'
import type { AcademicScheduleConfigUpdate } from '@/services/api/academic-config.api'
import { cn } from '@/utils/cn'

interface ScheduleConfigSettingsProps {
  onUpdate?: () => void
}

export const ScheduleConfigSettings: React.FC<ScheduleConfigSettingsProps> = ({ onUpdate }) => {
  const { data: configData, isLoading, error } = useActiveScheduleConfig()
  const updateConfigMutation = useUpdateScheduleConfig()

  const [formData, setFormData] = React.useState<AcademicScheduleConfigUpdate>({
    day_start_time: '',
    day_end_time: '',
    min_class_duration_minutes: 60,
    max_class_duration_minutes: 240
  })

  const [isDirty, setIsDirty] = React.useState(false)

  React.useEffect(() => {
    if (configData?.config) {
      setFormData({
        day_start_time: configData.config.day_start_time,
        day_end_time: configData.config.day_end_time,
        min_class_duration_minutes: configData.config.min_class_duration_minutes,
        max_class_duration_minutes: configData.config.max_class_duration_minutes
      })
    }
  }, [configData])

  const handleChange = (field: keyof AcademicScheduleConfigUpdate, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    setIsDirty(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await updateConfigMutation.mutateAsync(formData)
      setIsDirty(false)
      onUpdate?.()
    } catch (error) {
      console.error('Error updating schedule config:', error)
    }
  }

  const handleReset = () => {
    if (configData?.config) {
      setFormData({
        day_start_time: configData.config.day_start_time,
        day_end_time: configData.config.day_end_time,
        min_class_duration_minutes: configData.config.min_class_duration_minutes,
        max_class_duration_minutes: configData.config.max_class_duration_minutes
      })
      setIsDirty(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Error al cargar la configuración de horarios</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Configuración de Horarios Académicos
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Define los parámetros globales para la gestión de horarios en la institución
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Day Time Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hora de inicio del día
              <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="time"
                value={formData.day_start_time}
                onChange={(e) => handleChange('day_start_time', e.target.value)}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Hora más temprana para programar clases
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hora de fin del día
              <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="time"
                value={formData.day_end_time}
                onChange={(e) => handleChange('day_end_time', e.target.value)}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Hora más tardía para terminar clases
            </p>
          </div>
        </div>

        {/* Duration Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duración mínima de clase (minutos)
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="number"
              min="30"
              max="300"
              value={formData.min_class_duration_minutes}
              onChange={(e) => handleChange('min_class_duration_minutes', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Tiempo mínimo para una sesión de clase
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duración máxima de clase (minutos)
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="number"
              min="60"
              max="480"
              value={formData.max_class_duration_minutes}
              onChange={(e) => handleChange('max_class_duration_minutes', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Tiempo máximo para una sesión de clase
            </p>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Información importante</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Estos valores se aplicarán a toda la institución</li>
              <li>Los bloques de tiempo deben estar dentro del rango del día académico</li>
              <li>La duración mínima debe ser menor o igual a la duración máxima</li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={handleReset}
            disabled={!isDirty || updateConfigMutation.isPending}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md transition-colors",
              isDirty && !updateConfigMutation.isPending
                ? "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                : "text-gray-400 bg-gray-100 border border-gray-200 cursor-not-allowed"
            )}
          >
            Cancelar cambios
          </button>
          <button
            type="submit"
            disabled={!isDirty || updateConfigMutation.isPending}
            className={cn(
              "px-4 py-2 text-sm font-medium text-white rounded-md transition-colors",
              isDirty && !updateConfigMutation.isPending
                ? "bg-primary hover:bg-primary-600 shadow-sm"
                : "bg-gray-400 cursor-not-allowed"
            )}
          >
            {updateConfigMutation.isPending ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Guardando...
              </span>
            ) : (
              'Guardar cambios'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ScheduleConfigSettings