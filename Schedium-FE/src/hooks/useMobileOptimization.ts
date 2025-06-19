/**
 * Mobile Optimization Hook - Enhanced mobile experience and responsive behavior
 * Provides mobile-specific optimizations, touch gestures, and responsive utilities
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useMediaQuery } from './useMediaQuery'

export interface MobileConfig {
  enableTouchGestures?: boolean
  enableVirtualKeyboardHandling?: boolean
  enableOrientationHandling?: boolean
  enablePerformanceMode?: boolean
  swipeThreshold?: number
}

export interface TouchGesture {
  type: 'swipe' | 'pinch' | 'tap' | 'longPress'
  direction?: 'left' | 'right' | 'up' | 'down'
  deltaX?: number
  deltaY?: number
  scale?: number
  duration?: number
}

export interface ViewportInfo {
  width: number
  height: number
  availableHeight: number
  orientation: 'portrait' | 'landscape'
  isKeyboardOpen: boolean
  safeArea: {
    top: number
    right: number
    bottom: number
    left: number
  }
}

const DEFAULT_CONFIG: Required<MobileConfig> = {
  enableTouchGestures: true,
  enableVirtualKeyboardHandling: true,
  enableOrientationHandling: true,
  enablePerformanceMode: true,
  swipeThreshold: 50
}

export const useMobileOptimization = (config: MobileConfig = {}) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  
  // Device detection
  const isMobile = useMediaQuery('(max-width: 768px)')
  const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)')
  const isTouchDevice = useMediaQuery('(hover: none) and (pointer: coarse)')
  const isLandscape = useMediaQuery('(orientation: landscape)')
  
  // State management
  const [viewportInfo, setViewportInfo] = useState<ViewportInfo>({
    width: window.innerWidth,
    height: window.innerHeight,
    availableHeight: window.innerHeight,
    orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
    isKeyboardOpen: false,
    safeArea: { top: 0, right: 0, bottom: 0, left: 0 }
  })
  
  const [isPerformanceMode, setIsPerformanceMode] = useState(false)
  const [currentGesture, setCurrentGesture] = useState<TouchGesture | null>(null)
  
  // Refs for touch handling
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const gestureCallbacksRef = useRef<Map<string, (gesture: TouchGesture) => void>>(new Map())

  // Get safe area values
  const getSafeAreaInsets = useCallback(() => {
    const computedStyle = getComputedStyle(document.documentElement)
    return {
      top: parseInt(computedStyle.getPropertyValue('--sat') || computedStyle.getPropertyValue('env(safe-area-inset-top)')) || 0,
      right: parseInt(computedStyle.getPropertyValue('--sar') || computedStyle.getPropertyValue('env(safe-area-inset-right)')) || 0,
      bottom: parseInt(computedStyle.getPropertyValue('--sab') || computedStyle.getPropertyValue('env(safe-area-inset-bottom)')) || 0,
      left: parseInt(computedStyle.getPropertyValue('--sal') || computedStyle.getPropertyValue('env(safe-area-inset-left)')) || 0
    }
  }, [])

  // Update viewport information
  const updateViewportInfo = useCallback(() => {
    const newHeight = window.innerHeight
    const previousHeight = viewportInfo.height
    const heightDifference = previousHeight - newHeight
    
    // Detect virtual keyboard (heuristic: significant height reduction on mobile)
    const isKeyboardOpen = isMobile && heightDifference > 150
    
    setViewportInfo({
      width: window.innerWidth,
      height: newHeight,
      availableHeight: isKeyboardOpen ? newHeight : window.outerHeight,
      orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
      isKeyboardOpen,
      safeArea: getSafeAreaInsets()
    })
  }, [isMobile, viewportInfo.height, getSafeAreaInsets])

  // Performance mode management
  const enablePerformanceMode = useCallback(() => {
    if (!finalConfig.enablePerformanceMode) return
    
    setIsPerformanceMode(true)
    
    // Reduce animations
    document.documentElement.style.setProperty('--animation-duration', '0.1s')
    document.documentElement.style.setProperty('--transition-duration', '0.1s')
    
    // Disable non-essential features
    document.querySelectorAll('[data-performance-heavy]').forEach(el => {
      (el as HTMLElement).style.display = 'none'
    })
  }, [finalConfig.enablePerformanceMode])

  const disablePerformanceMode = useCallback(() => {
    setIsPerformanceMode(false)
    
    // Restore animations
    document.documentElement.style.removeProperty('--animation-duration')
    document.documentElement.style.removeProperty('--transition-duration')
    
    // Restore hidden elements
    document.querySelectorAll('[data-performance-heavy]').forEach(el => {
      (el as HTMLElement).style.display = ''
    })
  }, [])

  // Touch gesture handling
  const handleTouchStart = useCallback((event: TouchEvent) => {
    if (!finalConfig.enableTouchGestures) return
    
    const touch = event.touches[0]
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    }
    
    // Start long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
    }
    
    longPressTimerRef.current = setTimeout(() => {
      if (touchStartRef.current) {
        const gesture: TouchGesture = {
          type: 'longPress',
          duration: Date.now() - touchStartRef.current.time
        }
        setCurrentGesture(gesture)
        
        // Trigger callbacks
        gestureCallbacksRef.current.forEach(callback => callback(gesture))
      }
    }, 500)
  }, [finalConfig.enableTouchGestures])

  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (!finalConfig.enableTouchGestures || !touchStartRef.current) return
    
    // Cancel long press on move
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }, [finalConfig.enableTouchGestures])

  const handleTouchEnd = useCallback((event: TouchEvent) => {
    if (!finalConfig.enableTouchGestures || !touchStartRef.current) return
    
    // Cancel long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
    
    const touch = event.changedTouches[0]
    const deltaX = touch.clientX - touchStartRef.current.x
    const deltaY = touch.clientY - touchStartRef.current.y
    const duration = Date.now() - touchStartRef.current.time
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    
    let gesture: TouchGesture | null = null
    
    // Determine gesture type
    if (distance < 10 && duration < 500) {
      // Tap
      gesture = { type: 'tap', duration }
    } else if (distance > finalConfig.swipeThreshold) {
      // Swipe
      const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY)
      const direction = isHorizontal
        ? deltaX > 0 ? 'right' : 'left'
        : deltaY > 0 ? 'down' : 'up'
      
      gesture = {
        type: 'swipe',
        direction,
        deltaX,
        deltaY,
        duration
      }
    }
    
    if (gesture) {
      setCurrentGesture(gesture)
      gestureCallbacksRef.current.forEach(callback => callback(gesture))
    }
    
    touchStartRef.current = null
  }, [finalConfig.enableTouchGestures, finalConfig.swipeThreshold])

  // Register gesture callback
  const onGesture = useCallback((id: string, callback: (gesture: TouchGesture) => void) => {
    gestureCallbacksRef.current.set(id, callback)
    
    return () => {
      gestureCallbacksRef.current.delete(id)
    }
  }, [])

  // Haptic feedback
  const triggerHapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30]
      }
      navigator.vibrate(patterns[type])
    }
  }, [])

  // Prevent zoom on input focus (common mobile UX issue)
  const preventZoomOnFocus = useCallback(() => {
    const meta = document.querySelector('meta[name="viewport"]')
    if (meta) {
      const originalContent = meta.getAttribute('content')
      meta.setAttribute('content', originalContent + ', maximum-scale=1.0, user-scalable=no')
      
      return () => {
        meta.setAttribute('content', originalContent || '')
      }
    }
  }, [])

  // Optimize scroll behavior for mobile
  const optimizeScrolling = useCallback((element?: HTMLElement) => {
    const target = element || document.documentElement
    
    // Enable smooth scrolling with momentum
    target.style.webkitOverflowScrolling = 'touch'
    target.style.overflowScrolling = 'touch'
    
    // Prevent rubber band effect on iOS
    target.addEventListener('touchmove', (e) => {
      if (target.scrollTop === 0 && e.touches[0].clientY > e.touches[0].clientY) {
        e.preventDefault()
      }
      if (target.scrollTop === target.scrollHeight - target.clientHeight && 
          e.touches[0].clientY < e.touches[0].clientY) {
        e.preventDefault()
      }
    }, { passive: false })
  }, [])

  // Auto-hide address bar on mobile browsers
  const hideAddressBar = useCallback(() => {
    if (isMobile && window.scrollY === 0) {
      setTimeout(() => {
        window.scrollTo(0, 1)
        setTimeout(() => {
          window.scrollTo(0, 0)
        }, 100)
      }, 100)
    }
  }, [isMobile])

  // Effects
  useEffect(() => {
    if (!finalConfig.enableVirtualKeyboardHandling) return
    
    const handleResize = () => updateViewportInfo()
    const handleOrientationChange = () => {
      setTimeout(updateViewportInfo, 100) // Delay to ensure proper viewport calculation
    }
    
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleOrientationChange)
    
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleOrientationChange)
    }
  }, [finalConfig.enableVirtualKeyboardHandling, updateViewportInfo])

  useEffect(() => {
    if (!finalConfig.enableTouchGestures) return
    
    document.addEventListener('touchstart', handleTouchStart, { passive: false })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd, { passive: false })
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [finalConfig.enableTouchGestures, handleTouchStart, handleTouchMove, handleTouchEnd])

  useEffect(() => {
    // Auto-enable performance mode on low-end devices
    if (isMobile && 'deviceMemory' in navigator && (navigator as any).deviceMemory < 4) {
      enablePerformanceMode()
    }
  }, [isMobile, enablePerformanceMode])

  useEffect(() => {
    // Initialize viewport info
    updateViewportInfo()
    
    // Hide address bar on page load for mobile
    if (isMobile) {
      hideAddressBar()
    }
  }, [isMobile, updateViewportInfo, hideAddressBar])

  return {
    // Device info
    isMobile,
    isTablet,
    isTouchDevice,
    isLandscape,
    
    // Viewport info
    viewportInfo,
    
    // Performance
    isPerformanceMode,
    enablePerformanceMode,
    disablePerformanceMode,
    
    // Gestures
    currentGesture,
    onGesture,
    
    // Utilities
    triggerHapticFeedback,
    preventZoomOnFocus,
    optimizeScrolling,
    hideAddressBar,
    
    // CSS helpers
    mobileClasses: {
      container: isMobile ? 'mobile-container' : '',
      touchOptimized: isTouchDevice ? 'touch-optimized' : '',
      performanceMode: isPerformanceMode ? 'performance-mode' : '',
      keyboardOpen: viewportInfo.isKeyboardOpen ? 'keyboard-open' : '',
      safeArea: 'safe-area-insets'
    },
    
    // Responsive breakpoints
    breakpoints: {
      mobile: isMobile,
      tablet: isTablet,
      desktop: !isMobile && !isTablet,
      touch: isTouchDevice
    }
  }
}