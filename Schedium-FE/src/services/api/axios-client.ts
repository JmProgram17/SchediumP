import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { API_CONFIG, SECURITY_CONFIG } from '@/config'
import { secureStorage } from '@/services/storage/secure-storage.service'
import { ApiError } from '@/types'

// Create axios instance
export const axiosClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'X-Requested-With': 'XMLHttpRequest',
    'Accept': 'application/json; charset=utf-8',
  },
  withCredentials: SECURITY_CONFIG.CORS.CREDENTIALS,
  maxBodyLength: SECURITY_CONFIG.API.MAX_REQUEST_SIZE,
  maxContentLength: SECURITY_CONFIG.API.MAX_REQUEST_SIZE,
})

console.log('🔧 [AXIOS] Client created with baseURL:', API_CONFIG.BASE_URL)

// Security headers that match backend expectations
const SECURITY_HEADERS = {
  'X-Requested-With': 'XMLHttpRequest',
  'Accept': 'application/json',
} as const

// Request interceptor
axiosClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Skip token for auth endpoints
    const isAuthEndpoint = config.url?.includes('/auth/login') || config.url?.includes('/auth/refresh')
    
    if (!isAuthEndpoint) {
      // Get valid access token (automatically refreshes if needed)
      const { tokenService } = await import('@/services/auth/token.service')
      const token = await tokenService.getValidAccessToken()
      
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    
    // Add request ID for tracking (matches backend format)
    config.headers[API_CONFIG.REQUEST_ID_HEADER] = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // Validate request size
    if (config.data && JSON.stringify(config.data).length > SECURITY_CONFIG.API.MAX_REQUEST_SIZE) {
      throw new Error('Request payload too large')
    }
    
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// Response interceptor
axiosClient.interceptors.response.use(
  (response) => {
    // Log successful responses for debugging
    const requestId = response.config.headers[API_CONFIG.REQUEST_ID_HEADER]
    console.log(`✅ [API] ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status} (${requestId})`)
    
    // Validate response headers for security
    const expectedHeaders = SECURITY_CONFIG.CORS.EXPOSED_HEADERS
    const missingHeaders = expectedHeaders.filter(header => !response.headers[header.toLowerCase()])
    if (missingHeaders.length > 0 && SECURITY_CONFIG.ENVIRONMENT.isDevelopment) {
      console.warn(`⚠️ [SECURITY] Missing expected headers: ${missingHeaders.join(', ')}`)
    }
    
    return response
  },
  async (error: AxiosError<ApiError>) => {
    const requestId = error.config?.headers[API_CONFIG.REQUEST_ID_HEADER]
    console.error(`❌ [API] ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.response?.status} (${requestId})`)
    
    // Handle network errors
    if (!error.response) {
      return Promise.reject({
        success: false,
        error_code: 'NETWORK_ERROR',
        message: 'Error de conexión. Verifique su conexión a internet.',
        details: { originalError: error.message }
      })
    }
    
    // Handle 401 Unauthorized - redirect to login
    if (error.response.status === 401) {
      const { tokenService } = await import('@/services/auth/token.service')
      tokenService.clearTokens()
      
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
      
      return Promise.reject({
        success: false,
        error_code: 'UNAUTHORIZED',
        message: 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.',
      })
    }
    
    // Handle 403 Forbidden
    if (error.response.status === 403) {
      return Promise.reject({
        success: false,
        error_code: 'FORBIDDEN',
        message: 'No tiene permisos para realizar esta acción.',
      })
    }
    
    // Handle 429 Rate Limit
    if (error.response.status === 429) {
      const retryAfter = error.response.headers['retry-after'] || '60'
      return Promise.reject({
        success: false,
        error_code: 'RATE_LIMIT_EXCEEDED',
        message: `Demasiadas solicitudes. Intente nuevamente en ${retryAfter} segundos.`,
        details: { retryAfter: parseInt(retryAfter) }
      })
    }
    
    // Handle other errors
    return Promise.reject(error.response.data || {
      success: false,
      error_code: 'UNKNOWN_ERROR',
      message: 'Ha ocurrido un error inesperado.',
      details: { status: error.response.status, statusText: error.response.statusText }
    })
  }
)

// Rate limiting
const requestQueue = new Map<string, number>()
const RATE_LIMIT_WINDOW = 1000 // 1 second
const MAX_REQUESTS_PER_WINDOW = 10

export function checkRateLimit(endpoint: string): boolean {
  const now = Date.now()
  const key = `${endpoint}-${Math.floor(now / RATE_LIMIT_WINDOW)}`
  const count = requestQueue.get(key) || 0
  
  if (count >= MAX_REQUESTS_PER_WINDOW) {
    return false
  }
  
  requestQueue.set(key, count + 1)
  
  // Clean old entries
  for (const [k, _] of requestQueue) {
    const timestamp = parseInt(k.split('-')[1])
    if (now - timestamp * RATE_LIMIT_WINDOW > RATE_LIMIT_WINDOW * 2) {
      requestQueue.delete(k)
    }
  }
  
  return true
}