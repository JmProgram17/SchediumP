/**
 * AI-Powered Search Hook - Intelligent help and content discovery
 * Uses natural language processing for smart search and suggestions
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { useDebounce } from '@/shared/hooks/useDebounce'

export interface SearchResult {
  id: string
  title: string
  content: string
  type: 'help_article' | 'tour' | 'video' | 'faq' | 'guide' | 'api_doc' | 'feature'
  category: 'onboarding' | 'troubleshooting' | 'features' | 'advanced' | 'api'
  relevanceScore: number
  highlights: string[]
  metadata: {
    lastUpdated: string
    author: string
    readTime: number
    difficulty: 'beginner' | 'intermediate' | 'advanced'
    tags: string[]
  }
  actions?: Array<{
    label: string
    type: 'navigate' | 'tour' | 'external' | 'download'
    target: string
  }>
}

export interface SearchSuggestion {
  id: string
  text: string
  type: 'query' | 'completion' | 'correction' | 'related'
  confidence: number
  context?: string
}

export interface SearchAnalytics {
  query: string
  resultsCount: number
  selectedResult?: string
  timestamp: number
  userContext: {
    page: string
    userRole: string
    sessionId: string
  }
  satisfactionRating?: number
}

interface UseAISearchOptions {
  enableAutoComplete?: boolean
  enableSpellCheck?: boolean
  enableContextualSearch?: boolean
  enableAnalytics?: boolean
  maxResults?: number
  debounceMs?: number
  minQueryLength?: number
  onSearchComplete?: (query: string, results: SearchResult[]) => void
  onResultClick?: (result: SearchResult, query: string) => void
}

export const useAISearch = (options: UseAISearchOptions = {}) => {
  const {
    enableAutoComplete = true,
    enableSpellCheck = true,
    enableContextualSearch = true,
    enableAnalytics = true,
    maxResults = 20,
    debounceMs = 300,
    minQueryLength = 2,
    onSearchComplete,
    onResultClick
  } = options

  const [searchState, setSearchState] = useState({
    query: '',
    isSearching: false,
    results: [] as SearchResult[],
    suggestions: [] as SearchSuggestion[],
    selectedIndex: -1,
    searchHistory: [] as string[],
    popularQueries: [] as Array<{ query: string; count: number }>,
    recentSearches: [] as Array<{ query: string; timestamp: number }>
  })

  const searchAbortControllerRef = useRef<AbortController>()
  const searchAnalyticsRef = useRef<SearchAnalytics[]>([])
  
  // Debounced query for auto-complete
  const debouncedQuery = useDebounce(searchState.query, debounceMs)

  // Mock knowledge base - in real implementation, would come from CMS/API
  const knowledgeBase: SearchResult[] = [
    {
      id: 'schedule-creation-guide',
      title: 'Cómo crear un horario paso a paso',
      content: 'Guía completa para crear horarios efectivos en Schedium. Incluye mejores prácticas, consejos de optimización y resolución de conflictos comunes.',
      type: 'guide',
      category: 'features',
      relevanceScore: 0.95,
      highlights: ['crear horario', 'paso a paso', 'optimización'],
      metadata: {
        lastUpdated: '2024-03-15',
        author: 'Equipo Schedium',
        readTime: 8,
        difficulty: 'beginner',
        tags: ['horarios', 'creación', 'tutorial', 'básico']
      },
      actions: [
        {
          label: 'Iniciar tour',
          type: 'tour',
          target: 'schedule-creation'
        },
        {
          label: 'Ver video',
          type: 'external',
          target: '/help/videos/schedule-creation.mp4'
        }
      ]
    },
    {
      id: 'conflict-resolution-faq',
      title: '¿Cómo resolver conflictos de horarios?',
      content: 'Los conflictos de horarios aparecen cuando hay solapamientos entre clases, instructores ocupados o aulas no disponibles. Aprende a resolverlos automáticamente.',
      type: 'faq',
      category: 'troubleshooting',
      relevanceScore: 0.90,
      highlights: ['conflictos', 'horarios', 'resolver'],
      metadata: {
        lastUpdated: '2024-03-10',
        author: 'Soporte Técnico',
        readTime: 5,
        difficulty: 'intermediate',
        tags: ['conflictos', 'resolución', 'problemas', 'horarios']
      },
      actions: [
        {
          label: 'Ver guía detallada',
          type: 'navigate',
          target: '/help/guides/conflict-resolution'
        }
      ]
    },
    {
      id: 'dashboard-customization',
      title: 'Personalizar tu dashboard',
      content: 'El dashboard de Schedium es completamente personalizable. Aprende a añadir widgets, crear vistas personalizadas y configurar alertas.',
      type: 'help_article',
      category: 'features',
      relevanceScore: 0.85,
      highlights: ['dashboard', 'personalizar', 'widgets'],
      metadata: {
        lastUpdated: '2024-03-12',
        author: 'Equipo de Producto',
        readTime: 6,
        difficulty: 'intermediate',
        tags: ['dashboard', 'personalización', 'widgets', 'interface']
      },
      actions: [
        {
          label: 'Tour del dashboard',
          type: 'tour',
          target: 'dashboard-analytics'
        }
      ]
    },
    {
      id: 'keyboard-shortcuts',
      title: 'Atajos de teclado para mayor productividad',
      content: 'Lista completa de atajos de teclado en Schedium. Incluye atajos para navegación, edición, y funciones avanzadas.',
      type: 'help_article',
      category: 'advanced',
      relevanceScore: 0.80,
      highlights: ['atajos', 'teclado', 'productividad'],
      metadata: {
        lastUpdated: '2024-03-08',
        author: 'Equipo de UX',
        readTime: 4,
        difficulty: 'intermediate',
        tags: ['atajos', 'teclado', 'productividad', 'navegación']
      },
      actions: [
        {
          label: 'Descargar PDF',
          type: 'download',
          target: '/downloads/keyboard-shortcuts.pdf'
        }
      ]
    },
    {
      id: 'api-integration',
      title: 'Integración con APIs externas',
      content: 'Documentación técnica para integrar Schedium con sistemas externos mediante APIs REST. Incluye ejemplos de código y mejores prácticas.',
      type: 'api_doc',
      category: 'api',
      relevanceScore: 0.75,
      highlights: ['API', 'integración', 'REST'],
      metadata: {
        lastUpdated: '2024-03-14',
        author: 'Equipo de Desarrollo',
        readTime: 15,
        difficulty: 'advanced',
        tags: ['API', 'integración', 'desarrollo', 'REST', 'webhooks']
      },
      actions: [
        {
          label: 'Ver documentación',
          type: 'external',
          target: '/api/docs'
        }
      ]
    },
    {
      id: 'mobile-app-tour',
      title: 'Tour de la aplicación móvil',
      content: 'Descubre cómo usar Schedium desde tu dispositivo móvil. Tour interactivo con las funciones principales adaptadas para pantallas pequeñas.',
      type: 'tour',
      category: 'onboarding',
      relevanceScore: 0.70,
      highlights: ['móvil', 'aplicación', 'tour'],
      metadata: {
        lastUpdated: '2024-03-11',
        author: 'Equipo Móvil',
        readTime: 10,
        difficulty: 'beginner',
        tags: ['móvil', 'aplicación', 'tour', 'responsive']
      },
      actions: [
        {
          label: 'Iniciar tour móvil',
          type: 'tour',
          target: 'mobile-features'
        }
      ]
    }
  ]

  // AI-powered search algorithm (simplified)
  const performAISearch = useCallback(async (query: string): Promise<SearchResult[]> => {
    if (!query || query.length < minQueryLength) return []

    try {
      // Cancel previous search
      if (searchAbortControllerRef.current) {
        searchAbortControllerRef.current.abort()
      }

      searchAbortControllerRef.current = new AbortController()
      const signal = searchAbortControllerRef.current.signal

      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 100))

      if (signal.aborted) return []

      // Normalize query
      const normalizedQuery = query.toLowerCase().trim()
      const queryWords = normalizedQuery.split(/\s+/)

      // Calculate relevance scores
      const scoredResults = knowledgeBase.map(item => {
        let score = 0
        const searchableText = `${item.title} ${item.content} ${item.metadata.tags.join(' ')}`.toLowerCase()

        // Exact phrase match (highest score)
        if (searchableText.includes(normalizedQuery)) {
          score += 50
        }

        // Title matches (high score)
        const titleWords = item.title.toLowerCase().split(/\s+/)
        const titleMatches = queryWords.filter(word => 
          titleWords.some(titleWord => titleWord.includes(word) || word.includes(titleWord))
        ).length
        score += titleMatches * 20

        // Content matches (medium score)
        const contentMatches = queryWords.filter(word => 
          searchableText.includes(word)
        ).length
        score += contentMatches * 10

        // Tag matches (medium score)
        const tagMatches = queryWords.filter(word =>
          item.metadata.tags.some(tag => tag.includes(word) || word.includes(tag))
        ).length
        score += tagMatches * 15

        // Category relevance
        if (enableContextualSearch) {
          // Would consider user's current context, role, etc.
          const userContext = getCurrentUserContext()
          if (item.category === userContext.preferredCategory) {
            score += 5
          }
        }

        // Recency boost
        const daysSinceUpdate = (Date.now() - new Date(item.metadata.lastUpdated).getTime()) / (1000 * 60 * 60 * 24)
        if (daysSinceUpdate < 30) {
          score += 5
        }

        // Generate highlights
        const highlights: string[] = []
        queryWords.forEach(word => {
          const regex = new RegExp(`\\b(\\S*${word}\\S*)\\b`, 'gi')
          const matches = searchableText.match(regex)
          if (matches) {
            highlights.push(...matches.slice(0, 3))
          }
        })

        return {
          ...item,
          relevanceScore: score / 100, // Normalize to 0-1
          highlights: [...new Set(highlights)] // Remove duplicates
        }
      })

      // Filter and sort results
      const filteredResults = scoredResults
        .filter(item => item.relevanceScore > 0.1) // Minimum relevance threshold
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, maxResults)

      // Track search analytics
      if (enableAnalytics) {
        const analytics: SearchAnalytics = {
          query,
          resultsCount: filteredResults.length,
          timestamp: Date.now(),
          userContext: getCurrentUserContext()
        }
        searchAnalyticsRef.current.push(analytics)
      }

      return filteredResults

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return []
      }
      console.error('Search error:', error)
      return []
    }
  }, [minQueryLength, maxResults, enableContextualSearch, enableAnalytics])

  // Generate search suggestions
  const generateSuggestions = useCallback(async (query: string): Promise<SearchSuggestion[]> => {
    if (!enableAutoComplete || query.length < 2) return []

    const suggestions: SearchSuggestion[] = []

    // Query completions from popular searches
    const popularCompletions = searchState.popularQueries
      .filter(item => item.query.toLowerCase().startsWith(query.toLowerCase()))
      .slice(0, 3)
      .map(item => ({
        id: `completion-${item.query}`,
        text: item.query,
        type: 'completion' as const,
        confidence: 0.8
      }))

    suggestions.push(...popularCompletions)

    // Related queries from knowledge base
    const relatedQueries = knowledgeBase
      .filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.metadata.tags.some(tag => tag.includes(query.toLowerCase()))
      )
      .slice(0, 4)
      .map(item => ({
        id: `related-${item.id}`,
        text: item.title,
        type: 'related' as const,
        confidence: 0.7,
        context: item.category
      }))

    suggestions.push(...relatedQueries)

    // Spell corrections (simple implementation)
    if (enableSpellCheck && query.length > 3) {
      const commonTerms = ['horario', 'clase', 'instructor', 'aula', 'conflicto', 'dashboard']
      const corrections = commonTerms.filter(term => {
        const distance = levenshteinDistance(query.toLowerCase(), term)
        return distance <= 2 && distance > 0
      }).map(term => ({
        id: `correction-${term}`,
        text: term,
        type: 'correction' as const,
        confidence: 0.6
      }))

      suggestions.push(...corrections)
    }

    return suggestions.slice(0, 8) // Limit total suggestions
  }, [enableAutoComplete, enableSpellCheck, searchState.popularQueries])

  // Perform search
  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchState(prev => ({
        ...prev,
        results: [],
        isSearching: false
      }))
      return
    }

    setSearchState(prev => ({
      ...prev,
      query,
      isSearching: true,
      selectedIndex: -1
    }))

    try {
      const results = await performAISearch(query)
      
      setSearchState(prev => ({
        ...prev,
        results,
        isSearching: false,
        searchHistory: [query, ...prev.searchHistory.filter(h => h !== query)].slice(0, 10),
        recentSearches: [
          { query, timestamp: Date.now() },
          ...prev.recentSearches.filter(s => s.query !== query)
        ].slice(0, 20)
      }))

      onSearchComplete?.(query, results)

    } catch (error) {
      console.error('Search failed:', error)
      setSearchState(prev => ({
        ...prev,
        isSearching: false,
        results: []
      }))
    }
  }, [performAISearch, onSearchComplete])

  // Handle result click
  const handleResultClick = useCallback((result: SearchResult) => {
    onResultClick?.(result, searchState.query)

    // Track analytics
    if (enableAnalytics) {
      const lastAnalytics = searchAnalyticsRef.current[searchAnalyticsRef.current.length - 1]
      if (lastAnalytics && lastAnalytics.query === searchState.query) {
        lastAnalytics.selectedResult = result.id
      }
    }

    // Execute result action
    if (result.actions && result.actions.length > 0) {
      const primaryAction = result.actions[0]
      executeAction(primaryAction)
    }
  }, [searchState.query, onResultClick, enableAnalytics])

  // Execute action
  const executeAction = useCallback((action: SearchResult['actions'][0]) => {
    switch (action.type) {
      case 'navigate':
        window.location.href = action.target
        break
      case 'tour':
        // Would integrate with tour system
        console.log('Starting tour:', action.target)
        break
      case 'external':
        window.open(action.target, '_blank')
        break
      case 'download':
        const link = document.createElement('a')
        link.href = action.target
        link.download = ''
        link.click()
        break
    }
  }, [])

  // Keyboard navigation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!searchState.results.length) return

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setSearchState(prev => ({
          ...prev,
          selectedIndex: Math.min(prev.selectedIndex + 1, prev.results.length - 1)
        }))
        break
      case 'ArrowUp':
        event.preventDefault()
        setSearchState(prev => ({
          ...prev,
          selectedIndex: Math.max(prev.selectedIndex - 1, -1)
        }))
        break
      case 'Enter':
        event.preventDefault()
        if (searchState.selectedIndex >= 0) {
          handleResultClick(searchState.results[searchState.selectedIndex])
        }
        break
      case 'Escape':
        setSearchState(prev => ({
          ...prev,
          results: [],
          selectedIndex: -1
        }))
        break
    }
  }, [searchState.results, searchState.selectedIndex, handleResultClick])

  // Auto-complete effect
  useEffect(() => {
    if (debouncedQuery && enableAutoComplete) {
      generateSuggestions(debouncedQuery).then(suggestions => {
        setSearchState(prev => ({
          ...prev,
          suggestions
        }))
      })
    } else {
      setSearchState(prev => ({
        ...prev,
        suggestions: []
      }))
    }
  }, [debouncedQuery, enableAutoComplete, generateSuggestions])

  // Load popular queries on mount
  useEffect(() => {
    // In real implementation, would load from analytics API
    const mockPopularQueries = [
      { query: 'crear horario', count: 150 },
      { query: 'resolver conflictos', count: 120 },
      { query: 'dashboard personalizar', count: 95 },
      { query: 'atajos teclado', count: 80 },
      { query: 'exportar horarios', count: 75 }
    ]

    setSearchState(prev => ({
      ...prev,
      popularQueries: mockPopularQueries
    }))
  }, [])

  return {
    // State
    searchState,
    query: searchState.query,
    isSearching: searchState.isSearching,
    results: searchState.results,
    suggestions: searchState.suggestions,
    selectedIndex: searchState.selectedIndex,
    
    // Actions
    search,
    setQuery: (query: string) => setSearchState(prev => ({ ...prev, query })),
    handleResultClick,
    handleKeyDown,
    
    // Utilities
    clearResults: () => setSearchState(prev => ({ 
      ...prev, 
      results: [], 
      selectedIndex: -1 
    })),
    clearHistory: () => setSearchState(prev => ({ 
      ...prev, 
      searchHistory: [], 
      recentSearches: [] 
    })),
    
    // Analytics
    getSearchAnalytics: () => searchAnalyticsRef.current,
    getPopularQueries: () => searchState.popularQueries,
    getRecentSearches: () => searchState.recentSearches,
    
    // Advanced
    addFeedback: (resultId: string, rating: number) => {
      const lastAnalytics = searchAnalyticsRef.current[searchAnalyticsRef.current.length - 1]
      if (lastAnalytics && lastAnalytics.selectedResult === resultId) {
        lastAnalytics.satisfactionRating = rating
      }
    }
  }
}

// Helper functions
function getCurrentUserContext() {
  return {
    page: window.location.pathname,
    userRole: 'coordinator', // Would come from auth context
    sessionId: 'session-123',
    preferredCategory: 'features' as const
  }
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = []
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  
  return matrix[str2.length][str1.length]
}