/**
 * Intelligent retry management system
 * Handles different retry strategies based on error types and context
 */

import { AxiosRequestConfig } from 'axios'
import { ApiError, EnhancedApiError, ErrorClassifier, RecoveryStrategy } from './error-handler'
import { apiLogger } from './decorators'
import { API_CONFIG } from '@/config'

/**
 * Retry strategy configuration
 */
export interface RetryConfig {
  maxAttempts: number
  baseDelay: number
  maxDelay: number
  backoffFactor: number
  jitter: boolean
  retryCondition?: (error: ApiError, attempt: number) => boolean
}

/**
 * Retry attempt information
 */
export interface RetryAttempt {
  attempt: number
  maxAttempts: number
  delay: number
  error: ApiError
  strategy: RetryStrategy
  startTime: number
}

/**
 * Retry strategies
 */
export enum RetryStrategy {
  IMMEDIATE = 'immediate',
  FIXED_DELAY = 'fixed_delay',
  EXPONENTIAL_BACKOFF = 'exponential_backoff',
  LINEAR_BACKOFF = 'linear_backoff',
  ADAPTIVE = 'adaptive'
}

/**
 * Circuit breaker states
 */
export enum CircuitState {
  CLOSED = 'closed',      // Normal operation
  OPEN = 'open',          // Failing fast
  HALF_OPEN = 'half_open' // Testing if service recovered
}

/**
 * Circuit breaker configuration
 */
interface CircuitBreakerConfig {
  failureThreshold: number
  recoveryTimeout: number
  monitoringPeriod: number
}

/**
 * Circuit breaker for preventing cascade failures
 */
class CircuitBreaker {
  private state = CircuitState.CLOSED
  private failureCount = 0
  private lastFailureTime = 0
  private successCount = 0

  constructor(private config: CircuitBreakerConfig) {}

  async call<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime > this.config.recoveryTimeout) {
        this.state = CircuitState.HALF_OPEN
        this.successCount = 0
        apiLogger.info('Circuit breaker entering HALF_OPEN state')
      } else {
        throw new Error('Circuit breaker is OPEN - service unavailable')
      }
    }

    try {
      const result = await operation()
      
      if (this.state === CircuitState.HALF_OPEN) {
        this.successCount++
        if (this.successCount >= 3) { // 3 successful calls to close
          this.reset()
          apiLogger.info('Circuit breaker CLOSED - service recovered')
        }
      }
      
      return result
    } catch (error) {
      this.recordFailure()
      throw error
    }
  }

  private recordFailure(): void {
    this.failureCount++
    this.lastFailureTime = Date.now()

    if (this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN
      apiLogger.warn(`Circuit breaker OPEN after ${this.failureCount} failures`)
    } else if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.OPEN
      apiLogger.warn('Circuit breaker back to OPEN from HALF_OPEN')
    }
  }

  private reset(): void {
    this.state = CircuitState.CLOSED
    this.failureCount = 0
    this.successCount = 0
  }

  getState(): CircuitState {
    return this.state
  }

  getStats(): { state: CircuitState; failures: number; lastFailure: number } {
    return {
      state: this.state,
      failures: this.failureCount,
      lastFailure: this.lastFailureTime
    }
  }
}

/**
 * Adaptive retry configuration based on error patterns
 */
class AdaptiveRetryManager {
  private errorHistory = new Map<string, { count: number; lastSeen: number; avgDelay: number }>()
  private successRates = new Map<string, { attempts: number; successes: number }>()

  /**
   * Get adaptive retry config based on historical data
   */
  getAdaptiveConfig(url: string, method: string): RetryConfig {
    const key = `${method}:${url}`
    const history = this.errorHistory.get(key)
    const successRate = this.successRates.get(key)

    if (!history || !successRate) {
      // No history, use default config
      return this.getDefaultConfig()
    }

    const errorRate = history.count / (history.count + successRate.successes)
    const recentFailures = Date.now() - history.lastSeen < 300000 // 5 minutes

    // Adjust retry behavior based on patterns
    if (errorRate > 0.5 && recentFailures) {
      // High error rate with recent failures - be more aggressive
      return {
        maxAttempts: 5,
        baseDelay: 2000,
        maxDelay: 30000,
        backoffFactor: 2,
        jitter: true
      }
    } else if (errorRate < 0.1) {
      // Low error rate - be more conservative
      return {
        maxAttempts: 2,
        baseDelay: 500,
        maxDelay: 5000,
        backoffFactor: 1.5,
        jitter: true
      }
    }

    return this.getDefaultConfig()
  }

  /**
   * Record error for adaptive learning
   */
  recordError(url: string, method: string, delay: number): void {
    const key = `${method}:${url}`
    const history = this.errorHistory.get(key) || { count: 0, lastSeen: 0, avgDelay: 0 }
    
    history.count++
    history.lastSeen = Date.now()
    history.avgDelay = (history.avgDelay + delay) / 2
    
    this.errorHistory.set(key, history)
  }

  /**
   * Record success for adaptive learning
   */
  recordSuccess(url: string, method: string): void {
    const key = `${method}:${url}`
    const stats = this.successRates.get(key) || { attempts: 0, successes: 0 }
    
    stats.attempts++
    stats.successes++
    
    this.successRates.set(key, stats)
  }

  /**
   * Record attempt (for calculating success rates)
   */
  recordAttempt(url: string, method: string): void {
    const key = `${method}:${url}`
    const stats = this.successRates.get(key) || { attempts: 0, successes: 0 }
    
    stats.attempts++
    
    this.successRates.set(key, stats)
  }

  private getDefaultConfig(): RetryConfig {
    return {
      maxAttempts: API_CONFIG.RETRY_ATTEMPTS,
      baseDelay: API_CONFIG.RETRY_DELAY,
      maxDelay: 10000,
      backoffFactor: 2,
      jitter: true
    }
  }

  /**
   * Clean old entries to prevent memory leaks
   */
  cleanup(): void {
    const now = Date.now()
    const maxAge = 3600000 // 1 hour

    for (const [key, history] of this.errorHistory.entries()) {
      if (now - history.lastSeen > maxAge) {
        this.errorHistory.delete(key)
        this.successRates.delete(key)
      }
    }
  }
}

/**
 * Main retry manager class
 */
export class RetryManager {
  private circuitBreakers = new Map<string, CircuitBreaker>()
  private adaptiveManager = new AdaptiveRetryManager()
  private activeRetries = new Map<string, Promise<any>>()

  constructor() {
    // Cleanup old adaptive data periodically
    setInterval(() => {
      this.adaptiveManager.cleanup()
    }, 300000) // 5 minutes
  }

  /**
   * Execute operation with retry logic
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: AxiosRequestConfig,
    customRetryConfig?: Partial<RetryConfig>
  ): Promise<T> {
    const url = config.url || ''
    const method = config.method?.toUpperCase() || 'GET'
    const retryKey = `${method}:${url}`

    // Check if same request is already being retried
    if (this.activeRetries.has(retryKey)) {
      apiLogger.debug(`Deduplicating retry request: ${retryKey}`)
      return this.activeRetries.get(retryKey)!
    }

    // Get circuit breaker for this endpoint
    const circuitBreaker = this.getCircuitBreaker(url)
    
    // Get retry configuration
    const retryConfig = this.getRetryConfig(url, method, customRetryConfig)
    
    // Create retry promise
    const retryPromise = this.performRetryOperation(
      operation,
      retryConfig,
      url,
      method,
      circuitBreaker
    )

    // Store active retry
    this.activeRetries.set(retryKey, retryPromise)

    try {
      const result = await retryPromise
      this.adaptiveManager.recordSuccess(url, method)
      return result
    } finally {
      this.activeRetries.delete(retryKey)
    }
  }

  /**
   * Perform the actual retry operation
   */
  private async performRetryOperation<T>(
    operation: () => Promise<T>,
    config: RetryConfig,
    url: string,
    method: string,
    circuitBreaker: CircuitBreaker
  ): Promise<T> {
    let lastError: any
    
    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      this.adaptiveManager.recordAttempt(url, method)
      
      try {
        return await circuitBreaker.call(operation)
      } catch (error: any) {
        lastError = error
        
        // Determine if we should retry
        if (!this.shouldRetry(error, attempt, config)) {
          apiLogger.debug(`Not retrying ${method} ${url} - condition not met`, {
            attempt,
            error: error.type || error.message
          })
          break
        }

        if (attempt === config.maxAttempts) {
          apiLogger.warn(`Max retry attempts reached for ${method} ${url}`, {
            attempts: attempt,
            error: error.type || error.message
          })
          break
        }

        // Calculate delay for next attempt
        const delay = this.calculateDelay(attempt, config)
        
        apiLogger.info(`Retrying ${method} ${url} (${attempt}/${config.maxAttempts}) in ${delay}ms`, {
          error: error.type || error.message,
          strategy: this.getRetryStrategy(config)
        })

        // Record error for adaptive learning
        this.adaptiveManager.recordError(url, method, delay)

        // Wait before retry
        await this.sleep(delay)
      }
    }

    throw lastError
  }

  /**
   * Determine if error should be retried
   */
  private shouldRetry(error: any, attempt: number, config: RetryConfig): boolean {
    // Use custom retry condition if provided
    if (config.retryCondition) {
      return config.retryCondition(error, attempt)
    }

    // Don't retry if max attempts reached
    if (attempt >= config.maxAttempts) {
      return false
    }

    // Use error classifier to determine retryability
    if (error.type) {
      return ErrorClassifier.isRetryable(error)
    }

    // Default axios error handling
    if (error.response) {
      const status = error.response.status
      // Retry on server errors and rate limits
      return status >= 500 || status === 429 || status === 408
    }

    // Retry network errors
    return !error.response
  }

  /**
   * Calculate delay for next retry attempt
   */
  private calculateDelay(attempt: number, config: RetryConfig): number {
    let delay: number

    switch (this.getRetryStrategy(config)) {
      case RetryStrategy.IMMEDIATE:
        delay = 0
        break
      
      case RetryStrategy.FIXED_DELAY:
        delay = config.baseDelay
        break
      
      case RetryStrategy.LINEAR_BACKOFF:
        delay = config.baseDelay * attempt
        break
      
      case RetryStrategy.EXPONENTIAL_BACKOFF:
      default:
        delay = config.baseDelay * Math.pow(config.backoffFactor, attempt - 1)
        break
    }

    // Apply jitter to prevent thundering herd
    if (config.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5) // ±50% jitter
    }

    // Ensure delay is within bounds
    return Math.min(Math.max(delay, 0), config.maxDelay)
  }

  /**
   * Get retry strategy from config
   */
  private getRetryStrategy(config: RetryConfig): RetryStrategy {
    if (config.backoffFactor === 1) {
      return config.baseDelay === 0 ? RetryStrategy.IMMEDIATE : RetryStrategy.FIXED_DELAY
    }
    
    return RetryStrategy.EXPONENTIAL_BACKOFF
  }

  /**
   * Get retry configuration for endpoint
   */
  private getRetryConfig(url: string, method: string, customConfig?: Partial<RetryConfig>): RetryConfig {
    // Start with adaptive config
    const adaptiveConfig = this.adaptiveManager.getAdaptiveConfig(url, method)
    
    // Apply custom overrides
    return {
      ...adaptiveConfig,
      ...customConfig
    }
  }

  /**
   * Get or create circuit breaker for endpoint
   */
  private getCircuitBreaker(url: string): CircuitBreaker {
    if (!this.circuitBreakers.has(url)) {
      const config: CircuitBreakerConfig = {
        failureThreshold: 5,
        recoveryTimeout: 60000, // 1 minute
        monitoringPeriod: 300000 // 5 minutes
      }
      
      this.circuitBreakers.set(url, new CircuitBreaker(config))
    }
    
    return this.circuitBreakers.get(url)!
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Get retry statistics
   */
  getRetryStats(): {
    circuitBreakers: Record<string, { state: CircuitState; failures: number; lastFailure: number }>
    activeRetries: string[]
  } {
    const circuitBreakerStats: Record<string, any> = {}
    
    for (const [url, breaker] of this.circuitBreakers.entries()) {
      circuitBreakerStats[url] = breaker.getStats()
    }

    return {
      circuitBreakers: circuitBreakerStats,
      activeRetries: Array.from(this.activeRetries.keys())
    }
  }

  /**
   * Reset circuit breaker for specific endpoint
   */
  resetCircuitBreaker(url: string): void {
    this.circuitBreakers.delete(url)
    apiLogger.info(`Circuit breaker reset for ${url}`)
  }

  /**
   * Reset all circuit breakers
   */
  resetAllCircuitBreakers(): void {
    this.circuitBreakers.clear()
    apiLogger.info('All circuit breakers reset')
  }

  /**
   * Clear active retries (for cleanup)
   */
  clearActiveRetries(): void {
    this.activeRetries.clear()
  }
}

// Export singleton instance
export const retryManager = new RetryManager()