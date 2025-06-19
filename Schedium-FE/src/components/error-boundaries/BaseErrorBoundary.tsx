/**
 * Base Error Boundary Component
 * Professional error handling for React components
 */

import { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/design-system/components'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
  errorId?: string
}

interface BaseErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  level?: 'page' | 'feature' | 'component'
  moduleName?: string
}

/**
 * Base Error Boundary with comprehensive error handling
 */
export class BaseErrorBoundary extends Component<
  BaseErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: BaseErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Generate unique error ID for tracking
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    return {
      hasError: true,
      error,
      errorId
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, moduleName } = this.props
    const errorId = this.state.errorId

    // Log error details
    console.group(`🚨 Error Boundary Caught Error - ${moduleName || 'Unknown Module'}`)
    console.error('Error ID:', errorId)
    console.error('Error:', error)
    console.error('Component Stack:', errorInfo.componentStack)
    console.error('Error Boundary Props:', this.props)
    console.groupEnd()

    // Update state with error info
    this.setState({
      errorInfo
    })

    // Call custom error handler
    if (onError) {
      onError(error, errorInfo)
    }

    // Report to error tracking service in production
    if (process.env.NODE_ENV === 'production' && errorId) {
      this.reportError(error, errorInfo, errorId)
    }
  }

  private reportError = (error: Error, errorInfo: ErrorInfo, errorId: string) => {
    // In a real application, you would send this to your error tracking service
    // like Sentry, Bugsnag, or custom logging service
    const errorReport = {
      errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      moduleName: this.props.moduleName,
      level: this.props.level || 'component'
    }

    // Example: Send to monitoring service
    // errorTrackingService.captureException(errorReport)
    console.log('Error Report Generated:', errorReport)
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: undefined
    })
  }

  private handleReload = () => {
    window.location.reload()
  }

  private goToHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI based on level
      return this.renderErrorUI()
    }

    return this.props.children
  }

  private renderErrorUI() {
    const { level = 'component', moduleName } = this.props
    const { error, errorId } = this.state

    const isDevelopment = process.env.NODE_ENV === 'development'

    if (level === 'page') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900 rounded-full mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 text-center mb-2">
              Error en la Página
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.
            </p>
            {isDevelopment && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-800 dark:text-red-300 font-mono">
                  {error?.message}
                </p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  Error ID: {errorId}
                </p>
              </div>
            )}
            <div className="flex gap-3">
              <Button
                onClick={this.handleRetry}
                variant="primary"
                className="flex-1"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reintentar
              </Button>
              <Button
                onClick={this.goToHome}
                variant="outline"
                className="flex-1"
              >
                <Home className="w-4 h-4 mr-2" />
                Inicio
              </Button>
            </div>
          </div>
        </div>
      )
    }

    if (level === 'feature') {
      return (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-5 h-5 text-orange-500 mr-2" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Error en {moduleName || 'Módulo'}
            </h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No se pudo cargar este módulo. Inténtalo de nuevo o contacta al soporte técnico.
          </p>
          {isDevelopment && (
            <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded border border-orange-200 dark:border-orange-800">
              <p className="text-sm text-orange-800 dark:text-orange-300 font-mono">
                {error?.message}
              </p>
            </div>
          )}
          <div className="flex gap-2">
            <Button
              onClick={this.handleRetry}
              variant="primary"
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
            <Button
              onClick={this.handleReload}
              variant="outline"
              size="sm"
            >
              Recargar Página
            </Button>
          </div>
        </div>
      )
    }

    // Component level error
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
        <div className="flex items-center">
          <AlertTriangle className="w-4 h-4 text-red-500 mr-2" />
          <span className="text-sm text-red-800 dark:text-red-300">
            Error en componente
          </span>
          <Button
            onClick={this.handleRetry}
            variant="ghost"
            size="sm"
            className="ml-auto text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>
        {isDevelopment && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-mono">
            {error?.message}
          </p>
        )}
      </div>
    )
  }
}