/**
 * Collaboration Hook - Real-time collaborative editing preparation
 * Sets up foundation for multi-user scheduling with operational transforms
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { ScheduleEntry, DayOfWeek, TimeSlot } from '../../types'

export interface CollaborativeUser {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'administrator' | 'coordinator' | 'secretary'
  isOnline: boolean
  lastSeen: number
  currentView?: string
  cursor?: {
    day: DayOfWeek
    timeSlot: TimeSlot
    entryId?: string
  }
}

export interface CollaborativeOperation {
  id: string
  type: 'insert' | 'update' | 'delete' | 'move'
  userId: string
  timestamp: number
  data: {
    entryId: string
    position?: { day: DayOfWeek; timeSlot: TimeSlot }
    previousPosition?: { day: DayOfWeek; timeSlot: TimeSlot }
    changes?: Partial<ScheduleEntry>
    entry?: ScheduleEntry
  }
  vectorClock: Record<string, number>
  acknowledged: boolean
}

export interface CollaborativeConflict {
  id: string
  operationA: CollaborativeOperation
  operationB: CollaborativeOperation
  type: 'concurrent_edit' | 'position_conflict' | 'deletion_conflict'
  resolutionStrategy?: 'merge' | 'last_writer_wins' | 'manual'
  resolved: boolean
}

interface UseCollaborationOptions {
  userId: string
  roomId: string
  enableConflictResolution?: boolean
  enablePresenceIndicators?: boolean
  maxOperationHistory?: number
  autoReconnect?: boolean
}

export const useCollaboration = (options: UseCollaborationOptions) => {
  const {
    userId,
    roomId,
    enableConflictResolution = true,
    enablePresenceIndicators = true,
    maxOperationHistory = 1000,
    autoReconnect = true
  } = options

  const [collaborativeState, setCollaborativeState] = useState({
    isConnected: false,
    isReconnecting: false,
    users: [] as CollaborativeUser[],
    operations: [] as CollaborativeOperation[],
    conflicts: [] as CollaborativeConflict[],
    vectorClock: {} as Record<string, number>,
    pendingOperations: [] as CollaborativeOperation[]
  })

  const wsRef = useRef<WebSocket | null>(null)
  const queryClient = useQueryClient()
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 5

  // Connect to collaboration server
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/api/v1/ws/collaboration/${roomId}`

    try {
      wsRef.current = new WebSocket(wsUrl)

      wsRef.current.onopen = () => {
        setCollaborativeState(prev => ({
          ...prev,
          isConnected: true,
          isReconnecting: false
        }))
        
        reconnectAttemptsRef.current = 0

        // Send join room message with user info
        const joinMessage = {
          type: 'join_room',
          userId,
          roomId,
          timestamp: Date.now(),
          userData: {
            name: 'Current User', // Should come from auth context
            role: 'coordinator' // Should come from auth context
          }
        }

        wsRef.current?.send(JSON.stringify(joinMessage))
        console.log('Connected to collaboration server')
      }

      wsRef.current.onclose = (event) => {
        setCollaborativeState(prev => ({
          ...prev,
          isConnected: false
        }))

        console.log('Disconnected from collaboration server:', event.code)

        // Auto-reconnect logic
        if (autoReconnect && !event.wasClean && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
          reconnectAttemptsRef.current++
          
          setCollaborativeState(prev => ({
            ...prev,
            isReconnecting: true
          }))

          setTimeout(() => {
            connect()
          }, delay)
        }
      }

      wsRef.current.onerror = (error) => {
        console.error('Collaboration WebSocket error:', error)
        setCollaborativeState(prev => ({
          ...prev,
          isConnected: false
        }))
      }

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          handleCollaborativeMessage(message)
        } catch (error) {
          console.error('Error parsing collaboration message:', error)
        }
      }

    } catch (error) {
      console.error('Error creating collaboration WebSocket:', error)
    }
  }, [userId, roomId, autoReconnect])

  // Handle incoming collaborative messages
  const handleCollaborativeMessage = useCallback((message: any) => {
    switch (message.type) {
      case 'user_joined':
        setCollaborativeState(prev => ({
          ...prev,
          users: [...prev.users.filter(u => u.id !== message.user.id), message.user]
        }))
        
        if (enablePresenceIndicators) {
          toast.success(`${message.user.name} se unió a la sesión`, {
            duration: 3000,
            position: 'top-right'
          })
        }
        break

      case 'user_left':
        setCollaborativeState(prev => ({
          ...prev,
          users: prev.users.filter(u => u.id !== message.userId)
        }))
        
        if (enablePresenceIndicators) {
          toast(`${message.userName} dejó la sesión`, {
            duration: 2000,
            position: 'top-right'
          })
        }
        break

      case 'user_presence':
        setCollaborativeState(prev => ({
          ...prev,
          users: prev.users.map(user => 
            user.id === message.userId 
              ? { ...user, cursor: message.cursor, lastSeen: Date.now() }
              : user
          )
        }))
        break

      case 'operation':
        handleRemoteOperation(message.operation)
        break

      case 'operation_acknowledged':
        setCollaborativeState(prev => ({
          ...prev,
          pendingOperations: prev.pendingOperations.filter(op => op.id !== message.operationId)
        }))
        break

      case 'conflict_detected':
        if (enableConflictResolution) {
          handleCollaborativeConflict(message.conflict)
        }
        break

      case 'sync_state':
        // Handle full state synchronization
        setCollaborativeState(prev => ({
          ...prev,
          operations: message.operations || [],
          vectorClock: message.vectorClock || {}
        }))
        
        // Re-apply operations to ensure consistency
        queryClient.invalidateQueries({ queryKey: ['schedules'] })
        break
    }
  }, [enablePresenceIndicators, enableConflictResolution, queryClient])

  // Handle remote operations from other users
  const handleRemoteOperation = useCallback((operation: CollaborativeOperation) => {
    // Update vector clock
    setCollaborativeState(prev => {
      const newVectorClock = { ...prev.vectorClock }
      newVectorClock[operation.userId] = Math.max(
        newVectorClock[operation.userId] || 0,
        operation.vectorClock[operation.userId] || 0
      )

      // Add operation to history
      const newOperations = [...prev.operations, operation]
      
      // Maintain operation history size
      if (newOperations.length > maxOperationHistory) {
        newOperations.splice(0, newOperations.length - maxOperationHistory)
      }

      return {
        ...prev,
        operations: newOperations,
        vectorClock: newVectorClock
      }
    })

    // Apply operation to local state
    applyOperation(operation)

    // Send acknowledgment
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'acknowledge_operation',
        operationId: operation.id,
        userId,
        timestamp: Date.now()
      }))
    }
  }, [userId, maxOperationHistory])

  // Apply operation to local state
  const applyOperation = useCallback((operation: CollaborativeOperation) => {
    // This would integrate with your existing state management
    // For now, we invalidate queries to trigger re-fetch
    queryClient.invalidateQueries({ queryKey: ['schedules'] })
    
    // Show notification for remote changes
    if (operation.userId !== userId) {
      const user = collaborativeState.users.find(u => u.id === operation.userId)
      const userName = user?.name || 'Un usuario'
      
      const actionMessages = {
        insert: 'agregó una clase',
        update: 'modificó una clase',
        delete: 'eliminó una clase',
        move: 'movió una clase'
      }
      
      toast(`${userName} ${actionMessages[operation.type]}`, {
        duration: 3000,
        position: 'bottom-left',
        icon: '👥'
      })
    }
  }, [userId, collaborativeState.users, queryClient])

  // Send operation to other users
  const broadcastOperation = useCallback((operation: Omit<CollaborativeOperation, 'id' | 'userId' | 'timestamp' | 'vectorClock' | 'acknowledged'>) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('Cannot broadcast operation: WebSocket not connected')
      return
    }

    // Update local vector clock
    setCollaborativeState(prev => {
      const newVectorClock = { ...prev.vectorClock }
      newVectorClock[userId] = (newVectorClock[userId] || 0) + 1

      const fullOperation: CollaborativeOperation = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        timestamp: Date.now(),
        vectorClock: newVectorClock,
        acknowledged: false,
        ...operation
      }

      // Send operation
      wsRef.current?.send(JSON.stringify({
        type: 'operation',
        operation: fullOperation
      }))

      return {
        ...prev,
        vectorClock: newVectorClock,
        pendingOperations: [...prev.pendingOperations, fullOperation],
        operations: [...prev.operations, fullOperation]
      }
    })
  }, [userId])

  // Handle collaborative conflicts
  const handleCollaborativeConflict = useCallback((conflict: CollaborativeConflict) => {
    setCollaborativeState(prev => ({
      ...prev,
      conflicts: [...prev.conflicts, conflict]
    }))

    // Show conflict notification
    toast.error('Conflicto de edición detectado', {
      duration: 5000,
      position: 'top-center'
    })
  }, [])

  // Resolve collaborative conflict
  const resolveConflict = useCallback((conflictId: string, strategy: 'merge' | 'last_writer_wins' | 'manual', resolution?: any) => {
    setCollaborativeState(prev => ({
      ...prev,
      conflicts: prev.conflicts.map(conflict =>
        conflict.id === conflictId
          ? { ...conflict, resolved: true, resolutionStrategy: strategy }
          : conflict
      )
    }))

    // Send conflict resolution to server
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'resolve_conflict',
        conflictId,
        strategy,
        resolution,
        userId,
        timestamp: Date.now()
      }))
    }
  }, [userId])

  // Update user cursor/presence
  const updatePresence = useCallback((cursor: CollaborativeUser['cursor']) => {
    if (!enablePresenceIndicators || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return
    }

    wsRef.current.send(JSON.stringify({
      type: 'update_presence',
      userId,
      cursor,
      timestamp: Date.now()
    }))
  }, [userId, enablePresenceIndicators])

  // Get other users' cursors for a specific position
  const getUsersAtPosition = useCallback((day: DayOfWeek, timeSlot: TimeSlot) => {
    return collaborativeState.users.filter(user => 
      user.id !== userId &&
      user.cursor?.day === day &&
      user.cursor?.timeSlot.start === timeSlot.start
    )
  }, [collaborativeState.users, userId])

  // Check if position has conflicts
  const hasPositionConflict = useCallback((day: DayOfWeek, timeSlot: TimeSlot) => {
    return collaborativeState.conflicts.some(conflict =>
      !conflict.resolved &&
      (conflict.operationA.data.position?.day === day && conflict.operationA.data.position?.timeSlot.start === timeSlot.start ||
       conflict.operationB.data.position?.day === day && conflict.operationB.data.position?.timeSlot.start === timeSlot.start)
    )
  }, [collaborativeState.conflicts])

  // Initialize connection
  useEffect(() => {
    connect()

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [connect])

  // Periodic presence updates
  useEffect(() => {
    if (!enablePresenceIndicators) return

    const interval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'heartbeat',
          userId,
          timestamp: Date.now()
        }))
      }
    }, 30000) // Every 30 seconds

    return () => clearInterval(interval)
  }, [userId, enablePresenceIndicators])

  return {
    // Connection state
    isConnected: collaborativeState.isConnected,
    isReconnecting: collaborativeState.isReconnecting,
    
    // Users and presence
    users: collaborativeState.users,
    getUsersAtPosition,
    updatePresence,
    
    // Operations
    operations: collaborativeState.operations,
    pendingOperations: collaborativeState.pendingOperations,
    broadcastOperation,
    
    // Conflicts
    conflicts: collaborativeState.conflicts,
    hasPositionConflict,
    resolveConflict,
    
    // Utilities
    connect,
    disconnect: () => wsRef.current?.close(),
    isUserOnline: (userId: string) => collaborativeState.users.some(u => u.id === userId && u.isOnline),
    getOperationHistory: () => collaborativeState.operations,
    
    // Statistics
    stats: {
      connectedUsers: collaborativeState.users.filter(u => u.isOnline).length,
      totalOperations: collaborativeState.operations.length,
      pendingOperations: collaborativeState.pendingOperations.length,
      unresolvedConflicts: collaborativeState.conflicts.filter(c => !c.resolved).length
    }
  }
}