/**
 * EnrollmentDetail Component - Professional detail view following established pattern
 * Displays complete enrollment information with edit capabilities
 */

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Edit3, 
  UserCheck, 
  Calendar, 
  BookOpen,
  ArrowLeft,
  GraduationCap,
  FileText,
  Award,
  Users,
  Clock,
  TrendingUp,
  MapPin
} from 'lucide-react'

import { Button } from '@/design-system/components/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/design-system/components/Card'
import { Badge } from '@/design-system/components/Badge'
import { LoadingSpinner } from '@/design-system/components/LoadingSpinner'
import { useEnrollment } from '../hooks'
import { useStudent } from '@/features/student/hooks'
import { useSchedule } from '@/features/schedule/hooks'
import { useCourse } from '@/features/course/hooks'
import { useInstructor } from '@/features/instructor/hooks'
import { useClassroom } from '@/features/classroom/hooks'
import { EnrollmentForm } from './EnrollmentForm'
import { Enrollment, EnrollmentStatus } from '../types'

interface EnrollmentDetailProps {
  enrollmentId: string
  onBack?: () => void
  onEdit?: (enrollment: Enrollment) => void
  className?: string
}

export const EnrollmentDetail: React.FC<EnrollmentDetailProps> = ({
  enrollmentId,
  onBack,
  onEdit,
  className
}) => {
  const [showEditForm, setShowEditForm] = useState(false)
  const { data: enrollment, isLoading, error } = useEnrollment(enrollmentId)
  
  // Load related data
  const { data: student } = useStudent(enrollment?.studentId || '', !!enrollment?.studentId)
  const { data: schedule } = useSchedule(enrollment?.scheduleId || '', !!enrollment?.scheduleId)
  const { data: course } = useCourse(schedule?.courseId || '', !!schedule?.courseId)
  const { data: instructor } = useInstructor(schedule?.instructorId || '', !!schedule?.instructorId)
  const { data: classroom } = useClassroom(schedule?.classroomId || '', !!schedule?.classroomId)

  const handleEditSuccess = () => {
    setShowEditForm(false)
  }

  const getStatusBadge = (status: EnrollmentStatus) => {
    const variants = {
      ACTIVE: 'success',
      INACTIVE: 'secondary',
      SUSPENDED: 'destructive'
    } as const

    const labels = {
      ACTIVE: 'Activa',
      INACTIVE: 'Inactiva',
      SUSPENDED: 'Suspendida'
    }

    return (
      <Badge variant={variants[status]} size="sm">
        {labels[status]}
      </Badge>
    )
  }

  const getGradeBadge = (grade?: number) => {
    if (grade === undefined || grade === null) {
      return <Badge variant="outline" size="lg">Sin calificar</Badge>
    }
    
    const color = grade >= 3.0 ? 'success' : grade >= 2.0 ? 'secondary' : 'destructive'
    return <Badge variant={color} size="lg">{grade.toFixed(1)}</Badge>
  }

  const getAttendanceBadge = (attendance?: number) => {
    if (attendance === undefined || attendance === null) {
      return <Badge variant="outline" size="lg">N/A</Badge>
    }
    
    const color = attendance >= 80 ? 'success' : attendance >= 60 ? 'secondary' : 'destructive'
    return <Badge variant={color} size="lg">{attendance}%</Badge>
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getDayLabel = (day: string) => {
    const labels = {
      MONDAY: 'Lunes',
      TUESDAY: 'Martes',
      WEDNESDAY: 'Miércoles',
      THURSDAY: 'Jueves',
      FRIDAY: 'Viernes',
      SATURDAY: 'Sábado',
      SUNDAY: 'Domingo'
    }
    return labels[day] || day
  }

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !enrollment) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <UserCheck className="w-8 h-8 mx-auto mb-4" />
            <p>Matrícula no encontrada</p>
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
              Matrícula de {student ? `${student.firstName} ${student.lastName}` : 'Estudiante'}
            </h1>
            <p className="text-gray-600">
              {course?.name || 'Curso'} • Grupo {schedule?.group || 'N/A'} • {formatDate(enrollment.enrollmentDate)}
            </p>
          </div>
        </div>
        
        <Button onClick={() => onEdit ? onEdit(enrollment) : setShowEditForm(true)}>
          <Edit3 className="w-4 h-4 mr-2" />
          Editar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Student Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Información del Estudiante
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Nombre Completo</label>
                  <p className="text-lg font-semibold">
                    {student ? `${student.firstName} ${student.lastName}` : 'Estudiante no encontrado'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Documento</label>
                  <p className="text-lg">
                    {student ? `${student.documentType}: ${student.documentNumber}` : 'N/A'}
                  </p>
                </div>
              </div>

              {student && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-lg">{student.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Teléfono</label>
                      <p className="text-lg">{student.phone || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Dirección</label>
                    <p className="text-lg">{student.address || 'N/A'}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

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
                  <label className="text-sm font-medium text-gray-500">Nombre del Curso</label>
                  <p className="text-lg font-semibold">{course?.name || 'Curso no encontrado'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Código</label>
                  <p className="text-lg">{course?.code || 'N/A'}</p>
                </div>
              </div>

              {course && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Créditos</label>
                      <p className="text-lg font-medium">{course.credits}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Horas</label>
                      <p className="text-lg font-medium">{course.hours}h</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Semestre</label>
                      <p className="text-lg font-medium">{course.semester}°</p>
                    </div>
                  </div>

                  {course.description && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Descripción</label>
                      <p className="text-gray-900 leading-relaxed">{course.description}</p>
                    </div>
                  )}
                </>
              )}
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
                  <label className="text-sm font-medium text-gray-500">Grupo</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-lg">{schedule?.group || 'N/A'}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Día de la Semana</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-lg">
                      {schedule ? getDayLabel(schedule.dayOfWeek) : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Horario</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-lg">
                      {schedule ? `${formatTime(schedule.startTime)} - ${formatTime(schedule.endTime)}` : 'N/A'}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Aula</label>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-lg">{classroom?.name || 'Aula no encontrada'}</span>
                  </div>
                </div>
              </div>

              {instructor && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Instructor</label>
                  <p className="text-lg font-medium">
                    {instructor.firstName} {instructor.lastName}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Academic Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Rendimiento Académico
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <label className="text-sm font-medium text-gray-500">Calificación</label>
                <div className="mt-2">
                  {getGradeBadge(enrollment.grade)}
                </div>
                {enrollment.grade && (
                  <p className="text-xs text-gray-500 mt-1">
                    {enrollment.grade >= 3.0 ? 'Aprobado' : 'Reprobado'}
                  </p>
                )}
              </div>

              <div className="text-center">
                <label className="text-sm font-medium text-gray-500">Asistencia</label>
                <div className="mt-2">
                  {getAttendanceBadge(enrollment.attendance)}
                </div>
                {enrollment.attendance && (
                  <p className="text-xs text-gray-500 mt-1">
                    {enrollment.attendance >= 80 ? 'Excelente' : 
                     enrollment.attendance >= 60 ? 'Buena' : 'Deficiente'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Enrollment Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Estado de Matrícula
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Estado Actual</label>
                <div className="mt-1">
                  {getStatusBadge(enrollment.status)}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Fecha de Matrícula</label>
                <p className="text-sm">{formatDate(enrollment.enrollmentDate)}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Creado</label>
                <p className="text-sm">
                  {new Date(enrollment.createdAt).toLocaleDateString()}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Última actualización</label>
                <p className="text-sm">
                  {new Date(enrollment.updatedAt).toLocaleDateString()}
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
                <TrendingUp className="w-4 h-4 mr-2" />
                Ver Progreso
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <FileText className="w-4 h-4 mr-2" />
                Generar Certificado
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Calendar className="w-4 h-4 mr-2" />
                Ver Horarios
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Form Modal */}
      <AnimatePresence>
        {showEditForm && (
          <EnrollmentForm
            enrollment={enrollment}
            onClose={() => setShowEditForm(false)}
            onSuccess={handleEditSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  )
}