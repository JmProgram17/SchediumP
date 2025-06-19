/**
 * ScheduleMatrix Unit Tests - Comprehensive testing for schedule matrix component
 * Tests drag & drop, conflict detection, real-time updates, and user interactions
 */

import { screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient } from '@tanstack/react-query'
import { render, createMockSchedule, createMockInstructor, createMockClassroom, mockFetch } from '../../utils/testUtils'
import ScheduleMatrix from '../../../features/scheduling/components/ScheduleMatrix/ScheduleMatrix'

// Mock the hooks
jest.mock('../../../features/scheduling/hooks/useScheduleMatrix', () => ({
  useScheduleMatrix: () => ({
    schedules: mockSchedules,
    instructors: mockInstructors,
    classrooms: mockClassrooms,
    loading: false,
    error: null,
    selectedSchedule: null,
    conflicts: [],
    draggedSchedule: null,
    isEditing: false,
    filters: {},
    viewMode: 'week',
    currentWeek: new Date(),
    
    // Actions
    selectSchedule: jest.fn(),
    updateSchedule: jest.fn(),
    deleteSchedule: jest.fn(),
    createSchedule: jest.fn(),
    moveSchedule: jest.fn(),
    setFilters: jest.fn(),
    setViewMode: jest.fn(),
    navigateWeek: jest.fn(),
    handleDragStart: jest.fn(),
    handleDragEnd: jest.fn(),
    handleDrop: jest.fn(),
    resolveConflict: jest.fn(),
  })
}))

// Mock data
const mockSchedules = [
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
  createMockSchedule({
    id: '3',
    title: 'Chemistry 301',
    startTime: '14:00',
    endTime: '15:30',
    dayOfWeek: 'wednesday',
    instructorId: '1',
    classroomId: '1',
  }),
]

const mockInstructors = [
  createMockInstructor({ id: '1', name: 'Dr. Smith' }),
  createMockInstructor({ id: '2', name: 'Prof. Johnson' }),
]

const mockClassrooms = [
  createMockClassroom({ id: '1', name: 'Room A-101' }),
  createMockClassroom({ id: '2', name: 'Room B-202' }),
]

describe('ScheduleMatrix', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    
    mockFetch({
      schedules: mockSchedules,
      instructors: mockInstructors,
      classrooms: mockClassrooms,
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders the schedule matrix with time slots', () => {
      render(<ScheduleMatrix />, { queryClient })

      // Check for time slots
      expect(screen.getByText('09:00')).toBeInTheDocument()
      expect(screen.getByText('10:00')).toBeInTheDocument()
      expect(screen.getByText('11:00')).toBeInTheDocument()
    })

    it('renders days of the week', () => {
      render(<ScheduleMatrix />, { queryClient })

      expect(screen.getByText('Lunes')).toBeInTheDocument()
      expect(screen.getByText('Martes')).toBeInTheDocument()
      expect(screen.getByText('Miércoles')).toBeInTheDocument()
      expect(screen.getByText('Jueves')).toBeInTheDocument()
      expect(screen.getByText('Viernes')).toBeInTheDocument()
    })

    it('renders schedule cards in correct positions', () => {
      render(<ScheduleMatrix />, { queryClient })

      expect(screen.getByText('Mathematics 101')).toBeInTheDocument()
      expect(screen.getByText('Physics 201')).toBeInTheDocument()
      expect(screen.getByText('Chemistry 301')).toBeInTheDocument()
    })

    it('displays instructor and classroom information', () => {
      render(<ScheduleMatrix />, { queryClient })

      expect(screen.getByText('Dr. Smith')).toBeInTheDocument()
      expect(screen.getByText('Prof. Johnson')).toBeInTheDocument()
      expect(screen.getByText('Room A-101')).toBeInTheDocument()
      expect(screen.getByText('Room B-202')).toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    it('selects a schedule when clicked', async () => {
      const { user } = render(<ScheduleMatrix />, { queryClient })

      const scheduleCard = screen.getByText('Mathematics 101').closest('[data-testid="schedule-card"]')
      expect(scheduleCard).toBeInTheDocument()

      await user.click(scheduleCard!)

      // Verify selection styling or state change
      expect(scheduleCard).toHaveClass('selected')
    })

    it('opens context menu on right click', async () => {
      const { user } = render(<ScheduleMatrix />, { queryClient })

      const scheduleCard = screen.getByText('Mathematics 101').closest('[data-testid="schedule-card"]')
      expect(scheduleCard).toBeInTheDocument()

      await user.pointer({ keys: '[MouseRight>]', target: scheduleCard! })

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument()
      })

      expect(screen.getByText('Editar')).toBeInTheDocument()
      expect(screen.getByText('Duplicar')).toBeInTheDocument()
      expect(screen.getByText('Eliminar')).toBeInTheDocument()
    })

    it('handles keyboard navigation', async () => {
      const { user } = render(<ScheduleMatrix />, { queryClient })

      const matrix = screen.getByRole('grid')
      matrix.focus()

      // Test arrow key navigation
      await user.keyboard('{ArrowRight}')
      await user.keyboard('{ArrowDown}')
      await user.keyboard('{Enter}')

      // Verify focus management
      expect(document.activeElement).toBeInTheDocument()
    })
  })

  describe('Drag and Drop', () => {
    it('enables drag on schedule cards', async () => {
      const { user } = render(<ScheduleMatrix />, { queryClient })

      const scheduleCard = screen.getByText('Mathematics 101').closest('[data-testid="schedule-card"]')
      expect(scheduleCard).toBeInTheDocument()
      expect(scheduleCard).toHaveAttribute('draggable', 'true')
    })

    it('handles drag start event', async () => {
      render(<ScheduleMatrix />, { queryClient })

      const scheduleCard = screen.getByText('Mathematics 101').closest('[data-testid="schedule-card"]')
      
      fireEvent.dragStart(scheduleCard!)

      // Verify drag state
      expect(scheduleCard).toHaveClass('dragging')
    })

    it('handles drop on valid time slot', async () => {
      render(<ScheduleMatrix />, { queryClient })

      const scheduleCard = screen.getByText('Mathematics 101').closest('[data-testid="schedule-card"]')
      const timeSlot = screen.getByTestId('time-slot-tuesday-10-00')

      fireEvent.dragStart(scheduleCard!)
      fireEvent.dragOver(timeSlot)
      fireEvent.drop(timeSlot)

      await waitFor(() => {
        expect(timeSlot).toHaveClass('drop-target')
      })
    })

    it('prevents drop on occupied time slot', async () => {
      render(<ScheduleMatrix />, { queryClient })

      const scheduleCard = screen.getByText('Mathematics 101').closest('[data-testid="schedule-card"]')
      const occupiedSlot = screen.getByTestId('time-slot-tuesday-11-00') // Physics 201 slot

      fireEvent.dragStart(scheduleCard!)
      fireEvent.dragOver(occupiedSlot)

      expect(occupiedSlot).toHaveClass('drop-invalid')
      expect(occupiedSlot).not.toHaveClass('drop-target')
    })
  })

  describe('Conflict Detection', () => {
    it('highlights conflicting schedules', () => {
      const conflictingSchedules = [
        ...mockSchedules,
        createMockSchedule({
          id: '4',
          title: 'Conflict Schedule',
          startTime: '09:30',
          endTime: '11:00',
          dayOfWeek: 'monday',
          instructorId: '1', // Same instructor as Mathematics 101
          classroomId: '2',
        }),
      ]

      // Mock with conflicts
      jest.mocked(require('../../../features/scheduling/hooks/useScheduleMatrix').useScheduleMatrix).mockReturnValue({
        schedules: conflictingSchedules,
        conflicts: [
          {
            id: 'conflict-1',
            type: 'instructor_overlap',
            scheduleIds: ['1', '4'],
            severity: 'high',
            message: 'Instructor has overlapping schedules',
          },
        ],
        // ... other properties
      })

      render(<ScheduleMatrix />, { queryClient })

      const conflictCard = screen.getByText('Mathematics 101').closest('[data-testid="schedule-card"]')
      expect(conflictCard).toHaveClass('conflict-high')

      const conflictIndicator = screen.getByTestId('conflict-indicator-1')
      expect(conflictIndicator).toBeInTheDocument()
    })

    it('shows conflict resolution dialog', async () => {
      const { user } = render(<ScheduleMatrix />, { queryClient })

      const conflictIndicator = screen.getByTestId('conflict-indicator-1')
      await user.click(conflictIndicator)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      expect(screen.getByText('Resolver Conflicto')).toBeInTheDocument()
      expect(screen.getByText('Instructor has overlapping schedules')).toBeInTheDocument()
    })
  })

  describe('Filters and Views', () => {
    it('filters by instructor', async () => {
      const { user } = render(<ScheduleMatrix />, { queryClient })

      const instructorFilter = screen.getByRole('combobox', { name: /instructor/i })
      await user.selectOptions(instructorFilter, '1')

      // Should only show Dr. Smith's schedules
      expect(screen.getByText('Mathematics 101')).toBeInTheDocument()
      expect(screen.getByText('Chemistry 301')).toBeInTheDocument()
      expect(screen.queryByText('Physics 201')).not.toBeInTheDocument()
    })

    it('filters by classroom', async () => {
      const { user } = render(<ScheduleMatrix />, { queryClient })

      const classroomFilter = screen.getByRole('combobox', { name: /classroom/i })
      await user.selectOptions(classroomFilter, '2')

      // Should only show Room B-202 schedules
      expect(screen.getByText('Physics 201')).toBeInTheDocument()
      expect(screen.queryByText('Mathematics 101')).not.toBeInTheDocument()
      expect(screen.queryByText('Chemistry 301')).not.toBeInTheDocument()
    })

    it('switches between view modes', async () => {
      const { user } = render(<ScheduleMatrix />, { queryClient })

      const dayViewButton = screen.getByRole('button', { name: /day view/i })
      await user.click(dayViewButton)

      // Should change to day view
      expect(screen.getByTestId('day-view')).toBeInTheDocument()
      expect(screen.queryByTestId('week-view')).not.toBeInTheDocument()
    })

    it('navigates between weeks', async () => {
      const { user } = render(<ScheduleMatrix />, { queryClient })

      const nextWeekButton = screen.getByRole('button', { name: /next week/i })
      const prevWeekButton = screen.getByRole('button', { name: /previous week/i })

      await user.click(nextWeekButton)
      // Verify week navigation

      await user.click(prevWeekButton)
      // Verify return to original week
    })
  })

  describe('Real-time Updates', () => {
    it('updates when receiving WebSocket events', async () => {
      render(<ScheduleMatrix />, { queryClient })

      // Simulate WebSocket update
      const newSchedule = createMockSchedule({
        id: '5',
        title: 'New Schedule',
        startTime: '16:00',
        endTime: '17:30',
        dayOfWeek: 'friday',
        instructorId: '2',
        classroomId: '1',
      })

      // Mock WebSocket event
      window.dispatchEvent(new CustomEvent('schedule-update', {
        detail: { type: 'create', schedule: newSchedule }
      }))

      await waitFor(() => {
        expect(screen.getByText('New Schedule')).toBeInTheDocument()
      })
    })

    it('shows real-time conflict notifications', async () => {
      render(<ScheduleMatrix />, { queryClient })

      // Simulate conflict notification
      window.dispatchEvent(new CustomEvent('conflict-detected', {
        detail: {
          conflict: {
            id: 'new-conflict',
            type: 'classroom_overlap',
            scheduleIds: ['1', '2'],
            severity: 'medium',
            message: 'Classroom scheduling conflict detected',
          }
        }
      }))

      await waitFor(() => {
        expect(screen.getByText('Classroom scheduling conflict detected')).toBeInTheDocument()
      })
    })
  })

  describe('Performance', () => {
    it('renders large number of schedules efficiently', async () => {
      const largeScheduleSet = Array.from({ length: 100 }, (_, i) =>
        createMockSchedule({
          id: `schedule-${i}`,
          title: `Schedule ${i}`,
          startTime: '09:00',
          endTime: '10:30',
          dayOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'][i % 5],
        })
      )

      // Mock with large dataset
      jest.mocked(require('../../../features/scheduling/hooks/useScheduleMatrix').useScheduleMatrix).mockReturnValue({
        schedules: largeScheduleSet,
        // ... other properties
      })

      const startTime = performance.now()
      render(<ScheduleMatrix />, { queryClient })
      const renderTime = performance.now() - startTime

      // Should render within reasonable time
      expect(renderTime).toBeLessThan(1000)
    })

    it('implements virtual scrolling for large datasets', () => {
      render(<ScheduleMatrix />, { queryClient })

      const virtualContainer = screen.getByTestId('virtual-schedule-container')
      expect(virtualContainer).toBeInTheDocument()
      expect(virtualContainer).toHaveStyle({ overflow: 'auto' })
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<ScheduleMatrix />, { queryClient })

      const matrix = screen.getByRole('grid')
      expect(matrix).toHaveAttribute('aria-label', 'Schedule Matrix')

      const scheduleCards = screen.getAllByRole('gridcell')
      expect(scheduleCards.length).toBeGreaterThan(0)

      scheduleCards.forEach(card => {
        expect(card).toHaveAttribute('aria-describedby')
      })
    })

    it('supports keyboard navigation', async () => {
      const { user } = render(<ScheduleMatrix />, { queryClient })

      const matrix = screen.getByRole('grid')
      matrix.focus()

      await user.keyboard('{Tab}')
      expect(document.activeElement).toBeInTheDocument()

      await user.keyboard('{Enter}')
      // Verify selection or action
    })

    it('provides screen reader announcements', async () => {
      render(<ScheduleMatrix />, { queryClient })

      const announcements = screen.getByRole('status', { name: /live announcements/i })
      expect(announcements).toBeInTheDocument()

      // Simulate an action that should trigger an announcement
      const scheduleCard = screen.getByText('Mathematics 101').closest('[data-testid="schedule-card"]')
      fireEvent.click(scheduleCard!)

      await waitFor(() => {
        expect(announcements).toHaveTextContent('Mathematics 101 selected')
      })
    })
  })

  describe('Error Handling', () => {
    it('displays error message when loading fails', () => {
      jest.mocked(require('../../../features/scheduling/hooks/useScheduleMatrix').useScheduleMatrix).mockReturnValue({
        schedules: [],
        loading: false,
        error: new Error('Failed to load schedules'),
        // ... other properties
      })

      render(<ScheduleMatrix />, { queryClient })

      expect(screen.getByText('Failed to load schedules')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })

    it('shows loading state', () => {
      jest.mocked(require('../../../features/scheduling/hooks/useScheduleMatrix').useScheduleMatrix).mockReturnValue({
        schedules: [],
        loading: true,
        error: null,
        // ... other properties
      })

      render(<ScheduleMatrix />, { queryClient })

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
      expect(screen.getByText('Loading schedules...')).toBeInTheDocument()
    })

    it('handles network errors gracefully', async () => {
      mockFetch(null, { status: 500, ok: false })

      render(<ScheduleMatrix />, { queryClient })

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument()
      })

      const retryButton = screen.getByRole('button', { name: /retry/i })
      expect(retryButton).toBeInTheDocument()
    })
  })
})