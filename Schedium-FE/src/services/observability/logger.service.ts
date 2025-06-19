/**
 * FASE 5: Observabilidad y Debugging Compartido
 * Logger Central con Request ID Tracing
 * 
 * Características:
 * - Request ID único para trazabilidad backend <-> frontend
 * - Diferentes niveles de log (debug, info, warn, error)
 * - Contexto detallado de usuario y operación
 * - Buffer circular para debug tools
 * - Integración con herramientas de monitoreo
 */

import { nanoid } from 'nanoid'

// ===== TYPES =====

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogContext {
  requestId?: string
  userId?: number
  userRole?: string
  module?: string
  operation?: string
  endpoint?: string
  method?: string
  statusCode?: number
  duration?: number
  userAgent?: string
  sessionId?: string
  [key: string]: any
}

export interface LogEntry {
  id: string
  timestamp: string
  level: LogLevel
  message: string
  context: LogContext
  stack?: string
  fingerprint?: string // Para agrupación de errores similares
}

export interface LoggerConfig {
  level: LogLevel
  enableConsole: boolean
  enableBuffer: boolean
  bufferSize: number
  enableRemote: boolean
  remoteEndpoint?: string
  enablePerformanceTracking: boolean
  enableUserTracking: boolean
  excludeEndpoints?: string[]
  sensitiveKeys?: string[]
}

// ===== LOGGER SERVICE =====

class LoggerService {
  private config: LoggerConfig
  private buffer: LogEntry[] = []
  private requestIdMap = new Map<string, string>() // Para mantener Request ID por sesión
  private performanceMarks = new Map<string, number>()
  
  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: 'info',
      enableConsole: true,
      enableBuffer: true,
      bufferSize: 1000,
      enableRemote: false,
      enablePerformanceTracking: true,
      enableUserTracking: true,
      excludeEndpoints: ['/health', '/ping'],
      sensitiveKeys: ['password', 'token', 'authorization', 'cookie'],
      ...config
    }
    
    this.initializeLogger()
  }

  private initializeLogger() {
    // Interceptar errores globales
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.error('Global Error', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack
        })
      })

      window.addEventListener('unhandledrejection', (event) => {
        this.error('Unhandled Promise Rejection', {
          reason: event.reason,
          stack: event.reason?.stack
        })
      })
    }
  }

  // ===== REQUEST ID MANAGEMENT =====

  generateRequestId(): string {
    return `req_${nanoid(12)}`
  }

  setRequestId(key: string, requestId: string): void {
    this.requestIdMap.set(key, requestId)
  }

  getRequestId(key: string = 'default'): string {
    return this.requestIdMap.get(key) || this.generateRequestId()
  }

  // ===== PERFORMANCE TRACKING =====

  startTiming(operation: string): string {
    const timingId = `${operation}_${nanoid(8)}`
    this.performanceMarks.set(timingId, performance.now())
    return timingId
  }

  endTiming(timingId: string, context: LogContext = {}): number {
    const startTime = this.performanceMarks.get(timingId)
    if (!startTime) return 0

    const duration = performance.now() - startTime
    this.performanceMarks.delete(timingId)

    this.info('Performance Timing', {
      ...context,
      duration: Math.round(duration),
      operation: timingId.split('_')[0]
    })

    return duration
  }

  // ===== CORE LOGGING METHODS =====

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    }
    return levels[level] >= levels[this.config.level]
  }

  private sanitizeContext(context: LogContext): LogContext {
    const sanitized = { ...context }
    
    // Remove sensitive information
    this.config.sensitiveKeys?.forEach(key => {
      if (key in sanitized) {
        sanitized[key] = '[REDACTED]'
      }
    })

    // Add user context if available
    if (this.config.enableUserTracking) {
      try {
        const userStore = (window as any).__USER_STORE__
        if (userStore) {
          sanitized.userId = userStore.user?.id
          sanitized.userRole = userStore.user?.role
          sanitized.sessionId = userStore.sessionId
        }
      } catch (error) {
        // Ignore user context extraction errors
      }
    }

    // Add browser context
    if (typeof window !== 'undefined') {
      sanitized.userAgent = navigator.userAgent
      sanitized.url = window.location.href
    }

    return sanitized
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context: LogContext = {},
    error?: Error
  ): LogEntry {
    const sanitizedContext = this.sanitizeContext(context)
    
    const entry: LogEntry = {
      id: nanoid(),
      timestamp: new Date().toISOString(),
      level,
      message,
      context: sanitizedContext,
      stack: error?.stack,
      fingerprint: this.generateFingerprint(message, sanitizedContext)
    }

    return entry
  }

  private generateFingerprint(message: string, context: LogContext): string {
    // Create a fingerprint for grouping similar errors
    const key = `${message}:${context.module}:${context.operation}:${context.endpoint}`
    return btoa(key).substring(0, 16)
  }

  private addToBuffer(entry: LogEntry): void {
    if (!this.config.enableBuffer) return

    this.buffer.push(entry)
    if (this.buffer.length > this.config.bufferSize) {
      this.buffer.shift() // Remove oldest entry
    }
  }

  private sendToConsole(entry: LogEntry): void {
    if (!this.config.enableConsole) return

    const style = this.getConsoleStyle(entry.level)
    const timestamp = new Date(entry.timestamp).toLocaleTimeString()
    
    console.groupCollapsed(
      `%c[${entry.level.toUpperCase()}] ${timestamp} - ${entry.message}`,
      style
    )
    
    if (Object.keys(entry.context).length > 0) {
      console.log('Context:', entry.context)
    }
    
    if (entry.stack) {
      console.log('Stack:', entry.stack)
    }
    
    console.groupEnd()
  }

  private getConsoleStyle(level: LogLevel): string {
    const styles = {
      debug: 'color: #6b7280; font-weight: normal;',
      info: 'color: #3b82f6; font-weight: bold;',
      warn: 'color: #f59e0b; font-weight: bold;',
      error: 'color: #ef4444; font-weight: bold;'
    }
    return styles[level]
  }

  private async sendToRemote(entry: LogEntry): Promise<void> {
    if (!this.config.enableRemote || !this.config.remoteEndpoint) return

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry)
      })
    } catch (error) {
      // Avoid infinite logging loop
      console.error('Failed to send log to remote endpoint:', error)
    }
  }

  private log(level: LogLevel, message: string, context: LogContext = {}, error?: Error): void {
    if (!this.shouldLog(level)) return

    const entry = this.createLogEntry(level, message, context, error)

    this.addToBuffer(entry)
    this.sendToConsole(entry)
    
    // Send to remote asynchronously
    if (this.config.enableRemote) {
      this.sendToRemote(entry).catch(() => {
        // Ignore remote logging failures
      })
    }
  }

  // ===== PUBLIC API =====

  debug(message: string, context: LogContext = {}): void {
    this.log('debug', message, context)
  }

  info(message: string, context: LogContext = {}): void {
    this.log('info', message, context)
  }

  warn(message: string, context: LogContext = {}): void {
    this.log('warn', message, context)
  }

  error(message: string, context: LogContext = {}, error?: Error): void {
    this.log('error', message, context, error)
  }

  // ===== API REQUEST LOGGING =====

  logRequest(config: any): string {
    const requestId = this.generateRequestId()
    const timingId = this.startTiming(`request_${config.method?.toUpperCase()}`)
    
    // Store timing ID with request ID for correlation
    this.setRequestId(`timing_${requestId}`, timingId)
    
    this.info('API Request Started', {
      requestId,
      method: config.method?.toUpperCase(),
      endpoint: config.url,
      module: config.context?.module,
      operation: config.context?.operation,
      hasAuth: !!config.headers?.Authorization,
      requestSize: config.data ? JSON.stringify(config.data).length : 0
    })

    return requestId
  }

  logResponse(requestId: string, response: any): void {
    const timingId = this.getRequestId(`timing_${requestId}`)
    const duration = this.endTiming(timingId)
    
    const responseSize = response.data ? JSON.stringify(response.data).length : 0
    
    this.info('API Request Completed', {
      requestId,
      statusCode: response.status,
      duration: Math.round(duration),
      responseSize,
      success: response.status >= 200 && response.status < 300,
      endpoint: response.config?.url,
      method: response.config?.method?.toUpperCase()
    })
  }

  logRequestError(requestId: string, error: any): void {
    const timingId = this.getRequestId(`timing_${requestId}`)
    const duration = this.endTiming(timingId)
    
    this.error('API Request Failed', {
      requestId,
      statusCode: error.response?.status,
      duration: Math.round(duration),
      errorCode: error.code,
      errorMessage: error.message,
      endpoint: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      isNetworkError: !error.response,
      isTimeoutError: error.code === 'ECONNABORTED'
    }, error)
  }

  // ===== BUFFER AND DEBUG METHODS =====

  getBuffer(): LogEntry[] {
    return [...this.buffer]
  }

  getBufferByLevel(level: LogLevel): LogEntry[] {
    return this.buffer.filter(entry => entry.level === level)
  }

  getBufferByContext(key: string, value: any): LogEntry[] {
    return this.buffer.filter(entry => entry.context[key] === value)
  }

  clearBuffer(): void {
    this.buffer = []
  }

  exportBuffer(): string {
    return JSON.stringify(this.buffer, null, 2)
  }

  getStats(): {
    totalEntries: number
    byLevel: Record<LogLevel, number>
    uniqueFingerprints: number
    bufferSize: number
    oldestEntry?: string
    newestEntry?: string
  } {
    const byLevel = this.buffer.reduce((acc, entry) => {
      acc[entry.level] = (acc[entry.level] || 0) + 1
      return acc
    }, {} as Record<LogLevel, number>)

    const fingerprints = new Set(this.buffer.map(entry => entry.fingerprint))

    return {
      totalEntries: this.buffer.length,
      byLevel,
      uniqueFingerprints: fingerprints.size,
      bufferSize: this.config.bufferSize,
      oldestEntry: this.buffer[0]?.timestamp,
      newestEntry: this.buffer[this.buffer.length - 1]?.timestamp
    }
  }

  updateConfig(newConfig: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }
}

// ===== SINGLETON INSTANCE =====

export const logger = new LoggerService({
  level: import.meta.env.PROD ? 'warn' : 'debug',
  enableRemote: import.meta.env.PROD,
  remoteEndpoint: import.meta.env.VITE_LOGGING_ENDPOINT
})

// ===== ENHANCED AXIOS INTEGRATION =====

export const createLoggedAxiosInstance = (baseConfig: any = {}) => {
  const axios = require('axios')
  
  const instance = axios.create(baseConfig)
  
  // Request interceptor
  instance.interceptors.request.use(
    (config: any) => {
      const requestId = logger.logRequest(config)
      config.metadata = { ...config.metadata, requestId }
      
      // Add Request ID header for backend correlation
      config.headers['X-Request-ID'] = requestId
      
      return config
    },
    (error: any) => {
      logger.error('Request Interceptor Error', {}, error)
      return Promise.reject(error)
    }
  )
  
  // Response interceptor
  instance.interceptors.response.use(
    (response: any) => {
      const requestId = response.config?.metadata?.requestId
      if (requestId) {
        logger.logResponse(requestId, response)
      }
      return response
    },
    (error: any) => {
      const requestId = error.config?.metadata?.requestId
      if (requestId) {
        logger.logRequestError(requestId, error)
      }
      return Promise.reject(error)
    }
  )
  
  return instance
}

// ===== REACT HOOKS =====

export const useLogger = () => {
  return {
    debug: logger.debug.bind(logger),
    info: logger.info.bind(logger),
    warn: logger.warn.bind(logger),
    error: logger.error.bind(logger),
    startTiming: logger.startTiming.bind(logger),
    endTiming: logger.endTiming.bind(logger),
    getBuffer: logger.getBuffer.bind(logger),
    getStats: logger.getStats.bind(logger),
    clearBuffer: logger.clearBuffer.bind(logger)
  }
}

export default logger