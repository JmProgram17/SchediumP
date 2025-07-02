/**
 * OBSERVABILIDAD SIMPLIFICADA PARA MVP
 * Sistema básico de logging y debugging sin dependencias complejas
 */

// ===== LOGGER BÁSICO =====
const logger = {
  info: (message: string, data?: any) => {
    if (import.meta.env.DEV) {
      console.log(`[INFO] ${message}`, data || '')
    }
  },
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data || '')
  },
  error: (message: string, data?: any, error?: any) => {
    console.error(`[ERROR] ${message}`, data || '', error || '')
  },
  debug: (message: string, data?: any) => {
    if (import.meta.env.DEV) {
      console.debug(`[DEBUG] ${message}`, data || '')
    }
  },
  startTiming: (name: string) => {
    if (import.meta.env.DEV) {
      console.time(name)
    }
    return name
  },
  endTiming: (name: string, context?: any) => {
    if (import.meta.env.DEV) {
      console.timeEnd(name)
      if (context) {
        console.log(`[TIMING] ${name} context:`, context)
      }
    }
    return 0
  },
  updateConfig: () => {},
  getStats: () => ({ initialized: true }),
  clearBuffer: () => {}
}

// ===== OBSERVABILITY SERVICE SIMPLIFICADO =====
class ObservabilityService {
  private initialized = false

  initialize(config?: {
    enableSentry?: boolean
    enableDebugTools?: boolean
    enableWebVitals?: boolean
    logLevel?: 'debug' | 'info' | 'warn' | 'error'
  }): void {
    if (this.initialized) return

    try {
      this.initialized = true
      logger.info('Observability services initialized (MVP mode)', config || {})
    } catch (error) {
      console.error('Failed to initialize observability services:', error)
    }
  }

  setUserContext(user: {
    id?: number
    email?: string
    role?: string
    username?: string
  }): void {
    logger.info('User context updated', {
      userId: user.id,
      role: user.role
    })
  }

  clearUserContext(): void {
    logger.info('User context cleared')
  }

  setPageContext(page: {
    name: string
    module: string
    path: string
    params?: Record<string, any>
  }): void {
    logger.info('Page context updated', page)
  }

  handleError(error: any, context?: Record<string, any>): {
    frontendError: { code: string, userMessage: string, severity: string }
    eventId?: string
  } {
    const frontendError = {
      code: 'UNKNOWN_ERROR',
      userMessage: error?.message || 'Ha ocurrido un error inesperado',
      severity: 'error'
    }
    
    logger.error('Centralized error handling', {
      errorCode: frontendError.code,
      userMessage: frontendError.userMessage,
      ...context
    }, error)

    return { frontendError }
  }

  recordMetric(metric: {
    name: string
    value: number
    unit?: string
    category?: string
    context?: Record<string, any>
  }): void {
    logger.info('Custom metric recorded', metric)
  }

  startOperation(name: string, context?: Record<string, any>): {
    timingId: string
    transaction?: any
    finish: () => void
  } {
    const timingId = logger.startTiming(name)
    logger.info('Operation started', { name, ...context })

    return {
      timingId,
      finish: () => {
        const duration = logger.endTiming(timingId, context)
        logger.info('Operation completed', { name, duration, ...context })
      }
    }
  }

  generateObservabilityReport(): any {
    return {
      timestamp: new Date().toISOString(),
      mode: 'MVP',
      logger: { initialized: true }
    }
  }

  exportAllDebugData(): string {
    return JSON.stringify({
      mode: 'MVP',
      timestamp: new Date().toISOString()
    }, null, 2)
  }

  clearAllData(): void {
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
        logger: true,
        sentry: false,
        debugTools: false,
        webVitals: false
      }
    }
  }
}

// ===== SINGLETON INSTANCE =====
export const observabilityService = new ObservabilityService()

// ===== SIMPLIFIED DEBUG TOOLS SERVICE =====
// Mock debugToolsService for compatibility
export const debugToolsService = {
  recordNetworkRequest: (data: any) => {
    logger.debug('Network request recorded', data)
  },
  recordError: (error: any, context?: any) => {
    logger.error('Error recorded', context, error)
  },
  recordUserAction: (action: string, data?: any) => {
    logger.info('User action recorded', { action, ...data })
  },
  getDebugData: () => ({
    mode: 'MVP',
    timestamp: new Date().toISOString()
  }),
  clearData: () => {
    logger.info('Debug data cleared')
  }
}

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

// ===== EXPORTS BÁSICOS =====
export { logger }
export default observabilityService

// Auto-initialize in browser environment
if (typeof window !== 'undefined') {
  observabilityService.initialize()
}