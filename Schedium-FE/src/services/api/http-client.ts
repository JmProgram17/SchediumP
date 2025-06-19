import axios, { 
  AxiosInstance, 
  AxiosRequestConfig, 
  AxiosResponse, 
  AxiosError,
  InternalAxiosRequestConfig
} from 'axios'
import { API_CONFIG, SECURITY_CONFIG } from '@/config'
import { tokenService } from '@/services/auth/token.service'
import { ApiResponse, ApiError } from '@/types/api.types'

/**
 * HTTP Request Context for enhanced tracking and debugging
 */
export interface RequestContext {
  requestId: string
  timestamp: number
  method: string
  url: string
  correlationId?: string
  userId?: string
  retryAttempt: number
  maxRetries: number
}

/**
 * Enhanced HTTP Client with interceptors, retry logic, and comprehensive error handling
 */
class HttpClient {
  private client: AxiosInstance
  private requestQueue = new Map<string, Promise<any>>()
  private activeRequests = new Set<string>()

  constructor() {
    this.client = this.createAxiosInstance()
    this.setupInterceptors()
  }

  /**
   * Create configured axios instance
   */
  private createAxiosInstance(): AxiosInstance {
    return axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      withCredentials: false, // Simplified CORS for now
      maxBodyLength: SECURITY_CONFIG.API.MAX_REQUEST_SIZE,
      maxContentLength: SECURITY_CONFIG.API.MAX_REQUEST_SIZE,
    })
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      this.handleRequest.bind(this),
      this.handleRequestError.bind(this)
    )

    // Response interceptor
    this.client.interceptors.response.use(
      this.handleResponse.bind(this),
      this.handleResponseError.bind(this)
    )
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get request context from config
   */
  private getRequestContext(config: InternalAxiosRequestConfig): RequestContext {
    return config.metadata as RequestContext || {
      requestId: this.generateRequestId(),
      timestamp: Date.now(),
      method: config.method?.toUpperCase() || 'GET',
      url: config.url || '',
      retryAttempt: 0,
      maxRetries: API_CONFIG.RETRY_ATTEMPTS
    }
  }

  /**
   * Enhanced request handler with authentication and validation
   */
  private async handleRequest(config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> {
    const context = this.getRequestContext(config)
    
    // Store context in config for later use
    config.metadata = context

    // Add request tracking headers
    config.headers[API_CONFIG.REQUEST_ID_HEADER] = context.requestId
    
    // Add correlation ID if available
    if (context.correlationId) {
      config.headers['X-Correlation-ID'] = context.correlationId
    }

    // Skip authentication for public endpoints
    if (this.isPublicEndpoint(config.url || '')) {
      console.log(`🔓 [HTTP] Public request: ${context.method} ${context.url} (${context.requestId})`)
      return config
    }

    // Get valid access token (auto-refreshes if needed)
    try {
      const token = await tokenService.getValidAccessToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
        
        // Add user context from token
        const userInfo = tokenService.getUserFromToken(token)
        if (userInfo) {
          context.userId = userInfo.user_id
          config.headers['X-User-ID'] = userInfo.user_id
        }
      } else {
        console.warn(`⚠️ [HTTP] No valid token for protected endpoint: ${context.url}`)
      }
    } catch (error) {
      console.error(`❌ [HTTP] Failed to get access token for request: ${context.requestId}`, error)
    }

    // Validate request payload size
    if (config.data) {
      const payloadSize = JSON.stringify(config.data).length
      if (payloadSize > SECURITY_CONFIG.API.MAX_REQUEST_SIZE) {
        throw new Error(`Request payload too large: ${payloadSize} bytes`)
      }
    }

    // Check for duplicate requests (request deduplication)
    const requestKey = `${config.method}:${config.url}:${JSON.stringify(config.params)}`
    if (this.activeRequests.has(requestKey)) {
      console.log(`🔄 [HTTP] Duplicate request detected, reusing: ${context.requestId}`)
      const existingPromise = this.requestQueue.get(requestKey)
      if (existingPromise) {
        return existingPromise
      }
    }

    this.activeRequests.add(requestKey)

    console.log(`📤 [HTTP] ${context.method} ${context.url} (${context.requestId}) - Attempt ${context.retryAttempt + 1}/${context.maxRetries + 1}`)
    
    return config
  }

  /**
   * Handle request errors
   */
  private handleRequestError(error: AxiosError): Promise<never> {
    console.error('❌ [HTTP] Request interceptor error:', error)
    return Promise.reject(this.normalizeError(error))
  }

  /**
   * Enhanced response handler with logging and validation
   */
  private handleResponse(response: AxiosResponse): AxiosResponse {
    const context = response.config.metadata as RequestContext
    const requestId = context?.requestId || 'unknown'
    const duration = context ? Date.now() - context.timestamp : 0

    // Remove from active requests
    const requestKey = `${response.config.method}:${response.config.url}:${JSON.stringify(response.config.params)}`
    this.activeRequests.delete(requestKey)
    this.requestQueue.delete(requestKey)

    // Log successful response
    console.log(`✅ [HTTP] ${response.status} ${context?.method} ${context?.url} (${requestId}) - ${duration}ms`)

    // Validate response headers in development
    if (SECURITY_CONFIG.ENVIRONMENT.isDevelopment) {
      this.validateSecurityHeaders(response)
    }

    // Add response metadata
    if (response.data && typeof response.data === 'object') {
      response.data._meta = {
        requestId,
        duration,
        timestamp: Date.now(),
        cached: false
      }
    }

    return response
  }

  /**
   * Enhanced error handler with retry logic and detailed logging
   */
  private async handleResponseError(error: AxiosError<ApiError>): Promise<never> {
    const context = error.config?.metadata as RequestContext
    const requestId = context?.requestId || 'unknown'
    const duration = context ? Date.now() - context.timestamp : 0

    // Remove from active requests
    if (error.config) {
      const requestKey = `${error.config.method}:${error.config.url}:${JSON.stringify(error.config.params)}`
      this.activeRequests.delete(requestKey)
      this.requestQueue.delete(requestKey)
    }

    console.error(`❌ [HTTP] ${error.response?.status || 'Network'} ${context?.method} ${context?.url} (${requestId}) - ${duration}ms`)

    // Handle network errors
    if (!error.response) {
      const networkError = this.createNetworkError(error, context)
      
      // Retry network errors
      if (context && this.shouldRetry(error, context)) {
        return this.retryRequest(error.config!, context)
      }
      
      return Promise.reject(networkError)
    }

    // Handle HTTP errors
    const httpError = this.handleHttpError(error, context)

    // Retry certain HTTP errors
    if (context && this.shouldRetry(error, context)) {
      return this.retryRequest(error.config!, context)
    }

    return Promise.reject(httpError)
  }

  /**
   * Determine if request should be retried
   */
  private shouldRetry(error: AxiosError, context: RequestContext): boolean {
    // Don't retry if max attempts reached
    if (context.retryAttempt >= context.maxRetries) {
      return false
    }

    // Don't retry certain HTTP methods
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(context.method)) {
      return false
    }

    // Retry network errors
    if (!error.response) {
      return true
    }

    // Retry specific status codes
    const retryableStatuses = [408, 429, 500, 502, 503, 504]
    return retryableStatuses.includes(error.response.status)
  }

  /**
   * Retry failed request with exponential backoff
   */
  private async retryRequest(config: InternalAxiosRequestConfig, context: RequestContext): Promise<any> {
    const delay = Math.min(1000 * Math.pow(2, context.retryAttempt), 10000) // Max 10s delay
    
    console.log(`🔄 [HTTP] Retrying request ${context.requestId} in ${delay}ms (attempt ${context.retryAttempt + 1}/${context.maxRetries + 1})`)
    
    await new Promise(resolve => setTimeout(resolve, delay))
    
    // Update retry attempt
    context.retryAttempt += 1
    config.metadata = context
    
    return this.client.request(config)
  }

  /**
   * Check if endpoint is public (doesn't require authentication)
   */
  private isPublicEndpoint(url: string): boolean {
    return SECURITY_CONFIG.API.PUBLIC_ENDPOINTS.some(endpoint => 
      url.includes(endpoint)
    )
  }

  /**
   * Validate security headers in development
   */
  private validateSecurityHeaders(response: AxiosResponse): void {
    const expectedHeaders = SECURITY_CONFIG.CORS.EXPOSED_HEADERS
    const missingHeaders = expectedHeaders.filter(header => 
      !response.headers[header.toLowerCase()]
    )
    
    if (missingHeaders.length > 0) {
      console.warn(`⚠️ [SECURITY] Missing expected headers: ${missingHeaders.join(', ')}`)
    }
  }

  /**
   * Create standardized network error
   */
  private createNetworkError(error: AxiosError, context?: RequestContext): ApiError {
    return {
      success: false,
      error_code: 'NETWORK_ERROR',
      message: 'Error de conexión. Verifique su conexión a internet.',
      details: {
        originalError: error.message,
        requestId: context?.requestId,
        timestamp: Date.now()
      }
    }
  }

  /**
   * Handle different types of HTTP errors
   */
  private handleHttpError(error: AxiosError<ApiError>, context?: RequestContext): ApiError {
    const status = error.response?.status || 0
    const data = error.response?.data

    // Use backend error if available
    if (data && data.error_code) {
      return {
        ...data,
        details: {
          ...data.details,
          requestId: context?.requestId,
          timestamp: Date.now()
        }
      }
    }

    // Create standardized error based on status code
    const errorMap: Record<number, Omit<ApiError, 'details'>> = {
      400: {
        success: false,
        error_code: 'BAD_REQUEST',
        message: 'Solicitud inválida. Verifique los datos enviados.'
      },
      401: {
        success: false,
        error_code: 'UNAUTHORIZED',
        message: 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.'
      },
      403: {
        success: false,
        error_code: 'FORBIDDEN',
        message: 'No tiene permisos para realizar esta acción.'
      },
      404: {
        success: false,
        error_code: 'NOT_FOUND',
        message: 'El recurso solicitado no fue encontrado.'
      },
      409: {
        success: false,
        error_code: 'CONFLICT',
        message: 'Conflicto con el estado actual del recurso.'
      },
      422: {
        success: false,
        error_code: 'VALIDATION_ERROR',
        message: 'Los datos proporcionados no son válidos.'
      },
      429: {
        success: false,
        error_code: 'RATE_LIMIT_EXCEEDED',
        message: 'Demasiadas solicitudes. Intente nuevamente más tarde.'
      },
      500: {
        success: false,
        error_code: 'INTERNAL_SERVER_ERROR',
        message: 'Error interno del servidor. Intente nuevamente más tarde.'
      },
      502: {
        success: false,
        error_code: 'BAD_GATEWAY',
        message: 'Error de conexión con el servidor.'
      },
      503: {
        success: false,
        error_code: 'SERVICE_UNAVAILABLE',
        message: 'Servicio temporalmente no disponible.'
      },
      504: {
        success: false,
        error_code: 'GATEWAY_TIMEOUT',
        message: 'Tiempo de espera agotado. Intente nuevamente.'
      }
    }

    const standardError = errorMap[status] || {
      success: false,
      error_code: 'UNKNOWN_ERROR',
      message: 'Ha ocurrido un error inesperado.'
    }

    return {
      ...standardError,
      details: {
        status,
        statusText: error.response?.statusText,
        requestId: context?.requestId,
        timestamp: Date.now(),
        retryAfter: error.response?.headers['retry-after']
      }
    }
  }

  /**
   * Normalize different error types
   */
  private normalizeError(error: any): ApiError {
    if (error.response?.data && error.response.data.error_code) {
      return error.response.data
    }

    return {
      success: false,
      error_code: 'CLIENT_ERROR',
      message: error.message || 'Error en el cliente.',
      details: {
        timestamp: Date.now()
      }
    }
  }

  // Public API methods

  /**
   * GET request
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.get<ApiResponse<T>>(url, config)
    return response.data
  }

  /**
   * POST request
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(url, data, config)
    return response.data
  }

  /**
   * PUT request
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.put<ApiResponse<T>>(url, data, config)
    return response.data
  }

  /**
   * PATCH request
   */
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.patch<ApiResponse<T>>(url, data, config)
    return response.data
  }

  /**
   * DELETE request
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.delete<ApiResponse<T>>(url, config)
    return response.data
  }

  /**
   * Request with custom context
   */
  async request<T = any>(config: AxiosRequestConfig & { context?: Partial<RequestContext> }): Promise<ApiResponse<T>> {
    if (config.context) {
      const enhancedConfig = config as InternalAxiosRequestConfig
      enhancedConfig.metadata = {
        requestId: this.generateRequestId(),
        timestamp: Date.now(),
        method: config.method?.toUpperCase() || 'GET',
        url: config.url || '',
        retryAttempt: 0,
        maxRetries: API_CONFIG.RETRY_ATTEMPTS,
        ...config.context
      }
    }
    
    const response = await this.client.request<ApiResponse<T>>(config)
    return response.data
  }

  /**
   * Get the underlying axios instance for advanced usage
   */
  getAxiosInstance(): AxiosInstance {
    return this.client
  }
}

// Export singleton instance
export const httpClient = new HttpClient()

// Export the class for testing
export { HttpClient }