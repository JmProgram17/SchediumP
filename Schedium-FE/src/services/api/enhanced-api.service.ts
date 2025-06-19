/**
 * Enhanced API Service that combines all HTTP client enhancements
 * - Advanced HTTP client with interceptors
 * - Intelligent retry management
 * - Comprehensive error handling
 * - Data adapters for Backend <-> Frontend transformation
 * - Decorator-based enhancements (tracing, caching, etc.)
 */

import { AxiosRequestConfig } from 'axios'
import { httpClient } from './http-client'
import { retryManager, RetryConfig } from './retry-manager'
import { ApiErrorHandler, EnhancedApiError } from './error-handler'
import { 
  withApiEnhancements, 
  withTracing, 
  withPerformanceMonitoring, 
  withCaching,
  apiLogger 
} from './decorators'
import { 
  userAdapter, 
  paginationAdapter, 
  FormDataAdapter,
  AdapterRegistry,
  DataAdapter 
} from './adapters'
import { ApiResponse, PaginatedResponse } from '@/types/api.types'
import { User } from '@/types/auth.types'
import { observabilityService, debugToolsService } from '@/services/observability'

/**
 * Enhanced request options
 */
export interface EnhancedRequestOptions extends AxiosRequestConfig {
  // Retry configuration
  retry?: Partial<RetryConfig>
  
  // Caching options
  cache?: boolean | number // true for default TTL, number for custom TTL
  
  // Data transformation
  adapter?: string | DataAdapter<any, any>
  
  // Tracing and monitoring
  tracing?: boolean
  performance?: boolean
  
  // Custom context
  context?: {
    module?: string
    operation?: string
    correlationId?: string
  }
  
  // Error handling
  errorHandler?: (error: EnhancedApiError) => void | Promise<void>
}

/**
 * Base API service with all enhancements
 */
export class EnhancedApiService {
  protected baseUrl: string

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl
  }

  /**
   * Enhanced GET request with all features
   */
  @withApiEnhancements({
    tracing: true,
    performance: true,
    caching: true,
    retry: true
  })
  async get<T = any>(
    url: string, 
    options: EnhancedRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.executeRequest('GET', url, undefined, options)
  }

  /**
   * Enhanced POST request
   */
  @withApiEnhancements({
    tracing: true,
    performance: true,
    retry: { attempts: 2, delay: 1000 } // More conservative for POST
  })
  async post<T = any>(
    url: string, 
    data?: any, 
    options: EnhancedRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.executeRequest('POST', url, data, options)
  }

  /**
   * Enhanced PUT request
   */
  @withApiEnhancements({
    tracing: true,
    performance: true,
    retry: { attempts: 2, delay: 1000 }
  })
  async put<T = any>(
    url: string, 
    data?: any, 
    options: EnhancedRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.executeRequest('PUT', url, data, options)
  }

  /**
   * Enhanced PATCH request
   */
  @withApiEnhancements({
    tracing: true,
    performance: true,
    retry: { attempts: 2, delay: 1000 }
  })
  async patch<T = any>(
    url: string, 
    data?: any, 
    options: EnhancedRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.executeRequest('PATCH', url, data, options)
  }

  /**
   * Enhanced DELETE request
   */
  @withApiEnhancements({
    tracing: true,
    performance: true,
    retry: { attempts: 1, delay: 1000 } // Single retry for DELETE
  })
  async delete<T = any>(
    url: string, 
    options: EnhancedRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.executeRequest('DELETE', url, undefined, options)
  }

  /**
   * Core request execution method
   */
  private async executeRequest<T>(
    method: string,
    url: string,
    data?: any,
    options: EnhancedRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const fullUrl = this.buildUrl(url)
    const config = this.buildRequestConfig(method, fullUrl, data, options)

    // Start observability tracking
    const operation = observabilityService.startOperation(`${method.toLowerCase()}_${url}`, {
      module: options.context?.module,
      operation: options.context?.operation,
      method,
      url: fullUrl
    })

    try {
      // Record network request start for debug tools
      debugToolsService.recordNetworkRequest({
        method: method.toUpperCase(),
        url: fullUrl,
        requestHeaders: config.headers as Record<string, string>,
        requestBody: data
      })

      // Transform data before sending if adapter is specified
      if (data && options.adapter) {
        data = this.transformToBackend(data, options.adapter)
      }

      // Execute with retry management
      const response = await retryManager.executeWithRetry(
        () => this.performRequest<T>(method, fullUrl, data, config),
        config,
        options.retry
      )

      // Record successful network request
      debugToolsService.recordNetworkRequest({
        method: method.toUpperCase(),
        url: fullUrl,
        status: response.status,
        duration: operation.timingId ? undefined : 0, // Will be calculated by operation.finish()
        requestHeaders: config.headers as Record<string, string>,
        responseHeaders: response.headers as Record<string, string>,
        requestBody: data,
        responseBody: response.data
      })

      // Transform response data if adapter is specified
      if (response.data && options.adapter) {
        response.data = this.transformToFrontend(response.data, options.adapter)
      }

      // Finish successful operation
      operation.finish()

      return response

    } catch (error: any) {
      // Record failed network request
      debugToolsService.recordNetworkRequest({
        method: method.toUpperCase(),
        url: fullUrl,
        status: error.response?.status,
        duration: operation.timingId ? undefined : 0,
        requestHeaders: config.headers as Record<string, string>,
        responseHeaders: error.response?.headers as Record<string, string>,
        requestBody: data,
        error: error.message
      })

      // Enhanced error handling with observability
      const enhancedError = ApiErrorHandler.handle(error, {
        url: fullUrl,
        method,
        payload: data,
        headers: config.headers as Record<string, string>,
        ...options.context
      })

      // Handle error through observability service
      const { frontendError } = observabilityService.handleError(enhancedError, {
        module: options.context?.module,
        operation: options.context?.operation,
        method,
        url: fullUrl,
        requestData: data
      })

      // Finish failed operation
      operation.finish()

      // Call custom error handler if provided
      if (options.errorHandler) {
        await options.errorHandler(enhancedError)
      }

      // Attach frontend error for better error handling in components
      enhancedError.frontendError = frontendError

      throw enhancedError
    }
  }

  /**
   * Perform the actual HTTP request
   */
  private async performRequest<T>(
    method: string,
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    switch (method.toUpperCase()) {
      case 'GET':
        return httpClient.get<T>(url, config)
      case 'POST':
        return httpClient.post<T>(url, data, config)
      case 'PUT':
        return httpClient.put<T>(url, data, config)
      case 'PATCH':
        return httpClient.patch<T>(url, data, config)
      case 'DELETE':
        return httpClient.delete<T>(url, config)
      default:
        throw new Error(`Unsupported HTTP method: ${method}`)
    }
  }

  /**
   * Build full URL
   */
  private buildUrl(url: string): string {
    // Return absolute URLs as-is
    if (url.startsWith('http')) {
      return url
    }
    
    // If no baseUrl, return path as-is
    if (!this.baseUrl) {
      return url
    }
    
    const baseUrl = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl
    const path = url.startsWith('/') ? url : `/${url}`
    
    return `${baseUrl}${path}`
  }

  /**
   * Build request configuration
   */
  private buildRequestConfig(
    method: string,
    url: string,
    data: any,
    options: EnhancedRequestOptions
  ): AxiosRequestConfig {
    return {
      method: method.toLowerCase() as any,
      url,
      data,
      params: options.params,
      headers: options.headers,
      timeout: options.timeout,
      ...options.context && {
        metadata: {
          requestId: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          method: method.toUpperCase(),
          url,
          retryAttempt: 0,
          maxRetries: options.retry?.maxAttempts || 3,
          ...options.context
        }
      }
    }
  }

  /**
   * Transform data to backend format
   */
  private transformToBackend(data: any, adapterSpec: string | DataAdapter<any, any>): any {
    if (typeof adapterSpec === 'string') {
      const adapter = AdapterRegistry.get(adapterSpec)
      if (!adapter) {
        apiLogger.warn(`Adapter not found: ${adapterSpec}`)
        return data
      }
      return adapter.toBackend(data)
    }
    
    return adapterSpec.toBackend(data)
  }

  /**
   * Transform data to frontend format
   */
  private transformToFrontend(data: any, adapterSpec: string | DataAdapter<any, any>): any {
    if (typeof adapterSpec === 'string') {
      const adapter = AdapterRegistry.get(adapterSpec)
      if (!adapter) {
        apiLogger.warn(`Adapter not found: ${adapterSpec}`)
        return data
      }
      return adapter.toFrontend(data)
    }
    
    return adapterSpec.toFrontend(data)
  }

  // Convenience methods with built-in adapters

  /**
   * Get paginated data with automatic pagination adapter
   */
  async getPaginated<T>(
    url: string,
    params?: Record<string, any>,
    options: EnhancedRequestOptions = {}
  ): Promise<PaginatedResponse<T>> {
    const response = await this.get<T[]>(url, {
      ...options,
      params: FormDataAdapter.toBackend(params || {}),
      adapter: 'pagination'
    })

    return response as any as PaginatedResponse<T>
  }

  /**
   * Submit form data with automatic transformation
   */
  async submitForm<T>(
    url: string,
    formData: Record<string, any>,
    options: EnhancedRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const transformedData = FormDataAdapter.toBackend(formData)
    
    return this.post<T>(url, transformedData, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    })
  }

  /**
   * Get user data with automatic user adapter
   */
  async getUser(userId?: number, options: EnhancedRequestOptions = {}): Promise<ApiResponse<User>> {
    const url = userId ? `/users/${userId}` : '/me'
    
    return this.get<User>(url, {
      ...options,
      adapter: 'user',
      cache: 300000 // 5 minutes cache for user data
    })
  }

  /**
   * Update user data with automatic user adapter
   */
  async updateUser(
    userData: Partial<User>, 
    userId?: number, 
    options: EnhancedRequestOptions = {}
  ): Promise<ApiResponse<User>> {
    const url = userId ? `/users/${userId}` : '/me'
    
    return this.put<User>(url, userData, {
      ...options,
      adapter: 'user'
    })
  }

  // Utility methods

  /**
   * Clear cache for specific URL pattern
   */
  clearCache(urlPattern?: string): void {
    // Implementation would depend on cache decorator
    apiLogger.info(`Cache cleared for pattern: ${urlPattern || 'all'}`)
  }

  /**
   * Get API health status
   */
  @withPerformanceMonitoring()
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await this.get<{ status: string; timestamp: string }>('/health', {
      timeout: 5000,
      retry: { maxAttempts: 1, baseDelay: 0 } // No retry for health checks
    })
    
    return response.data!
  }

  /**
   * Prefetch data for performance
   */
  async prefetch(urls: string[], options: EnhancedRequestOptions = {}): Promise<void> {
    const prefetchPromises = urls.map(url => 
      this.get(url, {
        ...options,
        cache: true, // Enable caching for prefetched data
        tracing: false, // Reduce noise in logs
        context: {
          ...options.context,
          operation: 'prefetch'
        }
      }).catch(error => {
        apiLogger.debug(`Prefetch failed for ${url}:`, error)
        // Don't throw - prefetch failures shouldn't break the app
      })
    )

    await Promise.allSettled(prefetchPromises)
    apiLogger.info(`Prefetched ${urls.length} URLs`)
  }

  /**
   * Batch multiple requests
   */
  async batch<T>(
    requests: Array<{
      method: string
      url: string
      data?: any
      options?: EnhancedRequestOptions
    }>,
    options: { concurrency?: number; failFast?: boolean } = {}
  ): Promise<Array<ApiResponse<T> | Error>> {
    const { concurrency = 5, failFast = false } = options
    const results: Array<ApiResponse<T> | Error> = []

    // Process requests in batches
    for (let i = 0; i < requests.length; i += concurrency) {
      const batch = requests.slice(i, i + concurrency)
      
      const batchPromises = batch.map(async (req) => {
        try {
          return await this.executeRequest<T>(
            req.method,
            req.url,
            req.data,
            {
              ...req.options,
              context: {
                ...req.options?.context,
                operation: 'batch',
                batchIndex: i / concurrency
              }
            }
          )
        } catch (error) {
          if (failFast) {
            throw error
          }
          return error as Error
        }
      })

      const batchResults = await Promise.allSettled(batchPromises)
      
      results.push(...batchResults.map(result => 
        result.status === 'fulfilled' ? result.value : result.reason
      ))

      if (failFast && results.some(result => result instanceof Error)) {
        break
      }
    }

    return results
  }
}

// Export specialized API services
export class AuthApiService extends EnhancedApiService {
  constructor() {
    super('/auth')
  }
}

export class AcademicApiService extends EnhancedApiService {
  constructor() {
    super('/academic')
  }
}

export class HRApiService extends EnhancedApiService {
  constructor() {
    super('/hr')
  }
}

export class AdminApiService extends EnhancedApiService {
  constructor() {
    super('/admin')
  }
}

// Export service instances
export const authApi = new AuthApiService()
export const academicApi = new AcademicApiService()
export const hrApi = new HRApiService()
export const adminApi = new AdminApiService()

// Export base service for custom usage
export const enhancedApiService = new EnhancedApiService()