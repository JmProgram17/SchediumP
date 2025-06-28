/**
 * Types and interfaces for Coordinations (Departments)
 */

import type { User } from '@/types/auth.types'

// Re-export User type for convenience
export type { User }

export interface Coordination {
  department_id: number
  name: string
  phone_number?: string
  email?: string
  coordinator_id?: number
  location?: string
  active?: boolean
  created_at: string
  updated_at: string
  coordinator?: User
  programs_count?: number
  instructors_count?: number
  student_groups_count?: number
  classrooms_count?: number
}

export interface CoordinationCreate {
  name: string
  phone_number?: string
  email?: string
  coordinator_id?: number
  location?: string
  active?: boolean
}

export interface CoordinationUpdate {
  name?: string
  phone_number?: string
  email?: string
  coordinator_id?: number
  location?: string
  active?: boolean
}

export interface CoordinationFilters {
  search?: string
  coordinator_id?: number
}

export interface CoordinationQuery extends CoordinationFilters {
  page?: number
  limit?: number
  sortBy?: keyof Coordination
  sortOrder?: 'asc' | 'desc'
}

export interface CoordinationResponse {
  items: Coordination[]
  total: number
  page: number
  pages: number
  limit: number
}

export interface CoordinationFormData {
  name: string
  phone_number?: string
  email?: string
  coordinator_id?: number | null
  location?: string
  active?: boolean
}