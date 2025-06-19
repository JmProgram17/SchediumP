/**
 * History Manager Hook - Undo/redo functionality for scheduling operations
 * Implements comprehensive history tracking with efficient storage and performance optimization
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { ScheduleEntry, DayOfWeek, TimeSlot } from '../types'

export interface HistoryAction {
  id: string
  type: 'move' | 'create' | 'update' | 'delete' | 'batch'
  timestamp: number
  description: string
  data: {
    entries: ScheduleEntry[]
    previousState?: any
    newState?: any
    affectedIds: string[]
  }
  userId: string
  metadata?: {
    source: 'manual' | 'drag_drop' | 'conflict_resolution' | 'bulk_operation'
    confidence: number
    estimatedImpact: 'low' | 'medium' | 'high'
  }
}

export interface HistoryState {
  actions: HistoryAction[]
  currentIndex: number
  maxSize: number
  isDirty: boolean
  lastSavedIndex: number
}

interface UseHistoryManagerOptions {
  maxHistorySize?: number
  enablePersistence?: boolean
  enableCompression?: boolean
  onActionExecuted?: (action: HistoryAction) => void
  onUndo?: (action: HistoryAction) => void
  onRedo?: (action: HistoryAction) => void
  autoSaveInterval?: number
}

export const useHistoryManager = (options: UseHistoryManagerOptions = {}) => {
  const {
    maxHistorySize = 100,
    enablePersistence = true,
    enableCompression = false,
    onActionExecuted,
    onUndo,
    onRedo,
    autoSaveInterval = 30000 // 30 seconds
  } = options

  const [historyState, setHistoryState] = useState<HistoryState>({
    actions: [],
    currentIndex: -1,
    maxSize: maxHistorySize,
    isDirty: false,
    lastSavedIndex: -1
  })

  const queryClient = useQueryClient()
  const autoSaveTimerRef = useRef<NodeJS.Timeout>()
  const compressionWorkerRef = useRef<Worker>()

  // Initialize compression worker if enabled
  useEffect(() => {
    if (enableCompression && typeof Worker !== 'undefined') {
      try {
        // Create a simple compression worker
        const workerBlob = new Blob([`
          self.onmessage = function(e) {
            const { action, data } = e.data
            if (action === 'compress') {
              // Simple JSON compression (in production, use LZ-string or similar)
              const compressed = JSON.stringify(data)
              self.postMessage({ action: 'compressed', data: compressed })
            } else if (action === 'decompress') {
              try {
                const decompressed = JSON.parse(data)
                self.postMessage({ action: 'decompressed', data: decompressed })
              } catch (error) {
                self.postMessage({ action: 'error', error: error.message })
              }
            }
          }
        `], { type: 'application/javascript' })
        
        compressionWorkerRef.current = new Worker(URL.createObjectURL(workerBlob))
      } catch (error) {
        console.warn('Compression worker not available:', error)
      }
    }

    return () => {
      if (compressionWorkerRef.current) {
        compressionWorkerRef.current.terminate()
      }
    }
  }, [enableCompression])

  // Auto-save functionality
  useEffect(() => {
    if (enablePersistence && autoSaveInterval > 0) {
      autoSaveTimerRef.current = setInterval(() => {
        if (historyState.isDirty) {
          saveHistoryToStorage()
        }
      }, autoSaveInterval)

      return () => {
        if (autoSaveTimerRef.current) {
          clearInterval(autoSaveTimerRef.current)
        }
      }
    }
  }, [historyState.isDirty, enablePersistence, autoSaveInterval])

  // Load history from storage on initialization
  useEffect(() => {
    if (enablePersistence) {
      loadHistoryFromStorage()
    }
  }, [enablePersistence])

  // Save history to localStorage/sessionStorage
  const saveHistoryToStorage = useCallback(async () => {
    if (!enablePersistence) return

    try {
      const historyData = {
        ...historyState,
        timestamp: Date.now()
      }

      if (enableCompression && compressionWorkerRef.current) {
        // Use worker for compression
        compressionWorkerRef.current.postMessage({
          action: 'compress',
          data: historyData
        })
      } else {
        // Direct storage
        const serialized = JSON.stringify(historyData)
        sessionStorage.setItem('schedium_history', serialized)
        
        setHistoryState(prev => ({
          ...prev,
          isDirty: false,
          lastSavedIndex: prev.currentIndex
        }))
      }
    } catch (error) {
      console.error('Failed to save history:', error)
      toast.error('Error guardando historial')
    }
  }, [historyState, enablePersistence, enableCompression])

  // Load history from storage
  const loadHistoryFromStorage = useCallback(() => {
    if (!enablePersistence) return

    try {
      const stored = sessionStorage.getItem('schedium_history')
      if (stored) {
        const parsed = JSON.parse(stored)
        
        // Validate stored data structure
        if (parsed.actions && Array.isArray(parsed.actions)) {
          setHistoryState(prev => ({
            ...prev,
            ...parsed,
            maxSize: maxHistorySize, // Ensure current max size
            isDirty: false
          }))
        }
      }
    } catch (error) {
      console.error('Failed to load history:', error)
      // Clear corrupted data
      sessionStorage.removeItem('schedium_history')
    }
  }, [enablePersistence, maxHistorySize])

  // Add new action to history
  const addAction = useCallback((
    type: HistoryAction['type'],
    description: string,
    data: HistoryAction['data'],
    metadata?: HistoryAction['metadata']
  ) => {
    const action: HistoryAction = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      timestamp: Date.now(),
      description,
      data: {
        ...data,
        // Deep clone to prevent mutations
        entries: JSON.parse(JSON.stringify(data.entries))
      },
      userId: 'current_user', // Should come from auth context
      metadata: {
        source: 'manual',
        confidence: 1.0,
        estimatedImpact: 'medium',
        ...metadata
      }
    }

    setHistoryState(prev => {
      // Remove any actions after current index (when adding new action after undo)
      const newActions = prev.actions.slice(0, prev.currentIndex + 1)
      
      // Add new action
      newActions.push(action)
      
      // Maintain max size limit
      const startIndex = Math.max(0, newActions.length - maxHistorySize)
      const trimmedActions = newActions.slice(startIndex)
      
      const newCurrentIndex = trimmedActions.length - 1
      
      return {
        ...prev,
        actions: trimmedActions,
        currentIndex: newCurrentIndex,
        isDirty: true
      }
    })

    onActionExecuted?.(action)
    
    // Invalidate relevant queries
    queryClient.invalidateQueries({ queryKey: ['schedules'] })
    
    toast.success(`Acción registrada: ${description}`, {
      duration: 2000,
      position: 'bottom-right'
    })
  }, [maxHistorySize, onActionExecuted, queryClient])

  // Undo last action
  const undo = useCallback(async () => {
    if (!canUndo) return null

    const currentAction = historyState.actions[historyState.currentIndex]
    
    setHistoryState(prev => ({
      ...prev,
      currentIndex: prev.currentIndex - 1,
      isDirty: true
    }))

    onUndo?.(currentAction)
    
    // Invalidate queries to trigger re-fetch
    queryClient.invalidateQueries({ queryKey: ['schedules'] })
    
    toast.success(`Deshacer: ${currentAction.description}`, {
      duration: 3000,
      position: 'bottom-right',
      icon: '<-'
    })

    return currentAction
  }, [historyState.currentIndex, historyState.actions, onUndo, queryClient])

  // Redo next action
  const redo = useCallback(async () => {
    if (!canRedo) return null

    const nextAction = historyState.actions[historyState.currentIndex + 1]
    
    setHistoryState(prev => ({
      ...prev,
      currentIndex: prev.currentIndex + 1,
      isDirty: true
    }))

    onRedo?.(nextAction)
    
    // Invalidate queries to trigger re-fetch
    queryClient.invalidateQueries({ queryKey: ['schedules'] })
    
    toast.success(`Rehacer: ${nextAction.description}`, {
      duration: 3000,
      position: 'bottom-right',
      icon: '->'
    })

    return nextAction
  }, [historyState.currentIndex, historyState.actions, onRedo, queryClient])

  // Clear history
  const clearHistory = useCallback(() => {
    setHistoryState({
      actions: [],
      currentIndex: -1,
      maxSize: maxHistorySize,
      isDirty: false,
      lastSavedIndex: -1
    })

    if (enablePersistence) {
      sessionStorage.removeItem('schedium_history')
    }

    toast.success('Historial limpiado', {
      duration: 2000,
      position: 'bottom-right'
    })
  }, [maxHistorySize, enablePersistence])

  // Get action at specific index
  const getActionAt = useCallback((index: number): HistoryAction | null => {
    if (index < 0 || index >= historyState.actions.length) return null
    return historyState.actions[index]
  }, [historyState.actions])

  // Get current action
  const getCurrentAction = useCallback((): HistoryAction | null => {
    return getActionAt(historyState.currentIndex)
  }, [getActionAt, historyState.currentIndex])

  // Get history slice for UI display
  const getHistorySlice = useCallback((start: number = 0, end?: number): HistoryAction[] => {
    const endIndex = end ?? historyState.actions.length
    return historyState.actions.slice(start, endIndex)
  }, [historyState.actions])

  // Get action statistics
  const getActionStats = useCallback(() => {
    const actions = historyState.actions
    const totalActions = actions.length
    const actionsByType = actions.reduce((acc, action) => {
      acc[action.type] = (acc[action.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const actionsBySource = actions.reduce((acc, action) => {
      const source = action.metadata?.source || 'unknown'
      acc[source] = (acc[source] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalActions,
      currentIndex: historyState.currentIndex,
      canUndo,
      canRedo,
      isDirty: historyState.isDirty,
      actionsByType,
      actionsBySource,
      memoryUsage: JSON.stringify(actions).length
    }
  }, [historyState])

  // Compress old actions (for performance)
  const compressOldActions = useCallback((olderThanDays: number = 7) => {
    const cutoffDate = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000)
    
    setHistoryState(prev => {
      const compressedActions = prev.actions.map(action => {
        if (action.timestamp < cutoffDate) {
          // Compress by removing detailed data but keeping essential info
          return {
            ...action,
            data: {
              ...action.data,
              entries: [], // Remove detailed entry data
              compressed: true
            }
          }
        }
        return action
      })

      return {
        ...prev,
        actions: compressedActions,
        isDirty: true
      }
    })

    toast.success('Historial comprimido para optimizar rendimiento')
  }, [])

  // Computed values
  const canUndo = historyState.currentIndex >= 0
  const canRedo = historyState.currentIndex < historyState.actions.length - 1
  const hasUnsavedChanges = historyState.isDirty

  // Keyboard shortcuts handler
  const handleKeyboardShortcuts = useCallback((event: KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key === 'z') {
      event.preventDefault()
      undo()
    } else if (((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'z') ||
               ((event.ctrlKey || event.metaKey) && event.key === 'y')) {
      event.preventDefault()
      redo()
    }
  }, [undo, redo])

  // Setup keyboard shortcuts
  useEffect(() => {
    document.addEventListener('keydown', handleKeyboardShortcuts)
    return () => document.removeEventListener('keydown', handleKeyboardShortcuts)
  }, [handleKeyboardShortcuts])

  return {
    // State
    historyState,
    canUndo,
    canRedo,
    hasUnsavedChanges,
    
    // Actions
    addAction,
    undo,
    redo,
    clearHistory,
    
    // Queries
    getCurrentAction,
    getActionAt,
    getHistorySlice,
    getActionStats,
    
    // Utilities
    saveHistoryToStorage,
    loadHistoryFromStorage,
    compressOldActions,
    
    // Advanced
    historySize: historyState.actions.length,
    currentIndex: historyState.currentIndex,
    undoDescription: canUndo ? historyState.actions[historyState.currentIndex]?.description : null,
    redoDescription: canRedo ? historyState.actions[historyState.currentIndex + 1]?.description : null
  }
}