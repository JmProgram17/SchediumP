
/**
 * Security configuration that aligns with backend settings
 */

// CORS Configuration (aligns with backend)
export const CORS_CONFIG = {
  // These should match the backend CORS origins
  ALLOWED_ORIGINS: [
    'http://localhost:3000',
    'http://localhost:3001', 
    'http://localhost:3002',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3002',
    // Production origins should be added via environment variables
    ...(import.meta.env.VITE_ALLOWED_ORIGINS?.split(',') || [])
  ],
  
  CREDENTIALS: true,
  
  ALLOWED_HEADERS: [
    'Authorization',
    'Content-Type',
    'X-Requested-With',
    'X-Request-ID',
    'X-API-Key',
    'Accept',
    'Cache-Control'
  ],
  
  EXPOSED_HEADERS: [
    'X-Request-ID',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    'X-Total-Count'
  ],
  
  MAX_AGE: 3600 // 1 hour
} as const

// Content Security Policy (should match backend CSP)
export const CSP_CONFIG = {
  DEFAULT_SRC: ["'self'"],
  SCRIPT_SRC: ["'self'", "'unsafe-inline'"], // Note: unsafe-inline needed for Vite in dev
  STYLE_SRC: ["'self'", "'unsafe-inline'"],
  IMG_SRC: ["'self'", "data:", "https:"],
  FONT_SRC: ["'self'", "https:"],
  CONNECT_SRC: [
    "'self'",
    // API endpoints
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    // Add production API URL via environment variable
    ...(import.meta.env.VITE_API_URL ? [import.meta.env.VITE_API_URL] : [])
  ],
  FRAME_ANCESTORS: ["'none'"],
  FORM_ACTION: ["'self'"],
} as const

// Security Headers Configuration
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  
  // Only set HSTS in production
  ...(import.meta.env.VITE_APP_ENV === 'production' && {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
  })
} as const

// Rate Limiting Configuration (client-side)
export const RATE_LIMIT_CONFIG = {
  // These should be lower than backend limits to avoid hitting them
  PER_MINUTE: 50, // Backend: 60
  PER_HOUR: 800,  // Backend: 1000
  BURST_LIMIT: 5, // Allow small bursts
  RETRY_AFTER: 60 // seconds
} as const

// Token Configuration
export const TOKEN_CONFIG = {
  STORAGE_TYPE: 'sessionStorage' as 'sessionStorage' | 'localStorage',
  ENCRYPTION_ENABLED: true,
  AUTO_REFRESH_ENABLED: true,
  REFRESH_THRESHOLD_MINUTES: 5, // Refresh token 5 minutes before expiry
  
  // JWT Validation
  REQUIRED_CLAIMS: ['sub', 'exp', 'iat', 'email'] as const,
  ALGORITHM: 'HS256',
  
  // Session Management
  IDLE_TIMEOUT_MINUTES: 30,
  SESSION_WARNING_MINUTES: 5, // Warn user 5 minutes before session expires
} as const

// Input Validation & Sanitization
export const VALIDATION_CONFIG = {
  MAX_INPUT_LENGTH: 1000,
  MAX_FILE_SIZE_MB: 10,
  ALLOWED_FILE_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ],
  
  // XSS Protection patterns
  DANGEROUS_PATTERNS: [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<object[^>]*>.*?<\/object>/gi,
    /<embed[^>]*>/gi,
    /<applet[^>]*>.*?<\/applet>/gi
  ]
} as const

// API Security Configuration
export const API_SECURITY_CONFIG = {
  REQUEST_TIMEOUT: 30000, // 30 seconds
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
  
  // Request size limits
  MAX_REQUEST_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_URL_LENGTH: 2048,
  
  // Headers
  REQUIRED_HEADERS: [
    'Content-Type',
    'X-Requested-With'
  ],
  
  // Endpoints that don't require authentication
  PUBLIC_ENDPOINTS: [
    '/api/v1/auth/login',
    '/api/v1/auth/login-json',
    '/api/v1/auth/refresh',
    '/api/v1/auth/forgot-password',
    '/api/v1/auth/reset-password',
    '/api/v1/health',
    '/api/v1/docs',
    // Academic Config GET endpoints (read-only)
    '/api/v1/academic-config/quarters',
    '/api/v1/academic-config/time-blocks',
    '/api/v1/academic-config/days',
    // Also include without prefix for backward compatibility
    '/auth/login',
    '/auth/login-json',
    '/auth/refresh',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/health',
    '/docs',
    '/academic-config/quarters',
    '/academic-config/time-blocks',
    '/academic-config/days',
    // Include minimal paths
    '/login',
    '/login-json',
    '/refresh',
    '/forgot-password',
    '/reset-password'
  ],
  
  // Endpoints that require specific roles
  ADMIN_ONLY_ENDPOINTS: [
    '/admin/',
    '/users/',
    '/roles/',
    '/system/'
  ],
  
  COORDINATOR_ENDPOINTS: [
    '/academic/',
    '/hr/',
    '/infrastructure/',
    '/scheduling/'
  ]
} as const

// Development vs Production Configuration
export const ENVIRONMENT_CONFIG = {
  isDevelopment: import.meta.env.VITE_APP_ENV === 'development',
  isProduction: import.meta.env.VITE_APP_ENV === 'production',
  
  // Features enabled in development
  DEVELOPMENT_FEATURES: {
    MOCK_ENABLED: true,
    DETAILED_ERRORS: true,
    DEBUG_LOGGING: true,
    HOT_RELOAD: true,
    DEV_TOOLS: true
  },
  
  // Production security features
  PRODUCTION_FEATURES: {
    HTTPS_ONLY: true,
    SECURE_COOKIES: true,
    HSTS_ENABLED: true,
    CSP_STRICT: true,
    ERROR_REPORTING: true
  }
} as const

// Export combined security configuration
export const SECURITY_CONFIG = {
  CORS: CORS_CONFIG,
  CSP: CSP_CONFIG,
  HEADERS: SECURITY_HEADERS,
  RATE_LIMIT: RATE_LIMIT_CONFIG,
  TOKEN: TOKEN_CONFIG,
  VALIDATION: VALIDATION_CONFIG,
  API: API_SECURITY_CONFIG,
  ENVIRONMENT: ENVIRONMENT_CONFIG
} as const