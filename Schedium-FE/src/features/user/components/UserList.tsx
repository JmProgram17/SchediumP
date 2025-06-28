import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { 
  Edit2, 
  Eye, 
  Filter, 
  Search, 
  Trash2, 
  Users, 
  Mail, 
  Shield, 
  Calendar,
  MoreVertical,
  UserCheck,
  UserX,
  Key,
  Download
} from 'lucide-react'
import { Button, Card, Input, Modal } from '@/design-system/components'
import { Badge } from '@/design-system/components/Badge'
import { 
  useUsers, 
  useDeleteUser, 
  useToggleUserStatus,
  useResetPassword,
  useExportUsers
} from '../hooks'
import { UserModal } from './UserModal'
import { UserDetail } from './UserDetail'
import type { User, UserQuery } from '../types'

interface UserCardProps {
  user: User
  onEdit: (user: User) => void
  onDetail: (user: User) => void
  onDelete: (user: User) => void
  onToggleStatus: (user: User) => void
  onResetPassword: (user: User) => void
}

function UserCard({ user, onEdit, onDetail, onDelete, onToggleStatus, onResetPassword }: UserCardProps) {
  const [showActions, setShowActions] = useState(false)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="p-6 hover:shadow-md transition-shadow">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {user.first_name} {user.last_name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge 
                    variant={user.active ? "success" : "destructive"}
                    className="flex items-center gap-1"
                  >
                    {user.active ? <UserCheck size={14} /> : <UserX size={14} />}
                    {user.active ? 'Activo' : 'Inactivo'}
                  </Badge>
                  {user.role && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Shield size={14} />
                      {user.role.name}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Mail size={16} />
                <span className="truncate">{user.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users size={16} />
                <span>ID: {user.document_number}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span>Creado: {formatDate(user.created_at)}</span>
              </div>
              {user.last_login && (
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  <span>Último login: {formatDate(user.last_login)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDetail(user)}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <Eye size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(user)}
              className="text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300"
            >
              <Edit2 size={16} />
            </Button>
            
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowActions(!showActions)}
                className="text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <MoreVertical size={16} />
              </Button>
              
              {showActions && (
                <div className="absolute right-0 top-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10 min-w-48">
                  <button
                    onClick={() => {
                      onToggleStatus(user)
                      setShowActions(false)
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    {user.active ? <UserX size={14} /> : <UserCheck size={14} />}
                    {user.active ? 'Desactivar' : 'Activar'}
                  </button>
                  <button
                    onClick={() => {
                      onResetPassword(user)
                      setShowActions(false)
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Key size={14} />
                    Resetear contraseña
                  </button>
                  <hr className="border-gray-200 dark:border-gray-700" />
                  <button
                    onClick={() => {
                      onDelete(user)
                      setShowActions(false)
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900 text-red-600 dark:text-red-400 flex items-center gap-2"
                  >
                    <Trash2 size={14} />
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

export function UserList() {
  const [query, setQuery] = useState<UserQuery>({
    page: 1,
    limit: 10,
    search: ''
  })
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const { data, isLoading } = useUsers(query)
  const deleteMutation = useDeleteUser()
  const toggleStatusMutation = useToggleUserStatus()
  const resetPasswordMutation = useResetPassword()
  const exportMutation = useExportUsers()

  const handleSearch = (search: string) => {
    setQuery(prev => ({ ...prev, search, page: 1 }))
  }

  const handlePageChange = (page: number) => {
    setQuery(prev => ({ ...prev, page }))
  }

  const handleEdit = (user: User) => {
    setSelectedUser(user)
    setIsEditModalOpen(true)
  }

  const handleDetail = (user: User) => {
    setSelectedUser(user)
    setIsDetailModalOpen(true)
  }

  const handleDelete = (user: User) => {
    setSelectedUser(user)
    setIsDeleteModalOpen(true)
  }

  const handleToggleStatus = (user: User) => {
    toggleStatusMutation.mutate({
      id: user.user_id,
      active: !user.active
    })
  }

  const handleResetPassword = (user: User) => {
    resetPasswordMutation.mutate(user.user_id)
  }

  const handleExport = (format: 'csv' | 'xlsx' = 'csv') => {
    exportMutation.mutate({ query, format })
  }

  const confirmDelete = () => {
    if (selectedUser) {
      deleteMutation.mutate(selectedUser.user_id, {
        onSuccess: () => {
          setIsDeleteModalOpen(false)
          setSelectedUser(null)
        }
      })
    }
  }

  const closeModals = () => {
    setIsEditModalOpen(false)
    setIsDetailModalOpen(false)
    setIsDeleteModalOpen(false)
    setSelectedUser(null)
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
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
            <Input
              placeholder="Buscar usuarios..."
              value={query.search || ''}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Filter size={16} />
          </Button>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('csv')}
            disabled={exportMutation.isPending}
            className="flex items-center gap-2"
          >
            <Download size={16} />
            Exportar CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('xlsx')}
            disabled={exportMutation.isPending}
            className="flex items-center gap-2"
          >
            <Download size={16} />
            Exportar Excel
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {data?.items?.map((user) => (
            <UserCard
              key={user.user_id}
              user={user}
              onEdit={handleEdit}
              onDetail={handleDetail}
              onDelete={handleDelete}
              onToggleStatus={handleToggleStatus}
              onResetPassword={handleResetPassword}
            />
          ))}
        </AnimatePresence>
      </div>

      {data?.items && data.items.length === 0 && (
        <Card className="p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No se encontraron usuarios</p>
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

      {isEditModalOpen && selectedUser && (
        <UserModal 
          user={selectedUser}
          onClose={closeModals}
          onSuccess={closeModals} 
        />
      )}

      <Modal
        isOpen={isDetailModalOpen}
        onClose={closeModals}
        title="Detalles de Usuario"
        size="lg"
      >
        {selectedUser && (
          <UserDetail user={selectedUser} />
        )}
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={closeModals}
        title="Eliminar Usuario"
      >
        <div className="space-y-4">
          <p>¿Estás seguro de que deseas eliminar al usuario <strong>{selectedUser?.first_name} {selectedUser?.last_name}</strong>?</p>
          <p className="text-sm text-red-600 dark:text-red-400">Esta acción no se puede deshacer.</p>
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