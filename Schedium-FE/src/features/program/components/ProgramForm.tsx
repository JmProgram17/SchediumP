/**
 * ProgramForm Component - Professional form following established pattern
 * Implements create/edit functionality with Zod validation and accessibility
 */

import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Save } from 'lucide-react'

import { Button } from '@/design-system/components/Button'
import { Input } from '@/design-system/components/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/design-system/components/Card'
import { LoadingSpinner } from '@/design-system/components/LoadingSpinner'
import { useCreateProgram, useUpdateProgram } from '../hooks'
import { Program, ProgramStatus, ProgramLevel, ProgramModality } from '../types'

// Validation schema
const programSchema = z.object({
  code: z.string().min(2).max(20).regex(/^[A-Z0-9-]+$/),
  name: z.string().min(3).max(200),
  description: z.string().max(500).optional(),
  duration: z.number().min(1).max(120),
  modality: z.nativeEnum(ProgramModality),
  level: z.nativeEnum(ProgramLevel),
  department: z.string().min(2).max(100),
  status: z.nativeEnum(ProgramStatus)
})

type ProgramFormData = z.infer<typeof programSchema>

interface ProgramFormProps {
  program?: Program | null
  onClose: () => void
  onSuccess: () => void
}

export const ProgramForm: React.FC<ProgramFormProps> = ({
  program,
  onClose,
  onSuccess
}) => {
  const isEditing = !!program
  const createProgram = useCreateProgram()
  const updateProgram = useUpdateProgram()

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    setValue,
    watch
  } = useForm<ProgramFormData>({
    resolver: zodResolver(programSchema),
    mode: 'onChange',
    defaultValues: {
      status: ProgramStatus.ACTIVE,
      modality: ProgramModality.PRESENCIAL,
      level: ProgramLevel.TECNICO,
      duration: 24
    }
  })

  // Load program data for editing
  useEffect(() => {
    if (program) {
      Object.entries(program).forEach(([key, value]) => {
        setValue(key as keyof ProgramFormData, value)
      })
    }
  }, [program, setValue])

  const onSubmit = async (data: ProgramFormData) => {
    try {
      if (isEditing && program) {
        await updateProgram.mutateAsync({ id: program.id, data })
      } else {
        await createProgram.mutateAsync(data)
      }
      onSuccess()
    } catch (error) {
      console.error('Error saving program:', error)
    }
  }

  const isLoading = createProgram.isPending || updateProgram.isPending

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-2xl max-h-[90vh] overflow-auto"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle>
                {isEditing ? 'Editar Programa' : 'Nuevo Programa Académico'}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Código *"
                    {...register('code')}
                    error={errors.code?.message}
                    disabled={isLoading}
                    placeholder="Ej: ADSI-2024"
                    maxLength={20}
                  />

                  <Input
                    label="Duración (meses) *"
                    type="number"
                    {...register('duration', { valueAsNumber: true })}
                    error={errors.duration?.message}
                    disabled={isLoading}
                    min={1}
                    max={120}
                  />
                </div>

                <Input
                  label="Nombre del Programa *"
                  {...register('name')}
                  error={errors.name?.message}
                  disabled={isLoading}
                  placeholder="Ej: Análisis y Desarrollo de Sistemas de Información"
                  maxLength={200}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    {...register('description')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                    disabled={isLoading}
                    placeholder="Descripción del programa académico..."
                    maxLength={500}
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                {/* Academic Configuration */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nivel *
                    </label>
                    <select
                      {...register('level')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isLoading}
                    >
                      {Object.values(ProgramLevel).map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                    {errors.level && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.level.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Modalidad *
                    </label>
                    <select
                      {...register('modality')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isLoading}
                    >
                      {Object.values(ProgramModality).map((modality) => (
                        <option key={modality} value={modality}>
                          {modality}
                        </option>
                      ))}
                    </select>
                    {errors.modality && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.modality.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado *
                    </label>
                    <select
                      {...register('status')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isLoading}
                    >
                      {Object.values(ProgramStatus).map((status) => (
                        <option key={status} value={status}>
                          {status === 'ACTIVE' ? 'Activo' : 
                           status === 'INACTIVE' ? 'Inactivo' : 'Suspendido'}
                        </option>
                      ))}
                    </select>
                    {errors.status && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.status.message}
                      </p>
                    )}
                  </div>
                </div>

                <Input
                  label="Departamento *"
                  {...register('department')}
                  error={errors.department?.message}
                  disabled={isLoading}
                  placeholder="Ej: Tecnologías de la Información"
                  maxLength={100}
                />

                {/* Form Actions */}
                <div className="flex items-center justify-end gap-3 pt-6 border-t">
                  <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                    Cancelar
                  </Button>
                  
                  <Button type="submit" disabled={!isValid || isLoading} className="min-w-[120px]">
                    {isLoading ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        {isEditing ? 'Actualizar' : 'Crear'}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}