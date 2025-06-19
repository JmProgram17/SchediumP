/**
 * StudentsPage - Complete student management interface
 * Professional page with CRUD functionality and responsive design
 */

import React from 'react'
import { StudentList } from '@/features/student/components'
import { FeatureErrorBoundary } from '@/components/error-boundaries'

export const StudentsPage: React.FC = () => {
  return (
    <FeatureErrorBoundary>
      <div className="container mx-auto px-4 py-6">
        <StudentList />
      </div>
    </FeatureErrorBoundary>
  )
}