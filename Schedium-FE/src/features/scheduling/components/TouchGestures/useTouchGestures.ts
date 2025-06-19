/**
 * Touch Gestures Hook - Mobile-first touch interactions for scheduling
 * Implements swipe, pinch, long-press, and multi-touch gestures
 */

import { useCallback, useRef, useEffect, useState } from 'react'
import { ScheduleEntry, DayOfWeek, TimeSlot } from '../../types'

interface TouchPoint {
  id: number
  x: number
  y: number
  timestamp: number
}

interface GestureState {
  isActive: boolean
  type: 'swipe' | 'pinch' | 'long_press' | 'tap' | 'drag' | null
  startPoint: TouchPoint | null
  currentPoints: TouchPoint[]
  velocity: { x: number; y: number }
  scale: number
  rotation: number
  distance: number
}

interface SwipeGesture {
  direction: 'up' | 'down' | 'left' | 'right'
  velocity: number
  distance: number
  duration: number
}

interface PinchGesture {
  scale: number
  center: { x: number; y: number }
  velocity: number
}

interface TouchGestureOptions {
  onSwipe?: (gesture: SwipeGesture, position?: { day: DayOfWeek; timeSlot: TimeSlot }) => void
  onPinch?: (gesture: PinchGesture) => void
  onLongPress?: (position: { day: DayOfWeek; timeSlot: TimeSlot }, entry?: ScheduleEntry) => void
  onTap?: (position: { day: DayOfWeek; timeSlot: TimeSlot }, entry?: ScheduleEntry) => void
  onDragStart?: (entry: ScheduleEntry, position: { day: DayOfWeek; timeSlot: TimeSlot }) => boolean
  onDragMove?: (entry: ScheduleEntry, fromPosition: { day: DayOfWeek; timeSlot: TimeSlot }, toPosition: { day: DayOfWeek; timeSlot: TimeSlot }) => void
  onDragEnd?: (entry: ScheduleEntry, fromPosition: { day: DayOfWeek; timeSlot: TimeSlot }, toPosition: { day: DayOfWeek; timeSlot: TimeSlot }) => void
  
  // Gesture configuration
  swipeThreshold?: number
  longPressDelay?: number
  tapThreshold?: number
  pinchThreshold?: number
  enableHapticFeedback?: boolean
  enableGesturePreview?: boolean
}

export const useTouchGestures = (options: TouchGestureOptions = {}) => {
  const {
    onSwipe,
    onPinch,
    onLongPress,
    onTap,
    onDragStart,
    onDragMove,
    onDragEnd,
    swipeThreshold = 50,
    longPressDelay = 500,
    tapThreshold = 10,
    pinchThreshold = 0.1,
    enableHapticFeedback = true,
    enableGesturePreview = true
  } = options

  const [gestureState, setGestureState] = useState<GestureState>({
    isActive: false,
    type: null,
    startPoint: null,
    currentPoints: [],
    velocity: { x: 0, y: 0 },
    scale: 1,
    rotation: 0,
    distance: 0
  })

  const gestureRef = useRef<HTMLElement | null>(null)
  const longPressTimerRef = useRef<NodeJS.Timeout>()
  const velocityTrackerRef = useRef<Array<{ x: number; y: number; timestamp: number }>>([])
  const lastUpdateRef = useRef(0)

  // Haptic feedback
  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!enableHapticFeedback || !navigator.vibrate) return
    
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30]
    }
    
    navigator.vibrate(patterns[type])
  }, [enableHapticFeedback])

  // Calculate distance between two points
  const calculateDistance = useCallback((point1: TouchPoint, point2: TouchPoint) => {
    const dx = point2.x - point1.x
    const dy = point2.y - point1.y
    return Math.sqrt(dx * dx + dy * dy)
  }, [])

  // Calculate gesture velocity
  const calculateVelocity = useCallback((points: Array<{ x: number; y: number; timestamp: number }>) => {
    if (points.length < 2) return { x: 0, y: 0 }

    const recent = points.slice(-5) // Use last 5 points for smoother velocity
    const first = recent[0]
    const last = recent[recent.length - 1]
    
    const timeDiff = last.timestamp - first.timestamp
    if (timeDiff === 0) return { x: 0, y: 0 }

    return {
      x: (last.x - first.x) / timeDiff,
      y: (last.y - first.y) / timeDiff
    }
  }, [])

  // Get position from touch coordinates
  const getPositionFromCoordinates = useCallback((x: number, y: number): { day: DayOfWeek; timeSlot: TimeSlot } | null => {
    if (!gestureRef.current) return null

    // This is a simplified implementation - would need actual matrix layout logic
    const rect = gestureRef.current.getBoundingClientRect()
    const relativeX = x - rect.left
    const relativeY = y - rect.top

    // Calculate day and time slot based on grid layout
    const days = [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY, DayOfWeek.SATURDAY]
    const dayWidth = rect.width / 6
    const dayIndex = Math.floor(relativeX / dayWidth)
    
    if (dayIndex < 0 || dayIndex >= days.length) return null

    // Calculate time slot (assuming 16 hours from 6:00 to 22:00)
    const timeSlotHeight = rect.height / 16
    const timeSlotIndex = Math.floor(relativeY / timeSlotHeight)
    const startHour = 6 + timeSlotIndex
    
    if (startHour < 6 || startHour > 21) return null

    return {
      day: days[dayIndex],
      timeSlot: {
        start: `${startHour.toString().padStart(2, '0')}:00`,
        end: `${(startHour + 1).toString().padStart(2, '0')}:00`
      }
    }
  }, [])

  // Handle touch start
  const handleTouchStart = useCallback((event: TouchEvent) => {
    event.preventDefault()

    const touches = Array.from(event.touches).map((touch, index) => ({
      id: touch.identifier,
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    }))

    const startPoint = touches[0]
    
    setGestureState(prev => ({
      ...prev,
      isActive: true,
      startPoint,
      currentPoints: touches,
      type: null
    }))

    // Clear velocity tracker
    velocityTrackerRef.current = [{ x: startPoint.x, y: startPoint.y, timestamp: startPoint.timestamp }]

    // Start long press timer for single touch
    if (touches.length === 1) {
      longPressTimerRef.current = setTimeout(() => {
        const position = getPositionFromCoordinates(startPoint.x, startPoint.y)
        if (position) {
          setGestureState(prev => ({ ...prev, type: 'long_press' }))
          triggerHaptic('medium')
          onLongPress?.(position)
        }
      }, longPressDelay)
    }

    lastUpdateRef.current = Date.now()
  }, [getPositionFromCoordinates, onLongPress, triggerHaptic, longPressDelay])

  // Handle touch move
  const handleTouchMove = useCallback((event: TouchEvent) => {
    event.preventDefault()

    if (!gestureState.isActive || !gestureState.startPoint) return

    const touches = Array.from(event.touches).map((touch) => ({
      id: touch.identifier,
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    }))

    const currentPoint = touches[0]
    const startPoint = gestureState.startPoint

    // Clear long press timer on movement
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = undefined
    }

    // Update velocity tracker
    velocityTrackerRef.current.push({
      x: currentPoint.x,
      y: currentPoint.y,
      timestamp: currentPoint.timestamp
    })

    // Keep only recent points for velocity calculation
    if (velocityTrackerRef.current.length > 10) {
      velocityTrackerRef.current.shift()
    }

    const distance = calculateDistance(startPoint, currentPoint)
    const velocity = calculateVelocity(velocityTrackerRef.current)

    // Determine gesture type
    let gestureType: GestureState['type'] = null

    if (touches.length === 1) {
      if (distance > tapThreshold) {
        gestureType = distance > swipeThreshold ? 'swipe' : 'drag'
      }
    } else if (touches.length === 2) {
      gestureType = 'pinch'
    }

    // Handle pinch gesture
    if (gestureType === 'pinch' && touches.length === 2) {
      const currentDistance = calculateDistance(touches[0], touches[1])
      const initialDistance = gestureState.currentPoints.length === 2 
        ? calculateDistance(gestureState.currentPoints[0], gestureState.currentPoints[1])
        : currentDistance

      const scale = initialDistance > 0 ? currentDistance / initialDistance : 1
      
      if (Math.abs(scale - 1) > pinchThreshold) {
        const center = {
          x: (touches[0].x + touches[1].x) / 2,
          y: (touches[0].y + touches[1].y) / 2
        }

        onPinch?.({
          scale,
          center,
          velocity: Math.abs(velocity.x) + Math.abs(velocity.y)
        })
      }
    }

    setGestureState(prev => ({
      ...prev,
      currentPoints: touches,
      type: gestureType,
      velocity,
      distance,
      scale: gestureType === 'pinch' ? prev.scale : 1
    }))

    // Handle drag preview
    if (gestureType === 'drag' && enableGesturePreview) {
      const fromPosition = getPositionFromCoordinates(startPoint.x, startPoint.y)
      const toPosition = getPositionFromCoordinates(currentPoint.x, currentPoint.y)
      
      if (fromPosition && toPosition && onDragMove) {
        // This would need integration with actual entry selection logic
        // onDragMove(selectedEntry, fromPosition, toPosition)
      }
    }

    lastUpdateRef.current = Date.now()
  }, [
    gestureState,
    calculateDistance,
    calculateVelocity,
    tapThreshold,
    swipeThreshold,
    pinchThreshold,
    enableGesturePreview,
    getPositionFromCoordinates,
    onPinch,
    onDragMove
  ])

  // Handle touch end
  const handleTouchEnd = useCallback((event: TouchEvent) => {
    event.preventDefault()

    if (!gestureState.isActive || !gestureState.startPoint) return

    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = undefined
    }

    const endTime = Date.now()
    const duration = endTime - gestureState.startPoint.timestamp
    const remainingTouches = Array.from(event.touches)

    // If no touches remain, gesture is complete
    if (remainingTouches.length === 0) {
      const finalVelocity = calculateVelocity(velocityTrackerRef.current)
      const position = getPositionFromCoordinates(gestureState.startPoint.x, gestureState.startPoint.y)

      // Handle completed gestures
      switch (gestureState.type) {
        case 'swipe':
          if (gestureState.distance > swipeThreshold && position) {
            const dx = gestureState.currentPoints[0]?.x - gestureState.startPoint.x || 0
            const dy = gestureState.currentPoints[0]?.y - gestureState.startPoint.y || 0
            
            let direction: SwipeGesture['direction']
            if (Math.abs(dx) > Math.abs(dy)) {
              direction = dx > 0 ? 'right' : 'left'
            } else {
              direction = dy > 0 ? 'down' : 'up'
            }

            triggerHaptic('light')
            onSwipe?.({
              direction,
              velocity: Math.sqrt(finalVelocity.x ** 2 + finalVelocity.y ** 2),
              distance: gestureState.distance,
              duration
            }, position)
          }
          break

        case 'drag':
          if (position) {
            const endPosition = getPositionFromCoordinates(
              gestureState.currentPoints[0]?.x || gestureState.startPoint.x,
              gestureState.currentPoints[0]?.y || gestureState.startPoint.y
            )
            
            if (endPosition && onDragEnd) {
              triggerHaptic('medium')
              // This would need integration with actual entry selection logic
              // onDragEnd(selectedEntry, position, endPosition)
            }
          }
          break

        case null:
          // Simple tap
          if (gestureState.distance <= tapThreshold && duration < 300 && position) {
            triggerHaptic('light')
            onTap?.(position)
          }
          break
      }

      // Reset gesture state
      setGestureState({
        isActive: false,
        type: null,
        startPoint: null,
        currentPoints: [],
        velocity: { x: 0, y: 0 },
        scale: 1,
        rotation: 0,
        distance: 0
      })

      velocityTrackerRef.current = []
    } else {
      // Update current points for remaining touches
      const updatedTouches = remainingTouches.map((touch) => ({
        id: touch.identifier,
        x: touch.clientX,
        y: touch.clientY,
        timestamp: Date.now()
      }))

      setGestureState(prev => ({
        ...prev,
        currentPoints: updatedTouches
      }))
    }
  }, [
    gestureState,
    calculateVelocity,
    getPositionFromCoordinates,
    swipeThreshold,
    tapThreshold,
    triggerHaptic,
    onSwipe,
    onTap,
    onDragEnd
  ])

  // Attach touch event listeners
  const attachGestureListeners = useCallback((element: HTMLElement) => {
    gestureRef.current = element

    element.addEventListener('touchstart', handleTouchStart, { passive: false })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd, { passive: false })
    element.addEventListener('touchcancel', handleTouchEnd, { passive: false })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
      element.removeEventListener('touchcancel', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
      }
    }
  }, [])

  return {
    // Gesture state
    gestureState,
    isGestureActive: gestureState.isActive,
    
    // Touch event handlers
    attachGestureListeners,
    
    // Utilities
    getPositionFromCoordinates,
    triggerHaptic,
    
    // Gesture info
    currentGestureType: gestureState.type,
    gestureVelocity: gestureState.velocity,
    gestureDistance: gestureState.distance,
    gestureScale: gestureState.scale,
    
    // Touch points
    activeTouchPoints: gestureState.currentPoints.length,
    startPoint: gestureState.startPoint,
    currentPoints: gestureState.currentPoints
  }
}