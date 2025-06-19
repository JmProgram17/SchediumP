/**
 * FASE 5: Debug Tools para QA y Desarrolladores
 * 
 * Panel de debugging integrado con:
 * - Logs en tiempo real y filtrado
 * - Estado de cache de React Query
 * - Network requests y responses
 * - Error tracking y recovery
 * - Performance metrics
 * - User session info
 */

import React from 'react'
import { logger, type LogEntry } from './logger.service'
import { sentryService } from './sentry.service'
import { errorMappingService } from './error-mapping.service'
import { queryClient } from '../query/query-client'

// ===== TYPES =====

export interface DebugPanelState {
  isOpen: boolean
  activeTab: 'logs' | 'cache' | 'network' | 'errors' | 'performance' | 'session'
  filters: {
    logLevel: string[]
    modules: string[]
    timeRange: 'last-hour' | 'last-30min' | 'last-10min' | 'all'
  }
}

export interface NetworkRequest {
  id: string
  timestamp: string
  method: string
  url: string
  status?: number
  duration?: number
  requestHeaders?: Record<string, string>
  responseHeaders?: Record<string, string>
  requestBody?: any
  responseBody?: any
  error?: any
}

export interface PerformanceMetric {
  name: string
  value: number
  timestamp: string
  category: 'navigation' | 'resource' | 'measure' | 'mark'
  details?: Record<string, any>
}

// ===== DEBUG TOOLS SERVICE =====

class DebugToolsService {
  private networkRequests: NetworkRequest[] = []
  private performanceMetrics: PerformanceMetric[] = []
  private isRecording = false
  private panelState: DebugPanelState = {
    isOpen: false,
    activeTab: 'logs',
    filters: {
      logLevel: ['error', 'warn', 'info'],
      modules: [],
      timeRange: 'last-30min'
    }
  }

  private listeners = new Set<(state: DebugPanelState) => void>()

  constructor() {
    this.initializeDebugTools()
  }

  private initializeDebugTools(): void {
    if (typeof window !== 'undefined') {
      // Expose debug tools globally for console access
      (window as any).__SCHEDIUM_DEBUG__ = {
        logs: () => this.getLogs(),
        cache: () => this.getCacheData(),
        network: () => this.getNetworkRequests(),
        errors: () => this.getErrorStats(),
        performance: () => this.getPerformanceMetrics(),
        session: () => this.getSessionInfo(),
        export: () => this.exportDebugData(),
        clear: () => this.clearData(),
        toggle: () => this.togglePanel()
      }

      // Set up performance observer
      this.setupPerformanceObserver()

      // Enable recording by default in development
      if (import.meta.env.DEV) {
        this.startRecording()
      }
    }
  }

  private setupPerformanceObserver(): void {
    if (typeof window === 'undefined' || !window.PerformanceObserver) return

    try {
      // Navigation timing
      const navObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.recordPerformanceMetric({
            name: 'navigation',
            value: entry.duration,
            timestamp: new Date().toISOString(),
            category: 'navigation',
            details: {
              type: (entry as any).type,
              loadEventEnd: (entry as any).loadEventEnd,
              domContentLoadedEventEnd: (entry as any).domContentLoadedEventEnd,
              responseEnd: (entry as any).responseEnd
            }
          })
        })
      })
      navObserver.observe({ entryTypes: ['navigation'] })

      // Resource timing
      const resourceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.recordPerformanceMetric({
            name: entry.name,
            value: entry.duration,
            timestamp: new Date().toISOString(),
            category: 'resource',
            details: {
              type: (entry as any).initiatorType,
              size: (entry as any).transferSize,
              cached: (entry as any).transferSize === 0
            }
          })
        })
      })
      resourceObserver.observe({ entryTypes: ['resource'] })

      // User timing
      const measureObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.recordPerformanceMetric({
            name: entry.name,
            value: entry.duration,
            timestamp: new Date().toISOString(),
            category: entry.entryType as any,
            details: {
              startTime: entry.startTime
            }
          })
        })
      })
      measureObserver.observe({ entryTypes: ['measure', 'mark'] })

    } catch (error) {
      console.warn('Performance Observer not supported or failed to initialize')
    }
  }

  // ===== RECORDING METHODS =====

  startRecording(): void {
    this.isRecording = true
    logger.info('Debug Tools: Recording started')
  }

  stopRecording(): void {
    this.isRecording = false
    logger.info('Debug Tools: Recording stopped')
  }

  recordNetworkRequest(request: Omit<NetworkRequest, 'id' | 'timestamp'>): void {
    if (!this.isRecording) return

    const networkRequest: NetworkRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...request
    }

    this.networkRequests.push(networkRequest)

    // Keep only last 100 requests
    if (this.networkRequests.length > 100) {
      this.networkRequests = this.networkRequests.slice(-100)
    }
  }

  recordPerformanceMetric(metric: PerformanceMetric): void {
    if (!this.isRecording) return

    this.performanceMetrics.push(metric)

    // Keep only last 200 metrics
    if (this.performanceMetrics.length > 200) {
      this.performanceMetrics = this.performanceMetrics.slice(-200)
    }
  }

  // ===== DATA GETTERS =====

  getLogs(): LogEntry[] {
    const logs = logger.getBuffer()
    return this.filterLogsByTime(logs, this.panelState.filters.timeRange)
      .filter(log => this.panelState.filters.logLevel.includes(log.level))
      .filter(log => {
        if (this.panelState.filters.modules.length === 0) return true
        return this.panelState.filters.modules.includes(log.context.module || 'unknown')
      })
  }

  getCacheData(): {
    queries: any[]
    mutations: any[]
    queryCache: any
    mutationCache: any
    stats: any
  } {
    const queryCache = queryClient.getQueryCache()
    const mutationCache = queryClient.getMutationCache()

    return {
      queries: queryCache.getAll().map(query => ({
        queryKey: query.queryKey,
        state: query.state,
        dataUpdatedAt: query.dataUpdatedAt,
        errorUpdatedAt: query.errorUpdatedAt,
        fetchStatus: query.state.fetchStatus,
        status: query.state.status,
        isStale: query.isStale(),
        isInvalidated: query.state.isInvalidated,
        data: query.state.data,
        error: query.state.error
      })),
      mutations: mutationCache.getAll().map(mutation => ({
        mutationKey: mutation.options.mutationKey,
        state: mutation.state,
        status: mutation.state.status,
        data: mutation.state.data,
        error: mutation.state.error,
        variables: mutation.state.variables
      })),
      queryCache: {
        size: queryCache.getAll().length,
      },
      mutationCache: {
        size: mutationCache.getAll().length,
      },
      stats: logger.getStats()
    }
  }

  getNetworkRequests(): NetworkRequest[] {
    return this.filterRequestsByTime(this.networkRequests, this.panelState.filters.timeRange)
  }

  getErrorStats(): {
    sentryStats: any
    errorMappingStats: any
    recentErrors: LogEntry[]
    errorFrequency: Record<string, number>
  } {
    const recentErrors = logger.getBufferByLevel('error')
    const errorFrequency = recentErrors.reduce((acc, error) => {
      const key = error.context.module || 'unknown'
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      sentryStats: sentryService.getStats(),
      errorMappingStats: errorMappingService.getErrorStats(),
      recentErrors: recentErrors.slice(-20), // Last 20 errors
      errorFrequency
    }
  }

  getPerformanceMetrics(): {
    metrics: PerformanceMetric[]
    webVitals: any
    memoryUsage: any
    timing: any
  } {
    const webVitals = this.getWebVitals()
    const memoryUsage = this.getMemoryUsage()
    const timing = this.getNavigationTiming()

    return {
      metrics: this.filterMetricsByTime(this.performanceMetrics, this.panelState.filters.timeRange),
      webVitals,
      memoryUsage,
      timing
    }
  }

  getSessionInfo(): {
    user: any
    browser: any
    connection: any
    storage: any
    permissions: any
  } {
    const userStore = (window as any).__USER_STORE__
    
    return {
      user: userStore ? {
        id: userStore.user?.id,
        role: userStore.user?.role,
        email: userStore.user?.email,
        sessionId: userStore.sessionId
      } : null,
      browser: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        languages: navigator.languages,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        vendor: (navigator as any).vendor,
        maxTouchPoints: navigator.maxTouchPoints
      },
      connection: (navigator as any).connection ? {
        effectiveType: (navigator as any).connection.effectiveType,
        downlink: (navigator as any).connection.downlink,
        rtt: (navigator as any).connection.rtt,
        saveData: (navigator as any).connection.saveData
      } : null,
      storage: {
        localStorage: this.getStorageSize('localStorage'),
        sessionStorage: this.getStorageSize('sessionStorage'),
        indexedDB: 'Available' // Simplified check
      },
      permissions: {
        notifications: this.checkPermission('notifications'),
        geolocation: this.checkPermission('geolocation')
      }
    }
  }

  // ===== UTILITY METHODS =====

  private filterLogsByTime(logs: LogEntry[], timeRange: string): LogEntry[] {
    const now = Date.now()
    const timeThresholds = {
      'last-hour': 60 * 60 * 1000,
      'last-30min': 30 * 60 * 1000,
      'last-10min': 10 * 60 * 1000,
      'all': Infinity
    }

    const threshold = timeThresholds[timeRange as keyof typeof timeThresholds] || timeThresholds.all
    
    return logs.filter(log => {
      const logTime = new Date(log.timestamp).getTime()
      return (now - logTime) <= threshold
    })
  }

  private filterRequestsByTime(requests: NetworkRequest[], timeRange: string): NetworkRequest[] {
    const now = Date.now()
    const timeThresholds = {
      'last-hour': 60 * 60 * 1000,
      'last-30min': 30 * 60 * 1000,
      'last-10min': 10 * 60 * 1000,
      'all': Infinity
    }

    const threshold = timeThresholds[timeRange as keyof typeof timeThresholds] || timeThresholds.all
    
    return requests.filter(request => {
      const requestTime = new Date(request.timestamp).getTime()
      return (now - requestTime) <= threshold
    })
  }

  private filterMetricsByTime(metrics: PerformanceMetric[], timeRange: string): PerformanceMetric[] {
    const now = Date.now()
    const timeThresholds = {
      'last-hour': 60 * 60 * 1000,
      'last-30min': 30 * 60 * 1000,
      'last-10min': 10 * 60 * 1000,
      'all': Infinity
    }

    const threshold = timeThresholds[timeRange as keyof typeof timeThresholds] || timeThresholds.all
    
    return metrics.filter(metric => {
      const metricTime = new Date(metric.timestamp).getTime()
      return (now - metricTime) <= threshold
    })
  }

  private getWebVitals(): any {
    if (typeof window === 'undefined') return {}

    try {
      return {
        CLS: this.getLayoutShift(),
        FID: this.getFirstInputDelay(),
        LCP: this.getLargestContentfulPaint(),
        FCP: this.getFirstContentfulPaint(),
        TTFB: this.getTimeToFirstByte()
      }
    } catch (error) {
      return { error: 'Web Vitals not available' }
    }
  }

  private getLayoutShift(): number {
    const entries = performance.getEntriesByType('layout-shift') as any[]
    return entries.reduce((sum, entry) => sum + entry.value, 0)
  }

  private getFirstInputDelay(): number {
    const entries = performance.getEntriesByType('first-input') as any[]
    return entries.length > 0 ? entries[0].processingStart - entries[0].startTime : 0
  }

  private getLargestContentfulPaint(): number {
    const entries = performance.getEntriesByType('largest-contentful-paint') as any[]
    return entries.length > 0 ? entries[entries.length - 1].startTime : 0
  }

  private getFirstContentfulPaint(): number {
    const entries = performance.getEntriesByType('paint') as any[]
    const fcp = entries.find(entry => entry.name === 'first-contentful-paint')
    return fcp ? fcp.startTime : 0
  }

  private getTimeToFirstByte(): number {
    const entries = performance.getEntriesByType('navigation') as any[]
    return entries.length > 0 ? entries[0].responseStart - entries[0].requestStart : 0
  }

  private getMemoryUsage(): any {
    const memory = (performance as any).memory
    if (!memory) return { error: 'Memory info not available' }

    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usedPercentage: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100)
    }
  }

  private getNavigationTiming(): any {
    const entries = performance.getEntriesByType('navigation') as any[]
    if (entries.length === 0) return {}

    const nav = entries[0]
    return {
      dnsLookupTime: nav.domainLookupEnd - nav.domainLookupStart,
      tcpConnectTime: nav.connectEnd - nav.connectStart,
      tlsTime: nav.connectEnd - nav.secureConnectionStart,
      requestTime: nav.responseStart - nav.requestStart,
      responseTime: nav.responseEnd - nav.responseStart,
      domParsingTime: nav.domInteractive - nav.responseEnd,
      resourceLoadTime: nav.loadEventStart - nav.domContentLoadedEventEnd
    }
  }

  private getStorageSize(storageType: 'localStorage' | 'sessionStorage'): any {
    try {
      const storage = window[storageType]
      let totalSize = 0
      const items = []

      for (let key in storage) {
        if (storage.hasOwnProperty(key)) {
          const size = storage[key].length
          totalSize += size
          items.push({ key, size })
        }
      }

      return {
        totalSize,
        itemCount: items.length,
        items: items.sort((a, b) => b.size - a.size).slice(0, 10) // Top 10 largest items
      }
    } catch (error) {
      return { error: 'Storage not accessible' }
    }
  }

  private checkPermission(permission: string): string {
    try {
      if ('permissions' in navigator) {
        return 'Checking...' // Would need async call
      }
      return 'Not supported'
    } catch (error) {
      return 'Error'
    }
  }

  // ===== PANEL STATE MANAGEMENT =====

  togglePanel(): void {
    this.panelState.isOpen = !this.panelState.isOpen
    this.notifyListeners()
  }

  setActiveTab(tab: DebugPanelState['activeTab']): void {
    this.panelState.activeTab = tab
    this.notifyListeners()
  }

  updateFilters(filters: Partial<DebugPanelState['filters']>): void {
    this.panelState.filters = { ...this.panelState.filters, ...filters }
    this.notifyListeners()
  }

  getPanelState(): DebugPanelState {
    return { ...this.panelState }
  }

  subscribe(listener: (state: DebugPanelState) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.panelState))
  }

  // ===== EXPORT/IMPORT =====

  exportDebugData(): string {
    const data = {
      timestamp: new Date().toISOString(),
      logs: this.getLogs(),
      cache: this.getCacheData(),
      network: this.getNetworkRequests(),
      errors: this.getErrorStats(),
      performance: this.getPerformanceMetrics(),
      session: this.getSessionInfo()
    }

    return JSON.stringify(data, null, 2)
  }

  clearData(): void {
    this.networkRequests = []
    this.performanceMetrics = []
    logger.clearBuffer()
    
    // Clear query cache
    queryClient.clear()
    
    logger.info('Debug Tools: All data cleared')
  }
}

// ===== SINGLETON INSTANCE =====

export const debugToolsService = new DebugToolsService()

// ===== REACT HOOKS =====

export const useDebugTools = () => {
  const [panelState, setPanelState] = React.useState(debugToolsService.getPanelState())

  React.useEffect(() => {
    return debugToolsService.subscribe(setPanelState)
  }, [])

  return {
    panelState,
    togglePanel: debugToolsService.togglePanel.bind(debugToolsService),
    setActiveTab: debugToolsService.setActiveTab.bind(debugToolsService),
    updateFilters: debugToolsService.updateFilters.bind(debugToolsService),
    getLogs: debugToolsService.getLogs.bind(debugToolsService),
    getCacheData: debugToolsService.getCacheData.bind(debugToolsService),
    getNetworkRequests: debugToolsService.getNetworkRequests.bind(debugToolsService),
    getErrorStats: debugToolsService.getErrorStats.bind(debugToolsService),
    getPerformanceMetrics: debugToolsService.getPerformanceMetrics.bind(debugToolsService),
    getSessionInfo: debugToolsService.getSessionInfo.bind(debugToolsService),
    exportDebugData: debugToolsService.exportDebugData.bind(debugToolsService),
    clearData: debugToolsService.clearData.bind(debugToolsService),
    startRecording: debugToolsService.startRecording.bind(debugToolsService),
    stopRecording: debugToolsService.stopRecording.bind(debugToolsService),
    recordNetworkRequest: debugToolsService.recordNetworkRequest.bind(debugToolsService)
  }
}

export default debugToolsService