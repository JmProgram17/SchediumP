/**
 * Real-time Connection Status Indicator
 * Shows the current status of WebSocket connection
 */

import React from 'react'
import { Wifi, WifiOff, RotateCw, AlertCircle } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useRealTimeStatus } from '@/services/websocket/websocket-provider'

interface RealTimeStatusProps {
  showText?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function RealTimeStatus({ 
  showText = false, 
  size = 'md',
  className 
}: RealTimeStatusProps) {
  const { isRealTimeEnabled, isConnected, status, statusText, error } = useRealTimeStatus()

  // Don't render if WebSocket is disabled
  if (!isRealTimeEnabled) {
    return null
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return <Wifi className={getIconSize()} />
      case 'connecting':
      case 'reconnecting':
        return <RotateCw className={cn(getIconSize(), 'animate-spin')} />
      case 'disconnected':
        return error ? <AlertCircle className={getIconSize()} /> : <WifiOff className={getIconSize()} />
      default:
        return <WifiOff className={getIconSize()} />
    }
  }

  const getIconSize = () => {
    switch (size) {
      case 'sm': return 'w-3 h-3'
      case 'md': return 'w-4 h-4'
      case 'lg': return 'w-5 h-5'
      default: return 'w-4 h-4'
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'text-green-500 dark:text-green-400'
      case 'connecting':
      case 'reconnecting':
        return 'text-yellow-500 dark:text-yellow-400'
      case 'disconnected':
        return 'text-red-500 dark:text-red-400'
      default:
        return 'text-gray-500 dark:text-gray-400'
    }
  }

  const getTextSize = () => {
    switch (size) {
      case 'sm': return 'text-xs'
      case 'md': return 'text-sm'
      case 'lg': return 'text-base'
      default: return 'text-sm'
    }
  }

  return (
    <div 
      className={cn(
        'flex items-center gap-1.5',
        getStatusColor(),
        className
      )}
      title={error || statusText}
    >
      {getStatusIcon()}
      {showText && (
        <span className={cn('font-medium', getTextSize())}>
          {statusText}
        </span>
      )}
    </div>
  )
}

// Badge version for status in headers/navigation
export function RealTimeStatusBadge() {
  const { isRealTimeEnabled, isConnected, status } = useRealTimeStatus()

  if (!isRealTimeEnabled) {
    return null
  }

  const getBadgeColor = () => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
      case 'connecting':
      case 'reconnecting':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800'
      case 'disconnected':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800'
    }
  }

  return (
    <div className={cn(
      'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border',
      getBadgeColor()
    )}>
      <div className={cn(
        'w-2 h-2 rounded-full',
        status === 'connected' ? 'bg-current' : '',
        status === 'connecting' || status === 'reconnecting' ? 'bg-current animate-pulse' : '',
        status === 'disconnected' ? 'bg-current' : ''
      )} />
      <span>
        {status === 'connected' && 'En vivo'}
        {status === 'connecting' && 'Conectando'}
        {status === 'reconnecting' && 'Reconectando'}
        {status === 'disconnected' && 'Desconectado'}
      </span>
    </div>
  )
}

// Compact version for toolbars
export function RealTimeStatusIcon({ className }: { className?: string }) {
  return (
    <RealTimeStatus 
      showText={false} 
      size="sm" 
      className={cn('opacity-60 hover:opacity-100 transition-opacity', className)}
    />
  )
}