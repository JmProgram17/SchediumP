/**
 * Mobile Gestures Hook - Touch-optimized interactions for schedule management
 * Provides intuitive touch gestures for mobile schedule editing
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { toast } from 'react-hot-toast'

import { ScheduleEntry, TimeSlot, DayOfWeek } from '../types'

export interface TouchPoint {
  x: number
  y: number
  timestamp: number
  identifier: number
}

export interface GestureState {
  isActive: boolean
  type: 'tap' | 'long_press' | 'pan' | 'pinch' | 'swipe' | null
  startPoint: TouchPoint | null
  currentPoint: TouchPoint | null
  velocity: { x: number; y: number }
  distance: number
  duration: number
  scale: number
  rotation: number
}

export interface SwipeDirection {
  direction: 'up' | 'down' | 'left' | 'right'
  velocity: number
  distance: number
}

export interface PinchGesture {
  scale: number
  center: { x: number; y: number }
  velocity: number
}

export interface MobileGestureHandlers {
  onTap?: (point: TouchPoint, target?: Element) => void
  onLongPress?: (point: TouchPoint, target?: Element) => void
  onPanStart?: (point: TouchPoint, target?: Element) => void
  onPan?: (delta: { x: number; y: number }, point: TouchPoint) => void
  onPanEnd?: (point: TouchPoint, velocity: { x: number; y: number }) => void
  onSwipe?: (swipe: SwipeDirection, target?: Element) => void
  onPinchStart?: (center: { x: number; y: number }) => void
  onPinch?: (gesture: PinchGesture) => void
  onPinchEnd?: (finalScale: number) => void
  onDoubleTap?: (point: TouchPoint, target?: Element) => void
}

export interface MobileGestureConfig {
  tapThreshold?: number
  longPressDelay?: number
  swipeThreshold?: number
  swipeVelocityThreshold?: number
  pinchThreshold?: number
  doubleTapDelay?: number
  preventDefaultTouchMove?: boolean
  enableHapticFeedback?: boolean
}

export interface MobileScheduleGestures {
  // Entry manipulation
  onEntryTap?: (entry: ScheduleEntry, point: TouchPoint) => void
  onEntryLongPress?: (entry: ScheduleEntry, point: TouchPoint) => void
  onEntryDragStart?: (entry: ScheduleEntry, point: TouchPoint) => void
  onEntryDrag?: (entry: ScheduleEntry, delta: { x: number; y: number }, newPosition: { day: DayOfWeek; timeSlot: TimeSlot }) => void
  onEntryDragEnd?: (entry: ScheduleEntry, finalPosition: { day: DayOfWeek; timeSlot: TimeSlot }) => void
  
  // Grid interactions
  onCellTap?: (day: DayOfWeek, timeSlot: TimeSlot, point: TouchPoint) => void
  onCellLongPress?: (day: DayOfWeek, timeSlot: TimeSlot, point: TouchPoint) => void
  
  // Navigation gestures
  onSwipeToNavigate?: (direction: 'left' | 'right' | 'up' | 'down') => void
  onPinchToZoom?: (scale: number, center: { x: number; y: number }) => void
  
  // Selection gestures
  onMultiSelectStart?: (point: TouchPoint) => void
  onMultiSelectUpdate?: (area: { x: number; y: number; width: number; height: number }) => void
  onMultiSelectEnd?: (selectedEntries: ScheduleEntry[]) => void
}

export const useMobileGestures = (
  config: MobileGestureConfig = {}
): {
  gestureState: GestureState
  bind: () => Record<string, any>
  isGestureActive: boolean
  supportsTouchActions: boolean
} => {
  const {
    tapThreshold = 10,
    longPressDelay = 500,
    swipeThreshold = 50,
    swipeVelocityThreshold = 0.5,
    pinchThreshold = 1.1,
    doubleTapDelay = 300,
    preventDefaultTouchMove = true,
    enableHapticFeedback = true
  } = config

  const [gestureState, setGestureState] = useState<GestureState>({
    isActive: false,
    type: null,
    startPoint: null,
    currentPoint: null,
    velocity: { x: 0, y: 0 },
    distance: 0,
    duration: 0,
    scale: 1,
    rotation: 0
  })

  const [handlers, setHandlers] = useState<MobileGestureHandlers>({})
  const [isMultiTouch, setIsMultiTouch] = useState(false)
  const [touchPoints, setTouchPoints] = useState<TouchPoint[]>([])
  
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const lastTapTime = useRef<number>(0)
  const velocityTracker = useRef<{ x: number; y: number; timestamp: number }[]>([])
  const initialDistance = useRef<number>(0)
  const initialCenter = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  // Check for touch support
  const supportsTouchActions = 'ontouchstart' in window || navigator.maxTouchPoints > 0

  // Haptic feedback
  const triggerHapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!enableHapticFeedback || !('vibrate' in navigator)) return
    
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30]
    }
    
    navigator.vibrate(patterns[type])
  }, [enableHapticFeedback])

  // Calculate distance between two points
  const calculateDistance = useCallback((p1: TouchPoint, p2: TouchPoint): number => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
  }, [])

  // Calculate velocity
  const calculateVelocity = useCallback((): { x: number; y: number } => {
    if (velocityTracker.current.length < 2) return { x: 0, y: 0 }
    
    const recent = velocityTracker.current.slice(-3)
    const timeSpan = recent[recent.length - 1].timestamp - recent[0].timestamp
    
    if (timeSpan === 0) return { x: 0, y: 0 }
    
    const deltaX = recent[recent.length - 1].x - recent[0].x
    const deltaY = recent[recent.length - 1].y - recent[0].y
    
    return {
      x: deltaX / timeSpan,
      y: deltaY / timeSpan
    }
  }, [])

  // Get touch point from event
  const getTouchPoint = useCallback((touch: Touch): TouchPoint => ({
    x: touch.clientX,
    y: touch.clientY,
    timestamp: Date.now(),
    identifier: touch.identifier
  }), [])

  // Clear gesture state
  const clearGesture = useCallback(() => {
    setGestureState({
      isActive: false,
      type: null,
      startPoint: null,
      currentPoint: null,
      velocity: { x: 0, y: 0 },
      distance: 0,
      duration: 0,
      scale: 1,
      rotation: 0
    })
    
    setTouchPoints([])
    setIsMultiTouch(false)
    velocityTracker.current = []
    
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  // Handle touch start
  const handleTouchStart = useCallback((event: TouchEvent) => {
    const touches = Array.from(event.touches).map(getTouchPoint)
    setTouchPoints(touches)
    
    if (touches.length === 1) {
      const point = touches[0]
      
      setGestureState(prev => ({
        ...prev,
        isActive: true,
        startPoint: point,
        currentPoint: point,
        type: null
      }))
      
      velocityTracker.current = [{ x: point.x, y: point.y, timestamp: point.timestamp }]
      
      // Start long press timer
      longPressTimer.current = setTimeout(() => {
        if (gestureState.startPoint && calculateDistance(gestureState.startPoint, point) < tapThreshold) {
          setGestureState(prev => ({ ...prev, type: 'long_press' }))
          handlers.onLongPress?.(point, event.target as Element)
          triggerHapticFeedback('medium')
        }
      }, longPressDelay)
      
    } else if (touches.length === 2) {
      setIsMultiTouch(true)
      
      // Calculate initial pinch state
      const distance = calculateDistance(touches[0], touches[1])
      const center = {
        x: (touches[0].x + touches[1].x) / 2,
        y: (touches[0].y + touches[1].y) / 2
      }
      
      initialDistance.current = distance
      initialCenter.current = center
      
      setGestureState(prev => ({
        ...prev,
        isActive: true,
        type: 'pinch',
        scale: 1
      }))
      
      handlers.onPinchStart?.(center)
      
      // Clear long press timer
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
        longPressTimer.current = null
      }
    }
    
    if (preventDefaultTouchMove) {
      event.preventDefault()
    }
  }, [gestureState.startPoint, handlers, tapThreshold, longPressDelay, preventDefaultTouchMove, calculateDistance, getTouchPoint, triggerHapticFeedback])

  // Handle touch move
  const handleTouchMove = useCallback((event: TouchEvent) => {
    const touches = Array.from(event.touches).map(getTouchPoint)
    setTouchPoints(touches)
    
    if (touches.length === 1 && gestureState.startPoint) {
      const point = touches[0]
      const distance = calculateDistance(gestureState.startPoint, point)
      const velocity = calculateVelocity()
      
      // Update velocity tracker
      velocityTracker.current.push({ x: point.x, y: point.y, timestamp: point.timestamp })
      if (velocityTracker.current.length > 5) {
        velocityTracker.current.shift()
      }
      
      setGestureState(prev => ({
        ...prev,
        currentPoint: point,
        distance,
        velocity,
        duration: point.timestamp - (prev.startPoint?.timestamp || 0)
      }))
      
      // Determine gesture type
      if (distance > tapThreshold && !gestureState.type) {
        // Clear long press timer
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current)
          longPressTimer.current = null
        }
        
        setGestureState(prev => ({ ...prev, type: 'pan' }))
        handlers.onPanStart?.(gestureState.startPoint, event.target as Element)
      }
      
      // Handle ongoing pan
      if (gestureState.type === 'pan') {
        const delta = {
          x: point.x - gestureState.startPoint.x,
          y: point.y - gestureState.startPoint.y
        }
        handlers.onPan?.(delta, point)
      }
      
    } else if (touches.length === 2 && gestureState.type === 'pinch') {
      const distance = calculateDistance(touches[0], touches[1])
      const center = {
        x: (touches[0].x + touches[1].x) / 2,
        y: (touches[0].y + touches[1].y) / 2
      }
      
      const scale = distance / initialDistance.current
      const velocity = Math.abs(scale - gestureState.scale) * 1000 / 16 // Approximate frame rate
      
      setGestureState(prev => ({ ...prev, scale }))
      
      handlers.onPinch?.({
        scale,
        center,
        velocity
      })
    }
    
    if (preventDefaultTouchMove) {
      event.preventDefault()
    }
  }, [gestureState, handlers, tapThreshold, calculateDistance, calculateVelocity, preventDefaultTouchMove])

  // Handle touch end
  const handleTouchEnd = useCallback((event: TouchEvent) => {
    const remainingTouches = Array.from(event.touches).map(getTouchPoint)
    setTouchPoints(remainingTouches)
    
    if (remainingTouches.length === 0) {
      // All touches ended
      if (gestureState.startPoint && gestureState.currentPoint) {
        const finalVelocity = calculateVelocity()
        
        // Determine final gesture type
        if (gestureState.type === 'pan') {
          handlers.onPanEnd?.(gestureState.currentPoint, finalVelocity)
          
          // Check for swipe
          const distance = gestureState.distance
          const velocity = Math.sqrt(finalVelocity.x ** 2 + finalVelocity.y ** 2)
          
          if (distance > swipeThreshold && velocity > swipeVelocityThreshold) {
            const deltaX = gestureState.currentPoint.x - gestureState.startPoint.x
            const deltaY = gestureState.currentPoint.y - gestureState.startPoint.y
            
            let direction: SwipeDirection['direction']
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
              direction = deltaX > 0 ? 'right' : 'left'
            } else {
              direction = deltaY > 0 ? 'down' : 'up'
            }
            
            handlers.onSwipe?.({
              direction,
              velocity,
              distance
            }, event.target as Element)
            
            triggerHapticFeedback('light')
          }
          
        } else if (gestureState.type === 'pinch') {
          handlers.onPinchEnd?.(gestureState.scale)
          
        } else if (!gestureState.type || gestureState.type === 'long_press') {
          // Handle tap
          const currentTime = Date.now()
          const timeSinceLastTap = currentTime - lastTapTime.current
          
          if (timeSinceLastTap < doubleTapDelay && timeSinceLastTap > 50) {
            // Double tap
            handlers.onDoubleTap?.(gestureState.currentPoint, event.target as Element)
            triggerHapticFeedback('medium')
            lastTapTime.current = 0 // Reset to prevent triple tap
          } else {
            // Single tap (only if not long press)
            if (gestureState.type !== 'long_press') {
              handlers.onTap?.(gestureState.currentPoint, event.target as Element)
              triggerHapticFeedback('light')
            }
            lastTapTime.current = currentTime
          }
        }
      }
      
      clearGesture()
      
    } else if (remainingTouches.length === 1 && isMultiTouch) {
      // Multi-touch ended, single touch remains
      setIsMultiTouch(false)
      
      if (gestureState.type === 'pinch') {
        handlers.onPinchEnd?.(gestureState.scale)
      }
      
      // Reset for single touch gesture
      const point = remainingTouches[0]
      setGestureState({
        isActive: true,
        type: null,
        startPoint: point,
        currentPoint: point,
        velocity: { x: 0, y: 0 },
        distance: 0,
        duration: 0,
        scale: 1,
        rotation: 0
      })
    }
  }, [gestureState, isMultiTouch, handlers, swipeThreshold, swipeVelocityThreshold, doubleTapDelay, calculateVelocity, triggerHapticFeedback, clearGesture, getTouchPoint])

  // Handle touch cancel
  const handleTouchCancel = useCallback((event: TouchEvent) => {
    clearGesture()
  }, [clearGesture])

  // Bind gesture handlers
  const bind = useCallback(() => ({
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchCancel,
  }), [handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel])

  // Update handlers
  const updateHandlers = useCallback((newHandlers: MobileGestureHandlers) => {
    setHandlers(prev => ({ ...prev, ...newHandlers }))
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
      }
    }
  }, [])

  return {
    gestureState,
    bind,
    isGestureActive: gestureState.isActive,
    supportsTouchActions,
    updateHandlers
  }
}

// Specialized hook for schedule-specific mobile interactions
export const useScheduleMobileGestures = (
  handlers: MobileScheduleGestures,
  config: MobileGestureConfig = {}
) => {
  const [draggedEntry, setDraggedEntry] = useState<ScheduleEntry | null>(null)
  const [selectionArea, setSelectionArea] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [isMultiSelecting, setIsMultiSelecting] = useState(false)

  const { bind, gestureState, isGestureActive, supportsTouchActions } = useMobileGestures({
    ...config,
    enableHapticFeedback: true
  })

  // Helper to determine position from touch point
  const getPositionFromPoint = useCallback((point: TouchPoint): { day: DayOfWeek; timeSlot: TimeSlot } | null => {
    // This would need to be implemented based on your grid layout
    // For now, returning a placeholder
    return {
      day: 'monday' as DayOfWeek,
      timeSlot: { start: '09:00', end: '10:00' } as TimeSlot
    }
  }, [])

  // Helper to get entry from touch point
  const getEntryFromPoint = useCallback((point: TouchPoint): ScheduleEntry | null => {
    // This would need to be implemented based on your entry elements
    // You might use document.elementFromPoint and check data attributes
    return null
  }, [])

  // Enhanced gesture handlers
  const enhancedBind = useCallback(() => ({
    ...bind(),
    onTouchStart: (event: TouchEvent) => {
      const touches = Array.from(event.touches)
      if (touches.length === 1) {
        const point = {
          x: touches[0].clientX,
          y: touches[0].clientY,
          timestamp: Date.now(),
          identifier: touches[0].identifier
        }
        
        const entry = getEntryFromPoint(point)
        if (entry) {
          setDraggedEntry(entry)
          handlers.onEntryDragStart?.(entry, point)
        } else {
          const position = getPositionFromPoint(point)
          if (position) {
            handlers.onCellTap?.(position.day, position.timeSlot, point)
          }
        }
      }
      
      bind().onTouchStart(event)
    },
    
    onTouchMove: (event: TouchEvent) => {
      if (draggedEntry && gestureState.type === 'pan') {
        const touches = Array.from(event.touches)
        if (touches.length === 1) {
          const point = {
            x: touches[0].clientX,
            y: touches[0].clientY,
            timestamp: Date.now(),
            identifier: touches[0].identifier
          }
          
          const newPosition = getPositionFromPoint(point)
          if (newPosition) {
            const delta = gestureState.startPoint ? {
              x: point.x - gestureState.startPoint.x,
              y: point.y - gestureState.startPoint.y
            } : { x: 0, y: 0 }
            
            handlers.onEntryDrag?.(draggedEntry, delta, newPosition)
          }
        }
      }
      
      bind().onTouchMove(event)
    },
    
    onTouchEnd: (event: TouchEvent) => {
      if (draggedEntry && gestureState.type === 'pan') {
        const touches = Array.from(event.changedTouches)
        if (touches.length === 1) {
          const point = {
            x: touches[0].clientX,
            y: touches[0].clientY,
            timestamp: Date.now(),
            identifier: touches[0].identifier
          }
          
          const finalPosition = getPositionFromPoint(point)
          if (finalPosition) {
            handlers.onEntryDragEnd?.(draggedEntry, finalPosition)
          }
        }
        
        setDraggedEntry(null)
      }
      
      bind().onTouchEnd(event)
    }
  }), [bind, gestureState, draggedEntry, handlers, getEntryFromPoint, getPositionFromPoint])

  return {
    bind: enhancedBind,
    gestureState,
    isGestureActive,
    supportsTouchActions,
    draggedEntry,
    selectionArea,
    isMultiSelecting
  }
}