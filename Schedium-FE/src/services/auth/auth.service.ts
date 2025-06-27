import { authApi, httpClient } from '@/services/api'
import axios from 'axios'

// Create a clean axios instance for auth without any interceptors
const cleanAxios = axios.create({
  timeout: 30000,
  withCredentials: false
})
import { API_CONFIG } from '@/config'
import { 
  LoginRequest, 
  LoginResponse, 
  User, 
  RefreshTokenRequest, 
  RefreshTokenResponse 
} from '@/types/auth.types'
import { secureStorage } from '@/services/storage/secure-storage.service'
import { tokenService } from './token.service'

class AuthService {

  async login(credentials: LoginRequest): Promise<{ tokens: LoginResponse; user: User }> {
    console.log('🔐 [AUTH] Attempting login with credentials:', { email: credentials.email, password: '***' })
    
    // Step 1: Login to get tokens using JSON endpoint
    const response = await cleanAxios.post(`${API_CONFIG.BACKEND_URL}/api/v1/auth/login-json`, {
      email: credentials.email,
      password: credentials.password
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    const loginResponse = {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message
    }
    
    if (!loginResponse.success || !loginResponse.data) {
      throw new Error(loginResponse.message || 'Login failed')
    }
    
    // Store tokens using token service
    tokenService.storeTokens(
      loginResponse.data.access_token, 
      loginResponse.data.refresh_token
    )
    
    // Step 2: Get user information using clean axios call
    const userResponse = await cleanAxios.get(`${API_CONFIG.BACKEND_URL}/api/v1/auth/me`, {
      headers: {
        'Authorization': `Bearer ${loginResponse.data.access_token}`,
        'Content-Type': 'application/json'
      }
    })
    
    return {
      tokens: loginResponse.data,
      user: userResponse.data.data
    }
  }

  async logout(): Promise<void> {
    try {
      await authApi.post('/logout', {}, {
        retry: { maxAttempts: 1 }, // Single attempt for logout
        context: { operation: 'logout' }
      })
    } catch (error) {
      // Even if logout fails on server, clear local tokens
      console.error('Logout error:', error)
    } finally {
      tokenService.clearTokens()
      secureStorage.remove('user')
    }
  }

  async refreshToken(): Promise<RefreshTokenResponse | null> {
    const newAccessToken = await tokenService.refreshAccessToken()
    
    if (!newAccessToken) {
      throw new Error('Token refresh failed')
    }
    
    return {
      access_token: newAccessToken,
      token_type: 'bearer'
    }
  }

  async getCurrentUser(): Promise<User> {
    const token = await tokenService.getValidAccessToken()
    if (!token) {
      throw new Error('No access token available')
    }

    const response = await cleanAxios.get(`${API_CONFIG.BACKEND_URL}/api/v1/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (response.data.success && response.data.data) {
      // Cache user data
      secureStorage.set('user', JSON.stringify(response.data.data))
      return response.data.data
    }
    
    throw new Error(response.data.message || 'Failed to get current user')
  }

  async updatePassword(currentPassword: string, newPassword: string): Promise<void> {
    const response = await authApi.post('/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    }, {
      retry: { maxAttempts: 1 }, // No retry for password changes
      context: { operation: 'change_password' }
    })
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to update password')
    }
  }

  async requestPasswordReset(email: string): Promise<void> {
    const response = await authApi.post('/forgot-password', { email }, {
      retry: { maxAttempts: 2 },
      context: { operation: 'request_password_reset' }
    })
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to request password reset')
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const response = await authApi.post('/reset-password', {
      token,
      new_password: newPassword,
    }, {
      retry: { maxAttempts: 1 }, // No retry for password reset
      context: { operation: 'reset_password' }
    })
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to reset password')
    }
  }

  // Helper methods
  isAuthenticated(): boolean {
    const token = secureStorage.getAccessToken()
    
    if (!token) {
      return false
    }
    
    return tokenService.isValidTokenStructure(token) && !tokenService.isTokenExpired(token)
  }

  getTokenExpiryTime(): number | null {
    const token = secureStorage.getAccessToken()
    if (!token) return null
    
    const tokenInfo = tokenService.getTokenInfo(token)
    return tokenInfo?.expiresAt || null
  }

  getCachedUser(): User | null {
    const userStr = secureStorage.get('user')
    if (!userStr) return null
    
    try {
      return JSON.parse(userStr) as User
    } catch {
      return null
    }
  }

  // CSRF token management
  async getCsrfToken(): Promise<string> {
    const response = await authApi.get<{ csrf_token: string }>('/csrf-token', {
      cache: 300000, // 5 minutes cache
      context: { operation: 'get_csrf_token' }
    })
    
    if (response.success && response.data) {
      return response.data.csrf_token
    }
    
    throw new Error('Failed to get CSRF token')
  }
}

export const authService = new AuthService()