/**
 * InstructorList Component - Professional data table following Student pattern
 * Implements CRUD operations with optimistic updates and accessibility
 */

import React, { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  Plus, 
  Filter, 
  Download, 
  Edit3,
  Trash2,
  Eye,
  CheckSquare,
  Square
} from 'lucide-react'

import { Button } from '@/design-system/components/Button'
import { Input } from '@/design-system/components/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/design-system/components/Card'
import { Badge } from '@/design-system/components/Badge'
import { LoadingSpinner } from '@/design-system/components/LoadingSpinner'
import { 
  useInstructorList, 
  useDeleteInstructor, 
  useBulkDeleteInstructors,
  useExportInstructors 
} from '../hooks'
import { Instructor, InstructorStatus, DocumentType, ContractType } from '../types'

interface InstructorListProps {
  className?: string
  onCreate?: () => void
  onEdit?: (instructor: Instructor) => void
  onView?: (instructor: Instructor) => void
}

export const InstructorList: React.FC<InstructorListProps> = ({ 
  className,
  onCreate,
  onEdit,
  onView
}) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedInstructors, setSelectedInstructors] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)

  // Query parameters
  const query = useMemo(() => ({
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '10'),
    search: searchParams.get('search') || '',
    status: searchParams.get('status') as InstructorStatus || undefined,
    sortBy: searchParams.get('sortBy') as keyof Instructor || 'lastName',
    sortOrder: searchParams.get('sortOrder') as 'asc' | 'desc' || 'asc'
  }), [searchParams])

  // API hooks
  const { data, isLoading, error } = useInstructorList(query)
  const deleteInstructor = useDeleteInstructor()
  const bulkDelete = useBulkDeleteInstructors()
  const exportData = useExportInstructors()

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

  const handleDelete = (instructor: Instructor) => {
    if (window.confirm(`¿Está seguro de eliminar al instructor ${instructor.firstName} ${instructor.lastName}?`)) {
      deleteInstructor.mutate(instructor.id)
    }
  }

  const handleBulkDelete = () => {
    if (selectedInstructors.size === 0) return
    
    if (window.confirm(`¿Está seguro de eliminar ${selectedInstructors.size} instructores?`)) {
      bulkDelete.mutate(Array.from(selectedInstructors), {
        onSuccess: () => setSelectedInstructors(new Set())
      })
    }
  }

  const handleExport = (format: 'csv' | 'xlsx') => {
    exportData.mutate({ query, format })
  }

  const getStatusBadge = (status: InstructorStatus) => {
    const variants = {
      ACTIVE: 'success',
      INACTIVE: 'secondary',
      SUSPENDED: 'destructive'
    } as const

    return (
      <Badge variant={variants[status]} size="sm">
        {status}
      </Badge>
    )
  }

  const getContractTypeBadge = (type: ContractType) => {
    const colors = {
      PLANTA: 'success',
      CONTRATO: 'warning', 
      CATEDRA: 'outline'
    } as const

    return (
      <Badge variant={colors[type]} size="sm">
        {type}
      </Badge>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error al cargar instructores: {error.message}</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Instructores</h1>
          <p className="text-gray-600 mt-1">
            {data?.total || 0} instructores registrados
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
            Nuevo Instructor
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nombre, documento o email..."
                value={query.search}
                onChange={(e) => handleSearch(e.target.value)}
                icon={Search}
              />
            </div>
            
            {selectedInstructors.size > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2"
              >
                <span className="text-sm text-gray-600">
                  {selectedInstructors.size} seleccionado(s)
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
                    <th className="text-left p-4 font-medium text-gray-900">Documento</th>
                    <th className="text-left p-4 font-medium text-gray-900">Nombre Completo</th>
                    <th className="text-left p-4 font-medium text-gray-900">Email</th>
                    <th className="text-left p-4 font-medium text-gray-900">Especialización</th>
                    <th className="text-left p-4 font-medium text-gray-900">Contrato</th>
                    <th className="text-left p-4 font-medium text-gray-900">Estado</th>
                    <th className="w-20 p-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {data?.items?.map((instructor) => (
                    <motion.tr
                      key={instructor.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="border-b hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-4">
                        <Square className="w-4 h-4 text-gray-400" />
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-medium">{instructor.documentNumber}</span>
                          <Badge variant="outline" size="sm">
                            {instructor.documentType}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {instructor.firstName} {instructor.lastName}
                          </span>
                          <span className="text-sm text-gray-500">
                            {instructor.department}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-gray-900">{instructor.email}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-gray-900">{instructor.specialization}</span>
                      </td>
                      <td className="p-4">
                        {getContractTypeBadge(instructor.contractType)}
                      </td>
                      <td className="p-4">
                        {getStatusBadge(instructor.status)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => onView?.(instructor)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => onEdit?.(instructor)}
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(instructor)}
                            disabled={deleteInstructor.isPending}
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
                  <p className="text-gray-500">No se encontraron instructores</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}