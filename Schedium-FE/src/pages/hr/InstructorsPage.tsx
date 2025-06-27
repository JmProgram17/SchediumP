import { useState } from 'react'
import { InstructorList, InstructorForm, InstructorDetail } from '@/features/instructor/components'
import { Instructor } from '@/features/instructor/types'

export function InstructorsPage() {
  const [showForm, setShowForm] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null)

  const handleCreate = () => {
    setSelectedInstructor(null)
    setShowForm(true)
  }

  const handleEdit = (instructor: Instructor) => {
    setSelectedInstructor(instructor)
    setShowForm(true)
  }

  const handleView = (instructor: Instructor) => {
    setSelectedInstructor(instructor)
    setShowDetail(true)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setSelectedInstructor(null)
  }

  const handleDetailClose = () => {
    setShowDetail(false)
    setSelectedInstructor(null)
  }

  const handleFormSuccess = () => {
    console.log('🎉 [INSTRUCTORS PAGE] Form success called, closing modal')
    setShowForm(false)
    setSelectedInstructor(null)
  }

  return (
    <div className="space-y-6">
      <InstructorList
        onCreate={handleCreate}
        onEdit={handleEdit}
        onView={handleView}
      />

      {showForm && (
        <InstructorForm
          instructor={selectedInstructor}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}

      {showDetail && selectedInstructor && (
        <InstructorDetail
          instructorId={selectedInstructor.instructor_id}
          onBack={handleDetailClose}
          onEdit={() => {
            setShowDetail(false)
            handleEdit(selectedInstructor)
          }}
        />
      )}
    </div>
  )
}