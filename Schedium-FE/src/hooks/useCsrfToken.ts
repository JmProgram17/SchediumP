/**
 * CSRF Token Hook - Secure CSRF protection with automatic token management
 * Provides CSRF token generation, validation, and refresh capabilities
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { axiosClient } from '@/services/api/axios-client'

export interface CsrfTokenData {
  token: string | null
  isLoading: boolean
  error: string | null
  isValid: boolean
  expiresAt: Date | null
  lastRefresh: Date | null
}

export interface CsrfTokenOptions {
  autoRefresh?: boolean
  refreshThreshold?: number // Minutes before expiry to refresh
  maxRetries?: number
  onTokenExpired?: () => void
  onRefreshError?: (error: Error) => void
  storageKey?: string
}

const DEFAULT_OPTIONS: Required<CsrfTokenOptions> = {
  autoRefresh: true,
  refreshThreshold: 5, // 5 minutes before expiry
  maxRetries: 3,
  onTokenExpired: () => {},
  onRefreshError: () => {},
  storageKey: 'csrf_token_data'
}

export interface CsrfResponse {
  token: string
  expires_in: number // seconds
  max_age: number // seconds
}

export const useCsrfToken = (options: CsrfTokenOptions = {}) => {
  const config = { ...DEFAULT_OPTIONS, ...options }
  const [tokenData, setTokenData] = useState<CsrfTokenData>({
    token: null,
    isLoading: true,
    error: null,
    isValid: false,
    expiresAt: null,
    lastRefresh: null
  })
  
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null)
  const retryCountRef = useRef(0)
  const isRefreshingRef = useRef(false)

  // Load token from secure storage
  const loadStoredToken = useCallback(() => {
    try {
      const stored = sessionStorage.getItem(config.storageKey)
      if (stored) {
        const data = JSON.parse(stored)
        const expiresAt = new Date(data.expiresAt)
        const now = new Date()
        
        if (expiresAt > now) {
          setTokenData(prev => ({
            ...prev,
            token: data.token,
            expiresAt,
            lastRefresh: new Date(data.lastRefresh),
            isValid: true,
            isLoading: false
          }))
          return true
        } else {
          // Token expired, remove from storage
          sessionStorage.removeItem(config.storageKey)
        }
      }
    } catch (error) {
      console.warn('Failed to load stored CSRF token:', error)
      sessionStorage.removeItem(config.storageKey)
    }
    return false
  }, [config.storageKey])

  // Store token securely
  const storeToken = useCallback((token: string, expiresAt: Date) => {
    try {
      const data = {
        token,
        expiresAt: expiresAt.toISOString(),
        lastRefresh: new Date().toISOString()
      }
      sessionStorage.setItem(config.storageKey, JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to store CSRF token:', error)
    }
  }, [config.storageKey])

  // Fetch new CSRF token from server
  const fetchToken = useCallback(async (): Promise<string | null> => {
    if (isRefreshingRef.current) {
      return null
    }

    isRefreshingRef.current = true
    setTokenData(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await axiosClient.get<{
        success: boolean
        data: CsrfResponse
      }>('/auth/csrf-token')

      if (response.data.success) {
        const { token, expires_in } = response.data.data
        const expiresAt = new Date(Date.now() + expires_in * 1000)
        const now = new Date()

        // Store token securely
        storeToken(token, expiresAt)

        setTokenData(prev => ({
          ...prev,
          token,
          expiresAt,
          lastRefresh: now,
          isValid: true,
          isLoading: false,
          error: null
        }))

        retryCountRef.current = 0
        return token
      } else {
        throw new Error('Invalid CSRF token response')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch CSRF token'
      
      setTokenData(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        isValid: false
      }))

      retryCountRef.current++
      config.onRefreshError(error as Error)
      
      // Retry logic
      if (retryCountRef.current < config.maxRetries) {
        const retryDelay = Math.min(1000 * Math.pow(2, retryCountRef.current), 10000)
        setTimeout(() => {
          fetchToken()
        }, retryDelay)
      }

      return null
    } finally {
      isRefreshingRef.current = false
    }
  }, [config, storeToken])

  // Check if token needs refresh
  const needsRefresh = useCallback(() => {
    if (!tokenData.token || !tokenData.expiresAt) {
      return true
    }

    const now = new Date()
    const timeUntilExpiry = tokenData.expiresAt.getTime() - now.getTime()
    const refreshThresholdMs = config.refreshThreshold * 60 * 1000

    return timeUntilExpiry <= refreshThresholdMs
  }, [tokenData.token, tokenData.expiresAt, config.refreshThreshold])

  // Refresh token manually
  const refreshToken = useCallback(async (): Promise<string | null> => {
    return await fetchToken()
  }, [fetchToken])

  // Validate token with server
  const validateToken = useCallback(async (token?: string): Promise<boolean> => {
    const tokenToValidate = token || tokenData.token
    if (!tokenToValidate) {
      return false
    }

    try {
      const response = await axiosClient.post<{
        success: boolean
        data: { valid: boolean }
      }>('/auth/csrf-validate', {
        token: tokenToValidate
      })

      const isValid = response.data.success && response.data.data.valid

      setTokenData(prev => ({
        ...prev,
        isValid
      }))

      return isValid
    } catch (error) {
      console.warn('CSRF token validation failed:', error)
      setTokenData(prev => ({
        ...prev,
        isValid: false
      }))
      return false
    }
  }, [tokenData.token])

  // Clear token and storage
  const clearToken = useCallback(() => {
    sessionStorage.removeItem(config.storageKey)
    setTokenData({
      token: null,
      isLoading: false,
      error: null,
      isValid: false,
      expiresAt: null,
      lastRefresh: null
    })

    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current)
      refreshTimerRef.current = null
    }
  }, [config.storageKey])

  // Setup auto-refresh timer
  const setupAutoRefresh = useCallback(() => {
    if (!config.autoRefresh || !tokenData.expiresAt) {
      return
    }

    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current)
    }

    const now = new Date()
    const timeUntilRefresh = tokenData.expiresAt.getTime() - now.getTime() - (config.refreshThreshold * 60 * 1000)

    if (timeUntilRefresh > 0) {
      refreshTimerRef.current = setTimeout(() => {
        refreshToken()
      }, timeUntilRefresh)
    } else {
      // Token needs immediate refresh
      refreshToken()
    }
  }, [config.autoRefresh, config.refreshThreshold, tokenData.expiresAt, refreshToken])

  // Initialize token
  useEffect(() => {
    const hasStoredToken = loadStoredToken()
    
    if (!hasStoredToken) {
      fetchToken()
    }
  }, [loadStoredToken, fetchToken])

  // Setup auto-refresh when token changes
  useEffect(() => {
    if (tokenData.token && tokenData.expiresAt) {
      setupAutoRefresh()
    }

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current)
        refreshTimerRef.current = null
      }
    }
  }, [tokenData.token, tokenData.expiresAt, setupAutoRefresh])

  // Handle page visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && tokenData.token) {
        // Validate token when page becomes visible
        validateToken()
        
        // Refresh if needed
        if (needsRefresh()) {
          refreshToken()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [tokenData.token, validateToken, needsRefresh, refreshToken])

  // Handle token expiration
  useEffect(() => {
    if (tokenData.expiresAt) {
      const now = new Date()
      const timeUntilExpiry = tokenData.expiresAt.getTime() - now.getTime()

      if (timeUntilExpiry <= 0 && tokenData.token) {
        // Token has expired
        setTokenData(prev => ({
          ...prev,
          isValid: false,
          error: 'CSRF token has expired'
        }))
        config.onTokenExpired()
      }
    }
  }, [tokenData.expiresAt, tokenData.token, config])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current)
      }
    }
  }, [])

  return {
    ...tokenData,
    refreshToken,
    validateToken,
    clearToken,
    needsRefresh: needsRefresh(),
    timeUntilExpiry: tokenData.expiresAt 
      ? Math.max(0, tokenData.expiresAt.getTime() - Date.now()) 
      : 0,
    retryCount: retryCountRef.current,
    isRefreshing: isRefreshingRef.current
  }
}