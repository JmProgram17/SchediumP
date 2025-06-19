/**
 * Unified error handling system with discriminated union types
 * Provides consistent error handling across the application
 */

import { AxiosError } from 'axios'
import { apiLogger } from './decorators'
import { SECURITY_CONFIG } from '@/config'

/**
 * Base error interface
 */
export interface BaseApiError {
  success: false
  timestamp: number
  requestId?: string
  correlationId?: string
}

/**
 * Network error (connection issues, timeouts)
 */
export interface NetworkError extends BaseApiError {
  type: 'NETWORK_ERROR'
  message: string
  details: {
    originalError: string
    timeout?: boolean
    offline?: boolean
  }
}

/**
 * Authentication error (401, token issues)
 */
export interface AuthenticationError extends BaseApiError {
  type: 'AUTHENTICATION_ERROR'
  message: string
  details: {
    tokenExpired?: boolean
    invalidCredentials?: boolean
    refreshFailed?: boolean
  }
}

/**
 * Authorization error (403, insufficient permissions)
 */
export interface AuthorizationError extends BaseApiError {
  type: 'AUTHORIZATION_ERROR'
  message: string
  details: {
    requiredRole?: string
    requiredPermission?: string
    currentRole?: string
  }
}

/**
 * Validation error (400, 422, invalid input)
 */
export interface ValidationError extends BaseApiError {
  type: 'VALIDATION_ERROR'
  message: string
  details: {
    field?: string
    value?: any
    constraint?: string
    validationErrors?: Record<string, string[]>
  }
}

/**
 * Business logic error (409, 422, domain-specific)
 */
export interface BusinessError extends BaseApiError {
  type: 'BUSINESS_ERROR'
  message: string
  details: {
    errorCode: string
    context?: Record<string, any>
  }
}

/**
 * Rate limiting error (429)
 */
export interface RateLimitError extends BaseApiError {
  type: 'RATE_LIMIT_ERROR'
  message: string
  details: {
    retryAfter: number
    limit: number
    remaining?: number
    resetTime?: number
  }
}

/**
 * Server error (5xx)
 */
export interface ServerError extends BaseApiError {
  type: 'SERVER_ERROR'
  message: string
  details: {
    statusCode: number
    statusText: string
    serverMessage?: string
    errorId?: string
  }
}

/**
 * Client error (unexpected errors, parsing issues)
 */
export interface ClientError extends BaseApiError {
  type: 'CLIENT_ERROR'
  message: string
  details: {
    originalError: string
    stack?: string
  }
}

/**
 * Timeout error (specific timeout handling)
 */
export interface TimeoutError extends BaseApiError {
  type: 'TIMEOUT_ERROR'
  message: string
  details: {
    timeout: number
    operation: string
  }
}

/**
 * Discriminated union of all possible API errors
 */
export type ApiError = 
  | NetworkError
  | AuthenticationError
  | AuthorizationError
  | ValidationError
  | BusinessError
  | RateLimitError
  | ServerError
  | ClientError
  | TimeoutError

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Error recovery strategies
 */
export enum RecoveryStrategy {
  NONE = 'none',
  RETRY = 'retry',
  REFRESH_TOKEN = 'refresh_token',
  REDIRECT_LOGIN = 'redirect_login',
  FALLBACK_CACHE = 'fallback_cache',
  USER_ACTION = 'user_action'
}

/**
 * Error context for enhanced debugging
 */
export interface ErrorContext {
  url?: string
  method?: string
  payload?: any
  headers?: Record<string, string>
  userAgent?: string
  timestamp: number
  userId?: string
  sessionId?: string
}

/**
 * Error recovery information
 */
export interface ErrorRecovery {
  strategy: RecoveryStrategy
  severity: ErrorSeverity
  retryable: boolean
  userMessage: string
  technicalMessage: string
  suggestedActions?: string[]
}

/**
 * Enhanced error with recovery information
 */
export interface EnhancedApiError extends ApiError {
  recovery: ErrorRecovery
  context: ErrorContext
}

/**
 * Error classification utility
 */
export class ErrorClassifier {
  /**
   * Get error severity based on type and context
   */
  static getSeverity(error: ApiError): ErrorSeverity {
    switch (error.type) {
      case 'NETWORK_ERROR':
        return ErrorSeverity.MEDIUM
      case 'AUTHENTICATION_ERROR':
        return ErrorSeverity.HIGH
      case 'AUTHORIZATION_ERROR':
        return ErrorSeverity.MEDIUM
      case 'VALIDATION_ERROR':
        return ErrorSeverity.LOW
      case 'BUSINESS_ERROR':
        return ErrorSeverity.MEDIUM
      case 'RATE_LIMIT_ERROR':
        return ErrorSeverity.LOW
      case 'SERVER_ERROR':
        return error.details.statusCode >= 500 ? ErrorSeverity.CRITICAL : ErrorSeverity.HIGH
      case 'CLIENT_ERROR':
        return ErrorSeverity.MEDIUM
      case 'TIMEOUT_ERROR':
        return ErrorSeverity.MEDIUM
      default:
        return ErrorSeverity.MEDIUM
    }
  }

  /**
   * Get recovery strategy for error
   */
  static getRecoveryStrategy(error: ApiError): RecoveryStrategy {
    switch (error.type) {
      case 'NETWORK_ERROR':
        return RecoveryStrategy.RETRY
      case 'AUTHENTICATION_ERROR':
        return error.details.tokenExpired ? RecoveryStrategy.REFRESH_TOKEN : RecoveryStrategy.REDIRECT_LOGIN
      case 'AUTHORIZATION_ERROR':
        return RecoveryStrategy.USER_ACTION
      case 'VALIDATION_ERROR':
        return RecoveryStrategy.USER_ACTION
      case 'BUSINESS_ERROR':
        return RecoveryStrategy.USER_ACTION
      case 'RATE_LIMIT_ERROR':
        return RecoveryStrategy.RETRY
      case 'SERVER_ERROR':
        return error.details.statusCode >= 500 ? RecoveryStrategy.RETRY : RecoveryStrategy.USER_ACTION
      case 'CLIENT_ERROR':
        return RecoveryStrategy.NONE
      case 'TIMEOUT_ERROR':
        return RecoveryStrategy.RETRY
      default:
        return RecoveryStrategy.NONE
    }
  }

  /**
   * Check if error is retryable
   */
  static isRetryable(error: ApiError): boolean {
    const retryableTypes: ApiError['type'][] = [
      'NETWORK_ERROR',
      'RATE_LIMIT_ERROR',
      'SERVER_ERROR',
      'TIMEOUT_ERROR'
    ]
    
    if (!retryableTypes.includes(error.type)) {
      return false
    }

    if (error.type === 'SERVER_ERROR') {
      return error.details.statusCode >= 500
    }

    return true
  }

  /**
   * Get user-friendly error message
   */
  static getUserMessage(error: ApiError): string {
    const userMessages: Record<ApiError['type'], string> = {
      NETWORK_ERROR: 'No se pudo conectar con el servidor. Verifique su conexión a internet.',
      AUTHENTICATION_ERROR: 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.',
      AUTHORIZATION_ERROR: 'No tiene permisos para realizar esta acción.',
      VALIDATION_ERROR: 'Los datos ingresados no son válidos. Por favor, verifique e intente nuevamente.',
      BUSINESS_ERROR: 'No se pudo completar la operación. Verifique los datos e intente nuevamente.',
      RATE_LIMIT_ERROR: 'Ha realizado demasiadas solicitudes. Espere un momento antes de intentar nuevamente.',
      SERVER_ERROR: 'Error interno del servidor. Por favor, intente nuevamente más tarde.',
      CLIENT_ERROR: 'Ha ocurrido un error inesperado. Recargue la página e intente nuevamente.',
      TIMEOUT_ERROR: 'La operación tardó demasiado tiempo. Por favor, intente nuevamente.'
    }

    return userMessages[error.type]
  }

  /**
   * Get suggested actions for user
   */
  static getSuggestedActions(error: ApiError): string[] {
    const actionMap: Record<ApiError['type'], string[]> = {
      NETWORK_ERROR: [
        'Verifique su conexión a internet',
        'Intente recargar la página',
        'Contacte soporte si el problema persiste'
      ],
      AUTHENTICATION_ERROR: [
        'Inicie sesión nuevamente',
        'Verifique sus credenciales',
        'Contacte al administrador si continúa el problema'
      ],
      AUTHORIZATION_ERROR: [
        'Contacte al administrador para solicitar permisos',
        'Verifique que está usando la cuenta correcta'
      ],
      VALIDATION_ERROR: [
        'Revise los campos marcados en rojo',
        'Asegúrese de completar todos los campos obligatorios',
        'Verifique el formato de los datos ingresados'
      ],
      BUSINESS_ERROR: [
        'Verifique que los datos cumplan las reglas de negocio',
        'Contacte soporte si necesita ayuda'
      ],
      RATE_LIMIT_ERROR: [
        `Espere ${error.type === 'RATE_LIMIT_ERROR' ? error.details.retryAfter : 60} segundos antes de intentar nuevamente`,
        'Reduzca la frecuencia de sus solicitudes'
      ],
      SERVER_ERROR: [
        'Intente nuevamente en unos minutos',
        'Contacte soporte si el problema persiste',
        'Guarde su trabajo localmente si es posible'
      ],
      CLIENT_ERROR: [
        'Recargue la página',
        'Borre la caché del navegador',
        'Intente con un navegador diferente'
      ],
      TIMEOUT_ERROR: [
        'Intente nuevamente',
        'Verifique su conexión a internet',
        'Intente con una operación más pequeña'
      ]
    }

    return actionMap[error.type] || ['Contacte soporte técnico']
  }
}

/**
 * Main error handler class
 */
export class ApiErrorHandler {
  private static errorReports = new Map<string, number>()
  private static errorListeners = new Set<(error: EnhancedApiError) => void>()

  /**
   * Convert AxiosError to typed ApiError
   */
  static fromAxiosError(axiosError: AxiosError, context: Partial<ErrorContext> = {}): ApiError {
    const baseError: Omit<BaseApiError, 'type'> = {
      success: false,
      timestamp: Date.now(),
      requestId: context.headers?.['X-Request-ID'],
      correlationId: context.headers?.['X-Correlation-ID']
    }

    // Network error (no response)
    if (!axiosError.response) {
      if (axiosError.code === 'ECONNABORTED') {
        return {
          ...baseError,
          type: 'TIMEOUT_ERROR',
          message: 'Request timeout',
          details: {
            timeout: SECURITY_CONFIG.API.REQUEST_TIMEOUT,
            operation: context.method || 'unknown'
          }
        }
      }

      return {
        ...baseError,
        type: 'NETWORK_ERROR',
        message: 'Network error',
        details: {
          originalError: axiosError.message,
          timeout: axiosError.code === 'ECONNABORTED',
          offline: !navigator.onLine
        }
      }
    }

    const { status, data } = axiosError.response
    
    // Use backend error data if available
    if (data && typeof data === 'object') {
      const backendError = data as any
      
      if (backendError.error_code) {
        return this.fromBackendError(backendError, baseError)
      }
    }

    // Classify by HTTP status code
    return this.fromHttpStatus(status, axiosError, baseError)
  }

  /**
   * Convert backend error response to typed error
   */
  private static fromBackendError(backendError: any, baseError: Omit<BaseApiError, 'type'>): ApiError {
    const errorCode = backendError.error_code?.toUpperCase()
    
    // Map backend error codes to our error types
    if (errorCode?.includes('AUTH') || errorCode?.includes('TOKEN')) {
      return {
        ...baseError,
        type: 'AUTHENTICATION_ERROR',
        message: backendError.message || 'Authentication failed',
        details: {
          tokenExpired: errorCode.includes('EXPIRED'),
          invalidCredentials: errorCode.includes('INVALID'),
          refreshFailed: errorCode.includes('REFRESH')
        }
      }
    }

    if (errorCode?.includes('PERMISSION') || errorCode?.includes('FORBIDDEN')) {
      return {
        ...baseError,
        type: 'AUTHORIZATION_ERROR',
        message: backendError.message || 'Access denied',
        details: {
          requiredRole: backendError.details?.required_role,
          requiredPermission: backendError.details?.required_permission,
          currentRole: backendError.details?.current_role
        }
      }
    }

    if (errorCode?.includes('VALIDATION') || errorCode?.includes('INVALID')) {
      return {
        ...baseError,
        type: 'VALIDATION_ERROR',
        message: backendError.message || 'Validation failed',
        details: {
          field: backendError.details?.field,
          value: backendError.details?.value,
          constraint: backendError.details?.constraint,
          validationErrors: backendError.details?.validation_errors
        }
      }
    }

    if (errorCode?.includes('RATE_LIMIT')) {
      return {
        ...baseError,
        type: 'RATE_LIMIT_ERROR',
        message: backendError.message || 'Rate limit exceeded',
        details: {
          retryAfter: backendError.details?.retry_after || 60,
          limit: backendError.details?.limit || 0,
          remaining: backendError.details?.remaining,
          resetTime: backendError.details?.reset_time
        }
      }
    }

    // Default to business error for known backend error codes
    return {
      ...baseError,
      type: 'BUSINESS_ERROR',
      message: backendError.message || 'Business rule violation',
      details: {
        errorCode: backendError.error_code,
        context: backendError.details
      }
    }
  }

  /**
   * Convert HTTP status to typed error
   */
  private static fromHttpStatus(status: number, axiosError: AxiosError, baseError: Omit<BaseApiError, 'type'>): ApiError {
    if (status === 401) {
      return {
        ...baseError,
        type: 'AUTHENTICATION_ERROR',
        message: 'Authentication required',
        details: {
          tokenExpired: true
        }
      }
    }

    if (status === 403) {
      return {
        ...baseError,
        type: 'AUTHORIZATION_ERROR',
        message: 'Access forbidden',
        details: {}
      }
    }

    if (status === 400 || status === 422) {
      return {
        ...baseError,
        type: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: {
          validationErrors: axiosError.response?.data?.errors
        }
      }
    }

    if (status === 429) {
      const retryAfter = parseInt(axiosError.response?.headers['retry-after'] || '60')
      return {
        ...baseError,
        type: 'RATE_LIMIT_ERROR',
        message: 'Rate limit exceeded',
        details: {
          retryAfter,
          limit: 0
        }
      }
    }

    if (status >= 500) {
      return {
        ...baseError,
        type: 'SERVER_ERROR',
        message: 'Server error',
        details: {
          statusCode: status,
          statusText: axiosError.response?.statusText || 'Unknown',
          serverMessage: axiosError.response?.data?.message
        }
      }
    }

    // Default client error
    return {
      ...baseError,
      type: 'CLIENT_ERROR',
      message: 'Client error',
      details: {
        originalError: axiosError.message,
        stack: SECURITY_CONFIG.ENVIRONMENT.isDevelopment ? axiosError.stack : undefined
      }
    }
  }

  /**
   * Enhance error with recovery information
   */
  static enhance(error: ApiError, context: Partial<ErrorContext> = {}): EnhancedApiError {
    const fullContext: ErrorContext = {
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      ...context
    }

    const recovery: ErrorRecovery = {
      strategy: ErrorClassifier.getRecoveryStrategy(error),
      severity: ErrorClassifier.getSeverity(error),
      retryable: ErrorClassifier.isRetryable(error),
      userMessage: ErrorClassifier.getUserMessage(error),
      technicalMessage: error.message,
      suggestedActions: ErrorClassifier.getSuggestedActions(error)
    }

    return {
      ...error,
      recovery,
      context: fullContext
    }
  }

  /**
   * Handle error with logging and reporting
   */
  static handle(error: ApiError | AxiosError, context: Partial<ErrorContext> = {}): EnhancedApiError {
    // Convert AxiosError to ApiError if needed
    const apiError = 'response' in error ? this.fromAxiosError(error, context) : error

    // Enhance with recovery information
    const enhancedError = this.enhance(apiError, context)

    // Log error
    this.logError(enhancedError)

    // Report error for monitoring
    this.reportError(enhancedError)

    // Notify listeners
    this.notifyListeners(enhancedError)

    return enhancedError
  }

  /**
   * Log error with appropriate level
   */
  private static logError(error: EnhancedApiError): void {
    const { recovery, context } = error
    
    const logData = {
      type: error.type,
      message: error.message,
      severity: recovery.severity,
      url: context.url,
      method: context.method,
      userId: context.userId,
      requestId: error.requestId
    }

    switch (recovery.severity) {
      case ErrorSeverity.LOW:
        apiLogger.debug('API Error (Low)', logData)
        break
      case ErrorSeverity.MEDIUM:
        apiLogger.info('API Error (Medium)', logData)
        break
      case ErrorSeverity.HIGH:
        apiLogger.warn('API Error (High)', logData)
        break
      case ErrorSeverity.CRITICAL:
        apiLogger.error('API Error (Critical)', error, logData)
        break
    }
  }

  /**
   * Report error for monitoring
   */
  private static reportError(error: EnhancedApiError): void {
    const errorKey = `${error.type}:${error.context.url}:${error.context.method}`
    const count = this.errorReports.get(errorKey) || 0
    this.errorReports.set(errorKey, count + 1)

    // In production, send to error monitoring service
    if (SECURITY_CONFIG.ENVIRONMENT.isProduction) {
      // TODO: Integrate with Sentry or similar service
      console.error('[ERROR REPORTING]', {
        type: error.type,
        message: error.message,
        context: error.context,
        count: count + 1
      })
    }
  }

  /**
   * Add error listener
   */
  static addErrorListener(listener: (error: EnhancedApiError) => void): void {
    this.errorListeners.add(listener)
  }

  /**
   * Remove error listener
   */
  static removeErrorListener(listener: (error: EnhancedApiError) => void): void {
    this.errorListeners.delete(listener)
  }

  /**
   * Notify all listeners
   */
  private static notifyListeners(error: EnhancedApiError): void {
    this.errorListeners.forEach(listener => {
      try {
        listener(error)
      } catch (err) {
        console.error('Error in error listener:', err)
      }
    })
  }

  /**
   * Get error statistics
   */
  static getErrorStats(): Record<string, number> {
    return Object.fromEntries(this.errorReports)
  }

  /**
   * Clear error statistics
   */
  static clearErrorStats(): void {
    this.errorReports.clear()
  }
}

// Type guards for error types
export const isNetworkError = (error: ApiError): error is NetworkError => error.type === 'NETWORK_ERROR'
export const isAuthenticationError = (error: ApiError): error is AuthenticationError => error.type === 'AUTHENTICATION_ERROR'
export const isAuthorizationError = (error: ApiError): error is AuthorizationError => error.type === 'AUTHORIZATION_ERROR'
export const isValidationError = (error: ApiError): error is ValidationError => error.type === 'VALIDATION_ERROR'
export const isBusinessError = (error: ApiError): error is BusinessError => error.type === 'BUSINESS_ERROR'
export const isRateLimitError = (error: ApiError): error is RateLimitError => error.type === 'RATE_LIMIT_ERROR'
export const isServerError = (error: ApiError): error is ServerError => error.type === 'SERVER_ERROR'
export const isClientError = (error: ApiError): error is ClientError => error.type === 'CLIENT_ERROR'
export const isTimeoutError = (error: ApiError): error is TimeoutError => error.type === 'TIMEOUT_ERROR'