/**
 * Performance Monitor - Comprehensive performance tracking and optimization
 * Real-time performance metrics, Core Web Vitals, and optimization recommendations
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'

// Performance metric interfaces
export interface CoreWebVitals {
  FCP: number | null // First Contentful Paint
  LCP: number | null // Largest Contentful Paint
  FID: number | null // First Input Delay
  CLS: number | null // Cumulative Layout Shift
  TTFB: number | null // Time to First Byte
  TTI: number | null // Time to Interactive
}

export interface PerformanceMetrics {
  coreWebVitals: CoreWebVitals
  runtime: {
    componentRenderTime: Map<string, number[]>
    apiResponseTimes: Map<string, number[]>
    bundleLoadTimes: Map<string, number>
    memoryUsage: number[]
    frameRate: number[]
  }
  navigation: {
    loadStart: number
    domContentLoaded: number
    loadComplete: number
    firstPaint: number
    firstContentfulPaint: number
  }
  resources: {
    totalSize: number
    resourceCount: number
    cacheHitRate: number
    slowResources: Array<{ name: string; duration: number; size: number }>
  }
}

export interface PerformanceRecommendation {
  type: 'critical' | 'warning' | 'info'
  category: 'loading' | 'rendering' | 'memory' | 'network' | 'bundle'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  solution: string
  automated?: boolean
}

// Global performance monitor
class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: PerformanceMetrics
  private observers: Map<string, PerformanceObserver> = new Map()
  private onMetricCallbacks: Array<(metrics: PerformanceMetrics) => void> = []
  private startTime: number = Date.now()

  private constructor() {
    this.metrics = this.initializeMetrics()
    this.setupObservers()
    this.collectNavigationMetrics()
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  private initializeMetrics(): PerformanceMetrics {
    return {
      coreWebVitals: {
        FCP: null,
        LCP: null,
        FID: null,
        CLS: null,
        TTFB: null,
        TTI: null
      },
      runtime: {
        componentRenderTime: new Map(),
        apiResponseTimes: new Map(),
        bundleLoadTimes: new Map(),
        memoryUsage: [],
        frameRate: []
      },
      navigation: {
        loadStart: 0,
        domContentLoaded: 0,
        loadComplete: 0,
        firstPaint: 0,
        firstContentfulPaint: 0
      },
      resources: {
        totalSize: 0,
        resourceCount: 0,
        cacheHitRate: 0,
        slowResources: []
      }
    }
  }

  private setupObservers() {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return
    }

    // Core Web Vitals Observer
    this.setupCoreWebVitalsObserver()
    
    // Resource timing observer
    this.setupResourceObserver()
    
    // Navigation timing observer
    this.setupNavigationObserver()
    
    // Layout shift observer
    this.setupLayoutShiftObserver()
    
    // Long task observer
    this.setupLongTaskObserver()

    // Frame rate monitor
    this.setupFrameRateMonitor()
  }

  private setupCoreWebVitalsObserver() {
    try {
      // First Contentful Paint
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint')
        if (fcpEntry) {
          this.metrics.coreWebVitals.FCP = fcpEntry.startTime
          this.notifyMetricUpdate()
        }
      })
      fcpObserver.observe({ entryTypes: ['paint'] })
      this.observers.set('fcp', fcpObserver)

      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        if (lastEntry) {
          this.metrics.coreWebVitals.LCP = lastEntry.startTime
          this.notifyMetricUpdate()
        }
      })
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
      this.observers.set('lcp', lcpObserver)

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach(entry => {
          // Cast to PerformanceEventTiming for first-input entries
          const eventEntry = entry as PerformanceEventTiming
          if (eventEntry.processingStart) {
            this.metrics.coreWebVitals.FID = eventEntry.processingStart - eventEntry.startTime
            this.notifyMetricUpdate()
          }
        })
      })
      fidObserver.observe({ entryTypes: ['first-input'] })
      this.observers.set('fid', fidObserver)

    } catch (error) {
      console.warn('Failed to setup Core Web Vitals observer:', error)
    }
  }

  private setupResourceObserver() {
    try {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries() as PerformanceResourceTiming[]
        
        entries.forEach(entry => {
          const duration = entry.responseEnd - entry.requestStart
          const size = entry.transferSize || 0

          // Track total resources
          this.metrics.resources.resourceCount++
          this.metrics.resources.totalSize += size

          // Track slow resources (>1s)
          if (duration > 1000) {
            this.metrics.resources.slowResources.push({
              name: entry.name,
              duration,
              size
            })
          }

          // Track bundle load times
          if (entry.name.includes('chunk') || entry.name.includes('bundle')) {
            const chunkName = this.extractChunkName(entry.name)
            this.metrics.runtime.bundleLoadTimes.set(chunkName, duration)
          }

          // Track API response times
          if (entry.name.includes('/api/')) {
            const endpoint = this.extractApiEndpoint(entry.name)
            const times = this.metrics.runtime.apiResponseTimes.get(endpoint) || []
            times.push(duration)
            this.metrics.runtime.apiResponseTimes.set(endpoint, times.slice(-10)) // Keep last 10
          }

          // Calculate cache hit rate
          const cached = entry.transferSize === 0 && entry.decodedBodySize > 0
          if (cached) {
            this.metrics.resources.cacheHitRate = 
              (this.metrics.resources.cacheHitRate * (this.metrics.resources.resourceCount - 1) + 1) / 
              this.metrics.resources.resourceCount
          } else {
            this.metrics.resources.cacheHitRate = 
              (this.metrics.resources.cacheHitRate * (this.metrics.resources.resourceCount - 1)) / 
              this.metrics.resources.resourceCount
          }
        })

        this.notifyMetricUpdate()
      })

      resourceObserver.observe({ entryTypes: ['resource'] })
      this.observers.set('resource', resourceObserver)
    } catch (error) {
      console.warn('Failed to setup resource observer:', error)
    }
  }

  private setupNavigationObserver() {
    try {
      const navigationObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries() as PerformanceNavigationTiming[]
        const entry = entries[0]

        if (entry) {
          // Use startTime instead of deprecated navigationStart
          const baseTime = entry.startTime || 0
          this.metrics.navigation = {
            loadStart: entry.loadEventStart - baseTime,
            domContentLoaded: entry.domContentLoadedEventEnd - baseTime,
            loadComplete: entry.loadEventEnd - baseTime,
            firstPaint: 0,
            firstContentfulPaint: 0
          }

          this.metrics.coreWebVitals.TTFB = entry.responseStart - entry.requestStart
          this.notifyMetricUpdate()
        }
      })

      navigationObserver.observe({ entryTypes: ['navigation'] })
      this.observers.set('navigation', navigationObserver)
    } catch (error) {
      console.warn('Failed to setup navigation observer:', error)
    }
  }

  private setupLayoutShiftObserver() {
    try {
      let clsValue = 0
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries() as any[]
        
        entries.forEach(entry => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
          }
        })

        this.metrics.coreWebVitals.CLS = clsValue
        this.notifyMetricUpdate()
      })

      clsObserver.observe({ entryTypes: ['layout-shift'] })
      this.observers.set('cls', clsObserver)
    } catch (error) {
      console.warn('Failed to setup layout shift observer:', error)
    }
  }

  private setupLongTaskObserver() {
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        
        entries.forEach(entry => {
          if (entry.duration > 50) { // Tasks longer than 50ms
            console.warn(`Long task detected: ${entry.duration}ms`, entry)
          }
        })
      })

      longTaskObserver.observe({ entryTypes: ['longtask'] })
      this.observers.set('longtask', longTaskObserver)
    } catch (error) {
      console.warn('Failed to setup long task observer:', error)
    }
  }

  private setupFrameRateMonitor() {
    let lastFrameTime = performance.now()
    let frameCount = 0

    const measureFrameRate = () => {
      const currentTime = performance.now()
      frameCount++

      if (frameCount % 60 === 0) { // Every 60 frames
        const fps = 1000 / (currentTime - lastFrameTime)
        this.metrics.runtime.frameRate.push(fps)
        
        // Keep only last 100 measurements
        if (this.metrics.runtime.frameRate.length > 100) {
          this.metrics.runtime.frameRate = this.metrics.runtime.frameRate.slice(-100)
        }
        
        lastFrameTime = currentTime
      }

      requestAnimationFrame(measureFrameRate)
    }

    requestAnimationFrame(measureFrameRate)
  }

  private collectNavigationMetrics() {
    if (typeof window === 'undefined') return

    // Get navigation timing
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (navigation) {
      this.metrics.coreWebVitals.TTFB = navigation.responseStart - navigation.requestStart
    }

    // Get paint timing
    const paintEntries = performance.getEntriesByType('paint')
    paintEntries.forEach(entry => {
      if (entry.name === 'first-paint') {
        this.metrics.navigation.firstPaint = entry.startTime
      } else if (entry.name === 'first-contentful-paint') {
        this.metrics.navigation.firstContentfulPaint = entry.startTime
        this.metrics.coreWebVitals.FCP = entry.startTime
      }
    })
  }

  private extractChunkName(url: string): string {
    const match = url.match(/\/static\/js\/([^.]+)\./)
    return match ? match[1] : 'unknown'
  }

  private extractApiEndpoint(url: string): string {
    const match = url.match(/\/api\/v\d+\/([^?]+)/)
    return match ? match[1] : 'unknown'
  }

  private notifyMetricUpdate() {
    this.onMetricCallbacks.forEach(callback => {
      try {
        callback(this.metrics)
      } catch (error) {
        console.error('Error in metric callback:', error)
      }
    })
  }

  // Public methods
  trackComponentRender(componentName: string, renderTime: number) {
    const times = this.metrics.runtime.componentRenderTime.get(componentName) || []
    times.push(renderTime)
    this.metrics.runtime.componentRenderTime.set(componentName, times.slice(-20)) // Keep last 20
    this.notifyMetricUpdate()
  }

  trackMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      this.metrics.runtime.memoryUsage.push(memory.usedJSHeapSize)
      
      if (this.metrics.runtime.memoryUsage.length > 100) {
        this.metrics.runtime.memoryUsage = this.metrics.runtime.memoryUsage.slice(-100)
      }
    }
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  getRecommendations(): PerformanceRecommendation[] {
    const recommendations: PerformanceRecommendation[] = []

    // Core Web Vitals recommendations
    if (this.metrics.coreWebVitals.FCP && this.metrics.coreWebVitals.FCP > 1800) {
      recommendations.push({
        type: 'warning',
        category: 'loading',
        title: 'Slow First Contentful Paint',
        description: `FCP is ${(this.metrics.coreWebVitals.FCP / 1000).toFixed(2)}s (should be < 1.8s)`,
        impact: 'high',
        solution: 'Optimize critical resources, reduce render-blocking resources, use resource hints'
      })
    }

    if (this.metrics.coreWebVitals.LCP && this.metrics.coreWebVitals.LCP > 2500) {
      recommendations.push({
        type: 'critical',
        category: 'loading',
        title: 'Poor Largest Contentful Paint',
        description: `LCP is ${(this.metrics.coreWebVitals.LCP / 1000).toFixed(2)}s (should be < 2.5s)`,
        impact: 'high',
        solution: 'Optimize images, improve server response times, eliminate render-blocking resources'
      })
    }

    if (this.metrics.coreWebVitals.CLS && this.metrics.coreWebVitals.CLS > 0.1) {
      recommendations.push({
        type: 'warning',
        category: 'rendering',
        title: 'High Cumulative Layout Shift',
        description: `CLS is ${this.metrics.coreWebVitals.CLS.toFixed(3)} (should be < 0.1)`,
        impact: 'medium',
        solution: 'Set dimensions for images and embeds, avoid inserting content above existing content'
      })
    }

    // Slow resources
    if (this.metrics.resources.slowResources.length > 0) {
      recommendations.push({
        type: 'warning',
        category: 'network',
        title: 'Slow Loading Resources',
        description: `${this.metrics.resources.slowResources.length} resources are loading slowly`,
        impact: 'medium',
        solution: 'Optimize these resources, use CDN, implement preloading'
      })
    }

    // Low cache hit rate
    if (this.metrics.resources.cacheHitRate < 0.7) {
      recommendations.push({
        type: 'info',
        category: 'network',
        title: 'Low Cache Hit Rate',
        description: `Cache hit rate is ${(this.metrics.resources.cacheHitRate * 100).toFixed(1)}%`,
        impact: 'medium',
        solution: 'Implement better caching strategies, use service worker'
      })
    }

    // Bundle size
    const totalBundleSize = Array.from(this.metrics.runtime.bundleLoadTimes.values())
      .reduce((sum, time) => sum + time, 0)
    
    if (totalBundleSize > 5000) {
      recommendations.push({
        type: 'warning',
        category: 'bundle',
        title: 'Large Bundle Size',
        description: 'Bundle load time suggests large bundle size',
        impact: 'high',
        solution: 'Implement code splitting, tree shaking, remove unused dependencies'
      })
    }

    // Memory usage
    const avgMemory = this.metrics.runtime.memoryUsage.length > 0 ?
      this.metrics.runtime.memoryUsage.reduce((sum, mem) => sum + mem, 0) / this.metrics.runtime.memoryUsage.length :
      0

    if (avgMemory > 50 * 1024 * 1024) { // 50MB
      recommendations.push({
        type: 'warning',
        category: 'memory',
        title: 'High Memory Usage',
        description: `Average memory usage is ${(avgMemory / (1024 * 1024)).toFixed(2)}MB`,
        impact: 'medium',
        solution: 'Check for memory leaks, optimize component re-renders, implement virtualization'
      })
    }

    return recommendations
  }

  subscribeToMetrics(callback: (metrics: PerformanceMetrics) => void) {
    this.onMetricCallbacks.push(callback)
    
    return () => {
      const index = this.onMetricCallbacks.indexOf(callback)
      if (index > -1) {
        this.onMetricCallbacks.splice(index, 1)
      }
    }
  }

  exportMetrics() {
    return {
      timestamp: Date.now(),
      sessionDuration: Date.now() - this.startTime,
      url: window.location.href,
      userAgent: navigator.userAgent,
      metrics: this.getMetrics(),
      recommendations: this.getRecommendations()
    }
  }

  destroy() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers.clear()
    this.onMetricCallbacks = []
  }
}

// React hooks
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [recommendations, setRecommendations] = useState<PerformanceRecommendation[]>([])
  const monitor = useRef(PerformanceMonitor.getInstance())

  useEffect(() => {
    const unsubscribe = monitor.current.subscribeToMetrics((newMetrics) => {
      setMetrics(newMetrics)
      setRecommendations(monitor.current.getRecommendations())
    })

    // Initial load
    setMetrics(monitor.current.getMetrics())
    setRecommendations(monitor.current.getRecommendations())

    return unsubscribe
  }, [])

  const trackComponentRender = useCallback((componentName: string, renderTime: number) => {
    monitor.current.trackComponentRender(componentName, renderTime)
  }, [])

  const exportMetrics = useCallback(() => {
    return monitor.current.exportMetrics()
  }, [])

  return {
    metrics,
    recommendations,
    trackComponentRender,
    exportMetrics
  }
}

// Component performance tracker hook
export const useComponentPerformance = (componentName: string) => {
  const renderStartRef = useRef<number>()
  const monitor = PerformanceMonitor.getInstance()

  const startMeasurement = useCallback(() => {
    renderStartRef.current = performance.now()
  }, [])

  const endMeasurement = useCallback(() => {
    if (renderStartRef.current) {
      const renderTime = performance.now() - renderStartRef.current
      monitor.trackComponentRender(componentName, renderTime)
      renderStartRef.current = undefined
    }
  }, [componentName, monitor])

  useEffect(() => {
    startMeasurement()
    return endMeasurement
  })

  return { startMeasurement, endMeasurement }
}

// Performance dashboard component
export const PerformanceDashboard: React.FC<{ 
  minimal?: boolean 
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}> = ({ 
  minimal = false, 
  position = 'bottom-right' 
}) => {
  const { metrics, recommendations } = usePerformanceMonitor()

  if (process.env.NODE_ENV !== 'development' || !metrics) {
    return null
  }

  const positionStyles = {
    'top-left': { top: 10, left: 10 },
    'top-right': { top: 10, right: 10 },
    'bottom-left': { bottom: 10, left: 10 },
    'bottom-right': { bottom: 10, right: 10 }
  }

  const criticalRecommendations = recommendations.filter(r => r.type === 'critical')

  return (
    <div
      style={{
        position: 'fixed',
        ...positionStyles[position],
        background: 'rgba(0, 0, 0, 0.9)',
        color: 'white',
        padding: '12px',
        borderRadius: '8px',
        fontSize: '11px',
        fontFamily: 'monospace',
        zIndex: 9999,
        maxWidth: minimal ? '200px' : '300px',
        maxHeight: '400px',
        overflow: 'auto'
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>⚡ Performance</div>
      
      {/* Core Web Vitals */}
      <div style={{ marginBottom: '8px' }}>
        <div>FCP: {metrics.coreWebVitals.FCP ? `${(metrics.coreWebVitals.FCP / 1000).toFixed(2)}s` : 'N/A'}</div>
        <div>LCP: {metrics.coreWebVitals.LCP ? `${(metrics.coreWebVitals.LCP / 1000).toFixed(2)}s` : 'N/A'}</div>
        <div>CLS: {metrics.coreWebVitals.CLS ? metrics.coreWebVitals.CLS.toFixed(3) : 'N/A'}</div>
      </div>

      {!minimal && (
        <>
          {/* Critical Recommendations */}
          {criticalRecommendations.length > 0 && (
            <div style={{ marginBottom: '8px', color: '#ff6b6b' }}>
              <div style={{ fontWeight: 'bold' }}>⚠ Critical Issues:</div>
              {criticalRecommendations.map((rec, i) => (
                <div key={i} style={{ fontSize: '10px', marginLeft: '8px' }}>
                  {rec.title}
                </div>
              ))}
            </div>
          )}

          {/* Resource Stats */}
          <div style={{ marginBottom: '8px' }}>
            <div>Resources: {metrics.resources.resourceCount}</div>
            <div>Cache Rate: {(metrics.resources.cacheHitRate * 100).toFixed(1)}%</div>
            <div>Slow Resources: {metrics.resources.slowResources.length}</div>
          </div>
        </>
      )}
    </div>
  )
}

export const performanceMonitor = PerformanceMonitor.getInstance()

// Auto-cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    performanceMonitor.destroy()
  })
}