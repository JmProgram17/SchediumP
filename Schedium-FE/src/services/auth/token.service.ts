import { AUTH_CONFIG } from '@/config'
import { secureStorage } from '@/services/storage/secure-storage.service'
import { axiosClient } from '@/services/api/axios-client'
import { RefreshTokenResponse } from '@/types/auth.types'
import { ApiResponse } from '@/types/api.types'

interface TokenInfo {
  token: string
  expiresAt: number
  issuedAt: number
}

class TokenService {
  private refreshPromise: Promise<string> | null = null

  /**
   * Parse JWT token to extract payload information
   */
  private parseToken(token: string): any {
    try {
      const payload = token.split('.')[1]
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
      return JSON.parse(decoded)
    } catch (error) {
      console.error('Error parsing token:', error)
      return null
    }
  }

  /**
   * Get token information including expiration
   */
  getTokenInfo(token: string): TokenInfo | null {
    const payload = this.parseToken(token)
    if (!payload) return null

    return {
      token,
      expiresAt: payload.exp * 1000, // Convert to milliseconds
      issuedAt: payload.iat * 1000,
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token: string): boolean {
    const tokenInfo = this.getTokenInfo(token)
    if (!tokenInfo) return true

    const now = Date.now()
    return now >= tokenInfo.expiresAt
  }

  /**
   * Check if token needs refresh (within buffer time)
   */
  needsRefresh(token: string): boolean {
    const tokenInfo = this.getTokenInfo(token)
    if (!tokenInfo) return true

    const now = Date.now()
    const bufferTime = AUTH_CONFIG.TOKEN_EXPIRY_BUFFER * 1000 // Convert to milliseconds
    return now >= (tokenInfo.expiresAt - bufferTime)
  }

  /**
   * Get current valid access token
   * Automatically refreshes if needed
   */
  async getValidAccessToken(): Promise<string | null> {
    const accessToken = secureStorage.getAccessToken()
    
    if (!accessToken) {
      return null
    }

    // If token is not expired and doesn't need refresh, return it
    if (!this.isTokenExpired(accessToken) && !this.needsRefresh(accessToken)) {
      return accessToken
    }

    // Try to refresh the token
    return await this.refreshAccessToken()
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<string | null> {
    // If already refreshing, return the existing promise
    if (this.refreshPromise) {
      return this.refreshPromise
    }

    const refreshToken = secureStorage.getRefreshToken()
    if (!refreshToken) {
      this.clearTokens()
      return null
    }

    // Check if refresh token is expired
    if (this.isTokenExpired(refreshToken)) {
      this.clearTokens()
      return null
    }

    this.refreshPromise = this.performTokenRefresh(refreshToken)
    
    try {
      const newAccessToken = await this.refreshPromise
      return newAccessToken
    } finally {
      this.refreshPromise = null
    }
  }

  /**
   * Perform the actual token refresh request
   */
  private async performTokenRefresh(refreshToken: string): Promise<string | null> {
    try {
      console.log('🔄 [TOKEN] Refreshing access token...')
      
      const response = await axiosClient.post<ApiResponse<RefreshTokenResponse>>('/auth/refresh', {
        refresh_token: refreshToken,
      })

      if (response.data.success && response.data.data) {
        const { access_token, token_type } = response.data.data
        
        // Store new access token
        secureStorage.setAccessToken(access_token)
        
        console.log('✅ [TOKEN] Access token refreshed successfully')
        return access_token
      } else {
        console.error('❌ [TOKEN] Refresh failed:', response.data.message)
        this.clearTokens()
        return null
      }
    } catch (error) {
      console.error('❌ [TOKEN] Error refreshing token:', error)
      this.clearTokens()
      return null
    }
  }

  /**
   * Store tokens securely
   */
  storeTokens(accessToken: string, refreshToken: string): void {
    secureStorage.setAccessToken(accessToken)
    secureStorage.setRefreshToken(refreshToken)
    
    // Log token expiration times for debugging
    const accessTokenInfo = this.getTokenInfo(accessToken)
    const refreshTokenInfo = this.getTokenInfo(refreshToken)
    
    if (accessTokenInfo) {
      console.log('🔐 [TOKEN] Access token expires at:', new Date(accessTokenInfo.expiresAt))
    }
    if (refreshTokenInfo) {
      console.log('🔐 [TOKEN] Refresh token expires at:', new Date(refreshTokenInfo.expiresAt))
    }
  }

  /**
   * Clear all tokens
   */
  clearTokens(): void {
    secureStorage.clearTokens()
    console.log('🗑️ [TOKEN] All tokens cleared')
  }

  /**
   * Get user information from access token
   */
  getUserFromToken(token: string): any {
    const payload = this.parseToken(token)
    if (!payload) return null

    return {
      user_id: payload.sub,
      email: payload.email,
      role: payload.role,
      full_name: payload.full_name,
    }
  }

  /**
   * Check if user has specific role
   */
  hasRole(token: string, roleName: string): boolean {
    const user = this.getUserFromToken(token)
    return user?.role === roleName
  }

  /**
   * Validate token structure and signature (basic validation)
   */
  isValidTokenStructure(token: string): boolean {
    if (!token || typeof token !== 'string') return false
    
    const parts = token.split('.')
    if (parts.length !== 3) return false
    
    try {
      // Try to parse header and payload
      const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')))
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
      
      // Check required fields
      return !!(header.alg && payload.sub && payload.exp && payload.iat)
    } catch {
      return false
    }
  }
}

export const tokenService = new TokenService()