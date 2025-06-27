export const API_CONFIG = {
  BASE_URL: `${import.meta.env.VITE_API_URL || 'http://localhost:8001'}/api/v1`,
  BACKEND_URL: import.meta.env.VITE_API_URL || 'http://localhost:8001',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  REQUEST_ID_HEADER: 'X-Request-ID',
  API_KEY_HEADER: 'X-API-Key',
} as const

export const AUTH_CONFIG = {
  TOKEN_KEY: 'access_token',
  REFRESH_TOKEN_KEY: 'refresh_token',
  USER_KEY: 'user',
  TOKEN_EXPIRY_BUFFER: 300, // 5 minutes before expiry to refresh (matches backend)
  ACCESS_TOKEN_LIFETIME: 30 * 60 * 1000, // 30 minutes in milliseconds
  REFRESH_TOKEN_LIFETIME: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  TOKEN_TYPE: 'bearer',
  ALGORITHM: 'HS256', // Same as backend
} as const

export const APP_CONFIG = {
  NAME: 'Schedium',
  DESCRIPTION: 'Sistema de Gestión Académica - SENA CGMLTI',
  VERSION: import.meta.env.VITE_APP_VERSION || '0.0.0',
  ENVIRONMENT: import.meta.env.VITE_APP_ENV || 'development',
} as const

export const THEME_CONFIG = {
  PRIMARY_COLOR: '#39A900', // SENA Green
  SECONDARY_COLOR: '#FF6B00', // SENA Orange
  DEFAULT_THEME: 'light',
} as const

// Re-export security configuration
export { SECURITY_CONFIG } from './security.config'