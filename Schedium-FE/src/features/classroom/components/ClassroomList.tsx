/**
 * ClassroomList Component - Professional data table following Student pattern
 * Implements CRUD operations with optimistic updates and accessibility
 */

import React, { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Search, 
  Plus, 
  Filter, 
  Download, 
  Edit3,
  Trash2,
  Eye,
  Square,
  Building,
  Users
} from 'lucide-react'

import { Button } from '@/design-system/components/Button'
import { Input } from '@/design-system/components/Input'
import { Card, CardContent } from '@/design-system/components/Card'
import { Badge } from '@/design-system/components/Badge'
import { LoadingSpinner } from '@/design-system/components/LoadingSpinner'
import { 
  useClassroomList, 
  useDeleteClassroom, 
  useBulkDeleteClassrooms,
  useExportClassrooms 
} from '../hooks'
import { Classroom, ClassroomStatus, ClassroomType } from '../types'

interface ClassroomListProps {
  className?: string
  onCreate?: () => void
  onEdit?: (classroom: Classroom) => void
  onView?: (classroom: Classroom) => void
}

export const ClassroomList: React.FC<ClassroomListProps> = ({ 
  className,
  onCreate,
  onEdit,
  onView
}) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedClassrooms, setSelectedClassrooms] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)

  // Query parameters
  const query = useMemo(() => ({
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '10'),
    search: searchParams.get('search') || '',
    status: searchParams.get('status') as ClassroomStatus || undefined,
    sortBy: searchParams.get('sortBy') as keyof Classroom || 'name',
    sortOrder: searchParams.get('sortOrder') as 'asc' | 'desc' || 'asc'
  }), [searchParams])

  // API hooks
  const { data, isLoading, error } = useClassroomList(query)
  const deleteClassroom = useDeleteClassroom()
  const bulkDelete = useBulkDeleteClassrooms()
  const exportData = useExportClassrooms()

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

  const handleDelete = (classroom: Classroom) => {
    if (window.confirm(`¿Está seguro de eliminar el aula ${classroom.room_number}?`)) {
      deleteClassroom.mutate(classroom.classroom_id.toString())
    }
  }

  const handleBulkDelete = () => {
    if (selectedClassrooms.size === 0) return
    
    if (window.confirm(`¿Está seguro de eliminar ${selectedClassrooms.size} aulas?`)) {
      bulkDelete.mutate(Array.from(selectedClassrooms), {
        onSuccess: () => setSelectedClassrooms(new Set())
      })
    }
  }

  const handleExport = (format: 'csv' | 'xlsx') => {
    exportData.mutate({ query, format })
  }

  const getStatusBadge = (status: ClassroomStatus) => {
    const variants = {
      ACTIVE: 'success',
      INACTIVE: 'secondary',
      MAINTENANCE: 'warning'
    } as const

    const labels = {
      ACTIVE: 'Activa',
      INACTIVE: 'Inactiva',
      MAINTENANCE: 'Mantenimiento'
    }

    return (
      <Badge variant={variants[status]} size="sm">
        {labels[status]}
      </Badge>
    )
  }

  const getTypeBadge = (type: ClassroomType) => {
    const colors = {
      LABORATORIO: 'success',
      AULA_TEORICA: 'outline',
      TALLER: 'warning',
      AUDITORIO: 'secondary'
    } as const

    const labels = {
      LABORATORIO: 'Laboratorio',
      AULA_TEORICA: 'Aula Teórica',
      TALLER: 'Taller',
      AUDITORIO: 'Auditorio'
    }

    return (
      <Badge variant={colors[type]} size="sm">
        {labels[type]}
      </Badge>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error al cargar aulas: {error.message}</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Aulas</h1>
          <p className="text-gray-600 mt-1">
            {data?.pagination.total || 0} aulas registradas
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="hidden md:flex"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('csv')}
            disabled={exportData.isPending}
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          
          <Button onClick={onCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Aula
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nombre, código o edificio..."
                value={query.search}
                onChange={(e) => handleSearch(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
            
            {selectedClassrooms.size > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2"
              >
                <span className="text-sm text-gray-600">
                  {selectedClassrooms.size} seleccionada(s)
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={bulkDelete.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Eliminar
                </Button>
              </motion.div>
            )}
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
                    <th className="w-12 p-4">
                      <Square className="w-4 h-4 text-gray-400" />
                    </th>
                    <th className="text-left p-4 font-medium text-gray-900">Código</th>
                    <th className="text-left p-4 font-medium text-gray-900">Nombre</th>
                    <th className="text-left p-4 font-medium text-gray-900">Ubicación</th>
                    <th className="text-left p-4 font-medium text-gray-900">Capacidad</th>
                    <th className="text-left p-4 font-medium text-gray-900">Tipo</th>
                    <th className="text-left p-4 font-medium text-gray-900">Estado</th>
                    <th className="w-20 p-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {data?.data?.map((classroom) => (
                    <motion.tr
                      key={classroom.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="border-b hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-4">
                        <Square className="w-4 h-4 text-gray-400" />
                      </td>
                      <td className="p-4">
                        <span className="font-medium font-mono">{classroom.room_number}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-medium">Aula {classroom.room_number}</span>
                          <span className="text-sm text-gray-500">
                            Campus {classroom.campus_id}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-gray-400" />
                          <div className="flex flex-col">
                            <span className="font-medium">Campus {classroom.campus_id}</span>
                            <span className="text-sm text-gray-500">Capacidad: {classroom.capacity}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span>{classroom.capacity} personas</span>
                        </div>
                      </td>
                      <td className="p-4">
                        {getTypeBadge(classroom.classroom_type as ClassroomType)}
                      </td>
                      <td className="p-4">
                        {getStatusBadge(ClassroomStatus.ACTIVE)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => onView?.(classroom)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => onEdit?.(classroom)}
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(classroom)}
                            disabled={deleteClassroom.isPending}
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
                  <p className="text-gray-500">No se encontraron aulas</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}