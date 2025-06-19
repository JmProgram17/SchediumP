/**
 * ScheduleDetail Component - Professional detail view following established pattern
 * Displays complete schedule information with edit capabilities
 */

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Edit3, 
  Calendar, 
  Clock, 
  Users,
  MapPin,
  BookOpen,
  ArrowLeft,
  GraduationCap,
  FileText,
  CheckCircle
} from 'lucide-react'

import { Button } from '@/design-system/components/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/design-system/components/Card'
import { Badge } from '@/design-system/components/Badge'
import { LoadingSpinner } from '@/design-system/components/LoadingSpinner'
import { useSchedule } from '../hooks'
import { useCourse } from '@/features/course/hooks'
import { useInstructor } from '@/features/instructor/hooks'
import { useClassroom } from '@/features/classroom/hooks'
import { ScheduleForm } from './ScheduleForm'
import { Schedule, ScheduleStatus, DayOfWeek } from '../types'

interface ScheduleDetailProps {
  scheduleId: string
  onBack?: () => void
  onEdit?: (schedule: Schedule) => void
  className?: string
}

export const ScheduleDetail: React.FC<ScheduleDetailProps> = ({
  scheduleId,
  onBack,
  onEdit,
  className
}) => {
  const [showEditForm, setShowEditForm] = useState(false)
  const { data: schedule, isLoading, error } = useSchedule(scheduleId)
  
  // Load related data
  const { data: course } = useCourse(schedule?.courseId || '', !!schedule?.courseId)
  const { data: instructor } = useInstructor(schedule?.instructorId || '', !!schedule?.instructorId)
  const { data: classroom } = useClassroom(schedule?.classroomId || '', !!schedule?.classroomId)

  const handleEditSuccess = () => {
    setShowEditForm(false)
  }

  const getStatusBadge = (status: ScheduleStatus) => {
    const variants = {
      ACTIVE: 'success',
      INACTIVE: 'secondary',
      SUSPENDED: 'destructive'
    } as const

    const labels = {
      ACTIVE: 'Activo',
      INACTIVE: 'Inactivo',
      SUSPENDED: 'Suspendido'
    }

    return (
      <Badge variant={variants[status]} size="sm">
        {labels[status]}
      </Badge>
    )
  }

  const getDayLabel = (day: DayOfWeek) => {
    const labels = {
      MONDAY: 'Lunes',
      TUESDAY: 'Martes',
      WEDNESDAY: 'Miércoles',
      THURSDAY: 'Jueves',
      FRIDAY: 'Viernes',
      SATURDAY: 'Sábado',
      SUNDAY: 'Domingo'
    }
    return labels[day]
  }

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !schedule) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <Calendar className="w-8 h-8 mx-auto mb-4" />
            <p>Horario no encontrado</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {course?.name || 'Curso no encontrado'}
            </h1>
            <p className="text-gray-600">
              Grupo {schedule.group} • {getDayLabel(schedule.dayOfWeek)} • {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
            </p>
          </div>
        </div>
        
        <Button onClick={() => onEdit ? onEdit(schedule) : setShowEditForm(true)}>
          <Edit3 className="w-4 h-4 mr-2" />
          Editar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Course Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Información del Curso
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Código del Curso</label>
                  <p className="text-lg font-semibold">{course?.code || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Estado</label>
                  <div className="mt-1">
                    {getStatusBadge(schedule.status)}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Nombre del Curso</label>
                <p className="text-lg">{course?.name || 'Curso no encontrado'}</p>
              </div>

              {course?.description && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Descripción</label>
                  <p className="text-gray-900 leading-relaxed">{course.description}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Créditos</label>
                  <p className="text-lg font-medium">{course?.credits || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Horas Académicas</label>
                  <p className="text-lg font-medium">{course?.hours || 'N/A'}h</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Semestre</label>
                  <p className="text-lg font-medium">{course?.semester || 'N/A'}°</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Información del Horario
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Día de la Semana</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-lg">{getDayLabel(schedule.dayOfWeek)}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Horario</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-lg">
                      {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Fecha de Inicio</label>
                  <p className="text-lg">{formatDate(schedule.startDate)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Fecha de Fin</label>
                  <p className="text-lg">{formatDate(schedule.endDate)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Grupo</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-lg">{schedule.group}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Capacidad</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-lg">{schedule.capacity} estudiantes</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Instructor and Classroom */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  Instructor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Nombre</label>
                  <p className="text-lg font-medium">
                    {instructor ? `${instructor.firstName} ${instructor.lastName}` : 'Instructor no encontrado'}
                  </p>
                </div>
                {instructor && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-sm">{instructor.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Teléfono</label>
                      <p className="text-sm">{instructor.phone || 'N/A'}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Aula
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Nombre</label>
                  <p className="text-lg font-medium">{classroom?.name || 'Aula no encontrada'}</p>
                </div>
                {classroom && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Capacidad</label>
                      <p className="text-sm">{classroom.capacity} personas</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Ubicación</label>
                      <p className="text-sm">{classroom.location || 'N/A'}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Estadísticas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Estudiantes Inscritos</label>
                <p className="text-2xl font-bold text-blue-600">
                  {schedule.enrolled}
                </p>
                <p className="text-xs text-gray-500">de {schedule.capacity} disponibles</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Ocupación</label>
                <div className="mt-1">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(schedule.enrolled / schedule.capacity) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {Math.round((schedule.enrolled / schedule.capacity) * 100)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle>Información Adicional</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Creado</label>
                <p className="text-sm">
                  {new Date(schedule.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Última actualización</label>
                <p className="text-sm">
                  {new Date(schedule.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Users className="w-4 h-4 mr-2" />
                Ver Estudiantes
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <CheckCircle className="w-4 h-4 mr-2" />
                Tomar Asistencia
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <FileText className="w-4 h-4 mr-2" />
                Ver Reportes
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Form Modal */}
      <AnimatePresence>
        {showEditForm && (
          <ScheduleForm
            schedule={schedule}
            onClose={() => setShowEditForm(false)}
            onSuccess={handleEditSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  )
}