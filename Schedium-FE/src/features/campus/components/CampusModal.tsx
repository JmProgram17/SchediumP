import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Building, MapPin, Phone, Mail, Save, AlertCircle } from 'lucide-react'

import { Button, Card } from '@/design-system/components'
import { useCreateCampus, useUpdateCampus } from '../hooks'
import type { Campus, CampusCreate, CampusUpdate } from '../types'

// Schema de validación
const campusSchema = z.object({
  name: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  address: z.string()
    .min(5, 'La dirección debe tener al menos 5 caracteres')
    .max(255, 'La dirección no puede exceder 255 caracteres'),
  phone_number: z.string()
    .optional()
    .refine((val) => !val || val.length >= 7, {
      message: 'El teléfono debe tener al menos 7 caracteres'
    }),
  email: z.string()
    .optional()
    .refine((val) => !val || z.string().email().safeParse(val).success, {
      message: 'Debe ser un email válido'
    })
})

type CampusFormData = z.infer<typeof campusSchema>

interface CampusModalProps {
  isOpen: boolean
  onClose: () => void
  campus?: Campus | null
  mode: 'create' | 'edit'
}

export function CampusModal({ isOpen, onClose, campus, mode }: CampusModalProps) {
  const createCampus = useCreateCampus()
  const updateCampus = useUpdateCampus()

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    reset,
    setValue,
    watch
  } = useForm<CampusFormData>({
    resolver: zodResolver(campusSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      address: '',
      phone_number: '',
      email: ''
    }
  })

  // Resetear formulario cuando cambia el campus o se abre/cierra el modal
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && campus) {
        reset({
          name: campus.name,
          address: campus.address,
          phone_number: campus.phone_number || '',
          email: campus.email || ''
        })
      } else {
        reset({
          name: '',
          address: '',
          phone_number: '',
          email: ''
        })
      }
    }
  }, [isOpen, campus, mode, reset])

  const onSubmit = async (data: CampusFormData) => {
    try {
      if (mode === 'create') {
        await createCampus.mutateAsync(data as CampusCreate)
      } else if (mode === 'edit' && campus) {
        await updateCampus.mutateAsync({
          id: campus.campus_id,
          campus: data as CampusUpdate
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

  const isSubmitting = createCampus.isPending || updateCampus.isPending

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
                    <Building className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      {mode === 'create' ? 'Nueva Sede' : 'Editar Sede'}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {mode === 'create' 
                        ? 'Completa la información para crear una nueva sede'
                        : 'Modifica la información de la sede'
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
                <div className="space-y-6">
                  {/* Nombre */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nombre de la Sede <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        {...register('name')}
                        type="text"
                        placeholder="Ej: Sede Central"
                        className={`w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
                          errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        }`}
                      />
                    </div>
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.name.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Dirección */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Dirección <span className="text-red-500 ml-1">*</span>
                  </label>
                  <textarea
                    {...register('address')}
                    rows={2}
                    placeholder="Ej: Calle 52 # 13-65"
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none ${
                      errors.address ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {errors.address && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.address.message}
                    </p>
                  )}
                </div>

                {/* Información de contacto */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Teléfono */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Teléfono
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        {...register('phone_number')}
                        type="text"
                        placeholder="(5) 5461500"
                        className={`w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
                          errors.phone_number ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        }`}
                      />
                    </div>
                    {errors.phone_number && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.phone_number.message}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        {...register('email')}
                        type="email"
                        placeholder="sede@sena.edu.co"
                        className={`w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
                          errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        }`}
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.email.message}
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
                    {mode === 'create' ? 'Crear Sede' : 'Guardar Cambios'}
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