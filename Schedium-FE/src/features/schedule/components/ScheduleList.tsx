/**
 * ScheduleList Component - Professional implementation following established pattern
 * Displays schedules with calendar view and table view options
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
  Calendar,
  Clock,
  Users,
  MapPin,
  BookOpen,
  Filter,
  LayoutGrid,
  List
} from 'lucide-react'

import { Button } from '@/design-system/components/Button'
import { Input } from '@/design-system/components/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/design-system/components/Card'
import { Badge } from '@/design-system/components/Badge'
import { LoadingSpinner } from '@/design-system/components/LoadingSpinner'
import { useScheduleList, useDeleteSchedule } from '../hooks'
import { useCourseList } from '@/features/course/hooks'
import { useInstructorList } from '@/features/instructor/hooks'
import { useClassroomList } from '@/features/classroom/hooks'
import { Schedule, ScheduleStatus, DayOfWeek } from '../types'

interface ScheduleListProps {
  className?: string
  onCreate?: () => void
  onEdit?: (schedule: Schedule) => void
  onView?: (schedule: Schedule) => void
}

type ViewMode = 'table' | 'calendar'

export const ScheduleList: React.FC<ScheduleListProps> = ({ 
  className,
  onCreate,
  onEdit,
  onView
}) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [viewMode, setViewMode] = useState<ViewMode>('table')

  // Query parameters
  const query = useMemo(() => ({
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '10'),
    search: searchParams.get('search') || '',
    status: searchParams.get('status') as ScheduleStatus || undefined,
    sortBy: searchParams.get('sortBy') as keyof Schedule || 'startTime',
    sortOrder: searchParams.get('sortOrder') as 'asc' | 'desc' || 'asc'
  }), [searchParams])

  // API hooks
  const { data, isLoading, error } = useScheduleList(query)
  const { data: coursesData } = useCourseList({ limit: 100 })
  const { data: instructorsData } = useInstructorList({ limit: 100 })
  const { data: classroomsData } = useClassroomList({ limit: 100 })
  const deleteSchedule = useDeleteSchedule()

  // Helper functions
  const getCourseById = (id: string) => coursesData?.items?.find(c => c.id === id)
  const getInstructorById = (id: string) => instructorsData?.items?.find(i => i.id === id)
  const getClassroomById = (id: string) => classroomsData?.items?.find(c => c.id === id)

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

  const handleDelete = (schedule: Schedule) => {
    const course = getCourseById(schedule.courseId)
    if (window.confirm(`¿Está seguro de eliminar el horario de ${course?.name || 'este curso'}?`)) {
      deleteSchedule.mutate(schedule.id)
    }
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

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error al cargar horarios: {error.message}</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Horarios Académicos</h1>
          <p className="text-gray-600 mt-1">
            {data?.total || 0} horarios programados
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
          </div>
          
          <Button onClick={onCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Horario
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por curso, instructor o aula..."
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

      {/* Content */}
      {viewMode === 'table' ? (
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
                      <th className="text-left p-4 font-medium text-gray-900">Curso</th>
                      <th className="text-left p-4 font-medium text-gray-900">Instructor</th>
                      <th className="text-left p-4 font-medium text-gray-900">Aula</th>
                      <th className="text-left p-4 font-medium text-gray-900">Día</th>
                      <th className="text-left p-4 font-medium text-gray-900">Horario</th>
                      <th className="text-left p-4 font-medium text-gray-900">Grupo</th>
                      <th className="text-left p-4 font-medium text-gray-900">Estado</th>
                      <th className="w-20 p-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.items?.map((schedule) => {
                      const course = getCourseById(schedule.courseId)
                      const instructor = getInstructorById(schedule.instructorId)
                      const classroom = getClassroomById(schedule.classroomId)

                      return (
                        <motion.tr
                          key={schedule.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="border-b hover:bg-gray-50 transition-colors"
                        >
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span className="font-medium">{course?.name || 'Curso no encontrado'}</span>
                              <span className="text-sm text-gray-500">{course?.code}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {instructor ? `${instructor.firstName} ${instructor.lastName}` : 'Instructor no encontrado'}
                              </span>
                              <span className="text-sm text-gray-500">{instructor?.email}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <div className="flex flex-col">
                                <span className="font-medium">{classroom?.name || 'Aula no encontrada'}</span>
                                <span className="text-sm text-gray-500">
                                  Cap: {classroom?.capacity || 'N/A'}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge variant="outline" size="sm">
                              {getDayLabel(schedule.dayOfWeek)}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span className="text-sm">
                                {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">{schedule.group}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            {getStatusBadge(schedule.status)}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => onView?.(schedule)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => onEdit?.(schedule)}
                              >
                                <Edit3 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(schedule)}
                                disabled={deleteSchedule.isPending}
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
                    <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">No se encontraron horarios</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Vista de Calendario
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Vista de calendario en desarrollo</p>
              <p className="text-sm mt-2">
                Esta funcionalidad se implementará en la siguiente fase
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}