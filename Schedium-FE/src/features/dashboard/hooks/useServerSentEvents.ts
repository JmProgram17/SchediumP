/**
 * Server-Sent Events Hook - Real-time data streaming for dashboard analytics
 * Implements efficient SSE connection with automatic reconnection and data processing
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

export interface SSEMessage {
  id: string
  type: string
  data: any
  timestamp: number
  source: string
}

export interface SSEMetrics {
  connectedTime: number
  messagesReceived: number
  reconnectionAttempts: number
  lastMessageTime: number
  averageLatency: number
  dataTransferred: number
}

export interface DashboardEvent {
  type: 'schedule_update' | 'user_activity' | 'system_alert' | 'performance_metric' | 'notification'
  data: {
    scheduleId?: string
    userId?: string
    metric?: {
      name: string
      value: number
      timestamp: number
      threshold?: number
    }
    alert?: {
      level: 'info' | 'warning' | 'error' | 'critical'
      message: string
      source: string
    }
    notification?: {
      title: string
      message: string
      action?: string
      userId: string
    }
  }
  timestamp: number
}

interface UseServerSentEventsOptions {
  endpoint?: string
  enableReconnection?: boolean
  maxReconnectAttempts?: number
  reconnectDelay?: number
  enableCompression?: boolean
  enableHeartbeat?: boolean
  heartbeatInterval?: number
  onMessage?: (message: SSEMessage) => void
  onError?: (error: Event) => void
  onConnect?: () => void
  onDisconnect?: () => void
  filters?: string[]
}

export const useServerSentEvents = (options: UseServerSentEventsOptions = {}) => {
  const {
    endpoint = '/api/v1/sse/dashboard',
    enableReconnection = true,
    maxReconnectAttempts = 5,
    reconnectDelay = 1000,
    enableCompression = true,
    enableHeartbeat = true,
    heartbeatInterval = 30000,
    onMessage,
    onError,
    onConnect,
    onDisconnect,
    filters = []
  } = options

  const [connectionState, setConnectionState] = useState({
    isConnected: false,
    isConnecting: false,
    isReconnecting: false,
    lastError: null as string | null
  })

  const [metrics, setMetrics] = useState<SSEMetrics>({
    connectedTime: 0,
    messagesReceived: 0,
    reconnectionAttempts: 0,
    lastMessageTime: 0,
    averageLatency: 0,
    dataTransferred: 0
  })

  const [realtimeData, setRealtimeData] = useState<{
    scheduleUpdates: DashboardEvent[]
    userActivity: DashboardEvent[]
    systemAlerts: DashboardEvent[]
    performanceMetrics: DashboardEvent[]
    notifications: DashboardEvent[]
  }>({
    scheduleUpdates: [],
    userActivity: [],
    systemAlerts: [],
    performanceMetrics: [],
    notifications: []
  })

  const eventSourceRef = useRef<EventSource | null>(null)
  const queryClient = useQueryClient()
  const reconnectAttemptsRef = useRef(0)
  const connectTimeRef = useRef(0)
  const heartbeatTimerRef = useRef<NodeJS.Timeout>()
  const latencyTrackerRef = useRef<number[]>([])

  // Build SSE URL with filters and options
  const buildSSEUrl = useCallback(() => {
    const url = new URL(endpoint, window.location.origin)
    
    if (filters.length > 0) {
      url.searchParams.set('filters', filters.join(','))
    }
    
    if (enableCompression) {
      url.searchParams.set('compress', 'true')
    }
    
    // Add authentication token
    const token = localStorage.getItem('access_token')
    if (token) {
      url.searchParams.set('token', token)
    }

    return url.toString()
  }, [endpoint, filters, enableCompression])

  // Process incoming SSE message
  const processMessage = useCallback((event: MessageEvent) => {
    try {
      const message: SSEMessage = {
        id: event.lastEventId || `${Date.now()}-${Math.random()}`,
        type: event.type || 'message',
        data: JSON.parse(event.data),
        timestamp: Date.now(),
        source: 'sse'
      }

      // Update metrics
      setMetrics(prev => {
        const newLatency = Date.now() - (message.data.serverTimestamp || Date.now())
        latencyTrackerRef.current.push(newLatency)
        
        // Keep only last 100 latency measurements
        if (latencyTrackerRef.current.length > 100) {
          latencyTrackerRef.current.shift()
        }

        const averageLatency = latencyTrackerRef.current.reduce((sum, val) => sum + val, 0) / latencyTrackerRef.current.length

        return {
          ...prev,
          messagesReceived: prev.messagesReceived + 1,
          lastMessageTime: Date.now(),
          averageLatency,
          dataTransferred: prev.dataTransferred + new Blob([event.data]).size
        }
      })

      // Process dashboard events
      if (message.data.type) {
        const dashboardEvent: DashboardEvent = {
          type: message.data.type,
          data: message.data.payload || message.data,
          timestamp: message.timestamp
        }

        setRealtimeData(prev => {
          const newData = { ...prev }
          const maxEvents = 50 // Keep only last 50 events per type

          switch (dashboardEvent.type) {
            case 'schedule_update':
              newData.scheduleUpdates = [...prev.scheduleUpdates.slice(-maxEvents + 1), dashboardEvent]
              // Invalidate schedule-related queries
              queryClient.invalidateQueries({ queryKey: ['schedules'] })
              break
            
            case 'user_activity':
              newData.userActivity = [...prev.userActivity.slice(-maxEvents + 1), dashboardEvent]
              break
            
            case 'system_alert':
              newData.systemAlerts = [...prev.systemAlerts.slice(-maxEvents + 1), dashboardEvent]
              
              // Show toast for critical alerts
              if (dashboardEvent.data.alert?.level === 'critical') {
                toast.error(dashboardEvent.data.alert.message, {
                  duration: 10000,
                  position: 'top-center'
                })
              }
              break
            
            case 'performance_metric':
              newData.performanceMetrics = [...prev.performanceMetrics.slice(-maxEvents + 1), dashboardEvent]
              break
            
            case 'notification':
              newData.notifications = [...prev.notifications.slice(-maxEvents + 1), dashboardEvent]
              
              // Show toast notification
              if (dashboardEvent.data.notification) {
                toast(dashboardEvent.data.notification.message, {
                  duration: 5000,
                  position: 'top-right'
                })
              }
              break
          }

          return newData
        })
      }

      // Call custom message handler
      onMessage?.(message)

    } catch (error) {
      console.error('Error processing SSE message:', error)
    }
  }, [onMessage, queryClient])

  // Connect to SSE endpoint
  const connect = useCallback(() => {
    if (eventSourceRef.current?.readyState === EventSource.OPEN) {
      return
    }

    setConnectionState(prev => ({
      ...prev,
      isConnecting: true,
      isReconnecting: reconnectAttemptsRef.current > 0
    }))

    try {
      const url = buildSSEUrl()
      eventSourceRef.current = new EventSource(url)

      eventSourceRef.current.onopen = () => {
        setConnectionState({
          isConnected: true,
          isConnecting: false,
          isReconnecting: false,
          lastError: null
        })

        connectTimeRef.current = Date.now()
        reconnectAttemptsRef.current = 0

        // Start heartbeat
        if (enableHeartbeat) {
          heartbeatTimerRef.current = setInterval(() => {
            // Send heartbeat via fetch (SSE is read-only)
            fetch('/api/v1/sse/heartbeat', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ timestamp: Date.now() })
            }).catch(console.error)
          }, heartbeatInterval)
        }

        onConnect?.()
        console.log('SSE connection established')
      }

      eventSourceRef.current.onerror = (error) => {
        console.error('SSE connection error:', error)
        
        setConnectionState(prev => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
          lastError: 'Connection error'
        }))

        if (heartbeatTimerRef.current) {
          clearInterval(heartbeatTimerRef.current)
        }

        onError?.(error)
        onDisconnect?.()

        // Auto-reconnect logic
        if (enableReconnection && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(reconnectDelay * Math.pow(2, reconnectAttemptsRef.current), 30000)
          reconnectAttemptsRef.current++

          setMetrics(prev => ({
            ...prev,
            reconnectionAttempts: prev.reconnectionAttempts + 1
          }))

          setTimeout(() => {
            if (eventSourceRef.current?.readyState !== EventSource.OPEN) {
              connect()
            }
          }, delay)
        }
      }

      eventSourceRef.current.onmessage = processMessage

      // Listen for specific event types
      const eventTypes = ['schedule_update', 'user_activity', 'system_alert', 'performance_metric', 'notification']
      eventTypes.forEach(type => {
        eventSourceRef.current?.addEventListener(type, processMessage)
      })

    } catch (error) {
      console.error('Failed to create SSE connection:', error)
      setConnectionState(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        lastError: 'Failed to connect'
      }))
    }
  }, [
    buildSSEUrl,
    enableHeartbeat,
    heartbeatInterval,
    enableReconnection,
    maxReconnectAttempts,
    reconnectDelay,
    onConnect,
    onError,
    onDisconnect,
    processMessage
  ])

  // Disconnect from SSE
  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current)
    }

    setConnectionState({
      isConnected: false,
      isConnecting: false,
      isReconnecting: false,
      lastError: null
    })

    onDisconnect?.()
  }, [onDisconnect])

  // Get connection statistics
  const getConnectionStats = useCallback(() => {
    const now = Date.now()
    const uptime = connectionState.isConnected ? now - connectTimeRef.current : 0

    return {
      ...metrics,
      uptime,
      connectionQuality: metrics.averageLatency < 100 ? 'excellent' : 
                       metrics.averageLatency < 300 ? 'good' : 
                       metrics.averageLatency < 600 ? 'fair' : 'poor',
      messagesPerSecond: uptime > 0 ? (metrics.messagesReceived / (uptime / 1000)) : 0
    }
  }, [connectionState.isConnected, metrics])

  // Clear realtime data
  const clearRealtimeData = useCallback(() => {
    setRealtimeData({
      scheduleUpdates: [],
      userActivity: [],
      systemAlerts: [],
      performanceMetrics: [],
      notifications: []
    })
  }, [])

  // Initialize connection on mount
  useEffect(() => {
    connect()

    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  // Update connected time metric
  useEffect(() => {
    if (!connectionState.isConnected) return

    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        connectedTime: Date.now() - connectTimeRef.current
      }))
    }, 1000)

    return () => clearInterval(interval)
  }, [connectionState.isConnected])

  return {
    // Connection state
    connectionState,
    isConnected: connectionState.isConnected,
    isConnecting: connectionState.isConnecting,
    isReconnecting: connectionState.isReconnecting,
    lastError: connectionState.lastError,

    // Real-time data
    realtimeData,
    scheduleUpdates: realtimeData.scheduleUpdates,
    userActivity: realtimeData.userActivity,
    systemAlerts: realtimeData.systemAlerts,
    performanceMetrics: realtimeData.performanceMetrics,
    notifications: realtimeData.notifications,

    // Connection management
    connect,
    disconnect,
    
    // Metrics and statistics
    metrics,
    getConnectionStats,
    
    // Utilities
    clearRealtimeData,
    
    // Connection quality indicators
    connectionQuality: getConnectionStats().connectionQuality,
    hasRecentActivity: Date.now() - metrics.lastMessageTime < 60000,
    isHealthy: connectionState.isConnected && metrics.averageLatency < 1000
  }
}