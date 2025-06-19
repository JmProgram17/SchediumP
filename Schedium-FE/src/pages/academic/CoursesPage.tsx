import { useState } from 'react'
import { CourseList, CourseForm, CourseDetail } from '@/features/course/components'
import { Course } from '@/features/course/types'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

export function CoursesPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)

  const handleCreate = () => {
    setSelectedCourse(null)
    setViewMode('create')
  }

  const handleEdit = (course: Course) => {
    setSelectedCourse(course)
    setViewMode('edit')
  }

  const handleView = (course: Course) => {
    setSelectedCourse(course)
    setViewMode('detail')
  }

  const handleBackToList = () => {
    setSelectedCourse(null)
    setViewMode('list')
  }

  const handleFormSuccess = () => {
    handleBackToList()
  }

  const handleFormClose = () => {
    setSelectedCourse(null)
    setViewMode('list')
  }

  if (viewMode === 'detail' && selectedCourse) {
    return (
      <CourseDetail
        courseId={selectedCourse.id}
        onBack={handleBackToList}
        onEdit={handleEdit}
      />
    )
  }

  return (
    <div className="space-y-6">
      <CourseList
        onCreate={handleCreate}
        onEdit={handleEdit}
        onView={handleView}
      />
      
      {(viewMode === 'create' || viewMode === 'edit') && (
        <CourseForm
          course={viewMode === 'edit' ? selectedCourse : null}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  )
}