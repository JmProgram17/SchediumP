/**
 * Performance Optimization Suite - Complete performance toolkit
 * Centralized exports for all performance optimization utilities
 */

// Lazy loading and code splitting
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
  ConflictResolution,
  // DataVisualization,
  // AdvancedFilters,
  // DateRangePicker,
  // FileUploader
} from './lazyLoad'

// Memory management
export {
  useCleanup,
  useEventListener,
  useTimer,
  useObserver,
  useWebSocket,
  useSubscription,
  useMemoryPressure,
  MemoryMonitor,
  memoryTracker
} from './memoryManagement'

// Performance monitoring
export {
  usePerformanceMonitor,
  useComponentPerformance,
  PerformanceDashboard,
  performanceMonitor
} from './performanceMonitor'

// Resource prefetching
export {
  usePrefetch,
  useRoutePrefetch,
  PrefetchLink,
  usePrefetchAnalytics,
  resourcePrefetcher
} from './resourcePrefetching'

// Virtual scrolling
export {
  default as VirtualScroll,
  useVirtualScroll,
  useVirtualScrollPerformance
} from '../../components/common/VirtualScroll/VirtualScroll'

// Image optimization
export {
  default as OptimizedImage,
  useImageOptimization,
  OptimizedImageGallery,
  useImagePerformance
} from '../../components/common/OptimizedImage/OptimizedImage'

// Error boundaries
export {
  default as ErrorBoundary,
  AsyncErrorBoundary,
  NetworkErrorBoundary,
  withErrorBoundary,
  useErrorHandler,
  reportError
} from '../../components/common/ErrorBoundary/ErrorBoundary'

// Types
export type {
  CoreWebVitals,
  PerformanceMetrics,
  PerformanceRecommendation
} from './performanceMonitor'

export type {
  MemoryInfo,
  MemoryLeak
} from './memoryManagement'

// Performance initialization function
export const initializePerformanceOptimizations = async () => {
  console.log('🚀 Initializing performance optimizations...')
  
  // Import singletons dynamically to avoid circular dependency issues
  const { performanceMonitor } = await import('./performanceMonitor')
  const { injectResourceHints, monitorLazyLoading, preloadCriticalComponents } = await import('./lazyLoad')
  
  // Start monitoring
  performanceMonitor.trackMemoryUsage()
  
  // Inject resource hints
  injectResourceHints()
  
  // Start monitoring lazy loading
  monitorLazyLoading()
  
  // Preload critical components
  preloadCriticalComponents()
  
  console.log('✅ Performance optimizations initialized')
}

// Performance summary function
export const getPerformanceSummary = async () => {
  // Import singletons dynamically to avoid circular dependency issues
  const { performanceMonitor } = await import('./performanceMonitor')
  const { memoryTracker } = await import('./memoryManagement')
  
  const performanceMetrics = performanceMonitor.getMetrics()
  const memoryStats = memoryTracker.getMemoryStats()
  const recommendations = performanceMonitor.getRecommendations()
  
  return {
    coreWebVitals: performanceMetrics.coreWebVitals,
    memory: memoryStats?.current,
    recommendations: recommendations.filter((r: any) => r.type === 'critical'),
    score: calculatePerformanceScore(performanceMetrics, recommendations),
    lastUpdated: Date.now()
  }
}

// Calculate overall performance score
const calculatePerformanceScore = (metrics: any, recommendations: any[]): number => {
  let score = 100
  
  // Deduct points for Core Web Vitals
  if (metrics.coreWebVitals.FCP && metrics.coreWebVitals.FCP > 1800) {
    score -= 15
  }
  if (metrics.coreWebVitals.LCP && metrics.coreWebVitals.LCP > 2500) {
    score -= 20
  }
  if (metrics.coreWebVitals.CLS && metrics.coreWebVitals.CLS > 0.1) {
    score -= 10
  }
  if (metrics.coreWebVitals.FID && metrics.coreWebVitals.FID > 100) {
    score -= 10
  }
  
  // Deduct points for critical recommendations
  const criticalCount = recommendations.filter(r => r.type === 'critical').length
  score -= criticalCount * 10
  
  // Deduct points for warning recommendations
  const warningCount = recommendations.filter(r => r.type === 'warning').length
  score -= warningCount * 5
  
  return Math.max(0, score)
}