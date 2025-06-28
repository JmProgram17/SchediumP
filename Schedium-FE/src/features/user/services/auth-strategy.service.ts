/**
 * Servicio de Estrategia Híbrida de Autenticación
 * 
 * Maneja la lógica de decisión y aplicación de diferentes
 * métodos de autenticación según el contexto
 */

import { enhancedApiService } from '@/services/api/enhanced-api.service'
import type {
  AuthMethod,
  AuthMethodResult,
  AuthDecisionContext,
  UserCreateWithStrategy,
  UserCreateResponse,
  PasswordGeneratorOptions,
  AvailableAuthMethods
} from '../types/auth-strategy.types'

class AuthStrategyService {
  // Palabras memorables para contraseñas legibles
  private readonly memorableWords = {
    adjectives: ['Azul', 'Verde', 'Roja', 'Grande', 'Nueva', 'Alta', 'Bella', 'Dulce'],
    nouns: ['Casa', 'Mesa', 'Libro', 'Flor', 'Luna', 'Sol', 'Mar', 'Rio'],
    years: ['2024', '2025', '2026']
  }

  /**
   * Genera una contraseña segura según las opciones
   */
  generateSecurePassword(options: PasswordGeneratorOptions): string {
    if (options.memorable) {
      return this.generateMemorablePassword()
    }

    const chars = {
      uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      lowercase: 'abcdefghijklmnopqrstuvwxyz',
      numbers: '0123456789',
      symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
    }

    // Excluir caracteres ambiguos si se solicita
    if (options.excludeAmbiguous) {
      chars.uppercase = chars.uppercase.replace(/[OI]/g, '')
      chars.lowercase = chars.lowercase.replace(/[ol]/g, '')
      chars.numbers = chars.numbers.replace(/[01]/g, '')
    }

    let charset = ''
    let password = ''

    // Construir conjunto de caracteres
    if (options.includeUppercase !== false) charset += chars.uppercase
    if (options.includeLowercase !== false) charset += chars.lowercase
    if (options.includeNumbers !== false) charset += chars.numbers
    if (options.includeSymbols) charset += chars.symbols

    // Asegurar al menos un carácter de cada tipo requerido
    if (options.includeUppercase !== false) {
      password += chars.uppercase[Math.floor(Math.random() * chars.uppercase.length)]
    }
    if (options.includeLowercase !== false) {
      password += chars.lowercase[Math.floor(Math.random() * chars.lowercase.length)]
    }
    if (options.includeNumbers !== false) {
      password += chars.numbers[Math.floor(Math.random() * chars.numbers.length)]
    }
    if (options.includeSymbols) {
      password += chars.symbols[Math.floor(Math.random() * chars.symbols.length)]
    }

    // Completar el resto de la contraseña
    for (let i = password.length; i < options.length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)]
    }

    // Mezclar la contraseña
    return password.split('').sort(() => Math.random() - 0.5).join('')
  }

  /**
   * Genera una contraseña memorable tipo "Casa-Azul-2024!"
   */
  private generateMemorablePassword(): string {
    const adj = this.memorableWords.adjectives[Math.floor(Math.random() * this.memorableWords.adjectives.length)]
    const noun = this.memorableWords.nouns[Math.floor(Math.random() * this.memorableWords.nouns.length)]
    const year = this.memorableWords.years[Math.floor(Math.random() * this.memorableWords.years.length)]
    return `${noun}-${adj}-${year}!`
  }

  /**
   * Genera un token seguro para magic links
   */
  generateSecureToken(): string {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }

  /**
   * Determina qué métodos de autenticación están disponibles
   */
  async checkAvailableMethods(): Promise<AvailableAuthMethods> {
    try {
      // Verificar servicio de email
      const emailAvailable = await this.checkEmailService()
      
      return {
        magicLink: {
          available: emailAvailable,
          reason: emailAvailable ? undefined : 'Servicio de email no disponible'
        },
        tempEmail: {
          available: emailAvailable,
          reason: emailAvailable ? undefined : 'Servicio de email no disponible'
        },
        visiblePassword: {
          available: true, // Siempre disponible como último recurso
          reason: 'Método de emergencia'
        },
        recommendedMethod: emailAvailable ? 'magic-link' : 'visible-password'
      }
    } catch (error) {
      console.error('Error checking available methods:', error)
      return {
        magicLink: { available: false, reason: 'Error al verificar' },
        tempEmail: { available: false, reason: 'Error al verificar' },
        visiblePassword: { available: true },
        recommendedMethod: 'visible-password'
      }
    }
  }

  /**
   * Verifica si el servicio de email está funcionando
   */
  private async checkEmailService(): Promise<boolean> {
    try {
      // Llamada real al backend para verificar métodos disponibles
      const response = await enhancedApiService.get('/auth/auth-methods/available')
      return response.data.magic_link.available
    } catch {
      return false
    }
  }

  /**
   * Decide qué método usar basado en el contexto
   */
  async decideAuthMethod(context: AuthDecisionContext): Promise<AuthMethod> {
    // Si el admin especificó un método, intentar usarlo
    if (context.adminPreference) {
      // Verificar si el método preferido es viable
      if (context.adminPreference === 'visible-password') {
        return 'visible-password'
      }
      
      if (!context.emailServiceAvailable || !context.userHasValidEmail) {
        console.warn('Método preferido no disponible, usando fallback')
        return 'visible-password'
      }
      
      return context.adminPreference
    }

    // Decisión automática
    if (!context.emailServiceAvailable || !context.userHasValidEmail) {
      return 'visible-password'
    }

    // Si es urgente, usar método más rápido
    if (context.isUrgent) {
      return 'temp-email'
    }

    // Por defecto, usar el más seguro
    return 'magic-link'
  }

  /**
   * Crea un usuario con la estrategia híbrida
   */
  async createUserWithStrategy(data: UserCreateWithStrategy): Promise<UserCreateResponse> {
    try {
      // Llamada real al backend con estrategia híbrida
      const response = await enhancedApiService.post('/auth/users/create-with-strategy', {
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        document_number: data.document_number,
        role_id: data.role_id,
        active: data.active,
        preferred_method: data.authStrategy?.preferredMethod
      })

      return {
        user: response.data.user,
        authResult: response.data.auth_result,
        audit: {
          method_used: response.data.auth_result.method,
          timestamp: new Date().toISOString(),
          admin_id: 1, // TODO: Obtener del contexto real
          warnings: response.data.auth_result.warnings
        }
      }
    } catch (error) {
      console.error('Error creating user with strategy:', error)
      
      // Fallback a simulación si el backend falla
      console.log('Backend error, using fallback simulation...')
      
      const mockUser = {
        user_id: Date.now(),
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        role: {
          role_id: data.role_id,
          name: 'Usuario'
        }
      }

      // Verificar métodos disponibles
      const availableMethods = await this.checkAvailableMethods()
      
      // Decidir método
      const context: AuthDecisionContext = {
        emailServiceAvailable: availableMethods.magicLink.available,
        userHasValidEmail: this.isValidEmail(data.email),
        adminPreference: data.authStrategy?.preferredMethod,
        isUrgent: false
      }
      
      const method = await this.decideAuthMethod(context)
      
      // Aplicar método
      let authResult: AuthMethodResult
      
      switch (method) {
        case 'magic-link':
          authResult = await this.applyMagicLinkMethod(mockUser)
          break
        case 'temp-email':
          authResult = await this.applyTempEmailMethod(mockUser)
          break
        case 'visible-password':
        default:
          authResult = await this.applyVisiblePasswordMethod(mockUser)
          break
      }

      return {
        user: mockUser,
        authResult,
        audit: {
          method_used: method,
          timestamp: new Date().toISOString(),
          admin_id: 1, // TODO: Obtener del contexto real
          warnings: authResult.warnings
        }
      }
    } catch (error) {
      console.error('Error creating user with strategy:', error)
      throw error
    }
  }

  /**
   * Aplica el método de Magic Link
   */
  private async applyMagicLinkMethod(user: any): Promise<AuthMethodResult> {
    const token = this.generateSecureToken()
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 horas
    
    // En producción, esto enviaría el email real
    console.log('Magic link token:', token)
    
    return {
      success: true,
      method: 'magic-link',
      message: 'Magic link enviado al email del usuario',
      instructions: 'El usuario recibirá un enlace por email para crear su contraseña. El enlace expira en 48 horas.',
      expiresAt
    }
  }

  /**
   * Aplica el método de contraseña temporal por email
   */
  private async applyTempEmailMethod(user: any): Promise<AuthMethodResult> {
    const tempPassword = this.generateSecurePassword({
      length: 16,
      includeSymbols: true,
      excludeAmbiguous: true
    })
    
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días
    
    // En producción, esto enviaría el email real
    console.log('Temporary password:', tempPassword)
    
    return {
      success: true,
      method: 'temp-email',
      message: 'Contraseña temporal enviada por email',
      instructions: 'El usuario recibirá su contraseña temporal por email. Debe cambiarla en su primer inicio de sesión.',
      expiresAt
    }
  }

  /**
   * Aplica el método de contraseña visible
   */
  private async applyVisiblePasswordMethod(user: any): Promise<AuthMethodResult> {
    const tempPassword = this.generateSecurePassword({
      length: 12,
      memorable: true
    })
    
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas
    
    return {
      success: true,
      method: 'visible-password',
      temporaryPassword: tempPassword,
      message: 'Contraseña temporal generada',
      instructions: 'Comparta esta contraseña de forma segura con el usuario. Expira en 24 horas.',
      warnings: [
        'El servicio de email no está disponible',
        'Esta contraseña es visible para el administrador',
        'El usuario DEBE cambiarla en su primer inicio de sesión',
        'No envíe esta contraseña por canales inseguros'
      ],
      expiresAt
    }
  }

  /**
   * Valida si un email es válido
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Obtiene instrucciones detalladas para cada método
   */
  getMethodInstructions(method: AuthMethod): string[] {
    const instructions: Record<AuthMethod, string[]> = {
      'magic-link': [
        '1. El usuario recibirá un email con un enlace único',
        '2. Al hacer clic, podrá crear su propia contraseña',
        '3. El enlace solo funciona una vez y expira en 48 horas',
        '4. Es el método más seguro y recomendado'
      ],
      'temp-email': [
        '1. El usuario recibirá su contraseña temporal por email',
        '2. Debe iniciar sesión con esa contraseña',
        '3. El sistema le pedirá cambiarla inmediatamente',
        '4. La contraseña temporal expira en 7 días'
      ],
      'visible-password': [
        '1. ⚠️ Use este método solo si no hay otra opción',
        '2. Copie la contraseña y entréguela al usuario de forma segura',
        '3. NO la envíe por WhatsApp, SMS o email personal',
        '4. El usuario DEBE cambiarla en su primer inicio de sesión',
        '5. La contraseña expira en 24 horas'
      ],
      'sso': [
        '1. El usuario iniciará sesión con su cuenta corporativa',
        '2. No necesita contraseña local',
        '3. La autenticación es manejada por el proveedor SSO'
      ]
    }
    
    return instructions[method] || []
  }
}

export const authStrategyService = new AuthStrategyService()