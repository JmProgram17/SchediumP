/**
 * Quarter Management Component
 * Manages academic quarters (trimestres) with CRUD operations
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Calendar, 
  Search, 
  Filter,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Play,
  AlertTriangle,
  Clock,
  CalendarDays,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { Card, CardContent, Typography, Button } from '@/design-system/components'
import { cn } from '@/utils/cn'
import { formatDate } from '@/utils/date'

// Import hooks
import { 
  useQuarters, 
  useActiveQuarter, 
  useCreateQuarter, 
  useUpdateQuarter, 
  useDeleteQuarter,
  useActivateQuarter 
} from '@/services/query/hooks/academic-config.hooks'
import type { Quarter, QuarterFilters } from '@/services/api/academic-config.api'

// Import modals (we'll create these)
import { QuarterModal } from './QuarterModal'
import { DeleteConfirmModal } from './DeleteConfirmModal'

export function QuarterManagement() {
  const [filters, setFilters] = useState<QuarterFilters>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedQuarter, setSelectedQuarter] = useState<Quarter | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  
  // Carousel state
  const [currentIndex, setCurrentIndex] = useState(0)
  const cardsPerView = 2

  // Query hooks
  const { data: quartersData, isLoading, error, refetch } = useQuarters(filters)
  const { data: activeQuarter } = useActiveQuarter()
  
  // Mutation hooks
  const createMutation = useCreateQuarter()
  const updateMutation = useUpdateQuarter()
  const deleteMutation = useDeleteQuarter()
  const activateMutation = useActivateQuarter()

  const quarters = quartersData?.quarters || []
  const isAnyLoading = isLoading || createMutation.isPending || updateMutation.isPending || 
                     deleteMutation.isPending || activateMutation.isPending

  // Filter and sort quarters by search term and chronological order
  const filteredQuarters = quarters
    .filter(quarter =>
      quarter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quarter.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      // Sort by academic year first, then by quarter number
      if (a.academic_year !== b.academic_year) {
        return (a.academic_year || 0) - (b.academic_year || 0)
      }
      return (a.quarter_number || 0) - (b.quarter_number || 0)
    })

  const handleCreateQuarter = () => {
    setSelectedQuarter(null)
    setIsCreateModalOpen(true)
  }

  const handleEditQuarter = (quarter: Quarter) => {
    setSelectedQuarter(quarter)
    setIsEditModalOpen(true)
  }

  const handleDeleteQuarter = (quarter: Quarter) => {
    setSelectedQuarter(quarter)
    setIsDeleteModalOpen(true)
  }

  const handleActivateQuarter = async (quarter: Quarter) => {
    try {
      await activateMutation.mutateAsync(quarter.quarter_id)
    } catch (error) {
      console.error('Error activating quarter:', error)
    }
  }

  const confirmDelete = async () => {
    if (!selectedQuarter) return
    
    try {
      await deleteMutation.mutateAsync(selectedQuarter.quarter_id)
      setIsDeleteModalOpen(false)
      setSelectedQuarter(null)
    } catch (error) {
      console.error('Error deleting quarter:', error)
    }
  }

  const getQuarterStatus = (quarter: Quarter) => {
    const now = new Date()
    const startDate = new Date(quarter.start_date)
    const endDate = new Date(quarter.end_date)
    
    if (quarter.is_active) return 'active'
    if (now < startDate) return 'upcoming'
    if (now > endDate) return 'completed'
    return 'inactive'
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      active: { 
        label: 'Activo', 
        className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        icon: CheckCircle
      },
      upcoming: { 
        label: 'Próximo', 
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        icon: Clock
      },
      completed: { 
        label: 'Finalizado', 
        className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
        icon: XCircle
      },
      inactive: { 
        label: 'Inactivo', 
        className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
        icon: AlertTriangle
      }
    }
    
    const badge = badges[status as keyof typeof badges] || badges.inactive
    const Icon = badge.icon
    
    return (
      <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', badge.className)}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    )
  }

  // Carousel navigation functions
  const nextSlide = () => {
    const maxIndex = Math.max(0, filteredQuarters.length - cardsPerView)
    setCurrentIndex(prev => Math.min(prev + 1, maxIndex))
  }

  const prevSlide = () => {
    setCurrentIndex(prev => Math.max(prev - 1, 0))
  }

  const canGoNext = currentIndex < filteredQuarters.length - cardsPerView
  const canGoPrev = currentIndex > 0

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <Card variant="elevated">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <Typography variant="h2" className="text-gray-900 dark:text-gray-100 mb-2">
                Gestión de Trimestres
              </Typography>
              <Typography variant="body" className="text-gray-600 dark:text-gray-400">
                Administra los períodos académicos del sistema
              </Typography>
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                className="gap-2"
              >
                <Filter className="w-4 h-4" />
                Filtros
              </Button>
              
              <Button
                onClick={handleCreateQuarter}
                disabled={isAnyLoading}
                className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4" />
                Nuevo Trimestre
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mt-4 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar trimestres..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Advanced Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Estado
                        </label>
                        <select
                          value={filters.is_active?.toString() || ''}
                          onChange={(e) => setFilters({
                            ...filters,
                            is_active: e.target.value === '' ? undefined : e.target.value === 'true'
                          })}
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        >
                          <option value="">Todos</option>
                          <option value="true">Activo</option>
                          <option value="false">Inactivo</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Año Académico
                        </label>
                        <input
                          type="number"
                          placeholder="2024"
                          value={filters.academic_year || ''}
                          onChange={(e) => setFilters({
                            ...filters,
                            academic_year: e.target.value ? parseInt(e.target.value) : undefined
                          })}
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                      
                      <div className="flex items-end">
                        <Button
                          onClick={() => setFilters({})}
                          variant="outline"
                          className="w-full"
                        >
                          Limpiar Filtros
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      {/* Active Quarter Highlight */}
      {activeQuarter && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card variant="elevated" className="border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <Typography variant="h3" className="text-gray-900 dark:text-gray-100 mb-1">
                    Trimestre Activo: {activeQuarter.name}
                  </Typography>
                  <Typography variant="body" className="text-gray-600 dark:text-gray-400">
                    {formatDate(activeQuarter.start_date)} - {formatDate(activeQuarter.end_date)}
                    {activeQuarter.academic_year && ` • Año ${activeQuarter.academic_year}`}
                  </Typography>
                </div>
                <div className="text-right">
                  {getStatusBadge(getQuarterStatus(activeQuarter))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Quarters List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card variant="elevated">
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <Typography variant="body" className="text-gray-600 dark:text-gray-400">
                Cargando trimestres...
              </Typography>
            </CardContent>
          </Card>
        ) : error ? (
          <Card variant="elevated">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-4" />
              <Typography variant="h3" className="text-gray-900 dark:text-gray-100 mb-2">
                Error al cargar trimestres
              </Typography>
              <Typography variant="body" className="text-gray-600 dark:text-gray-400 mb-4">
                No se pudieron obtener los datos. Intenta de nuevo.
              </Typography>
              <Button onClick={() => refetch()} variant="outline">
                Reintentar
              </Button>
            </CardContent>
          </Card>
        ) : filteredQuarters.length === 0 ? (
          <Card variant="elevated">
            <CardContent className="p-8 text-center">
              <CalendarDays className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <Typography variant="h3" className="text-gray-900 dark:text-gray-100 mb-2">
                No hay trimestres
              </Typography>
              <Typography variant="body" className="text-gray-600 dark:text-gray-400 mb-4">
                {searchTerm ? 'No se encontraron trimestres con esos criterios.' : 'Aún no hay trimestres configurados.'}
              </Typography>
              {!searchTerm && (
                <Button onClick={handleCreateQuarter} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Crear Primer Trimestre
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="relative">
            {/* Carousel Header with Navigation */}
            <div className="flex items-center justify-between mb-4">
              <Typography variant="h3" className="text-gray-900 dark:text-gray-100">
                Trimestres ({filteredQuarters.length})
              </Typography>
              
              {/* Navigation Controls */}
              {filteredQuarters.length > cardsPerView && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={prevSlide}
                    disabled={!canGoPrev}
                    className="p-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  
                  <span className="text-sm text-gray-600 dark:text-gray-400 px-3">
                    {currentIndex + 1}-{Math.min(currentIndex + cardsPerView, filteredQuarters.length)} de {filteredQuarters.length}
                  </span>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={nextSlide}
                    disabled={!canGoNext}
                    className="p-2"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Carousel Container */}
            <div className="overflow-hidden">
              <motion.div
                className="flex gap-4"
                animate={{ x: -currentIndex * (100 / cardsPerView) + '%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                {filteredQuarters.map((quarter, index) => (
                  <motion.div
                    key={quarter.quarter_id}
                    className="flex-none"
                    style={{ width: `calc(${100 / cardsPerView}% - 0.75rem)` }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                <Card variant="elevated" className="h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Typography variant="h3" className="text-gray-900 dark:text-gray-100">
                            {quarter.name}
                          </Typography>
                          {getStatusBadge(getQuarterStatus(quarter))}
                        </div>
                        {quarter.description && (
                          <Typography variant="body2" className="text-gray-600 dark:text-gray-400 mb-2">
                            {quarter.description}
                          </Typography>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">
                          {formatDate(quarter.start_date)} - {formatDate(quarter.end_date)}
                        </span>
                      </div>
                      
                      {quarter.academic_year && (
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-400">
                            Año Académico {quarter.academic_year}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditQuarter(quarter)}
                          disabled={isAnyLoading}
                          className="gap-1"
                        >
                          <Edit className="w-3 h-3" />
                          Editar
                        </Button>
                        
                        {!quarter.is_active && getQuarterStatus(quarter) !== 'upcoming' && (
                          <Button
                            size="sm"
                            onClick={() => handleActivateQuarter(quarter)}
                            disabled={isAnyLoading}
                            className="gap-1 bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Play className="w-3 h-3" />
                            Activar
                          </Button>
                        )}
                      </div>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteQuarter(quarter)}
                        disabled={isAnyLoading || quarter.is_active}
                        className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-3 h-3" />
                        Eliminar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Indicators */}
            {filteredQuarters.length > cardsPerView && (
              <div className="flex justify-center mt-4 gap-2">
                {Array.from({ length: Math.ceil(filteredQuarters.length / cardsPerView) }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={cn(
                      'w-2 h-2 rounded-full transition-colors',
                      Math.floor(currentIndex / cardsPerView) === i
                        ? 'bg-blue-600 dark:bg-blue-400'
                        : 'bg-gray-300 dark:bg-gray-600'
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <QuarterModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={createMutation.mutateAsync}
        isLoading={createMutation.isPending}
      />

      <QuarterModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={(data) => updateMutation.mutateAsync({ 
          id: selectedQuarter!.quarter_id, 
          data 
        })}
        initialData={selectedQuarter}
        isLoading={updateMutation.isPending}
        mode="edit"
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        isLoading={deleteMutation.isPending}
        title="Eliminar Trimestre"
        message={`¿Estás seguro de que quieres eliminar el trimestre "${selectedQuarter?.name}"? Esta acción no se puede deshacer.`}
        warningMessage={selectedQuarter?.is_active ? "No puedes eliminar el trimestre activo." : undefined}
      />
    </div>
  )
}

export default QuarterManagement