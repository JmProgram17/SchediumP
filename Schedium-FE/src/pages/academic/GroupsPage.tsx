/**
 * GroupsPage - Main page for Student Groups (Fichas) management
 */

import React, { useState } from 'react'
import { GroupList, GroupForm } from '@/features/group/components'
import { StudentGroup } from '@/features/group/types'

const GroupsPage: React.FC = () => {
  const [selectedGroup, setSelectedGroup] = useState<StudentGroup | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)

  const handleCreate = () => {
    setSelectedGroup(null)
    setIsFormOpen(true)
  }

  const handleEdit = (group: StudentGroup) => {
    setSelectedGroup(group)
    setIsFormOpen(true)
  }

  const handleView = (group: StudentGroup) => {
    setSelectedGroup(group)
    setIsViewOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setSelectedGroup(null)
  }

  const handleCloseView = () => {
    setIsViewOpen(false)
    setSelectedGroup(null)
  }

  const handleSuccess = () => {
    // React Query se encarga automáticamente de refrescar los datos
    // No necesitamos hacer nada adicional aquí
  }

  return (
    <div className="space-y-6">
      <GroupList
        onCreate={handleCreate}
        onEdit={handleEdit}
        onView={handleView}
      />
      
      {/* GroupForm Modal */}
      {isFormOpen && (
        <GroupForm
          group={selectedGroup}
          onClose={handleCloseForm}
          onSuccess={handleSuccess}
        />
      )}

      {/* TODO: Add GroupDetail modal when isViewOpen is true */}
    </div>
  )
}

export default GroupsPage