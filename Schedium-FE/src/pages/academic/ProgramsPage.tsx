import { useState } from 'react'
import { ProgramList, ProgramForm, ProgramDetail } from '@/features/program/components'
import { Program } from '@/features/program/types'

export function ProgramsPage() {
  const [showForm, setShowForm] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null)

  const handleCreate = () => {
    setSelectedProgram(null)
    setShowForm(true)
  }

  const handleEdit = (program: Program) => {
    setSelectedProgram(program)
    setShowForm(true)
  }

  const handleView = (program: Program) => {
    setSelectedProgram(program)
    setShowDetail(true)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setSelectedProgram(null)
  }

  const handleDetailClose = () => {
    setShowDetail(false)
    setSelectedProgram(null)
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setSelectedProgram(null)
  }

  return (
    <div className="space-y-6">
      <ProgramList
        onCreate={handleCreate}
        onEdit={handleEdit}
        onView={handleView}
      />

      {showForm && (
        <ProgramForm
          program={selectedProgram}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}

      {showDetail && selectedProgram && (
        <ProgramDetail
          programId={selectedProgram.id}
          onBack={handleDetailClose}
          onEdit={() => {
            setShowDetail(false)
            handleEdit(selectedProgram)
          }}
        />
      )}
    </div>
  )
}