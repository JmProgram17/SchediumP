/**
 * EnrollmentForm Component - Professional form following established pattern
 * Implements create/edit functionality with Zod validation and accessibility
 */

import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Save, UserCheck, BookOpen } from 'lucide-react'

import { Button } from '@/design-system/components/Button'
import { Input } from '@/design-system/components/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/design-system/components/Card'
import { LoadingSpinner } from '@/design-system/components/LoadingSpinner'
import { useCreateEnrollment, useUpdateEnrollment } from '../hooks'
import { useStudentList } from '@/features/student/hooks'
import { useScheduleList } from '@/features/schedule/hooks'
import { useCourseList } from '@/features/course/hooks'
import { Enrollment, EnrollmentStatus } from '../types'

// Validation schema
const enrollmentSchema = z.object({
  studentId: z.string().min(1, 'Seleccione un estudiante'),
  scheduleId: z.string().min(1, 'Seleccione un horario'),
  enrollmentDate: z.string().min(1, 'Ingrese la fecha de matrícula'),
  status: z.nativeEnum(EnrollmentStatus),
  grade: z.number().min(0).max(5).optional().nullable(),
  attendance: z.number().min(0).max(100).optional().nullable()
})

type EnrollmentFormData = z.infer<typeof enrollmentSchema>

interface EnrollmentFormProps {
  enrollment?: Enrollment | null
  onClose: () => void
  onSuccess: () => void
}

export const EnrollmentForm: React.FC<EnrollmentFormProps> = ({
  enrollment,
  onClose,
  onSuccess
}) => {
  const isEditing = !!enrollment
  const createEnrollment = useCreateEnrollment()
  const updateEnrollment = useUpdateEnrollment()
  
  // Load related data
  const { data: studentsData } = useStudentList({ limit: 100 })
  const { data: schedulesData } = useScheduleList({ limit: 100 })
  const { data: coursesData } = useCourseList({ limit: 100 })

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch
  } = useForm<EnrollmentFormData>({
    resolver: zodResolver(enrollmentSchema),
    mode: 'onChange',
    defaultValues: {
      status: EnrollmentStatus.ACTIVE,
      enrollmentDate: new Date().toISOString().split('T')[0],
      grade: null,
      attendance: null
    }
  })

  // Load enrollment data for editing
  useEffect(() => {
    if (enrollment) {
      Object.entries(enrollment).forEach(([key, value]) => {
        if (key === 'enrollmentDate') {
          // Format date for input[type="date"]
          setValue(key as keyof EnrollmentFormData, new Date(value).toISOString().split('T')[0])
        } else {
          setValue(key as keyof EnrollmentFormData, value)
        }
      })
    }
  }, [enrollment, setValue])

  const onSubmit = async (data: EnrollmentFormData) => {
    try {
      // Clean up null values for optional fields
      const cleanData = {
        ...data,
        grade: data.grade || undefined,
        attendance: data.attendance || undefined
      }

      if (isEditing && enrollment) {
        await updateEnrollment.mutateAsync({ id: enrollment.id, data: cleanData })
      } else {
        await createEnrollment.mutateAsync(cleanData)
      }
      onSuccess()
    } catch (error) {
      console.error('Error saving enrollment:', error)
    }
  }

  const isLoading = createEnrollment.isPending || updateEnrollment.isPending

  // Helper function to get course by schedule
  const getCourseBySchedule = (scheduleId: string) => {
    const schedule = schedulesData?.items?.find(s => s.id === scheduleId)
    return schedule ? coursesData?.items?.find(c => c.id === schedule.courseId) : null
  }

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
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="w-5 h-5" />
                {isEditing ? 'Editar Matrícula' : 'Nueva Matrícula'}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Student and Schedule Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estudiante *
                    </label>
                    <select
                      {...register('studentId')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isLoading}
                    >
                      <option value="">Seleccione un estudiante</option>
                      {studentsData?.items?.map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.firstName} {student.lastName} - {student.documentNumber}
                        </option>
                      ))}
                    </select>
                    {errors.studentId && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.studentId.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Horario / Curso *
                    </label>
                    <select
                      {...register('scheduleId')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isLoading}
                    >
                      <option value="">Seleccione un horario</option>
                      {schedulesData?.items?.map((schedule) => {
                        const course = getCourseBySchedule(schedule.id)
                        return (
                          <option key={schedule.id} value={schedule.id}>
                            {course?.name || 'Curso no encontrado'} - Grupo {schedule.group}
                          </option>
                        )
                      })}
                    </select>
                    {errors.scheduleId && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.scheduleId.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Enrollment Date and Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Input
                      label="Fecha de Matrícula *"
                      type="date"
                      {...register('enrollmentDate')}
                      error={errors.enrollmentDate?.message}
                      disabled={isLoading}
                    />
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
                      {Object.values(EnrollmentStatus).map((status) => (
                        <option key={status} value={status}>
                          {status === 'ACTIVE' ? 'Activa' : 
                           status === 'INACTIVE' ? 'Inactiva' : 'Suspendida'}
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

                {/* Academic Performance */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Rendimiento Académico
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Input
                        label="Calificación (0.0 - 5.0)"
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        {...register('grade', { 
                          valueAsNumber: true,
                          setValueAs: (value) => value === '' ? null : parseFloat(value)
                        })}
                        error={errors.grade?.message}
                        disabled={isLoading}
                        placeholder="Ej: 4.5"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Deje vacío si aún no hay calificación
                      </p>
                    </div>

                    <div>
                      <Input
                        label="Asistencia (%)"
                        type="number"
                        min="0"
                        max="100"
                        {...register('attendance', { 
                          valueAsNumber: true,
                          setValueAs: (value) => value === '' ? null : parseInt(value)
                        })}
                        error={errors.attendance?.message}
                        disabled={isLoading}
                        placeholder="Ej: 85"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Porcentaje de asistencia a clases
                      </p>
                    </div>
                  </div>
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
                        {isEditing ? 'Actualizar' : 'Matricular'}
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