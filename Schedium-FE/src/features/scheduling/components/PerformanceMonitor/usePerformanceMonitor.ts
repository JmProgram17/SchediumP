/**
 * Performance Monitor Hook - Advanced performance tracking and optimization
 * Monitors rendering, memory, network, and user interaction metrics
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

interface PerformanceMetrics {
  // Rendering metrics
  renderTime: number
  frameRate: number
  componentMounts: number
  rerenders: number
  
  // Memory metrics
  memoryUsage: {
    used: number
    total: number
    percentage: number
  }
  
  // Network metrics
  networkRequests: {
    pending: number
    completed: number
    failed: number
    averageResponseTime: number
  }
  
  // User interaction metrics
  interactions: {
    clicks: number
    drags: number
    scrolls: number
    averageResponseTime: number
  }
  
  // Core Web Vitals
  coreWebVitals: {
    fcp: number // First Contentful Paint
    lcp: number // Largest Contentful Paint
    fid: number // First Input Delay
    cls: number // Cumulative Layout Shift
    ttfb: number // Time to First Byte
  }
  
  // Component-specific metrics
  scheduleMatrix: {
    entriesRendered: number
    virtualizationActive: boolean
    scrollPerformance: number
    dragPerformance: number
  }
}

interface PerformanceThresholds {
  renderTime: number // ms
  frameRate: number // fps
  memoryUsage: number // percentage
  responseTime: number // ms
  coreWebVitals: {
    fcp: number
    lcp: number
    fid: number
    cls: number
  }
}

interface UsePerformanceMonitorOptions {
  enableRealTimeMonitoring?: boolean
  enableMemoryTracking?: boolean
  enableNetworkTracking?: boolean
  enableCoreWebVitals?: boolean
  performanceThresholds?: Partial<PerformanceThresholds>
  onPerformanceAlert?: (metric: string, value: number, threshold: number) => void
  sampleRate?: number // How often to collect metrics (ms)
}

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  renderTime: 16, // 60fps = 16.67ms per frame
  frameRate: 55, // Minimum acceptable fps
  memoryUsage: 80, // 80% memory usage
  responseTime: 100, // 100ms response time
  coreWebVitals: {
    fcp: 1.8, // seconds
    lcp: 2.5, // seconds
    fid: 100, // milliseconds
    cls: 0.1 // score
  }
}

export const usePerformanceMonitor = (options: UsePerformanceMonitorOptions = {}) => {
  const {
    enableRealTimeMonitoring = true,
    enableMemoryTracking = true,
    enableNetworkTracking = true,
    enableCoreWebVitals = true,
    performanceThresholds = {},
    onPerformanceAlert,
    sampleRate = 1000
  } = options

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    frameRate: 60,
    componentMounts: 0,
    rerenders: 0,
    memoryUsage: { used: 0, total: 0, percentage: 0 },
    networkRequests: { pending: 0, completed: 0, failed: 0, averageResponseTime: 0 },
    interactions: { clicks: 0, drags: 0, scrolls: 0, averageResponseTime: 0 },
    coreWebVitals: { fcp: 0, lcp: 0, fid: 0, cls: 0, ttfb: 0 },
    scheduleMatrix: { entriesRendered: 0, virtualizationActive: false, scrollPerformance: 0, dragPerformance: 0 }
  })

  const [performanceAlerts, setPerformanceAlerts] = useState<Array<{
    id: string
    metric: string
    value: number
    threshold: number
    timestamp: number
    severity: 'warning' | 'critical'
  }>>([])

  const thresholds = { ...DEFAULT_THRESHOLDS, ...performanceThresholds }
  const queryClient = useQueryClient()

  // Performance tracking refs
  const frameCounterRef = useRef(0)
  const lastFrameTimeRef = useRef(performance.now())
  const renderStartTimeRef = useRef(0)
  const networkRequestsRef = useRef<Map<string, { startTime: number; url: string }>>(new Map())
  const interactionTimesRef = useRef<number[]>([])
  const observersRef = useRef<{
    fps?: number
    memory?: NodeJS.Timeout
    network?: NodeJS.Timeout
    webVitals?: Array<PerformanceObserver>
  }>({})

  // Check if metric exceeds threshold and trigger alert
  const checkThreshold = useCallback((metric: string, value: number, threshold: number) => {
    if (value > threshold) {
      const alertId = `${metric}-${Date.now()}`
      const severity = value > threshold * 1.5 ? 'critical' : 'warning'
      
      setPerformanceAlerts(prev => [...prev.slice(-9), {
        id: alertId,
        metric,
        value,
        threshold,
        timestamp: Date.now(),
        severity
      }])

      onPerformanceAlert?.(metric, value, threshold)
    }
  }, [onPerformanceAlert])

  // Measure frame rate
  const measureFrameRate = useCallback(() => {
    const now = performance.now()
    const deltaTime = now - lastFrameTimeRef.current
    
    if (deltaTime >= 1000) { // Update every second
      const fps = Math.round((frameCounterRef.current * 1000) / deltaTime)
      
      setMetrics(prev => ({ ...prev, frameRate: fps }))
      checkThreshold('frameRate', thresholds.frameRate - fps, 0) // Alert if below threshold
      
      frameCounterRef.current = 0
      lastFrameTimeRef.current = now
    } else {
      frameCounterRef.current++
    }

    if (enableRealTimeMonitoring) {
      observersRef.current.fps = requestAnimationFrame(measureFrameRate)
    }
  }, [enableRealTimeMonitoring, checkThreshold, thresholds.frameRate])

  // Measure memory usage
  const measureMemoryUsage = useCallback(() => {
    if (!enableMemoryTracking || !(performance as any).memory) return

    const memory = (performance as any).memory
    const used = memory.usedJSHeapSize
    const total = memory.totalJSHeapSize
    const percentage = (used / total) * 100

    setMetrics(prev => ({
      ...prev,
      memoryUsage: { used, total, percentage }
    }))

    checkThreshold('memoryUsage', percentage, thresholds.memoryUsage)
  }, [enableMemoryTracking, checkThreshold, thresholds.memoryUsage])

  // Measure network performance
  const measureNetworkPerformance = useCallback(() => {
    if (!enableNetworkTracking) return

    // Get performance entries for network requests
    const entries = performance.getEntriesByType('navigation').concat(
      performance.getEntriesByType('resource')
    ) as PerformanceResourceTiming[]

    const networkRequests = entries.filter(entry => 
      entry.name.includes('/api/') && entry.responseEnd > 0
    )

    const averageResponseTime = networkRequests.length > 0
      ? networkRequests.reduce((sum, entry) => sum + entry.duration, 0) / networkRequests.length
      : 0

    setMetrics(prev => ({
      ...prev,
      networkRequests: {
        ...prev.networkRequests,
        completed: networkRequests.length,
        averageResponseTime
      }
    }))

    checkThreshold('networkResponseTime', averageResponseTime, thresholds.responseTime)
  }, [enableNetworkTracking, checkThreshold, thresholds.responseTime])

  // Measure Core Web Vitals
  const measureCoreWebVitals = useCallback(() => {
    if (!enableCoreWebVitals || typeof PerformanceObserver === 'undefined') return

    const observers: PerformanceObserver[] = []

    // Largest Contentful Paint (LCP)
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1] as any
        if (lastEntry) {
          const lcp = lastEntry.startTime / 1000
          setMetrics(prev => ({
            ...prev,
            coreWebVitals: { ...prev.coreWebVitals, lcp }
          }))
          checkThreshold('lcp', lcp, thresholds.coreWebVitals.lcp)
        }
      })
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
      observers.push(lcpObserver)
    } catch (error) {
      console.warn('LCP observer not supported')
    }

    // First Input Delay (FID)
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          const fid = entry.processingStart - entry.startTime
          setMetrics(prev => ({
            ...prev,
            coreWebVitals: { ...prev.coreWebVitals, fid }
          }))
          checkThreshold('fid', fid, thresholds.coreWebVitals.fid)
        })
      })
      fidObserver.observe({ entryTypes: ['first-input'] })
      observers.push(fidObserver)
    } catch (error) {
      console.warn('FID observer not supported')
    }

    // Cumulative Layout Shift (CLS)
    try {
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
          }
        })
        
        if (clsValue > 0) {
          setMetrics(prev => ({
            ...prev,
            coreWebVitals: { ...prev.coreWebVitals, cls: clsValue }
          }))
          checkThreshold('cls', clsValue, thresholds.coreWebVitals.cls)
        }
      })
      clsObserver.observe({ entryTypes: ['layout-shift'] })
      observers.push(clsObserver)
    } catch (error) {
      console.warn('CLS observer not supported')
    }

    observersRef.current.webVitals = observers
  }, [enableCoreWebVitals, checkThreshold, thresholds.coreWebVitals])

  // Track render performance
  const startRenderMeasurement = useCallback((componentName?: string) => {
    renderStartTimeRef.current = performance.now()
  }, [])

  const endRenderMeasurement = useCallback((componentName?: string) => {
    if (renderStartTimeRef.current === 0) return

    const renderTime = performance.now() - renderStartTimeRef.current
    
    setMetrics(prev => ({
      ...prev,
      renderTime,
      rerenders: prev.rerenders + 1
    }))

    checkThreshold('renderTime', renderTime, thresholds.renderTime)
    
    renderStartTimeRef.current = 0
  }, [checkThreshold, thresholds.renderTime])

  // Track component mount
  const trackComponentMount = useCallback((componentName?: string) => {
    setMetrics(prev => ({
      ...prev,
      componentMounts: prev.componentMounts + 1
    }))
  }, [])

  // Track user interactions
  const trackInteraction = useCallback((type: 'click' | 'drag' | 'scroll', startTime?: number) => {
    const endTime = performance.now()
    const responseTime = startTime ? endTime - startTime : 0

    if (responseTime > 0) {
      interactionTimesRef.current.push(responseTime)
      // Keep only last 100 interactions
      if (interactionTimesRef.current.length > 100) {
        interactionTimesRef.current.shift()
      }
    }

    const averageResponseTime = interactionTimesRef.current.length > 0
      ? interactionTimesRef.current.reduce((sum, time) => sum + time, 0) / interactionTimesRef.current.length
      : 0

    setMetrics(prev => ({
      ...prev,
      interactions: {
        ...prev.interactions,
        [type]: prev.interactions[type] + 1,
        averageResponseTime
      }
    }))

    if (responseTime > 0) {
      checkThreshold('interactionResponseTime', responseTime, thresholds.responseTime)
    }
  }, [checkThreshold, thresholds.responseTime])

  // Track schedule matrix specific metrics
  const trackScheduleMatrix = useCallback((data: {
    entriesRendered?: number
    virtualizationActive?: boolean
    scrollPerformance?: number
    dragPerformance?: number
  }) => {
    setMetrics(prev => ({
      ...prev,
      scheduleMatrix: { ...prev.scheduleMatrix, ...data }
    }))
  }, [])

  // Get performance summary
  const getPerformanceSummary = useCallback(() => {
    const summary = {
      overall: 'good' as 'good' | 'warning' | 'critical',
      criticalIssues: 0,
      warnings: 0,
      recommendations: [] as string[]
    }

    // Check each metric against thresholds
    if (metrics.frameRate < thresholds.frameRate) {
      summary.overall = 'warning'
      summary.warnings++
      summary.recommendations.push('Frame rate is below optimal. Consider reducing DOM complexity.')
    }

    if (metrics.renderTime > thresholds.renderTime) {
      summary.overall = 'warning'
      summary.warnings++
      summary.recommendations.push('Render time is high. Consider optimizing component renders.')
    }

    if (metrics.memoryUsage.percentage > thresholds.memoryUsage) {
      summary.overall = 'critical'
      summary.criticalIssues++
      summary.recommendations.push('Memory usage is high. Check for memory leaks.')
    }

    if (metrics.networkRequests.averageResponseTime > thresholds.responseTime) {
      summary.overall = 'warning'
      summary.warnings++
      summary.recommendations.push('Network requests are slow. Consider optimizing API calls.')
    }

    if (metrics.coreWebVitals.lcp > thresholds.coreWebVitals.lcp) {
      summary.overall = 'warning'
      summary.warnings++
      summary.recommendations.push('Largest Contentful Paint is slow. Optimize critical resources.')
    }

    return summary
  }, [metrics, thresholds])

  // Export performance data
  const exportPerformanceData = useCallback(() => {
    const exportData = {
      timestamp: Date.now(),
      metrics,
      alerts: performanceAlerts,
      summary: getPerformanceSummary(),
      thresholds,
      browserInfo: {
        userAgent: navigator.userAgent,
        memory: (performance as any).memory,
        connection: (navigator as any).connection
      }
    }

    return exportData
  }, [metrics, performanceAlerts, getPerformanceSummary, thresholds])

  // Clear performance data
  const clearPerformanceData = useCallback(() => {
    setMetrics({
      renderTime: 0,
      frameRate: 60,
      componentMounts: 0,
      rerenders: 0,
      memoryUsage: { used: 0, total: 0, percentage: 0 },
      networkRequests: { pending: 0, completed: 0, failed: 0, averageResponseTime: 0 },
      interactions: { clicks: 0, drags: 0, scrolls: 0, averageResponseTime: 0 },
      coreWebVitals: { fcp: 0, lcp: 0, fid: 0, cls: 0, ttfb: 0 },
      scheduleMatrix: { entriesRendered: 0, virtualizationActive: false, scrollPerformance: 0, dragPerformance: 0 }
    })
    setPerformanceAlerts([])
    interactionTimesRef.current = []
  }, [])

  // Initialize monitoring
  useEffect(() => {
    if (enableRealTimeMonitoring) {
      measureFrameRate()
      measureCoreWebVitals()

      // Set up periodic measurements
      observersRef.current.memory = setInterval(measureMemoryUsage, sampleRate)
      observersRef.current.network = setInterval(measureNetworkPerformance, sampleRate * 5) // Less frequent
    }

    return () => {
      // Cleanup observers
      if (observersRef.current.fps) {
        cancelAnimationFrame(observersRef.current.fps)
      }
      if (observersRef.current.memory) {
        clearInterval(observersRef.current.memory)
      }
      if (observersRef.current.network) {
        clearInterval(observersRef.current.network)
      }
      if (observersRef.current.webVitals) {
        observersRef.current.webVitals.forEach(observer => observer.disconnect())
      }
    }
  }, [enableRealTimeMonitoring, measureFrameRate, measureMemoryUsage, measureNetworkPerformance, measureCoreWebVitals, sampleRate])

  return {
    // Current metrics
    metrics,
    performanceAlerts,
    
    // Measurement functions
    startRenderMeasurement,
    endRenderMeasurement,
    trackComponentMount,
    trackInteraction,
    trackScheduleMatrix,
    
    // Analysis
    getPerformanceSummary,
    
    // Utilities
    exportPerformanceData,
    clearPerformanceData,
    
    // State
    isMonitoringActive: enableRealTimeMonitoring,
    thresholds
  }
}