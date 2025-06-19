/**
 * Schedule and Enrollment Integration Tests
 * Tests complex academic workflows involving schedules and enrollments
 */

import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import React from 'react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

import { App } from '@/App'
import { ThemeProvider } from '@/design-system/themes'
import { API_CONFIG } from '@/config'
import { authStore } from '@/stores/auth.store'

// Mock data
const mockCourses = [
  {
    id: 'course-1',
    code: 'CRS-001',
    name: 'Fundamentos de Programación',
    credits: 3,
    hours: 60,
    semester: 1
  },
  {
    id: 'course-2',
    code: 'CRS-002',
    name: 'Base de Datos',
    credits: 4,
    hours: 80,
    semester: 2
  }
]

const mockInstructors = [
  {
    id: 'instructor-1',
    firstName: 'Pedro',
    lastName: 'Hernández',
    email: 'pedro.hernandez@sena.edu.co',
    specialization: 'Sistemas'
  },
  {
    id: 'instructor-2',
    firstName: 'Laura',
    lastName: 'Jiménez',
    email: 'laura.jimenez@sena.edu.co',
    specialization: 'Base de Datos'
  }
]

const mockClassrooms = [
  {
    id: 'classroom-1',
    code: 'AUL-101',
    name: 'Aula 101',
    capacity: 30,
    type: 'LABORATORIO'
  },
  {
    id: 'classroom-2',
    code: 'AUL-102',
    name: 'Aula 102',
    capacity: 25,
    type: 'AULA_TEORICA'
  }
]

const mockStudents = [
  {
    id: 'student-1',
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan.perez@sena.edu.co',
    documentNumber: '1234567890',
    status: 'ACTIVE'
  },
  {
    id: 'student-2',
    firstName: 'María',
    lastName: 'García',
    email: 'maria.garcia@sena.edu.co',
    documentNumber: '9876543210',
    status: 'ACTIVE'
  }
]

let schedulesData = [
  {
    id: 'schedule-1',
    courseId: 'course-1',
    instructorId: 'instructor-1',
    classroomId: 'classroom-1',
    dayOfWeek: 'MONDAY',
    startTime: '07:00',
    endTime: '09:00',
    group: 'Grupo A',
    capacity: 25,
    enrolled: 2,
    status: 'ACTIVE'
  }
]

let enrollmentsData = [
  {
    id: 'enrollment-1',
    studentId: 'student-1',
    scheduleId: 'schedule-1',
    status: 'ENROLLED',
    enrollmentDate: '2024-02-01T00:00:00Z'
  },
  {
    id: 'enrollment-2',
    studentId: 'student-2',
    scheduleId: 'schedule-1',
    status: 'ENROLLED',
    enrollmentDate: '2024-02-01T00:00:00Z'
  }
]

// MSW server setup
const server = setupServer(
  // Auth endpoint
  http.get(`${API_CONFIG.BASE_URL}/auth/me`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        id: 1,
        username: 'admin',
        roles: [{ name: 'Administrator' }]
      }
    })
  }),

  // Courses endpoint
  http.get(`${API_CONFIG.BASE_URL}/api/courses`, () => {
    return HttpResponse.json({
      success: true,
      data: mockCourses,
      pagination: { page: 1, total: mockCourses.length }
    })
  }),

  // Instructors endpoint
  http.get(`${API_CONFIG.BASE_URL}/api/instructors`, () => {
    return HttpResponse.json({
      success: true,
      data: mockInstructors,
      pagination: { page: 1, total: mockInstructors.length }
    })
  }),

  // Classrooms endpoint
  http.get(`${API_CONFIG.BASE_URL}/api/classrooms`, () => {
    return HttpResponse.json({
      success: true,
      data: mockClassrooms,
      pagination: { page: 1, total: mockClassrooms.length }
    })
  }),

  // Students endpoint
  http.get(`${API_CONFIG.BASE_URL}/api/students`, () => {
    return HttpResponse.json({
      success: true,
      data: mockStudents,
      pagination: { page: 1, total: mockStudents.length }
    })
  }),

  // Schedules endpoints
  http.get(`${API_CONFIG.BASE_URL}/api/schedules`, () => {
    return HttpResponse.json({
      success: true,
      data: schedulesData,
      pagination: { page: 1, total: schedulesData.length }
    })
  }),

  http.get(`${API_CONFIG.BASE_URL}/api/schedules/:id`, ({ params }) => {
    const schedule = schedulesData.find(s => s.id === params.id)
    return HttpResponse.json({
      success: true,
      data: schedule
    })
  }),

  http.post(`${API_CONFIG.BASE_URL}/api/schedules`, async ({ request }) => {
    const body = await request.json() as any

    // Check for conflicts
    const conflicts = schedulesData.filter(s =>
      s.instructorId === body.instructorId &&
      s.dayOfWeek === body.dayOfWeek &&
      s.startTime === body.startTime &&
      s.classroomId === body.classroomId
    )

    if (conflicts.length > 0) {
      return HttpResponse.json(
        {
          success: false,
          message: 'Schedule conflict detected',
          conflicts
        },
        { status: 409 }
      )
    }

    const newSchedule = {
      id: `schedule-${schedulesData.length + 1}`,
      ...body,
      enrolled: 0,
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    }

    schedulesData.push(newSchedule)

    return HttpResponse.json({
      success: true,
      data: newSchedule
    }, { status: 201 })
  }),

  // Schedule conflict check
  http.post(`${API_CONFIG.BASE_URL}/api/schedules/check-conflicts`, async ({ request }) => {
    const body = await request.json() as any
    
    const conflicts = schedulesData.filter(s =>
      (s.instructorId === body.instructorId || s.classroomId === body.classroomId) &&
      s.dayOfWeek === body.dayOfWeek &&
      s.startTime === body.startTime
    )

    return HttpResponse.json({
      success: true,
      data: {
        hasConflicts: conflicts.length > 0,
        conflicts
      }
    })
  }),

  // Enrollments endpoints
  http.get(`${API_CONFIG.BASE_URL}/api/enrollments`, ({ request }) => {
    const url = new URL(request.url)
    const scheduleId = url.searchParams.get('scheduleId')
    
    let filteredEnrollments = enrollmentsData
    if (scheduleId) {
      filteredEnrollments = enrollmentsData.filter(e => e.scheduleId === scheduleId)
    }

    return HttpResponse.json({
      success: true,
      data: filteredEnrollments,
      pagination: { page: 1, total: filteredEnrollments.length }
    })
  }),

  http.post(`${API_CONFIG.BASE_URL}/api/enrollments`, async ({ request }) => {
    const body = await request.json() as any

    // Check if student is already enrolled
    const existingEnrollment = enrollmentsData.find(e =>
      e.studentId === body.studentId && e.scheduleId === body.scheduleId
    )

    if (existingEnrollment) {
      return HttpResponse.json(
        {
          success: false,
          message: 'Student is already enrolled in this schedule'
        },
        { status: 409 }
      )
    }

    // Check schedule capacity
    const schedule = schedulesData.find(s => s.id === body.scheduleId)
    const currentEnrollments = enrollmentsData.filter(e => e.scheduleId === body.scheduleId)

    if (schedule && currentEnrollments.length >= schedule.capacity) {
      return HttpResponse.json(
        {
          success: false,
          message: 'Schedule has reached maximum capacity'
        },
        { status: 409 }
      )
    }

    const newEnrollment = {
      id: `enrollment-${enrollmentsData.length + 1}`,
      ...body,
      status: 'ENROLLED',
      enrollmentDate: new Date().toISOString(),
      createdAt: new Date().toISOString()
    }

    enrollmentsData.push(newEnrollment)

    // Update schedule enrolled count
    if (schedule) {
      schedule.enrolled = currentEnrollments.length + 1
    }

    return HttpResponse.json({
      success: true,
      data: newEnrollment
    }, { status: 201 })
  }),

  // Bulk enrollment
  http.post(`${API_CONFIG.BASE_URL}/api/enrollments/bulk`, async ({ request }) => {
    const body = await request.json() as any
    const { studentIds, scheduleId } = body

    const newEnrollments = studentIds.map((studentId: string, index: number) => ({
      id: `enrollment-${enrollmentsData.length + index + 1}`,
      studentId,
      scheduleId,
      status: 'ENROLLED',
      enrollmentDate: new Date().toISOString(),
      createdAt: new Date().toISOString()
    }))

    enrollmentsData.push(...newEnrollments)

    return HttpResponse.json({
      success: true,
      data: newEnrollments,
      message: `${newEnrollments.length} students enrolled successfully`
    })
  }),

  http.delete(`${API_CONFIG.BASE_URL}/api/enrollments/:id`, ({ params }) => {
    const index = enrollmentsData.findIndex(e => e.id === params.id)
    
    if (index === -1) {
      return HttpResponse.json(
        { success: false, message: 'Enrollment not found' },
        { status: 404 }
      )
    }

    const enrollment = enrollmentsData[index]
    enrollmentsData.splice(index, 1)

    // Update schedule enrolled count
    const schedule = schedulesData.find(s => s.id === enrollment.scheduleId)
    if (schedule) {
      schedule.enrolled = Math.max(0, schedule.enrolled - 1)
    }

    return HttpResponse.json({
      success: true,
      message: 'Enrollment cancelled successfully'
    })
  })
)

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })

  return React.createElement(
    QueryClientProvider,
    { client: queryClient },
    React.createElement(
      BrowserRouter,
      null,
      React.createElement(
        ThemeProvider,
        null,
        children
      )
    )
  )
}

describe('Schedule and Enrollment Integration Tests', () => {
  beforeEach(() => {
    server.listen()
    authStore.getState().login({
      access_token: 'mock-token',
      refresh_token: 'mock-refresh',
      token_type: 'bearer',
      expires_in: 1800,
      user: {
        user_id: 1,
        id: 1,
        username: 'admin',
        email: 'admin@sena.edu.co',
        first_name: 'Admin',
        last_name: 'User',
        document_number: '12345678',
        active: true,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        roles: [{ role_id: 1, name: 'Administrator', description: 'Admin' }]
      }
    })
    
    // Reset data
    schedulesData = [
      {
        id: 'schedule-1',
        courseId: 'course-1',
        instructorId: 'instructor-1',
        classroomId: 'classroom-1',
        dayOfWeek: 'MONDAY',
        startTime: '07:00',
        endTime: '09:00',
        group: 'Grupo A',
        capacity: 25,
        enrolled: 2,
        status: 'ACTIVE'
      }
    ]
    
    enrollmentsData = [
      {
        id: 'enrollment-1',
        studentId: 'student-1',
        scheduleId: 'schedule-1',
        status: 'ENROLLED',
        enrollmentDate: '2024-02-01T00:00:00Z'
      },
      {
        id: 'enrollment-2',
        studentId: 'student-2',
        scheduleId: 'schedule-1',
        status: 'ENROLLED',
        enrollmentDate: '2024-02-01T00:00:00Z'
      }
    ]
  })

  afterEach(() => {
    server.resetHandlers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    server.close()
  })

  describe('Schedule Creation Flow', () => {
    it('should create a new schedule successfully', async () => {
      window.history.pushState({}, '', '/schedules/create')
      render(React.createElement(TestWrapper, null, React.createElement(App)))

      // Fill schedule form
      await waitFor(() => {
        expect(screen.getByText(/crear horario/i)).toBeInTheDocument()
      })

      // Select course
      const courseSelect = screen.getByLabelText(/curso/i)
      fireEvent.change(courseSelect, { target: { value: 'course-2' } })

      // Select instructor
      const instructorSelect = screen.getByLabelText(/instructor/i)
      fireEvent.change(instructorSelect, { target: { value: 'instructor-2' } })

      // Select classroom
      const classroomSelect = screen.getByLabelText(/aula/i)
      fireEvent.change(classroomSelect, { target: { value: 'classroom-2' } })

      // Set day and time
      const daySelect = screen.getByLabelText(/día/i)
      fireEvent.change(daySelect, { target: { value: 'TUESDAY' } })

      fireEvent.change(screen.getByLabelText(/hora inicio/i), {
        target: { value: '09:00' }
      })
      fireEvent.change(screen.getByLabelText(/hora fin/i), {
        target: { value: '11:00' }
      })

      // Set group and capacity
      fireEvent.change(screen.getByLabelText(/grupo/i), {
        target: { value: 'Grupo B' }
      })
      fireEvent.change(screen.getByLabelText(/capacidad/i), {
        target: { value: '20' }
      })

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /crear horario/i }))

      // Should show success message
      await waitFor(() => {
        expect(screen.getByText(/horario creado exitosamente/i)).toBeInTheDocument()
      })

      // Should redirect to schedules list
      await waitFor(() => {
        expect(screen.getByText(/base de datos/i)).toBeInTheDocument()
        expect(screen.getByText(/grupo b/i)).toBeInTheDocument()
      })
    })

    it('should detect and prevent schedule conflicts', async () => {
      window.history.pushState({}, '', '/schedules/create')
      render(React.createElement(TestWrapper, null, React.createElement(App)))

      await waitFor(() => {
        expect(screen.getByText(/crear horario/i)).toBeInTheDocument()
      })

      // Try to create conflicting schedule
      fireEvent.change(screen.getByLabelText(/curso/i), {
        target: { value: 'course-2' }
      })
      fireEvent.change(screen.getByLabelText(/instructor/i), {
        target: { value: 'instructor-1' } // Same instructor
      })
      fireEvent.change(screen.getByLabelText(/aula/i), {
        target: { value: 'classroom-1' } // Same classroom
      })
      fireEvent.change(screen.getByLabelText(/día/i), {
        target: { value: 'MONDAY' } // Same day
      })
      fireEvent.change(screen.getByLabelText(/hora inicio/i), {
        target: { value: '07:00' } // Same time
      })
      fireEvent.change(screen.getByLabelText(/hora fin/i), {
        target: { value: '09:00' }
      })

      fireEvent.click(screen.getByRole('button', { name: /crear horario/i }))

      // Should show conflict error
      await waitFor(() => {
        expect(screen.getByText(/schedule conflict detected/i)).toBeInTheDocument()
      })
    })
  })

  describe('Student Enrollment Flow', () => {
    it('should enroll student in a schedule', async () => {
      window.history.pushState({}, '', '/schedules/schedule-1/enrollments')
      render(React.createElement(TestWrapper, null, React.createElement(App)))

      // Should show current enrollments
      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
        expect(screen.getByText('María García')).toBeInTheDocument()
      })

      // Click add enrollment button
      const addButton = screen.getByRole('button', { name: /matricular estudiante/i })
      fireEvent.click(addButton)

      // Should show enrollment form
      await waitFor(() => {
        expect(screen.getByText(/matricular en horario/i)).toBeInTheDocument()
      })

      // Select an available student (not already enrolled)
      const studentSelect = screen.getByLabelText(/estudiante/i)
      // Note: This would be a new student not in the existing enrollments
      fireEvent.change(studentSelect, { target: { value: 'student-3' } })

      // Submit enrollment
      fireEvent.click(screen.getByRole('button', { name: /matricular/i }))

      // Should show success message
      await waitFor(() => {
        expect(screen.getByText(/estudiante matriculado exitosamente/i)).toBeInTheDocument()
      })
    })

    it('should prevent duplicate enrollments', async () => {
      window.history.pushState({}, '', '/schedules/schedule-1/enrollments')
      render(React.createElement(TestWrapper, null, React.createElement(App)))

      // Try to enroll already enrolled student
      const addButton = await screen.findByRole('button', { name: /matricular estudiante/i })
      fireEvent.click(addButton)

      await waitFor(() => {
        expect(screen.getByText(/matricular en horario/i)).toBeInTheDocument()
      })

      // Select already enrolled student
      fireEvent.change(screen.getByLabelText(/estudiante/i), {
        target: { value: 'student-1' }
      })

      fireEvent.click(screen.getByRole('button', { name: /matricular/i }))

      // Should show duplicate error
      await waitFor(() => {
        expect(screen.getByText(/student is already enrolled/i)).toBeInTheDocument()
      })
    })

    it('should handle bulk enrollment', async () => {
      window.history.pushState({}, '', '/schedules/schedule-1/bulk-enrollment')
      render(React.createElement(TestWrapper, null, React.createElement(App)))

      // Should show bulk enrollment form
      await waitFor(() => {
        expect(screen.getByText(/matrícula masiva/i)).toBeInTheDocument()
      })

      // Select multiple students
      const studentCheckboxes = screen.getAllByRole('checkbox')
      fireEvent.click(studentCheckboxes[0])
      fireEvent.click(studentCheckboxes[1])

      // Submit bulk enrollment
      fireEvent.click(screen.getByRole('button', { name: /matricular seleccionados/i }))

      // Should show success message with count
      await waitFor(() => {
        expect(screen.getByText(/students enrolled successfully/i)).toBeInTheDocument()
      })
    })
  })

  describe('Enrollment Management', () => {
    it('should allow canceling individual enrollments', async () => {
      window.history.pushState({}, '', '/schedules/schedule-1/enrollments')
      render(React.createElement(TestWrapper, null, React.createElement(App)))

      // Wait for enrollments to load
      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
      })

      // Find and click cancel enrollment button
      const enrollmentRow = screen.getByText('Juan Pérez').closest('tr')!
      const cancelButton = within(enrollmentRow).getByRole('button', { name: /cancelar/i })
      fireEvent.click(cancelButton)

      // Should show confirmation dialog
      await waitFor(() => {
        expect(screen.getByText(/confirmar cancelación/i)).toBeInTheDocument()
      })

      // Confirm cancellation
      fireEvent.click(screen.getByRole('button', { name: /confirmar/i }))

      // Should show success message
      await waitFor(() => {
        expect(screen.getByText(/matrícula cancelada exitosamente/i)).toBeInTheDocument()
      })

      // Student should be removed from enrollment list
      await waitFor(() => {
        expect(screen.queryByText('Juan Pérez')).not.toBeInTheDocument()
        expect(screen.getByText('María García')).toBeInTheDocument()
      })
    })

    it('should update schedule capacity in real-time', async () => {
      window.history.pushState({}, '', '/schedules/schedule-1')
      render(React.createElement(TestWrapper, null, React.createElement(App)))

      // Should show current enrollment count
      await waitFor(() => {
        expect(screen.getByText(/2\/25 estudiantes/i)).toBeInTheDocument()
      })

      // Navigate to enrollments and cancel one
      fireEvent.click(screen.getByRole('link', { name: /ver matrículas/i }))

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
      })

      // Cancel enrollment
      const enrollmentRow = screen.getByText('Juan Pérez').closest('tr')!
      const cancelButton = within(enrollmentRow).getByRole('button', { name: /cancelar/i })
      fireEvent.click(cancelButton)

      await waitFor(() => {
        expect(screen.getByText(/confirmar cancelación/i)).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /confirmar/i }))

      // Go back to schedule view
      fireEvent.click(screen.getByRole('link', { name: /volver al horario/i }))

      // Should show updated count
      await waitFor(() => {
        expect(screen.getByText(/1\/25 estudiantes/i)).toBeInTheDocument()
      })
    })
  })

  describe('Schedule Conflicts and Validation', () => {
    it('should show conflict warnings when checking schedule availability', async () => {
      window.history.pushState({}, '', '/schedules/conflicts')
      render(React.createElement(TestWrapper, null, React.createElement(App)))

      // Should show conflict checker form
      await waitFor(() => {
        expect(screen.getByText(/verificar disponibilidad/i)).toBeInTheDocument()
      })

      // Fill form with conflicting data
      fireEvent.change(screen.getByLabelText(/instructor/i), {
        target: { value: 'instructor-1' }
      })
      fireEvent.change(screen.getByLabelText(/día/i), {
        target: { value: 'MONDAY' }
      })
      fireEvent.change(screen.getByLabelText(/hora/i), {
        target: { value: '07:00' }
      })

      // Check for conflicts
      fireEvent.click(screen.getByRole('button', { name: /verificar/i }))

      // Should show conflict details
      await waitFor(() => {
        expect(screen.getByText(/conflictos encontrados/i)).toBeInTheDocument()
        expect(screen.getByText(/fundamentos de programación/i)).toBeInTheDocument()
      })
    })

    it('should validate schedule capacity limits', async () => {
      // Set schedule to maximum capacity
      schedulesData[0].capacity = 2
      schedulesData[0].enrolled = 2

      window.history.pushState({}, '', '/schedules/schedule-1/enrollments')
      render(React.createElement(TestWrapper, null, React.createElement(App)))

      // Try to add another enrollment
      const addButton = await screen.findByRole('button', { name: /matricular estudiante/i })
      
      // Button should be disabled or show capacity warning
      expect(addButton).toBeDisabled()
      expect(screen.getByText(/capacidad máxima alcanzada/i)).toBeInTheDocument()
    })
  })
})