/**
 * WebSocket Provider for Global Real-time State Management
 * Provides WebSocket connection status and notifications across the app
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useWebSocket, WebSocketMessage } from './websocket-client'
import toast from 'react-hot-toast'

interface WebSocketContextType {
  isConnected: boolean
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'reconnecting'
  reconnectAttempts: number
  module: string
  lastMessage: WebSocketMessage | null
  connectionError: string | null
  sendMessage: (message: any) => void
  subscribe: (module: string) => void
  unsubscribe: (module: string) => void
}

const WebSocketContext = createContext<WebSocketContextType | null>(null)

interface WebSocketProviderProps {
  children: ReactNode
  defaultModule?: string
  enableNotifications?: boolean
}

export function WebSocketProvider({ 
  children, 
  defaultModule = 'global',
  enableNotifications = true 
}: WebSocketProviderProps) {
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'reconnecting'>('disconnected')
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)

  // Initialize WebSocket connection
  const webSocket = useWebSocket(defaultModule)

  // Monitor connection status
  useEffect(() => {
    const checkStatus = () => {
      const status = webSocket.getStatus()
      setIsConnected(status.isConnected)
      setReconnectAttempts(status.reconnectAttempts)
      
      if (status.isConnected) {
        setConnectionStatus('connected')
        setConnectionError(null)
        
        if (enableNotifications && reconnectAttempts > 0) {
          toast.success('Conexión en tiempo real restablecida', {
            icon: '🔗',
            duration: 3000
          })
        }
      } else if (status.reconnectAttempts > 0) {
        setConnectionStatus('reconnecting')
        setConnectionError('Reconectando...')
      } else {
        setConnectionStatus('disconnected')
        setConnectionError('Desconectado')
      }
    }

    // Check status immediately
    checkStatus()

    // Set up periodic status checks
    const statusInterval = setInterval(checkStatus, 2000)

    return () => clearInterval(statusInterval)
  }, [enableNotifications, reconnectAttempts, webSocket])

  // Handle incoming messages
  useEffect(() => {
    const handleMessage = (message: WebSocketMessage) => {
      setLastMessage(message)
      
      // Handle specific message types for global notifications
      if (enableNotifications) {
        switch (message.type) {
          case 'connection_established':
            setConnectionStatus('connected')
            console.log('🔗 [WebSocket Provider] Connection established')
            break
            
          case 'database_change':
            // Database change notifications are handled by the WebSocket client
            // We just update the last message here
            break
            
          case 'config_change':
            toast.success('Configuración actualizada en tiempo real', {
              icon: '⚙️',
              duration: 3000
            })
            break
            
          case 'schedule_conflict':
            toast.error('Conflicto de horario detectado', {
              icon: '⚠️',
              duration: 5000
            })
            break
            
          case 'error':
            toast.error(message.message || 'Error en conexión WebSocket', {
              icon: '❌',
              duration: 4000
            })
            setConnectionError(message.message || 'Error desconocido')
            break
        }
      }
    }

    webSocket.addMessageHandler(handleMessage)

    return () => {
      webSocket.removeMessageHandler(handleMessage)
    }
  }, [webSocket, enableNotifications])

  // Show initial connection status
  useEffect(() => {
    if (enableNotifications && import.meta.env.VITE_ENABLE_WEBSOCKET === 'true') {
      // Show initial connection attempt
      setConnectionStatus('connecting')
      
      const connectingToast = toast.loading('Conectando en tiempo real...', {
        icon: '🔌'
      })

      const timer = setTimeout(() => {
        toast.dismiss(connectingToast)
        
        if (isConnected) {
          toast.success('Conexión en tiempo real establecida', {
            icon: '🔗',
            duration: 2000
          })
        }
      }, 3000)

      return () => {
        clearTimeout(timer)
        toast.dismiss(connectingToast)
      }
    }
  }, [enableNotifications, isConnected])

  const contextValue: WebSocketContextType = {
    isConnected,
    connectionStatus,
    reconnectAttempts,
    module: defaultModule,
    lastMessage,
    connectionError,
    sendMessage: webSocket.sendMessage,
    subscribe: webSocket.subscribe,
    unsubscribe: webSocket.unsubscribe
  }

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  )
}

// Hook to use WebSocket context
export function useWebSocketContext() {
  const context = useContext(WebSocketContext)
  
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider')
  }
  
  return context
}

// Hook to check if real-time updates are available
export function useRealTimeStatus() {
  const { isConnected, connectionStatus, connectionError } = useWebSocketContext()
  
  return {
    isRealTimeEnabled: import.meta.env.VITE_ENABLE_WEBSOCKET === 'true',
    isConnected,
    status: connectionStatus,
    error: connectionError,
    statusText: {
      connecting: 'Conectando...',
      connected: 'Tiempo real activo',
      disconnected: 'Sin conexión en tiempo real',
      reconnecting: 'Reconectando...'
    }[connectionStatus]
  }
}