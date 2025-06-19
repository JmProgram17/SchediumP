/**
 * EnrollmentList Component - Professional implementation following established pattern
 * Displays student enrollments with comprehensive details
 */

import React, { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Search, 
  Plus, 
  Edit3,
  Trash2,
  Eye,
  BookOpen,
  Calendar,
  Users,
  GraduationCap,
  Award,
  Filter,
  UserCheck
} from 'lucide-react'

import { Button } from '@/design-system/components/Button'
import { Input } from '@/design-system/components/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/design-system/components/Card'
import { Badge } from '@/design-system/components/Badge'
import { LoadingSpinner } from '@/design-system/components/LoadingSpinner'
import { useEnrollmentList, useDeleteEnrollment } from '../hooks'
import { useStudentList } from '@/features/student/hooks'
import { useScheduleList } from '@/features/schedule/hooks'
import { useCourseList } from '@/features/course/hooks'
import { Enrollment, EnrollmentStatus } from '../types'

interface EnrollmentListProps {
  className?: string
  onCreate?: () => void
  onEdit?: (enrollment: Enrollment) => void
  onView?: (enrollment: Enrollment) => void
}

export const EnrollmentList: React.FC<EnrollmentListProps> = ({ 
  className,
  onCreate,
  onEdit,
  onView
}) => {
  const [searchParams, setSearchParams] = useSearchParams()

  // Query parameters
  const query = useMemo(() => ({
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '10'),
    search: searchParams.get('search') || '',
    status: searchParams.get('status') as EnrollmentStatus || undefined,
    sortBy: searchParams.get('sortBy') as keyof Enrollment || 'enrollmentDate',
    sortOrder: searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc'
  }), [searchParams])

  // API hooks
  const { data, isLoading, error } = useEnrollmentList(query)
  const { data: studentsData } = useStudentList({ limit: 100 })
  const { data: schedulesData } = useScheduleList({ limit: 100 })
  const { data: coursesData } = useCourseList({ limit: 100 })
  const deleteEnrollment = useDeleteEnrollment()

  // Helper functions
  const getStudentById = (id: string) => studentsData?.items?.find(s => s.id === id)
  const getScheduleById = (id: string) => schedulesData?.items?.find(s => s.id === id)
  const getCourseById = (courseId: string) => coursesData?.items?.find(c => c.id === courseId)

  // Handlers
  const handleSearch = (value: string) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev)
      if (value) {
        newParams.set('search', value)
      } else {
        newParams.delete('search')
      }
      newParams.set('page', '1')
      return newParams
    })
  }

  const handleDelete = (enrollment: Enrollment) => {
    const student = getStudentById(enrollment.studentId)
    const schedule = getScheduleById(enrollment.scheduleId)
    const course = schedule ? getCourseById(schedule.courseId) : null
    
    if (window.confirm(`¿Está seguro de eliminar la matrícula de ${student?.firstName} ${student?.lastName} en ${course?.name || 'este curso'}?`)) {
      deleteEnrollment.mutate(enrollment.id)
    }
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getGradeBadge = (grade?: number) => {
    if (grade === undefined || grade === null) {
      return <Badge variant="outline" size="sm">Sin calificar</Badge>
    }
    
    const color = grade >= 3.0 ? 'success' : grade >= 2.0 ? 'secondary' : 'destructive'
    return <Badge variant={color} size="sm">{grade.toFixed(1)}</Badge>
  }

  const getAttendanceBadge = (attendance?: number) => {
    if (attendance === undefined || attendance === null) {
      return <Badge variant="outline" size="sm">N/A</Badge>
    }
    
    const color = attendance >= 80 ? 'success' : attendance >= 60 ? 'secondary' : 'destructive'
    return <Badge variant={color} size="sm">{attendance}%</Badge>
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error al cargar matrículas: {error.message}</p>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="mt-4"
            >
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Matrículas</h1>
          <p className="text-gray-600 mt-1">
            {data?.total || 0} matrículas registradas
          </p>
        </div>
        
        <Button onClick={onCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Matrícula
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Matrículas</p>
                <p className="text-2xl font-bold text-blue-600">{data?.total || 0}</p>
              </div>
              <UserCheck className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Activas</p>
                <p className="text-2xl font-bold text-green-600">
                  {data?.items?.filter(e => e.status === 'ACTIVE').length || 0}
                </p>
              </div>
              <GraduationCap className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Suspendidas</p>
                <p className="text-2xl font-bold text-red-600">
                  {data?.items?.filter(e => e.status === 'SUSPENDED').length || 0}
                </p>
              </div>
              <Users className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Promedio General</p>
                <p className="text-2xl font-bold text-purple-600">
                  {data?.items?.length ? 
                    (data.items.filter(e => e.grade).reduce((acc, e) => acc + (e.grade || 0), 0) / data.items.filter(e => e.grade).length).toFixed(1) 
                    : '0.0'}
                </p>
              </div>
              <Award className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por estudiante, curso o código..."
                value={query.search}
                onChange={(e) => handleSearch(e.target.value)}
                icon={Search}
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-4 font-medium text-gray-900">Estudiante</th>
                    <th className="text-left p-4 font-medium text-gray-900">Curso</th>
                    <th className="text-left p-4 font-medium text-gray-900">Fecha Matrícula</th>
                    <th className="text-left p-4 font-medium text-gray-900">Calificación</th>
                    <th className="text-left p-4 font-medium text-gray-900">Asistencia</th>
                    <th className="text-left p-4 font-medium text-gray-900">Estado</th>
                    <th className="w-20 p-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {data?.items?.map((enrollment) => {
                    const student = getStudentById(enrollment.studentId)
                    const schedule = getScheduleById(enrollment.scheduleId)
                    const course = schedule ? getCourseById(schedule.courseId) : null

                    return (
                      <motion.tr
                        key={enrollment.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="border-b hover:bg-gray-50 transition-colors"
                      >
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {student ? `${student.firstName} ${student.lastName}` : 'Estudiante no encontrado'}
                            </span>
                            <span className="text-sm text-gray-500">{student?.email}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="font-medium">{course?.name || 'Curso no encontrado'}</span>
                            <span className="text-sm text-gray-500">
                              {course?.code} • Grupo {schedule?.group}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{formatDate(enrollment.enrollmentDate)}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          {getGradeBadge(enrollment.grade)}
                        </td>
                        <td className="p-4">
                          {getAttendanceBadge(enrollment.attendance)}
                        </td>
                        <td className="p-4">
                          {getStatusBadge(enrollment.status)}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => onView?.(enrollment)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => onEdit?.(enrollment)}
                            >
                              <Edit3 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(enrollment)}
                              disabled={deleteEnrollment.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>

              {data?.items?.length === 0 && (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No se encontraron matrículas</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}