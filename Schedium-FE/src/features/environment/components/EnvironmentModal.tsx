import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Home, 
  Hash, 
  MapPin, 
  Save, 
  AlertCircle 
} from 'lucide-react'

import { Button, Card } from '@/design-system/components'
import { useCreateEnvironment, useUpdateEnvironment } from '../hooks'
import { useCampusOptions } from '../../campus/hooks'
import type { Environment } from '../types'

// Schema de validación para backend (classroom structure)
const environmentSchema = z.object({
  room_number: z.string()
    .min(2, 'El código debe tener al menos 2 caracteres')
    .max(20, 'El código no puede exceder 20 caracteres')
    .regex(/^[A-Z0-9-]+$/, 'El código solo puede contener letras mayúsculas, números y guiones'),
  campus_id: z.number({
    required_error: 'Debe seleccionar una sede'
  }).min(1, 'Debe seleccionar una sede')
})

type EnvironmentFormData = z.infer<typeof environmentSchema>

interface EnvironmentModalProps {
  isOpen: boolean
  onClose: () => void
  environment?: Environment | null
  mode: 'create' | 'edit'
}


export function EnvironmentModal({ isOpen, onClose, environment, mode }: EnvironmentModalProps) {
  const createEnvironment = useCreateEnvironment()
  const updateEnvironment = useUpdateEnvironment()
  const { data: campusOptions = [], isLoading: loadingCampuses } = useCampusOptions()

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    reset,
    setValue,
    watch
  } = useForm<EnvironmentFormData>({
    resolver: zodResolver(environmentSchema),
    mode: 'onChange',
    defaultValues: {
      classroom_type: 'Standard'
    }
  })

  // Resetear formulario cuando cambia el environment o se abre/cierra el modal
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && environment) {
        reset({
          room_number: environment.room_number,
          campus_id: environment.campus_id
        })
      } else {
        reset({
          room_number: '',
          campus_id: undefined
        })
      }
    }
  }, [isOpen, environment, mode, reset])

  const onSubmit = async (data: EnvironmentFormData) => {
    try {
      if (mode === 'create') {
        await createEnvironment.mutateAsync(data)
      } else if (mode === 'edit' && environment) {
        await updateEnvironment.mutateAsync({
          id: environment.classroom_id,
          environment: data
        })
      }
      onClose()
    } catch (error) {
      // Error ya manejado en los hooks
    }
  }

  const handleClose = () => {
    if (isDirty && !window.confirm('¿Estás seguro de cerrar? Los cambios no guardados se perderán.')) {
      return
    }
    onClose()
  }

  const isSubmitting = createEnvironment.isPending || updateEnvironment.isPending

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        />

        {/* Modal */}
        <div className="flex min-h-full items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-2xl"
          >
            <Card className="relative">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Home className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      {mode === 'create' ? 'Nuevo Ambiente' : 'Editar Ambiente'}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {mode === 'create' 
                        ? 'Completa la información para crear un nuevo ambiente'
                        : 'Modifica la información del ambiente'
                      }
                    </p>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                {/* Información básica */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Código */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Código del Aula <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        {...register('room_number')}
                        type="text"
                        placeholder="A-101"
                        className={`w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 uppercase ${
                          errors.room_number ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        }`}
                        onChange={(e) => {
                          e.target.value = e.target.value.toUpperCase()
                        }}
                      />
                    </div>
                    {errors.room_number && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.room_number.message}
                      </p>
                    )}
                  </div>


                  {/* Sede */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Sede <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <select
                        {...register('campus_id', { valueAsNumber: true })}
                        disabled={loadingCampuses}
                        className={`w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
                          errors.campus_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        <option value="">
                          {loadingCampuses ? 'Cargando sedes...' : 'Seleccionar sede'}
                        </option>
                        {campusOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    {errors.campus_id && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.campus_id.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                  
                  <Button
                    type="submit"
                    disabled={!isValid || isSubmitting}
                    className="flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {mode === 'create' ? 'Crear Ambiente' : 'Guardar Cambios'}
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  )
}