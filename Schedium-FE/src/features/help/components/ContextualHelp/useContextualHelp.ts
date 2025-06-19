/**
 * Contextual Help Hook - Smart context-aware assistance system
 * Provides relevant help content based on user location and actions
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

export interface HelpContent {
  id: string
  title: string
  content: string
  type: 'tooltip' | 'popover' | 'modal' | 'inline' | 'sidebar'
  priority: 'low' | 'medium' | 'high' | 'critical'
  context: {
    page?: string
    section?: string
    element?: string
    userAction?: string
    userRole?: string[]
  }
  triggers: {
    hover?: boolean
    click?: boolean
    focus?: boolean
    error?: boolean
    firstVisit?: boolean
    inactivity?: boolean
  }
  multimedia?: {
    image?: string
    video?: string
    animation?: string
  }
  relatedLinks?: Array<{
    title: string
    url: string
    type: 'internal' | 'external' | 'tour' | 'video'
  }>
  conditions?: {
    showAfterSeconds?: number
    showOnlyOnce?: boolean
    requiresFlag?: string
    featureEnabled?: string
  }
  analytics?: {
    trackViews?: boolean
    trackInteractions?: boolean
    trackCompletions?: boolean
  }
}

export interface HelpState {
  isVisible: boolean
  currentContent: HelpContent | null
  position: { x: number; y: number }
  contextHistory: string[]
  userPreferences: {
    showTooltips: boolean
    showOnboarding: boolean
    helpLevel: 'basic' | 'intermediate' | 'advanced'
  }
}

interface UseContextualHelpOptions {
  enableSmartSuggestions?: boolean
  enableAnalytics?: boolean
  autoShowHelp?: boolean
  helpLevel?: 'basic' | 'intermediate' | 'advanced'
  onHelpShow?: (content: HelpContent) => void
  onHelpHide?: (content: HelpContent) => void
  onHelpInteraction?: (content: HelpContent, interaction: string) => void
}

export const useContextualHelp = (options: UseContextualHelpOptions = {}) => {
  const {
    enableSmartSuggestions = true,
    enableAnalytics = true,
    autoShowHelp = true,
    helpLevel = 'intermediate',
    onHelpShow,
    onHelpHide,
    onHelpInteraction
  } = options

  const location = useLocation()
  
  const [helpState, setHelpState] = useState<HelpState>({
    isVisible: false,
    currentContent: null,
    position: { x: 0, y: 0 },
    contextHistory: [],
    userPreferences: {
      showTooltips: true,
      showOnboarding: true,
      helpLevel: helpLevel
    }
  })

  const [helpContent] = useState<HelpContent[]>([
    // Schedule page help
    {
      id: 'schedule-matrix-help',
      title: 'Matriz de Horarios',
      content: `
        <div class="help-content">
          <p>La matriz de horarios te permite visualizar y gestionar todas las clases de forma semanal.</p>
          <h4>Funciones principales:</h4>
          <ul>
            <li><strong>Drag & Drop:</strong> Arrastra clases para moverlas</li>
            <li><strong>Clic derecho:</strong> Menú contextual con opciones</li>
            <li><strong>Zoom:</strong> Ctrl + rueda del ratón para acercar/alejar</li>
            <li><strong>Filtros:</strong> Usa la barra superior para filtrar</li>
          </ul>
          <p><em>💡 Tip: Mantén presionado Shift para seleccionar múltiples clases.</em></p>
        </div>
      `,
      type: 'popover',
      priority: 'high',
      context: {
        page: '/schedules',
        section: 'matrix',
        element: '[data-help="schedule-matrix"]'
      },
      triggers: {
        hover: true,
        firstVisit: true
      },
      multimedia: {
        video: '/help/videos/schedule-matrix-demo.mp4'
      },
      relatedLinks: [
        {
          title: 'Tour completo de horarios',
          url: 'tour:schedule-creation',
          type: 'tour'
        },
        {
          title: 'Guía de resolución de conflictos',
          url: '/help/guides/conflict-resolution',
          type: 'internal'
        }
      ]
    },
    {
      id: 'new-class-button-help',
      title: 'Crear Nueva Clase',
      content: `
        <div class="help-content">
          <p>Haz clic aquí para crear una nueva clase.</p>
          <h4>El proceso incluye:</h4>
          <ol>
            <li>Información básica de la clase</li>
            <li>Selección de instructor</li>
            <li>Asignación de aula</li>
            <li>Configuración de horarios</li>
            <li>Revisión y guardado</li>
          </ol>
          <p><em>💡 Tip: También puedes crear clases haciendo doble clic en una celda vacía de la matriz.</em></p>
        </div>
      `,
      type: 'tooltip',
      priority: 'medium',
      context: {
        page: '/schedules',
        element: '[data-help="new-class-button"]'
      },
      triggers: {
        hover: true
      },
      conditions: {
        showAfterSeconds: 5,
        showOnlyOnce: false
      }
    },
    {
      id: 'conflict-alert-help',
      title: 'Alerta de Conflicto',
      content: `
        <div class="help-content">
          <p><strong>⚠️ Se ha detectado un conflicto en el horario.</strong></p>
          <p>Los conflictos pueden ocurrir por:</p>
          <ul>
            <li>Instructor ocupado en otra clase</li>
            <li>Aula no disponible</li>
            <li>Solapamiento de horarios</li>
            <li>Grupo de estudiantes ocupado</li>
          </ul>
          <h4>Acciones recomendadas:</h4>
          <ol>
            <li>Revisa las sugerencias automáticas</li>
            <li>Selecciona una resolución</li>
            <li>Aplica los cambios</li>
          </ol>
        </div>
      `,
      type: 'modal',
      priority: 'critical',
      context: {
        userAction: 'conflict-detected'
      },
      triggers: {
        error: true
      },
      relatedLinks: [
        {
          title: 'Guía de resolución de conflictos',
          url: '/help/guides/conflicts',
          type: 'internal'
        },
        {
          title: 'Video tutorial',
          url: '/help/videos/conflict-resolution.mp4',
          type: 'video'
        }
      ]
    },
    // Dashboard help
    {
      id: 'dashboard-widgets-help',
      title: 'Widgets del Dashboard',
      content: `
        <div class="help-content">
          <p>Los widgets te proporcionan información en tiempo real sobre el sistema.</p>
          <h4>Funciones disponibles:</h4>
          <ul>
            <li><strong>Arrastar:</strong> Reorganiza widgets</li>
            <li><strong>Redimensionar:</strong> Ajusta el tamaño</li>
            <li><strong>Configurar:</strong> Clic en el ícono de configuración</li>
            <li><strong>Actualizar:</strong> Datos en tiempo real</li>
          </ul>
          <p><em>💡 Tip: Haz clic en "Editar Dashboard" para personalizar completamente.</em></p>
        </div>
      `,
      type: 'popover',
      priority: 'medium',
      context: {
        page: '/dashboard',
        section: 'widgets'
      },
      triggers: {
        hover: true,
        firstVisit: true
      }
    },
    // User management help
    {
      id: 'user-form-help',
      title: 'Formulario de Usuario',
      content: `
        <div class="help-content">
          <p>Completa la información del usuario cuidadosamente.</p>
          <h4>Campos obligatorios:</h4>
          <ul>
            <li><strong>Nombre completo:</strong> Nombre y apellidos</li>
            <li><strong>Email:</strong> Dirección de correo única</li>
            <li><strong>Rol:</strong> Determina los permisos</li>
            <li><strong>Estado:</strong> Activo o inactivo</li>
          </ul>
          <h4>Roles disponibles:</h4>
          <ul>
            <li><strong>Administrador:</strong> Acceso completo</li>
            <li><strong>Coordinador:</strong> Gestión de horarios</li>
            <li><strong>Secretario:</strong> Solo lectura</li>
          </ul>
        </div>
      `,
      type: 'sidebar',
      priority: 'medium',
      context: {
        page: '/users',
        section: 'form'
      },
      triggers: {
        focus: true
      }
    },
    // Error help
    {
      id: 'network-error-help',
      title: 'Error de Conexión',
      content: `
        <div class="help-content">
          <p><strong>❌ No se pudo conectar al servidor.</strong></p>
          <h4>Posibles causas:</h4>
          <ul>
            <li>Conexión a internet inestable</li>
            <li>Servidor en mantenimiento</li>
            <li>Sesión expirada</li>
          </ul>
          <h4>Soluciones:</h4>
          <ol>
            <li>Verifica tu conexión a internet</li>
            <li>Recarga la página</li>
            <li>Intenta nuevamente en unos minutos</li>
            <li>Contacta soporte si persiste</li>
          </ol>
        </div>
      `,
      type: 'modal',
      priority: 'critical',
      context: {
        userAction: 'network-error'
      },
      triggers: {
        error: true
      },
      relatedLinks: [
        {
          title: 'Estado del sistema',
          url: '/system-status',
          type: 'internal'
        },
        {
          title: 'Contactar soporte',
          url: '/support',
          type: 'internal'
        }
      ]
    }
  ])

  const inactivityTimerRef = useRef<NodeJS.Timeout>()
  const elementObserverRef = useRef<MutationObserver>()
  const currentContextRef = useRef<string>('')

  // Get current page context
  const getCurrentContext = useCallback(() => {
    const path = location.pathname
    const hash = location.hash
    const search = location.search
    
    return {
      page: path,
      section: hash.replace('#', ''),
      query: search,
      timestamp: Date.now()
    }
  }, [location])

  // Find relevant help content for current context
  const findRelevantHelp = useCallback((context: any, trigger?: string) => {
    return helpContent.filter(content => {
      // Check page match
      if (content.context.page && content.context.page !== context.page) {
        return false
      }
      
      // Check section match
      if (content.context.section && content.context.section !== context.section) {
        return false
      }
      
      // Check trigger match
      if (trigger && content.triggers) {
        const triggerKey = trigger as keyof typeof content.triggers
        if (!content.triggers[triggerKey]) {
          return false
        }
      }
      
      // Check user role
      if (content.context.userRole) {
        // Would check against actual user role from auth context
        const userRole = 'coordinator' // Mock role
        if (!content.context.userRole.includes(userRole)) {
          return false
        }
      }
      
      // Check conditions
      if (content.conditions) {
        // Check if should show only once
        if (content.conditions.showOnlyOnce) {
          const hasShown = localStorage.getItem(`help-shown-${content.id}`)
          if (hasShown) return false
        }
        
        // Check required flags
        if (content.conditions.requiresFlag) {
          const flagValue = localStorage.getItem(content.conditions.requiresFlag)
          if (!flagValue) return false
        }
      }
      
      return true
    }).sort((a, b) => {
      // Sort by priority
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }, [helpContent])

  // Show help content
  const showHelp = useCallback((content: HelpContent, position?: { x: number; y: number }) => {
    setHelpState(prev => ({
      ...prev,
      isVisible: true,
      currentContent: content,
      position: position || prev.position
    }))

    // Track analytics
    if (enableAnalytics && content.analytics?.trackViews) {
      // In real implementation, would send to analytics service
      console.log('Help viewed:', content.id)
    }

    // Mark as shown if show only once
    if (content.conditions?.showOnlyOnce) {
      localStorage.setItem(`help-shown-${content.id}`, 'true')
    }

    onHelpShow?.(content)
  }, [enableAnalytics, onHelpShow])

  // Hide help content
  const hideHelp = useCallback(() => {
    const currentContent = helpState.currentContent
    
    setHelpState(prev => ({
      ...prev,
      isVisible: false,
      currentContent: null
    }))

    if (currentContent) {
      onHelpHide?.(currentContent)
    }
  }, [helpState.currentContent, onHelpHide])

  // Show contextual help for element
  const showHelpForElement = useCallback((elementSelector: string, trigger: string = 'click') => {
    const context = getCurrentContext()
    const relevantHelp = findRelevantHelp({ ...context, element: elementSelector }, trigger)
    
    if (relevantHelp.length > 0) {
      const element = document.querySelector(elementSelector)
      let position = { x: 0, y: 0 }
      
      if (element) {
        const rect = element.getBoundingClientRect()
        position = {
          x: rect.left + rect.width / 2,
          y: rect.bottom + 10
        }
      }
      
      showHelp(relevantHelp[0], position)
      return true
    }
    
    return false
  }, [getCurrentContext, findRelevantHelp, showHelp])

  // Auto-show help based on context
  const autoShowHelp = useCallback(() => {
    if (!autoShowHelp || helpState.isVisible) return

    const context = getCurrentContext()
    const relevantHelp = findRelevantHelp(context, 'firstVisit')
    
    if (relevantHelp.length > 0) {
      // Show highest priority help after a delay
      setTimeout(() => {
        if (!helpState.isVisible) {
          showHelp(relevantHelp[0])
        }
      }, relevantHelp[0].conditions?.showAfterSeconds ? relevantHelp[0].conditions.showAfterSeconds * 1000 : 3000)
    }
  }, [autoShowHelp, helpState.isVisible, getCurrentContext, findRelevantHelp, showHelp])

  // Handle element interactions
  const handleElementInteraction = useCallback((event: Event, trigger: string) => {
    const target = event.target as HTMLElement
    const helpSelector = target.getAttribute('data-help')
    
    if (helpSelector && helpState.userPreferences.showTooltips) {
      showHelpForElement(`[data-help="${helpSelector}"]`, trigger)
    }
  }, [helpState.userPreferences.showTooltips, showHelpForElement])

  // Track user inactivity
  const trackInactivity = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current)
    }

    inactivityTimerRef.current = setTimeout(() => {
      if (enableSmartSuggestions && !helpState.isVisible) {
        const context = getCurrentContext()
        const relevantHelp = findRelevantHelp(context, 'inactivity')
        
        if (relevantHelp.length > 0) {
          showHelp(relevantHelp[0])
        }
      }
    }, 30000) // Show help after 30 seconds of inactivity
  }, [enableSmartSuggestions, helpState.isVisible, getCurrentContext, findRelevantHelp, showHelp])

  // Setup element observers
  useEffect(() => {
    if (!document) return

    // Add event listeners for help triggers
    const handleMouseOver = (e: Event) => handleElementInteraction(e, 'hover')
    const handleClick = (e: Event) => handleElementInteraction(e, 'click')
    const handleFocus = (e: Event) => handleElementInteraction(e, 'focus')

    document.addEventListener('mouseover', handleMouseOver)
    document.addEventListener('click', handleClick)
    document.addEventListener('focus', handleFocus, true)

    // Track user activity for inactivity detection
    const resetInactivityTimer = () => trackInactivity()
    document.addEventListener('mousemove', resetInactivityTimer)
    document.addEventListener('keypress', resetInactivityTimer)
    document.addEventListener('click', resetInactivityTimer)

    return () => {
      document.removeEventListener('mouseover', handleMouseOver)
      document.removeEventListener('click', handleClick)
      document.removeEventListener('focus', handleFocus, true)
      document.removeEventListener('mousemove', resetInactivityTimer)
      document.removeEventListener('keypress', resetInactivityTimer)
      document.removeEventListener('click', resetInactivityTimer)
      
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current)
      }
    }
  }, [handleElementInteraction, trackInactivity])

  // Auto-show help when context changes
  useEffect(() => {
    const context = getCurrentContext()
    const contextKey = `${context.page}-${context.section}`
    
    if (contextKey !== currentContextRef.current) {
      currentContextRef.current = contextKey
      
      // Add to context history
      setHelpState(prev => ({
        ...prev,
        contextHistory: [...prev.contextHistory.slice(-9), contextKey]
      }))
      
      // Auto-show help for new context
      if (helpState.userPreferences.showOnboarding) {
        autoShowHelp()
      }
    }
  }, [location, getCurrentContext, autoShowHelp, helpState.userPreferences.showOnboarding])

  // Track help interactions
  const trackInteraction = useCallback((interaction: string) => {
    if (helpState.currentContent && enableAnalytics) {
      onHelpInteraction?.(helpState.currentContent, interaction)
      
      // In real implementation, would send to analytics service
      console.log('Help interaction:', {
        contentId: helpState.currentContent.id,
        interaction,
        timestamp: Date.now()
      })
    }
  }, [helpState.currentContent, enableAnalytics, onHelpInteraction])

  return {
    // State
    helpState,
    isVisible: helpState.isVisible,
    currentContent: helpState.currentContent,
    
    // Actions
    showHelp,
    hideHelp,
    showHelpForElement,
    
    // Context
    getCurrentContext,
    findRelevantHelp,
    
    // Interactions
    trackInteraction,
    
    // Preferences
    updatePreferences: (preferences: Partial<HelpState['userPreferences']>) => {
      setHelpState(prev => ({
        ...prev,
        userPreferences: { ...prev.userPreferences, ...preferences }
      }))
    },
    
    // Utilities
    hasHelpForContext: (context?: any) => {
      const currentContext = context || getCurrentContext()
      return findRelevantHelp(currentContext).length > 0
    },
    
    getHelpHistory: () => helpState.contextHistory,
    
    // Content management
    getAvailableHelp: () => helpContent,
    searchHelp: (query: string) => {
      return helpContent.filter(content =>
        content.title.toLowerCase().includes(query.toLowerCase()) ||
        content.content.toLowerCase().includes(query.toLowerCase())
      )
    }
  }
}