/**
 * ScheduleForm Component - Professional form following established pattern
 * Implements create/edit functionality with Zod validation and accessibility
 */

import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Save, Calendar, Clock, Users } from 'lucide-react'

import { Button } from '@/design-system/components/Button'
import { Input } from '@/design-system/components/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/design-system/components/Card'
import { LoadingSpinner } from '@/design-system/components/LoadingSpinner'
import { useCreateSchedule, useUpdateSchedule } from '../hooks'
import { useCourseList } from '@/features/course/hooks'
import { useInstructorList } from '@/features/instructor/hooks'
import { useClassroomList } from '@/features/classroom/hooks'
import { Schedule, ScheduleStatus, DayOfWeek } from '../types'

// Validation schema
const scheduleSchema = z.object({
  courseId: z.string().min(1, 'Seleccione un curso'),
  instructorId: z.string().min(1, 'Seleccione un instructor'),
  classroomId: z.string().min(1, 'Seleccione un aula'),
  dayOfWeek: z.nativeEnum(DayOfWeek, { required_error: 'Seleccione un día' }),
  startTime: z.string().min(1, 'Ingrese la hora de inicio'),
  endTime: z.string().min(1, 'Ingrese la hora de fin'),
  startDate: z.string().min(1, 'Ingrese la fecha de inicio'),
  endDate: z.string().min(1, 'Ingrese la fecha de fin'),
  group: z.string().min(1).max(20),
  capacity: z.number().min(1).max(1000),
  status: z.nativeEnum(ScheduleStatus)
}).refine((data) => {
  return new Date(`2000-01-01T${data.startTime}`) < new Date(`2000-01-01T${data.endTime}`)
}, {
  message: 'La hora de inicio debe ser anterior a la hora de fin',
  path: ['endTime']
}).refine((data) => {
  return new Date(data.startDate) <= new Date(data.endDate)
}, {
  message: 'La fecha de inicio debe ser anterior o igual a la fecha de fin',
  path: ['endDate']
})

type ScheduleFormData = z.infer<typeof scheduleSchema>

interface ScheduleFormProps {
  schedule?: Schedule | null
  onClose: () => void
  onSuccess: () => void
}

export const ScheduleForm: React.FC<ScheduleFormProps> = ({
  schedule,
  onClose,
  onSuccess
}) => {
  const isEditing = !!schedule
  const createSchedule = useCreateSchedule()
  const updateSchedule = useUpdateSchedule()
  
  // Load related data
  const { data: coursesData } = useCourseList({ limit: 100 })
  const { data: instructorsData } = useInstructorList({ limit: 100 })
  const { data: classroomsData } = useClassroomList({ limit: 100 })

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch
  } = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    mode: 'onChange',
    defaultValues: {
      status: ScheduleStatus.ACTIVE,
      capacity: 30,
      group: 'A'
    }
  })

  // Load schedule data for editing
  useEffect(() => {
    if (schedule) {
      Object.entries(schedule).forEach(([key, value]) => {
        if (key === 'startDate' || key === 'endDate') {
          // Format dates for input[type="date"]
          setValue(key as keyof ScheduleFormData, new Date(value).toISOString().split('T')[0])
        } else {
          setValue(key as keyof ScheduleFormData, value)
        }
      })
    }
  }, [schedule, setValue])

  const onSubmit = async (data: ScheduleFormData) => {
    try {
      if (isEditing && schedule) {
        await updateSchedule.mutateAsync({ id: schedule.id, data })
      } else {
        await createSchedule.mutateAsync(data)
      }
      onSuccess()
    } catch (error) {
      console.error('Error saving schedule:', error)
    }
  }

  const isLoading = createSchedule.isPending || updateSchedule.isPending

  const dayOptions = [
    { value: DayOfWeek.MONDAY, label: 'Lunes' },
    { value: DayOfWeek.TUESDAY, label: 'Martes' },
    { value: DayOfWeek.WEDNESDAY, label: 'Miércoles' },
    { value: DayOfWeek.THURSDAY, label: 'Jueves' },
    { value: DayOfWeek.FRIDAY, label: 'Viernes' },
    { value: DayOfWeek.SATURDAY, label: 'Sábado' },
    { value: DayOfWeek.SUNDAY, label: 'Domingo' }
  ]

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
          className="w-full max-w-4xl max-h-[90vh] overflow-auto"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {isEditing ? 'Editar Horario' : 'Nuevo Horario'}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Course, Instructor, Classroom */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Curso *
                    </label>
                    <select
                      {...register('courseId')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isLoading}
                    >
                      <option value="">Seleccione un curso</option>
                      {coursesData?.items?.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.code} - {course.name}
                        </option>
                      ))}
                    </select>
                    {errors.courseId && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.courseId.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Instructor *
                    </label>
                    <select
                      {...register('instructorId')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isLoading}
                    >
                      <option value="">Seleccione un instructor</option>
                      {instructorsData?.items?.map((instructor) => (
                        <option key={instructor.id} value={instructor.id}>
                          {instructor.firstName} {instructor.lastName}
                        </option>
                      ))}
                    </select>
                    {errors.instructorId && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.instructorId.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Aula *
                    </label>
                    <select
                      {...register('classroomId')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isLoading}
                    >
                      <option value="">Seleccione un aula</option>
                      {classroomsData?.items?.map((classroom) => (
                        <option key={classroom.id} value={classroom.id}>
                          {classroom.name} (Cap: {classroom.capacity})
                        </option>
                      ))}
                    </select>
                    {errors.classroomId && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.classroomId.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Day and Time */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Día de la Semana *
                    </label>
                    <select
                      {...register('dayOfWeek')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isLoading}
                    >
                      <option value="">Seleccione un día</option>
                      {dayOptions.map((day) => (
                        <option key={day.value} value={day.value}>
                          {day.label}
                        </option>
                      ))}
                    </select>
                    {errors.dayOfWeek && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.dayOfWeek.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Input
                      label="Hora de Inicio *"
                      type="time"
                      {...register('startTime')}
                      error={errors.startTime?.message}
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <Input
                      label="Hora de Fin *"
                      type="time"
                      {...register('endTime')}
                      error={errors.endTime?.message}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Input
                      label="Fecha de Inicio *"
                      type="date"
                      {...register('startDate')}
                      error={errors.startDate?.message}
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <Input
                      label="Fecha de Fin *"
                      type="date"
                      {...register('endDate')}
                      error={errors.endDate?.message}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Group, Capacity, Status */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Input
                      label="Grupo *"
                      {...register('group')}
                      error={errors.group?.message}
                      disabled={isLoading}
                      placeholder="Ej: A, B, 01, etc."
                      maxLength={20}
                    />
                  </div>

                  <div>
                    <Input
                      label="Capacidad *"
                      type="number"
                      {...register('capacity', { valueAsNumber: true })}
                      error={errors.capacity?.message}
                      disabled={isLoading}
                      min={1}
                      max={1000}
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
                      {Object.values(ScheduleStatus).map((status) => (
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