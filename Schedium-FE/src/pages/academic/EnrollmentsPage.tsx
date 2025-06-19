import { useState } from 'react'
import { EnrollmentList, EnrollmentForm, EnrollmentDetail } from '@/features/enrollment/components'
import { Enrollment } from '@/features/enrollment/types'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

export function EnrollmentsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null)

  const handleCreate = () => {
    setSelectedEnrollment(null)
    setViewMode('create')
  }

  const handleEdit = (enrollment: Enrollment) => {
    setSelectedEnrollment(enrollment)
    setViewMode('edit')
  }

  const handleView = (enrollment: Enrollment) => {
    setSelectedEnrollment(enrollment)
    setViewMode('detail')
  }

  const handleBackToList = () => {
    setSelectedEnrollment(null)
    setViewMode('list')
  }

  const handleFormSuccess = () => {
    handleBackToList()
  }

  const handleFormClose = () => {
    setSelectedEnrollment(null)
    setViewMode('list')
  }

  if (viewMode === 'detail' && selectedEnrollment) {
    return (
      <EnrollmentDetail
        enrollmentId={selectedEnrollment.id}
        onBack={handleBackToList}
        onEdit={handleEdit}
      />
    )
  }

  return (
    <div className="space-y-6">
      <EnrollmentList
        onCreate={handleCreate}
        onEdit={handleEdit}
        onView={handleView}
      />
      
      {(viewMode === 'create' || viewMode === 'edit') && (
        <EnrollmentForm
          enrollment={viewMode === 'edit' ? selectedEnrollment : null}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  )
}