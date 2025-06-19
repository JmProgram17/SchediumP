/**
 * Curso Types
 * Generated automatically by CRUD generator
 */

import { BaseEntity, PaginatedResponse, ApiError } from '@/types'


// Enum types for Course
export enum DocumentType {
  CC = 'CC',
  TI = 'TI',
  CE = 'CE',
  PEP = 'PEP',
  NIT = 'NIT'
}

export enum CourseStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED'
}










// Main entity interface
export interface Course extends BaseEntity {
  readonly id: string
  code: string
  name: string
  description?: string
  credits: number
  hours: number
  semester: number
  programId: string
  prerequisites?: string[]
  status: CourseStatus
  readonly createdAt: string
  readonly updatedAt: string
}

// DTO interfaces for API operations
export interface CreateCourseDTO {
  code: string
  name: string
  description?: string
  credits: number
  hours: number
  semester: number
  programId: string
  prerequisites?: string[]
  status: CourseStatus
}

export interface UpdateCourseDTO {
  code?: string
  name?: string
  description?: string
  credits?: number
  hours?: number
  semester?: number
  programId?: string
  prerequisites?: string[]
  status?: CourseStatus
}

// Query interfaces
export interface CourseListQuery {
  page?: number
  limit?: number
  search?: string
  status?: CourseStatus
  sortBy?: keyof Course
  sortOrder?: 'asc' | 'desc'
}

// Response interfaces
export interface CourseListResponse extends PaginatedResponse<Course> {}

export interface CourseResponse {
  data: Course
  message?: string
}

export interface CourseError extends ApiError {
  field?: keyof Course
}
