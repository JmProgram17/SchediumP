import React, { useState } from 'react'
import { EnvironmentList, EnvironmentModal } from '@/features/environment'
import type { Environment } from '@/features/environment'

export default function EnvironmentsPage() {
  const [selectedEnvironment, setSelectedEnvironment] = useState<Environment | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')

  const handleCreate = () => {
    setSelectedEnvironment(null)
    setModalMode('create')
    setIsModalOpen(true)
  }

  const handleEdit = (environment: Environment) => {
    setSelectedEnvironment(environment)
    setModalMode('edit')
    setIsModalOpen(true)
  }

  const handleDetail = (environment: Environment) => {
    // TODO: Implementar vista de detalle o abrir modal de solo lectura
    console.log('View environment detail:', environment)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedEnvironment(null)
  }

  return (
    <>
      <EnvironmentList
        onCreate={handleCreate}
        onEdit={handleEdit}
        onDetail={handleDetail}
      />

      <EnvironmentModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        environment={selectedEnvironment}
        mode={modalMode}
      />
    </>
  )
}