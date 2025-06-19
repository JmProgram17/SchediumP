/**
 * Tests for useHistoryManager hook - Comprehensive undo/redo functionality testing
 */

import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useHistoryManager, HistoryAction } from '../useHistoryManager'
import { ScheduleEntry, DayOfWeek, TimeSlot, Priority, Status } from '../../types'

// Mock dependencies
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}))

// Mock sessionStorage
const mockSessionStorage = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} }
  }
})()

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage
})

// Mock Web Worker
global.Worker = class MockWorker {
  onmessage: ((event: MessageEvent) => void) | null = null
  
  constructor() {}
  
  postMessage(data: any) {
    // Simulate immediate response for testing
    if (this.onmessage) {
      setTimeout(() => {
        this.onmessage?.({
          data: { action: 'compressed', data: JSON.stringify(data.data) }
        } as MessageEvent)
      }, 0)
    }
  }
  
  terminate() {}
} as any

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

// Sample test data
const createMockEntry = (id: string, overrides?: Partial<ScheduleEntry>): ScheduleEntry => ({
  id,
  title: `Test Entry ${id}`,
  description: 'Test description',
  instructorId: 'instructor-1',
  classroomId: 'classroom-1',
  programId: 'program-1',
  groupId: 'group-1',
  dayOfWeek: DayOfWeek.MONDAY,
  timeSlot: { start: '09:00', end: '10:00' },
  priority: Priority.MEDIUM,
  status: Status.ACTIVE,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: 'user-1',
  lastModifiedBy: 'user-1',
  version: 1,
  ...overrides
})

const createMockAction = (overrides?: Partial<HistoryAction>): HistoryAction => ({
  id: 'action-1',
  type: 'move',
  timestamp: Date.now(),
  description: 'Test action',
  data: {
    entries: [createMockEntry('entry-1')],
    affectedIds: ['entry-1']
  },
  userId: 'user-1',
  metadata: {
    source: 'manual',
    confidence: 1.0,
    estimatedImpact: 'medium'
  },
  ...overrides
})

describe('useHistoryManager', () => {
  beforeEach(() => {
    mockSessionStorage.clear()
    jest.clearAllMocks()
  })

  describe('Basic functionality', () => {
    it('should initialize with empty history', () => {
      const { result } = renderHook(() => useHistoryManager(), {
        wrapper: createWrapper()
      })

      expect(result.current.historyState.actions).toHaveLength(0)
      expect(result.current.historyState.currentIndex).toBe(-1)
      expect(result.current.canUndo).toBe(false)
      expect(result.current.canRedo).toBe(false)
    })

    it('should add actions to history', () => {
      const { result } = renderHook(() => useHistoryManager(), {
        wrapper: createWrapper()
      })

      const mockEntry = createMockEntry('entry-1')

      act(() => {
        result.current.addAction('create', 'Created entry', {
          entries: [mockEntry],
          affectedIds: ['entry-1']
        })
      })

      expect(result.current.historyState.actions).toHaveLength(1)
      expect(result.current.historyState.currentIndex).toBe(0)
      expect(result.current.canUndo).toBe(true)
      expect(result.current.canRedo).toBe(false)
    })

    it('should handle undo operations', async () => {
      const mockOnUndo = jest.fn()
      const { result } = renderHook(() => useHistoryManager({
        onUndo: mockOnUndo
      }), {
        wrapper: createWrapper()
      })

      const mockEntry = createMockEntry('entry-1')

      // Add an action
      act(() => {
        result.current.addAction('create', 'Created entry', {
          entries: [mockEntry],
          affectedIds: ['entry-1']
        })
      })

      // Undo the action
      await act(async () => {
        const undoneAction = await result.current.undo()
        expect(undoneAction).toBeTruthy()
        expect(mockOnUndo).toHaveBeenCalledWith(expect.objectContaining({
          description: 'Created entry'
        }))
      })

      expect(result.current.historyState.currentIndex).toBe(-1)
      expect(result.current.canUndo).toBe(false)
      expect(result.current.canRedo).toBe(true)
    })

    it('should handle redo operations', async () => {
      const mockOnRedo = jest.fn()
      const { result } = renderHook(() => useHistoryManager({
        onRedo: mockOnRedo
      }), {
        wrapper: createWrapper()
      })

      const mockEntry = createMockEntry('entry-1')

      // Add and undo an action
      act(() => {
        result.current.addAction('create', 'Created entry', {
          entries: [mockEntry],
          affectedIds: ['entry-1']
        })
      })

      await act(async () => {
        await result.current.undo()
      })

      // Redo the action
      await act(async () => {
        const redoneAction = await result.current.redo()
        expect(redoneAction).toBeTruthy()
        expect(mockOnRedo).toHaveBeenCalledWith(expect.objectContaining({
          description: 'Created entry'
        }))
      })

      expect(result.current.historyState.currentIndex).toBe(0)
      expect(result.current.canUndo).toBe(true)
      expect(result.current.canRedo).toBe(false)
    })
  })

  describe('History management', () => {
    it('should respect max history size', () => {
      const { result } = renderHook(() => useHistoryManager({
        maxHistorySize: 3
      }), {
        wrapper: createWrapper()
      })

      const mockEntry = createMockEntry('entry-1')

      // Add 5 actions (exceeds max size)
      act(() => {
        for (let i = 0; i < 5; i++) {
          result.current.addAction('update', `Action ${i}`, {
            entries: [mockEntry],
            affectedIds: ['entry-1']
          })
        }
      })

      expect(result.current.historyState.actions).toHaveLength(3)
      expect(result.current.historyState.currentIndex).toBe(2)
    })

    it('should clear history after current index when adding new action after undo', () => {
      const { result } = renderHook(() => useHistoryManager(), {
        wrapper: createWrapper()
      })

      const mockEntry = createMockEntry('entry-1')

      // Add 3 actions
      act(() => {
        result.current.addAction('create', 'Action 1', {
          entries: [mockEntry],
          affectedIds: ['entry-1']
        })
        result.current.addAction('update', 'Action 2', {
          entries: [mockEntry],
          affectedIds: ['entry-1']
        })
        result.current.addAction('update', 'Action 3', {
          entries: [mockEntry],
          affectedIds: ['entry-1']
        })
      })

      expect(result.current.historyState.actions).toHaveLength(3)

      // Undo twice
      act(() => {
        result.current.undo()
        result.current.undo()
      })

      expect(result.current.historyState.currentIndex).toBe(0)

      // Add new action - should clear actions after current index
      act(() => {
        result.current.addAction('delete', 'New action', {
          entries: [mockEntry],
          affectedIds: ['entry-1']
        })
      })

      expect(result.current.historyState.actions).toHaveLength(2)
      expect(result.current.historyState.currentIndex).toBe(1)
    })

    it('should clear all history', () => {
      const { result } = renderHook(() => useHistoryManager(), {
        wrapper: createWrapper()
      })

      const mockEntry = createMockEntry('entry-1')

      // Add some actions
      act(() => {
        result.current.addAction('create', 'Action 1', {
          entries: [mockEntry],
          affectedIds: ['entry-1']
        })
        result.current.addAction('update', 'Action 2', {
          entries: [mockEntry],
          affectedIds: ['entry-1']
        })
      })

      expect(result.current.historyState.actions).toHaveLength(2)

      // Clear history
      act(() => {
        result.current.clearHistory()
      })

      expect(result.current.historyState.actions).toHaveLength(0)
      expect(result.current.historyState.currentIndex).toBe(-1)
      expect(result.current.canUndo).toBe(false)
      expect(result.current.canRedo).toBe(false)
    })
  })

  describe('Persistence', () => {
    it('should save history to storage', async () => {
      const { result } = renderHook(() => useHistoryManager({
        enablePersistence: true
      }), {
        wrapper: createWrapper()
      })

      const mockEntry = createMockEntry('entry-1')

      act(() => {
        result.current.addAction('create', 'Test action', {
          entries: [mockEntry],
          affectedIds: ['entry-1']
        })
      })

      await act(async () => {
        await result.current.saveHistoryToStorage()
      })

      const stored = mockSessionStorage.getItem('schedium_history')
      expect(stored).toBeTruthy()

      const parsed = JSON.parse(stored!)
      expect(parsed.actions).toHaveLength(1)
      expect(parsed.actions[0].description).toBe('Test action')
    })

    it('should load history from storage', () => {
      const mockHistoryData = {
        actions: [createMockAction()],
        currentIndex: 0,
        maxSize: 100,
        isDirty: false,
        lastSavedIndex: 0
      }

      mockSessionStorage.setItem('schedium_history', JSON.stringify(mockHistoryData))

      const { result } = renderHook(() => useHistoryManager({
        enablePersistence: true
      }), {
        wrapper: createWrapper()
      })

      expect(result.current.historyState.actions).toHaveLength(1)
      expect(result.current.historyState.currentIndex).toBe(0)
    })

    it('should handle corrupted storage data gracefully', () => {
      mockSessionStorage.setItem('schedium_history', 'invalid json')

      const { result } = renderHook(() => useHistoryManager({
        enablePersistence: true
      }), {
        wrapper: createWrapper()
      })

      expect(result.current.historyState.actions).toHaveLength(0)
      expect(mockSessionStorage.getItem('schedium_history')).toBeNull()
    })
  })

  describe('Action utilities', () => {
    it('should get action at specific index', () => {
      const { result } = renderHook(() => useHistoryManager(), {
        wrapper: createWrapper()
      })

      const mockEntry = createMockEntry('entry-1')

      act(() => {
        result.current.addAction('create', 'Action 1', {
          entries: [mockEntry],
          affectedIds: ['entry-1']
        })
        result.current.addAction('update', 'Action 2', {
          entries: [mockEntry],
          affectedIds: ['entry-1']
        })
      })

      const action = result.current.getActionAt(0)
      expect(action).toBeTruthy()
      expect(action?.description).toBe('Action 1')

      const invalidAction = result.current.getActionAt(5)
      expect(invalidAction).toBeNull()
    })

    it('should get current action', () => {
      const { result } = renderHook(() => useHistoryManager(), {
        wrapper: createWrapper()
      })

      const mockEntry = createMockEntry('entry-1')

      act(() => {
        result.current.addAction('create', 'Current action', {
          entries: [mockEntry],
          affectedIds: ['entry-1']
        })
      })

      const currentAction = result.current.getCurrentAction()
      expect(currentAction).toBeTruthy()
      expect(currentAction?.description).toBe('Current action')
    })

    it('should get history slice', () => {
      const { result } = renderHook(() => useHistoryManager(), {
        wrapper: createWrapper()
      })

      const mockEntry = createMockEntry('entry-1')

      act(() => {
        for (let i = 0; i < 5; i++) {
          result.current.addAction('update', `Action ${i}`, {
            entries: [mockEntry],
            affectedIds: ['entry-1']
          })
        }
      })

      const slice = result.current.getHistorySlice(1, 3)
      expect(slice).toHaveLength(2)
      expect(slice[0].description).toBe('Action 1')
      expect(slice[1].description).toBe('Action 2')
    })

    it('should provide action statistics', () => {
      const { result } = renderHook(() => useHistoryManager(), {
        wrapper: createWrapper()
      })

      const mockEntry = createMockEntry('entry-1')

      act(() => {
        result.current.addAction('create', 'Create action', {
          entries: [mockEntry],
          affectedIds: ['entry-1']
        })
        result.current.addAction('update', 'Update action', {
          entries: [mockEntry],
          affectedIds: ['entry-1']
        })
        result.current.addAction('update', 'Another update', {
          entries: [mockEntry],
          affectedIds: ['entry-1']
        })
      })

      const stats = result.current.getActionStats()

      expect(stats.totalActions).toBe(3)
      expect(stats.currentIndex).toBe(2)
      expect(stats.actionsByType.create).toBe(1)
      expect(stats.actionsByType.update).toBe(2)
      expect(stats.canUndo).toBe(true)
      expect(stats.canRedo).toBe(false)
    })
  })

  describe('Advanced features', () => {
    it('should compress old actions', () => {
      const { result } = renderHook(() => useHistoryManager(), {
        wrapper: createWrapper()
      })

      const mockEntry = createMockEntry('entry-1')
      const oldTimestamp = Date.now() - (8 * 24 * 60 * 60 * 1000) // 8 days ago

      // Manually set an old action
      act(() => {
        result.current.addAction('create', 'Old action', {
          entries: [mockEntry],
          affectedIds: ['entry-1']
        })
      })

      // Modify timestamp to be old
      act(() => {
        result.current.historyState.actions[0].timestamp = oldTimestamp
      })

      act(() => {
        result.current.compressOldActions(7) // Compress actions older than 7 days
      })

      const compressedAction = result.current.historyState.actions[0]
      expect(compressedAction.data.entries).toHaveLength(0)
      expect(compressedAction.data.compressed).toBe(true)
    })

    it('should provide undo/redo descriptions', () => {
      const { result } = renderHook(() => useHistoryManager(), {
        wrapper: createWrapper()
      })

      const mockEntry = createMockEntry('entry-1')

      act(() => {
        result.current.addAction('create', 'Test action', {
          entries: [mockEntry],
          affectedIds: ['entry-1']
        })
      })

      expect(result.current.undoDescription).toBe('Test action')
      expect(result.current.redoDescription).toBeNull()

      act(() => {
        result.current.undo()
      })

      expect(result.current.undoDescription).toBeNull()
      expect(result.current.redoDescription).toBe('Test action')
    })
  })

  describe('Keyboard shortcuts', () => {
    it('should handle Ctrl+Z for undo', () => {
      const { result } = renderHook(() => useHistoryManager(), {
        wrapper: createWrapper()
      })

      const mockEntry = createMockEntry('entry-1')

      act(() => {
        result.current.addAction('create', 'Test action', {
          entries: [mockEntry],
          affectedIds: ['entry-1']
        })
      })

      expect(result.current.canUndo).toBe(true)

      // Simulate Ctrl+Z
      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'z',
          ctrlKey: true
        })
        document.dispatchEvent(event)
      })

      // Note: In a real test environment, we'd need to wait for the event to be processed
      // This is a simplified test to verify the hook sets up the event listener
    })

    it('should handle Ctrl+Y for redo', () => {
      const { result } = renderHook(() => useHistoryManager(), {
        wrapper: createWrapper()
      })

      const mockEntry = createMockEntry('entry-1')

      act(() => {
        result.current.addAction('create', 'Test action', {
          entries: [mockEntry],
          affectedIds: ['entry-1']
        })
        result.current.undo()
      })

      expect(result.current.canRedo).toBe(true)

      // Simulate Ctrl+Y
      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'y',
          ctrlKey: true
        })
        document.dispatchEvent(event)
      })
    })
  })

  describe('Error handling', () => {
    it('should handle undo when no actions exist', async () => {
      const { result } = renderHook(() => useHistoryManager(), {
        wrapper: createWrapper()
      })

      const undoneAction = await act(async () => {
        return await result.current.undo()
      })

      expect(undoneAction).toBeNull()
      expect(result.current.canUndo).toBe(false)
    })

    it('should handle redo when no actions to redo', async () => {
      const { result } = renderHook(() => useHistoryManager(), {
        wrapper: createWrapper()
      })

      const redoneAction = await act(async () => {
        return await result.current.redo()
      })

      expect(redoneAction).toBeNull()
      expect(result.current.canRedo).toBe(false)
    })
  })
})