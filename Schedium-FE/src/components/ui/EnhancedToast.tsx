/**
 * Enhanced Toast Component - Advanced notification system
 * Rich toast notifications with actions, progress, and animations
 */

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  X, 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  RefreshCw,
  Copy,
  Undo,
  Download,
  Upload
} from 'lucide-react'
import { toast as hotToast, Toast } from 'react-hot-toast'

interface EnhancedToastProps {
  toast: Toast
  onDismiss: (id: string) => void
}

interface ToastAction {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'danger'
  icon?: React.ComponentType<{ className?: string }>
}

interface CustomToastData {
  title?: string
  description?: string
  actions?: ToastAction[]
  progress?: number
  showProgress?: boolean
  persistent?: boolean
  variant?: 'success' | 'error' | 'warning' | 'info' | 'loading'
  icon?: React.ComponentType<{ className?: string }>
  undoAction?: () => void
  undoLabel?: string
}

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  loading: RefreshCw
}

const colorMap = {
  success: {
    bg: 'bg-green-50 border-green-200',
    icon: 'text-green-500',
    text: 'text-green-800',
    button: 'text-green-600 hover:text-green-800'
  },
  error: {
    bg: 'bg-red-50 border-red-200',
    icon: 'text-red-500',
    text: 'text-red-800',
    button: 'text-red-600 hover:text-red-800'
  },
  warning: {
    bg: 'bg-yellow-50 border-yellow-200',
    icon: 'text-yellow-500',
    text: 'text-yellow-800',
    button: 'text-yellow-600 hover:text-yellow-800'
  },
  info: {
    bg: 'bg-blue-50 border-blue-200',
    icon: 'text-blue-500',
    text: 'text-blue-800',
    button: 'text-blue-600 hover:text-blue-800'
  },
  loading: {
    bg: 'bg-gray-50 border-gray-200',
    icon: 'text-gray-500',
    text: 'text-gray-800',
    button: 'text-gray-600 hover:text-gray-800'
  }
}

export const EnhancedToast: React.FC<EnhancedToastProps> = ({ toast, onDismiss }) => {
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const data = toast.message as any as CustomToastData
  
  const isCustomData = typeof data === 'object' && data !== null && !React.isValidElement(data)
  const variant = isCustomData ? data.variant || 'info' : 'info'
  const colors = colorMap[variant]
  const Icon = isCustomData && data.icon ? data.icon : iconMap[variant]

  // Auto-dismiss timer for non-persistent toasts
  useEffect(() => {
    if (isCustomData && data.persistent) return

    const duration = toast.duration || 4000
    const startTime = Date.now()

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, duration - elapsed)
      
      if (remaining === 0) {
        onDismiss(toast.id)
        clearInterval(timer)
      } else {
        setTimeLeft(remaining)
      }
    }, 100)

    return () => clearInterval(timer)
  }, [toast.id, toast.duration, data, isCustomData, onDismiss])

  const handleAction = (action: ToastAction) => {
    action.onClick()
    if (!isCustomData || !data.persistent) {
      onDismiss(toast.id)
    }
  }

  const renderSimpleToast = () => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      className={`
        max-w-md w-full rounded-lg border p-4 shadow-lg
        ${colors.bg} ${colors.text}
      `}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <Icon className={`h-5 w-5 ${colors.icon} ${variant === 'loading' ? 'animate-spin' : ''}`} />
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium">
            {React.isValidElement(data) ? data : String(data)}
          </p>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            onClick={() => onDismiss(toast.id)}
            className={`inline-flex rounded-md ${colors.button} hover:bg-white hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-offset-2`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  )

  if (!isCustomData) {
    return renderSimpleToast()
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      className={`
        max-w-md w-full rounded-lg border shadow-lg overflow-hidden
        ${colors.bg}
      `}
    >
      {/* Progress bar */}
      {data.showProgress && typeof data.progress === 'number' && (
        <div className="h-1 bg-white bg-opacity-30">
          <motion.div
            className="h-full bg-current opacity-60"
            initial={{ width: 0 }}
            animate={{ width: `${data.progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}

      {/* Auto-dismiss progress */}
      {!data.persistent && timeLeft && (
        <div className="h-1 bg-white bg-opacity-30">
          <motion.div
            className="h-full bg-current opacity-40"
            animate={{ width: `${(timeLeft / (toast.duration || 4000)) * 100}%` }}
            transition={{ duration: 0.1, ease: 'linear' }}
          />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Icon className={`h-5 w-5 ${colors.icon} ${variant === 'loading' ? 'animate-spin' : ''}`} />
          </div>
          
          <div className="ml-3 flex-1">
            {data.title && (
              <h4 className={`text-sm font-medium ${colors.text}`}>
                {data.title}
              </h4>
            )}
            
            {data.description && (
              <p className={`text-sm ${data.title ? 'mt-1' : ''} ${colors.text} opacity-90`}>
                {data.description}
              </p>
            )}

            {/* Progress text */}
            {data.showProgress && typeof data.progress === 'number' && (
              <p className={`text-xs mt-2 ${colors.text} opacity-75`}>
                {Math.round(data.progress)}% complete
              </p>
            )}
          </div>

          {!data.persistent && (
            <div className="ml-4 flex-shrink-0">
              <button
                onClick={() => onDismiss(toast.id)}
                className={`inline-flex rounded-md p-1 ${colors.button} hover:bg-white hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-offset-2`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        {(data.actions || data.undoAction) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {data.undoAction && (
              <button
                onClick={() => {
                  data.undoAction!()
                  onDismiss(toast.id)
                }}
                className={`
                  inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md
                  ${colors.button} hover:bg-white hover:bg-opacity-20 transition-colors
                `}
              >
                <Undo className="w-3 h-3" />
                {data.undoLabel || 'Undo'}
              </button>
            )}

            {data.actions?.map((action, index) => {
              const ActionIcon = action.icon
              const buttonVariant = action.variant || 'secondary'
              
              const buttonClasses = {
                primary: 'bg-white bg-opacity-20 hover:bg-opacity-30 text-current',
                secondary: `${colors.button} hover:bg-white hover:bg-opacity-20`,
                danger: 'bg-red-500 hover:bg-red-600 text-white'
              }
              
              return (
                <button
                  key={index}
                  onClick={() => handleAction(action)}
                  className={`
                    inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md
                    transition-colors ${buttonClasses[buttonVariant]}
                  `}
                >
                  {ActionIcon && <ActionIcon className="w-3 h-3" />}
                  {action.label}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </motion.div>
  )
}

// Enhanced toast utilities
export const enhancedToast = {
  success: (_data: string | CustomToastData) => {
    return hotToast.custom((t) => <EnhancedToast toast={t} onDismiss={hotToast.dismiss} />, {
      duration: 4000,
      id: `success-${Date.now()}`
    })
  },

  error: (_data: string | CustomToastData) => {
    return hotToast.custom((t) => <EnhancedToast toast={t} onDismiss={hotToast.dismiss} />, {
      duration: 6000,
      id: `error-${Date.now()}`
    })
  },

  warning: (_data: string | CustomToastData) => {
    return hotToast.custom((t) => <EnhancedToast toast={t} onDismiss={hotToast.dismiss} />, {
      duration: 5000,
      id: `warning-${Date.now()}`
    })
  },

  info: (_data: string | CustomToastData) => {
    return hotToast.custom((t) => <EnhancedToast toast={t} onDismiss={hotToast.dismiss} />, {
      duration: 4000,
      id: `info-${Date.now()}`
    })
  },

  loading: (_data: string | CustomToastData) => {
    return hotToast.custom((t) => <EnhancedToast toast={t} onDismiss={hotToast.dismiss} />, {
      duration: Infinity,
      id: `loading-${Date.now()}`
    })
  },

  // Specialized toasts
  promise: <T,>(
    promise: Promise<T>,
    options: {
      loading: string | CustomToastData
      success: string | ((data: T) => string | CustomToastData)
      error: string | ((error: any) => string | CustomToastData)
    }
  ) => {
    const loadingToast = enhancedToast.loading(options.loading)
    
    return promise
      .then((data) => {
        hotToast.dismiss(loadingToast)
        const successData = typeof options.success === 'function' ? options.success(data) : options.success
        enhancedToast.success(successData)
        return data
      })
      .catch((error) => {
        hotToast.dismiss(loadingToast)
        const errorData = typeof options.error === 'function' ? options.error(error) : options.error
        enhancedToast.error(errorData)
        throw error
      })
  },

  progress: (initialData: CustomToastData & { progress: number }) => {
    const toastId = hotToast.custom((t) => <EnhancedToast toast={t} onDismiss={hotToast.dismiss} />, {
      duration: Infinity,
      id: `progress-${Date.now()}`
    })

    return {
      update: (progress: number, data?: Partial<CustomToastData>) => {
        // Note: This would require custom toast state management
        // For now, we'll create a new toast
        hotToast.dismiss(toastId)
        return enhancedToast.loading({
          ...initialData,
          ...data,
          progress,
          showProgress: true
        })
      },
      complete: (data?: CustomToastData) => {
        hotToast.dismiss(toastId)
        enhancedToast.success(data || { title: 'Completed successfully' })
      },
      error: (data?: CustomToastData) => {
        hotToast.dismiss(toastId)
        enhancedToast.error(data || { title: 'Operation failed' })
      }
    }
  },

  undo: (message: string, undoAction: () => void, undoLabel = 'Undo') => {
    return enhancedToast.info({
      title: message,
      undoAction,
      undoLabel,
      persistent: false
    })
  },

  // Quick action toasts
  copy: (text?: string) => {
    enhancedToast.success({
      title: 'Copied to clipboard',
      description: text ? `${text.substring(0, 30)}${text.length > 30 ? '...' : ''}` : undefined,
      icon: Copy
    })
  },

  download: (filename?: string) => {
    enhancedToast.success({
      title: 'Download started',
      description: filename ? `Downloading ${filename}` : undefined,
      icon: Download
    })
  },

  upload: (filename?: string) => {
    enhancedToast.success({
      title: 'Upload completed',
      description: filename ? `${filename} uploaded successfully` : undefined,
      icon: Upload
    })
  }
}

export default EnhancedToast