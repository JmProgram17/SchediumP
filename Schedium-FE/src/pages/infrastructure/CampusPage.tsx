import React, { useState } from 'react'
import { CampusList, CampusModal } from '@/features/campus'
import type { Campus } from '@/features/campus'

export function CampusPage() {
  const [selectedCampus, setSelectedCampus] = useState<Campus | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')

  const handleCreate = () => {
    setSelectedCampus(null)
    setModalMode('create')
    setIsModalOpen(true)
  }

  const handleEdit = (campus: Campus) => {
    setSelectedCampus(campus)
    setModalMode('edit')
    setIsModalOpen(true)
  }

  const handleDetail = (campus: Campus) => {
    // TODO: Implementar vista de detalle o abrir modal de solo lectura
    console.log('View campus detail:', campus)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedCampus(null)
  }

  return (
    <>
      <CampusList
        onCreate={handleCreate}
        onEdit={handleEdit}
        onView={handleDetail}
      />

      <CampusModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        campus={selectedCampus}
        mode={modalMode}
      />
    </>
  )
}