/**
 * Performance Monitoring Hook - Advanced performance tracking and optimization
 * Provides comprehensive performance metrics and optimization suggestions
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { toast } from 'react-hot-toast'

export interface PerformanceMetrics {
  // Rendering metrics
  renderTime: number
  virtualScrollPerformance: {
    averageFrameTime: number
    droppedFrames: number
    scrollFPS: number
  }
  
  // Memory metrics
  memoryUsage: {
    usedJSHeapSize: number
    totalJSHeapSize: number
    jsHeapSizeLimit: number
  }
  
  // Network metrics
  networkLatency: number
  bundleSize: number
  cacheHitRate: number
  
  // User interaction metrics
  interactionLatency: {
    dragStart: number
    dropComplete: number
    searchResponse: number
    filterResponse: number
  }
  
  // WebSocket performance
  websocketMetrics: {
    connectionTime: number
    messageLatency: number
    reconnectionCount: number
    messageQueueSize: number
  }
  
  // Database query performance
  queryMetrics: {
    averageQueryTime: number
    slowQueries: number
    cacheHitRatio: number
  }
}

export interface PerformanceAlert {
  id: string
  type: 'warning' | 'error' | 'info'
  category: 'memory' | 'network' | 'rendering' | 'interaction'
  message: string
  details: string
  impact: 'low' | 'medium' | 'high'
  suggestion: string
  timestamp: Date
  isResolved: boolean
}

export interface PerformanceThresholds {
  maxRenderTime: number
  maxMemoryUsage: number
  maxNetworkLatency: number
  minFPS: number
  maxInteractionDelay: number
}

export interface PerformanceConfig {
  enableDetailedProfiling: boolean
  enableMemoryMonitoring: boolean
  enableNetworkMonitoring: boolean
  enableUserTiming: boolean
  alertThresholds: PerformanceThresholds
  samplingRate: number
  reportingInterval: number
}

export interface PerformanceOptimization {
  id: string
  category: string
  description: string
  impact: 'low' | 'medium' | 'high'
  effort: 'low' | 'medium' | 'high'
  implemented: boolean
  estimatedImprovement: string
}

export interface PerformanceReport {
  timestamp: Date
  overallScore: number
  metrics: PerformanceMetrics
  alerts: PerformanceAlert[]
  optimizations: PerformanceOptimization[]
  trends: {
    renderingTrend: 'improving' | 'stable' | 'degrading'
    memoryTrend: 'improving' | 'stable' | 'degrading'
    networkTrend: 'improving' | 'stable' | 'degrading'
  }
}

export interface PerformanceMonitoringAPI {
  // Current state
  currentMetrics: PerformanceMetrics
  activeAlerts: PerformanceAlert[]
  optimizations: PerformanceOptimization[]
  isMonitoring: boolean
  
  // Controls
  startMonitoring: () => void
  stopMonitoring: () => void
  generateReport: () => PerformanceReport
  clearAlerts: () => void
  
  // Measurement functions
  measureRenderTime: (componentName: string, fn: () => void) => number
  measureInteraction: (interactionType: string, fn: () => Promise<void>) => Promise<number>
  trackMemoryUsage: () => void
  trackNetworkLatency: (url: string) => Promise<number>
  
  // Optimization suggestions
  getOptimizationSuggestions: () => PerformanceOptimization[]
  markOptimizationImplemented: (optimizationId: string) => void
  
  // Alerts
  dismissAlert: (alertId: string) => void
  getAlertsByCategory: (category: PerformanceAlert['category']) => PerformanceAlert[]
  
  // Performance utilities
  scheduleIdleCallback: (callback: () => void) => void
  isPageVisible: boolean
  connectionType: string
}

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  maxRenderTime: 16, // 60 FPS
  maxMemoryUsage: 100 * 1024 * 1024, // 100MB
  maxNetworkLatency: 1000, // 1s
  minFPS: 30,
  maxInteractionDelay: 100 // 100ms
}

const DEFAULT_CONFIG: PerformanceConfig = {
  enableDetailedProfiling: true,
  enableMemoryMonitoring: true,
  enableNetworkMonitoring: true,
  enableUserTiming: true,
  alertThresholds: DEFAULT_THRESHOLDS,
  samplingRate: 0.1, // 10% sampling
  reportingInterval: 60000 // 1 minute
}

export const usePerformanceMonitoring = (
  config: Partial<PerformanceConfig> = {}
): PerformanceMonitoringAPI => {
  const fullConfig = { ...DEFAULT_CONFIG, ...config }
  
  // State
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [currentMetrics, setCurrentMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    virtualScrollPerformance: {
      averageFrameTime: 0,
      droppedFrames: 0,
      scrollFPS: 0
    },
    memoryUsage: {
      usedJSHeapSize: 0,
      totalJSHeapSize: 0,
      jsHeapSizeLimit: 0
    },
    networkLatency: 0,
    bundleSize: 0,
    cacheHitRate: 0,
    interactionLatency: {
      dragStart: 0,
      dropComplete: 0,
      searchResponse: 0,
      filterResponse: 0
    },
    websocketMetrics: {
      connectionTime: 0,
      messageLatency: 0,
      reconnectionCount: 0,
      messageQueueSize: 0
    },
    queryMetrics: {
      averageQueryTime: 0,
      slowQueries: 0,
      cacheHitRatio: 0
    }
  })
  
  const [activeAlerts, setActiveAlerts] = useState<PerformanceAlert[]>([])
  const [optimizations, setOptimizations] = useState<PerformanceOptimization[]>([])
  const [isPageVisible, setIsPageVisible] = useState(!document.hidden)
  const [connectionType, setConnectionType] = useState('unknown')
  
  // Refs for tracking
  const metricsHistory = useRef<PerformanceMetrics[]>([])
  const frameTimeTracker = useRef<number[]>([])
  const interactionStartTimes = useRef<Map<string, number>>(new Map())
  const reportingInterval = useRef<NodeJS.Timeout | null>(null)
  const observer = useRef<PerformanceObserver | null>(null)

  // Performance observer setup
  useEffect(() => {
    if (!isMonitoring || !('PerformanceObserver' in window)) return

    try {
      observer.current = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        
        entries.forEach((entry) => {
          switch (entry.entryType) {
            case 'measure':
              handleMeasureEntry(entry as PerformanceMeasure)
              break
            case 'navigation':
              handleNavigationEntry(entry as PerformanceNavigationTiming)
              break
            case 'resource':
              handleResourceEntry(entry as PerformanceResourceTiming)
              break
            case 'paint':
              handlePaintEntry(entry as PerformancePaintTiming)
              break
          }
        })
      })

      observer.current.observe({ 
        entryTypes: ['measure', 'navigation', 'resource', 'paint'] 
      })
    } catch (error) {
      console.warn('Performance monitoring not supported:', error)
    }

    return () => {
      observer.current?.disconnect()
    }
  }, [isMonitoring])

  // Handle different performance entries
  const handleMeasureEntry = useCallback((entry: PerformanceMeasure) => {
    if (entry.name.startsWith('render-')) {
      setCurrentMetrics(prev => ({
        ...prev,
        renderTime: entry.duration
      }))
      
      // Check render time threshold
      if (entry.duration > fullConfig.alertThresholds.maxRenderTime) {
        addAlert({
          type: 'warning',
          category: 'rendering',
          message: `Render time exceeded threshold: ${entry.duration.toFixed(2)}ms`,
          details: `Component: ${entry.name.replace('render-', '')}`,
          impact: entry.duration > fullConfig.alertThresholds.maxRenderTime * 2 ? 'high' : 'medium',
          suggestion: 'Consider optimizing component render logic or implementing React.memo()'
        })
      }
    }
  }, [fullConfig.alertThresholds.maxRenderTime])

  const handleNavigationEntry = useCallback((entry: PerformanceNavigationTiming) => {
    const loadTime = entry.loadEventEnd - entry.navigationStart
    
    setCurrentMetrics(prev => ({
      ...prev,
      networkLatency: loadTime
    }))
  }, [])

  const handleResourceEntry = useCallback((entry: PerformanceResourceTiming) => {
    const duration = entry.responseEnd - entry.requestStart
    
    if (duration > fullConfig.alertThresholds.maxNetworkLatency) {
      addAlert({
        type: 'warning',
        category: 'network',
        message: `Slow resource loading: ${entry.name}`,
        details: `Duration: ${duration.toFixed(2)}ms`,
        impact: 'medium',
        suggestion: 'Consider optimizing resource size or implementing caching'
      })
    }
  }, [fullConfig.alertThresholds.maxNetworkLatency])

  const handlePaintEntry = useCallback((entry: PerformancePaintTiming) => {
    // Track paint performance for overall UX metrics
    console.log(`Paint performance: ${entry.name} - ${entry.startTime}ms`)
  }, [])

  // Memory monitoring
  const trackMemoryUsage = useCallback(() => {
    if (!('memory' in performance)) return

    const memory = (performance as any).memory
    const memoryUsage = {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit
    }

    setCurrentMetrics(prev => ({
      ...prev,
      memoryUsage
    }))

    // Check memory threshold
    if (memory.usedJSHeapSize > fullConfig.alertThresholds.maxMemoryUsage) {
      addAlert({
        type: 'error',
        category: 'memory',
        message: 'High memory usage detected',
        details: `Used: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        impact: 'high',
        suggestion: 'Check for memory leaks or consider implementing virtualization'
      })
    }
  }, [fullConfig.alertThresholds.maxMemoryUsage])

  // Frame rate monitoring
  const trackFrameRate = useCallback(() => {
    let frameCount = 0
    let lastTime = performance.now()

    const countFrames = () => {
      frameCount++
      const currentTime = performance.now()
      const deltaTime = currentTime - lastTime

      frameTimeTracker.current.push(deltaTime)
      if (frameTimeTracker.current.length > 60) {
        frameTimeTracker.current.shift()
      }

      // Calculate FPS
      if (frameTimeTracker.current.length >= 10) {
        const averageFrameTime = frameTimeTracker.current.reduce((a, b) => a + b, 0) / frameTimeTracker.current.length
        const fps = 1000 / averageFrameTime

        setCurrentMetrics(prev => ({
          ...prev,
          virtualScrollPerformance: {
            ...prev.virtualScrollPerformance,
            averageFrameTime,
            scrollFPS: fps,
            droppedFrames: fps < fullConfig.alertThresholds.minFPS ? prev.virtualScrollPerformance.droppedFrames + 1 : 0
          }
        }))

        // Check FPS threshold
        if (fps < fullConfig.alertThresholds.minFPS) {
          addAlert({
            type: 'warning',
            category: 'rendering',
            message: `Low frame rate detected: ${fps.toFixed(1)} FPS`,
            details: `Target: ${fullConfig.alertThresholds.minFPS} FPS`,
            impact: 'medium',
            suggestion: 'Consider reducing DOM complexity or implementing virtualization'
          })
        }
      }

      lastTime = currentTime
      if (isMonitoring) {
        requestAnimationFrame(countFrames)
      }
    }

    requestAnimationFrame(countFrames)
  }, [isMonitoring, fullConfig.alertThresholds.minFPS])

  // Add performance alert
  const addAlert = useCallback((alertData: Omit<PerformanceAlert, 'id' | 'timestamp' | 'isResolved'>) => {
    const alert: PerformanceAlert = {
      ...alertData,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      isResolved: false
    }

    setActiveAlerts(prev => [...prev, alert])
    
    // Show toast notification for high impact alerts
    if (alert.impact === 'high') {
      toast.error(alert.message)
    }
  }, [])

  // Measure render time
  const measureRenderTime = useCallback((componentName: string, fn: () => void): number => {
    if (!fullConfig.enableDetailedProfiling) {
      fn()
      return 0
    }

    const measureName = `render-${componentName}`
    const startMark = `${measureName}-start`
    const endMark = `${measureName}-end`

    performance.mark(startMark)
    fn()
    performance.mark(endMark)
    
    performance.measure(measureName, startMark, endMark)
    
    const entries = performance.getEntriesByName(measureName, 'measure')
    const duration = entries.length > 0 ? entries[entries.length - 1].duration : 0
    
    // Clean up marks
    performance.clearMarks(startMark)
    performance.clearMarks(endMark)
    performance.clearMeasures(measureName)
    
    return duration
  }, [fullConfig.enableDetailedProfiling])

  // Measure interaction latency
  const measureInteraction = useCallback(async (interactionType: string, fn: () => Promise<void>): Promise<number> => {
    const startTime = performance.now()
    
    await fn()
    
    const duration = performance.now() - startTime
    
    setCurrentMetrics(prev => ({
      ...prev,
      interactionLatency: {
        ...prev.interactionLatency,
        [interactionType]: duration
      }
    }))

    // Check interaction delay threshold
    if (duration > fullConfig.alertThresholds.maxInteractionDelay) {
      addAlert({
        type: 'warning',
        category: 'interaction',
        message: `Slow interaction: ${interactionType}`,
        details: `Duration: ${duration.toFixed(2)}ms`,
        impact: 'medium',
        suggestion: 'Consider debouncing or optimizing the interaction handler'
      })
    }
    
    return duration
  }, [fullConfig.alertThresholds.maxInteractionDelay, addAlert])

  // Track network latency
  const trackNetworkLatency = useCallback(async (url: string): Promise<number> => {
    const startTime = performance.now()
    
    try {
      await fetch(url, { method: 'HEAD' })
      const latency = performance.now() - startTime
      
      setCurrentMetrics(prev => ({
        ...prev,
        networkLatency: latency
      }))
      
      return latency
    } catch (error) {
      return -1
    }
  }, [])

  // Get optimization suggestions
  const getOptimizationSuggestions = useCallback((): PerformanceOptimization[] => {
    const suggestions: PerformanceOptimization[] = []
    
    // Memory optimization
    if (currentMetrics.memoryUsage.usedJSHeapSize > 50 * 1024 * 1024) {
      suggestions.push({
        id: 'memory-optimization-1',
        category: 'memory',
        description: 'Implement component memoization to reduce re-renders',
        impact: 'medium',
        effort: 'low',
        implemented: false,
        estimatedImprovement: '15-25% memory reduction'
      })
    }
    
    // Rendering optimization
    if (currentMetrics.renderTime > 10) {
      suggestions.push({
        id: 'render-optimization-1',
        category: 'rendering',
        description: 'Implement virtualization for large lists',
        impact: 'high',
        effort: 'medium',
        implemented: false,
        estimatedImprovement: '50-70% render time improvement'
      })
    }
    
    // Network optimization
    if (currentMetrics.networkLatency > 500) {
      suggestions.push({
        id: 'network-optimization-1',
        category: 'network',
        description: 'Implement request caching and batching',
        impact: 'medium',
        effort: 'medium',
        implemented: false,
        estimatedImprovement: '30-40% latency reduction'
      })
    }
    
    return suggestions
  }, [currentMetrics])

  // Generate performance report
  const generateReport = useCallback((): PerformanceReport => {
    const score = calculateOverallScore()
    
    return {
      timestamp: new Date(),
      overallScore: score,
      metrics: currentMetrics,
      alerts: activeAlerts,
      optimizations: getOptimizationSuggestions(),
      trends: {
        renderingTrend: calculateTrend('rendering'),
        memoryTrend: calculateTrend('memory'),
        networkTrend: calculateTrend('network')
      }
    }
  }, [currentMetrics, activeAlerts, getOptimizationSuggestions])

  // Calculate overall performance score
  const calculateOverallScore = useCallback((): number => {
    let score = 100
    
    // Deduct points for various issues
    if (currentMetrics.renderTime > fullConfig.alertThresholds.maxRenderTime) {
      score -= 20
    }
    if (currentMetrics.memoryUsage.usedJSHeapSize > fullConfig.alertThresholds.maxMemoryUsage) {
      score -= 25
    }
    if (currentMetrics.networkLatency > fullConfig.alertThresholds.maxNetworkLatency) {
      score -= 15
    }
    if (currentMetrics.virtualScrollPerformance.scrollFPS < fullConfig.alertThresholds.minFPS) {
      score -= 20
    }
    
    // Deduct points for active alerts
    activeAlerts.forEach(alert => {
      if (alert.impact === 'high') score -= 10
      else if (alert.impact === 'medium') score -= 5
      else score -= 2
    })
    
    return Math.max(0, score)
  }, [currentMetrics, activeAlerts, fullConfig.alertThresholds])

  // Calculate performance trends
  const calculateTrend = useCallback((category: string): 'improving' | 'stable' | 'degrading' => {
    if (metricsHistory.current.length < 2) return 'stable'
    
    // Simple trend analysis based on recent metrics
    const recent = metricsHistory.current.slice(-5)
    // Implementation would compare metrics over time
    return 'stable'
  }, [])

  // Start monitoring
  const startMonitoring = useCallback(() => {
    setIsMonitoring(true)
    
    // Start frame rate tracking
    trackFrameRate()
    
    // Start periodic memory monitoring
    const memoryInterval = setInterval(trackMemoryUsage, 5000)
    
    // Start reporting interval
    reportingInterval.current = setInterval(() => {
      metricsHistory.current.push({ ...currentMetrics })
      if (metricsHistory.current.length > 100) {
        metricsHistory.current.shift()
      }
    }, fullConfig.reportingInterval)
    
    return () => {
      clearInterval(memoryInterval)
      if (reportingInterval.current) {
        clearInterval(reportingInterval.current)
      }
    }
  }, [trackFrameRate, trackMemoryUsage, currentMetrics, fullConfig.reportingInterval])

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false)
    
    if (reportingInterval.current) {
      clearInterval(reportingInterval.current)
      reportingInterval.current = null
    }
  }, [])

  // Page visibility tracking
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(!document.hidden)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  // Connection type tracking
  useEffect(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      setConnectionType(connection.effectiveType || 'unknown')
      
      const handleConnectionChange = () => {
        setConnectionType(connection.effectiveType || 'unknown')
      }
      
      connection.addEventListener('change', handleConnectionChange)
      return () => connection.removeEventListener('change', handleConnectionChange)
    }
  }, [])

  // Initialize optimizations
  useEffect(() => {
    setOptimizations(getOptimizationSuggestions())
  }, [getOptimizationSuggestions])

  // Utility functions
  const scheduleIdleCallback = useCallback((callback: () => void) => {
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(callback)
    } else {
      setTimeout(callback, 1)
    }
  }, [])

  const dismissAlert = useCallback((alertId: string) => {
    setActiveAlerts(prev => prev.filter(alert => alert.id !== alertId))
  }, [])

  const clearAlerts = useCallback(() => {
    setActiveAlerts([])
  }, [])

  const getAlertsByCategory = useCallback((category: PerformanceAlert['category']) => {
    return activeAlerts.filter(alert => alert.category === category)
  }, [activeAlerts])

  const markOptimizationImplemented = useCallback((optimizationId: string) => {
    setOptimizations(prev => 
      prev.map(opt => 
        opt.id === optimizationId 
          ? { ...opt, implemented: true }
          : opt
      )
    )
  }, [])

  return {
    // State
    currentMetrics,
    activeAlerts,
    optimizations,
    isMonitoring,
    
    // Controls
    startMonitoring,
    stopMonitoring,
    generateReport,
    clearAlerts,
    
    // Measurement functions
    measureRenderTime,
    measureInteraction,
    trackMemoryUsage,
    trackNetworkLatency,
    
    // Optimization suggestions
    getOptimizationSuggestions,
    markOptimizationImplemented,
    
    // Alerts
    dismissAlert,
    getAlertsByCategory,
    
    // Utilities
    scheduleIdleCallback,
    isPageVisible,
    connectionType
  }
}