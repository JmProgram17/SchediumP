/**
 * EnvironmentList Component - Professional data table following established pattern
 * Implements CRUD operations with optimistic updates and accessibility
 */

import React, { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Search, 
  Plus, 
  Download, 
  Edit3,
  Trash2,
  Eye,
  Building,
  MapPin,
  Monitor
} from 'lucide-react'

import { Button } from '@/design-system/components/Button'
import { Input } from '@/design-system/components/Input'
import { Card, CardContent } from '@/design-system/components/Card'
import { Badge } from '@/design-system/components/Badge'
import { LoadingSpinner } from '@/design-system/components/LoadingSpinner'
import { 
  useEnvironmentList, 
  useDeleteEnvironment, 
  useBulkDeleteEnvironments,
  useExportEnvironments 
} from '../hooks'
import { Environment } from '../types'

interface EnvironmentListProps {
  className?: string
  onCreate?: () => void
  onEdit?: (environment: Environment) => void
  onView?: (environment: Environment) => void
}

export const EnvironmentList: React.FC<EnvironmentListProps> = ({ 
  className,
  onCreate,
  onEdit,
  onView
}) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedEnvironments, setSelectedEnvironments] = useState<Set<string>>(new Set())

  // Query parameters
  const query = useMemo(() => ({
    page: parseInt(searchParams.get('page') || '1'),
    page_size: parseInt(searchParams.get('page_size') || '10'),
    search: searchParams.get('search') || ''
  }), [searchParams])

  // API hooks
  const { data, isLoading, error } = useEnvironmentList(query)
  const deleteEnvironment = useDeleteEnvironment()
  const bulkDelete = useBulkDeleteEnvironments()
  const exportData = useExportEnvironments()

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

  const handleDelete = (environment: Environment) => {
    if (window.confirm(`¿Está seguro de eliminar el ambiente ${environment.room_number}?`)) {
      deleteEnvironment.mutate(environment.classroom_id)
    }
  }

  const handleBulkDelete = () => {
    if (selectedEnvironments.size === 0) return
    
    if (window.confirm(`¿Está seguro de eliminar ${selectedEnvironments.size} ambientes?`)) {
      bulkDelete.mutate(Array.from(selectedEnvironments).map(Number), {
        onSuccess: () => setSelectedEnvironments(new Set())
      })
    }
  }

  const handleExport = (format: 'csv' | 'xlsx') => {
    exportData.mutate({ query, format })
  }


  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error al cargar ambientes: {error.message}</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Ambientes</h1>
          <p className="text-gray-600 mt-1">
            {data?.total || 0} ambientes registrados
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
            Nuevo Ambiente
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nombre, código o tipo..."
                value={query.search}
                onChange={(e) => handleSearch(e.target.value)}
                icon={Search}
              />
            </div>
            
            {selectedEnvironments.size > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2"
              >
                <span className="text-sm text-gray-600">
                  {selectedEnvironments.size} seleccionado(s)
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
                    <th className="text-left p-4 font-medium text-gray-900">Ambiente</th>
                    <th className="text-left p-4 font-medium text-gray-900">Sede</th>
                    <th className="w-20 p-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {data?.items?.map((environment) => (
                    <motion.tr
                      key={environment.classroom_id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="border-b hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-medium">{environment.room_number}</span>
                          <span className="text-sm text-gray-500">
                            ID: {environment.classroom_id}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-medium">Aula {environment.room_number}</span>
                          <span className="text-sm text-gray-500">Código: {environment.room_number}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span>{environment.campus?.address || 'Sin sede'}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => onView?.(environment)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => onEdit?.(environment)}
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(environment)}
                            disabled={deleteEnvironment.isPending}
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
                  <Building className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No se encontraron ambientes</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}