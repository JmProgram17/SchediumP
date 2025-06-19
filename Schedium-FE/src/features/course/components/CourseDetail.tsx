/**
 * CourseDetail Component - Professional detail view following established pattern
 * Displays complete course information with edit capabilities
 */

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Edit3, 
  BookOpen, 
  Clock, 
  Award, 
  Calendar,
  FileText,
  ArrowLeft,
  Users,
  CheckCircle
} from 'lucide-react'

import { Button } from '@/design-system/components/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/design-system/components/Card'
import { Badge } from '@/design-system/components/Badge'
import { LoadingSpinner } from '@/design-system/components/LoadingSpinner'
import { useCourse } from '../hooks'
import { useProgram } from '@/features/program/hooks'
import { CourseForm } from './CourseForm'
import { Course, CourseStatus } from '../types'

interface CourseDetailProps {
  courseId: string
  onBack?: () => void
  onEdit?: (course: Course) => void
  className?: string
}

export const CourseDetail: React.FC<CourseDetailProps> = ({
  courseId,
  onBack,
  onEdit,
  className
}) => {
  const [showEditForm, setShowEditForm] = useState(false)
  const { data: course, isLoading, error } = useCourse(courseId)
  const { data: program } = useProgram(course?.programId || '', !!course?.programId)

  const handleEditSuccess = () => {
    setShowEditForm(false)
  }

  const getStatusBadge = (status: CourseStatus) => {
    const variants = {
      ACTIVE: 'success',
      INACTIVE: 'secondary',
      SUSPENDED: 'error'
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !course) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <BookOpen className="w-8 h-8 mx-auto mb-4" />
            <p>Curso no encontrado</p>
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
              {course.name}
            </h1>
            <p className="text-gray-600">
              {course.code} • {program?.name || 'Programa no encontrado'}
            </p>
          </div>
        </div>
        
        <Button onClick={() => onEdit ? onEdit(course) : setShowEditForm(true)}>
          <Edit3 className="w-4 h-4 mr-2" />
          Editar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Información Básica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Código</label>
                  <p className="text-lg font-semibold">{course.code}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Estado</label>
                  <div className="mt-1">
                    {getStatusBadge(course.status)}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Nombre del Curso</label>
                <p className="text-lg">{course.name}</p>
              </div>

              {course.description && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Descripción</label>
                  <p className="text-gray-900 leading-relaxed">{course.description}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-500">Programa Académico</label>
                <p className="text-lg">{program?.name || 'Cargando...'}</p>
                {program && (
                  <Badge variant="outline" size="sm" className="mt-1">
                    {program.level} - {program.modality}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Academic Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Configuración Académica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Créditos</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Award className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-lg">{course.credits}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Horas Académicas</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-lg">{course.hours}h</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Semestre</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-lg">{course.semester}°</span>
                  </div>
                </div>
              </div>

              {course.prerequisites && course.prerequisites.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Prerrequisitos</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {course.prerequisites.map((prereq, index) => (
                      <Badge key={index} variant="outline" size="sm">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {prereq}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Información Adicional
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Creado</label>
                <p className="text-sm">
                  {new Date(course.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Última actualización</label>
                <p className="text-sm">
                  {new Date(course.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Carga académica</label>
                <p className="text-sm">
                  {course.credits} créditos / {course.hours} horas
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
                <Calendar className="w-4 h-4 mr-2" />
                Ver Horarios
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <FileText className="w-4 h-4 mr-2" />
                Ver Contenido
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Form Modal */}
      <AnimatePresence>
        {showEditForm && (
          <CourseForm
            course={course}
            onClose={() => setShowEditForm(false)}
            onSuccess={handleEditSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  )
}