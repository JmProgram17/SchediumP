import CryptoJS from 'crypto-js'

// Secure storage service using sessionStorage with encryption
class SecureStorageService {
  private readonly secretKey: string
  private readonly storage: Storage

  constructor() {
    // In production, this should come from environment variable
    this.secretKey = import.meta.env.VITE_STORAGE_SECRET || 'schedium-default-secret-key'
    this.storage = window.sessionStorage
  }

  private encrypt(value: string): string {
    return CryptoJS.AES.encrypt(value, this.secretKey).toString()
  }

  private decrypt(encryptedValue: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedValue, this.secretKey)
    return bytes.toString(CryptoJS.enc.Utf8)
  }

  set(key: string, value: string): void {
    try {
      const encryptedValue = this.encrypt(value)
      this.storage.setItem(key, encryptedValue)
    } catch (error) {
      console.error('Error storing secure data:', error)
    }
  }

  get(key: string): string | null {
    try {
      const encryptedValue = this.storage.getItem(key)
      if (!encryptedValue) return null
      return this.decrypt(encryptedValue)
    } catch (error) {
      console.error('Error retrieving secure data:', error)
      return null
    }
  }

  remove(key: string): void {
    this.storage.removeItem(key)
  }

  clear(): void {
    this.storage.clear()
  }

  // Helper methods for tokens
  setAccessToken(token: string): void {
    this.set('access_token', token)
  }

  getAccessToken(): string | null {
    return this.get('access_token')
  }

  setRefreshToken(token: string): void {
    this.set('refresh_token', token)
  }

  getRefreshToken(): string | null {
    return this.get('refresh_token')
  }

  clearTokens(): void {
    this.remove('access_token')
    this.remove('refresh_token')
  }
}

export const secureStorage = new SecureStorageService()