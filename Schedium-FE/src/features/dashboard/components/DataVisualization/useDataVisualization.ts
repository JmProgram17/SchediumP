/**
 * Data Visualization Hook - Best practices for charts and data display
 * Implements accessibility, performance, and UX standards for data visualization
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'

export interface DataPoint {
  id: string
  label: string
  value: number
  color?: string
  metadata?: Record<string, any>
  timestamp?: number
}

export interface DataSeries {
  id: string
  name: string
  data: DataPoint[]
  color: string
  type?: 'line' | 'bar' | 'area' | 'scatter'
  visible: boolean
  unit?: string
  format?: 'number' | 'percentage' | 'currency' | 'time'
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'histogram' | 'heatmap'
  title: string
  subtitle?: string
  width: number
  height: number
  responsive: boolean
  theme: 'light' | 'dark' | 'auto'
  accessibility: {
    enabled: boolean
    description: string
    keyboardNavigation: boolean
    screenReaderOptimized: boolean
  }
  legend: {
    enabled: boolean
    position: 'top' | 'bottom' | 'left' | 'right'
    interactive: boolean
  }
  axes: {
    x: {
      label: string
      type: 'category' | 'numeric' | 'datetime'
      format?: string
      grid: boolean
    }
    y: {
      label: string
      type: 'numeric' | 'percentage'
      format?: string
      grid: boolean
      min?: number
      max?: number
    }
  }
  tooltip: {
    enabled: boolean
    format: string
    multiSeries: boolean
  }
  animation: {
    enabled: boolean
    duration: number
    easing: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out'
  }
  interaction: {
    zoom: boolean
    pan: boolean
    selection: boolean
    crossfilter: boolean
  }
}

export interface VisualizationMetrics {
  renderTime: number
  dataPoints: number
  memoryUsage: number
  lastUpdate: number
  errorRate: number
  accessibilityScore: number
}

interface UseDataVisualizationOptions {
  autoRefresh?: boolean
  refreshInterval?: number
  maxDataPoints?: number
  enablePerformanceMonitoring?: boolean
  enableAccessibilityFeatures?: boolean
  colorPalette?: string[]
  onDataUpdate?: (data: DataSeries[]) => void
  onError?: (error: string) => void
}

const DEFAULT_COLOR_PALETTE = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
]

const ACCESSIBILITY_PATTERNS = [
  'solid',
  'dashed',
  'dotted',
  'dashdot'
]

export const useDataVisualization = (options: UseDataVisualizationOptions = {}) => {
  const {
    autoRefresh = false,
    refreshInterval = 30000,
    maxDataPoints = 1000,
    enablePerformanceMonitoring = true,
    enableAccessibilityFeatures = true,
    colorPalette = DEFAULT_COLOR_PALETTE,
    onDataUpdate,
    onError
  } = options

  const [visualizationState, setVisualizationState] = useState({
    data: [] as DataSeries[],
    config: null as ChartConfig | null,
    selectedSeries: new Set<string>(),
    hoveredPoint: null as DataPoint | null,
    zoomLevel: 1,
    panOffset: { x: 0, y: 0 },
    isAnimating: false
  })

  const [metrics, setMetrics] = useState<VisualizationMetrics>({
    renderTime: 0,
    dataPoints: 0,
    memoryUsage: 0,
    lastUpdate: 0,
    errorRate: 0,
    accessibilityScore: 100
  })

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const performanceTimerRef = useRef<number>(0)

  // Generate accessible color scheme
  const generateAccessibleColors = useCallback((count: number) => {
    const colors = []
    const patterns = []
    
    for (let i = 0; i < count; i++) {
      colors.push(colorPalette[i % colorPalette.length])
      patterns.push(ACCESSIBILITY_PATTERNS[i % ACCESSIBILITY_PATTERNS.length])
    }
    
    return { colors, patterns }
  }, [colorPalette])

  // Validate data quality
  const validateData = useCallback((data: DataSeries[]): { valid: boolean; issues: string[] } => {
    const issues: string[] = []
    
    if (!data || data.length === 0) {
      issues.push('No data provided')
    }
    
    data.forEach((series, seriesIndex) => {
      if (!series.id) {
        issues.push(`Series ${seriesIndex} missing ID`)
      }
      
      if (!series.name) {
        issues.push(`Series ${seriesIndex} missing name`)
      }
      
      if (!series.data || series.data.length === 0) {
        issues.push(`Series ${seriesIndex} has no data points`)
      }
      
      series.data.forEach((point, pointIndex) => {
        if (typeof point.value !== 'number' || isNaN(point.value)) {
          issues.push(`Series ${seriesIndex}, point ${pointIndex} has invalid value`)
        }
      })
      
      // Check for data quality issues
      const values = series.data.map(p => p.value)
      const hasOutliers = values.some(v => Math.abs(v - median(values)) > 3 * standardDeviation(values))
      if (hasOutliers) {
        issues.push(`Series ${seriesIndex} contains potential outliers`)
      }
    })
    
    return { valid: issues.length === 0, issues }
  }, [])

  // Optimize data for visualization
  const optimizeData = useCallback((data: DataSeries[]): DataSeries[] => {
    return data.map(series => ({
      ...series,
      data: series.data
        .filter(point => !isNaN(point.value) && isFinite(point.value))
        .slice(-maxDataPoints) // Limit data points for performance
        .map((point, index) => ({
          ...point,
          id: point.id || `${series.id}-${index}`
        }))
    }))
  }, [maxDataPoints])

  // Calculate statistics
  const calculateStatistics = useCallback((data: DataSeries[]) => {
    const stats = data.map(series => {
      const values = series.data.map(p => p.value)
      return {
        seriesId: series.id,
        count: values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        mean: mean(values),
        median: median(values),
        standardDeviation: standardDeviation(values),
        trend: calculateTrend(values)
      }
    })
    
    return stats
  }, [])

  // Create default chart configuration
  const createDefaultConfig = useCallback((type: ChartConfig['type']): ChartConfig => ({
    type,
    title: 'Visualización de Datos',
    width: 800,
    height: 400,
    responsive: true,
    theme: 'light',
    accessibility: {
      enabled: enableAccessibilityFeatures,
      description: 'Gráfico interactivo de datos',
      keyboardNavigation: true,
      screenReaderOptimized: true
    },
    legend: {
      enabled: true,
      position: 'bottom',
      interactive: true
    },
    axes: {
      x: {
        label: 'Categoría',
        type: 'category',
        grid: true
      },
      y: {
        label: 'Valor',
        type: 'numeric',
        grid: true
      }
    },
    tooltip: {
      enabled: true,
      format: '{series}: {value}',
      multiSeries: true
    },
    animation: {
      enabled: true,
      duration: 750,
      easing: 'ease-out'
    },
    interaction: {
      zoom: true,
      pan: true,
      selection: false,
      crossfilter: false
    }
  }), [enableAccessibilityFeatures])

  // Performance monitoring
  const startPerformanceMonitoring = useCallback(() => {
    if (!enablePerformanceMonitoring) return
    performanceTimerRef.current = performance.now()
  }, [enablePerformanceMonitoring])

  const endPerformanceMonitoring = useCallback(() => {
    if (!enablePerformanceMonitoring || !performanceTimerRef.current) return
    
    const renderTime = performance.now() - performanceTimerRef.current
    const dataPoints = visualizationState.data.reduce((sum, series) => sum + series.data.length, 0)
    
    setMetrics(prev => ({
      ...prev,
      renderTime,
      dataPoints,
      lastUpdate: Date.now(),
      memoryUsage: (performance as any).memory?.usedJSHeapSize || 0
    }))
  }, [enablePerformanceMonitoring, visualizationState.data])

  // Update data
  const updateData = useCallback((newData: DataSeries[]) => {
    startPerformanceMonitoring()
    
    try {
      const validation = validateData(newData)
      if (!validation.valid) {
        onError?.(`Data validation failed: ${validation.issues.join(', ')}`)
        return false
      }
      
      const optimizedData = optimizeData(newData)
      const { colors } = generateAccessibleColors(optimizedData.length)
      
      const dataWithColors = optimizedData.map((series, index) => ({
        ...series,
        color: series.color || colors[index]
      }))
      
      setVisualizationState(prev => ({
        ...prev,
        data: dataWithColors
      }))
      
      onDataUpdate?.(dataWithColors)
      endPerformanceMonitoring()
      
      return true
    } catch (error) {
      onError?.(`Error updating data: ${error}`)
      endPerformanceMonitoring()
      return false
    }
  }, [
    validateData, 
    optimizeData, 
    generateAccessibleColors, 
    onDataUpdate, 
    onError,
    startPerformanceMonitoring,
    endPerformanceMonitoring
  ])

  // Update configuration
  const updateConfig = useCallback((newConfig: Partial<ChartConfig>) => {
    setVisualizationState(prev => ({
      ...prev,
      config: prev.config ? { ...prev.config, ...newConfig } : null
    }))
  }, [])

  // Initialize chart
  const initializeChart = useCallback((type: ChartConfig['type'], data: DataSeries[]) => {
    const config = createDefaultConfig(type)
    setVisualizationState(prev => ({ ...prev, config }))
    return updateData(data)
  }, [createDefaultConfig, updateData])

  // Toggle series visibility
  const toggleSeries = useCallback((seriesId: string) => {
    setVisualizationState(prev => ({
      ...prev,
      data: prev.data.map(series =>
        series.id === seriesId ? { ...series, visible: !series.visible } : series
      )
    }))
  }, [])

  // Export chart data
  const exportData = useCallback((format: 'json' | 'csv' | 'svg' | 'png') => {
    const { data, config } = visualizationState
    
    switch (format) {
      case 'json':
        return JSON.stringify({ data, config, timestamp: Date.now() }, null, 2)
      
      case 'csv':
        const headers = ['Series', 'Label', 'Value', 'Timestamp']
        const rows = data.flatMap(series =>
          series.data.map(point => [
            series.name,
            point.label,
            point.value,
            point.timestamp || ''
          ])
        )
        return [headers, ...rows].map(row => row.join(',')).join('\n')
      
      case 'svg':
        if (svgRef.current) {
          return new XMLSerializer().serializeToString(svgRef.current)
        }
        return null
      
      case 'png':
        if (canvasRef.current) {
          return canvasRef.current.toDataURL('image/png')
        }
        return null
      
      default:
        return null
    }
  }, [visualizationState])

  // Accessibility helpers
  const getAriaLabel = useCallback((point: DataPoint, series: DataSeries) => {
    return `${series.name}: ${point.label}, valor ${point.value}`
  }, [])

  const getKeyboardNavigation = useCallback(() => {
    return {
      onKeyDown: (event: KeyboardEvent) => {
        if (!visualizationState.config?.accessibility.keyboardNavigation) return
        
        switch (event.key) {
          case 'ArrowRight':
          case 'ArrowLeft':
            // Navigate between data points
            event.preventDefault()
            break
          case 'ArrowUp':
          case 'ArrowDown':
            // Navigate between series
            event.preventDefault()
            break
          case 'Enter':
          case ' ':
            // Select/activate data point
            event.preventDefault()
            break
        }
      }
    }
  }, [visualizationState.config])

  // Auto-refresh data
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      // This would typically fetch new data from an API
      onDataUpdate?.(visualizationState.data)
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, visualizationState.data, onDataUpdate])

  return {
    // State
    data: visualizationState.data,
    config: visualizationState.config,
    selectedSeries: visualizationState.selectedSeries,
    hoveredPoint: visualizationState.hoveredPoint,
    metrics,
    
    // Core functions
    initializeChart,
    updateData,
    updateConfig,
    
    // Data manipulation
    toggleSeries,
    optimizeData,
    validateData,
    calculateStatistics,
    
    // Export/import
    exportData,
    
    // Accessibility
    getAriaLabel,
    getKeyboardNavigation,
    generateAccessibleColors,
    
    // Performance
    startPerformanceMonitoring,
    endPerformanceMonitoring,
    
    // Refs for canvas/svg
    canvasRef,
    svgRef,
    
    // Utilities
    isDataValid: (data: DataSeries[]) => validateData(data).valid,
    getVisibleSeries: () => visualizationState.data.filter(s => s.visible),
    getTotalDataPoints: () => visualizationState.data.reduce((sum, s) => sum + s.data.length, 0)
  }
}

// Helper functions
function mean(values: number[]): number {
  return values.reduce((sum, val) => sum + val, 0) / values.length
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function standardDeviation(values: number[]): number {
  const avg = mean(values)
  const squareDiffs = values.map(value => Math.pow(value - avg, 2))
  return Math.sqrt(mean(squareDiffs))
}

function calculateTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
  if (values.length < 2) return 'stable'
  
  const first = values[0]
  const last = values[values.length - 1]
  const threshold = 0.05 // 5% threshold
  
  if (last > first * (1 + threshold)) return 'increasing'
  if (last < first * (1 - threshold)) return 'decreasing'
  return 'stable'
}