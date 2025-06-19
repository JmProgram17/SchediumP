/**
 * StudentFilters Component - Advanced filtering panel
 * Provides comprehensive filtering options for student data
 */

import React from 'react'
import { motion } from 'framer-motion'
import { X, Filter, RotateCcw } from 'lucide-react'

import { Button } from '@/design-system/components/Button'
import { Input } from '@/design-system/components/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/design-system/components/Card'
import { StudentStatus, DocumentType, StudentListQuery } from '../types'

interface StudentFiltersProps {
  query: StudentListQuery
  onQueryChange: (query: URLSearchParams) => void
}

export const StudentFilters: React.FC<StudentFiltersProps> = ({
  query,
  onQueryChange
}) => {
  const handleFilterChange = (key: string, value: string) => {
    const newParams = new URLSearchParams(window.location.search)
    
    if (value) {
      newParams.set(key, value)
    } else {
      newParams.delete(key)
    }
    
    // Reset to first page when filtering
    newParams.set('page', '1')
    onQueryChange(newParams)
  }

  const handleClearFilters = () => {
    const newParams = new URLSearchParams()
    newParams.set('page', '1')
    newParams.set('limit', query.limit?.toString() || '10')
    onQueryChange(newParams)
  }

  const hasActiveFilters = !!(
    query.search ||
    query.status ||
    (query.sortBy && query.sortBy !== 'lastName') ||
    (query.sortOrder && query.sortOrder !== 'asc')
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtros Avanzados
          </CardTitle>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Limpiar
            </Button>
          )}
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                value={query.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos los estados</option>
                <option value={StudentStatus.ACTIVE}>Activo</option>
                <option value={StudentStatus.INACTIVE}>Inactivo</option>
                <option value={StudentStatus.SUSPENDED}>Suspendido</option>
              </select>
            </div>

            {/* Sort By Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ordenar por
              </label>
              <select
                value={query.sortBy || 'lastName'}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="lastName">Apellido</option>
                <option value="firstName">Nombre</option>
                <option value="email">Email</option>
                <option value="documentNumber">Documento</option>
                <option value="program">Programa</option>
                <option value="semester">Semestre</option>
                <option value="enrollmentDate">Fecha de Matrícula</option>
                <option value="createdAt">Fecha de Creación</option>
              </select>
            </div>

            {/* Sort Order Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Orden
              </label>
              <select
                value={query.sortOrder || 'asc'}
                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="asc">Ascendente</option>
                <option value="desc">Descendente</option>
              </select>
            </div>

            {/* Items per page */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Items por página
              </label>
              <select
                value={query.limit || 10}
                onChange={(e) => handleFilterChange('limit', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-blue-800">
                    Filtros activos:
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {query.search && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Búsqueda: "{query.search}"
                        <button
                          onClick={() => handleFilterChange('search', '')}
                          className="ml-1 hover:text-blue-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {query.status && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Estado: {query.status}
                        <button
                          onClick={() => handleFilterChange('status', '')}
                          className="ml-1 hover:text-blue-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {query.sortBy && query.sortBy !== 'lastName' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Orden: {query.sortBy} ({query.sortOrder})
                        <button
                          onClick={() => {
                            handleFilterChange('sortBy', '')
                            handleFilterChange('sortOrder', '')
                          }}
                          className="ml-1 hover:text-blue-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}