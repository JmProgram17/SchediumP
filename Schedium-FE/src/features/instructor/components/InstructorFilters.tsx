/**
 * InstructorFilters Component - Advanced filtering following Student pattern
 * Provides comprehensive filtering options with state management
 */

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Filter, RotateCcw } from 'lucide-react'

import { Button } from '@/design-system/components/Button'
import { Input } from '@/design-system/components/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/design-system/components/Card'
import { Badge } from '@/design-system/components/Badge'
import { InstructorStatus, ContractType, DocumentType } from '../types'

export interface InstructorFiltersState {
  search: string
  status: InstructorStatus | ''
  contractType: ContractType | ''
  documentType: DocumentType | ''
  department: string
  specialization: string
  hireDateFrom: string
  hireDateTo: string
  sortBy: 'firstName' | 'lastName' | 'email' | 'hireDate' | 'department'
  sortOrder: 'asc' | 'desc'
}

interface InstructorFiltersProps {
  filters: InstructorFiltersState
  onChange: (filters: InstructorFiltersState) => void
  onClose?: () => void
  isOpen?: boolean
  className?: string
}

const defaultFilters: InstructorFiltersState = {
  search: '',
  status: '',
  contractType: '',
  documentType: '',
  department: '',
  specialization: '',
  hireDateFrom: '',
  hireDateTo: '',
  sortBy: 'lastName',
  sortOrder: 'asc'
}

export const InstructorFilters: React.FC<InstructorFiltersProps> = ({
  filters,
  onChange,
  onClose,
  isOpen = true,
  className
}) => {
  const [localFilters, setLocalFilters] = useState<InstructorFiltersState>(filters)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  useEffect(() => {
    const filtersChanged = JSON.stringify(localFilters) !== JSON.stringify(filters)
    setHasChanges(filtersChanged)
  }, [localFilters, filters])

  const handleFilterChange = (key: keyof InstructorFiltersState, value: string) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleApplyFilters = () => {
    onChange(localFilters)
    onClose?.()
  }

  const handleResetFilters = () => {
    setLocalFilters(defaultFilters)
    onChange(defaultFilters)
  }

  const getActiveFiltersCount = () => {
    return Object.entries(localFilters).filter(([key, value]) => {
      if (key === 'sortBy' || key === 'sortOrder') return false
      return value !== '' && value !== defaultFilters[key as keyof InstructorFiltersState]
    }).length
  }

  const getActiveFiltersBadges = () => {
    const badges = []
    
    if (localFilters.status) {
      badges.push({
        key: 'status',
        label: `Estado: ${localFilters.status}`,
        value: localFilters.status
      })
    }
    
    if (localFilters.contractType) {
      badges.push({
        key: 'contractType',
        label: `Contrato: ${localFilters.contractType}`,
        value: localFilters.contractType
      })
    }
    
    if (localFilters.documentType) {
      badges.push({
        key: 'documentType',
        label: `Documento: ${localFilters.documentType}`,
        value: localFilters.documentType
      })
    }
    
    if (localFilters.department) {
      badges.push({
        key: 'department',
        label: `Departamento: ${localFilters.department}`,
        value: localFilters.department
      })
    }
    
    if (localFilters.specialization) {
      badges.push({
        key: 'specialization',
        label: `Especialización: ${localFilters.specialization}`,
        value: localFilters.specialization
      })
    }
    
    if (localFilters.hireDateFrom) {
      badges.push({
        key: 'hireDateFrom',
        label: `Desde: ${localFilters.hireDateFrom}`,
        value: localFilters.hireDateFrom
      })
    }
    
    if (localFilters.hireDateTo) {
      badges.push({
        key: 'hireDateTo',
        label: `Hasta: ${localFilters.hireDateTo}`,
        value: localFilters.hireDateTo
      })
    }
    
    return badges
  }

  if (!isOpen) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className={className}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros Avanzados
              {getActiveFiltersCount() > 0 && (
                <Badge variant="secondary" size="sm">
                  {getActiveFiltersCount()}
                </Badge>
              )}
            </CardTitle>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Active Filters */}
            {getActiveFiltersBadges().length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Filtros Activos
                </label>
                <div className="flex flex-wrap gap-2">
                  {getActiveFiltersBadges().map((badge) => (
                    <Badge
                      key={badge.key}
                      variant="secondary"
                      className="cursor-pointer hover:bg-gray-200"
                      onClick={() => handleFilterChange(badge.key as keyof InstructorFiltersState, '')}
                    >
                      {badge.label}
                      <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Status and Contract Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  value={localFilters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos los estados</option>
                  {Object.values(InstructorStatus).map((status) => (
                    <option key={status} value={status}>
                      {status === 'ACTIVE' ? 'Activo' : 
                       status === 'INACTIVE' ? 'Inactivo' : 'Suspendido'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Contrato
                </label>
                <select
                  value={localFilters.contractType}
                  onChange={(e) => handleFilterChange('contractType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos los contratos</option>
                  {Object.values(ContractType).map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Documento
                </label>
                <select
                  value={localFilters.documentType}
                  onChange={(e) => handleFilterChange('documentType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos los documentos</option>
                  {Object.values(DocumentType).map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Department and Specialization */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Departamento"
                value={localFilters.department}
                onChange={(e) => handleFilterChange('department', e.target.value)}
                placeholder="Filtrar por departamento..."
              />

              <Input
                label="Especialización"
                value={localFilters.specialization}
                onChange={(e) => handleFilterChange('specialization', e.target.value)}
                placeholder="Filtrar por especialización..."
              />
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rango de Fecha de Contratación
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Desde"
                  type="date"
                  value={localFilters.hireDateFrom}
                  onChange={(e) => handleFilterChange('hireDateFrom', e.target.value)}
                />

                <Input
                  label="Hasta"
                  type="date"
                  value={localFilters.hireDateTo}
                  onChange={(e) => handleFilterChange('hireDateTo', e.target.value)}
                />
              </div>
            </div>

            {/* Sort Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ordenamiento
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Ordenar por
                  </label>
                  <select
                    value={localFilters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="lastName">Apellido</option>
                    <option value="firstName">Nombre</option>
                    <option value="email">Email</option>
                    <option value="hireDate">Fecha de Contratación</option>
                    <option value="department">Departamento</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Orden
                  </label>
                  <select
                    value={localFilters.sortOrder}
                    onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="asc">Ascendente</option>
                    <option value="desc">Descendente</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleResetFilters}
                disabled={getActiveFiltersCount() === 0}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Limpiar Filtros
              </Button>

              <div className="flex items-center gap-3">
                {onClose && (
                  <Button variant="outline" onClick={onClose}>
                    Cancelar
                  </Button>
                )}
                <Button
                  onClick={handleApplyFilters}
                  disabled={!hasChanges}
                >
                  Aplicar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}