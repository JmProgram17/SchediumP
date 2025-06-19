/**
 * Schedule Flow Integration Tests - Complete schedule management workflow testing
 * Tests end-to-end user flows for schedule creation, editing, and conflict resolution
 */

import { screen, waitFor, within } from '@testing-library/react'
import { QueryClient } from '@tanstack/react-query'
import { 
  render, 
  createMockSchedule, 
  createMockInstructor, 
  createMockClassroom,
  mockFetch,
  waitForCondition 
} from '../utils/testUtils'
import App from '../../App'

// Mock API endpoints
const mockApiEndpoints = () => {
  const schedules = [
    createMockSchedule({
      id: '1',
      title: 'Mathematics 101',
      startTime: '09:00',
      endTime: '10:30',
      dayOfWeek: 'monday',
      instructorId: '1',
      classroomId: '1',
    }),
    createMockSchedule({
      id: '2',
      title: 'Physics 201',
      startTime: '11:00',
      endTime: '12:30',
      dayOfWeek: 'tuesday',
      instructorId: '2',
      classroomId: '2',
    }),
  ]

  const instructors = [
    createMockInstructor({ id: '1', name: 'Dr. Smith', specializations: ['Mathematics'] }),
    createMockInstructor({ id: '2', name: 'Prof. Johnson', specializations: ['Physics'] }),
    createMockInstructor({ id: '3', name: 'Dr. Brown', specializations: ['Chemistry'] }),
  ]

  const classrooms = [
    createMockClassroom({ id: '1', name: 'Room A-101', capacity: 30 }),
    createMockClassroom({ id: '2', name: 'Room B-202', capacity: 25 }),
    createMockClassroom({ id: '3', name: 'Lab C-303', capacity: 20 }),
  ]

  const programs = [
    { id: '1', name: 'Computer Science', code: 'CS' },
    { id: '2', name: 'Mathematics', code: 'MATH' },
    { id: '3', name: 'Physics', code: 'PHYS' },
  ]

  // Setup fetch mocks for different endpoints
  global.fetch = jest.fn().mockImplementation((url: string, options?: any) => {
    const method = options?.method || 'GET'
    
    if (url.includes('/api/v1/schedules') && method === 'GET') {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(schedules),
      })
    }
    
    if (url.includes('/api/v1/instructors') && method === 'GET') {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(instructors),
      })
    }
    
    if (url.includes('/api/v1/classrooms') && method === 'GET') {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(classrooms),
      })
    }
    
    if (url.includes('/api/v1/programs') && method === 'GET') {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(programs),
      })
    }
    
    if (url.includes('/api/v1/schedules') && method === 'POST') {
      const newSchedule = createMockSchedule({
        id: '3',
        ...JSON.parse(options.body),
      })
      schedules.push(newSchedule)
      return Promise.resolve({
        ok: true,
        status: 201,
        json: () => Promise.resolve(newSchedule),
      })
    }
    
    if (url.includes('/api/v1/schedules/') && method === 'PUT') {
      const scheduleId = url.split('/').pop()
      const updatedData = JSON.parse(options.body)
      const scheduleIndex = schedules.findIndex(s => s.id === scheduleId)
      if (scheduleIndex !== -1) {
        schedules[scheduleIndex] = { ...schedules[scheduleIndex], ...updatedData }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(schedules[scheduleIndex]),
        })
      }
    }
    
    if (url.includes('/api/v1/schedules/') && method === 'DELETE') {
      const scheduleId = url.split('/').pop()
      const scheduleIndex = schedules.findIndex(s => s.id === scheduleId)
      if (scheduleIndex !== -1) {
        schedules.splice(scheduleIndex, 1)
        return Promise.resolve({
          ok: true,
          status: 204,
        })
      }
    }
    
    if (url.includes('/api/v1/conflicts/check')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ conflicts: [] }),
      })
    }
    
    return Promise.reject(new Error(`Unhandled API call: ${method} ${url}`))
  })
}

describe('Schedule Management Flow', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: Infinity },
        mutations: { retry: false },
      },
    })
    
    mockApiEndpoints()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Schedule Creation Flow', () => {
    it('creates a new schedule through the complete workflow', async () => {
      const { user } = render(<App />, { 
        queryClient,
        route: '/schedules'
      })

      // Wait for the schedules page to load
      await waitFor(() => {
        expect(screen.getByTestId('schedule-matrix')).toBeInTheDocument()
      })

      // Step 1: Click "New Schedule" button
      const newScheduleButton = screen.getByRole('button', { name: /new schedule/i })
      await user.click(newScheduleButton)

      // Step 2: Fill in basic information
      await waitFor(() => {
        expect(screen.getByRole('dialog', { name: /create schedule/i })).toBeInTheDocument()
      })

      const titleInput = screen.getByLabelText(/schedule title/i)
      await user.clear(titleInput)
      await user.type(titleInput, 'Chemistry 301')

      const descriptionInput = screen.getByLabelText(/description/i)
      await user.type(descriptionInput, 'Advanced Chemistry course')

      // Step 3: Select program
      const programSelect = screen.getByLabelText(/program/i)
      await user.selectOptions(programSelect, '2') // Mathematics program

      // Step 4: Select instructor
      const instructorSelect = screen.getByLabelText(/instructor/i)
      await user.selectOptions(instructorSelect, '3') // Dr. Brown

      // Step 5: Select classroom
      const classroomSelect = screen.getByLabelText(/classroom/i)
      await user.selectOptions(classroomSelect, '3') // Lab C-303

      // Step 6: Set time and day
      const daySelect = screen.getByLabelText(/day of week/i)
      await user.selectOptions(daySelect, 'wednesday')

      const startTimeInput = screen.getByLabelText(/start time/i)
      await user.clear(startTimeInput)
      await user.type(startTimeInput, '14:00')

      const endTimeInput = screen.getByLabelText(/end time/i)
      await user.clear(endTimeInput)
      await user.type(endTimeInput, '15:30')

      // Step 7: Save the schedule
      const saveButton = screen.getByRole('button', { name: /save schedule/i })
      await user.click(saveButton)

      // Step 8: Verify the schedule appears in the matrix
      await waitFor(() => {
        expect(screen.getByText('Chemistry 301')).toBeInTheDocument()
        expect(screen.getByText('Dr. Brown')).toBeInTheDocument()
        expect(screen.getByText('Lab C-303')).toBeInTheDocument()
      })

      // Step 9: Verify the dialog is closed
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

      // Step 10: Verify success notification
      expect(screen.getByText(/schedule created successfully/i)).toBeInTheDocument()
    })

    it('validates form inputs and shows error messages', async () => {
      const { user } = render(<App />, { 
        queryClient,
        route: '/schedules'
      })

      await waitFor(() => {
        expect(screen.getByTestId('schedule-matrix')).toBeInTheDocument()
      })

      // Open new schedule dialog
      const newScheduleButton = screen.getByRole('button', { name: /new schedule/i })
      await user.click(newScheduleButton)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Try to save without filling required fields
      const saveButton = screen.getByRole('button', { name: /save schedule/i })
      await user.click(saveButton)

      // Verify validation errors
      await waitFor(() => {
        expect(screen.getByText(/title is required/i)).toBeInTheDocument()
        expect(screen.getByText(/instructor is required/i)).toBeInTheDocument()
        expect(screen.getByText(/classroom is required/i)).toBeInTheDocument()
      })

      // Dialog should remain open
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('detects and displays conflicts during creation', async () => {
      // Mock conflict detection
      global.fetch = jest.fn().mockImplementation((url: string, options?: any) => {
        if (url.includes('/api/v1/conflicts/check')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({
              conflicts: [
                {
                  id: 'conflict-1',
                  type: 'instructor_overlap',
                  severity: 'high',
                  message: 'Dr. Smith already has a class at this time',
                  suggestions: [
                    { type: 'move_time', description: 'Move to 15:00-16:30' },
                    { type: 'change_instructor', description: 'Use Dr. Brown instead' },
                  ]
                }
              ]
            }),
          })
        }
        // Return default responses for other endpoints
        return mockApiEndpoints()
      })

      const { user } = render(<App />, { 
        queryClient,
        route: '/schedules'
      })

      await waitFor(() => {
        expect(screen.getByTestId('schedule-matrix')).toBeInTheDocument()
      })

      // Create a schedule that conflicts with existing one
      const newScheduleButton = screen.getByRole('button', { name: /new schedule/i })
      await user.click(newScheduleButton)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Fill form with conflicting data
      await user.type(screen.getByLabelText(/title/i), 'Conflicting Schedule')
      await user.selectOptions(screen.getByLabelText(/instructor/i), '1') // Dr. Smith
      await user.selectOptions(screen.getByLabelText(/classroom/i), '2')
      await user.selectOptions(screen.getByLabelText(/day/i), 'monday')
      await user.type(screen.getByLabelText(/start time/i), '09:30')
      await user.type(screen.getByLabelText(/end time/i), '11:00')

      // Try to save
      const saveButton = screen.getByRole('button', { name: /save schedule/i })
      await user.click(saveButton)

      // Verify conflict warning appears
      await waitFor(() => {
        expect(screen.getByText(/conflict detected/i)).toBeInTheDocument()
        expect(screen.getByText('Dr. Smith already has a class at this time')).toBeInTheDocument()
      })

      // Verify suggestions are shown
      expect(screen.getByText('Move to 15:00-16:30')).toBeInTheDocument()
      expect(screen.getByText('Use Dr. Brown instead')).toBeInTheDocument()
    })
  })

  describe('Schedule Editing Flow', () => {
    it('edits an existing schedule', async () => {
      const { user } = render(<App />, { 
        queryClient,
        route: '/schedules'
      })

      await waitFor(() => {
        expect(screen.getByTestId('schedule-matrix')).toBeInTheDocument()
      })

      // Find and click on existing schedule
      const scheduleCard = screen.getByText('Mathematics 101').closest('[data-testid="schedule-card"]')
      expect(scheduleCard).toBeInTheDocument()

      // Right-click to open context menu
      await user.pointer({ keys: '[MouseRight>]', target: scheduleCard! })

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument()
      })

      // Click edit option
      const editOption = screen.getByRole('menuitem', { name: /edit/i })
      await user.click(editOption)

      // Verify edit dialog opens with existing data
      await waitFor(() => {
        expect(screen.getByRole('dialog', { name: /edit schedule/i })).toBeInTheDocument()
      })

      const titleInput = screen.getByLabelText(/title/i)
      expect(titleInput).toHaveValue('Mathematics 101')

      // Modify the title
      await user.clear(titleInput)
      await user.type(titleInput, 'Advanced Mathematics 101')

      // Change the time
      const startTimeInput = screen.getByLabelText(/start time/i)
      await user.clear(startTimeInput)
      await user.type(startTimeInput, '10:00')

      // Save changes
      const saveButton = screen.getByRole('button', { name: /save changes/i })
      await user.click(saveButton)

      // Verify changes are reflected in the matrix
      await waitFor(() => {
        expect(screen.getByText('Advanced Mathematics 101')).toBeInTheDocument()
        expect(screen.queryByText('Mathematics 101')).not.toBeInTheDocument()
      })

      // Verify success notification
      expect(screen.getByText(/schedule updated successfully/i)).toBeInTheDocument()
    })

    it('handles editing conflicts gracefully', async () => {
      // Mock conflict on edit
      global.fetch = jest.fn().mockImplementation((url: string, options?: any) => {
        if (url.includes('/api/v1/schedules/') && options?.method === 'PUT') {
          return Promise.resolve({
            ok: false,
            status: 409,
            json: () => Promise.resolve({
              error: 'Conflict detected',
              conflicts: [
                {
                  type: 'classroom_overlap',
                  message: 'Room A-101 is already booked at this time',
                }
              ]
            }),
          })
        }
        return mockApiEndpoints()
      })

      const { user } = render(<App />, { 
        queryClient,
        route: '/schedules'
      })

      await waitFor(() => {
        expect(screen.getByTestId('schedule-matrix')).toBeInTheDocument()
      })

      // Edit existing schedule
      const scheduleCard = screen.getByText('Mathematics 101').closest('[data-testid="schedule-card"]')
      await user.pointer({ keys: '[MouseRight>]', target: scheduleCard! })

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('menuitem', { name: /edit/i }))

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Make conflicting changes
      const startTimeInput = screen.getByLabelText(/start time/i)
      await user.clear(startTimeInput)
      await user.type(startTimeInput, '11:00') // Conflicts with Physics 201

      const saveButton = screen.getByRole('button', { name: /save changes/i })
      await user.click(saveButton)

      // Verify error handling
      await waitFor(() => {
        expect(screen.getByText(/room a-101 is already booked/i)).toBeInTheDocument()
      })

      // Dialog should remain open for user to fix
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })

  describe('Drag and Drop Flow', () => {
    it('moves schedule via drag and drop', async () => {
      const { user } = render(<App />, { 
        queryClient,
        route: '/schedules'
      })

      await waitFor(() => {
        expect(screen.getByTestId('schedule-matrix')).toBeInTheDocument()
      })

      // Find schedule to move
      const scheduleCard = screen.getByText('Mathematics 101').closest('[data-testid="schedule-card"]')
      expect(scheduleCard).toBeInTheDocument()

      // Find target time slot
      const targetSlot = screen.getByTestId('time-slot-tuesday-10-00')
      expect(targetSlot).toBeInTheDocument()

      // Perform drag and drop
      await user.drag(scheduleCard!, targetSlot)

      // Verify schedule moved
      await waitFor(() => {
        // Schedule should now appear in Tuesday 10:00 slot
        const tuesdayColumn = screen.getByTestId('day-column-tuesday')
        expect(within(tuesdayColumn).getByText('Mathematics 101')).toBeInTheDocument()
      })

      // Verify API call was made
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/schedules/1'),
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('"dayOfWeek":"tuesday"'),
        })
      )
    })

    it('prevents invalid drops and shows feedback', async () => {
      const { user } = render(<App />, { 
        queryClient,
        route: '/schedules'
      })

      await waitFor(() => {
        expect(screen.getByTestId('schedule-matrix')).toBeInTheDocument()
      })

      const scheduleCard = screen.getByText('Mathematics 101').closest('[data-testid="schedule-card"]')
      const occupiedSlot = screen.getByTestId('time-slot-tuesday-11-00') // Physics 201 time

      // Try to drop on occupied slot
      await user.drag(scheduleCard!, occupiedSlot)

      // Verify drop was rejected
      await waitFor(() => {
        expect(screen.getByText(/cannot move schedule to occupied time slot/i)).toBeInTheDocument()
      })

      // Schedule should remain in original position
      const mondayColumn = screen.getByTestId('day-column-monday')
      expect(within(mondayColumn).getByText('Mathematics 101')).toBeInTheDocument()
    })
  })

  describe('Conflict Resolution Flow', () => {
    it('resolves conflicts using automatic suggestions', async () => {
      // Setup scenario with conflicts
      global.fetch = jest.fn().mockImplementation((url: string, options?: any) => {
        if (url.includes('/api/v1/schedules') && options?.method === 'GET') {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve([
              createMockSchedule({
                id: '1',
                title: 'Mathematics 101',
                startTime: '09:00',
                endTime: '10:30',
                dayOfWeek: 'monday',
                instructorId: '1',
                classroomId: '1',
              }),
              createMockSchedule({
                id: '2',
                title: 'Conflicting Schedule',
                startTime: '09:30',
                endTime: '11:00',
                dayOfWeek: 'monday',
                instructorId: '1', // Same instructor = conflict
                classroomId: '2',
              }),
            ]),
          })
        }
        
        if (url.includes('/api/v1/conflicts')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve([
              {
                id: 'conflict-1',
                type: 'instructor_overlap',
                scheduleIds: ['1', '2'],
                severity: 'high',
                message: 'Dr. Smith has overlapping schedules',
                suggestions: [
                  {
                    id: 'suggestion-1',
                    type: 'move_time',
                    description: 'Move Conflicting Schedule to 11:00-12:30',
                    targetScheduleId: '2',
                    changes: { startTime: '11:00', endTime: '12:30' }
                  },
                  {
                    id: 'suggestion-2',
                    type: 'change_instructor',
                    description: 'Assign Dr. Brown to Conflicting Schedule',
                    targetScheduleId: '2',
                    changes: { instructorId: '3' }
                  }
                ]
              }
            ]),
          })
        }
        
        return mockApiEndpoints()
      })

      const { user } = render(<App />, { 
        queryClient,
        route: '/schedules'
      })

      await waitFor(() => {
        expect(screen.getByTestId('schedule-matrix')).toBeInTheDocument()
      })

      // Conflict should be visible
      await waitFor(() => {
        expect(screen.getByTestId('conflict-indicator')).toBeInTheDocument()
      })

      // Click on conflict indicator
      const conflictIndicator = screen.getByTestId('conflict-indicator')
      await user.click(conflictIndicator)

      // Conflict resolution dialog should open
      await waitFor(() => {
        expect(screen.getByRole('dialog', { name: /resolve conflict/i })).toBeInTheDocument()
      })

      // Verify conflict details
      expect(screen.getByText('Dr. Smith has overlapping schedules')).toBeInTheDocument()

      // Verify suggestions are shown
      expect(screen.getByText('Move Conflicting Schedule to 11:00-12:30')).toBeInTheDocument()
      expect(screen.getByText('Assign Dr. Brown to Conflicting Schedule')).toBeInTheDocument()

      // Select first suggestion and apply
      const firstSuggestion = screen.getByText('Move Conflicting Schedule to 11:00-12:30')
        .closest('[data-testid="suggestion-card"]')
      
      const applyButton = within(firstSuggestion!).getByRole('button', { name: /apply/i })
      await user.click(applyButton)

      // Verify resolution
      await waitFor(() => {
        expect(screen.getByText(/conflict resolved successfully/i)).toBeInTheDocument()
      })

      // Dialog should close
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

      // Conflict indicator should disappear
      expect(screen.queryByTestId('conflict-indicator')).not.toBeInTheDocument()
    })
  })

  describe('Real-time Updates Flow', () => {
    it('handles real-time schedule updates from other users', async () => {
      render(<App />, { 
        queryClient,
        route: '/schedules'
      })

      await waitFor(() => {
        expect(screen.getByTestId('schedule-matrix')).toBeInTheDocument()
      })

      // Simulate WebSocket message for new schedule
      const newSchedule = createMockSchedule({
        id: '4',
        title: 'New Real-time Schedule',
        startTime: '13:00',
        endTime: '14:30',
        dayOfWeek: 'friday',
        instructorId: '2',
        classroomId: '3',
      })

      // Simulate WebSocket event
      window.dispatchEvent(new CustomEvent('websocket-message', {
        detail: {
          type: 'schedule_created',
          data: newSchedule
        }
      }))

      // Verify new schedule appears
      await waitFor(() => {
        expect(screen.getByText('New Real-time Schedule')).toBeInTheDocument()
      })

      // Verify notification
      expect(screen.getByText(/new schedule added by another user/i)).toBeInTheDocument()
    })

    it('handles real-time conflict notifications', async () => {
      render(<App />, { 
        queryClient,
        route: '/schedules'
      })

      await waitFor(() => {
        expect(screen.getByTestId('schedule-matrix')).toBeInTheDocument()
      })

      // Simulate real-time conflict detection
      window.dispatchEvent(new CustomEvent('websocket-message', {
        detail: {
          type: 'conflict_detected',
          data: {
            conflict: {
              id: 'real-time-conflict',
              type: 'classroom_overlap',
              scheduleIds: ['1', '2'],
              severity: 'medium',
              message: 'Real-time conflict detected'
            }
          }
        }
      }))

      // Verify conflict notification appears
      await waitFor(() => {
        expect(screen.getByText('Real-time conflict detected')).toBeInTheDocument()
      })

      // Verify conflict indicator appears
      expect(screen.getByTestId('conflict-indicator')).toBeInTheDocument()
    })
  })
})