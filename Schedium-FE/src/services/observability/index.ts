/**
 * FASE 5: Observabilidad y Debugging Compartido - Consolidado
 * 
 * Sistema completo de observabilidad que incluye:
 * - Logger central con Request ID tracing
 * - Mapeo de errores backend <-> frontend
 * - Monitoreo con Sentry
 * - Debug tools para QA/desarrolladores
 * - Web Vitals y métricas de rendimiento
 */

// ===== CORE SERVICES =====
export { default as logger, createLoggedAxiosInstance, useLogger } from './logger.service'
export type { LogLevel, LogContext, LogEntry, LoggerConfig } from './logger.service'

export { 
  default as errorMappingService, 
  mapError, 
  useErrorMapping 
} from './error-mapping.service'
export type { 
  BackendError, 
  FrontendError, 
  ErrorMappingRule 
} from './error-mapping.service'

export { 
  default as sentryService, 
  SentryErrorBoundary, 
  withSentryRouting, 
  useSentry 
} from './sentry.service'

export { 
  default as debugToolsService, 
  useDebugTools 
} from './debug-tools.service'
export type { 
  DebugPanelState, 
  NetworkRequest, 
  PerformanceMetric 
} from './debug-tools.service'

export { 
  default as webVitalsService, 
  useWebVitals 
} from './web-vitals.service'
export type { 
  WebVitalMetric, 
  CustomMetric, 
  PerformanceBudget, 
  PerformanceReport 
} from './web-vitals.service'

// ===== INTEGRATED OBSERVABILITY SERVICE =====

import { logger } from './logger.service'
import { sentryService } from './sentry.service'
import { debugToolsService } from './debug-tools.service'
import { webVitalsService } from './web-vitals.service'
import { errorMappingService, mapError, type FrontendError } from './error-mapping.service'

class ObservabilityService {
  private initialized = false

  /**
   * Inicializa todos los servicios de observabilidad
   */
  initialize(config?: {
    enableSentry?: boolean
    enableDebugTools?: boolean
    enableWebVitals?: boolean
    logLevel?: 'debug' | 'info' | 'warn' | 'error'
  }): void {
    if (this.initialized) return

    const {
      enableSentry = true,
      enableDebugTools = import.meta.env.DEV,
      enableWebVitals = true,
      logLevel = import.meta.env.PROD ? 'warn' : 'debug'
    } = config || {}

    try {
      // Update logger configuration
      logger.updateConfig({ level: logLevel })

      // Initialize Sentry if enabled and configured
      if (enableSentry && import.meta.env.VITE_SENTRY_DSN) {
        sentryService.initialize()
      }

      // Start debug tools recording if enabled
      if (enableDebugTools) {
        debugToolsService.startRecording()
      }

      // Start web vitals monitoring if enabled
      if (enableWebVitals) {
        webVitalsService.startMonitoring()
      }

      this.initialized = true
      
      logger.info('Observability services initialized', {
        sentry: enableSentry && !!import.meta.env.VITE_SENTRY_DSN,
        debugTools: enableDebugTools,
        webVitals: enableWebVitals,
        logLevel
      })

    } catch (error) {
      console.error('Failed to initialize observability services:', error)
    }
  }

  /**
   * Configura el contexto del usuario en todos los servicios
   */
  setUserContext(user: {
    id?: number
    email?: string
    role?: string
    username?: string
  }): void {
    sentryService.setUserContext(user)
    
    logger.info('User context updated across observability services', {
      userId: user.id,
      role: user.role
    })
  }

  /**
   * Limpia el contexto del usuario (logout)
   */
  clearUserContext(): void {
    sentryService.clearUserContext()
    
    logger.info('User context cleared across observability services')
  }

  /**
   * Configura el contexto de página/módulo
   */
  setPageContext(page: {
    name: string
    module: string
    path: string
    params?: Record<string, any>
  }): void {
    sentryService.setPageContext(page)
    
    logger.info('Page context updated', page)
  }

  /**
   * Maneja un error de forma centralizada
   */
  handleError(error: any, context?: Record<string, any>): {
    frontendError: FrontendError
    eventId?: string
  } {
    // Mapear el error
    const frontendError = mapError(error)
    
    // Enviar a Sentry
    const eventId = sentryService.captureMappedError(frontendError, error)
    
    // Log del error
    logger.error('Centralized error handling', {
      errorCode: frontendError.code,
      category: frontendError.category,
      severity: frontendError.severity,
      userMessage: frontendError.userMessage,
      eventId,
      ...context
    }, error)

    return { frontendError, eventId }
  }

  /**
   * Registra una métrica personalizada en todos los servicios relevantes
   */
  recordMetric(metric: {
    name: string
    value: number
    unit?: 'ms' | 'bytes' | 'count' | 'percentage'
    category?: 'performance' | 'user-experience' | 'business' | 'technical'
    context?: Record<string, any>
  }): void {
    // Log de la métrica
    logger.info('Custom metric recorded', metric)

    // Registrar en Web Vitals si es métrica de rendimiento
    if (metric.category === 'performance') {
      webVitalsService.recordCustomMetric({
        name: metric.name,
        value: metric.value,
        unit: metric.unit || 'count',
        category: metric.category,
        timestamp: new Date().toISOString(),
        context: metric.context
      })
    }

    // Registrar en debug tools
    debugToolsService.recordPerformanceMetric({
      name: metric.name,
      value: metric.value,
      timestamp: new Date().toISOString(),
      category: 'measure',
      details: {
        unit: metric.unit,
        category: metric.category,
        ...metric.context
      }
    })
  }

  /**
   * Inicia el tracking de una operación
   */
  startOperation(name: string, context?: Record<string, any>): {
    timingId: string
    transaction?: any
    finish: () => void
  } {
    // Iniciar timing en logger
    const timingId = logger.startTiming(name)
    
    // Iniciar transacción en Sentry
    const transaction = sentryService.startTransaction(name, 'operation', context)
    
    // Añadir breadcrumb
    logger.info('Operation started', { name, ...context })

    return {
      timingId,
      transaction,
      finish: () => {
        // Finalizar timing
        const duration = logger.endTiming(timingId, context)
        
        // Finalizar transacción
        if (transaction) {
          transaction.finish()
        }
        
        // Registrar métrica
        this.recordMetric({
          name: `operation-${name}`,
          value: duration,
          unit: 'ms',
          category: 'performance',
          context
        })

        logger.info('Operation completed', { name, duration, ...context })
      }
    }
  }

  /**
   * Genera un reporte completo de observabilidad
   */
  generateObservabilityReport(): {
    timestamp: string
    logger: any
    sentry: any
    webVitals: any
    errors: any
    performance: any
  } {
    return {
      timestamp: new Date().toISOString(),
      logger: logger.getStats(),
      sentry: sentryService.getStats(),
      webVitals: webVitalsService.generateReport(),
      errors: errorMappingService.getErrorStats(),
      performance: {
        score: webVitalsService.getPerformanceScore(),
        latestMetrics: webVitalsService.getLatestWebVitals()
      }
    }
  }

  /**
   * Exporta todos los datos de debugging
   */
  exportAllDebugData(): string {
    const report = this.generateObservabilityReport()
    const debugData = debugToolsService.exportDebugData()
    
    return JSON.stringify({
      observabilityReport: report,
      debugData: JSON.parse(debugData)
    }, null, 2)
  }

  /**
   * Limpia todos los datos de debugging
   */
  clearAllData(): void {
    debugToolsService.clearData()
    logger.clearBuffer()
    
    logger.info('All observability data cleared')
  }

  getStats(): {
    initialized: boolean
    services: {
      logger: boolean
      sentry: boolean
      debugTools: boolean
      webVitals: boolean
    }
  } {
    return {
      initialized: this.initialized,
      services: {
        logger: true, // Always available
        sentry: sentryService.getStats().initialized,
        debugTools: true, // Always available
        webVitals: true // Always available
      }
    }
  }
}

// ===== SINGLETON INSTANCE =====

export const observabilityService = new ObservabilityService()

// ===== REACT HOOKS =====

export const useObservability = () => {
  return {
    setUserContext: observabilityService.setUserContext.bind(observabilityService),
    clearUserContext: observabilityService.clearUserContext.bind(observabilityService),
    setPageContext: observabilityService.setPageContext.bind(observabilityService),
    handleError: observabilityService.handleError.bind(observabilityService),
    recordMetric: observabilityService.recordMetric.bind(observabilityService),
    startOperation: observabilityService.startOperation.bind(observabilityService),
    generateReport: observabilityService.generateObservabilityReport.bind(observabilityService),
    exportDebugData: observabilityService.exportAllDebugData.bind(observabilityService),
    clearData: observabilityService.clearAllData.bind(observabilityService),
    getStats: observabilityService.getStats.bind(observabilityService)
  }
}

// ===== AUTO-INITIALIZATION =====

// Auto-initialize in browser environment
if (typeof window !== 'undefined') {
  observabilityService.initialize()
}

// ===== QUICK START GUIDE =====

/**
 * Quick Start Guide for Observability Services:
 * 
 * 1. Basic Setup (automatically done):
 *    ```typescript
 *    import { observabilityService } from '@/services/observability'
 *    
 *    // Services are auto-initialized
 *    ```
 * 
 * 2. User Context (in your auth flow):
 *    ```typescript
 *    import { useObservability } from '@/services/observability'
 *    
 *    const { setUserContext, clearUserContext } = useObservability()
 *    
 *    // On login
 *    setUserContext({
 *      id: user.id,
 *      email: user.email,
 *      role: user.role
 *    })
 *    
 *    // On logout
 *    clearUserContext()
 *    ```
 * 
 * 3. Page Context (in your router/components):
 *    ```typescript
 *    const { setPageContext } = useObservability()
 *    
 *    useEffect(() => {
 *      setPageContext({
 *        name: 'Student Management',
 *        module: 'academic',
 *        path: '/academic/students',
 *        params: { filters }
 *      })
 *    }, [])
 *    ```
 * 
 * 4. Error Handling:
 *    ```typescript
 *    const { handleError } = useObservability()
 *    
 *    try {
 *      await someOperation()
 *    } catch (error) {
 *      const { frontendError } = handleError(error, { 
 *        operation: 'create_student',
 *        context: { studentData }
 *      })
 *      
 *      // Use frontendError.userMessage for user display
 *      toast.error(frontendError.userMessage)
 *    }
 *    ```
 * 
 * 5. Performance Tracking:
 *    ```typescript
 *    const { startOperation, recordMetric } = useObservability()
 *    
 *    // Track operation
 *    const operation = startOperation('load-students', { filters })
 *    const students = await loadStudents(filters)
 *    operation.finish()
 *    
 *    // Record custom metric
 *    recordMetric({
 *      name: 'students-loaded',
 *      value: students.length,
 *      unit: 'count',
 *      category: 'business'
 *    })
 *    ```
 * 
 * 6. Debug Tools (development):
 *    ```typescript
 *    // Access via browser console
 *    window.__SCHEDIUM_DEBUG__.logs()
 *    window.__SCHEDIUM_DEBUG__.cache()
 *    window.__SCHEDIUM_DEBUG__.network()
 *    window.__SCHEDIUM_DEBUG__.export()
 *    ```
 * 
 * 7. Environment Variables:
 *    ```env
 *    VITE_SENTRY_DSN=your_sentry_dsn
 *    VITE_LOGGING_ENDPOINT=your_logging_endpoint
 *    VITE_APP_ENV=development|staging|production
 *    VITE_APP_VERSION=1.0.0
 *    ```
 */

export default observabilityService