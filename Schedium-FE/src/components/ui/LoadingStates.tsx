/**
 * Loading States Components - Enhanced loading experiences
 * Comprehensive loading indicators and skeleton screens
 */

import React from 'react'
import { motion } from 'framer-motion'
import { Loader2, RefreshCw, Download, Upload, Search, Calendar } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  className?: string
  label?: string
}

interface SkeletonProps {
  width?: string | number
  height?: string | number
  className?: string
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
}

interface PageLoadingProps {
  message?: string
  progress?: number
  showProgress?: boolean
}

// Enhanced Loading Spinner
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className = '',
  label
}) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }

  const colorClasses = {
    primary: 'text-blue-600',
    secondary: 'text-gray-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600'
  }

  return (
    <div className={`inline-flex items-center gap-2 ${className}`} role="status" aria-label={label || 'Loading'}>
      <Loader2 className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]}`} />
      {label && (
        <span className={`text-sm ${colorClasses[color]}`}>
          {label}
        </span>
      )}
    </div>
  )
}

// Skeleton Loader
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '1rem',
  className = '',
  variant = 'rectangular'
}) => {
  const baseClasses = 'bg-gray-200 animate-pulse'
  
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: '',
    rounded: 'rounded-md'
  }

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height
  }

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
      aria-hidden="true"
    />
  )
}

// Card Skeleton
export const CardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`p-6 border border-gray-200 rounded-lg ${className}`}>
      <div className="animate-pulse space-y-4">
        <div className="flex items-center space-x-4">
          <Skeleton variant="circular" width={40} height={40} />
          <div className="flex-1 space-y-2">
            <Skeleton height="1rem" width="75%" />
            <Skeleton height="0.75rem" width="50%" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton height="0.75rem" />
          <Skeleton height="0.75rem" width="90%" />
          <Skeleton height="0.75rem" width="80%" />
        </div>
        <div className="flex space-x-2">
          <Skeleton height="2rem" width="5rem" className="rounded-md" />
          <Skeleton height="2rem" width="5rem" className="rounded-md" />
        </div>
      </div>
    </div>
  )
}

// Table Skeleton
export const TableSkeleton: React.FC<{ 
  rows?: number
  columns?: number
  className?: string 
}> = ({ 
  rows = 5, 
  columns = 4, 
  className = '' 
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} height="1.5rem" className="rounded-md" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={`cell-${rowIndex}-${colIndex}`} height="1rem" />
          ))}
        </div>
      ))}
    </div>
  )
}

// Schedule Grid Skeleton
export const ScheduleSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  const timeSlots = Array.from({ length: 10 }, (_, i) => `${7 + i}:00`)

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <Skeleton height="2rem" width="10rem" />
        <div className="flex space-x-2">
          <Skeleton height="2rem" width="5rem" className="rounded-md" />
          <Skeleton height="2rem" width="5rem" className="rounded-md" />
        </div>
      </div>
      
      <div className="grid grid-cols-6 gap-2">
        {/* Time column header */}
        <div className="font-medium text-center py-2">
          <Skeleton height="1rem" width="3rem" />
        </div>
        
        {/* Day headers */}
        {days.map((_day, index) => (
          <div key={`day-${index}`} className="font-medium text-center py-2">
            <Skeleton height="1rem" width="3rem" />
          </div>
        ))}
        
        {/* Time slots and schedule cells */}
        {timeSlots.map((_time, timeIndex) => (
          <React.Fragment key={`time-${timeIndex}`}>
            <div className="text-sm text-gray-500 py-4 text-center">
              <Skeleton height="0.75rem" width="3rem" />
            </div>
            {days.map((_, dayIndex) => (
              <div key={`cell-${timeIndex}-${dayIndex}`} className="border border-gray-200 h-16 p-1">
                {Math.random() > 0.7 && (
                  <Skeleton height="100%" className="rounded" />
                )}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

// Page Loading with Progress
export const PageLoading: React.FC<PageLoadingProps> = ({
  message = 'Loading...',
  progress,
  showProgress = false
}) => {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
      <div className="text-center space-y-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto"
        />
        
        <div className="space-y-2">
          <p className="text-lg font-medium text-gray-900">{message}</p>
          
          {showProgress && typeof progress === 'number' && (
            <div className="w-64 mx-auto">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  className="bg-blue-600 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Inline Loading States
export const InlineLoading: React.FC<{
  type?: 'saving' | 'loading' | 'uploading' | 'downloading' | 'searching'
  message?: string
  className?: string
}> = ({ type = 'loading', message, className = '' }) => {
  const icons = {
    saving: RefreshCw,
    loading: Loader2,
    uploading: Upload,
    downloading: Download,
    searching: Search
  }

  const messages = {
    saving: 'Saving...',
    loading: 'Loading...',
    uploading: 'Uploading...',
    downloading: 'Downloading...',
    searching: 'Searching...'
  }

  const Icon = icons[type]
  const defaultMessage = messages[type]

  return (
    <div className={`inline-flex items-center gap-2 text-sm text-gray-600 ${className}`}>
      <Icon className="w-4 h-4 animate-spin" />
      <span>{message || defaultMessage}</span>
    </div>
  )
}

// Empty State with Loading Option
export const EmptyState: React.FC<{
  icon?: React.ComponentType<{ className?: string }>
  title: string
  description?: string
  action?: React.ReactNode
  isLoading?: boolean
  className?: string
}> = ({
  icon: Icon = Calendar,
  title,
  description,
  action,
  isLoading = false,
  className = ''
}) => {
  if (isLoading) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <LoadingSpinner size="lg" className="mb-4" />
        <p className="text-gray-500">Loading data...</p>
      </div>
    )
  }

  return (
    <div className={`text-center py-12 ${className}`}>
      <Icon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-500 mb-6 max-w-sm mx-auto">{description}</p>
      )}
      {action}
    </div>
  )
}

// Loading Overlay
export const LoadingOverlay: React.FC<{
  isVisible: boolean
  message?: string
  progress?: number
  onCancel?: () => void
}> = ({ isVisible, message = 'Processing...', progress, onCancel }) => {
  if (!isVisible) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl"
      >
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <div className="space-y-2">
            <p className="text-lg font-medium text-gray-900">{message}</p>
            
            {typeof progress === 'number' && (
              <div className="space-y-1">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    className="bg-blue-600 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            )}
          </div>
          
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default LoadingSpinner