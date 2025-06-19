/**
 * CourseList Component - Basic implementation
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
  Clock,
  Award
} from 'lucide-react'

import { Button } from '@/design-system/components/Button'
import { Input } from '@/design-system/components/Input'
import { Card, CardContent } from '@/design-system/components/Card'
import { Badge } from '@/design-system/components/Badge'
import { LoadingSpinner } from '@/design-system/components/LoadingSpinner'
import { useCourseList, useDeleteCourse } from '../hooks'
import { Course, CourseStatus } from '../types'

interface CourseListProps {
  className?: string
  onCreate?: () => void
  onEdit?: (course: Course) => void
  onView?: (course: Course) => void
}

export const CourseList: React.FC<CourseListProps> = ({ 
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
    status: searchParams.get('status') as CourseStatus || undefined,
    sortBy: searchParams.get('sortBy') as keyof Course || 'name',
    sortOrder: searchParams.get('sortOrder') as 'asc' | 'desc' || 'asc'
  }), [searchParams])

  // API hooks
  const { data, isLoading, error } = useCourseList(query)
  const deleteCourse = useDeleteCourse()

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

  const handleDelete = (course: Course) => {
    if (window.confirm(`¿Está seguro de eliminar el curso ${course.name}?`)) {
      deleteCourse.mutate(course.id)
    }
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

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error al cargar cursos: {error.message}</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Cursos</h1>
          <p className="text-gray-600 mt-1">
            {data?.pagination.total || 0} cursos registrados
          </p>
        </div>
        
        <Button onClick={onCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Curso
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <Input
            placeholder="Buscar por nombre, código o programa..."
            value={query.search}
            onChange={(e) => handleSearch(e.target.value)}
            leftIcon={Search}
          />
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
                    <th className="text-left p-4 font-medium text-gray-900">Código</th>
                    <th className="text-left p-4 font-medium text-gray-900">Curso</th>
                    <th className="text-left p-4 font-medium text-gray-900">Créditos</th>
                    <th className="text-left p-4 font-medium text-gray-900">Horas</th>
                    <th className="text-left p-4 font-medium text-gray-900">Semestre</th>
                    <th className="text-left p-4 font-medium text-gray-900">Estado</th>
                    <th className="w-20 p-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {data?.data?.map((course) => (
                    <motion.tr
                      key={course.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="border-b hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-4">
                        <span className="font-medium">{course.code}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-medium">{course.name}</span>
                          {course.description && (
                            <span className="text-sm text-gray-500 truncate max-w-xs">
                              {course.description}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-gray-400" />
                          <span>{course.credits}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span>{course.hours}h</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-medium">{course.semester}°</span>
                      </td>
                      <td className="p-4">
                        {getStatusBadge(course.status)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => onView?.(course)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => onEdit?.(course)}
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(course)}
                            disabled={deleteCourse.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>

              {data?.data?.length === 0 && (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No se encontraron cursos</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}