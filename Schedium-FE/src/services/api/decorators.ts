import { AxiosRequestConfig } from 'axios'
import { SECURITY_CONFIG } from '@/config'

/**
 * Performance monitoring decorator
 */
export interface PerformanceMetrics {
  requestId: string
  method: string
  url: string
  startTime: number
  endTime?: number
  duration?: number
  size?: number
  cacheHit?: boolean
  retryCount?: number
}

/**
 * Logging levels
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

/**
 * Logger with different levels and formatting
 */
class ApiLogger {
  private level: LogLevel = SECURITY_CONFIG.ENVIRONMENT.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO

  setLevel(level: LogLevel): void {
    this.level = level
  }

  debug(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.DEBUG) {
      console.debug(`🔍 [API-DEBUG]`, message, ...args)
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.INFO) {
      console.info(`ℹ️ [API-INFO]`, message, ...args)
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(`⚠️ [API-WARN]`, message, ...args)
    }
  }

  error(message: string, error?: any, ...args: any[]): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(`❌ [API-ERROR]`, message, error, ...args)
    }
  }

  performance(metrics: PerformanceMetrics): void {
    if (this.level <= LogLevel.DEBUG) {
      const { method, url, duration, size, cacheHit, retryCount } = metrics
      console.group(`📊 [PERFORMANCE] ${method} ${url}`)
      console.log(`Duration: ${duration}ms`)
      if (size) console.log(`Size: ${size} bytes`)
      if (cacheHit !== undefined) console.log(`Cache: ${cacheHit ? 'HIT' : 'MISS'}`)
      if (retryCount) console.log(`Retries: ${retryCount}`)
      console.groupEnd()
    }
  }

  trace(requestId: string, action: string, details?: any): void {
    if (this.level <= LogLevel.DEBUG) {
      console.log(`🔗 [TRACE-${requestId}]`, action, details || '')
    }
  }
}

export const apiLogger = new ApiLogger()

/**
 * Request tracing decorator
 */
export function withTracing(requestId?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const traceId = requestId || `trace-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
      
      apiLogger.trace(traceId, `Starting ${propertyKey}`, {
        args: args.length,
        timestamp: new Date().toISOString()
      })

      const startTime = performance.now()
      
      try {
        const result = await originalMethod.apply(this, args)
        const duration = performance.now() - startTime
        
        apiLogger.trace(traceId, `Completed ${propertyKey}`, {
          duration: `${duration.toFixed(2)}ms`,
          success: true
        })
        
        return result
      } catch (error) {
        const duration = performance.now() - startTime
        
        apiLogger.trace(traceId, `Failed ${propertyKey}`, {
          duration: `${duration.toFixed(2)}ms`,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        throw error
      }
    }

    return descriptor
  }
}

/**
 * Performance monitoring decorator
 */
export function withPerformanceMonitoring() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const metrics: PerformanceMetrics = {
        requestId: `perf-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        method: propertyKey.toUpperCase(),
        url: args[0] || 'unknown',
        startTime: performance.now()
      }

      try {
        const result = await originalMethod.apply(this, args)
        
        metrics.endTime = performance.now()
        metrics.duration = metrics.endTime - metrics.startTime
        
        // Calculate response size if available
        if (result && typeof result === 'object') {
          try {
            metrics.size = JSON.stringify(result).length
          } catch {
            // Ignore size calculation errors
          }
        }

        apiLogger.performance(metrics)
        return result
      } catch (error) {
        metrics.endTime = performance.now()
        metrics.duration = metrics.endTime - metrics.startTime
        
        apiLogger.performance(metrics)
        throw error
      }
    }

    return descriptor
  }
}

/**
 * Caching decorator with TTL
 */
interface CacheEntry {
  data: any
  timestamp: number
  ttl: number
}

class ApiCache {
  private cache = new Map<string, CacheEntry>()
  private maxSize = 100

  set(key: string, data: any, ttl: number = 300000): void { // 5 minutes default
    // Clean expired entries and maintain size limit
    this.cleanup()
    
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey) {
        this.cache.delete(oldestKey)
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  get(key: string): any | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }
  }

  size(): number {
    this.cleanup()
    return this.cache.size
  }
}

const apiCache = new ApiCache()

/**
 * Caching decorator for GET requests
 */
export function withCaching(ttl: number = 300000) { // 5 minutes default
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      // Only cache GET requests
      if (propertyKey.toLowerCase() !== 'get') {
        return originalMethod.apply(this, args)
      }

      const [url, config] = args
      const cacheKey = `${propertyKey}:${url}:${JSON.stringify(config?.params || {})}`
      
      // Check cache first
      const cachedResult = apiCache.get(cacheKey)
      if (cachedResult) {
        apiLogger.debug(`Cache HIT for ${url}`, { cacheKey })
        
        // Add cache metadata
        if (cachedResult && typeof cachedResult === 'object') {
          cachedResult._meta = {
            ...cachedResult._meta,
            cached: true,
            cacheKey
          }
        }
        
        return cachedResult
      }

      apiLogger.debug(`Cache MISS for ${url}`, { cacheKey })

      try {
        const result = await originalMethod.apply(this, args)
        
        // Cache successful results
        if (result && result.success !== false) {
          apiCache.set(cacheKey, result, ttl)
          apiLogger.debug(`Cached result for ${url}`, { cacheKey, ttl })
        }

        return result
      } catch (error) {
        // Don't cache errors
        throw error
      }
    }

    return descriptor
  }
}

/**
 * Rate limiting decorator
 */
class RateLimiter {
  private requests = new Map<string, number[]>()
  private readonly windowMs = 60000 // 1 minute
  private readonly maxRequests = SECURITY_CONFIG.RATE_LIMIT.PER_MINUTE

  isAllowed(identifier: string): boolean {
    const now = Date.now()
    const windowStart = now - this.windowMs
    
    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, [])
    }

    const timestamps = this.requests.get(identifier)!
    
    // Remove old timestamps
    const validTimestamps = timestamps.filter(ts => ts > windowStart)
    this.requests.set(identifier, validTimestamps)

    // Check if under limit
    if (validTimestamps.length < this.maxRequests) {
      validTimestamps.push(now)
      return true
    }

    return false
  }

  getRetryAfter(identifier: string): number {
    const timestamps = this.requests.get(identifier) || []
    if (timestamps.length === 0) return 0

    const oldestTimestamp = Math.min(...timestamps)
    const retryAfter = Math.max(0, this.windowMs - (Date.now() - oldestTimestamp))
    return Math.ceil(retryAfter / 1000) // Convert to seconds
  }
}

const rateLimiter = new RateLimiter()

/**
 * Rate limiting decorator
 */
export function withRateLimit(identifier?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const limitId = identifier || `${propertyKey}:${args[0] || 'default'}`
      
      if (!rateLimiter.isAllowed(limitId)) {
        const retryAfter = rateLimiter.getRetryAfter(limitId)
        apiLogger.warn(`Rate limit exceeded for ${limitId}`, { retryAfter })
        
        throw {
          success: false,
          error_code: 'RATE_LIMIT_EXCEEDED',
          message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
          details: { retryAfter }
        }
      }

      return originalMethod.apply(this, args)
    }

    return descriptor
  }
}

/**
 * Request validation decorator
 */
export function withValidation(validator: (args: any[]) => boolean | string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const validationResult = validator(args)
      
      if (typeof validationResult === 'string') {
        apiLogger.error(`Validation failed for ${propertyKey}`, validationResult)
        throw {
          success: false,
          error_code: 'VALIDATION_ERROR',
          message: validationResult,
          details: { method: propertyKey }
        }
      }

      if (validationResult === false) {
        apiLogger.error(`Validation failed for ${propertyKey}`)
        throw {
          success: false,
          error_code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: { method: propertyKey }
        }
      }

      return originalMethod.apply(this, args)
    }

    return descriptor
  }
}

/**
 * Retry decorator with exponential backoff
 */
export function withRetry(maxAttempts: number = 3, baseDelay: number = 1000) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      let lastError: any

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          return await originalMethod.apply(this, args)
        } catch (error: any) {
          lastError = error
          
          // Don't retry on certain errors
          if (error.error_code === 'VALIDATION_ERROR' || error.error_code === 'UNAUTHORIZED') {
            throw error
          }

          if (attempt === maxAttempts) {
            apiLogger.error(`Final retry attempt failed for ${propertyKey}`, error)
            throw error
          }

          const delay = baseDelay * Math.pow(2, attempt - 1)
          apiLogger.warn(`Retry ${attempt}/${maxAttempts} for ${propertyKey} in ${delay}ms`, error)
          
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }

      throw lastError
    }

    return descriptor
  }
}

/**
 * Composite decorator that applies multiple decorators
 */
export function withApiEnhancements(options: {
  tracing?: boolean
  performance?: boolean
  caching?: boolean | number
  rateLimit?: boolean | string
  validation?: (args: any[]) => boolean | string
  retry?: boolean | { attempts: number, delay: number }
} = {}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    let enhancedDescriptor = descriptor

    // Apply decorators in reverse order (last applied = outermost)
    
    if (options.retry) {
      const retryOptions = typeof options.retry === 'object' ? options.retry : { attempts: 3, delay: 1000 }
      enhancedDescriptor = withRetry(retryOptions.attempts, retryOptions.delay)(target, propertyKey, enhancedDescriptor)
    }

    if (options.validation) {
      enhancedDescriptor = withValidation(options.validation)(target, propertyKey, enhancedDescriptor)
    }

    if (options.rateLimit) {
      const identifier = typeof options.rateLimit === 'string' ? options.rateLimit : undefined
      enhancedDescriptor = withRateLimit(identifier)(target, propertyKey, enhancedDescriptor)
    }

    if (options.caching) {
      const ttl = typeof options.caching === 'number' ? options.caching : 300000
      enhancedDescriptor = withCaching(ttl)(target, propertyKey, enhancedDescriptor)
    }

    if (options.performance) {
      enhancedDescriptor = withPerformanceMonitoring()(target, propertyKey, enhancedDescriptor)
    }

    if (options.tracing) {
      enhancedDescriptor = withTracing()(target, propertyKey, enhancedDescriptor)
    }

    return enhancedDescriptor
  }
}

// Export cache instance for external management
export { apiCache }