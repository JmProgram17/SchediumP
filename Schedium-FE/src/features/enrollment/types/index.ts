/**
 * Matrícula Types
 * Generated automatically by CRUD generator
 */

import { BaseEntity, PaginatedResponse, ApiError } from '@/types'


// Enum types for Enrollment
export enum DocumentType {
  CC = 'CC',
  TI = 'TI',
  CE = 'CE',
  PEP = 'PEP',
  NIT = 'NIT'
}

export enum EnrollmentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED'
}










// Main entity interface
export interface Enrollment extends BaseEntity {
  readonly id: string
  studentId: string
  scheduleId: string
  enrollmentDate: string
  status: EnrollmentStatus
  grade?: number
  attendance?: number
  readonly createdAt: string
  readonly updatedAt: string
}

// DTO interfaces for API operations
export interface CreateEnrollmentDTO {
  studentId: string
  scheduleId: string
  enrollmentDate: string
  status: EnrollmentStatus
  grade?: number
  attendance?: number
}

export interface UpdateEnrollmentDTO {
  studentId?: string
  scheduleId?: string
  enrollmentDate?: string
  status?: EnrollmentStatus
  grade?: number
  attendance?: number
}

// Query interfaces
export interface EnrollmentListQuery {
  page?: number
  limit?: number
  search?: string
  status?: EnrollmentStatus
  sortBy?: keyof Enrollment
  sortOrder?: 'asc' | 'desc'
}

// Response interfaces
export interface EnrollmentListResponse extends PaginatedResponse<Enrollment> {}

export interface EnrollmentResponse {
  data: Enrollment
  message?: string
}

export interface EnrollmentError extends ApiError {
  field?: keyof Enrollment
}
