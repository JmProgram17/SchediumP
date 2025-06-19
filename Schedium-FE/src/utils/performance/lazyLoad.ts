/**
 * Lazy Loading Utilities - Advanced code splitting and component loading
 * Optimizes bundle size with intelligent route-based and component-based splitting
 */

import { lazy, ComponentType, LazyExoticComponent } from 'react'
import { toast } from 'react-hot-toast'

// Retry mechanism for failed lazy imports
const retryImport = <T,>(
  importFn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> => {
  return new Promise((resolve, reject) => {
    importFn()
      .then(resolve)
      .catch((error) => {
        if (retries > 0) {
          setTimeout(() => {
            retryImport(importFn, retries - 1, delay * 2)
              .then(resolve)
              .catch(reject)
          }, delay)
        } else {
          reject(error)
        }
      })
  })
}

// Enhanced lazy loading with error handling and loading states
export const createLazyComponent = <T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: {
    retries?: number
    delay?: number
    chunkName?: string
    preload?: boolean
    onError?: (error: Error) => void
    onLoading?: () => void
  } = {}
): LazyExoticComponent<T> => {
  const {
    retries = 3,
    delay = 1000,
    chunkName,
    preload = false,
    onError,
    onLoading
  } = options

  const enhancedImport = () => {
    onLoading?.()
    
    return retryImport(importFn, retries, delay)
      .catch((error) => {
        console.error(`Failed to load component${chunkName ? ` (${chunkName})` : ''}:`, error)
        onError?.(error)
        toast.error('Error cargando componente. Reintentando...')
        throw error
      })
  }

  const LazyComponent = lazy(enhancedImport)

  // Preload component if requested
  if (preload) {
    setTimeout(() => {
      enhancedImport().catch(() => {
        // Silently fail for preloads
      })
    }, 100)
  }

  return LazyComponent
}

// Route-based lazy loading with webpack magic comments
export const SchedulesPage = createLazyComponent(
  () => import(/* webpackChunkName: "schedules" */ '../../pages/scheduling/SchedulesPage').then(module => ({ default: module.SchedulesPage })),
  { chunkName: 'schedules', preload: true }
)

export const DashboardPage = createLazyComponent(
  () => import(/* webpackChunkName: "dashboard" */ '../../pages/DashboardPage').then(module => ({ default: module.DashboardPage })),
  { chunkName: 'dashboard', preload: true }
)

export const InstructorsPage = createLazyComponent(
  () => import(/* webpackChunkName: "instructors" */ '../../pages/hr/InstructorsPage').then(module => ({ default: module.InstructorsPage })),
  { chunkName: 'instructors' }
)

export const ClassroomsPage = createLazyComponent(
  () => import(/* webpackChunkName: "classrooms" */ '../../pages/infrastructure/ClassroomsPage').then(module => ({ default: module.ClassroomsPage })),
  { chunkName: 'classrooms' }
)

export const ReportsPage = createLazyComponent(
  () => import(/* webpackChunkName: "reports" */ '../../pages/InformesPage').then(module => ({ default: module.InformesPage })),
  { chunkName: 'reports' }
)

export const SettingsPage = createLazyComponent(
  () => import(/* webpackChunkName: "settings" */ '../../pages/admin/SettingsPage').then(module => ({ default: module.SettingsPage })),
  { chunkName: 'settings' }
)

export const ProfilePage = createLazyComponent(
  () => import(/* webpackChunkName: "profile" */ '../../pages/ProfilePage').then(module => ({ default: module.ProfilePage })),
  { chunkName: 'profile' }
)

// Feature-based lazy loading
export const ReportBuilder = createLazyComponent(
  () => import(/* webpackChunkName: "report-builder" */ '../../features/reports/components/ReportBuilder/ReportBuilder'),
  { chunkName: 'report-builder' }
)

export const ScheduleMatrix = createLazyComponent(
  () => import(/* webpackChunkName: "schedule-matrix" */ '../../features/scheduling/components/ScheduleMatrix/ScheduleMatrix'),
  { chunkName: 'schedule-matrix', preload: true }
)

export const DashboardBuilder = createLazyComponent(
  () => import(/* webpackChunkName: "dashboard-builder" */ '../../features/dashboard/components/DashboardBuilder/DashboardBuilder'),
  { chunkName: 'dashboard-builder' }
)

export const ConflictResolution = createLazyComponent(
  () => import(/* webpackChunkName: "conflict-resolution" */ '../../features/scheduling/components/ConflictResolution/ConflictResolution'),
  { chunkName: 'conflict-resolution' }
)

// Heavy component lazy loading
// Note: These components may not exist yet, remove if causing build errors
// export const DataVisualization = createLazyComponent(
//   () => import(/* webpackChunkName: "data-viz" */ '../../features/dashboard/components/DataVisualization/DataVisualization'),
//   { chunkName: 'data-viz' }
// )

// export const AdvancedFilters = createLazyComponent(
//   () => import(/* webpackChunkName: "advanced-filters" */ '../../components/common/AdvancedFilters'),
//   { chunkName: 'advanced-filters' }
// )

// Third-party library lazy loading
// export const DateRangePicker = createLazyComponent(
//   () => import(/* webpackChunkName: "date-picker" */ '../../components/common/DateRangePicker'),
//   { chunkName: 'date-picker' }
// )

// export const FileUploader = createLazyComponent(
//   () => import(/* webpackChunkName: "file-uploader" */ '../../components/common/FileUploader'),
//   { chunkName: 'file-uploader' }
// )

// Preload strategies
export const preloadCriticalComponents = () => {
  // Preload components likely to be used soon
  const criticalComponents = [
    ScheduleMatrix,
    DashboardPage
  ]

  criticalComponents.forEach(component => {
    // Trigger preload by accessing the component
    try {
      // Force the lazy component to load
      const preloadableComponent = component as any
      if (preloadableComponent._payload && typeof preloadableComponent._payload === 'function') {
        preloadableComponent._payload()
      }
    } catch (error) {
      console.warn('Failed to preload component:', error)
    }
  })
}

export const preloadRouteComponents = (routeName: string) => {
  const routePreloadMap: Record<string, Array<() => void>> = {
    '/schedules': [
      () => {
        try {
          const comp = ScheduleMatrix as any
          if (comp._payload && typeof comp._payload === 'function') comp._payload()
        } catch (e) { console.warn('Failed to preload ScheduleMatrix') }
      },
      () => {
        try {
          const comp = ConflictResolution as any
          if (comp._payload && typeof comp._payload === 'function') comp._payload()
        } catch (e) { console.warn('Failed to preload ConflictResolution') }
      }
    ],
    '/dashboard': [
      () => {
        try {
          const comp = DashboardBuilder as any
          if (comp._payload && typeof comp._payload === 'function') comp._payload()
        } catch (e) { console.warn('Failed to preload DashboardBuilder') }
      }
    ],
    '/reports': [
      () => {
        try {
          const comp = ReportBuilder as any
          if (comp._payload && typeof comp._payload === 'function') comp._payload()
        } catch (e) { console.warn('Failed to preload ReportBuilder') }
      }
    ]
  }

  const preloadFunctions = routePreloadMap[routeName]
  if (preloadFunctions) {
    preloadFunctions.forEach(preload => {
      setTimeout(preload, 50)
    })
  }
}

// Dynamic import with caching
const importCache = new Map<string, Promise<any>>()

export const dynamicImport = <T,>(importPath: string): Promise<T> => {
  if (importCache.has(importPath)) {
    return importCache.get(importPath)!
  }

  const importPromise = import(importPath)
    .catch(error => {
      importCache.delete(importPath)
      throw error
    })

  importCache.set(importPath, importPromise)
  return importPromise
}

// Bundle analysis helpers
export const getBundleInfo = () => {
  if (process.env.NODE_ENV === 'development') {
    return {
      chunks: performance.getEntriesByType('navigation'),
      resources: performance.getEntriesByType('resource'),
      timing: performance.timing
    }
  }
  return null
}

// Component loading analytics
export const trackComponentLoad = (componentName: string, loadTime: number) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`Component ${componentName} loaded in ${loadTime}ms`)
  }

  // In production, send to analytics service
  if (process.env.NODE_ENV === 'production') {
    // analytics.track('component_load', {
    //   component: componentName,
    //   loadTime,
    //   timestamp: Date.now()
    // })
  }
}

// Resource hints injection
export const injectResourceHints = () => {
  if (typeof document !== 'undefined') {
    // Preload critical resources
    const criticalResources = [
      '/api/v1/auth/me',
      '/api/v1/schedules/current',
      '/fonts/inter-var.woff2'
    ]

    criticalResources.forEach(resource => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.href = resource
      link.as = resource.includes('/api/') ? 'fetch' : 
               resource.includes('.woff') ? 'font' : 'document'
      if (link.as === 'font') {
        link.crossOrigin = 'anonymous'
      }
      document.head.appendChild(link)
    })

    // DNS prefetch for external domains
    const externalDomains = [
      'https://cdn.jsdelivr.net',
      'https://fonts.googleapis.com',
      'https://api.schedium.com'
    ]

    externalDomains.forEach(domain => {
      const link = document.createElement('link')
      link.rel = 'dns-prefetch'
      link.href = domain
      document.head.appendChild(link)
    })
  }
}

// Module federation support (for micro-frontends)
export const loadRemoteModule = async (
  remoteName: string,
  moduleName: string
): Promise<any> => {
  try {
    // @ts-ignore
    const container = window[remoteName]
    if (!container) {
      throw new Error(`Remote container ${remoteName} not found`)
    }

    // Initialize container (Vite doesn't use webpack share scopes)
    if (typeof container.init === 'function') {
      await container.init({})
    }
    const factory = await container.get(moduleName)
    return factory()
  } catch (error) {
    console.error(`Failed to load remote module ${remoteName}/${moduleName}:`, error)
    throw error
  }
}

// Performance monitoring for lazy loading
export const monitorLazyLoading = () => {
  if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'resource' && entry.name.includes('chunk')) {
          trackComponentLoad(entry.name, entry.duration)
        }
      })
    })

    observer.observe({ entryTypes: ['resource'] })
  }
}

// Initialize performance monitoring
if (typeof window !== 'undefined') {
  monitorLazyLoading()
  injectResourceHints()
}