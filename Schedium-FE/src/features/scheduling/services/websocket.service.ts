/**
 * WebSocket Service - Real-time schedule validation and conflict detection
 * Provides real-time updates for schedule changes and conflicts
 */

import { 
  ScheduleEntry, 
  ScheduleConflict, 
  ScheduleUpdateEvent,
  ConflictType 
} from '../types'

export interface WebSocketMessage {
  type: 'schedule_update' | 'conflict_detected' | 'conflict_resolved' | 'user_joined' | 'user_left' | 'ping' | 'pong'
  payload: any
  timestamp: string
  userId?: string
  sessionId?: string
}

export interface WebSocketConfig {
  url: string
  protocols?: string[]
  reconnectDelay?: number
  maxReconnectAttempts?: number
  pingInterval?: number
  enableLogging?: boolean
}

export interface WebSocketCallbacks {
  onScheduleUpdate?: (event: ScheduleUpdateEvent) => void
  onConflictDetected?: (conflict: ScheduleConflict) => void
  onConflictResolved?: (conflictId: string) => void
  onUserJoined?: (userId: string, userInfo: any) => void
  onUserLeft?: (userId: string) => void
  onConnectionChange?: (connected: boolean) => void
  onError?: (error: Error) => void
  onMessage?: (message: WebSocketMessage) => void
}

export class ScheduleWebSocketService {
  private ws: WebSocket | null = null
  private config: Required<WebSocketConfig>
  private callbacks: WebSocketCallbacks
  private reconnectAttempt = 0
  private pingTimer: NodeJS.Timeout | null = null
  private isManualClose = false
  private messageQueue: WebSocketMessage[] = []

  constructor(config: WebSocketConfig, callbacks: WebSocketCallbacks = {}) {
    this.config = {
      protocols: [],
      reconnectDelay: 3000,
      maxReconnectAttempts: 5,
      pingInterval: 30000,
      enableLogging: false,
      ...config
    }
    this.callbacks = callbacks
  }

  // Connection management
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.isManualClose = false
        
        // Create WebSocket connection
        this.ws = new WebSocket(this.config.url, this.config.protocols)
        
        this.ws.onopen = () => {
          this.log('WebSocket connected')
          this.reconnectAttempt = 0
          this.callbacks.onConnectionChange?.(true)
          
          // Start ping timer
          this.startPingTimer()
          
          // Send queued messages
          this.sendQueuedMessages()
          
          resolve()
        }

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data)
        }

        this.ws.onclose = (event) => {
          this.log(`WebSocket closed: ${event.code} - ${event.reason}`)
          this.cleanup()
          this.callbacks.onConnectionChange?.(false)
          
          if (!this.isManualClose && this.reconnectAttempt < this.config.maxReconnectAttempts) {
            this.scheduleReconnect()
          } else if (!this.isManualClose) {
            reject(new Error('Max reconnection attempts reached'))
          }
        }

        this.ws.onerror = (error) => {
          this.log('WebSocket error:', error)
          const wsError = new Error('WebSocket connection error')
          this.callbacks.onError?.(wsError)
          reject(wsError)
        }

      } catch (error) {
        reject(error)
      }
    })
  }

  disconnect(): void {
    this.isManualClose = true
    this.cleanup()
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect')
      this.ws = null
    }
  }

  // Message handling
  private handleMessage(data: string): void {
    try {
      const message: WebSocketMessage = JSON.parse(data)
      this.log('Received message:', message)

      this.callbacks.onMessage?.(message)

      switch (message.type) {
        case 'schedule_update':
          this.handleScheduleUpdate(message.payload)
          break
          
        case 'conflict_detected':
          this.handleConflictDetected(message.payload)
          break
          
        case 'conflict_resolved':
          this.handleConflictResolved(message.payload.conflictId)
          break
          
        case 'user_joined':
          this.callbacks.onUserJoined?.(message.payload.userId, message.payload.userInfo)
          break
          
        case 'user_left':
          this.callbacks.onUserLeft?.(message.payload.userId)
          break
          
        case 'pong':
          this.log('Received pong')
          break
          
        default:
          this.log('Unknown message type:', message.type)
      }
    } catch (error) {
      this.log('Error parsing message:', error)
      this.callbacks.onError?.(error as Error)
    }
  }

  private handleScheduleUpdate(payload: ScheduleUpdateEvent): void {
    this.log('Schedule update:', payload)
    this.callbacks.onScheduleUpdate?.(payload)
  }

  private handleConflictDetected(payload: ScheduleConflict): void {
    this.log('Conflict detected:', payload)
    this.callbacks.onConflictDetected?.(payload)
  }

  private handleConflictResolved(conflictId: string): void {
    this.log('Conflict resolved:', conflictId)
    this.callbacks.onConflictResolved?.(conflictId)
  }

  // Message sending
  sendMessage(message: WebSocketMessage): void {
    if (this.isConnected()) {
      try {
        this.ws!.send(JSON.stringify(message))
        this.log('Sent message:', message)
      } catch (error) {
        this.log('Error sending message:', error)
        this.queueMessage(message)
      }
    } else {
      this.queueMessage(message)
    }
  }

  private queueMessage(message: WebSocketMessage): void {
    this.messageQueue.push(message)
    
    // Limit queue size
    if (this.messageQueue.length > 50) {
      this.messageQueue = this.messageQueue.slice(-50)
    }
  }

  private sendQueuedMessages(): void {
    while (this.messageQueue.length > 0 && this.isConnected()) {
      const message = this.messageQueue.shift()
      if (message) {
        this.sendMessage(message)
      }
    }
  }

  // Schedule-specific methods
  subscribeToScheduleUpdates(scheduleId?: string): void {
    this.sendMessage({
      type: 'schedule_update',
      payload: {
        action: 'subscribe',
        scheduleId
      },
      timestamp: new Date().toISOString()
    })
  }

  unsubscribeFromScheduleUpdates(scheduleId?: string): void {
    this.sendMessage({
      type: 'schedule_update',
      payload: {
        action: 'unsubscribe',
        scheduleId
      },
      timestamp: new Date().toISOString()
    })
  }

  validateScheduleEntry(entry: ScheduleEntry): void {
    this.sendMessage({
      type: 'schedule_update',
      payload: {
        action: 'validate',
        entry
      },
      timestamp: new Date().toISOString()
    })
  }

  notifyScheduleChange(entry: ScheduleEntry, changeType: 'created' | 'updated' | 'deleted'): void {
    this.sendMessage({
      type: 'schedule_update',
      payload: {
        action: changeType,
        entry,
        changeType
      },
      timestamp: new Date().toISOString()
    })
  }

  requestConflictCheck(entries: ScheduleEntry[]): void {
    this.sendMessage({
      type: 'schedule_update',
      payload: {
        action: 'check_conflicts',
        entries
      },
      timestamp: new Date().toISOString()
    })
  }

  // Connection utilities
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  getConnectionState(): string {
    if (!this.ws) return 'DISCONNECTED'
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'CONNECTING'
      case WebSocket.OPEN: return 'CONNECTED'
      case WebSocket.CLOSING: return 'CLOSING'
      case WebSocket.CLOSED: return 'DISCONNECTED'
      default: return 'UNKNOWN'
    }
  }

  // Reconnection logic
  private scheduleReconnect(): void {
    this.reconnectAttempt++
    const delay = Math.min(this.config.reconnectDelay * Math.pow(2, this.reconnectAttempt - 1), 30000)
    
    this.log(`Scheduling reconnect attempt ${this.reconnectAttempt} in ${delay}ms`)
    
    setTimeout(() => {
      if (!this.isManualClose) {
        this.connect().catch((error) => {
          this.log('Reconnection failed:', error)
        })
      }
    }, delay)
  }

  // Ping/Pong for connection keep-alive
  private startPingTimer(): void {
    this.stopPingTimer()
    
    this.pingTimer = setInterval(() => {
      if (this.isConnected()) {
        this.sendMessage({
          type: 'ping',
          payload: {},
          timestamp: new Date().toISOString()
        })
      }
    }, this.config.pingInterval)
  }

  private stopPingTimer(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer)
      this.pingTimer = null
    }
  }

  // Cleanup
  private cleanup(): void {
    this.stopPingTimer()
  }

  // Logging
  private log(...args: any[]): void {
    if (this.config.enableLogging) {
      console.log('[ScheduleWebSocket]', ...args)
    }
  }

  // Update callbacks
  updateCallbacks(newCallbacks: Partial<WebSocketCallbacks>): void {
    this.callbacks = { ...this.callbacks, ...newCallbacks }
  }

  // Get statistics
  getStats(): {
    connectionState: string
    reconnectAttempts: number
    queuedMessages: number
    isConnected: boolean
  } {
    return {
      connectionState: this.getConnectionState(),
      reconnectAttempts: this.reconnectAttempt,
      queuedMessages: this.messageQueue.length,
      isConnected: this.isConnected()
    }
  }
}

// Factory function for creating WebSocket service
export const createScheduleWebSocketService = (
  config: WebSocketConfig, 
  callbacks: WebSocketCallbacks = {}
): ScheduleWebSocketService => {
  return new ScheduleWebSocketService(config, callbacks)
}

// Hook for using WebSocket service in React components
export const useScheduleWebSocket = (
  config: WebSocketConfig,
  callbacks: WebSocketCallbacks = {}
) => {
  const [service] = React.useState(() => createScheduleWebSocketService(config, callbacks))
  const [isConnected, setIsConnected] = React.useState(false)
  const [connectionState, setConnectionState] = React.useState('DISCONNECTED')

  React.useEffect(() => {
    // Update callbacks
    service.updateCallbacks({
      ...callbacks,
      onConnectionChange: (connected) => {
        setIsConnected(connected)
        setConnectionState(service.getConnectionState())
        callbacks.onConnectionChange?.(connected)
      }
    })

    // Connect
    service.connect().catch((error) => {
      console.error('Failed to connect to WebSocket:', error)
    })

    // Cleanup on unmount
    return () => {
      service.disconnect()
    }
  }, [])

  return {
    service,
    isConnected,
    connectionState,
    stats: service.getStats()
  }
}