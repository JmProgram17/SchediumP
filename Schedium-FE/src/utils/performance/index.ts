/**
 * Performance Optimization Suite - MVP Version
 * Centralized exports for essential performance utilities only
 */

// Lazy loading and code splitting - CORE functionality
export {
  createLazyComponent,
  preloadCriticalComponents,
  preloadRouteComponents,
  dynamicImport,
  getBundleInfo,
  trackComponentLoad,
  injectResourceHints,
  loadRemoteModule,
  monitorLazyLoading,
  // Lazy components
  SchedulesPage,
  DashboardPage,
  InstructorsPage,
  ClassroomsPage,
  ReportsPage,
  SettingsPage,
  ProfilePage,
  ReportBuilder,
  ScheduleMatrix,
  DashboardBuilder,
  ConflictResolution
} from './lazyLoad'

// Virtual scrolling - MANTENER para listas grandes
export {
  default as VirtualScroll,
  useVirtualScroll,
  useVirtualScrollPerformance
} from '../../components/common/VirtualScroll/VirtualScroll'

// Image optimization - MANTENER para rendimiento
export {
  default as OptimizedImage,
  useImageOptimization,
  OptimizedImageGallery,
  useImagePerformance
} from '../../components/common/OptimizedImage/OptimizedImage'

// Error boundaries - CRÍTICO para estabilidad
export {
  default as ErrorBoundary,
  AsyncErrorBoundary,
  NetworkErrorBoundary,
  withErrorBoundary,
  useErrorHandler,
  reportError
} from '../../components/common/ErrorBoundary/ErrorBoundary'

// Performance initialization function - SIMPLIFICADO para MVP
export const initializePerformanceOptimizations = async () => {
  console.log('🚀 Initializing basic performance optimizations...')
  
  // Solo funcionalidades básicas para MVP
  const { injectResourceHints, monitorLazyLoading, preloadCriticalComponents } = await import('./lazyLoad')
  
  // Inject resource hints
  injectResourceHints()
  
  // Start monitoring lazy loading
  monitorLazyLoading()
  
  // Preload critical components
  preloadCriticalComponents()
  
  console.log('✅ Basic performance optimizations initialized')
}

// Performance summary function - SIMPLIFICADO
export const getPerformanceSummary = async () => {
  return {
    status: 'MVP Mode - Basic optimizations active',
    lazyLoading: 'Active',
    resourceHints: 'Active',
    lastUpdated: Date.now()
  }
}