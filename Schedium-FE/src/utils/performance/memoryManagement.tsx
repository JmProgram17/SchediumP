/**
 * Memory Management Utilities - Prevent memory leaks and optimize memory usage
 * Advanced memory monitoring, cleanup strategies, and leak detection
 */

import React, { useEffect, useRef, useCallback } from 'react'

// Memory monitoring interface
export interface MemoryInfo {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
  timestamp: number
}

export interface MemoryLeak {
  component: string
  type: 'listener' | 'timer' | 'observer' | 'subscription' | 'websocket'
  description: string
  created: number
  stack?: string
}

// Global memory tracker
class MemoryTracker {
  private static instance: MemoryTracker
  private memoryHistory: MemoryInfo[] = []
  private activeLeaks: Map<string, MemoryLeak> = new Map()
  private cleanupFunctions: Map<string, () => void> = new Map()
  private monitoringInterval?: NodeJS.Timeout
  private warningThreshold = 50 * 1024 * 1024 // 50MB
  private criticalThreshold = 100 * 1024 * 1024 // 100MB

  private constructor() {
    this.startMonitoring()
  }

  static getInstance(): MemoryTracker {
    if (!MemoryTracker.instance) {
      MemoryTracker.instance = new MemoryTracker()
    }
    return MemoryTracker.instance
  }

  private startMonitoring() {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in (window.performance as any)) {
      this.monitoringInterval = setInterval(() => {
        this.collectMemoryInfo()
      }, 5000) // Every 5 seconds
    }
  }

  private collectMemoryInfo() {
    const memory = (performance as any).memory
    if (!memory) return

    const info: MemoryInfo = {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      timestamp: Date.now()
    }

    this.memoryHistory.push(info)

    // Keep only last 100 measurements
    if (this.memoryHistory.length > 100) {
      this.memoryHistory = this.memoryHistory.slice(-100)
    }

    // Check for memory warnings
    this.checkMemoryThresholds(info)
  }

  private checkMemoryThresholds(info: MemoryInfo) {
    const usedMB = info.usedJSHeapSize / (1024 * 1024)

    if (usedMB > this.criticalThreshold / (1024 * 1024)) {
      console.error(`CRITICAL: Memory usage is ${usedMB.toFixed(2)}MB`)
      this.triggerMemoryCleanup()
    } else if (usedMB > this.warningThreshold / (1024 * 1024)) {
      console.warn(`WARNING: Memory usage is ${usedMB.toFixed(2)}MB`)
    }
  }

  private triggerMemoryCleanup() {
    // Force garbage collection if available (Chrome DevTools)
    if ('gc' in window) {
      (window as any).gc()
    }

    // Clean up tracked resources
    this.cleanupTrackedResources()

    // Emit memory pressure event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('memory-pressure', {
        detail: { severity: 'high' }
      }))
    }
  }

  private cleanupTrackedResources() {
    this.cleanupFunctions.forEach((cleanup, id) => {
      try {
        cleanup()
        this.cleanupFunctions.delete(id)
        console.log(`Cleaned up resource: ${id}`)
      } catch (error) {
        console.error(`Failed to cleanup resource ${id}:`, error)
      }
    })
  }

  // Public methods
  registerCleanup(id: string, cleanup: () => void) {
    this.cleanupFunctions.set(id, cleanup)
  }

  unregisterCleanup(id: string) {
    const cleanup = this.cleanupFunctions.get(id)
    if (cleanup) {
      cleanup()
      this.cleanupFunctions.delete(id)
    }
  }

  trackPotentialLeak(leak: MemoryLeak) {
    const id = `${leak.component}-${leak.type}-${Date.now()}`
    this.activeLeaks.set(id, leak)
    
    if (process.env.NODE_ENV === 'development') {
      console.warn('Potential memory leak detected:', leak)
    }
  }

  getMemoryStats() {
    const latest = this.memoryHistory[this.memoryHistory.length - 1]
    if (!latest) return null

    const oldest = this.memoryHistory[0]
    const growth = latest.usedJSHeapSize - oldest.usedJSHeapSize

    return {
      current: {
        used: latest.usedJSHeapSize,
        total: latest.totalJSHeapSize,
        limit: latest.jsHeapSizeLimit,
        usedMB: (latest.usedJSHeapSize / (1024 * 1024)).toFixed(2),
        percentage: ((latest.usedJSHeapSize / latest.jsHeapSizeLimit) * 100).toFixed(2)
      },
      growth: {
        absolute: growth,
        growthMB: (growth / (1024 * 1024)).toFixed(2),
        timespan: latest.timestamp - oldest.timestamp
      },
      leaks: Array.from(this.activeLeaks.values()),
      history: this.memoryHistory
    }
  }

  destroy() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
    }
    this.cleanupTrackedResources()
  }
}

// Hook for automatic cleanup on unmount
export const useCleanup = (cleanupFn: () => void, deps: any[] = []) => {
  const cleanupRef = useRef<() => void>()

  useEffect(() => {
    cleanupRef.current = cleanupFn
  }, deps)

  useEffect(() => {
    return () => {
      cleanupRef.current?.()
    }
  }, [])
}

// Hook for event listener cleanup
export const useEventListener = <T extends keyof WindowEventMap>(
  event: T,
  handler: (event: WindowEventMap[T]) => void,
  element: Window | HTMLElement = window,
  options?: AddEventListenerOptions
) => {
  const savedHandler = useRef(handler)
  const tracker = MemoryTracker.getInstance()

  useEffect(() => {
    savedHandler.current = handler
  }, [handler])

  useEffect(() => {
    const eventListener = (event: WindowEventMap[T]) => savedHandler.current(event)
    const targetElement = element || window

    if (targetElement && targetElement.addEventListener) {
      targetElement.addEventListener(event, eventListener as any, options)

      // Track potential leak
      const leakId = `event-${event}-${Date.now()}`
      tracker.trackPotentialLeak({
        component: 'useEventListener',
        type: 'listener',
        description: `Event listener for '${event}'`,
        created: Date.now(),
        stack: new Error().stack
      })

      return () => {
        targetElement.removeEventListener(event, eventListener as any, options)
        tracker.unregisterCleanup(leakId)
      }
    }
    return undefined
  }, [event, element, options])
}

// Hook for timer cleanup
export const useTimer = () => {
  const timersRef = useRef<Set<NodeJS.Timeout>>(new Set())
  const tracker = MemoryTracker.getInstance()

  const setTimeout = useCallback((callback: () => void, delay: number) => {
    const timer = globalThis.setTimeout(() => {
      timersRef.current.delete(timer)
      callback()
    }, delay)

    timersRef.current.add(timer)

    // Track potential leak
    tracker.trackPotentialLeak({
      component: 'useTimer',
      type: 'timer',
      description: `setTimeout with delay ${delay}ms`,
      created: Date.now()
    })

    return timer
  }, [tracker])

  const setInterval = useCallback((callback: () => void, interval: number) => {
    const timer = globalThis.setInterval(callback, interval)
    timersRef.current.add(timer)

    // Track potential leak
    tracker.trackPotentialLeak({
      component: 'useTimer',
      type: 'timer',
      description: `setInterval with interval ${interval}ms`,
      created: Date.now()
    })

    return timer
  }, [tracker])

  const clearTimer = useCallback((timer: NodeJS.Timeout) => {
    globalThis.clearTimeout(timer)
    globalThis.clearInterval(timer)
    timersRef.current.delete(timer)
  }, [])

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach(timer => {
      globalThis.clearTimeout(timer)
      globalThis.clearInterval(timer)
    })
    timersRef.current.clear()
  }, [])

  useEffect(() => {
    return () => {
      clearAllTimers()
    }
  }, [clearAllTimers])

  return { setTimeout, setInterval, clearTimer, clearAllTimers }
}

// Hook for observer cleanup
export const useObserver = <T extends IntersectionObserver | MutationObserver | ResizeObserver>(
  createObserver: () => T,
  deps: any[] = []
) => {
  const observerRef = useRef<T>()
  const tracker = MemoryTracker.getInstance()

  useEffect(() => {
    const observer = createObserver()
    observerRef.current = observer

    // Track potential leak
    const leakId = `observer-${Date.now()}`
    tracker.trackPotentialLeak({
      component: 'useObserver',
      type: 'observer',
      description: `Observer: ${observer.constructor.name}`,
      created: Date.now()
    })

    tracker.registerCleanup(leakId, () => {
      observer.disconnect()
    })

    return () => {
      observer.disconnect()
      tracker.unregisterCleanup(leakId)
    }
  }, deps)

  return observerRef
}

// Hook for WebSocket cleanup
export const useWebSocket = (url: string, protocols?: string | string[]) => {
  const wsRef = useRef<WebSocket>()
  const tracker = MemoryTracker.getInstance()

  useEffect(() => {
    const ws = new WebSocket(url, protocols)
    wsRef.current = ws

    // Track potential leak
    const leakId = `websocket-${url}-${Date.now()}`
    tracker.trackPotentialLeak({
      component: 'useWebSocket',
      type: 'websocket',
      description: `WebSocket connection to ${url}`,
      created: Date.now()
    })

    tracker.registerCleanup(leakId, () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close()
      }
    })

    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close()
      }
      tracker.unregisterCleanup(leakId)
    }
  }, [url, protocols])

  return wsRef
}

// Hook for subscription cleanup (for observables, stores, etc.)
export const useSubscription = () => {
  const subscriptionsRef = useRef<Array<() => void>>([])
  const tracker = MemoryTracker.getInstance()

  const addSubscription = useCallback((unsubscribe: () => void, description = 'Unknown subscription') => {
    subscriptionsRef.current.push(unsubscribe)

    // Track potential leak
    tracker.trackPotentialLeak({
      component: 'useSubscription',
      type: 'subscription',
      description,
      created: Date.now()
    })
  }, [tracker])

  const unsubscribeAll = useCallback(() => {
    subscriptionsRef.current.forEach(unsubscribe => {
      try {
        unsubscribe()
      } catch (error) {
        console.error('Error unsubscribing:', error)
      }
    })
    subscriptionsRef.current = []
  }, [])

  useEffect(() => {
    return () => {
      unsubscribeAll()
    }
  }, [unsubscribeAll])

  return { addSubscription, unsubscribeAll }
}

// Memory pressure hook
export const useMemoryPressure = (onMemoryPressure?: (severity: 'low' | 'medium' | 'high') => void) => {
  const tracker = MemoryTracker.getInstance()

  useEventListener('memory-pressure' as any, (event: any) => {
    const severity = event.detail?.severity || 'medium'
    onMemoryPressure?.(severity)

    // Default memory pressure handling
    if (severity === 'high') {
      // Clear caches, unload non-critical components
      if (typeof window !== 'undefined') {
        // Clear image caches
        const images = document.querySelectorAll('img[data-cached]')
        images.forEach(img => {
          img.removeAttribute('src')
          img.removeAttribute('data-cached')
        })

        // Trigger garbage collection hint
        if ('requestIdleCallback' in window) {
          window.requestIdleCallback(() => {
            // Perform cleanup during idle time
            console.log('Performing idle cleanup due to memory pressure')
          })
        }
      }
    }
  })

  return {
    getMemoryStats: () => tracker.getMemoryStats(),
    forceCleanup: () => tracker.destroy()
  }
}

// Component for memory monitoring (development only)
export const MemoryMonitor: React.FC<{ 
  showDetails?: boolean 
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}> = ({ 
  showDetails = false, 
  position = 'top-right' 
}) => {
  const [stats, setStats] = React.useState<any>(null)
  const tracker = MemoryTracker.getInstance()

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return

    const interval = setInterval(() => {
      setStats(tracker.getMemoryStats())
    }, 1000)

    return () => clearInterval(interval)
  }, [tracker])

  if (process.env.NODE_ENV !== 'development' || !stats) {
    return null
  }

  const positionStyles = {
    'top-left': { top: 10, left: 10 },
    'top-right': { top: 10, right: 10 },
    'bottom-left': { bottom: 10, left: 10 },
    'bottom-right': { bottom: 10, right: 10 }
  }

  return (
    <div
      style={{
        position: 'fixed',
        ...positionStyles[position],
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '4px',
        fontSize: '12px',
        fontFamily: 'monospace',
        zIndex: 9999
      }}
    >
      <div>Memory: {stats.current.usedMB}MB ({stats.current.percentage}%)</div>
      {showDetails && (
        <>
          <div>Growth: {stats.growth.growthMB}MB</div>
          <div>Leaks: {stats.leaks.length}</div>
        </>
      )}
    </div>
  )
}

// Export singleton instance
export const memoryTracker = MemoryTracker.getInstance()

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    memoryTracker.destroy()
  })
}