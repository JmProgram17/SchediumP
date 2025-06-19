/**
 * Interactive Tours Hook - Guided onboarding with Shepherd.js integration
 * Provides comprehensive user onboarding and feature discovery
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { toast } from 'react-hot-toast'

// Tour step interface
export interface TourStep {
  id: string
  title: string
  text: string
  attachTo?: {
    element: string
    on: 'top' | 'bottom' | 'left' | 'right' | 'auto'
  }
  beforeShow?: () => Promise<void> | void
  when?: {
    show?: () => void
    hide?: () => void
    complete?: () => void
    cancel?: () => void
  }
  buttons?: Array<{
    text: string
    action: 'next' | 'back' | 'complete' | 'cancel' | 'custom'
    classes?: string
    onClick?: () => void
  }>
  arrow?: boolean
  canClickTarget?: boolean
  scrollTo?: boolean
  modalOverlayOpeningPadding?: number
  popperOptions?: any
  advanceOn?: {
    selector: string
    event: string
  }
  highlightClass?: string
  showCancelLink?: boolean
}

// Tour definition
export interface TourDefinition {
  id: string
  name: string
  description: string
  category: 'onboarding' | 'feature_discovery' | 'troubleshooting' | 'advanced'
  steps: TourStep[]
  requiredRole?: string[]
  prerequisites?: string[]
  estimatedDuration: number // in minutes
  priority: 'low' | 'medium' | 'high'
  version: string
  conditions?: {
    showForNewUsers?: boolean
    showForRole?: string[]
    showAfterDays?: number
    maxCompletions?: number
  }
}

// User progress tracking
export interface TourProgress {
  tourId: string
  userId: string
  currentStep: number
  completed: boolean
  startedAt: number
  completedAt?: number
  skippedAt?: number
  timeSpent: number
  interactionData: Record<string, any>
}

interface UseInteractiveToursOptions {
  enableAnalytics?: boolean
  enableKeyboardNavigation?: boolean
  enableAutoProgress?: boolean
  theme?: 'light' | 'dark'
  onTourStart?: (tour: TourDefinition) => void
  onTourComplete?: (tour: TourDefinition, progress: TourProgress) => void
  onTourSkip?: (tour: TourDefinition, progress: TourProgress) => void
  onStepChange?: (stepIndex: number, step: TourStep) => void
  customStyles?: Record<string, string>
}

// Shepherd.js mock interface (in real implementation, would import actual Shepherd)
interface ShepherdTour {
  addStep: (options: any) => void
  start: () => void
  complete: () => void
  cancel: () => void
  next: () => void
  back: () => void
  getCurrentStep: () => any
  isActive: () => boolean
  on: (event: string, callback: Function) => void
  off: (event: string, callback?: Function) => void
}

export const useInteractiveTours = (options: UseInteractiveToursOptions = {}) => {
  const {
    enableAnalytics = true,
    enableKeyboardNavigation = true,
    enableAutoProgress = false,
    theme = 'light',
    onTourStart,
    onTourComplete,
    onTourSkip,
    onStepChange,
    customStyles = {}
  } = options

  const [tourState, setTourState] = useState({
    isActive: false,
    currentTour: null as TourDefinition | null,
    currentStep: 0,
    progress: [] as TourProgress[],
    availableTours: [] as TourDefinition[],
    suggestedTours: [] as TourDefinition[]
  })

  const shepherdTourRef = useRef<ShepherdTour | null>(null)
  const startTimeRef = useRef<number>(0)
  const interactionDataRef = useRef<Record<string, any>>({})

  // Initialize Shepherd.js configuration
  const initializeShepherd = useCallback(() => {
    // In real implementation, would import and configure Shepherd.js
    console.log('Initializing Shepherd.js with theme:', theme)
    
    const defaultOptions = {
      useModalOverlay: true,
      classPrefix: 'shepherd-schedium',
      defaultStepOptions: {
        classes: `shepherd-theme-${theme}`,
        scrollTo: true,
        cancelIcon: {
          enabled: true
        },
        modalOverlayOpeningPadding: 4,
        popperOptions: {
          modifiers: [
            {
              name: 'offset',
              options: {
                offset: [0, 12]
              }
            }
          ]
        }
      }
    }

    // Mock Shepherd tour object
    const mockTour: ShepherdTour = {
      addStep: (options: any) => console.log('Adding step:', options),
      start: () => console.log('Starting tour'),
      complete: () => console.log('Completing tour'),
      cancel: () => console.log('Cancelling tour'),
      next: () => console.log('Next step'),
      back: () => console.log('Previous step'),
      getCurrentStep: () => ({ id: 'current-step' }),
      isActive: () => tourState.isActive,
      on: (event: string, callback: Function) => console.log('Event listener:', event),
      off: (event: string, callback?: Function) => console.log('Remove listener:', event)
    }

    shepherdTourRef.current = mockTour
    return mockTour
  }, [theme, tourState.isActive])

  // Create tour from definition
  const createTour = useCallback((definition: TourDefinition) => {
    const tour = initializeShepherd()
    
    definition.steps.forEach((step, index) => {
      const stepOptions = {
        id: step.id,
        title: step.title,
        text: step.text,
        attachTo: step.attachTo,
        arrow: step.arrow !== false,
        canClickTarget: step.canClickTarget || false,
        scrollTo: step.scrollTo !== false,
        modalOverlayOpeningPadding: step.modalOverlayOpeningPadding || 4,
        popperOptions: step.popperOptions,
        advanceOn: step.advanceOn,
        highlightClass: step.highlightClass,
        showCancelLink: step.showCancelLink !== false,
        beforeShow: step.beforeShow,
        when: {
          show: () => {
            setTourState(prev => ({ ...prev, currentStep: index }))
            onStepChange?.(index, step)
            step.when?.show?.()
            
            // Track step view
            if (enableAnalytics) {
              interactionDataRef.current[step.id] = {
                viewedAt: Date.now(),
                timeSpent: 0
              }
            }
          },
          hide: () => {
            // Track time spent on step
            if (enableAnalytics && interactionDataRef.current[step.id]) {
              interactionDataRef.current[step.id].timeSpent = 
                Date.now() - interactionDataRef.current[step.id].viewedAt
            }
            step.when?.hide?.()
          },
          complete: step.when?.complete,
          cancel: step.when?.cancel
        },
        buttons: step.buttons?.map(button => ({
          text: button.text,
          classes: button.classes || (button.action === 'next' ? 'btn btn-primary' : 'btn btn-secondary'),
          action: button.action === 'custom' ? button.onClick : button.action
        })) || [
          {
            text: 'Atrás',
            classes: 'btn btn-secondary',
            action: 'back'
          },
          {
            text: index === definition.steps.length - 1 ? 'Finalizar' : 'Siguiente',
            classes: 'btn btn-primary',
            action: index === definition.steps.length - 1 ? 'complete' : 'next'
          }
        ]
      }

      tour.addStep(stepOptions)
    })

    // Set up tour event handlers
    tour.on('start', () => {
      setTourState(prev => ({
        ...prev,
        isActive: true,
        currentTour: definition,
        currentStep: 0
      }))
      
      startTimeRef.current = Date.now()
      onTourStart?.(definition)
      
      toast.success(`Iniciando tour: ${definition.name}`)
    })

    tour.on('complete', () => {
      const progress: TourProgress = {
        tourId: definition.id,
        userId: 'current-user', // Should come from auth context
        currentStep: definition.steps.length,
        completed: true,
        startedAt: startTimeRef.current,
        completedAt: Date.now(),
        timeSpent: Date.now() - startTimeRef.current,
        interactionData: { ...interactionDataRef.current }
      }

      saveTourProgress(progress)
      setTourState(prev => ({
        ...prev,
        isActive: false,
        currentTour: null,
        currentStep: 0,
        progress: [...prev.progress, progress]
      }))

      onTourComplete?.(definition, progress)
      toast.success(`Tour completado: ${definition.name}`)
    })

    tour.on('cancel', () => {
      const progress: TourProgress = {
        tourId: definition.id,
        userId: 'current-user',
        currentStep: tourState.currentStep,
        completed: false,
        startedAt: startTimeRef.current,
        skippedAt: Date.now(),
        timeSpent: Date.now() - startTimeRef.current,
        interactionData: { ...interactionDataRef.current }
      }

      saveTourProgress(progress)
      setTourState(prev => ({
        ...prev,
        isActive: false,
        currentTour: null,
        currentStep: 0
      }))

      onTourSkip?.(definition, progress)
      toast('Tour cancelado')
    })

    return tour
  }, [
    initializeShepherd,
    enableAnalytics,
    onTourStart,
    onTourComplete,
    onTourSkip,
    onStepChange,
    tourState.currentStep
  ])

  // Start tour
  const startTour = useCallback(async (tourId: string) => {
    const tourDefinition = tourState.availableTours.find(t => t.id === tourId)
    if (!tourDefinition) {
      toast.error('Tour no encontrado')
      return false
    }

    // Check prerequisites
    if (tourDefinition.prerequisites?.length) {
      const completedTours = tourState.progress
        .filter(p => p.completed)
        .map(p => p.tourId)
      
      const missingPrerequisites = tourDefinition.prerequisites.filter(
        prereq => !completedTours.includes(prereq)
      )

      if (missingPrerequisites.length > 0) {
        toast.error('Completa los tours prerequisitos primero')
        return false
      }
    }

    // Check conditions
    if (tourDefinition.conditions) {
      const userProgress = tourState.progress.filter(p => p.tourId === tourId)
      
      if (tourDefinition.conditions.maxCompletions && 
          userProgress.filter(p => p.completed).length >= tourDefinition.conditions.maxCompletions) {
        toast.info('Ya has completado este tour el máximo de veces permitido')
        return false
      }
    }

    try {
      const tour = createTour(tourDefinition)
      shepherdTourRef.current = tour
      tour.start()
      return true
    } catch (error) {
      toast.error('Error al iniciar el tour')
      console.error('Tour start error:', error)
      return false
    }
  }, [tourState.availableTours, tourState.progress, createTour])

  // Control tour navigation
  const nextStep = useCallback(() => {
    shepherdTourRef.current?.next()
  }, [])

  const previousStep = useCallback(() => {
    shepherdTourRef.current?.back()
  }, [])

  const completeTour = useCallback(() => {
    shepherdTourRef.current?.complete()
  }, [])

  const cancelTour = useCallback(() => {
    shepherdTourRef.current?.cancel()
  }, [])

  // Register tour definition
  const registerTour = useCallback((definition: TourDefinition) => {
    setTourState(prev => ({
      ...prev,
      availableTours: [...prev.availableTours.filter(t => t.id !== definition.id), definition]
    }))
  }, [])

  // Save tour progress
  const saveTourProgress = useCallback(async (progress: TourProgress) => {
    try {
      // In real implementation, would save to API
      const response = await fetch('/api/v1/user/tour-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(progress)
      })

      if (!response.ok) throw new Error('Failed to save progress')
      
      return true
    } catch (error) {
      console.error('Error saving tour progress:', error)
      return false
    }
  }, [])

  // Load user progress
  const loadUserProgress = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/user/tour-progress', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })

      if (!response.ok) throw new Error('Failed to load progress')
      
      const progress: TourProgress[] = await response.json()
      setTourState(prev => ({ ...prev, progress }))
      
      return progress
    } catch (error) {
      console.error('Error loading tour progress:', error)
      return []
    }
  }, [])

  // Get suggested tours for user
  const getSuggestedTours = useCallback(() => {
    const completedTourIds = tourState.progress
      .filter(p => p.completed)
      .map(p => p.tourId)

    const suggested = tourState.availableTours
      .filter(tour => {
        // Not completed
        if (completedTourIds.includes(tour.id)) return false
        
        // Prerequisites met
        if (tour.prerequisites?.length) {
          const hasPrerequisites = tour.prerequisites.every(prereq =>
            completedTourIds.includes(prereq)
          )
          if (!hasPrerequisites) return false
        }
        
        // Role requirements
        if (tour.requiredRole?.length) {
          // Would check user role from auth context
          return true
        }
        
        return true
      })
      .sort((a, b) => {
        // Sort by priority and category
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      })

    setTourState(prev => ({ ...prev, suggestedTours: suggested }))
    return suggested
  }, [tourState.availableTours, tourState.progress])

  // Get tour analytics
  const getTourAnalytics = useCallback(() => {
    const analytics = {
      totalTours: tourState.availableTours.length,
      completedTours: tourState.progress.filter(p => p.completed).length,
      skippedTours: tourState.progress.filter(p => p.skippedAt).length,
      averageCompletionTime: 0,
      completionRate: 0,
      popularTours: [] as Array<{ tourId: string; completions: number }>
    }

    const completedProgress = tourState.progress.filter(p => p.completed)
    if (completedProgress.length > 0) {
      analytics.averageCompletionTime = 
        completedProgress.reduce((sum, p) => sum + p.timeSpent, 0) / completedProgress.length
    }

    if (tourState.progress.length > 0) {
      analytics.completionRate = 
        (completedProgress.length / tourState.progress.length) * 100
    }

    // Calculate popular tours
    const tourCompletions = new Map<string, number>()
    completedProgress.forEach(p => {
      tourCompletions.set(p.tourId, (tourCompletions.get(p.tourId) || 0) + 1)
    })

    analytics.popularTours = Array.from(tourCompletions.entries())
      .map(([tourId, completions]) => ({ tourId, completions }))
      .sort((a, b) => b.completions - a.completions)

    return analytics
  }, [tourState.availableTours, tourState.progress])

  // Keyboard navigation
  useEffect(() => {
    if (!enableKeyboardNavigation || !tourState.isActive) return

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowRight':
        case 'Enter':
          event.preventDefault()
          nextStep()
          break
        case 'ArrowLeft':
          event.preventDefault()
          previousStep()
          break
        case 'Escape':
          event.preventDefault()
          cancelTour()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [enableKeyboardNavigation, tourState.isActive, nextStep, previousStep, cancelTour])

  // Load user progress on mount
  useEffect(() => {
    loadUserProgress()
  }, [loadUserProgress])

  // Update suggested tours when tours or progress changes
  useEffect(() => {
    getSuggestedTours()
  }, [getSuggestedTours])

  return {
    // State
    isActive: tourState.isActive,
    currentTour: tourState.currentTour,
    currentStep: tourState.currentStep,
    availableTours: tourState.availableTours,
    suggestedTours: tourState.suggestedTours,
    progress: tourState.progress,
    
    // Tour management
    registerTour,
    startTour,
    nextStep,
    previousStep,
    completeTour,
    cancelTour,
    
    // Data management
    loadUserProgress,
    saveTourProgress,
    
    // Analytics
    getTourAnalytics,
    getSuggestedTours,
    
    // Utilities
    isTourCompleted: (tourId: string) => 
      tourState.progress.some(p => p.tourId === tourId && p.completed),
    getTourProgress: (tourId: string) => 
      tourState.progress.find(p => p.tourId === tourId),
    hasCompletedPrerequisites: (tourId: string) => {
      const tour = tourState.availableTours.find(t => t.id === tourId)
      if (!tour?.prerequisites) return true
      
      const completedTours = tourState.progress
        .filter(p => p.completed)
        .map(p => p.tourId)
      
      return tour.prerequisites.every(prereq => completedTours.includes(prereq))
    }
  }
}