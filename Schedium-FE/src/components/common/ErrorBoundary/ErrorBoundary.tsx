/**
 * ErrorBoundary Components - Comprehensive error handling and recovery
 * Advanced error boundaries with logging, retry mechanisms, and fallback UIs
 */

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { toast } from 'react-hot-toast'

// Error types and interfaces
interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string
  retryCount: number
  isRecoverable: boolean
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: (error: Error, errorInfo: ErrorInfo, retry: () => void) => ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo, errorId: string) => void
  enableRetry?: boolean
  maxRetries?: number
  isolate?: boolean
  level?: 'page' | 'section' | 'component'
  name?: string
  showErrorDetails?: boolean
  enableErrorReporting?: boolean
}

interface ErrorDetails {
  message: string
  stack?: string
  componentStack: string
  errorBoundary: string
  timestamp: number
  userAgent: string
  url: string
  userId?: string
  sessionId: string
  buildVersion?: string
}

// Error logging service
class ErrorLogger {
  private static instance: ErrorLogger
  private errorQueue: ErrorDetails[] = []
  private isOnline: boolean = navigator.onLine

  private constructor() {
    // Monitor online status
    window.addEventListener('online', () => {
      this.isOnline = true
      this.flushErrorQueue()
    })
    
    window.addEventListener('offline', () => {
      this.isOnline = false
    })
  }

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger()
    }
    return ErrorLogger.instance
  }

  async logError(error: Error, errorInfo: ErrorInfo, context: {
    errorBoundary: string
    level: string
    errorId: string
  }) {
    const errorDetails: ErrorDetails = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack || '',
      errorBoundary: context.errorBoundary,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: this.getSessionId(),
      buildVersion: process.env.REACT_APP_VERSION
    }

    // Add to queue
    this.errorQueue.push(errorDetails)

    // Try to send immediately if online
    if (this.isOnline) {
      await this.flushErrorQueue()
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error Boundary: ${context.errorBoundary}`)
      console.error('Error:', error)
      console.error('Error Info:', errorInfo)
      console.error('Context:', context)
      console.groupEnd()
    }
  }

  private async flushErrorQueue() {
    if (this.errorQueue.length === 0) return

    const errorsToSend = [...this.errorQueue]
    this.errorQueue = []

    try {
      await fetch('/api/v1/errors/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          errors: errorsToSend,
          timestamp: Date.now()
        })
      })
    } catch (error) {
      // Re-queue errors if sending failed
      this.errorQueue.unshift(...errorsToSend)
      console.warn('Failed to send error reports:', error)
    }
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('error-session-id')
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('error-session-id', sessionId)
    }
    return sessionId
  }
}

// Main Error Boundary Component
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeouts: NodeJS.Timeout[] = []
  private errorLogger = ErrorLogger.getInstance()

  constructor(props: ErrorBoundaryProps) {
    super(props)
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0,
      isRecoverable: true
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      isRecoverable: ErrorBoundary.isRecoverableError(error)
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo })

    // Log error
    if (this.props.enableErrorReporting !== false) {
      this.errorLogger.logError(error, errorInfo, {
        errorBoundary: this.props.name || 'UnnamedBoundary',
        level: this.props.level || 'component',
        errorId: this.state.errorId
      })
    }

    // Call custom error handler
    this.props.onError?.(error, errorInfo, this.state.errorId)

    // Show toast notification for critical errors
    if (this.props.level === 'page') {
      toast.error('Ha ocurrido un error inesperado. El equipo técnico ha sido notificado.')
    }
  }

  private static isRecoverableError(error: Error): boolean {
    // Define which errors are recoverable
    const recoverablePatterns = [
      /ChunkLoadError/i,
      /Loading chunk \d+ failed/i,
      /NetworkError/i,
      /Failed to fetch/i
    ]

    return recoverablePatterns.some(pattern => 
      pattern.test(error.message) || pattern.test(error.name)
    )
  }

  public handleRetry = () => {
    const { maxRetries = 3 } = this.props
    
    if (this.state.retryCount >= maxRetries) {
      toast.error('Máximo número de reintentos alcanzado')
      return
    }

    // Clear any existing timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout))
    this.retryTimeouts = []

    // Exponential backoff for retries
    const retryDelay = Math.min(1000 * Math.pow(2, this.state.retryCount), 10000)
    
    const timeout = setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: '',
        retryCount: prevState.retryCount + 1,
        isRecoverable: true
      }))
      
      toast.success('Reintentando...')
    }, retryDelay)

    this.retryTimeouts.push(timeout)
    toast.loading(`Reintentando en ${retryDelay / 1000} segundos...`)
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleGoHome = () => {
    window.location.href = '/'
  }

  componentWillUnmount() {
    // Clean up timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout))
  }

  render() {
    if (this.state.hasError && this.state.error && this.state.errorInfo) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.state.errorInfo, this.handleRetry)
      }

      // Default fallback UI based on error level
      return this.renderDefaultFallback()
    }

    return this.props.children
  }

  private renderDefaultFallback() {
    const { level = 'component', enableRetry = true, maxRetries = 3, showErrorDetails = false } = this.props
    const { error, retryCount, isRecoverable } = this.state

    // Page-level error
    if (level === 'page') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8 text-center">
            <div>
              <div className="text-6xl mb-4">💥</div>
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                ¡Oops! Algo salió mal
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Ha ocurrido un error inesperado. Nuestro equipo técnico ha sido notificado.
              </p>
            </div>

            {showErrorDetails && error && (
              <details className="text-left bg-red-50 p-4 rounded-lg border border-red-200">
                <summary className="font-medium text-red-800 cursor-pointer">
                  Detalles técnicos
                </summary>
                <div className="mt-2 text-sm text-red-700 font-mono">
                  <div><strong>Error:</strong> {error.message}</div>
                  <div><strong>ID:</strong> {this.state.errorId}</div>
                </div>
              </details>
            )}

            <div className="flex flex-col space-y-3">
              {enableRetry && isRecoverable && retryCount < maxRetries && (
                <button
                  onClick={this.handleRetry}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  🔄 Reintentar ({maxRetries - retryCount} intentos restantes)
                </button>
              )}
              
              <button
                onClick={this.handleReload}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                🔃 Recargar página
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                🏠 Ir al inicio
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Error ID: {this.state.errorId}
            </p>
          </div>
        </div>
      )
    }

    // Section-level error
    if (level === 'section') {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 m-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">
                Error en esta sección
              </h3>
              <p className="mt-1 text-sm text-red-700">
                {error?.message || 'Ha ocurrido un error inesperado en esta sección.'}
              </p>
              
              {enableRetry && isRecoverable && retryCount < maxRetries && (
                <button
                  onClick={this.handleRetry}
                  className="mt-3 text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200 transition-colors"
                >
                  🔄 Reintentar
                </button>
              )}
            </div>
          </div>
        </div>
      )
    }

    // Component-level error
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded p-4 m-2">
        <div className="flex items-center text-sm">
          <span className="text-yellow-600 mr-2">⚠️</span>
          <span className="text-yellow-800">
            Error del componente
            {enableRetry && isRecoverable && retryCount < maxRetries && (
              <button
                onClick={this.handleRetry}
                className="ml-2 underline hover:no-underline"
              >
                Reintentar
              </button>
            )}
          </span>
        </div>
      </div>
    )
  }
}

// Specialized Error Boundaries

// Async Boundary for handling async component errors
export class AsyncErrorBoundary extends ErrorBoundary {
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="text-4xl mb-4">🔄</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Error de carga
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              No se pudo cargar este componente
            </p>
            <button
              onClick={this.handleRetry}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Intentar de nuevo
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Network Error Boundary for API-related errors
export class NetworkErrorBoundary extends ErrorBoundary {
  render() {
    if (this.state.hasError) {
      const isNetworkError = this.state.error?.message.includes('fetch') ||
                            this.state.error?.message.includes('network') ||
                            this.state.error?.name === 'NetworkError'

      if (isNetworkError) {
        return (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
            <div className="flex items-center">
              <span className="text-2xl mr-3">📡</span>
              <div>
                <h3 className="text-lg font-medium text-orange-800">
                  Problema de conexión
                </h3>
                <p className="text-sm text-orange-700 mt-1">
                  Verifica tu conexión a internet e intenta nuevamente
                </p>
                <button
                  onClick={this.handleRetry}
                  className="mt-3 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                >
                  🔄 Reconectar
                </button>
              </div>
            </div>
          </div>
        )
      }
    }

    return super.render()
  }
}

// HOC for wrapping components with error boundaries
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Partial<ErrorBoundaryProps>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

// Hook for error boundary context
export const useErrorHandler = () => {
  const handleError = React.useCallback((error: Error, errorInfo?: string) => {
    // Throw error to be caught by nearest error boundary
    throw Object.assign(error, { errorInfo })
  }, [])

  const handleAsyncError = React.useCallback((error: Error) => {
    // For async errors, we need to trigger a re-render to throw the error
    React.startTransition(() => {
      throw error
    })
  }, [])

  return { handleError, handleAsyncError }
}

// Error reporting utilities
export const reportError = (error: Error, _context?: Record<string, any>) => {
  const errorLogger = ErrorLogger.getInstance()
  
  const errorInfo: ErrorInfo = {
    componentStack: new Error().stack || ''
  }

  errorLogger.logError(error, errorInfo, {
    errorBoundary: 'Manual Report',
    level: 'manual',
    errorId: `manual-${Date.now()}`
  })
}

export default ErrorBoundary