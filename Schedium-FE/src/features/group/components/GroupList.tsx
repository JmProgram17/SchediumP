/**
 * GroupList Component - Student Groups (Fichas) data table
 * Displays groups with program info, chain, schedule, dates, and status
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
  Users,
  Calendar,
  Clock
} from 'lucide-react'

import { Button } from '@/design-system/components/Button'
import { Input } from '@/design-system/components/Input'
import { Card, CardContent } from '@/design-system/components/Card'
import { Badge } from '@/design-system/components/Badge'
import { LoadingSpinner } from '@/design-system/components/LoadingSpinner'
import { 
  useGroupList, 
  useDeleteGroup, 
  useBulkDeleteGroups,
  useExportGroups 
} from '../hooks'
import { StudentGroup } from '../types'

interface GroupListProps {
  className?: string
  onCreate?: () => void
  onEdit?: (group: StudentGroup) => void
  onView?: (group: StudentGroup) => void
}

export const GroupList: React.FC<GroupListProps> = ({ 
  className,
  onCreate,
  onEdit,
  onView
}) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedGroups, setSelectedGroups] = useState<Set<number>>(new Set())

  // Query parameters
  const query = useMemo(() => ({
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '10'),
    search: searchParams.get('search') || '',
    program_id: searchParams.get('program_id') ? parseInt(searchParams.get('program_id')!) : undefined,
    schedule_id: searchParams.get('schedule_id') ? parseInt(searchParams.get('schedule_id')!) : undefined,
    active: searchParams.get('active') ? searchParams.get('active') === 'true' : undefined,
    sortBy: searchParams.get('sortBy') as keyof StudentGroup || 'group_number',
    sortOrder: searchParams.get('sortOrder') as 'asc' | 'desc' || 'asc'
  }), [searchParams])

  // API hooks
  const { data, isLoading, error } = useGroupList(query)
  const deleteGroup = useDeleteGroup()
  const bulkDelete = useBulkDeleteGroups()
  const exportData = useExportGroups()

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

  const handleDelete = (group: StudentGroup) => {
    if (window.confirm(`¿Está seguro de eliminar la ficha ${group.group_number}?`)) {
      deleteGroup.mutate(group.group_id)
    }
  }

  const handleBulkDelete = () => {
    if (selectedGroups.size === 0) return
    
    if (window.confirm(`¿Está seguro de eliminar ${selectedGroups.size} fichas?`)) {
      bulkDelete.mutate(Array.from(selectedGroups), {
        onSuccess: () => setSelectedGroups(new Set())
      })
    }
  }

  const handleExport = (format: 'csv' | 'xlsx') => {
    exportData.mutate({ ...query, format })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-CO', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    })
  }

  const getChainBadge = (chainName?: string) => {
    if (!chainName) return null
    const isOpen = chainName.toLowerCase().includes('abierta')
    return (
      <Badge variant={isOpen ? "success" : "secondary"} size="sm">
        {chainName}
      </Badge>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error al cargar fichas: {error.message}</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Fichas</h1>
          <p className="text-gray-600 mt-1">
            {data?.total || 0} fichas registradas
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
            Nueva Ficha
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por número de ficha, programa, jornada..."
                value={query.search}
                onChange={(e) => handleSearch(e.target.value)}
                icon={Search}
              />
            </div>
            
            {selectedGroups.size > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2"
              >
                <span className="text-sm text-gray-600">
                  {selectedGroups.size} seleccionado(s)
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
                    <th className="text-left p-4 font-medium text-gray-900">Ficha</th>
                    <th className="text-left p-4 font-medium text-gray-900">Programa</th>
                    <th className="text-left p-4 font-medium text-gray-900">Cadena</th>
                    <th className="text-left p-4 font-medium text-gray-900">Jornada</th>
                    <th className="text-left p-4 font-medium text-gray-900">Fechas</th>
                    <th className="text-left p-4 font-medium text-gray-900">Estado</th>
                    <th className="text-center p-4 font-medium text-gray-900">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.items?.map((group) => (
                    <motion.tr
                      key={group.group_id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="border-b hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-4">
                        <div className="font-medium">{group.group_number}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {group.program?.nomenclature?.code || ''}-{group.program?.level?.study_type || ''}
                          </span>
                          <span className="text-sm text-gray-500">
                            {group.program?.name || 'Sin programa'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        {getChainBadge(group.program?.chain?.name)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">
                            {group.schedule?.name || 'Sin jornada'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col text-sm">
                          <span>Inicio: {formatDate(group.start_date)}</span>
                          <span>Fin: {formatDate(group.end_date)}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant={group.active ? "success" : "secondary"} size="sm">
                          {group.active ? "ACTIVO" : "INACTIVO"}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => onView?.(group)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => onEdit?.(group)}
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(group)}
                            disabled={deleteGroup.isPending}
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
                  <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No se encontraron fichas</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}