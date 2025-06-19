/**
 * Real-time Validation Hook - WebSocket-based conflict detection
 * Implements live validation and conflict resolution for scheduling
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { ScheduleEntry, ScheduleConflict, ConflictType, DayOfWeek, TimeSlot } from '../types'

interface ValidationMessage {
  type: 'validation_request' | 'validation_response' | 'conflict_alert' | 'conflict_resolved'
  entryId: string
  position: { day: DayOfWeek; timeSlot: TimeSlot }
  conflicts?: ScheduleConflict[]
  userId: string
  timestamp: number
}

interface UseRealTimeValidationOptions {
  enabled?: boolean
  autoResolve?: boolean
  onConflictDetected?: (conflicts: ScheduleConflict[]) => void
  onConflictResolved?: (conflictId: string) => void
  debounceMs?: number
}

export const useRealTimeValidation = (options: UseRealTimeValidationOptions = {}) => {
  const {
    enabled = true,
    autoResolve = false,
    onConflictDetected,
    onConflictResolved,
    debounceMs = 500
  } = options

  const [isConnected, setIsConnected] = useState(false)
  const [validationState, setValidationState] = useState<{
    isValidating: boolean
    conflicts: ScheduleConflict[]
    lastValidation: number
  }>({
    isValidating: false,
    conflicts: [],
    lastValidation: 0
  })

  const wsRef = useRef<WebSocket | null>(null)
  const queryClient = useQueryClient()
  const debounceTimerRef = useRef<NodeJS.Timeout>()
  const pendingValidationsRef = useRef<Map<string, ValidationMessage>>(new Map())

  // WebSocket connection management
  const connect = useCallback(() => {
    if (!enabled || wsRef.current?.readyState === WebSocket.OPEN) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/api/v1/ws/scheduling-validation`

    try {
      wsRef.current = new WebSocket(wsUrl)

      wsRef.current.onopen = () => {
        setIsConnected(true)
        console.log('Real-time validation WebSocket connected')
        
        // Send authentication token
        const token = localStorage.getItem('access_token')
        if (token) {
          wsRef.current?.send(JSON.stringify({
            type: 'auth',
            token
          }))
        }
      }

      wsRef.current.onclose = (event) => {
        setIsConnected(false)
        console.log('Real-time validation WebSocket disconnected:', event.code)
        
        // Reconnect after delay (exponential backoff)
        if (enabled && !event.wasClean) {
          setTimeout(connect, Math.min(1000 * Math.pow(2, 3), 30000))
        }
      }

      wsRef.current.onerror = (error) => {
        console.error('Real-time validation WebSocket error:', error)
        setIsConnected(false)
      }

      wsRef.current.onmessage = (event) => {
        try {
          const message: ValidationMessage = JSON.parse(event.data)
          handleWebSocketMessage(message)
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }
    } catch (error) {
      console.error('Error creating WebSocket connection:', error)
    }
  }, [enabled])

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = useCallback((message: ValidationMessage) => {
    switch (message.type) {
      case 'validation_response':
        setValidationState(prev => ({
          ...prev,
          isValidating: false,
          conflicts: message.conflicts || [],
          lastValidation: Date.now()
        }))

        if (message.conflicts?.length) {
          onConflictDetected?.(message.conflicts)
          
          if (autoResolve) {
            // Auto-resolve minor conflicts
            const minorConflicts = message.conflicts.filter(c => c.severity === 'low')
            minorConflicts.forEach(conflict => resolveConflict(conflict.id, 'auto'))
          } else {
            // Show notification for manual resolution
            toast.error(`Conflictos detectados en ${message.position.day}`, {
              duration: 5000,
              position: 'top-right'
            })
          }
        }
        break

      case 'conflict_alert':
        if (message.conflicts?.length) {
          setValidationState(prev => ({
            ...prev,
            conflicts: [...prev.conflicts, ...message.conflicts]
          }))
          
          toast.warning('Nuevo conflicto detectado en tiempo real', {
            duration: 4000,
            position: 'top-right'
          })
        }
        break

      case 'conflict_resolved':
        setValidationState(prev => ({
          ...prev,
          conflicts: prev.conflicts.filter(c => c.id !== message.entryId)
        }))
        
        onConflictResolved?.(message.entryId)
        toast.success('Conflicto resuelto', {
          duration: 3000,
          position: 'top-right'
        })
        break
    }
  }, [onConflictDetected, onConflictResolved, autoResolve])

  // Send validation request with debouncing
  const validatePosition = useCallback((
    entry: ScheduleEntry,
    position: { day: DayOfWeek; timeSlot: TimeSlot }
  ) => {
    if (!isConnected || !wsRef.current) return

    const validationId = `${entry.id}-${position.day}-${position.timeSlot.start}`
    
    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Store pending validation
    const message: ValidationMessage = {
      type: 'validation_request',
      entryId: entry.id,
      position,
      userId: entry.createdBy || 'current_user',
      timestamp: Date.now()
    }

    pendingValidationsRef.current.set(validationId, message)

    // Debounce the validation request
    debounceTimerRef.current = setTimeout(() => {
      const pendingMessage = pendingValidationsRef.current.get(validationId)
      if (pendingMessage && wsRef.current?.readyState === WebSocket.OPEN) {
        setValidationState(prev => ({ ...prev, isValidating: true }))
        wsRef.current.send(JSON.stringify(pendingMessage))
        pendingValidationsRef.current.delete(validationId)
      }
    }, debounceMs)
  }, [isConnected, debounceMs])

  // Resolve conflict
  const resolveConflict = useCallback((conflictId: string, resolution: 'auto' | 'manual' | 'ignore') => {
    if (!isConnected || !wsRef.current) return

    wsRef.current.send(JSON.stringify({
      type: 'resolve_conflict',
      conflictId,
      resolution,
      timestamp: Date.now()
    }))
  }, [isConnected])

  // Batch validate multiple entries
  const batchValidate = useCallback((entries: Array<{
    entry: ScheduleEntry
    position: { day: DayOfWeek; timeSlot: TimeSlot }
  }>) => {
    if (!isConnected || !wsRef.current) return

    const batchMessage = {
      type: 'batch_validation_request',
      entries: entries.map(({ entry, position }) => ({
        entryId: entry.id,
        position,
        userId: entry.createdBy || 'current_user'
      })),
      timestamp: Date.now()
    }

    setValidationState(prev => ({ ...prev, isValidating: true }))
    wsRef.current.send(JSON.stringify(batchMessage))
  }, [isConnected])

  // Get conflict severity for UI styling
  const getConflictSeverity = useCallback((entryId: string) => {
    const entryConflicts = validationState.conflicts.filter(c => 
      c.affectedEntries.includes(entryId)
    )

    if (entryConflicts.length === 0) return 'none'
    
    const severities = entryConflicts.map(c => c.severity)
    if (severities.includes('critical')) return 'critical'
    if (severities.includes('high')) return 'high'
    if (severities.includes('medium')) return 'medium'
    return 'low'
  }, [validationState.conflicts])

  // Get conflicts for specific entry
  const getEntryConflicts = useCallback((entryId: string) => {
    return validationState.conflicts.filter(c => 
      c.affectedEntries.includes(entryId)
    )
  }, [validationState.conflicts])

  // Check if position is valid in real-time
  const isPositionValid = useCallback((
    entry: ScheduleEntry,
    position: { day: DayOfWeek; timeSlot: TimeSlot }
  ) => {
    // Check against current conflicts
    const positionConflicts = validationState.conflicts.filter(conflict => {
      const conflictPosition = conflict.details?.position
      return conflictPosition &&
             conflictPosition.day === position.day &&
             conflictPosition.timeSlot.start === position.timeSlot.start &&
             conflict.affectedEntries.includes(entry.id)
    })

    return {
      isValid: positionConflicts.length === 0,
      conflicts: positionConflicts,
      severity: positionConflicts.length > 0 ? 
        Math.max(...positionConflicts.map(c => 
          c.severity === 'critical' ? 4 : 
          c.severity === 'high' ? 3 :
          c.severity === 'medium' ? 2 : 1
        )) : 0
    }
  }, [validationState.conflicts])

  // Initialize WebSocket connection
  useEffect(() => {
    if (enabled) {
      connect()
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [enabled, connect])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      pendingValidationsRef.current.clear()
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  // Invalidate cache when conflicts change
  useEffect(() => {
    if (validationState.conflicts.length > 0) {
      queryClient.invalidateQueries({ queryKey: ['schedules'] })
    }
  }, [validationState.conflicts.length, queryClient])

  return {
    // Connection state
    isConnected,
    isValidating: validationState.isValidating,
    lastValidation: validationState.lastValidation,
    
    // Conflicts
    conflicts: validationState.conflicts,
    getConflictSeverity,
    getEntryConflicts,
    
    // Validation
    validatePosition,
    batchValidate,
    isPositionValid,
    
    // Conflict resolution
    resolveConflict,
    
    // Connection management
    connect,
    disconnect: () => wsRef.current?.close()
  }
}