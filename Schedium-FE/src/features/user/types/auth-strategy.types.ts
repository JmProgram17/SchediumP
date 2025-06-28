/**
 * Tipos para la Estrategia Híbrida de Autenticación
 * 
 * Esta estrategia permite múltiples métodos de autenticación
 * adaptándose a diferentes escenarios y limitaciones técnicas
 */

// Métodos disponibles de autenticación
export type AuthMethod = 'magic-link' | 'temp-email' | 'visible-password' | 'sso'

// Resultado de aplicar un método de autenticación
export interface AuthMethodResult {
  success: boolean
  method: AuthMethod
  temporaryPassword?: string // Solo para método visible
  message: string
  instructions: string
  warnings?: string[]
  expiresAt?: Date
}

// Configuración de Magic Link
export interface MagicLinkConfig {
  enabled: boolean
  expirationHours: number // Cuántas horas es válido el link
  baseUrl: string
  emailTemplate: string
}

// Configuración de Contraseña Temporal
export interface TempPasswordConfig {
  enabled: boolean
  passwordLength: number
  expirationDays: number
  requireSpecialChars: boolean
  excludeAmbiguous: boolean // Excluir caracteres como 0,O,l,1,I
}

// Configuración de Contraseña Visible
export interface VisiblePasswordConfig {
  enabled: boolean
  onlyAsLastResort: boolean // Solo usar si todo lo demás falla
  passwordLength: number
  useMemorableFormat: boolean // Formato tipo "Casa-Azul-2024"
  showWarnings: boolean
  expirationHours: number
}

// Contexto para decidir qué método usar
export interface AuthDecisionContext {
  emailServiceAvailable: boolean
  userHasValidEmail: boolean
  adminPreference?: AuthMethod
  isUrgent: boolean
  previousFailures?: string[]
}

// Solicitud de creación con estrategia
export interface UserCreateWithStrategy {
  // Datos básicos del usuario
  email: string
  first_name: string
  last_name: string
  document_number: string
  role_id: number
  active?: boolean
  
  // Estrategia de autenticación
  authStrategy?: {
    preferredMethod?: AuthMethod
    allowFallback?: boolean
    skipEmail?: boolean // Para testing o casos especiales
  }
}

// Respuesta de creación con estrategia
export interface UserCreateResponse {
  user: {
    user_id: number
    email: string
    first_name: string
    last_name: string
    role: {
      role_id: number
      name: string
    }
  }
  authResult: AuthMethodResult
  audit: {
    method_used: AuthMethod
    timestamp: string
    admin_id: number
    warnings?: string[]
  }
}

// Estado del componente de contraseña temporal
export interface TempPasswordModalData {
  password: string
  userName: string
  expiresAt: Date
  method: AuthMethod
  instructions: string[]
  warnings: string[]
}

// Configuración de auditoría
export interface AuthAuditEntry {
  id: string
  timestamp: Date
  adminUser: {
    id: number
    email: string
    ip?: string
  }
  targetUser: {
    id: number
    email: string
    name: string
  }
  method: AuthMethod
  success: boolean
  reason?: string // Por qué se usó este método
  visiblePasswordShown?: boolean
  passwordChanged?: boolean
  passwordChangeTimestamp?: Date
}

// Métricas de uso de métodos
export interface AuthMethodMetrics {
  period: 'day' | 'week' | 'month'
  totalUsers: number
  byMethod: {
    [key in AuthMethod]: {
      count: number
      successRate: number
      averageTimeToFirstLogin?: number
    }
  }
  securityAlerts: {
    visiblePasswordsNotChanged: number
    expiredMagicLinks: number
    failedEmailDeliveries: number
  }
}

// Generador de contraseñas seguras
export interface PasswordGeneratorOptions {
  length: number
  includeUppercase?: boolean
  includeLowercase?: boolean
  includeNumbers?: boolean
  includeSymbols?: boolean
  excludeAmbiguous?: boolean
  memorable?: boolean // Genera formato legible como "Casa-Azul-2024"
  prefix?: string // Para añadir prefijo organizacional
}

// Token para Magic Links
export interface MagicLinkToken {
  token: string
  userId: number
  expiresAt: Date
  used: boolean
  createdBy: number
  type: 'password-reset' | 'first-login'
}

// Validación de métodos disponibles
export interface AvailableAuthMethods {
  magicLink: {
    available: boolean
    reason?: string
  }
  tempEmail: {
    available: boolean
    reason?: string
  }
  visiblePassword: {
    available: boolean
    reason?: string
  }
  recommendedMethod: AuthMethod
}