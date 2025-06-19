/**
 * ClassroomFilters Component - Advanced filtering following Student pattern
 * Provides comprehensive filtering options with state management
 */

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Filter, RotateCcw } from 'lucide-react'

import { Button } from '@/design-system/components/Button'
import { Input } from '@/design-system/components/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/design-system/components/Card'
import { Badge } from '@/design-system/components/Badge'
import { ClassroomStatus, ClassroomType } from '../types'

export interface ClassroomFiltersState {
  search: string
  status: ClassroomStatus | ''
  type: ClassroomType | ''
  building: string
  floor: string
  capacityMin: string
  capacityMax: string
  hasEquipment: string
  sortBy: 'name' | 'code' | 'capacity' | 'building' | 'floor'
  sortOrder: 'asc' | 'desc'
}

interface ClassroomFiltersProps {
  filters: ClassroomFiltersState
  onChange: (filters: ClassroomFiltersState) => void
  onClose?: () => void
  isOpen?: boolean
  className?: string
}

const defaultFilters: ClassroomFiltersState = {
  search: '',
  status: '',
  type: '',
  building: '',
  floor: '',
  capacityMin: '',
  capacityMax: '',
  hasEquipment: '',
  sortBy: 'name',
  sortOrder: 'asc'
}

export const ClassroomFilters: React.FC<ClassroomFiltersProps> = ({
  filters,
  onChange,
  onClose,
  isOpen = true,
  className
}) => {
  const [localFilters, setLocalFilters] = useState<ClassroomFiltersState>(filters)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  useEffect(() => {
    const filtersChanged = JSON.stringify(localFilters) !== JSON.stringify(filters)
    setHasChanges(filtersChanged)
  }, [localFilters, filters])

  const handleFilterChange = (key: keyof ClassroomFiltersState, value: string) => {
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
      return value !== '' && value !== defaultFilters[key as keyof ClassroomFiltersState]
    }).length
  }

  const getActiveFiltersBadges = () => {
    const badges = []
    
    if (localFilters.status) {
      const statusLabels = {
        ACTIVE: 'Activa',
        INACTIVE: 'Inactiva',
        MAINTENANCE: 'Mantenimiento'
      }
      badges.push({
        key: 'status',
        label: `Estado: ${statusLabels[localFilters.status as ClassroomStatus]}`,
        value: localFilters.status
      })
    }
    
    if (localFilters.type) {
      const typeLabels = {
        LABORATORIO: 'Laboratorio',
        AULA_TEORICA: 'Aula Teórica',
        TALLER: 'Taller',
        AUDITORIO: 'Auditorio'
      }
      badges.push({
        key: 'type',
        label: `Tipo: ${typeLabels[localFilters.type as ClassroomType]}`,
        value: localFilters.type
      })
    }
    
    if (localFilters.building) {
      badges.push({
        key: 'building',
        label: `Edificio: ${localFilters.building}`,
        value: localFilters.building
      })
    }
    
    if (localFilters.floor) {
      badges.push({
        key: 'floor',
        label: `Piso: ${localFilters.floor}`,
        value: localFilters.floor
      })
    }
    
    if (localFilters.capacityMin && localFilters.capacityMax) {
      badges.push({
        key: 'capacity',
        label: `Capacidad: ${localFilters.capacityMin}-${localFilters.capacityMax}`,
        value: 'range'
      })
    } else if (localFilters.capacityMin) {
      badges.push({
        key: 'capacityMin',
        label: `Capacidad mín: ${localFilters.capacityMin}`,
        value: localFilters.capacityMin
      })
    } else if (localFilters.capacityMax) {
      badges.push({
        key: 'capacityMax',
        label: `Capacidad máx: ${localFilters.capacityMax}`,
        value: localFilters.capacityMax
      })
    }
    
    if (localFilters.hasEquipment) {
      badges.push({
        key: 'hasEquipment',
        label: `Con equipamiento: ${localFilters.hasEquipment === 'true' ? 'Sí' : 'No'}`,
        value: localFilters.hasEquipment
      })
    }
    
    return badges
  }

  const handleRemoveFilter = (key: string) => {
    if (key === 'capacity') {
      handleFilterChange('capacityMin', '')
      handleFilterChange('capacityMax', '')
    } else {
      handleFilterChange(key as keyof ClassroomFiltersState, '')
    }
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
                      onClick={() => handleRemoveFilter(badge.key)}
                    >
                      {badge.label}
                      <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Status and Type Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <option value={ClassroomStatus.ACTIVE}>Activa</option>
                  <option value={ClassroomStatus.INACTIVE}>Inactiva</option>
                  <option value={ClassroomStatus.MAINTENANCE}>Mantenimiento</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Aula
                </label>
                <select
                  value={localFilters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos los tipos</option>
                  <option value={ClassroomType.AULA_TEORICA}>Aula Teórica</option>
                  <option value={ClassroomType.LABORATORIO}>Laboratorio</option>
                  <option value={ClassroomType.TALLER}>Taller</option>
                  <option value={ClassroomType.AUDITORIO}>Auditorio</option>
                </select>
              </div>
            </div>

            {/* Location Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Edificio"
                value={localFilters.building}
                onChange={(e) => handleFilterChange('building', e.target.value)}
                placeholder="Filtrar por edificio..."
              />

              <Input
                label="Piso"
                type="number"
                value={localFilters.floor}
                onChange={(e) => handleFilterChange('floor', e.target.value)}
                placeholder="Número de piso..."
              />
            </div>

            {/* Capacity Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rango de Capacidad
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Capacidad mínima"
                  type="number"
                  value={localFilters.capacityMin}
                  onChange={(e) => handleFilterChange('capacityMin', e.target.value)}
                  placeholder="Ej: 20"
                  min={1}
                />

                <Input
                  label="Capacidad máxima"
                  type="number"
                  value={localFilters.capacityMax}
                  onChange={(e) => handleFilterChange('capacityMax', e.target.value)}
                  placeholder="Ej: 100"
                  min={1}
                />
              </div>
            </div>

            {/* Equipment Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Equipamiento
              </label>
              <select
                value={localFilters.hasEquipment}
                onChange={(e) => handleFilterChange('hasEquipment', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas las aulas</option>
                <option value="true">Con equipamiento</option>
                <option value="false">Sin equipamiento</option>
              </select>
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
                    <option value="name">Nombre</option>
                    <option value="code">Código</option>
                    <option value="capacity">Capacidad</option>
                    <option value="building">Edificio</option>
                    <option value="floor">Piso</option>
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