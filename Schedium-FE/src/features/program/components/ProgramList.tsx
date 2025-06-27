/**
 * ProgramList Component - Professional data table following established pattern
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
  BookOpen,
  Clock,
  Users
} from 'lucide-react'

import { Button } from '@/design-system/components/Button'
import { Input } from '@/design-system/components/Input'
import { Card, CardContent } from '@/design-system/components/Card'
import { Badge } from '@/design-system/components/Badge'
import { LoadingSpinner } from '@/design-system/components/LoadingSpinner'
import { 
  useProgramList, 
  useDeleteProgram, 
  useBulkDeletePrograms,
  useExportPrograms 
} from '../hooks'
import { Program, ProgramStatus, ProgramLevel } from '../types'

interface ProgramListProps {
  className?: string
  onCreate?: () => void
  onEdit?: (program: Program) => void
  onView?: (program: Program) => void
}

export const ProgramList: React.FC<ProgramListProps> = ({ 
  className,
  onCreate,
  onEdit,
  onView
}) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedPrograms, setSelectedPrograms] = useState<Set<string>>(new Set())

  // Query parameters
  const query = useMemo(() => ({
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '10'),
    search: searchParams.get('search') || '',
    status: searchParams.get('status') as ProgramStatus || undefined,
    sortBy: searchParams.get('sortBy') as keyof Program || 'name',
    sortOrder: searchParams.get('sortOrder') as 'asc' | 'desc' || 'asc'
  }), [searchParams])

  // API hooks
  const { data, isLoading, error } = useProgramList(query)
  const deleteProgram = useDeleteProgram()
  const bulkDelete = useBulkDeletePrograms()
  const exportData = useExportPrograms()

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

  const handleDelete = (program: Program) => {
    if (window.confirm(`¿Está seguro de eliminar el programa ${program.name}?`)) {
      deleteProgram.mutate(program.program_id)
    }
  }

  const handleBulkDelete = () => {
    if (selectedPrograms.size === 0) return
    
    if (window.confirm(`¿Está seguro de eliminar ${selectedPrograms.size} programas?`)) {
      bulkDelete.mutate(Array.from(selectedPrograms), {
        onSuccess: () => setSelectedPrograms(new Set())
      })
    }
  }

  const handleExport = (format: 'csv' | 'xlsx') => {
    exportData.mutate({ query, format })
  }

  const getStatusBadge = (status: ProgramStatus) => {
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

  const getLevelBadge = (level: ProgramLevel) => {
    const colors = {
      TECNICO: 'outline',
      TECNOLOGO: 'secondary',
      ESPECIALIZACION: 'default'
    } as const

    return (
      <Badge variant={colors[level]} size="sm">
        {level}
      </Badge>
    )
  }


  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error al cargar programas: {error.message}</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Programas Académicos</h1>
          <p className="text-gray-600 mt-1">
            {data?.total || 0} programas registrados
          </p>
        </div>
        
        <div className="flex items-center gap-3">
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
            Nuevo Programa
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nombre, código o departamento..."
                value={query.search}
                onChange={(e) => handleSearch(e.target.value)}
                icon={Search}
              />
            </div>
            
            {selectedPrograms.size > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2"
              >
                <span className="text-sm text-gray-600">
                  {selectedPrograms.size} seleccionado(s)
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
                    <th className="text-left p-4 font-medium text-gray-900">Código</th>
                    <th className="text-left p-4 font-medium text-gray-900">Programa</th>
                    <th className="text-left p-4 font-medium text-gray-900">Nivel</th>
                    <th className="text-left p-4 font-medium text-gray-900">Cadena</th>
                    <th className="text-left p-4 font-medium text-gray-900">Duración</th>
                    <th className="text-left p-4 font-medium text-gray-900">Estado</th>
                    <th className="w-20 p-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {data?.items?.map((program) => (
                    <motion.tr
                      key={program.program_id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="border-b hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-medium">{program.nomenclature?.code || 'N/A'}</span>
                          <span className="text-sm text-gray-500">
                            {program.department?.name || 'Sin departamento'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-medium">{program.name}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" size="sm">
                          {program.level?.study_type || 'N/A'}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" size="sm">
                          {program.chain?.name || 'N/A'}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span>{program.level?.duration || 0} meses</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant={program.active ? "success" : "secondary"} size="sm">
                          {program.active ? "ACTIVO" : "INACTIVO"}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => onView?.(program)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => onEdit?.(program)}
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(program)}
                            disabled={deleteProgram.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>

              {data?.items?.length === 0 && (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No se encontraron programas académicos</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}