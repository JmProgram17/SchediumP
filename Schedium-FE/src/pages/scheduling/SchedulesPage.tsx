import { useState } from 'react'
import { ScheduleList, ScheduleForm, ScheduleDetail } from '@/features/schedule/components'
import { Schedule } from '@/features/schedule/types'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

export function SchedulesPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null)

  const handleCreate = () => {
    setSelectedSchedule(null)
    setViewMode('create')
  }

  const handleEdit = (schedule: Schedule) => {
    setSelectedSchedule(schedule)
    setViewMode('edit')
  }

  const handleView = (schedule: Schedule) => {
    setSelectedSchedule(schedule)
    setViewMode('detail')
  }

  const handleBackToList = () => {
    setSelectedSchedule(null)
    setViewMode('list')
  }

  const handleFormSuccess = () => {
    handleBackToList()
  }

  const handleFormClose = () => {
    setSelectedSchedule(null)
    setViewMode('list')
  }

  if (viewMode === 'detail' && selectedSchedule) {
    return (
      <ScheduleDetail
        scheduleId={selectedSchedule.id}
        onBack={handleBackToList}
        onEdit={handleEdit}
      />
    )
  }

  return (
    <div className="space-y-6">
      <ScheduleList
        onCreate={handleCreate}
        onEdit={handleEdit}
        onView={handleView}
      />
      
      {(viewMode === 'create' || viewMode === 'edit') && (
        <ScheduleForm
          schedule={viewMode === 'edit' ? selectedSchedule : null}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  )
}