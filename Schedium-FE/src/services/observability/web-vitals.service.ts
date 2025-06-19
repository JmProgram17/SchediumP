/**
 * FASE 5: Web Vitals y Métricas de Rendimiento
 * 
 * Monitoreo completo de rendimiento web:
 * - Core Web Vitals (CLS, FID, LCP, FCP, TTFB)
 * - Custom performance metrics
 * - Real-time monitoring
 * - Integración con Sentry y logging
 * - Performance budgets y alerts
 */

import { onCLS, onINP, onFCP, onLCP, onTTFB } from 'web-vitals'
import { logger } from './logger.service'
import { sentryService } from './sentry.service'
import { debugToolsService } from './debug-tools.service'

// ===== TYPES =====

export interface WebVitalMetric {
  id: string
  name: 'CLS' | 'INP' | 'FCP' | 'LCP' | 'TTFB'
  value: number
  delta: number
  rating: 'good' | 'needs-improvement' | 'poor'
  navigationType: 'navigate' | 'reload' | 'back-forward' | 'prerender'
  timestamp: string
}

export interface CustomMetric {
  name: string
  value: number
  unit: 'ms' | 'bytes' | 'count' | 'percentage'
  category: 'performance' | 'user-experience' | 'business' | 'technical'
  timestamp: string
  context?: Record<string, any>
}

export interface PerformanceBudget {
  metric: string
  threshold: number
  operator: '>' | '<' | '>=' | '<='
  enabled: boolean
  alertMessage?: string
}

export interface PerformanceReport {
  timestamp: string
  webVitals: WebVitalMetric[]
  customMetrics: CustomMetric[]
  budgetViolations: Array<{
    budget: PerformanceBudget
    actualValue: number
    violation: boolean
  }>
  recommendations: string[]
  score: number // 0-100 performance score
}

// ===== WEB VITALS THRESHOLDS =====

const WEB_VITALS_THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25 },
  INP: { good: 200, poor: 500 },
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 }
}

// ===== DEFAULT PERFORMANCE BUDGETS =====

const DEFAULT_BUDGETS: PerformanceBudget[] = [
  {
    metric: 'LCP',
    threshold: 2500,
    operator: '<=',
    enabled: true,
    alertMessage: 'Largest Contentful Paint is too slow'
  },
  {
    metric: 'INP',
    threshold: 100,
    operator: '<=',
    enabled: true,
    alertMessage: 'Interaction to Next Paint is too high'
  },
  {
    metric: 'CLS',
    threshold: 0.1,
    operator: '<=',
    enabled: true,
    alertMessage: 'Cumulative Layout Shift is too high'
  },
  {
    metric: 'FCP',
    threshold: 1800,
    operator: '<=',
    enabled: true,
    alertMessage: 'First Contentful Paint is too slow'
  },
  {
    metric: 'TTFB',
    threshold: 800,
    operator: '<=',
    enabled: true,
    alertMessage: 'Time to First Byte is too slow'
  }
]

// ===== WEB VITALS SERVICE =====

class WebVitalsService {
  private webVitals: WebVitalMetric[] = []
  private customMetrics: CustomMetric[] = []
  private budgets: PerformanceBudget[] = [...DEFAULT_BUDGETS]
  private isMonitoring = false
  private performanceObserver?: PerformanceObserver

  constructor() {
    this.initializeWebVitals()
  }

  private initializeWebVitals(): void {
    if (typeof window === 'undefined') return

    // Start monitoring in development and production
    this.startMonitoring()

    // Set up resource timing observer
    this.setupResourceTimingObserver()

    // Set up navigation observer
    this.setupNavigationObserver()

    // Set up custom metrics collection
    this.setupCustomMetricsCollection()
  }

  startMonitoring(): void {
    if (this.isMonitoring) return

    this.isMonitoring = true

    // Core Web Vitals
    onCLS(this.handleWebVital.bind(this), { reportAllChanges: true })
    onINP(this.handleWebVital.bind(this))
    onFCP(this.handleWebVital.bind(this))
    onLCP(this.handleWebVital.bind(this), { reportAllChanges: true })
    onTTFB(this.handleWebVital.bind(this))

    logger.info('Web Vitals monitoring started')
  }

  stopMonitoring(): void {
    this.isMonitoring = false
    
    if (this.performanceObserver) {
      this.performanceObserver.disconnect()
    }

    logger.info('Web Vitals monitoring stopped')
  }

  private handleWebVital(metric: any): void {
    const webVital: WebVitalMetric = {
      id: metric.id,
      name: metric.name as WebVitalMetric['name'],
      value: Math.round(metric.value),
      delta: Math.round(metric.delta),
      rating: this.getRating(metric.name, metric.value),
      navigationType: metric.navigationType || 'navigate',
      timestamp: new Date().toISOString()
    }

    // Store the metric
    this.webVitals.push(webVital)

    // Keep only last 50 metrics
    if (this.webVitals.length > 50) {
      this.webVitals = this.webVitals.slice(-50)
    }

    // Log the metric
    logger.info('Web Vital Recorded', {
      metric: webVital.name,
      value: webVital.value,
      rating: webVital.rating,
      delta: webVital.delta
    })

    // Send to Sentry
    sentryService.captureWebVital(metric)

    // Send to debug tools
    debugToolsService.recordPerformanceMetric({
      name: `web-vital-${webVital.name}`,
      value: webVital.value,
      timestamp: webVital.timestamp,
      category: 'measure',
      details: {
        rating: webVital.rating,
        delta: webVital.delta,
        navigationType: webVital.navigationType
      }
    })

    // Check performance budgets
    this.checkPerformanceBudgets(webVital)

    // Performance recommendations
    if (webVital.rating === 'poor') {
      this.generateRecommendations(webVital)
    }
  }

  private getRating(metricName: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = WEB_VITALS_THRESHOLDS[metricName as keyof typeof WEB_VITALS_THRESHOLDS]
    if (!thresholds) return 'good'

    if (value <= thresholds.good) return 'good'
    if (value <= thresholds.poor) return 'needs-improvement'
    return 'poor'
  }

  private setupResourceTimingObserver(): void {
    if (!window.PerformanceObserver) return

    try {
      this.performanceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          // Track large resources
          if (entry.duration > 1000) { // Resources taking more than 1 second
            this.recordCustomMetric({
              name: 'slow-resource-load',
              value: entry.duration,
              unit: 'ms',
              category: 'performance',
              timestamp: new Date().toISOString(),
              context: {
                resourceName: entry.name,
                type: (entry as any).initiatorType,
                size: (entry as any).transferSize
              }
            })
          }

          // Track cache hits/misses
          if ((entry as any).transferSize === 0 && entry.duration > 0) {
            this.recordCustomMetric({
              name: 'cache-hit',
              value: 1,
              unit: 'count',
              category: 'performance',
              timestamp: new Date().toISOString(),
              context: { resourceName: entry.name }
            })
          } else if ((entry as any).transferSize > 0) {
            this.recordCustomMetric({
              name: 'cache-miss',
              value: 1,
              unit: 'count',
              category: 'performance',
              timestamp: new Date().toISOString(),
              context: {
                resourceName: entry.name,
                size: (entry as any).transferSize
              }
            })
          }
        })
      })

      this.performanceObserver.observe({ entryTypes: ['resource'] })
    } catch (error) {
      logger.warn('Resource timing observer setup failed', {}, error)
    }
  }

  private setupNavigationObserver(): void {
    if (!window.PerformanceObserver) return

    try {
      const navObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          const nav = entry as PerformanceNavigationTiming

          // DNS lookup time
          this.recordCustomMetric({
            name: 'dns-lookup-time',
            value: nav.domainLookupEnd - nav.domainLookupStart,
            unit: 'ms',
            category: 'performance',
            timestamp: new Date().toISOString()
          })

          // TCP connection time
          this.recordCustomMetric({
            name: 'tcp-connect-time',
            value: nav.connectEnd - nav.connectStart,
            unit: 'ms',
            category: 'performance',
            timestamp: new Date().toISOString()
          })

          // DOM parsing time
          this.recordCustomMetric({
            name: 'dom-parsing-time',
            value: nav.domInteractive - nav.responseEnd,
            unit: 'ms',
            category: 'performance',
            timestamp: new Date().toISOString()
          })

          // Resource loading time
          this.recordCustomMetric({
            name: 'resource-loading-time',
            value: nav.loadEventStart - nav.domContentLoadedEventEnd,
            unit: 'ms',
            category: 'performance',
            timestamp: new Date().toISOString()
          })
        })
      })

      navObserver.observe({ entryTypes: ['navigation'] })
    } catch (error) {
      logger.warn('Navigation observer setup failed', {}, error)
    }
  }

  private setupCustomMetricsCollection(): void {
    // Memory usage monitoring
    if ((performance as any).memory) {
      setInterval(() => {
        const memory = (performance as any).memory
        
        this.recordCustomMetric({
          name: 'memory-usage',
          value: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100),
          unit: 'percentage',
          category: 'performance',
          timestamp: new Date().toISOString(),
          context: {
            usedJSHeapSize: memory.usedJSHeapSize,
            totalJSHeapSize: memory.totalJSHeapSize,
            jsHeapSizeLimit: memory.jsHeapSizeLimit
          }
        })
      }, 30000) // Every 30 seconds
    }

    // Bundle size estimation
    this.estimateBundleSize()

    // User interaction metrics
    this.setupInteractionMetrics()
  }

  private estimateBundleSize(): void {
    const scripts = Array.from(document.querySelectorAll('script[src]')) as HTMLScriptElement[]
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]')) as HTMLLinkElement[]

    let totalEstimatedSize = 0

    // This is a rough estimation - in a real app you'd get this from build tools
    scripts.forEach(script => {
      if (script.src.includes('vendors') || script.src.includes('chunk')) {
        totalEstimatedSize += 500 * 1024 // Estimate 500KB per vendor chunk
      } else if (script.src.includes('main') || script.src.includes('app')) {
        totalEstimatedSize += 200 * 1024 // Estimate 200KB for main app bundle
      }
    })

    styles.forEach(style => {
      totalEstimatedSize += 50 * 1024 // Estimate 50KB per CSS file
    })

    this.recordCustomMetric({
      name: 'estimated-bundle-size',
      value: totalEstimatedSize,
      unit: 'bytes',
      category: 'technical',
      timestamp: new Date().toISOString(),
      context: {
        scriptCount: scripts.length,
        styleCount: styles.length
      }
    })
  }

  private setupInteractionMetrics(): void {
    let clickCount = 0
    let lastActivity = Date.now()

    document.addEventListener('click', () => {
      clickCount++
      lastActivity = Date.now()
    })

    document.addEventListener('keydown', () => {
      lastActivity = Date.now()
    })

    // Track user engagement every minute
    setInterval(() => {
      const now = Date.now()
      const timeSinceLastActivity = now - lastActivity

      this.recordCustomMetric({
        name: 'user-engagement',
        value: timeSinceLastActivity < 60000 ? 1 : 0, // Active if activity in last minute
        unit: 'count',
        category: 'user-experience',
        timestamp: new Date().toISOString(),
        context: {
          clickCount,
          timeSinceLastActivity
        }
      })

      // Reset click count
      clickCount = 0
    }, 60000) // Every minute
  }

  // ===== PUBLIC API =====

  recordCustomMetric(metric: CustomMetric): void {
    this.customMetrics.push(metric)

    // Keep only last 100 custom metrics
    if (this.customMetrics.length > 100) {
      this.customMetrics = this.customMetrics.slice(-100)
    }

    logger.debug('Custom metric recorded', {
      metric: metric.name,
      value: metric.value,
      unit: metric.unit,
      category: metric.category
    })
  }

  private checkPerformanceBudgets(metric: WebVitalMetric): void {
    const budget = this.budgets.find(b => b.metric === metric.name && b.enabled)
    if (!budget) return

    let violation = false
    switch (budget.operator) {
      case '>':
        violation = metric.value > budget.threshold
        break
      case '<':
        violation = metric.value < budget.threshold
        break
      case '>=':
        violation = metric.value >= budget.threshold
        break
      case '<=':
        violation = metric.value <= budget.threshold
        break
    }

    if (violation) {
      logger.warn('Performance budget violation', {
        metric: metric.name,
        value: metric.value,
        threshold: budget.threshold,
        operator: budget.operator,
        message: budget.alertMessage
      })

      sentryService.captureMessage(
        `Performance Budget Violation: ${budget.alertMessage}`,
        'warning',
        {
          metric: metric.name,
          value: metric.value,
          threshold: budget.threshold,
          budget
        }
      )
    }
  }

  private generateRecommendations(metric: WebVitalMetric): void {
    const recommendations: Record<WebVitalMetric['name'], string[]> = {
      CLS: [
        'Add explicit width and height attributes to images',
        'Reserve space for ads and embeds',
        'Avoid inserting content above existing content',
        'Use CSS transforms for animations instead of changing layout properties'
      ],
      INP: [
        'Break up long-running JavaScript tasks',
        'Optimize third-party code',
        'Use a web worker for heavy computations',
        'Reduce JavaScript execution time'
      ],
      FCP: [
        'Eliminate render-blocking resources',
        'Minify CSS and JavaScript',
        'Remove unused CSS',
        'Optimize web fonts loading'
      ],
      LCP: [
        'Optimize images and use modern formats',
        'Preload important resources',
        'Optimize CSS delivery',
        'Improve server response times'
      ],
      TTFB: [
        'Optimize server configuration',
        'Use a CDN',
        'Cache resources',
        'Optimize database queries'
      ]
    }

    const metricRecommendations = recommendations[metric.name] || []
    
    logger.info('Performance recommendations generated', {
      metric: metric.name,
      value: metric.value,
      rating: metric.rating,
      recommendations: metricRecommendations
    })
  }

  // ===== GETTERS =====

  getWebVitals(): WebVitalMetric[] {
    return [...this.webVitals]
  }

  getCustomMetrics(): CustomMetric[] {
    return [...this.customMetrics]
  }

  getLatestWebVitals(): Record<WebVitalMetric['name'], WebVitalMetric | undefined> {
    const latest: Record<WebVitalMetric['name'], WebVitalMetric | undefined> = {
      CLS: undefined,
      INP: undefined,
      FCP: undefined,
      LCP: undefined,
      TTFB: undefined
    }

    this.webVitals.forEach(metric => {
      if (!latest[metric.name] || metric.timestamp > latest[metric.name]!.timestamp) {
        latest[metric.name] = metric
      }
    })

    return latest
  }

  getPerformanceScore(): number {
    const latest = this.getLatestWebVitals()
    const metrics = Object.values(latest).filter(Boolean) as WebVitalMetric[]
    
    if (metrics.length === 0) return 0

    const scores = metrics.map(metric => {
      switch (metric.rating) {
        case 'good': return 100
        case 'needs-improvement': return 65
        case 'poor': return 25
        default: return 0
      }
    })

    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
  }

  generateReport(): PerformanceReport {
    const latest = this.getLatestWebVitals()
    const webVitals = Object.values(latest).filter(Boolean) as WebVitalMetric[]
    
    const budgetViolations = this.budgets.map(budget => {
      const metric = webVitals.find(m => m.name === budget.metric)
      if (!metric) return { budget, actualValue: 0, violation: false }

      let violation = false
      switch (budget.operator) {
        case '>':
          violation = metric.value > budget.threshold
          break
        case '<':
          violation = metric.value < budget.threshold
          break
        case '>=':
          violation = metric.value >= budget.threshold
          break
        case '<=':
          violation = metric.value <= budget.threshold
          break
      }

      return { budget, actualValue: metric.value, violation }
    })

    const recommendations = webVitals
      .filter(metric => metric.rating === 'poor')
      .flatMap(metric => this.getRecommendationsForMetric(metric.name))

    return {
      timestamp: new Date().toISOString(),
      webVitals,
      customMetrics: this.getCustomMetrics(),
      budgetViolations,
      recommendations,
      score: this.getPerformanceScore()
    }
  }

  private getRecommendationsForMetric(metricName: WebVitalMetric['name']): string[] {
    const recommendations: Record<WebVitalMetric['name'], string[]> = {
      CLS: ['Optimize layout stability', 'Add explicit dimensions to images'],
      INP: ['Reduce JavaScript execution time', 'Use web workers'],
      FCP: ['Optimize resource loading', 'Minimize render-blocking resources'],
      LCP: ['Optimize images', 'Improve server response times'],
      TTFB: ['Optimize server configuration', 'Use CDN']
    }

    return recommendations[metricName] || []
  }

  // ===== CONFIGURATION =====

  updateBudgets(budgets: PerformanceBudget[]): void {
    this.budgets = budgets
    logger.info('Performance budgets updated', { count: budgets.length })
  }

  getBudgets(): PerformanceBudget[] {
    return [...this.budgets]
  }
}

// ===== SINGLETON INSTANCE =====

export const webVitalsService = new WebVitalsService()

// ===== REACT HOOKS =====

export const useWebVitals = () => {
  const [metrics, setMetrics] = React.useState<WebVitalMetric[]>([])
  const [customMetrics, setCustomMetrics] = React.useState<CustomMetric[]>([])

  React.useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(webVitalsService.getWebVitals())
      setCustomMetrics(webVitalsService.getCustomMetrics())
    }, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [])

  return {
    webVitals: metrics,
    customMetrics,
    latestWebVitals: webVitalsService.getLatestWebVitals(),
    performanceScore: webVitalsService.getPerformanceScore(),
    generateReport: webVitalsService.generateReport.bind(webVitalsService),
    recordCustomMetric: webVitalsService.recordCustomMetric.bind(webVitalsService),
    updateBudgets: webVitalsService.updateBudgets.bind(webVitalsService),
    getBudgets: webVitalsService.getBudgets.bind(webVitalsService)
  }
}

export default webVitalsService