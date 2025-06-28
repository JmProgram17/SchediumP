/**
 * Types and interfaces for User Management
 */

import type { User, Role } from '@/types/auth.types'

// Re-export User and Role types for convenience
export type { User, Role }

export interface UserCreate {
  email: string
  first_name: string
  last_name: string
  document_number: string
  password: string
  confirm_password: string
  role_id: number
  active?: boolean
}

export interface UserUpdate {
  email?: string
  first_name?: string
  last_name?: string
  document_number?: string
  password?: string
  confirm_password?: string
  role_id?: number
  active?: boolean
}

export interface UserFilters {
  search?: string
  role_id?: number
  active?: boolean
}

export interface UserQuery extends UserFilters {
  page?: number
  limit?: number
  sortBy?: keyof User
  sortOrder?: 'asc' | 'desc'
}

export interface UserResponse {
  items: User[]
  total: number
  page: number
  pages: number
  limit: number
}

export interface UserFormData {
  email: string
  first_name: string
  last_name: string
  document_number: string
  password?: string
  confirm_password?: string
  role_id?: number | null
  active?: boolean
}

export interface UserStats {
  total_users: number
  active_users: number
  inactive_users: number
  users_by_role: Array<{
    role: Role
    count: number
  }>
  recent_logins: number
}

export interface PasswordChangeRequest {
  current_password: string
  new_password: string
  confirm_password: string
}

export interface BulkUserOperation {
  user_ids: number[]
  action: 'activate' | 'deactivate' | 'delete'
}

export interface BulkUserResult {
  affected_count: number
  success: boolean
  errors?: string[]
}

// Re-export auth strategy types
export * from './auth-strategy.types'