/**
 * Sentry Configuration - Error tracking and performance monitoring
 * Comprehensive setup for production error tracking and user feedback
 */

import React from 'react'
import * as Sentry from '@sentry/react'
// import { BrowserTracing } from '@sentry/tracing'
import { useLocation, useNavigationType, createRoutesFromChildren, matchRoutes } from 'react-router-dom'

export interface SentryConfig {
  dsn: string
  environment: string
  release?: string
  tracesSampleRate?: number
  profilesSampleRate?: number
  replaysSessionSampleRate?: number
  replaysOnErrorSampleRate?: number
  beforeSend?: (event: Sentry.Event) => Sentry.Event | null
  beforeSendTransaction?: (event: any) => any | null
}

const defaultConfig: Partial<SentryConfig> = {
  tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
  profilesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
}

export const initSentry = (config: SentryConfig) => {
  const finalConfig = { ...defaultConfig, ...config }

  Sentry.init({
    dsn: finalConfig.dsn,
    environment: finalConfig.environment,
    release: finalConfig.release || `schedium-frontend@${import.meta.env.VITE_APP_VERSION}`,
    
    integrations: [
      // Commented out deprecated integrations - replace with updated versions when available
      // new BrowserTracing({
      //   routingInstrumentation: Sentry.reactRouterV6Instrumentation(
      //     React.useEffect,
      //     useLocation,
      //     useNavigationType,
      //     createRoutesFromChildren,
      //     matchRoutes
      //   ),
      //   tracePropagationTargets: [
      //     'localhost',
      //     /^https:\/\/api\.schedium\./,
      //     /^https:\/\/.*\.schedium\..*$/,
      //   ],
      // }),
      // new Sentry.Replay({
      //   maskAllText: false,
      //   blockAllMedia: false,
      //   maskAllInputs: true,
      //   beforeAddRecordingEvent: (event) => {
      //     // Filter out sensitive data
      //     if (event.data && typeof event.data === 'object') {
      //       const data = event.data as any
      //       if (data.tag === 'breadcrumb' && data.payload?.category === 'navigation') {
      //         // Remove query parameters from URLs
      //         data.payload.data = {
      //           ...data.payload.data,
      //           from: data.payload.data?.from?.split('?')[0],
      //           to: data.payload.data?.to?.split('?')[0],
      //         }
      //       }
      //     }
      //     return event
      //   },
      // }),
      // new Sentry.Feedback({
      //   colorScheme: 'system',
      //   showBranding: false,
      //   formTitle: 'Reportar un Problema',
      //   submitButtonLabel: 'Enviar Reporte',
      //   cancelButtonLabel: 'Cancelar',
      //   addScreenshotButtonLabel: 'Agregar Captura',
      //   removeScreenshotButtonLabel: 'Remover Captura',
      //   nameLabel: 'Nombre',
      //   namePlaceholder: 'Tu nombre',
      //   emailLabel: 'Correo Electrónico',
      //   emailPlaceholder: 'tu.email@sena.edu.co',
      //   messageLabel: 'Describe el problema',
      //   messagePlaceholder: 'Describe qué pasó y cómo podemos reproducir el problema...',
      //   successMessageText: '¡Gracias por tu reporte! Nuestro equipo lo revisará pronto.',
      //   themeDark: {
      //     background: '#1f2937',
      //     backgroundHover: '#374151',
      //     foreground: '#f9fafb',
      //     border: '#4b5563',
      //     boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      //   },
      //   themeLight: {
      //     background: '#ffffff',
      //     backgroundHover: '#f9fafb',
      //     foreground: '#111827',
      //     border: '#d1d5db',
      //     boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      //   },
      // }),
    ],

    tracesSampleRate: finalConfig.tracesSampleRate,
    profilesSampleRate: finalConfig.profilesSampleRate,
    replaysSessionSampleRate: finalConfig.replaysSessionSampleRate,
    replaysOnErrorSampleRate: finalConfig.replaysOnErrorSampleRate,

    beforeSend: (event: any) => {
      // Filter out development errors
      if (import.meta.env.DEV) {
        return null
      }

      // Filter out non-critical errors
      if (event.exception) {
        const error = event.exception.values?.[0]
        if (error?.type === 'ChunkLoadError' || 
            error?.value?.includes('Loading chunk') ||
            error?.value?.includes('Loading CSS chunk')) {
          return null // Ignore chunk loading errors
        }
      }

      // Remove sensitive data
      if (event.request?.url) {
        event.request.url = event.request.url.split('?')[0]
      }

      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
          if (breadcrumb.category === 'xhr' || breadcrumb.category === 'fetch') {
            if (breadcrumb.data?.url) {
              breadcrumb.data.url = breadcrumb.data.url.split('?')[0]
            }
          }
          return breadcrumb
        })
      }

      return finalConfig.beforeSend ? finalConfig.beforeSend(event) : event
    },

    beforeSendTransaction: (transaction) => {
      // Remove query parameters from transaction names
      if (transaction.transaction) {
        transaction.transaction = transaction.transaction.split('?')[0]
      }

      return finalConfig.beforeSendTransaction ? 
        finalConfig.beforeSendTransaction(transaction) : 
        transaction
    },

    // Custom tags
    initialScope: (scope) => {
      scope.setTag('component', 'frontend')
      scope.setTag('framework', 'react')
      scope.setTag('build', import.meta.env.MODE)
      scope.setContext('app', {
        name: 'Schedium Frontend',
        version: import.meta.env.VITE_APP_VERSION,
        build: import.meta.env.MODE,
      })
      return scope
    },
  })

  // Set user context when authentication is available
  const setUserContext = (user: {
    id: string
    email?: string
    role?: string
    institution?: string
  }) => {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      role: user.role,
      institution: user.institution,
    })
  }

  // Clear user context on logout
  const clearUserContext = () => {
    Sentry.setUser(null)
  }

  return {
    setUserContext,
    clearUserContext,
    captureException: Sentry.captureException,
    captureMessage: Sentry.captureMessage,
    addBreadcrumb: Sentry.addBreadcrumb,
    setTag: Sentry.setTag,
    setContext: Sentry.setContext,
    withProfiler: Sentry.withProfiler,
    // startTransaction: Sentry.startTransaction, // Deprecated API
  }
}

// React Error Boundary with Sentry integration
export const SentryErrorBoundary = Sentry.withErrorBoundary

// Custom hooks for Sentry integration
export const useSentryUser = () => {
  const setUser = React.useCallback((user: {
    id: string
    email?: string
    role?: string
    institution?: string
  }) => {
    Sentry.setUser(user)
  }, [])

  const clearUser = React.useCallback(() => {
    Sentry.setUser(null)
  }, [])

  return { setUser, clearUser }
}

export const useSentryTransaction = (name: string, op: string = 'navigation') => {
  const [transaction, setTransaction] = React.useState<any | null>(null)

  React.useEffect(() => {
    // Deprecated API - replace with updated Sentry transaction API when available
    // const txn = Sentry.startTransaction({ name, op })
    // setTransaction(txn)
    setTransaction(null)

    return () => {
      // if (txn) {
      //   txn.finish()
      // }
    }
  }, [name, op])

  const addSpan = React.useCallback((description: string, operation: string = 'function') => {
    // if (transaction) {
    //   return transaction.startChild({ description, op: operation })
    // }
    return null
  }, [transaction])

  const setTransactionStatus = React.useCallback((status: string) => {
    // if (transaction) {
    //   transaction.setStatus(status)
    // }
  }, [transaction])

  return { transaction, addSpan, setTransactionStatus }
}

// Performance monitoring utilities
export const withSentryProfiling = <T extends (...args: any[]) => any>(
  fn: T,
  name?: string
): T => {
  return Sentry.withProfiler(fn, { name: name || fn.name }) as T
}

export const measurePerformance = async <T>(
  name: string,
  fn: () => Promise<T> | T
): Promise<T> => {
  // Deprecated API - replace with updated Sentry performance API when available
  // const transaction = Sentry.startTransaction({ name, op: 'measure' })
  
  try {
    const result = await fn()
    // transaction.setStatus('ok')
    return result
  } catch (error) {
    // transaction.setStatus('internal_error')
    Sentry.captureException(error)
    throw error
  } finally {
    // transaction.finish()
  }
}

// Breadcrumb helpers
export const addNavigationBreadcrumb = (from: string, to: string) => {
  Sentry.addBreadcrumb({
    category: 'navigation',
    message: `Navigated from ${from} to ${to}`,
    level: 'info',
    data: { from, to },
  })
}

export const addUserActionBreadcrumb = (action: string, target: string, data?: any) => {
  Sentry.addBreadcrumb({
    category: 'user',
    message: `User ${action} ${target}`,
    level: 'info',
    data: { action, target, ...data },
  })
}

export const addAPIBreadcrumb = (
  method: string,
  url: string,
  statusCode: number,
  responseTime?: number
) => {
  Sentry.addBreadcrumb({
    category: 'http',
    message: `${method} ${url}`,
    level: statusCode >= 400 ? 'error' : 'info',
    data: {
      method,
      url: url.split('?')[0], // Remove query parameters
      status_code: statusCode,
      response_time: responseTime,
    },
  })
}

// Context helpers
export const setSentryContext = (key: string, context: any) => {
  Sentry.setContext(key, context)
}

export const setSentryTag = (key: string, value: string) => {
  Sentry.setTag(key, value)
}

// Initialize Sentry if DSN is provided
if (import.meta.env.VITE_SENTRY_DSN) {
  initSentry({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE,
    release: import.meta.env.VITE_SENTRY_RELEASE,
  })
}