/**
 * FASE 5: Configuración de Sentry para Monitoreo de Flujos Fallidos
 * 
 * Integración completa con Sentry para:
 * - Error tracking y stack traces
 * - Performance monitoring
 * - Release tracking
 * - User context y breadcrumbs
 * - Custom tags y fingerprints
 */

import * as Sentry from '@sentry/react'
import { BrowserTracing } from '@sentry/tracing'
import { logger } from './logger.service'
import { errorMappingService, type FrontendError } from './error-mapping.service'

// ===== SENTRY CONFIGURATION =====

interface SentryConfig {
  dsn?: string
  environment: string
  release?: string
  sampleRate: number
  tracesSampleRate: number
  beforeSend?: (event: Sentry.Event) => Sentry.Event | null
  beforeSendTransaction?: (event: Sentry.Transaction) => Sentry.Transaction | null
  enableConsoleReports: boolean
  enablePerformanceMonitoring: boolean
  enableUserTracking: boolean
  enableCustomFingerprinting: boolean
}

const DEFAULT_CONFIG: SentryConfig = {
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_APP_ENV || 'development',
  release: import.meta.env.VITE_APP_VERSION || '1.0.0',
  sampleRate: import.meta.env.PROD ? 0.1 : 1.0, // 10% in production, 100% in development
  tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
  enableConsoleReports: !import.meta.env.PROD,
  enablePerformanceMonitoring: true,
  enableUserTracking: true,
  enableCustomFingerprinting: true
}

// ===== SENTRY SERVICE =====

class SentryService {
  private initialized = false
  private config: SentryConfig

  constructor(config: Partial<SentryConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Inicializa Sentry con configuración personalizada
   */
  initialize(): void {
    if (this.initialized || !this.config.dsn) {
      if (!this.config.dsn) {
        logger.warn('Sentry DSN not configured, skipping initialization')
      }
      return
    }

    try {
      Sentry.init({
        dsn: this.config.dsn,
        environment: this.config.environment,
        release: this.config.release,
        sampleRate: this.config.sampleRate,
        tracesSampleRate: this.config.tracesSampleRate,
        
        // Enable performance monitoring
        integrations: [
          new BrowserTracing({
            // Set up automatic route change tracking for React Router
            routingInstrumentation: Sentry.reactRouterV6Instrumentation(
              // We'll inject React Router history later
              {} as any
            ),
          }),
        ],

        // Performance monitoring
        beforeSend: (event) => this.beforeSendHandler(event),
        beforeSendTransaction: (transaction) => this.beforeSendTransactionHandler(transaction),

        // Additional options
        attachStacktrace: true,
        sendDefaultPii: false, // Don't send PII by default
        maxBreadcrumbs: 50,
        debug: !import.meta.env.PROD,

        // Custom error filtering
        ignoreErrors: [
          // Browser extensions
          'Non-Error promise rejection captured',
          'Non-Error exception captured',
          // Network errors that are not actionable
          'Network request failed',
          'NetworkError',
          // ResizeObserver errors that are benign
          'ResizeObserver loop limit exceeded',
          // Chrome extension errors
          'atomicFindClose',
          // Random plugins/extensions
          'top.GLOBALS',
          'originalCreateNotification',
          'canvas.contentDocument',
          'MyApp_RemoveAllHighlights',
          // Script injection attempts
          'Script error'
        ],

        // Ignore URLs (typically from browser extensions)
        denyUrls: [
          /extensions\//i,
          /^chrome:\/\//i,
          /^chrome-extension:\/\//i,
          /^moz-extension:\/\//i,
        ],
      })

      // Set up error boundary context
      this.setupErrorBoundaryContext()

      // Set up initial user context
      this.setupInitialContext()

      this.initialized = true
      logger.info('Sentry initialized successfully', {
        environment: this.config.environment,
        release: this.config.release,
        sampleRate: this.config.sampleRate
      })

    } catch (error) {
      logger.error('Failed to initialize Sentry', {}, error)
    }
  }

  private beforeSendHandler(event: Sentry.Event): Sentry.Event | null {
    // Add custom fingerprinting
    if (this.config.enableCustomFingerprinting) {
      this.addCustomFingerprint(event)
    }

    // Add enhanced context
    this.enhanceEventContext(event)

    // Filter out low-value errors in production
    if (import.meta.env.PROD && this.isLowValueError(event)) {
      return null
    }

    // Log to our internal logging system
    logger.error('Sentry Error Captured', {
      errorId: event.event_id,
      fingerprint: event.fingerprint,
      level: event.level,
      message: event.message,
      requestId: event.extra?.requestId
    })

    return event
  }

  private beforeSendTransactionHandler(transaction: Sentry.Transaction): Sentry.Transaction | null {
    // Filter out very short transactions that add noise
    if (transaction.timestamp && transaction.start_timestamp) {
      const duration = transaction.timestamp - transaction.start_timestamp
      if (duration < 10) { // Less than 10ms
        return null
      }
    }

    return transaction
  }

  private addCustomFingerprint(event: Sentry.Event): void {
    if (!event.exception?.values?.[0]) return

    const exception = event.exception.values[0]
    const errorType = exception.type || 'UnknownError'
    const errorMessage = exception.value || 'Unknown message'
    
    // Create custom fingerprint based on error characteristics
    const fingerprint = [
      errorType,
      this.normalizeErrorMessage(errorMessage),
      event.tags?.module || 'unknown-module',
      event.tags?.operation || 'unknown-operation'
    ]

    event.fingerprint = fingerprint
  }

  private normalizeErrorMessage(message: string): string {
    // Normalize dynamic parts of error messages
    return message
      .replace(/\d+/g, '[NUMBER]') // Replace numbers
      .replace(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, '[UUID]') // Replace UUIDs
      .replace(/req_[a-zA-Z0-9]+/g, '[REQUEST_ID]') // Replace request IDs
      .substring(0, 100) // Limit length
  }

  private enhanceEventContext(event: Sentry.Event): void {
    // Add request context if available
    const requestId = logger.getRequestId()
    if (requestId) {
      event.extra = { ...event.extra, requestId }
    }

    // Add performance context
    if (typeof window !== 'undefined') {
      event.extra = {
        ...event.extra,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        connection: (navigator as any).connection ? {
          effectiveType: (navigator as any).connection.effectiveType,
          downlink: (navigator as any).connection.downlink
        } : undefined
      }
    }
  }

  private isLowValueError(event: Sentry.Event): boolean {
    const message = event.message || event.exception?.values?.[0]?.value || ''
    
    // Filter out common low-value errors
    const lowValuePatterns = [
      /Script error/i,
      /Non-Error/i,
      /ChunkLoadError/i,
      /Loading chunk \d+ failed/i,
      /ResizeObserver loop limit exceeded/i
    ]

    return lowValuePatterns.some(pattern => pattern.test(message))
  }

  private setupErrorBoundaryContext(): void {
    // This will be called by our React Error Boundary
    (window as any).__SENTRY_ERROR_BOUNDARY__ = {
      captureException: this.captureException.bind(this),
      captureMessage: this.captureMessage.bind(this)
    }
  }

  private setupInitialContext(): void {
    // Set initial tags
    Sentry.setTag('app.section', 'frontend')
    Sentry.setTag('app.framework', 'react')
    Sentry.setTag('app.build', import.meta.env.VITE_BUILD_ID || 'unknown')

    // Set initial context
    Sentry.setContext('app', {
      name: 'Schedium Frontend',
      version: this.config.release,
      environment: this.config.environment
    })

    // Set browser context
    if (typeof window !== 'undefined') {
      Sentry.setContext('browser', {
        name: navigator.userAgent,
        version: navigator.appVersion,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine
      })

      Sentry.setContext('screen', {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth,
        pixelDepth: screen.pixelDepth
      })
    }
  }

  /**
   * Actualiza el contexto del usuario
   */
  setUserContext(user: {
    id?: number
    email?: string
    role?: string
    username?: string
  }): void {
    if (!this.initialized) return

    Sentry.setUser({
      id: user.id?.toString(),
      email: user.email,
      username: user.username || user.email,
    })

    // Set role as tag for filtering
    if (user.role) {
      Sentry.setTag('user.role', user.role)
    }

    logger.info('Sentry user context updated', {
      userId: user.id,
      role: user.role
    })
  }

  /**
   * Limpia el contexto del usuario (logout)
   */
  clearUserContext(): void {
    if (!this.initialized) return

    Sentry.setUser(null)
    Sentry.setTag('user.role', null)
    
    logger.info('Sentry user context cleared')
  }

  /**
   * Establece contexto de la página/módulo actual
   */
  setPageContext(page: {
    name: string
    module: string
    path: string
    params?: Record<string, any>
  }): void {
    if (!this.initialized) return

    Sentry.setTag('page.module', page.module)
    Sentry.setTag('page.name', page.name)

    Sentry.setContext('page', {
      name: page.name,
      module: page.module,
      path: page.path,
      params: page.params
    })

    // Add breadcrumb for navigation
    Sentry.addBreadcrumb({
      category: 'navigation',
      message: `Navigated to ${page.name}`,
      level: 'info',
      data: {
        module: page.module,
        path: page.path
      }
    })
  }

  /**
   * Captura un error mapeado desde nuestro sistema
   */
  captureMappedError(frontendError: FrontendError, originalError?: any): string | undefined {
    if (!this.initialized) return undefined

    const eventId = Sentry.captureException(originalError || new Error(frontendError.technicalMessage), {
      tags: {
        'error.category': frontendError.category,
        'error.severity': frontendError.severity,
        'error.recoverable': frontendError.recoverable,
        'error.code': frontendError.code
      },
      extra: {
        frontendError,
        userMessage: frontendError.userMessage,
        recovery: frontendError.recovery,
        context: frontendError.context
      },
      level: this.mapSeverityToLevel(frontendError.severity),
      fingerprint: [frontendError.code, frontendError.category]
    })

    logger.info('Mapped error sent to Sentry', {
      eventId,
      errorCode: frontendError.code,
      category: frontendError.category,
      severity: frontendError.severity
    })

    return eventId
  }

  private mapSeverityToLevel(severity: FrontendError['severity']): Sentry.SeverityLevel {
    const mapping: Record<FrontendError['severity'], Sentry.SeverityLevel> = {
      low: 'info',
      medium: 'warning',
      high: 'error',
      critical: 'fatal'
    }
    return mapping[severity]
  }

  /**
   * Captura un error genérico
   */
  captureException(error: Error, context?: Record<string, any>): string | undefined {
    if (!this.initialized) return undefined

    return Sentry.captureException(error, {
      extra: context,
      tags: {
        'capture.method': 'manual'
      }
    })
  }

  /**
   * Captura un mensaje informativo
   */
  captureMessage(message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, any>): string | undefined {
    if (!this.initialized) return undefined

    return Sentry.captureMessage(message, level, {
      extra: context,
      tags: {
        'capture.method': 'manual'
      }
    })
  }

  /**
   * Añade breadcrumb personalizado
   */
  addBreadcrumb(breadcrumb: {
    message: string
    category?: string
    level?: Sentry.SeverityLevel
    data?: Record<string, any>
  }): void {
    if (!this.initialized) return

    Sentry.addBreadcrumb({
      message: breadcrumb.message,
      category: breadcrumb.category || 'custom',
      level: breadcrumb.level || 'info',
      data: breadcrumb.data,
      timestamp: Date.now() / 1000
    })
  }

  /**
   * Inicia una transacción de performance
   */
  startTransaction(name: string, operation: string, data?: Record<string, any>): Sentry.Transaction | undefined {
    if (!this.initialized || !this.config.enablePerformanceMonitoring) return undefined

    const transaction = Sentry.startTransaction({
      name,
      op: operation,
      data,
      tags: {
        'transaction.custom': true
      }
    })

    return transaction
  }

  /**
   * Captura métricas de Web Vitals
   */
  captureWebVital(metric: {
    name: string
    value: number
    delta: number
    id: string
    navigationType: string
  }): void {
    if (!this.initialized) return

    Sentry.addBreadcrumb({
      category: 'web-vital',
      message: `${metric.name}: ${metric.value}`,
      level: 'info',
      data: {
        name: metric.name,
        value: metric.value,
        delta: metric.delta,
        id: metric.id,
        navigationType: metric.navigationType
      }
    })

    // Send as measurement
    const transaction = Sentry.getCurrentHub().getScope()?.getTransaction()
    if (transaction) {
      transaction.setMeasurement(metric.name, metric.value, 'millisecond')
    }
  }

  /**
   * Obtiene estadísticas de Sentry
   */
  getStats(): {
    initialized: boolean
    environment: string
    release: string
    sampleRate: number
  } {
    return {
      initialized: this.initialized,
      environment: this.config.environment,
      release: this.config.release || 'unknown',
      sampleRate: this.config.sampleRate
    }
  }
}

// ===== SINGLETON INSTANCE =====

export const sentryService = new SentryService()

// ===== REACT ERROR BOUNDARY INTEGRATION =====

export const SentryErrorBoundary = Sentry.withErrorBoundary

// ===== REACT ROUTER INTEGRATION =====

export const withSentryRouting = (ReactRouter: any) => {
  return Sentry.withSentryRouting(ReactRouter)
}

// ===== HOOKS =====

export const useSentry = () => {
  return {
    captureException: sentryService.captureException.bind(sentryService),
    captureMessage: sentryService.captureMessage.bind(sentryService),
    captureMappedError: sentryService.captureMappedError.bind(sentryService),
    setUserContext: sentryService.setUserContext.bind(sentryService),
    clearUserContext: sentryService.clearUserContext.bind(sentryService),
    setPageContext: sentryService.setPageContext.bind(sentryService),
    addBreadcrumb: sentryService.addBreadcrumb.bind(sentryService),
    startTransaction: sentryService.startTransaction.bind(sentryService),
    captureWebVital: sentryService.captureWebVital.bind(sentryService),
    getStats: sentryService.getStats.bind(sentryService)
  }
}

// ===== INITIALIZATION =====

// Auto-initialize if DSN is provided
if (import.meta.env.VITE_SENTRY_DSN) {
  sentryService.initialize()
}

export default sentryService