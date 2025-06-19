/**
 * Widget Registry - Custom widgets framework for extensible dashboards
 * Provides plugin-like architecture for creating and registering custom widgets
 */

import React from 'react'
import { DashboardWidget } from '../DashboardBuilder/useDashboardBuilder'

export interface WidgetDefinition {
  id: string
  name: string
  version: string
  description: string
  author: string
  category: 'analytics' | 'monitoring' | 'scheduling' | 'user_activity' | 'custom'
  icon: string
  component: React.ComponentType<WidgetProps>
  configComponent?: React.ComponentType<WidgetConfigProps>
  defaultConfig: Record<string, any>
  defaultSize: { w: number; h: number }
  minSize?: { w: number; h: number }
  maxSize?: { w: number; h: number }
  resizable: boolean
  requiredPermissions: string[]
  supportedDataSources: string[]
  dependencies?: string[]
  schema?: {
    config: Record<string, WidgetConfigField>
    data: Record<string, any>
  }
}

export interface WidgetProps {
  widget: DashboardWidget
  data?: any
  isLoading?: boolean
  error?: string
  isEditing?: boolean
  onUpdate?: (updates: Partial<DashboardWidget>) => void
  onRefresh?: () => void
  className?: string
}

export interface WidgetConfigProps {
  config: Record<string, any>
  onChange: (config: Record<string, any>) => void
  availableDataSources?: string[]
  permissions?: string[]
}

export interface WidgetConfigField {
  type: 'string' | 'number' | 'boolean' | 'select' | 'color' | 'array' | 'object' | 'datasource'
  label: string
  description?: string
  required?: boolean
  default?: any
  options?: Array<{ label: string; value: any }>
  min?: number
  max?: number
  validation?: (value: any) => string | null
}

export interface WidgetDataProvider {
  id: string
  name: string
  description: string
  endpoint: string
  method: 'GET' | 'POST'
  headers?: Record<string, string>
  bodyTemplate?: string
  responseTransform?: (data: any) => any
  refreshInterval?: number
  cacheStrategy: 'none' | 'memory' | 'session' | 'local'
  cacheDuration?: number
  requiresAuth: boolean
  rateLimit?: {
    requests: number
    window: number // milliseconds
  }
}

class WidgetRegistryClass {
  private widgets = new Map<string, WidgetDefinition>()
  private dataProviders = new Map<string, WidgetDataProvider>()
  private middleware: Array<(widget: WidgetDefinition) => WidgetDefinition> = []

  // Register a new widget
  register(definition: WidgetDefinition): void {
    // Apply middleware transformations
    let processedDefinition = definition
    for (const middleware of this.middleware) {
      processedDefinition = middleware(processedDefinition)
    }

    // Validate definition
    this.validateDefinition(processedDefinition)

    this.widgets.set(definition.id, processedDefinition)
    console.log(`Widget registered: ${definition.name} (${definition.id})`)
  }

  // Unregister a widget
  unregister(widgetId: string): boolean {
    return this.widgets.delete(widgetId)
  }

  // Get widget definition
  getWidget(widgetId: string): WidgetDefinition | undefined {
    return this.widgets.get(widgetId)
  }

  // Get all registered widgets
  getAllWidgets(): WidgetDefinition[] {
    return Array.from(this.widgets.values())
  }

  // Get widgets by category
  getWidgetsByCategory(category: string): WidgetDefinition[] {
    return this.getAllWidgets().filter(widget => widget.category === category)
  }

  // Register data provider
  registerDataProvider(provider: WidgetDataProvider): void {
    this.dataProviders.set(provider.id, provider)
    console.log(`Data provider registered: ${provider.name} (${provider.id})`)
  }

  // Get data provider
  getDataProvider(providerId: string): WidgetDataProvider | undefined {
    return this.dataProviders.get(providerId)
  }

  // Get all data providers
  getAllDataProviders(): WidgetDataProvider[] {
    return Array.from(this.dataProviders.values())
  }

  // Add middleware
  use(middleware: (widget: WidgetDefinition) => WidgetDefinition): void {
    this.middleware.push(middleware)
  }

  // Create widget instance
  createWidget(
    definitionId: string,
    config: Record<string, any> = {},
    position: { x: number; y: number; w?: number; h?: number } = { x: 0, y: 0 }
  ): DashboardWidget | null {
    const definition = this.getWidget(definitionId)
    if (!definition) {
      console.error(`Widget definition not found: ${definitionId}`)
      return null
    }

    const widget: DashboardWidget = {
      id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'custom',
      title: definition.name,
      description: definition.description,
      position: {
        x: position.x,
        y: position.y,
        w: position.w || definition.defaultSize.w,
        h: position.h || definition.defaultSize.h
      },
      config: {
        dataSource: '',
        refreshInterval: 300000,
        ...definition.defaultConfig,
        ...config,
        __widgetType: definitionId
      },
      permissions: {
        canEdit: true,
        canDelete: true,
        canMove: true,
        canResize: definition.resizable
      }
    }

    return widget
  }

  // Validate widget definition
  private validateDefinition(definition: WidgetDefinition): void {
    const required = ['id', 'name', 'component', 'defaultConfig', 'defaultSize']
    
    for (const field of required) {
      if (!(field in definition)) {
        throw new Error(`Widget definition missing required field: ${field}`)
      }
    }

    if (definition.defaultSize.w <= 0 || definition.defaultSize.h <= 0) {
      throw new Error('Widget default size must be positive')
    }

    if (definition.minSize) {
      if (definition.minSize.w > definition.defaultSize.w || definition.minSize.h > definition.defaultSize.h) {
        throw new Error('Widget minimum size cannot be larger than default size')
      }
    }

    if (definition.maxSize) {
      if (definition.maxSize.w < definition.defaultSize.w || definition.maxSize.h < definition.defaultSize.h) {
        throw new Error('Widget maximum size cannot be smaller than default size')
      }
    }
  }

  // Render widget component
  renderWidget(widget: DashboardWidget, props: Omit<WidgetProps, 'widget'>): React.ReactElement | null {
    const widgetType = widget.config.__widgetType
    if (!widgetType) {
      console.error('Widget missing __widgetType in config')
      return null
    }

    const definition = this.getWidget(widgetType)
    if (!definition) {
      console.error(`Widget definition not found for type: ${widgetType}`)
      return null
    }

    const Component = definition.component
    return React.createElement(Component, { widget, ...props })
  }

  // Render widget config component
  renderWidgetConfig(widget: DashboardWidget, props: WidgetConfigProps): React.ReactElement | null {
    const widgetType = widget.config.__widgetType
    if (!widgetType) return null

    const definition = this.getWidget(widgetType)
    if (!definition || !definition.configComponent) return null

    const ConfigComponent = definition.configComponent
    return React.createElement(ConfigComponent, props)
  }

  // Check if user has required permissions for widget
  hasPermissions(widgetType: string, userPermissions: string[]): boolean {
    const definition = this.getWidget(widgetType)
    if (!definition) return false

    return definition.requiredPermissions.every(permission => 
      userPermissions.includes(permission)
    )
  }

  // Validate widget configuration against schema
  validateConfig(widgetType: string, config: Record<string, any>): { valid: boolean; errors: string[] } {
    const definition = this.getWidget(widgetType)
    if (!definition || !definition.schema) {
      return { valid: true, errors: [] }
    }

    const errors: string[] = []
    const schema = definition.schema.config

    for (const [fieldName, fieldDef] of Object.entries(schema)) {
      const value = config[fieldName]

      // Check required fields
      if (fieldDef.required && (value === undefined || value === null)) {
        errors.push(`Field '${fieldName}' is required`)
        continue
      }

      // Skip validation if field is not provided and not required
      if (value === undefined || value === null) continue

      // Type validation
      if (!this.validateFieldType(value, fieldDef.type)) {
        errors.push(`Field '${fieldName}' has invalid type, expected ${fieldDef.type}`)
        continue
      }

      // Custom validation
      if (fieldDef.validation) {
        const validationError = fieldDef.validation(value)
        if (validationError) {
          errors.push(`Field '${fieldName}': ${validationError}`)
        }
      }

      // Range validation for numbers
      if (fieldDef.type === 'number') {
        if (fieldDef.min !== undefined && value < fieldDef.min) {
          errors.push(`Field '${fieldName}' must be at least ${fieldDef.min}`)
        }
        if (fieldDef.max !== undefined && value > fieldDef.max) {
          errors.push(`Field '${fieldName}' must be at most ${fieldDef.max}`)
        }
      }
    }

    return { valid: errors.length === 0, errors }
  }

  private validateFieldType(value: any, type: WidgetConfigField['type']): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string'
      case 'number':
        return typeof value === 'number' && !isNaN(value)
      case 'boolean':
        return typeof value === 'boolean'
      case 'array':
        return Array.isArray(value)
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value)
      case 'select':
      case 'color':
      case 'datasource':
        return typeof value === 'string'
      default:
        return true
    }
  }

  // Get widget dependencies
  getDependencies(widgetType: string): string[] {
    const definition = this.getWidget(widgetType)
    return definition?.dependencies || []
  }

  // Check if all dependencies are available
  checkDependencies(widgetType: string): { satisfied: boolean; missing: string[] } {
    const dependencies = this.getDependencies(widgetType)
    const missing = dependencies.filter(dep => !this.widgets.has(dep))
    
    return {
      satisfied: missing.length === 0,
      missing
    }
  }

  // Export widget definitions (for backup/sharing)
  export(): { widgets: WidgetDefinition[]; dataProviders: WidgetDataProvider[] } {
    return {
      widgets: this.getAllWidgets(),
      dataProviders: this.getAllDataProviders()
    }
  }

  // Import widget definitions
  import(data: { widgets?: WidgetDefinition[]; dataProviders?: WidgetDataProvider[] }): void {
    if (data.widgets) {
      data.widgets.forEach(widget => this.register(widget))
    }
    
    if (data.dataProviders) {
      data.dataProviders.forEach(provider => this.registerDataProvider(provider))
    }
  }

  // Clear all registrations
  clear(): void {
    this.widgets.clear()
    this.dataProviders.clear()
    this.middleware = []
  }
}

// Singleton instance
export const WidgetRegistry = new WidgetRegistryClass()

// Helper functions for widget development
export const createWidgetDefinition = (
  definition: Omit<WidgetDefinition, 'version' | 'author'> & {
    version?: string
    author?: string
  }
): WidgetDefinition => ({
  version: '1.0.0',
  author: 'Sistema Schedium',
  ...definition
})

export const createDataProvider = (
  provider: Omit<WidgetDataProvider, 'cacheStrategy' | 'requiresAuth'> & {
    cacheStrategy?: WidgetDataProvider['cacheStrategy']
    requiresAuth?: boolean
  }
): WidgetDataProvider => ({
  cacheStrategy: 'memory',
  requiresAuth: true,
  ...provider
})

// Middleware for common transformations
export const securityMiddleware = (widget: WidgetDefinition): WidgetDefinition => {
  // Add security validations
  if (!widget.requiredPermissions || widget.requiredPermissions.length === 0) {
    console.warn(`Widget ${widget.id} has no required permissions, adding default permission`)
    widget.requiredPermissions = ['widgets.use']
  }
  
  return widget
}

export const performanceMiddleware = (widget: WidgetDefinition): WidgetDefinition => {
  // Add performance optimizations
  if (widget.defaultConfig.refreshInterval && widget.defaultConfig.refreshInterval < 5000) {
    console.warn(`Widget ${widget.id} has very short refresh interval, adjusting to 5 seconds minimum`)
    widget.defaultConfig.refreshInterval = 5000
  }
  
  return widget
}

// Apply default middleware
WidgetRegistry.use(securityMiddleware)
WidgetRegistry.use(performanceMiddleware)