/**
 * Data adapters for transforming data between Backend and Frontend formats
 * Handles field naming conventions, data structures, and validation
 */

import { User, Role } from '@/types/auth.types'

/**
 * Base adapter interface
 */
export interface DataAdapter<BackendType, FrontendType> {
  toFrontend(backendData: BackendType): FrontendType
  toBackend(frontendData: FrontendType): BackendType
  validateBackend?(data: any): data is BackendType
  validateFrontend?(data: any): data is FrontendType
}

/**
 * Field mapping utilities
 */
export class FieldMapper {
  /**
   * Convert snake_case to camelCase
   */
  static snakeToCamel(obj: any): any {
    if (obj === null || obj === undefined || typeof obj !== 'object') {
      return obj
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.snakeToCamel(item))
    }

    const converted: any = {}
    for (const [key, value] of Object.entries(obj)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
      converted[camelKey] = this.snakeToCamel(value)
    }

    return converted
  }

  /**
   * Convert camelCase to snake_case
   */
  static camelToSnake(obj: any): any {
    if (obj === null || obj === undefined || typeof obj !== 'object') {
      return obj
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.camelToSnake(item))
    }

    const converted: any = {}
    for (const [key, value] of Object.entries(obj)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
      converted[snakeKey] = this.camelToSnake(value)
    }

    return converted
  }

  /**
   * Apply custom field mappings
   */
  static mapFields(obj: any, mappings: Record<string, string>): any {
    if (obj === null || obj === undefined || typeof obj !== 'object') {
      return obj
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.mapFields(item, mappings))
    }

    const mapped: any = {}
    for (const [key, value] of Object.entries(obj)) {
      const newKey = mappings[key] || key
      mapped[newKey] = typeof value === 'object' ? this.mapFields(value, mappings) : value
    }

    return mapped
  }
}

/**
 * Date utilities for backend/frontend conversion
 */
export class DateAdapter {
  /**
   * Convert backend datetime string to frontend Date object
   */
  static toFrontend(backendDate: string | null): Date | null {
    if (!backendDate) return null
    return new Date(backendDate)
  }

  /**
   * Convert frontend Date to backend datetime string
   */
  static toBackend(frontendDate: Date | null): string | null {
    if (!frontendDate) return null
    return frontendDate.toISOString()
  }

  /**
   * Format date for display
   */
  static formatForDisplay(date: Date | string | null, locale: string = 'es-CO'): string {
    if (!date) return ''
    
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  /**
   * Format datetime for display
   */
  static formatDateTimeForDisplay(date: Date | string | null, locale: string = 'es-CO'): string {
    if (!date) return ''
    
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
}

/**
 * Backend data interfaces (snake_case)
 */
interface BackendUser {
  user_id: number
  email: string
  first_name: string
  last_name: string
  document_number: string
  active: boolean
  created_at: string
  updated_at: string
  last_login?: string | null
  role?: BackendRole
  role_id?: number
}

interface BackendRole {
  role_id: number
  name: string
  description?: string
  created_at: string
  updated_at: string
}

/**
 * User adapter for converting between backend and frontend formats
 */
export class UserAdapter implements DataAdapter<BackendUser, User> {
  toFrontend(backendUser: BackendUser): User {
    return {
      user_id: backendUser.user_id,
      email: backendUser.email,
      first_name: backendUser.first_name,
      last_name: backendUser.last_name,
      document_number: backendUser.document_number,
      active: backendUser.active,
      created_at: backendUser.created_at,
      updated_at: backendUser.updated_at,
      last_login: backendUser.last_login || undefined,
      role: backendUser.role ? this.convertRole(backendUser.role) : undefined,
      role_id: backendUser.role_id,
    }
  }

  toBackend(frontendUser: User): BackendUser {
    return {
      user_id: frontendUser.user_id,
      email: frontendUser.email,
      first_name: frontendUser.first_name,
      last_name: frontendUser.last_name,
      document_number: frontendUser.document_number,
      active: frontendUser.active,
      created_at: frontendUser.created_at,
      updated_at: frontendUser.updated_at,
      last_login: frontendUser.last_login || null,
      role: frontendUser.role ? this.convertRoleToBackend(frontendUser.role) : undefined,
      role_id: frontendUser.role_id,
    }
  }

  private convertRole(backendRole: BackendRole): Role {
    return {
      role_id: backendRole.role_id,
      name: backendRole.name,
      description: backendRole.description,
    }
  }

  private convertRoleToBackend(frontendRole: Role): BackendRole {
    return {
      role_id: frontendRole.role_id,
      name: frontendRole.name,
      description: frontendRole.description || undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }

  validateBackend(data: any): data is BackendUser {
    return (
      typeof data === 'object' &&
      data !== null &&
      typeof data.user_id === 'number' &&
      typeof data.email === 'string' &&
      typeof data.first_name === 'string' &&
      typeof data.last_name === 'string' &&
      typeof data.document_number === 'string' &&
      typeof data.active === 'boolean' &&
      typeof data.created_at === 'string' &&
      typeof data.updated_at === 'string'
    )
  }

  validateFrontend(data: any): data is User {
    return (
      typeof data === 'object' &&
      data !== null &&
      typeof data.user_id === 'number' &&
      typeof data.email === 'string' &&
      typeof data.first_name === 'string' &&
      typeof data.last_name === 'string' &&
      typeof data.document_number === 'string' &&
      typeof data.active === 'boolean' &&
      typeof data.created_at === 'string' &&
      typeof data.updated_at === 'string'
    )
  }
}

/**
 * Pagination adapter for handling paginated responses
 */
interface BackendPagination {
  total: number
  page: number
  page_size: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

interface FrontendPagination {
  total: number
  page: number
  pageSize: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export class PaginationAdapter implements DataAdapter<BackendPagination, FrontendPagination> {
  toFrontend(backendPagination: BackendPagination): FrontendPagination {
    return {
      total: backendPagination.total,
      page: backendPagination.page,
      pageSize: backendPagination.page_size,
      totalPages: backendPagination.total_pages,
      hasNext: backendPagination.has_next,
      hasPrev: backendPagination.has_prev,
    }
  }

  toBackend(frontendPagination: FrontendPagination): BackendPagination {
    return {
      total: frontendPagination.total,
      page: frontendPagination.page,
      page_size: frontendPagination.pageSize,
      total_pages: frontendPagination.totalPages,
      has_next: frontendPagination.hasNext,
      has_prev: frontendPagination.hasPrev,
    }
  }
}

/**
 * Generic list response adapter
 */
interface BackendListResponse<T> {
  success: boolean
  message: string
  data: T[]
  pagination: BackendPagination
  meta: {
    timestamp: string
    version: string
    request_id?: string
  }
}

interface FrontendListResponse<T> {
  success: boolean
  message: string
  data: T[]
  pagination: FrontendPagination
  meta: {
    timestamp: string
    version: string
    requestId?: string
  }
}

export class ListResponseAdapter<BackendItem, FrontendItem> {
  constructor(
    private itemAdapter: DataAdapter<BackendItem, FrontendItem>,
    private paginationAdapter = new PaginationAdapter()
  ) {}

  toFrontend(backendResponse: BackendListResponse<BackendItem>): FrontendListResponse<FrontendItem> {
    return {
      success: backendResponse.success,
      message: backendResponse.message,
      data: backendResponse.data.map(item => this.itemAdapter.toFrontend(item)),
      pagination: this.paginationAdapter.toFrontend(backendResponse.pagination),
      meta: {
        timestamp: backendResponse.meta.timestamp,
        version: backendResponse.meta.version,
        requestId: backendResponse.meta.request_id,
      }
    }
  }

  toBackend(frontendResponse: FrontendListResponse<FrontendItem>): BackendListResponse<BackendItem> {
    return {
      success: frontendResponse.success,
      message: frontendResponse.message,
      data: frontendResponse.data.map(item => this.itemAdapter.toBackend(item)),
      pagination: this.paginationAdapter.toBackend(frontendResponse.pagination),
      meta: {
        timestamp: frontendResponse.meta.timestamp,
        version: frontendResponse.meta.version,
        request_id: frontendResponse.meta.requestId,
      }
    }
  }
}

/**
 * Error response adapter
 */
interface BackendErrorResponse {
  success: false
  error_code: string
  message: string
  details?: any
  meta: {
    timestamp: string
    version: string
    request_id?: string
  }
}

interface FrontendErrorResponse {
  success: false
  errorCode: string
  message: string
  details?: any
  meta: {
    timestamp: string
    version: string
    requestId?: string
  }
}

export class ErrorResponseAdapter implements DataAdapter<BackendErrorResponse, FrontendErrorResponse> {
  toFrontend(backendError: BackendErrorResponse): FrontendErrorResponse {
    return {
      success: false,
      errorCode: backendError.error_code,
      message: backendError.message,
      details: backendError.details,
      meta: {
        timestamp: backendError.meta.timestamp,
        version: backendError.meta.version,
        requestId: backendError.meta.request_id,
      }
    }
  }

  toBackend(frontendError: FrontendErrorResponse): BackendErrorResponse {
    return {
      success: false,
      error_code: frontendError.errorCode,
      message: frontendError.message,
      details: frontendError.details,
      meta: {
        timestamp: frontendError.meta.timestamp,
        version: frontendError.meta.version,
        request_id: frontendError.meta.requestId,
      }
    }
  }
}

/**
 * Query parameters adapter for search and filtering
 */
interface BackendQueryParams {
  page?: number
  page_size?: number
  search?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  filters?: Record<string, any>
}

interface FrontendQueryParams {
  page?: number
  pageSize?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filters?: Record<string, any>
}

export class QueryParamsAdapter implements DataAdapter<BackendQueryParams, FrontendQueryParams> {
  toFrontend(backendParams: BackendQueryParams): FrontendQueryParams {
    return {
      page: backendParams.page,
      pageSize: backendParams.page_size,
      search: backendParams.search,
      sortBy: backendParams.sort_by,
      sortOrder: backendParams.sort_order,
      filters: backendParams.filters,
    }
  }

  toBackend(frontendParams: FrontendQueryParams): BackendQueryParams {
    return {
      page: frontendParams.page,
      page_size: frontendParams.pageSize,
      search: frontendParams.search,
      sort_by: frontendParams.sortBy,
      sort_order: frontendParams.sortOrder,
      filters: frontendParams.filters,
    }
  }
}

/**
 * Form data adapter for handling form submissions
 */
export class FormDataAdapter {
  /**
   * Convert form data to backend format
   */
  static toBackend(formData: Record<string, any>): Record<string, any> {
    const converted = FieldMapper.camelToSnake(formData)
    
    // Handle special cases
    Object.keys(converted).forEach(key => {
      // Convert Date objects to ISO strings
      if (converted[key] instanceof Date) {
        converted[key] = converted[key].toISOString()
      }
      
      // Convert empty strings to null for optional fields
      if (converted[key] === '') {
        converted[key] = null
      }
      
      // Handle boolean string conversion
      if (typeof converted[key] === 'string') {
        if (converted[key].toLowerCase() === 'true') {
          converted[key] = true
        } else if (converted[key].toLowerCase() === 'false') {
          converted[key] = false
        }
      }
    })
    
    return converted
  }

  /**
   * Convert backend data to form format
   */
  static toFrontend(backendData: Record<string, any>): Record<string, any> {
    const converted = FieldMapper.snakeToCamel(backendData)
    
    // Handle special cases
    Object.keys(converted).forEach(key => {
      // Convert null to empty string for form inputs
      if (converted[key] === null) {
        converted[key] = ''
      }
      
      // Convert ISO strings to Date objects
      if (typeof converted[key] === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(converted[key])) {
        converted[key] = new Date(converted[key])
      }
    })
    
    return converted
  }
}

/**
 * Adapter registry for managing different adapters
 */
export class AdapterRegistry {
  private static adapters = new Map<string, DataAdapter<any, any>>()

  static register<B, F>(name: string, adapter: DataAdapter<B, F>): void {
    this.adapters.set(name, adapter)
  }

  static get<B, F>(name: string): DataAdapter<B, F> | undefined {
    return this.adapters.get(name)
  }

  static has(name: string): boolean {
    return this.adapters.has(name)
  }

  static remove(name: string): boolean {
    return this.adapters.delete(name)
  }

  static clear(): void {
    this.adapters.clear()
  }

  static list(): string[] {
    return Array.from(this.adapters.keys())
  }
}

// Register common adapters
AdapterRegistry.register('user', new UserAdapter())
AdapterRegistry.register('pagination', new PaginationAdapter())
AdapterRegistry.register('error', new ErrorResponseAdapter())
AdapterRegistry.register('queryParams', new QueryParamsAdapter())

// Export adapter instances
export const userAdapter = new UserAdapter()
export const paginationAdapter = new PaginationAdapter()
export const errorResponseAdapter = new ErrorResponseAdapter()
export const queryParamsAdapter = new QueryParamsAdapter()