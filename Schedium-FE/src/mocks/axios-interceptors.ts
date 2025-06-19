/**
 * Axios Interceptors Fallback for MSW
 * When Service Worker fails, we can mock API calls directly using axios interceptors
 */

import { AxiosResponse } from 'axios'
import { axiosClient } from '@/services/api/axios-client'

// Mock responses
const mockResponses: Record<string, any> = {
  'POST:/api/v1/auth/login': (data: { email: string; password: string }) => {
    console.log('🎭 [AXIOS-MOCK] Login interceptor called!')
    console.log('🎭 [AXIOS-MOCK] Received credentials:', { email: data.email, password: '***' })
    
    if (data.email === 'admin@sena.edu.co' && data.password === 'admin123') {
      console.log('✅ [AXIOS-MOCK] Credentials valid, returning success')
      return {
        success: true,
        message: "Login successful",
        data: {
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          token_type: 'bearer'
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: "1.0"
        },
        errors: null
      }
    }

    console.log('❌ [AXIOS-MOCK] Invalid credentials, returning error')
    const error = new Error('Incorrect email or password')
    ;(error as any).response = {
      status: 401,
      data: {
        success: false,
        message: 'Incorrect email or password',
        error_code: 'INVALID_CREDENTIALS',
        errors: null,
        meta: {
          timestamp: new Date().toISOString(),
          version: "1.0"
        }
      }
    }
    throw error
  },

  'GET:/api/v1/auth/me': () => {
    console.log('🎭 [AXIOS-MOCK] Get current user interceptor called!')
    return {
      success: true,
      message: "User information retrieved",
      data: {
        user_id: 1,
        email: 'admin@sena.edu.co',
        first_name: 'Admin',
        last_name: 'User',
        document_number: '1234567890',
        active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        role: {
          role_id: 1,
          name: 'Administrator',
          description: 'Full system access'
        },
        role_id: 1
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: "1.0"
      },
      errors: null
    }
  },

  'POST:/api/v1/auth/logout': () => {
    console.log('🎭 [AXIOS-MOCK] Logout interceptor called!')
    return {
      success: true,
      message: 'Logged out successfully',
    }
  },

  'GET:/api/v1/debug': () => {
    console.log('🎭 [AXIOS-MOCK] Debug endpoint called - Axios interceptors working!')
    return {
      message: 'Axios interceptors are working!',
      timestamp: new Date().toISOString(),
    }
  },

  'GET:/api/v1/health': () => {
    console.log('🎭 [AXIOS-MOCK] Health endpoint called')
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    }
  }
}

export function setupAxiosInterceptors() {
  // Response interceptor to mock API calls
  axiosClient.interceptors.response.use(
    (response: AxiosResponse) => {
      // Let real responses through
      return response
    },
    async (error) => {
      const config = error.config
      if (!config) return Promise.reject(error)

      const method = config.method?.toUpperCase()
      const url = config.url
      const mockKey = `${method}:${url}`

      console.log('🔍 [AXIOS-MOCK] Checking for mock:', mockKey)

      if (mockResponses[mockKey]) {
        console.log('✅ [AXIOS-MOCK] Found mock response for:', mockKey)
        
        try {
          const mockResponse = mockResponses[mockKey](config.data)
          
          // Create a mock axios response
          const response: AxiosResponse = {
            data: mockResponse,
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
            request: {}
          }
          
          return Promise.resolve(response)
        } catch (mockError) {
          console.log('❌ [AXIOS-MOCK] Mock threw error:', mockError)
          return Promise.reject(mockError)
        }
      }

      // If no mock found, reject with original error
      console.log('🔄 [AXIOS-MOCK] No mock found, using original error')
      return Promise.reject(error)
    }
  )

  console.log('🎭 [AXIOS-MOCK] Interceptors configured for:', Object.keys(mockResponses))
}