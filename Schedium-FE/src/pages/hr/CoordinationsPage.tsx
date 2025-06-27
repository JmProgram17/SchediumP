import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button, Modal } from '@/design-system/components'
import { CoordinationList } from '@/features/coordination/components/CoordinationList'
import { CoordinationStats } from '@/features/coordination/components/CoordinationStats'
import { CoordinationForm } from '@/features/coordination/components/CoordinationForm'
import { useCoordinations } from '@/features/coordination/hooks'

export function CoordinationsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const { data } = useCoordinations({ page: 1, limit: 1 })

  const handleCloseModal = () => {
    setIsCreateModalOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Coordinaciones</h1>
          <p className="text-gray-600 mt-1">
            {data?.total || 0} coordinaciones registradas
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus size={20} />
            Nueva Coordinación
          </Button>
        </div>
      </div>

      <CoordinationStats />
      
      <CoordinationList />

      <Modal
        isOpen={isCreateModalOpen}
        onClose={handleCloseModal}
        title="Nueva Coordinación"
        size="lg"
      >
        <CoordinationForm onSuccess={handleCloseModal} />
      </Modal>
    </div>
  )
}

export default CoordinationsPage