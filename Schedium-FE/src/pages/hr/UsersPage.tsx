import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/design-system/components'
import { UserList } from '@/features/user/components/UserList'
import { UserStats } from '@/features/user/components/UserStats'
import { UserModalHybrid } from '@/features/user/components/UserModalHybrid'
import { useUsers } from '@/features/user/hooks'

export function UsersPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const { data } = useUsers({ page: 1, limit: 1 })

  const handleCloseModal = () => {
    setIsCreateModalOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Usuarios</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {data?.total || 0} usuarios registrados
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus size={20} />
            Nuevo Usuario
          </Button>
        </div>
      </div>

      <UserStats />
      
      <UserList />

      {isCreateModalOpen && (
        <UserModalHybrid
          onClose={handleCloseModal}
          onSuccess={handleCloseModal}
        />
      )}
    </div>
  )
}

export default UsersPage