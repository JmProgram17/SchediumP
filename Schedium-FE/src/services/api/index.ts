/**
 * API Layer - Phase 2: Centralized HTTP Client
 * 
 * This module provides a comprehensive HTTP client with:
 * - Advanced interceptors (auth, error, retry)
 * - Intelligent retry management with circuit breakers
 * - Comprehensive error handling with discriminated unions
 * - Data adapters for Backend <-> Frontend transformation
 * - Decorator-based enhancements (tracing, caching, performance)
 * - Request deduplication and circuit breaker patterns
 */

// Core HTTP client
export { httpClient, HttpClient } from './http-client'

// Enhanced API services
export { 
  EnhancedApiService,
  AuthApiService,
  AcademicApiService,
  HRApiService,
  AdminApiService,
  authApi,
  academicApi,
  hrApi,
  adminApi,
  enhancedApiService
} from './enhanced-api.service'

// Retry management
export { 
  retryManager,
  RetryManager,
  RetryStrategy,
  CircuitState
} from './retry-manager'
export type { RetryConfig, RetryAttempt } from './retry-manager'

// Error handling
export { 
  ApiErrorHandler,
  ErrorClassifier,
  ErrorSeverity,
  RecoveryStrategy
} from './error-handler'
export type {
  ApiError,
  EnhancedApiError,
  NetworkError,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  BusinessError,
  RateLimitError,
  ServerError,
  ClientError,
  TimeoutError,
  ErrorContext,
  ErrorRecovery
} from './error-handler'

// Type guards for error handling
export {
  isNetworkError,
  isAuthenticationError,
  isAuthorizationError,
  isValidationError,
  isBusinessError,
  isRateLimitError,
  isServerError,
  isClientError,
  isTimeoutError
} from './error-handler'

// Data adapters
export {
  FieldMapper,
  DateAdapter,
  UserAdapter,
  PaginationAdapter,
  ListResponseAdapter,
  ErrorResponseAdapter,
  QueryParamsAdapter,
  FormDataAdapter,
  AdapterRegistry,
  userAdapter,
  paginationAdapter,
  errorResponseAdapter,
  queryParamsAdapter
} from './adapters'
export type { DataAdapter } from './adapters'

// Decorators and utilities
export {
  apiLogger,
  apiCache,
  LogLevel,
  withTracing,
  withPerformanceMonitoring,
  withCaching,
  withRateLimit,
  withValidation,
  withRetry,
  withApiEnhancements
} from './decorators'
export type { PerformanceMetrics } from './decorators'

// Enhanced request options
export type { EnhancedRequestOptions } from './enhanced-api.service'

// Legacy export for backward compatibility
export { axiosClient } from './axios-client'

/**
 * Quick start guide for using the enhanced API layer:
 * 
 * 1. Basic usage:
 *    ```typescript
 *    import { academicApi } from '@/services/api'
 *    
 *    const students = await academicApi.get('/students')
 *    ```
 * 
 * 2. With enhancements:
 *    ```typescript
 *    const students = await academicApi.get('/students', {
 *      cache: 300000, // 5 minutes cache
 *      retry: { maxAttempts: 3 },
 *      tracing: true
 *    })
 *    ```
 * 
 * 3. With data transformation:
 *    ```typescript
 *    const user = await authApi.get('/me', {
 *      adapter: 'user' // Automatically transforms snake_case to camelCase
 *    })
 *    ```
 * 
 * 4. Error handling:
 *    ```typescript
 *    try {
 *      await academicApi.post('/students', studentData)
 *    } catch (error) {
 *      if (isValidationError(error)) {
 *        // Handle validation errors
 *        console.log(error.details.validationErrors)
 *      } else if (isAuthenticationError(error)) {
 *        // Redirect to login
 *        router.push('/login')
 *      }
 *    }
 *    ```
 * 
 * 5. Advanced features:
 *    ```typescript
 *    // Batch requests
 *    const results = await enhancedApiService.batch([
 *      { method: 'GET', url: '/students' },
 *      { method: 'GET', url: '/instructors' }
 *    ])
 *    
 *    // Prefetch data
 *    await enhancedApiService.prefetch(['/students', '/courses'])
 *    
 *    // Health check
 *    const health = await enhancedApiService.healthCheck()
 *    ```
 */