/**
 * FASE 5: Mapeo de Errores Backend <-> Frontend
 * 
 * Sistema centralizado para mapear códigos de error del backend
 * a mensajes comprensibles para el usuario y acciones de recuperación
 */

import { logger } from './logger.service'

// ===== ERROR TYPES =====

export interface BackendError {
  error_code: string
  message: string
  details?: Record<string, any>
  field_errors?: Record<string, string[]>
  status_code: number
  request_id?: string
  timestamp?: string
}

export interface FrontendError {
  code: string
  userMessage: string
  technicalMessage: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: 'validation' | 'authentication' | 'authorization' | 'network' | 'server' | 'business' | 'unknown'
  recoverable: boolean
  recovery?: {
    action: 'retry' | 'refresh' | 'login' | 'contact_support' | 'navigate' | 'custom'
    buttonText: string
    actionData?: any
    userMessage?: string
  }
  context?: Record<string, any>
}

export interface ErrorMappingRule {
  backendCode: string | RegExp
  statusCode?: number | number[]
  frontendError: Omit<FrontendError, 'code' | 'context'>
  condition?: (error: BackendError) => boolean
}

// ===== ERROR MAPPING RULES =====

const ERROR_MAPPING_RULES: ErrorMappingRule[] = [
  // ===== AUTHENTICATION ERRORS =====
  {
    backendCode: 'AUTH_TOKEN_INVALID',
    statusCode: 401,
    frontendError: {
      userMessage: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
      technicalMessage: 'JWT token is invalid or expired',
      severity: 'high',
      category: 'authentication',
      recoverable: true,
      recovery: {
        action: 'login',
        buttonText: 'Iniciar Sesión',
        userMessage: 'Serás redirigido a la página de inicio de sesión'
      }
    }
  },
  {
    backendCode: 'AUTH_TOKEN_EXPIRED',
    statusCode: 401,
    frontendError: {
      userMessage: 'Tu sesión ha expirado. Iniciando sesión automáticamente...',
      technicalMessage: 'JWT token expired, attempting refresh',
      severity: 'medium',
      category: 'authentication',
      recoverable: true,
      recovery: {
        action: 'refresh',
        buttonText: 'Refrescar Sesión',
        userMessage: 'Intentando renovar tu sesión automáticamente'
      }
    }
  },
  {
    backendCode: 'AUTH_CREDENTIALS_INVALID',
    statusCode: 401,
    frontendError: {
      userMessage: 'Email o contraseña incorrectos. Verifica tus credenciales.',
      technicalMessage: 'Invalid login credentials provided',
      severity: 'medium',
      category: 'authentication',
      recoverable: true,
      recovery: {
        action: 'retry',
        buttonText: 'Intentar Nuevamente',
        userMessage: 'Verifica tu email y contraseña'
      }
    }
  },

  // ===== AUTHORIZATION ERRORS =====
  {
    backendCode: 'AUTH_INSUFFICIENT_PERMISSIONS',
    statusCode: 403,
    frontendError: {
      userMessage: 'No tienes permisos para realizar esta acción.',
      technicalMessage: 'User lacks required permissions for this operation',
      severity: 'medium',
      category: 'authorization',
      recoverable: false,
      recovery: {
        action: 'contact_support',
        buttonText: 'Contactar Soporte',
        userMessage: 'Si crees que deberías tener acceso, contacta al administrador'
      }
    }
  },
  {
    backendCode: /^AUTH_ROLE_REQUIRED_(.+)$/,
    statusCode: 403,
    frontendError: {
      userMessage: 'Tu rol actual no permite esta operación.',
      technicalMessage: 'Operation requires specific role',
      severity: 'medium',
      category: 'authorization',
      recoverable: false,
      recovery: {
        action: 'navigate',
        buttonText: 'Ir al Dashboard',
        actionData: { path: '/dashboard' },
        userMessage: 'Serás redirigido a una página accesible'
      }
    }
  },

  // ===== VALIDATION ERRORS =====
  {
    backendCode: 'VALIDATION_FIELD_REQUIRED',
    statusCode: 422,
    frontendError: {
      userMessage: 'Algunos campos obligatorios están vacíos.',
      technicalMessage: 'Required field validation failed',
      severity: 'low',
      category: 'validation',
      recoverable: true,
      recovery: {
        action: 'retry',
        buttonText: 'Corregir',
        userMessage: 'Completa los campos marcados en rojo'
      }
    }
  },
  {
    backendCode: 'VALIDATION_EMAIL_INVALID',
    statusCode: 422,
    frontendError: {
      userMessage: 'El formato del email no es válido.',
      technicalMessage: 'Email format validation failed',
      severity: 'low',
      category: 'validation',
      recoverable: true,
      recovery: {
        action: 'retry',
        buttonText: 'Corregir',
        userMessage: 'Ingresa un email válido (ejemplo@dominio.com)'
      }
    }
  },
  {
    backendCode: 'VALIDATION_DUPLICATE_ENTRY',
    statusCode: 422,
    frontendError: {
      userMessage: 'Ya existe un registro con esta información.',
      technicalMessage: 'Duplicate entry constraint violation',
      severity: 'medium',
      category: 'validation',
      recoverable: true,
      recovery: {
        action: 'retry',
        buttonText: 'Modificar Datos',
        userMessage: 'Cambia los datos duplicados e intenta nuevamente'
      }
    }
  },

  // ===== BUSINESS LOGIC ERRORS =====
  {
    backendCode: 'BUSINESS_SCHEDULE_CONFLICT',
    statusCode: 409,
    frontendError: {
      userMessage: 'Hay un conflicto de horarios con esta programación.',
      technicalMessage: 'Schedule conflict detected',
      severity: 'medium',
      category: 'business',
      recoverable: true,
      recovery: {
        action: 'custom',
        buttonText: 'Ver Conflictos',
        actionData: { showConflictModal: true },
        userMessage: 'Revisa los horarios en conflicto y realiza ajustes'
      }
    }
  },
  {
    backendCode: 'BUSINESS_ENROLLMENT_LIMIT_EXCEEDED',
    statusCode: 409,
    frontendError: {
      userMessage: 'Se ha alcanzado el límite máximo de inscripciones para este curso.',
      technicalMessage: 'Course enrollment limit exceeded',
      severity: 'medium',
      category: 'business',
      recoverable: false,
      recovery: {
        action: 'navigate',
        buttonText: 'Ver Otros Cursos',
        actionData: { path: '/academic/courses' },
        userMessage: 'Explora otros cursos disponibles'
      }
    }
  },

  // ===== NETWORK ERRORS =====
  {
    backendCode: 'NETWORK_TIMEOUT',
    statusCode: 408,
    frontendError: {
      userMessage: 'La operación tardó demasiado tiempo. Intenta nuevamente.',
      technicalMessage: 'Request timeout exceeded',
      severity: 'medium',
      category: 'network',
      recoverable: true,
      recovery: {
        action: 'retry',
        buttonText: 'Reintentar',
        userMessage: 'Verifica tu conexión a internet'
      }
    }
  },
  {
    backendCode: 'NETWORK_CONNECTION_FAILED',
    statusCode: [0, 500, 502, 503, 504],
    frontendError: {
      userMessage: 'No se pudo conectar con el servidor. Verifica tu conexión.',
      technicalMessage: 'Network connection failed',
      severity: 'high',
      category: 'network',
      recoverable: true,
      recovery: {
        action: 'retry',
        buttonText: 'Reintentar',
        userMessage: 'Intenta nuevamente en unos segundos'
      }
    }
  },

  // ===== SERVER ERRORS =====
  {
    backendCode: /^SERVER_ERROR_(.+)$/,
    statusCode: [500, 501, 502, 503, 504],
    frontendError: {
      userMessage: 'Ocurrió un error interno del servidor. El equipo técnico ha sido notificado.',
      technicalMessage: 'Internal server error',
      severity: 'critical',
      category: 'server',
      recoverable: true,
      recovery: {
        action: 'contact_support',
        buttonText: 'Reportar Problema',
        userMessage: 'Si el problema persiste, contacta soporte técnico'
      }
    }
  },

  // ===== RESOURCE NOT FOUND =====
  {
    backendCode: 'RESOURCE_NOT_FOUND',
    statusCode: 404,
    frontendError: {
      userMessage: 'El recurso solicitado no existe o ha sido eliminado.',
      technicalMessage: 'Requested resource not found',
      severity: 'medium',
      category: 'business',
      recoverable: true,
      recovery: {
        action: 'navigate',
        buttonText: 'Volver',
        actionData: { path: -1 },
        userMessage: 'Serás redirigido a la página anterior'
      }
    }
  }
]

// ===== DEFAULT ERROR MAPPINGS =====

const DEFAULT_ERROR_BY_STATUS: Record<number, Omit<FrontendError, 'code' | 'context'>> = {
  400: {
    userMessage: 'La solicitud contiene datos incorrectos.',
    technicalMessage: 'Bad Request - Invalid data format',
    severity: 'medium',
    category: 'validation',
    recoverable: true,
    recovery: {
      action: 'retry',
      buttonText: 'Corregir',
      userMessage: 'Verifica los datos ingresados'
    }
  },
  401: {
    userMessage: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
    technicalMessage: 'Unauthorized - Authentication required',
    severity: 'high',
    category: 'authentication',
    recoverable: true,
    recovery: {
      action: 'login',
      buttonText: 'Iniciar Sesión'
    }
  },
  403: {
    userMessage: 'No tienes permisos para realizar esta acción.',
    technicalMessage: 'Forbidden - Insufficient permissions',
    severity: 'medium',
    category: 'authorization',
    recoverable: false,
    recovery: {
      action: 'navigate',
      buttonText: 'Ir al Dashboard',
      actionData: { path: '/dashboard' }
    }
  },
  404: {
    userMessage: 'El recurso solicitado no fue encontrado.',
    technicalMessage: 'Not Found - Resource does not exist',
    severity: 'medium',
    category: 'business',
    recoverable: true,
    recovery: {
      action: 'navigate',
      buttonText: 'Volver',
      actionData: { path: -1 }
    }
  },
  422: {
    userMessage: 'Los datos proporcionados no son válidos.',
    technicalMessage: 'Unprocessable Entity - Validation failed',
    severity: 'low',
    category: 'validation',
    recoverable: true,
    recovery: {
      action: 'retry',
      buttonText: 'Corregir',
      userMessage: 'Revisa los campos marcados en rojo'
    }
  },
  429: {
    userMessage: 'Has realizado demasiadas solicitudes. Intenta nuevamente en unos minutos.',
    technicalMessage: 'Too Many Requests - Rate limit exceeded',
    severity: 'medium',
    category: 'network',
    recoverable: true,
    recovery: {
      action: 'retry',
      buttonText: 'Reintentar',
      userMessage: 'Espera unos minutos antes de intentar nuevamente'
    }
  },
  500: {
    userMessage: 'Error interno del servidor. El equipo técnico ha sido notificado.',
    technicalMessage: 'Internal Server Error',
    severity: 'critical',
    category: 'server',
    recoverable: true,
    recovery: {
      action: 'contact_support',
      buttonText: 'Reportar Problema'
    }
  }
}

// ===== ERROR MAPPING SERVICE =====

class ErrorMappingService {
  private customMappings = new Map<string, ErrorMappingRule>()

  constructor() {
    this.registerDefaultMappings()
  }

  private registerDefaultMappings(): void {
    ERROR_MAPPING_RULES.forEach(rule => {
      const key = typeof rule.backendCode === 'string' 
        ? rule.backendCode 
        : rule.backendCode.source
      this.customMappings.set(key, rule)
    })
  }

  /**
   * Mapea un error del backend a un error comprensible para el frontend
   */
  mapError(backendError: BackendError | any): FrontendError {
    try {
      // Extract error information from various formats
      const errorInfo = this.extractErrorInfo(backendError)
      
      // Log the error for observability
      logger.error('Backend Error Mapped', {
        originalError: errorInfo,
        requestId: errorInfo.request_id,
        statusCode: errorInfo.status_code,
        errorCode: errorInfo.error_code
      })

      // Find matching rule
      const mappingRule = this.findMappingRule(errorInfo)
      
      if (mappingRule) {
        return this.createFrontendError(errorInfo, mappingRule.frontendError)
      }

      // Fallback to status code mapping
      const statusCodeMapping = DEFAULT_ERROR_BY_STATUS[errorInfo.status_code]
      if (statusCodeMapping) {
        return this.createFrontendError(errorInfo, statusCodeMapping)
      }

      // Ultimate fallback
      return this.createGenericError(errorInfo)

    } catch (mappingError) {
      logger.error('Error Mapping Failed', {}, mappingError)
      return this.createGenericError(backendError)
    }
  }

  private extractErrorInfo(error: any): BackendError {
    // Handle Axios errors
    if (error.response) {
      return {
        error_code: error.response.data?.error_code || 'UNKNOWN_ERROR',
        message: error.response.data?.message || error.message,
        details: error.response.data?.details,
        field_errors: error.response.data?.field_errors,
        status_code: error.response.status,
        request_id: error.response.headers?.['x-request-id'] || error.config?.metadata?.requestId
      }
    }

    // Handle network errors
    if (error.request) {
      return {
        error_code: 'NETWORK_CONNECTION_FAILED',
        message: 'Network connection failed',
        status_code: 0,
        request_id: error.config?.metadata?.requestId
      }
    }

    // Handle already formatted backend errors
    if (error.error_code) {
      return error as BackendError
    }

    // Generic error fallback
    return {
      error_code: 'GENERIC_ERROR',
      message: error.message || 'Unknown error occurred',
      status_code: error.status || 500
    }
  }

  private findMappingRule(errorInfo: BackendError): ErrorMappingRule | null {
    for (const rule of ERROR_MAPPING_RULES) {
      // Check error code match
      const codeMatches = typeof rule.backendCode === 'string'
        ? rule.backendCode === errorInfo.error_code
        : rule.backendCode.test(errorInfo.error_code)

      if (!codeMatches) continue

      // Check status code match if specified
      if (rule.statusCode) {
        const statusMatches = Array.isArray(rule.statusCode)
          ? rule.statusCode.includes(errorInfo.status_code)
          : rule.statusCode === errorInfo.status_code

        if (!statusMatches) continue
      }

      // Check custom condition if specified
      if (rule.condition && !rule.condition(errorInfo)) continue

      return rule
    }

    return null
  }

  private createFrontendError(
    backendError: BackendError, 
    mapping: Omit<FrontendError, 'code' | 'context'>
  ): FrontendError {
    return {
      code: backendError.error_code,
      ...mapping,
      context: {
        requestId: backendError.request_id,
        statusCode: backendError.status_code,
        timestamp: backendError.timestamp || new Date().toISOString(),
        details: backendError.details,
        fieldErrors: backendError.field_errors
      }
    }
  }

  private createGenericError(backendError: any): FrontendError {
    return {
      code: 'GENERIC_ERROR',
      userMessage: 'Ocurrió un error inesperado. Por favor, intenta nuevamente.',
      technicalMessage: backendError.message || 'Unknown error',
      severity: 'medium',
      category: 'unknown',
      recoverable: true,
      recovery: {
        action: 'retry',
        buttonText: 'Reintentar'
      },
      context: {
        originalError: backendError,
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * Registra una regla de mapeo personalizada
   */
  registerMapping(rule: ErrorMappingRule): void {
    const key = typeof rule.backendCode === 'string' 
      ? rule.backendCode 
      : rule.backendCode.source
    this.customMappings.set(key, rule)
  }

  /**
   * Obtiene estadísticas de errores mapeados
   */
  getErrorStats(): {
    totalMappings: number
    categoryCounts: Record<string, number>
    severityCounts: Record<string, number>
    recoverableCount: number
  } {
    const stats = {
      totalMappings: this.customMappings.size,
      categoryCounts: {} as Record<string, number>,
      severityCounts: {} as Record<string, number>,
      recoverableCount: 0
    }

    this.customMappings.forEach(rule => {
      const category = rule.frontendError.category
      const severity = rule.frontendError.severity

      stats.categoryCounts[category] = (stats.categoryCounts[category] || 0) + 1
      stats.severityCounts[severity] = (stats.severityCounts[severity] || 0) + 1

      if (rule.frontendError.recoverable) {
        stats.recoverableCount++
      }
    })

    return stats
  }
}

// ===== SINGLETON INSTANCE =====

export const errorMappingService = new ErrorMappingService()

// ===== UTILITY FUNCTIONS =====

/**
 * Mapea un error de forma directa
 */
export const mapError = (error: any): FrontendError => {
  return errorMappingService.mapError(error)
}

/**
 * Hook para uso en componentes React
 */
export const useErrorMapping = () => {
  return {
    mapError,
    registerMapping: errorMappingService.registerMapping.bind(errorMappingService),
    getStats: errorMappingService.getErrorStats.bind(errorMappingService)
  }
}

export default errorMappingService