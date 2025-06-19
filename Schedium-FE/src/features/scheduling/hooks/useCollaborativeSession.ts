/**
 * Collaborative Session Hook - Manages multi-user editing sessions
 * Provides state management for collaborative editing features
 */

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { 
  CollaborativeUser, 
  CollaborativeSession, 
  ChatMessage, 
  EntryLock 
} from '../components/CollaborativeEditing'
import { ScheduleEntry } from '../types'
import { useScheduleWebSocket, WebSocketCallbacks } from '../services/websocket.service'

export interface CollaborativeSessionConfig {
  scheduleId: string
  wsUrl: string
  userId: string
  userName: string
  userEmail: string
  userAvatar?: string
  sessionSettings?: Partial<CollaborativeSession['settings']>
}

export interface SessionState {
  session: CollaborativeSession | null
  isHost: boolean
  isConnected: boolean
  connectionState: string
  users: CollaborativeUser[]
  chatMessages: ChatMessage[]
  entryLocks: EntryLock[]
  isLoading: boolean
  error: string | null
}

export interface CollaborativeSessionAPI {
  // State
  state: SessionState
  
  // Session management
  createSession: (title: string, settings?: Partial<CollaborativeSession['settings']>) => Promise<CollaborativeSession>
  joinSession: (sessionId: string) => Promise<void>
  leaveSession: () => Promise<void>
  
  // User management
  inviteUser: (email: string, role: 'editor' | 'viewer') => Promise<void>
  removeUser: (userId: string) => Promise<void>
  updateUserRole: (userId: string, role: 'owner' | 'editor' | 'viewer') => Promise<void>
  updateUserPermissions: (userId: string, permissions: Partial<CollaborativeUser['permissions']>) => Promise<void>
  
  // Entry locking
  lockEntry: (entryId: string) => Promise<boolean>
  unlockEntry: (entryId: string) => Promise<void>
  isEntryLocked: (entryId: string) => boolean
  getEntryLock: (entryId: string) => EntryLock | null
  
  // Chat
  sendChatMessage: (message: string) => Promise<void>
  markTyping: (isTyping: boolean) => void
  
  // Settings
  updateSessionSettings: (settings: Partial<CollaborativeSession['settings']>) => Promise<void>
  
  // User actions
  broadcastUserAction: (action: string, data: any) => void
  setUserStatus: (status: 'online' | 'away' | 'offline') => void
  setCurrentAction: (action: CollaborativeUser['currentAction']) => void
  
  // Utilities
  getCurrentUser: () => CollaborativeUser | null
  canUserEdit: (userId?: string) => boolean
  canUserManage: (userId?: string) => boolean
  getActiveUsers: () => CollaborativeUser[]
  hasActiveConflicts: () => boolean
}

export const useCollaborativeSession = (
  config: CollaborativeSessionConfig
): CollaborativeSessionAPI => {
  const queryClient = useQueryClient()
  
  // Internal state
  const [state, setState] = useState<SessionState>({
    session: null,
    isHost: false,
    isConnected: false,
    connectionState: 'DISCONNECTED',
    users: [],
    chatMessages: [],
    entryLocks: [],
    isLoading: false,
    error: null
  })

  // WebSocket callbacks
  const webSocketCallbacks: WebSocketCallbacks = useMemo(() => ({
    onConnectionChange: (connected: boolean) => {
      setState(prev => ({
        ...prev,
        isConnected: connected,
        connectionState: connected ? 'CONNECTED' : 'DISCONNECTED'
      }))
    },

    onUserJoined: (userId: string, userInfo: any) => {
      setState(prev => ({
        ...prev,
        users: [...prev.users.filter(u => u.id !== userId), userInfo]
      }))
      
      // Add system message
      addSystemMessage(`${userInfo.name} se unió a la sesión`)
    },

    onUserLeft: (userId: string) => {
      const user = state.users.find(u => u.id === userId)
      setState(prev => ({
        ...prev,
        users: prev.users.filter(u => u.id !== userId),
        entryLocks: prev.entryLocks.filter(lock => lock.userId !== userId)
      }))
      
      if (user) {
        addSystemMessage(`${user.name} dejó la sesión`)
      }
    },

    onMessage: (message) => {
      handleCollaborativeMessage(message.payload)
    },

    onError: (error) => {
      setState(prev => ({
        ...prev,
        error: error.message
      }))
      toast.error(`Error de colaboración: ${error.message}`)
    }
  }), [state.users])

  // WebSocket connection
  const { service, isConnected, connectionState } = useScheduleWebSocket({
    url: config.wsUrl,
    enableLogging: process.env.NODE_ENV === 'development'
  }, webSocketCallbacks)

  // Handle collaborative messages
  const handleCollaborativeMessage = useCallback((payload: any) => {
    switch (payload.type) {
      case 'session_created':
        setState(prev => ({
          ...prev,
          session: payload.session,
          isHost: payload.session.owner === config.userId
        }))
        break

      case 'session_updated':
        setState(prev => ({
          ...prev,
          session: { ...prev.session, ...payload.updates }
        }))
        break

      case 'user_action':
        handleUserAction(payload.userId, payload.action, payload.data)
        break

      case 'entry_locked':
        setState(prev => ({
          ...prev,
          entryLocks: [...prev.entryLocks.filter(l => l.entryId !== payload.lock.entryId), payload.lock]
        }))
        break

      case 'entry_unlocked':
        setState(prev => ({
          ...prev,
          entryLocks: prev.entryLocks.filter(l => l.entryId !== payload.entryId)
        }))
        break

      case 'chat_message':
        setState(prev => ({
          ...prev,
          chatMessages: [...prev.chatMessages, payload.message]
        }))
        break

      case 'user_status_changed':
        updateUserStatus(payload.userId, payload.status)
        break

      case 'permission_changed':
        updateUserPermissions(payload.userId, payload.permissions)
        break
    }
  }, [config.userId])

  // Helper functions
  const addSystemMessage = useCallback((message: string) => {
    const systemMessage: ChatMessage = {
      id: `system_${Date.now()}`,
      userId: 'system',
      message,
      timestamp: new Date(),
      type: 'system'
    }

    setState(prev => ({
      ...prev,
      chatMessages: [...prev.chatMessages, systemMessage]
    }))
  }, [])

  const handleUserAction = useCallback((userId: string, action: string, data: any) => {
    setState(prev => ({
      ...prev,
      users: prev.users.map(user => 
        user.id === userId 
          ? { ...user, currentAction: data.currentAction }
          : user
      )
    }))

    // Add action message to chat if relevant
    const user = state.users.find(u => u.id === userId)
    if (user && data.notifyChat) {
      const actionMessage: ChatMessage = {
        id: `action_${Date.now()}`,
        userId,
        message: data.message || `${user.name} realizó una acción`,
        timestamp: new Date(),
        type: 'action',
        metadata: { action, ...data.metadata }
      }

      setState(prev => ({
        ...prev,
        chatMessages: [...prev.chatMessages, actionMessage]
      }))
    }
  }, [state.users])

  const updateUserStatus = useCallback((userId: string, status: CollaborativeUser['status']) => {
    setState(prev => ({
      ...prev,
      users: prev.users.map(user => 
        user.id === userId ? { ...user, status } : user
      )
    }))
  }, [])

  const updateUserPermissions = useCallback((userId: string, permissions: Partial<CollaborativeUser['permissions']>) => {
    setState(prev => ({
      ...prev,
      users: prev.users.map(user => 
        user.id === userId 
          ? { ...user, permissions: { ...user.permissions, ...permissions } }
          : user
      )
    }))
  }, [])

  // Session management
  const createSession = useCallback(async (
    title: string, 
    settings?: Partial<CollaborativeSession['settings']>
  ): Promise<CollaborativeSession> => {
    setState(prev => ({ ...prev, isLoading: true }))

    try {
      const defaultSettings: CollaborativeSession['settings'] = {
        allowAnonymousView: false,
        requireApproval: true,
        lockingEnabled: true,
        chatEnabled: true,
        notificationsEnabled: true,
        ...settings
      }

      const session: CollaborativeSession = {
        id: `session_${Date.now()}`,
        scheduleId: config.scheduleId,
        title,
        users: [{
          id: config.userId,
          name: config.userName,
          email: config.userEmail,
          avatar: config.userAvatar,
          role: 'owner',
          status: 'online',
          permissions: {
            canEdit: true,
            canDelete: true,
            canInvite: true,
            canManagePermissions: true
          }
        }],
        owner: config.userId,
        createdAt: new Date(),
        settings: defaultSettings
      }

      // Send to server
      service.sendMessage({
        type: 'schedule_update',
        payload: {
          type: 'create_session',
          session
        },
        timestamp: new Date().toISOString()
      })

      setState(prev => ({
        ...prev,
        session,
        isHost: true,
        users: session.users,
        isLoading: false
      }))

      toast.success('Sesión colaborativa creada')
      return session

    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: (error as Error).message 
      }))
      throw error
    }
  }, [config, service])

  const joinSession = useCallback(async (sessionId: string): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true }))

    try {
      service.sendMessage({
        type: 'schedule_update',
        payload: {
          type: 'join_session',
          sessionId,
          user: {
            id: config.userId,
            name: config.userName,
            email: config.userEmail,
            avatar: config.userAvatar,
            status: 'online'
          }
        },
        timestamp: new Date().toISOString()
      })

      setState(prev => ({ ...prev, isLoading: false }))

    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: (error as Error).message 
      }))
      throw error
    }
  }, [config, service])

  const leaveSession = useCallback(async (): Promise<void> => {
    if (!state.session) return

    try {
      service.sendMessage({
        type: 'schedule_update',
        payload: {
          type: 'leave_session',
          sessionId: state.session.id,
          userId: config.userId
        },
        timestamp: new Date().toISOString()
      })

      setState(prev => ({
        ...prev,
        session: null,
        isHost: false,
        users: [],
        chatMessages: [],
        entryLocks: []
      }))

    } catch (error) {
      console.error('Error leaving session:', error)
    }
  }, [state.session, config.userId, service])

  // Entry locking
  const lockEntry = useCallback(async (entryId: string): Promise<boolean> => {
    if (!state.session) return false

    // Check if already locked
    const existingLock = state.entryLocks.find(lock => lock.entryId === entryId)
    if (existingLock) {
      if (existingLock.userId === config.userId) {
        return true // Already locked by current user
      } else {
        toast.warning('Esta entrada está siendo editada por otro usuario')
        return false
      }
    }

    try {
      const lock: EntryLock = {
        entryId,
        userId: config.userId,
        userName: config.userName,
        timestamp: new Date(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
      }

      service.sendMessage({
        type: 'schedule_update',
        payload: {
          type: 'lock_entry',
          lock
        },
        timestamp: new Date().toISOString()
      })

      setState(prev => ({
        ...prev,
        entryLocks: [...prev.entryLocks, lock]
      }))

      return true

    } catch (error) {
      console.error('Error locking entry:', error)
      return false
    }
  }, [state.session, state.entryLocks, config.userId, config.userName, service])

  const unlockEntry = useCallback(async (entryId: string): Promise<void> => {
    if (!state.session) return

    try {
      service.sendMessage({
        type: 'schedule_update',
        payload: {
          type: 'unlock_entry',
          entryId,
          userId: config.userId
        },
        timestamp: new Date().toISOString()
      })

      setState(prev => ({
        ...prev,
        entryLocks: prev.entryLocks.filter(lock => lock.entryId !== entryId)
      }))

    } catch (error) {
      console.error('Error unlocking entry:', error)
    }
  }, [state.session, config.userId, service])

  // Chat functionality
  const sendChatMessage = useCallback(async (message: string): Promise<void> => {
    if (!state.session) return

    const chatMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      userId: config.userId,
      message,
      timestamp: new Date(),
      type: 'message'
    }

    try {
      service.sendMessage({
        type: 'schedule_update',
        payload: {
          type: 'chat_message',
          message: chatMessage
        },
        timestamp: new Date().toISOString()
      })

      setState(prev => ({
        ...prev,
        chatMessages: [...prev.chatMessages, chatMessage]
      }))

    } catch (error) {
      console.error('Error sending chat message:', error)
    }
  }, [state.session, config.userId, service])

  // Utility functions
  const getCurrentUser = useCallback((): CollaborativeUser | null => {
    return state.users.find(user => user.id === config.userId) || null
  }, [state.users, config.userId])

  const canUserEdit = useCallback((userId?: string): boolean => {
    const targetUserId = userId || config.userId
    const user = state.users.find(u => u.id === targetUserId)
    return user?.permissions.canEdit || false
  }, [state.users, config.userId])

  const canUserManage = useCallback((userId?: string): boolean => {
    const targetUserId = userId || config.userId
    const user = state.users.find(u => u.id === targetUserId)
    return user?.permissions.canManagePermissions || state.session?.owner === targetUserId || false
  }, [state.users, config.userId, state.session])

  const isEntryLocked = useCallback((entryId: string): boolean => {
    const lock = state.entryLocks.find(lock => lock.entryId === entryId)
    return lock ? lock.expiresAt > new Date() : false
  }, [state.entryLocks])

  const getEntryLock = useCallback((entryId: string): EntryLock | null => {
    return state.entryLocks.find(lock => lock.entryId === entryId) || null
  }, [state.entryLocks])

  const getActiveUsers = useCallback((): CollaborativeUser[] => {
    return state.users.filter(user => user.status !== 'offline')
  }, [state.users])

  const broadcastUserAction = useCallback((action: string, data: any) => {
    if (!state.session) return

    service.sendMessage({
      type: 'schedule_update',
      payload: {
        type: 'user_action',
        action,
        data,
        userId: config.userId
      },
      timestamp: new Date().toISOString()
    })
  }, [state.session, config.userId, service])

  const setUserStatus = useCallback((status: 'online' | 'away' | 'offline') => {
    broadcastUserAction('status_change', { status })
  }, [broadcastUserAction])

  const setCurrentAction = useCallback((action: CollaborativeUser['currentAction']) => {
    broadcastUserAction('current_action', { currentAction: action })
  }, [broadcastUserAction])

  // Update connection state
  useEffect(() => {
    setState(prev => ({
      ...prev,
      isConnected,
      connectionState
    }))
  }, [isConnected, connectionState])

  // Clean up expired locks
  useEffect(() => {
    const interval = setInterval(() => {
      setState(prev => ({
        ...prev,
        entryLocks: prev.entryLocks.filter(lock => lock.expiresAt > new Date())
      }))
    }, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [])

  return {
    // State
    state,
    
    // Session management
    createSession,
    joinSession,
    leaveSession,
    
    // User management (to be implemented)
    inviteUser: async () => {},
    removeUser: async () => {},
    updateUserRole: async () => {},
    updateUserPermissions: async () => {},
    
    // Entry locking
    lockEntry,
    unlockEntry,
    isEntryLocked,
    getEntryLock,
    
    // Chat
    sendChatMessage,
    markTyping: () => {},
    
    // Settings (to be implemented)
    updateSessionSettings: async () => {},
    
    // User actions
    broadcastUserAction,
    setUserStatus,
    setCurrentAction,
    
    // Utilities
    getCurrentUser,
    canUserEdit,
    canUserManage,
    getActiveUsers,
    hasActiveConflicts: () => false
  }
}