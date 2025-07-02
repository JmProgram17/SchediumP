/**
 * WebSocket Client for Real-time Notifications
 * Connects to backend WebSocket and handles real-time updates
 */

import { useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

export interface WebSocketMessage {
  type: string
  timestamp: string
  module?: string
  table?: string
  operation?: string
  data?: any
  message?: string
}

export interface WebSocketConfig {
  url: string
  module?: string
  autoReconnect?: boolean
  maxReconnectAttempts?: number
  reconnectInterval?: number
}

class WebSocketManager {
  private ws: WebSocket | null = null
  private url: string
  private module: string
  private autoReconnect: boolean
  private maxReconnectAttempts: number
  private reconnectInterval: number
  private reconnectAttempts: number = 0
  private isConnected: boolean = false
  private messageHandlers: ((message: WebSocketMessage) => void)[] = []
  private queryClient: any = null

  constructor(config: WebSocketConfig) {
    this.url = config.url
    this.module = config.module || 'global'
    this.autoReconnect = config.autoReconnect ?? true
    this.maxReconnectAttempts = config.maxReconnectAttempts ?? 5
    this.reconnectInterval = config.reconnectInterval ?? 3000
  }

  setQueryClient(queryClient: any) {
    this.queryClient = queryClient
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = this.module === 'global' 
          ? `${this.url}/ws` 
          : `${this.url}/ws/${this.module}`
        
        console.log(`🔌 [WebSocket] Connecting to: ${wsUrl}`)
        
        this.ws = new WebSocket(wsUrl)

        this.ws.onopen = () => {
          console.log(`✅ [WebSocket] Connected to ${this.module} module`)
          this.isConnected = true
          this.reconnectAttempts = 0
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data)
            console.log(`📨 [WebSocket] Message received:`, message)
            this.handleMessage(message)
          } catch (error) {
            console.error('❌ [WebSocket] Error parsing message:', error)
          }
        }

        this.ws.onclose = (event) => {
          console.log(`🔌 [WebSocket] Connection closed:`, event.code, event.reason)
          this.isConnected = false
          
          if (this.autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++
            console.log(`🔄 [WebSocket] Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`)
            
            setTimeout(() => {
              this.connect().catch(console.error)
            }, this.reconnectInterval)
          }
        }

        this.ws.onerror = (error) => {
          console.error('❌ [WebSocket] Connection error:', error)
          reject(error)
        }

      } catch (error) {
        console.error('❌ [WebSocket] Failed to create connection:', error)
        reject(error)
      }
    })
  }

  disconnect() {
    if (this.ws) {
      console.log(`🔌 [WebSocket] Disconnecting from ${this.module}`)
      this.autoReconnect = false
      this.ws.close()
      this.ws = null
      this.isConnected = false
    }
  }

  send(message: any) {
    if (this.ws && this.isConnected) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.warn('⚠️ [WebSocket] Cannot send message - not connected')
    }
  }

  addMessageHandler(handler: (message: WebSocketMessage) => void) {
    this.messageHandlers.push(handler)
  }

  removeMessageHandler(handler: (message: WebSocketMessage) => void) {
    const index = this.messageHandlers.indexOf(handler)
    if (index > -1) {
      this.messageHandlers.splice(index, 1)
    }
  }

  private handleMessage(message: WebSocketMessage) {
    // Handle different message types
    switch (message.type) {
      case 'database_change':
        this.handleDatabaseChange(message)
        break
        
      case 'config_change':
        this.handleConfigChange(message)
        break
        
      case 'schedule_conflict':
        this.handleScheduleConflict(message)
        break
        
      case 'connection_established':
        console.log(`🎉 [WebSocket] ${message.message}`)
        break
        
      case 'pong':
        // Handle ping/pong for keep-alive
        break
        
      default:
        console.log(`📝 [WebSocket] Unknown message type: ${message.type}`)
    }

    // Notify all registered handlers
    this.messageHandlers.forEach(handler => handler(message))
  }

  private handleDatabaseChange(message: WebSocketMessage) {
    const { table, operation, affected_module } = message
    
    console.log(`🔄 [WebSocket] Database change: ${table} ${operation} in ${affected_module}`)
    
    if (this.queryClient) {
      // Invalidate relevant queries based on the table
      const moduleQueryKeys: Record<string, string[]> = {
        'days': ['academic-config', 'days'],
        'time_blocks': ['academic-config', 'time-blocks'],
        'schedule_configs': ['academic-config', 'schedule-config'],
        'quarters': ['academic-config', 'quarters'],
        'class_schedules': ['scheduling', 'classSchedules'],
        'day_time_blocks': ['scheduling', 'dayTimeBlocks'],
        'student_groups': ['groups', 'academic'],
        'instructors': ['instructors', 'hr'],
        'classrooms': ['classrooms', 'infrastructure'],
        'programs': ['programs', 'academic']
      }
      
      const queryKey = moduleQueryKeys[table]
      if (queryKey) {
        // Invalidate and refetch the affected queries
        this.queryClient.invalidateQueries({ queryKey })
        console.log(`♻️ [WebSocket] Invalidated query: ${queryKey.join('/')}`)
        
        // Show user-friendly notification
        const operationText = {
          create: 'creado',
          update: 'actualizado', 
          delete: 'eliminado'
        }[operation] || 'modificado'
        
        toast.success(`Datos ${operationText} - Información actualizada automáticamente`, {
          duration: 2000,
          icon: '🔄'
        })
      }
    }
  }

  private handleConfigChange(message: WebSocketMessage) {
    console.log(`⚙️ [WebSocket] Configuration change:`, message)
    
    if (this.queryClient) {
      // Invalidate configuration-related queries
      this.queryClient.invalidateQueries({ queryKey: ['academic-config'] })
      
      toast.success('Configuración actualizada automáticamente', {
        duration: 2000,
        icon: '⚙️'
      })
    }
  }

  private handleScheduleConflict(message: WebSocketMessage) {
    console.log(`⚠️ [WebSocket] Schedule conflict detected:`, message)
    
    toast.error('Conflicto de horario detectado', {
      duration: 4000,
      icon: '⚠️'
    })
  }

  ping() {
    this.send({ type: 'ping' })
  }

  subscribe(module: string) {
    this.send({ type: 'subscribe', module })
  }

  unsubscribe(module: string) {
    this.send({ type: 'unsubscribe', module })
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      module: this.module,
      reconnectAttempts: this.reconnectAttempts
    }
  }
}

// Hook for using WebSocket in React components
export function useWebSocket(module: string = 'global') {
  const queryClient = useQueryClient()
  const wsManagerRef = useRef<WebSocketManager | null>(null)
  const isInitializedRef = useRef(false)

  // Get WebSocket URL from environment
  const getWebSocketUrl = useCallback(() => {
    // Check if WebSocket is enabled
    if (import.meta.env.VITE_ENABLE_WEBSOCKET !== 'true') {
      console.log('🔌 [WebSocket] Disabled via environment variable')
      return null
    }
    
    const wsUrl = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8001'
    return wsUrl + '/api/v1'
  }, [])

  // Initialize WebSocket connection
  useEffect(() => {
    if (isInitializedRef.current) return
    
    const wsUrl = getWebSocketUrl()
    
    // Exit early if WebSocket is disabled
    if (!wsUrl) {
      console.log('🔌 [WebSocket] Skipping connection - disabled')
      return
    }
    
    wsManagerRef.current = new WebSocketManager({
      url: wsUrl,
      module,
      autoReconnect: true,
      maxReconnectAttempts: 5,
      reconnectInterval: 3000
    })

    wsManagerRef.current.setQueryClient(queryClient)

    // Connect to WebSocket
    wsManagerRef.current.connect().catch(error => {
      console.error('❌ [WebSocket] Failed to connect:', error)
    })

    isInitializedRef.current = true

    // Cleanup on unmount
    return () => {
      if (wsManagerRef.current) {
        wsManagerRef.current.disconnect()
        wsManagerRef.current = null
      }
      isInitializedRef.current = false
    }
  }, [module, queryClient, getWebSocketUrl])

  // Send message
  const sendMessage = useCallback((message: any) => {
    wsManagerRef.current?.send(message)
  }, [])

  // Add message handler
  const addMessageHandler = useCallback((handler: (message: WebSocketMessage) => void) => {
    wsManagerRef.current?.addMessageHandler(handler)
  }, [])

  // Remove message handler
  const removeMessageHandler = useCallback((handler: (message: WebSocketMessage) => void) => {
    wsManagerRef.current?.removeMessageHandler(handler)
  }, [])

  // Get connection status
  const getStatus = useCallback(() => {
    return wsManagerRef.current?.getConnectionStatus() || {
      isConnected: false,
      module: 'unknown',
      reconnectAttempts: 0
    }
  }, [])

  return {
    sendMessage,
    addMessageHandler,
    removeMessageHandler,
    getStatus,
    ping: () => wsManagerRef.current?.ping(),
    subscribe: (newModule: string) => wsManagerRef.current?.subscribe(newModule),
    unsubscribe: (targetModule: string) => wsManagerRef.current?.unsubscribe(targetModule)
  }
}

// Hook specifically for academic configuration real-time updates
export function useAcademicConfigWebSocket() {
  return useWebSocket('academic-config')
}

// Hook for scheduling real-time updates
export function useSchedulingWebSocket() {
  return useWebSocket('scheduling')
}