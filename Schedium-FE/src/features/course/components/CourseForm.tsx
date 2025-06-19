/**
 * CourseForm Component - Professional form following established pattern
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
import { useCreateCourse, useUpdateCourse } from '../hooks'
import { useProgramList } from '@/features/program/hooks'
import { Course, CourseStatus } from '../types'

// Validation schema
const courseSchema = z.object({
  code: z.string().min(2).max(20).regex(/^[A-Z0-9-]+$/),
  name: z.string().min(3).max(200),
  description: z.string().max(500).optional(),
  credits: z.number().min(1).max(20),
  hours: z.number().min(1).max(200),
  semester: z.number().min(1).max(12),
  programId: z.string().min(1),
  prerequisites: z.array(z.string()).optional(),
  status: z.nativeEnum(CourseStatus)
})

type CourseFormData = z.infer<typeof courseSchema>

interface CourseFormProps {
  course?: Course | null
  onClose: () => void
  onSuccess: () => void
}

export const CourseForm: React.FC<CourseFormProps> = ({
  course,
  onClose,
  onSuccess
}) => {
  const isEditing = !!course
  const createCourse = useCreateCourse()
  const updateCourse = useUpdateCourse()
  const { data: programsData } = useProgramList({ limit: 100 })

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    setValue,
    watch
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    mode: 'onChange',
    defaultValues: {
      status: CourseStatus.ACTIVE,
      credits: 3,
      hours: 48,
      semester: 1,
      prerequisites: []
    }
  })

  // Load course data for editing
  useEffect(() => {
    if (course) {
      Object.entries(course).forEach(([key, value]) => {
        setValue(key as keyof CourseFormData, value)
      })
    }
  }, [course, setValue])

  const onSubmit = async (data: CourseFormData) => {
    try {
      if (isEditing && course) {
        await updateCourse.mutateAsync({ id: course.id, data })
      } else {
        await createCourse.mutateAsync(data)
      }
      onSuccess()
    } catch (error) {
      console.error('Error saving course:', error)
    }
  }

  const isLoading = createCourse.isPending || updateCourse.isPending

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
                {isEditing ? 'Editar Curso' : 'Nuevo Curso'}
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
                    placeholder="Ej: PROG-101"
                    maxLength={20}
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Programa *
                    </label>
                    <select
                      {...register('programId')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isLoading}
                    >
                      <option value="">Seleccione un programa</option>
                      {programsData?.data?.map((program) => (
                        <option key={program.id} value={program.id}>
                          {program.name}
                        </option>
                      ))}
                    </select>
                    {errors.programId && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.programId.message}
                      </p>
                    )}
                  </div>
                </div>

                <Input
                  label="Nombre del Curso *"
                  {...register('name')}
                  error={errors.name?.message}
                  disabled={isLoading}
                  placeholder="Ej: Programación Básica"
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
                    placeholder="Descripción del curso..."
                    maxLength={500}
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                {/* Academic Information */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Input
                    label="Créditos *"
                    type="number"
                    {...register('credits', { valueAsNumber: true })}
                    error={errors.credits?.message}
                    disabled={isLoading}
                    min={1}
                    max={20}
                  />

                  <Input
                    label="Horas *"
                    type="number"
                    {...register('hours', { valueAsNumber: true })}
                    error={errors.hours?.message}
                    disabled={isLoading}
                    min={1}
                    max={200}
                  />

                  <Input
                    label="Semestre *"
                    type="number"
                    {...register('semester', { valueAsNumber: true })}
                    error={errors.semester?.message}
                    disabled={isLoading}
                    min={1}
                    max={12}
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado *
                    </label>
                    <select
                      {...register('status')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isLoading}
                    >
                      {Object.values(CourseStatus).map((status) => (
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

                {/* Prerequisites */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prerrequisitos
                  </label>
                  <textarea
                    {...register('prerequisites')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[60px]"
                    disabled={isLoading}
                    placeholder="Códigos de cursos prerrequisito separados por comas (Ej: MAT-101, FIS-201)"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Ingrese los códigos de los cursos prerrequisito separados por comas
                  </p>
                </div>

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