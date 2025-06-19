export type ID = string | number

export interface BaseEntity {
  id: ID
  createdAt: string
  updatedAt: string
}

export interface SelectOption<T = string> {
  value: T
  label: string
  disabled?: boolean
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

export interface ErrorState {
  message: string
  code?: string
  details?: Record<string, unknown>
}

export type SortDirection = 'asc' | 'desc'

export interface SortConfig {
  field: string
  direction: SortDirection
}

export interface FilterConfig {
  field: string
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in'
  value: unknown
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}