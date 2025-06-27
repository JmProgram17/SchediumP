import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Edit2, Eye, Filter, Search, Trash2, Users, Mail, Phone, BookOpen, GraduationCap, Building2 } from 'lucide-react'
import { Button, Card, Input, Modal } from '@/design-system/components'
import { Badge } from '@/design-system/components/Badge'
import { useCoordinations, useDeleteCoordination, useCoordinationCounts } from '../hooks'
import { CoordinationForm } from './CoordinationForm'
import { CoordinationDetail } from './CoordinationDetail'
import type { Coordination, CoordinationQuery } from '../types'

interface CoordinationCardProps {
  coordination: Coordination
  onEdit: (coordination: Coordination) => void
  onDetail: (coordination: Coordination) => void
  onDelete: (coordination: Coordination) => void
}

function CoordinationCard({ coordination, onEdit, onDetail, onDelete }: CoordinationCardProps) {
  const { data: counts, isLoading: loadingCounts } = useCoordinationCounts(coordination.department_id)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{coordination.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  {coordination.coordinator && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Users size={14} />
                      {coordination.coordinator.full_name || `${coordination.coordinator.first_name} ${coordination.coordinator.last_name}`}
                    </Badge>
                  )}
                  {!coordination.coordinator && (
                    <Badge variant="outline" className="text-amber-600 border-amber-200">
                      Sin Coordinador
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              {coordination.email && (
                <div className="flex items-center gap-1">
                  <Mail size={16} />
                  <span>{coordination.email}</span>
                </div>
              )}
              {coordination.phone_number && (
                <div className="flex items-center gap-1">
                  <Phone size={16} />
                  <span>{coordination.phone_number}</span>
                </div>
              )}
            </div>

            {/* Contadores */}
            <div className="flex flex-wrap gap-4 pt-2 border-t border-gray-100">
              {loadingCounts ? (
                <div className="flex gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-gray-200 h-6 w-16 rounded"></div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <BookOpen size={16} className="text-blue-500" />
                    <span className="font-medium">{counts?.programs_count || 0}</span>
                    <span>programas</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <GraduationCap size={16} className="text-green-500" />
                    <span className="font-medium">{counts?.student_groups_count || 0}</span>
                    <span>fichas</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Users size={16} className="text-purple-500" />
                    <span className="font-medium">{counts?.instructors_count || 0}</span>
                    <span>instructores</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Building2 size={16} className="text-orange-500" />
                    <span className="font-medium">{counts?.classrooms_count || 0}</span>
                    <span>ambientes</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDetail(coordination)}
              className="text-blue-600 hover:text-blue-700"
            >
              <Eye size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(coordination)}
              className="text-yellow-600 hover:text-yellow-700"
            >
              <Edit2 size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(coordination)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

export function CoordinationList() {
  const [query, setQuery] = useState<CoordinationQuery>({
    page: 1,
    limit: 10,
    search: ''
  })
  const [selectedCoordination, setSelectedCoordination] = useState<Coordination | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const { data, isLoading } = useCoordinations(query)
  const deleteMutation = useDeleteCoordination()

  const handleSearch = (search: string) => {
    setQuery(prev => ({ ...prev, search, page: 1 }))
  }

  const handlePageChange = (page: number) => {
    setQuery(prev => ({ ...prev, page }))
  }

  const handleEdit = (coordination: Coordination) => {
    setSelectedCoordination(coordination)
    setIsEditModalOpen(true)
  }

  const handleDetail = (coordination: Coordination) => {
    setSelectedCoordination(coordination)
    setIsDetailModalOpen(true)
  }

  const handleDelete = (coordination: Coordination) => {
    setSelectedCoordination(coordination)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = () => {
    if (selectedCoordination) {
      deleteMutation.mutate(selectedCoordination.department_id, {
        onSuccess: () => {
          setIsDeleteModalOpen(false)
          setSelectedCoordination(null)
        }
      })
    }
  }

  const closeModals = () => {
    setIsCreateModalOpen(false)
    setIsEditModalOpen(false)
    setIsDetailModalOpen(false)
    setIsDeleteModalOpen(false)
    setSelectedCoordination(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="Buscar coordinaciones..."
              value={query.search || ''}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Filter size={16} />
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Coordinaciones con Coordinador Asignado */}
        {data?.items?.filter(coord => coord.coordinator).length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
              Coordinaciones con Coordinador Asignado
            </h2>
            <div className="grid gap-4">
              <AnimatePresence>
                {data.items
                  .filter(coord => coord.coordinator)
                  .map((coordination) => (
                    <CoordinationCard
                      key={coordination.department_id}
                      coordination={coordination}
                      onEdit={handleEdit}
                      onDetail={handleDetail}
                      onDelete={handleDelete}
                    />
                  ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Coordinaciones sin Coordinador */}
        {data?.items?.filter(coord => !coord.coordinator).length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
              Coordinaciones sin Coordinador
            </h2>
            <div className="grid gap-4">
              <AnimatePresence>
                {data.items
                  .filter(coord => !coord.coordinator)
                  .map((coordination) => (
                    <CoordinationCard
                      key={coordination.department_id}
                      coordination={coordination}
                      onEdit={handleEdit}
                      onDetail={handleDetail}
                      onDelete={handleDelete}
                    />
                  ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      {data?.items && data.items.length === 0 && (
        <Card className="p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">No se encontraron coordinaciones</p>
        </Card>
      )}

      {data && data.pages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: data.pages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={page === query.page ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePageChange(page)}
            >
              {page}
            </Button>
          ))}
        </div>
      )}

      <Modal
        isOpen={isCreateModalOpen}
        onClose={closeModals}
        title="Nueva Coordinación"
        size="lg"
      >
        <CoordinationForm onSuccess={closeModals} />
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={closeModals}
        title="Editar Coordinación"
        size="lg"
      >
        {selectedCoordination && (
          <CoordinationForm 
            coordination={selectedCoordination} 
            onSuccess={closeModals} 
          />
        )}
      </Modal>

      <Modal
        isOpen={isDetailModalOpen}
        onClose={closeModals}
        title="Detalles de Coordinación"
        size="lg"
      >
        {selectedCoordination && (
          <CoordinationDetail coordination={selectedCoordination} />
        )}
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={closeModals}
        title="Eliminar Coordinación"
      >
        <div className="space-y-4">
          <p>¿Estás seguro de que deseas eliminar la coordinación <strong>{selectedCoordination?.name}</strong>?</p>
          <p className="text-sm text-red-600">Esta acción no se puede deshacer.</p>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={closeModals}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}