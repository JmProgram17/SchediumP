/**
 * Enhanced Translation Hook - Extended functionality for i18n
 * Provides additional utilities and formatting for translations
 */

import { useTranslation as useI18nTranslation, UseTranslationOptions } from 'react-i18next'
import { useCallback, useMemo } from 'react'
import { formatters } from '@/i18n'

export interface ExtendedTranslationOptions extends UseTranslationOptions {
  returnObjects?: boolean
  returnDetails?: boolean
}

export interface TranslationFunction {
  (key: string, options?: any): string
  (key: string[], options?: any): string[]
}

export interface ExtendedTranslationReturn {
  t: TranslationFunction
  i18n: any
  ready: boolean
  // Extended utilities
  formatDate: (date: Date | string, format?: 'date' | 'time' | 'datetime' | 'relative') => string
  formatNumber: (value: number, format?: 'currency' | 'percentage' | 'decimal' | 'integer') => string
  formatDuration: (minutes: number) => string
  formatFileSize: (bytes: number) => string
  formatRelativeTime: (date: Date | string) => string
  pluralize: (count: number, key: string, options?: any) => string
  getLanguageDirection: () => 'ltr' | 'rtl'
  isRTL: boolean
  // Namespace helpers
  tc: (key: string, options?: any) => string  // common namespace
  tn: (key: string, options?: any) => string  // navigation namespace
  ts: (key: string, options?: any) => string  // schedule namespace
  te: (key: string, options?: any) => string  // errors namespace
}

export const useTranslation = (
  namespace?: string | string[],
  options?: ExtendedTranslationOptions
): ExtendedTranslationReturn => {
  const { t, i18n, ready } = useI18nTranslation(namespace, options)
  
  const currentLanguage = i18n.language
  const isRTL = useMemo(() => {
    const rtlLanguages = ['ar', 'he', 'fa']
    return rtlLanguages.includes(currentLanguage)
  }, [currentLanguage])

  // Format date with localization
  const formatDate = useCallback((
    date: Date | string, 
    format: 'date' | 'time' | 'datetime' | 'relative' = 'date'
  ) => {
    const dateObj = new Date(date)
    
    switch (format) {
      case 'date':
        return new Intl.DateTimeFormat(currentLanguage, {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }).format(dateObj)
      
      case 'time':
        return new Intl.DateTimeFormat(currentLanguage, {
          hour: '2-digit',
          minute: '2-digit'
        }).format(dateObj)
      
      case 'datetime':
        return new Intl.DateTimeFormat(currentLanguage, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }).format(dateObj)
      
      case 'relative':
        return formatters.relativeTime(dateObj, currentLanguage)
      
      default:
        return dateObj.toLocaleDateString(currentLanguage)
    }
  }, [currentLanguage])

  // Format numbers with localization
  const formatNumber = useCallback((
    value: number,
    format: 'currency' | 'percentage' | 'decimal' | 'integer' = 'decimal'
  ) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat(currentLanguage, {
          style: 'currency',
          currency: 'COP'
        }).format(value)
      
      case 'percentage':
        return new Intl.NumberFormat(currentLanguage, {
          style: 'percent',
          minimumFractionDigits: 1
        }).format(value / 100)
      
      case 'integer':
        return new Intl.NumberFormat(currentLanguage, {
          maximumFractionDigits: 0
        }).format(value)
      
      case 'decimal':
      default:
        return new Intl.NumberFormat(currentLanguage).format(value)
    }
  }, [currentLanguage])

  // Format duration using custom formatter
  const formatDuration = useCallback((minutes: number) => {
    return formatters.duration(minutes, currentLanguage)
  }, [currentLanguage])

  // Format file size using custom formatter
  const formatFileSize = useCallback((bytes: number) => {
    return formatters.fileSize(bytes, currentLanguage)
  }, [currentLanguage])

  // Format relative time using custom formatter
  const formatRelativeTime = useCallback((date: Date | string) => {
    return formatters.relativeTime(date, currentLanguage)
  }, [currentLanguage])

  // Pluralization helper
  const pluralize = useCallback((count: number, key: string, options: any = {}) => {
    return t(key, { count, ...options })
  }, [t])

  // Get language direction
  const getLanguageDirection = useCallback(() => {
    return isRTL ? 'rtl' : 'ltr'
  }, [isRTL])

  // Namespace-specific translation helpers
  const tc = useCallback((key: string, options?: any) => {
    return t(`common:${key}`, options)
  }, [t])

  const tn = useCallback((key: string, options?: any) => {
    return t(`navigation:${key}`, options)
  }, [t])

  const ts = useCallback((key: string, options?: any) => {
    return t(`schedule:${key}`, options)
  }, [t])

  const te = useCallback((key: string, options?: any) => {
    return t(`errors:${key}`, options)
  }, [t])

  return {
    t,
    i18n,
    ready,
    formatDate,
    formatNumber,
    formatDuration,
    formatFileSize,
    formatRelativeTime,
    pluralize,
    getLanguageDirection,
    isRTL,
    tc,
    tn,
    ts,
    te
  }
}

// Hook for language switching
export const useLanguageSwitcher = () => {
  const { i18n } = useI18nTranslation()
  
  const currentLanguage = i18n.language
  const availableLanguages = i18n.options.supportedLngs?.filter(lng => lng !== 'cimode') || []
  
  const changeLanguage = useCallback(async (language: string) => {
    try {
      await i18n.changeLanguage(language)
      
      // Update HTML attributes
      document.documentElement.lang = language
      const rtlLanguages = ['ar', 'he', 'fa']
      document.documentElement.dir = rtlLanguages.includes(language) ? 'rtl' : 'ltr'
      
      // Store preference
      localStorage.setItem('schedium-language', language)
      
      // Emit custom event
      window.dispatchEvent(new CustomEvent('languageChanged', {
        detail: { language }
      }))
      
      return true
    } catch (error) {
      console.error('Failed to change language:', error)
      return false
    }
  }, [i18n])

  const getLanguageName = useCallback((code: string) => {
    const languageNames: Record<string, string> = {
      es: 'Español',
      en: 'English',
      fr: 'Français',
      pt: 'Português',
      de: 'Deutsch',
      it: 'Italiano',
      ar: 'العربية',
      zh: '中文',
      ja: '日本語',
      ko: '한국어',
      ru: 'Русский'
    }
    return languageNames[code] || code.toUpperCase()
  }, [])

  const getLanguageFlag = useCallback((code: string) => {
    const flagEmojis: Record<string, string> = {
      es: '🇪🇸',
      en: '🇺🇸',
      fr: '🇫🇷',
      pt: '🇵🇹',
      de: '🇩🇪',
      it: '🇮🇹',
      ar: '🇸🇦',
      zh: '🇨🇳',
      ja: '🇯🇵',
      ko: '🇰🇷',
      ru: '🇷🇺'
    }
    return flagEmojis[code] || '🌐'
  }, [])

  return {
    currentLanguage,
    availableLanguages,
    changeLanguage,
    getLanguageName,
    getLanguageFlag,
    isChanging: i18n.isInitialized === false
  }
}

// Hook for translation validation (development helper)
export const useTranslationValidator = () => {
  const { i18n } = useI18nTranslation()
  
  const validateKey = useCallback((key: string, namespace?: string) => {
    const fullKey = namespace ? `${namespace}:${key}` : key
    const exists = i18n.exists(fullKey)
    
    if (!exists && process.env.NODE_ENV === 'development') {
      console.warn(`Translation key missing: ${fullKey}`)
    }
    
    return exists
  }, [i18n])

  const validateKeys = useCallback((keys: string[], namespace?: string) => {
    const results = keys.map(key => ({
      key,
      exists: validateKey(key, namespace)
    }))
    
    const missing = results.filter(r => !r.exists)
    
    if (missing.length > 0 && process.env.NODE_ENV === 'development') {
      console.warn('Missing translation keys:', missing.map(m => m.key))
    }
    
    return {
      total: keys.length,
      valid: results.filter(r => r.exists).length,
      missing: missing.map(m => m.key),
      isValid: missing.length === 0
    }
  }, [validateKey])

  return {
    validateKey,
    validateKeys
  }
}

export default useTranslation