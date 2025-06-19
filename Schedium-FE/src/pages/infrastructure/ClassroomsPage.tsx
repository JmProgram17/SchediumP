import { useState } from 'react'
import { ClassroomList, ClassroomForm, ClassroomDetail } from '@/features/classroom/components'
import { Classroom } from '@/features/classroom/types'

export function ClassroomsPage() {
  const [showForm, setShowForm] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null)

  const handleCreate = () => {
    setSelectedClassroom(null)
    setShowForm(true)
  }

  const handleEdit = (classroom: Classroom) => {
    setSelectedClassroom(classroom)
    setShowForm(true)
  }

  const handleView = (classroom: Classroom) => {
    setSelectedClassroom(classroom)
    setShowDetail(true)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setSelectedClassroom(null)
  }

  const handleDetailClose = () => {
    setShowDetail(false)
    setSelectedClassroom(null)
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setSelectedClassroom(null)
  }

  return (
    <div className="space-y-6">
      <ClassroomList
        onCreate={handleCreate}
        onEdit={handleEdit}
        onView={handleView}
      />

      {showForm && (
        <ClassroomForm
          classroom={selectedClassroom}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}

      {showDetail && selectedClassroom && (
        <ClassroomDetail
          classroomId={selectedClassroom.id}
          onBack={handleDetailClose}
          onEdit={() => {
            setShowDetail(false)
            handleEdit(selectedClassroom)
          }}
        />
      )}
    </div>
  )
}