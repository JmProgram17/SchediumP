export interface ResponseMeta {
  request_id?: string
  timestamp: string
  version: string
}

export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
  meta: ResponseMeta
  errors?: Record<string, unknown>
}

export interface PaginationMeta {
  total: number
  page: number
  page_size: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

export interface PaginatedResponse<T> {
  success: boolean
  message: string
  data: T[]
  pagination: PaginationMeta
  meta: ResponseMeta
}

export interface ApiError {
  success: false
  error_code: string
  message: string
  details?: Record<string, unknown>
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

export interface RequestConfig {
  method: HttpMethod
  headers?: Record<string, string>
  params?: Record<string, unknown>
  data?: unknown
}