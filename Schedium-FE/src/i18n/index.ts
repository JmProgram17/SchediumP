/**
 * Internationalization (i18n) Configuration
 * Multi-language support for Spanish and English
 */

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

// Import translation resources
import esTranslations from './locales/es/index'
import enTranslations from './locales/en/index'

const resources = {
  es: esTranslations,
  en: enTranslations
}

// Get environment configuration
const isDevelopment = import.meta.env.DEV
const defaultLocale = import.meta.env.VITE_DEFAULT_LOCALE || 'es'
const fallbackLocale = import.meta.env.VITE_FALLBACK_LOCALE || 'en'
const availableLocales = (import.meta.env.VITE_AVAILABLE_LOCALES || 'es,en').split(',')

i18n
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    resources,
    
    // Language configuration
    lng: defaultLocale,
    fallbackLng: fallbackLocale,
    supportedLngs: availableLocales,
    
    // Namespace configuration
    defaultNS: 'common',
    ns: ['common', 'auth', 'navigation', 'schedule', 'courses', 'instructors', 'rooms', 'reports', 'dashboard', 'errors'],
    
    // Debug settings
    debug: isDevelopment,
    
    // React specific options
    react: {
      // Use Suspense for loading translations
      useSuspense: false,
      
      // Bind i18n instance to React component lifecycle
      bindI18n: 'languageChanged loaded',
      
      // Bind store to React component lifecycle
      bindI18nStore: 'added removed',
      
      // Use React.StrictMode compatible version
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'em', 'span']
    },
    
    // Interpolation configuration
    interpolation: {
      // Escape values to prevent XSS
      escapeValue: true,
      
      // Prefix/suffix for interpolation
      prefix: '{{',
      suffix: '}}',
      
      // Format function for custom formatting
      format: (value: any, format: string, lng?: string) => {
        // Date formatting
        if (format === 'date') {
          return new Intl.DateTimeFormat(lng, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }).format(new Date(value))
        }
        
        // Time formatting
        if (format === 'time') {
          return new Intl.DateTimeFormat(lng, {
            hour: '2-digit',
            minute: '2-digit'
          }).format(new Date(value))
        }
        
        // Currency formatting
        if (format === 'currency') {
          return new Intl.NumberFormat(lng, {
            style: 'currency',
            currency: 'COP'
          }).format(value)
        }
        
        // Number formatting
        if (format === 'number') {
          return new Intl.NumberFormat(lng).format(value)
        }
        
        // Percentage formatting
        if (format === 'percentage') {
          return new Intl.NumberFormat(lng, {
            style: 'percent',
            minimumFractionDigits: 1
          }).format(value / 100)
        }
        
        return value
      }
    },
    
    // Pluralization configuration
    pluralSeparator: '_',
    contextSeparator: '_',
    
    // Key separator
    keySeparator: '.',
    nsSeparator: ':',
    
    // Return empty string for missing keys in production
    returnEmptyString: !isDevelopment,
    
    // Return key if translation is missing
    returnNull: false,
    returnUndefined: false,
    
    // Save missing translations
    saveMissing: isDevelopment,
    saveMissingTo: 'current',
    
    // Missing key handler
    missingKeyHandler: (lng: string[], ns: string, key: string, fallbackValue: string) => {
      if (isDevelopment) {
        console.warn(`Missing translation: ${ns}:${key} for language ${lng[0]}`)
      }
    },
    
    // Post processor
    postProcess: ['interval'],
    
    // Clean code on production
    cleanCode: !isDevelopment
  })

// Language change handler
i18n.on('languageChanged', (lng: string) => {
  // Update HTML lang attribute
  document.documentElement.lang = lng
  
  // Update document direction for RTL languages
  const rtlLanguages = ['ar', 'he', 'fa']
  document.documentElement.dir = rtlLanguages.includes(lng) ? 'rtl' : 'ltr'
  
  // Store user preference
  localStorage.setItem('schedium-language', lng)
  
  // Emit custom event for other components
  window.dispatchEvent(new CustomEvent('languageChanged', {
    detail: { language: lng }
  }))
})

// Add custom format functions
export const formatters = {
  // Academic period formatting
  academicPeriod: (value: string, lng?: string) => {
    const [year, period] = value.split('-')
    return i18n.t('common:academicPeriod', { year, period, lng })
  },
  
  // Duration formatting (in minutes)
  duration: (minutes: number, lng?: string) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    
    if (hours === 0) {
      return i18n.t('common:minutesOnly', { minutes: mins, lng })
    } else if (mins === 0) {
      return i18n.t('common:hoursOnly', { hours, lng })
    } else {
      return i18n.t('common:hoursAndMinutes', { hours, minutes: mins, lng })
    }
  },
  
  // File size formatting
  fileSize: (bytes: number, lng?: string) => {
    const units = ['bytes', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    
    return i18n.t(`common:${units[unitIndex]}`, { 
      size: unitIndex === 0 ? size : size.toFixed(1),
      lng 
    })
  },
  
  // Relative time formatting
  relativeTime: (date: Date | string, lng?: string) => {
    const now = new Date()
    const targetDate = new Date(date)
    const diffMs = now.getTime() - targetDate.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return i18n.t('common:today', { lng })
    } else if (diffDays === 1) {
      return i18n.t('common:yesterday', { lng })
    } else if (diffDays === -1) {
      return i18n.t('common:tomorrow', { lng })
    } else if (diffDays > 0) {
      return i18n.t('common:daysAgo', { days: diffDays, lng })
    } else {
      return i18n.t('common:inDays', { days: Math.abs(diffDays), lng })
    }
  }
}

// Utility functions
export const changeLanguage = (language: string) => {
  return i18n.changeLanguage(language)
}

export const getCurrentLanguage = () => {
  return i18n.language
}

export const getAvailableLanguages = () => {
  return availableLocales
}

export const isLanguageSupported = (language: string) => {
  return availableLocales.includes(language)
}

export const getLanguageDirection = (language?: string) => {
  const lng = language || i18n.language
  const rtlLanguages = ['ar', 'he', 'fa']
  return rtlLanguages.includes(lng) ? 'rtl' : 'ltr'
}

export const loadNamespace = (namespace: string | string[]) => {
  return i18n.loadNamespaces(namespace)
}

export const reloadResources = (languages?: string[], namespaces?: string[]) => {
  return i18n.reloadResources(languages, namespaces)
}

// Export configured i18n instance
export default i18n