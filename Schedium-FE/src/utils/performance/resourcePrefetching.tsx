/**
 * Resource Prefetching - Intelligent resource preloading and prefetching
 * Advanced prefetching strategies based on user behavior and route prediction
 */

import React, { useEffect, useCallback, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

// Prefetch strategies
interface PrefetchOptions {
  priority?: 'high' | 'medium' | 'low'
  as?: 'script' | 'style' | 'image' | 'font' | 'fetch' | 'document'
  crossOrigin?: 'anonymous' | 'use-credentials'
  onLoad?: () => void
  onError?: (error: Event) => void
  timeout?: number
}

interface RoutePreloadConfig {
  route: string
  resources: Array<{
    href: string
    type: 'script' | 'style' | 'image' | 'font' | 'data'
    priority: 'high' | 'medium' | 'low'
    condition?: () => boolean
  }>
  preloadComponent?: () => Promise<any>
  preloadData?: () => Promise<any>
}

interface UserBehaviorPattern {
  route: string
  nextRoutes: Array<{ route: string; probability: number; timing: number }>
  dwellTime: number
  exitPoints: string[]
  conversions: Array<{ action: string; probability: number }>
}

// Resource prefetcher class
class ResourcePrefetcher {
  private static instance: ResourcePrefetcher
  private prefetchedResources = new Set<string>()
  private prefetchQueue = new Map<string, { element: HTMLLinkElement; priority: number }>()
  private behaviorPatterns = new Map<string, UserBehaviorPattern>()
  private routeStartTime = Date.now()
  private idleCallbackId?: number
  private intersectionObserver?: IntersectionObserver
  
  private constructor() {
    this.initializeBehaviorTracking()
    this.setupIdlePrefetching()
    this.setupIntersectionObserver()
    this.loadBehaviorPatterns()
  }

  static getInstance(): ResourcePrefetcher {
    if (!ResourcePrefetcher.instance) {
      ResourcePrefetcher.instance = new ResourcePrefetcher()
    }
    return ResourcePrefetcher.instance
  }

  private initializeBehaviorTracking() {
    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.recordRouteExit()
      } else {
        this.routeStartTime = Date.now()
      }
    })

    // Track user interactions
    document.addEventListener('mouseenter', this.handleMouseEnter.bind(this), { capture: true })
    document.addEventListener('touchstart', this.handleTouchStart.bind(this), { capture: true })
  }

  private setupIdlePrefetching() {
    if ('requestIdleCallback' in window) {
      this.idleCallbackId = window.requestIdleCallback(() => {
        this.prefetchDuringIdle()
      }, { timeout: 5000 })
    }
  }

  private setupIntersectionObserver() {
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const link = entry.target as HTMLAnchorElement
            const href = link.getAttribute('href')
            if (href && this.shouldPrefetchRoute(href)) {
              this.prefetchRoute(href, { priority: 'low' })
            }
          }
        })
      },
      { rootMargin: '100px' }
    )
  }

  private handleMouseEnter(event: MouseEvent) {
    const target = event.target as HTMLElement
    const link = target.closest('a[href]') as HTMLAnchorElement
    
    if (link && link.href) {
      const href = new URL(link.href).pathname
      if (this.shouldPrefetchRoute(href)) {
        // Delay prefetch slightly to avoid false positives
        setTimeout(() => {
          this.prefetchRoute(href, { priority: 'medium' })
        }, 100)
      }
    }
  }

  private handleTouchStart(event: TouchEvent) {
    const target = event.target as HTMLElement
    const link = target.closest('a[href]') as HTMLAnchorElement
    
    if (link && link.href) {
      const href = new URL(link.href).pathname
      if (this.shouldPrefetchRoute(href)) {
        this.prefetchRoute(href, { priority: 'high' })
      }
    }
  }

  private shouldPrefetchRoute(href: string): boolean {
    // Don't prefetch external links
    if (href.startsWith('http') && !href.includes(window.location.hostname)) {
      return false
    }
    
    // Don't prefetch if already prefetched
    if (this.prefetchedResources.has(href)) {
      return false
    }

    // Don't prefetch on slow connections
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      if (connection.saveData || connection.effectiveType === 'slow-2g') {
        return false
      }
    }

    return true
  }

  // Public methods
  prefetchResource(href: string, options: PrefetchOptions = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.prefetchedResources.has(href)) {
        resolve()
        return
      }

      const {
        priority = 'medium',
        as = 'fetch',
        crossOrigin,
        onLoad,
        onError,
        timeout = 10000
      } = options

      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.href = href
      link.as = as
      
      if (crossOrigin) {
        link.crossOrigin = crossOrigin
      }

      let timeoutId: NodeJS.Timeout

      const cleanup = () => {
        if (timeoutId) clearTimeout(timeoutId)
        link.removeEventListener('load', handleLoad)
        link.removeEventListener('error', handleError)
      }

      const handleLoad = () => {
        cleanup()
        this.prefetchedResources.add(href)
        onLoad?.()
        resolve()
      }

      const handleError = (error: Event) => {
        cleanup()
        onError?.(error)
        reject(new Error(`Failed to prefetch: ${href}`))
      }

      link.addEventListener('load', handleLoad)
      link.addEventListener('error', handleError)

      if (timeout > 0) {
        timeoutId = setTimeout(() => {
          cleanup()
          reject(new Error(`Prefetch timeout: ${href}`))
        }, timeout)
      }

      // Queue based on priority
      const priorityValue = { high: 3, medium: 2, low: 1 }[priority]
      this.prefetchQueue.set(href, { element: link, priority: priorityValue })

      // Process queue
      this.processQueue()
    })
  }

  prefetchRoute(route: string, options: PrefetchOptions = {}): void {
    // Prefetch route component
    this.prefetchRouteComponent(route)
    
    // Prefetch route data
    this.prefetchRouteData(route)
    
    // Prefetch related resources
    this.prefetchRouteResources(route, options)
  }

  private async prefetchRouteComponent(route: string) {
    try {
      // Dynamic import based on route
      const componentMap: Record<string, () => Promise<any>> = {
        '/dashboard': () => import('../../../pages/DashboardPage').then(m => m.DashboardPage),
        '/schedules': () => import('../../../pages/scheduling/SchedulesPage').then(m => m.SchedulesPage),
        '/instructors': () => import('../../../pages/hr/InstructorsPage').then(m => m.InstructorsPage),
        '/classrooms': () => import('../../../pages/infrastructure/ClassroomsPage').then(m => m.ClassroomsPage),
        '/reports': () => import('../../../pages/InformesPage').then(m => m.InformesPage),
        '/settings': () => import('../../../pages/admin/SettingsPage').then(m => m.SettingsPage),
        '/profile': () => import('../../../pages/ProfilePage').then(m => m.ProfilePage)
      }

      const importFn = componentMap[route]
      if (importFn) {
        await importFn()
        console.log(`Prefetched component for route: ${route}`)
      }
    } catch (error) {
      console.warn(`Failed to prefetch component for route ${route}:`, error)
    }
  }

  private async prefetchRouteData(route: string) {
    try {
      // Prefetch common data for routes
      const dataEndpoints: Record<string, string[]> = {
        '/dashboard': [
          '/api/v1/dashboard/analytics',
          '/api/v1/schedules/summary'
        ],
        '/schedules': [
          '/api/v1/schedules/current',
          '/api/v1/instructors',
          '/api/v1/classrooms'
        ],
        '/instructors': [
          '/api/v1/instructors',
          '/api/v1/programs'
        ],
        '/reports': [
          '/api/v1/reports/templates',
          '/api/v1/reports/recent'
        ]
      }

      const endpoints = dataEndpoints[route]
      if (endpoints) {
        const prefetchPromises = endpoints.map(endpoint => 
          this.prefetchResource(endpoint, { as: 'fetch', priority: 'medium' })
        )
        
        await Promise.allSettled(prefetchPromises)
        console.log(`Prefetched data for route: ${route}`)
      }
    } catch (error) {
      console.warn(`Failed to prefetch data for route ${route}:`, error)
    }
  }

  private prefetchRouteResources(route: string, options: PrefetchOptions) {
    // Route-specific resource configurations
    const routeConfigs: RoutePreloadConfig[] = [
      {
        route: '/dashboard',
        resources: [
          { href: '/static/js/dashboard.chunk.js', type: 'script', priority: 'high' },
          { href: '/static/css/dashboard.css', type: 'style', priority: 'medium' },
          { href: '/api/v1/dashboard/widgets', type: 'data', priority: 'medium' }
        ]
      },
      {
        route: '/schedules',
        resources: [
          { href: '/static/js/schedules.chunk.js', type: 'script', priority: 'high' },
          { href: '/static/js/scheduling-matrix.chunk.js', type: 'script', priority: 'medium' },
          { href: '/static/css/schedules.css', type: 'style', priority: 'medium' }
        ]
      },
      {
        route: '/reports',
        resources: [
          { href: '/static/js/reports.chunk.js', type: 'script', priority: 'high' },
          { href: '/static/js/report-builder.chunk.js', type: 'script', priority: 'medium' },
          { href: '/static/fonts/charts-font.woff2', type: 'font', priority: 'low' }
        ]
      }
    ]

    const config = routeConfigs.find(c => c.route === route)
    if (config) {
      config.resources.forEach(resource => {
        if (!resource.condition || resource.condition()) {
          this.prefetchResource(resource.href, {
            as: resource.type === 'data' ? 'fetch' : resource.type,
            priority: resource.priority,
            ...options
          }).catch(error => {
            console.warn(`Failed to prefetch resource ${resource.href}:`, error)
          })
        }
      })
    }
  }

  private processQueue() {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        this.flushQueue()
      })
    } else {
      setTimeout(() => this.flushQueue(), 100)
    }
  }

  private flushQueue() {
    // Sort by priority and add to DOM
    const sortedQueue = Array.from(this.prefetchQueue.entries())
      .sort(([, a], [, b]) => b.priority - a.priority)
      .slice(0, 5) // Limit concurrent prefetches

    sortedQueue.forEach(([href, { element }]) => {
      document.head.appendChild(element)
      this.prefetchQueue.delete(href)
    })
  }

  private prefetchDuringIdle() {
    // Prefetch high-probability next routes during idle time
    const currentRoute = window.location.pathname
    const pattern = this.behaviorPatterns.get(currentRoute)
    
    if (pattern) {
      pattern.nextRoutes
        .filter(({ probability }) => probability > 0.3)
        .slice(0, 3)
        .forEach(({ route }) => {
          this.prefetchRoute(route, { priority: 'low' })
        })
    }

    // Schedule next idle prefetch
    if ('requestIdleCallback' in window) {
      this.idleCallbackId = window.requestIdleCallback(() => {
        this.prefetchDuringIdle()
      }, { timeout: 10000 })
    }
  }

  private recordRouteExit() {
    const currentRoute = window.location.pathname
    const dwellTime = Date.now() - this.routeStartTime
    
    // Update behavior patterns
    const pattern = this.behaviorPatterns.get(currentRoute) || {
      route: currentRoute,
      nextRoutes: [],
      dwellTime: 0,
      exitPoints: [],
      conversions: []
    }

    pattern.dwellTime = (pattern.dwellTime + dwellTime) / 2 // Running average
    this.behaviorPatterns.set(currentRoute, pattern)
    
    // Store in localStorage for persistence
    this.saveBehaviorPatterns()
  }

  private loadBehaviorPatterns() {
    try {
      const stored = localStorage.getItem('user-behavior-patterns')
      if (stored) {
        const patterns = JSON.parse(stored)
        Object.entries(patterns).forEach(([route, pattern]) => {
          this.behaviorPatterns.set(route, pattern as UserBehaviorPattern)
        })
      }
    } catch (error) {
      console.warn('Failed to load behavior patterns:', error)
    }
  }

  private saveBehaviorPatterns() {
    try {
      const patterns = Object.fromEntries(this.behaviorPatterns.entries())
      localStorage.setItem('user-behavior-patterns', JSON.stringify(patterns))
    } catch (error) {
      console.warn('Failed to save behavior patterns:', error)
    }
  }

  // Cleanup
  destroy() {
    if (this.idleCallbackId) {
      window.cancelIdleCallback(this.idleCallbackId)
    }
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect()
    }
    
    document.removeEventListener('visibilitychange', this.recordRouteExit)
    document.removeEventListener('mouseenter', this.handleMouseEnter, { capture: true })
    document.removeEventListener('touchstart', this.handleTouchStart, { capture: true })
  }
}

// React hooks
export const usePrefetch = () => {
  const prefetcher = useRef(ResourcePrefetcher.getInstance())

  const prefetchResource = useCallback((href: string, options?: PrefetchOptions) => {
    return prefetcher.current.prefetchResource(href, options)
  }, [])

  const prefetchRoute = useCallback((route: string, options?: PrefetchOptions) => {
    prefetcher.current.prefetchRoute(route, options)
  }, [])

  useEffect(() => {
    return () => {
      // Don't destroy the singleton on unmount
    }
  }, [])

  return { prefetchResource, prefetchRoute }
}

// Route-aware prefetching hook
export const useRoutePrefetch = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { prefetchRoute } = usePrefetch()

  // Prefetch likely next routes based on current route
  useEffect(() => {
    const routePredictions: Record<string, string[]> = {
      '/': ['/dashboard', '/schedules'],
      '/dashboard': ['/schedules', '/reports'],
      '/schedules': ['/dashboard', '/instructors', '/classrooms'],
      '/instructors': ['/schedules', '/dashboard'],
      '/classrooms': ['/schedules', '/dashboard'],
      '/reports': ['/dashboard', '/schedules'],
      '/settings': ['/dashboard']
    }

    const nextRoutes = routePredictions[location.pathname] || []
    
    // Prefetch with delay to avoid interfering with current page load
    setTimeout(() => {
      nextRoutes.forEach(route => {
        prefetchRoute(route, { priority: 'low' })
      })
    }, 2000)
  }, [location.pathname, prefetchRoute])

  return { prefetchRoute }
}

// Link component with automatic prefetching
export const PrefetchLink: React.FC<{
  to: string
  children: React.ReactNode
  prefetch?: 'hover' | 'visible' | 'immediate' | 'none'
  className?: string
  onClick?: () => void
}> = ({ 
  to, 
  children, 
  prefetch = 'hover', 
  className = '',
  onClick 
}) => {
  const { prefetchRoute } = usePrefetch()
  const linkRef = useRef<HTMLAnchorElement>(null)
  const navigate = useNavigate()

  // Immediate prefetch
  useEffect(() => {
    if (prefetch === 'immediate') {
      prefetchRoute(to, { priority: 'medium' })
    }
  }, [to, prefetch, prefetchRoute])

  // Visible prefetch
  useEffect(() => {
    if (prefetch === 'visible' && linkRef.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            prefetchRoute(to, { priority: 'low' })
            observer.unobserve(entry.target)
          }
        },
        { rootMargin: '100px' }
      )

      observer.observe(linkRef.current)
      return () => observer.disconnect()
    }
    return undefined
  }, [to, prefetch, prefetchRoute])

  const handleMouseEnter = () => {
    if (prefetch === 'hover') {
      prefetchRoute(to, { priority: 'medium' })
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    onClick?.()
    navigate(to)
  }

  return (
    <a
      ref={linkRef}
      href={to}
      className={className}
      onMouseEnter={handleMouseEnter}
      onClick={handleClick}
    >
      {children}
    </a>
  )
}

// Performance monitoring for prefetching
export const usePrefetchAnalytics = () => {
  const [metrics, setMetrics] = useState({
    prefetchedResources: 0,
    prefetchHits: 0,
    prefetchMisses: 0,
    prefetchErrors: 0,
    averagePrefetchTime: 0
  })

  const trackPrefetch = useCallback((resource: string, success: boolean, time: number) => {
    setMetrics(prev => ({
      ...prev,
      prefetchedResources: prev.prefetchedResources + 1,
      prefetchHits: success ? prev.prefetchHits + 1 : prev.prefetchHits,
      prefetchMisses: !success ? prev.prefetchMisses + 1 : prev.prefetchMisses,
      averagePrefetchTime: (prev.averagePrefetchTime * prev.prefetchedResources + time) / (prev.prefetchedResources + 1)
    }))
  }, [])

  const trackPrefetchError = useCallback(() => {
    setMetrics(prev => ({
      ...prev,
      prefetchErrors: prev.prefetchErrors + 1
    }))
  }, [])

  return { metrics, trackPrefetch, trackPrefetchError }
}

export const resourcePrefetcher = ResourcePrefetcher.getInstance()

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    resourcePrefetcher.destroy()
  })
}