/**
 * Estudiante Types
 * Generated automatically by CRUD generator
 */

import { BaseEntity, PaginatedResponse, ApiError } from '@/types'


// Enum types for Student
export enum DocumentType {
  CC = 'CC',
  TI = 'TI',
  CE = 'CE',
  PEP = 'PEP',
  NIT = 'NIT'
}

export enum StudentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED'
}










// Main entity interface
export interface Student extends BaseEntity {
  readonly id: string
  documentType: DocumentType
  documentNumber: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  program: string
  semester: number
  status: StudentStatus
  enrollmentDate: string
  readonly createdAt: string
  readonly updatedAt: string
}

// DTO interfaces for API operations
export interface CreateStudentDTO {
  documentType: DocumentType
  documentNumber: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  program: string
  semester: number
  status: StudentStatus
  enrollmentDate: string
}

export interface UpdateStudentDTO {
  documentType?: DocumentType
  documentNumber?: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  program?: string
  semester?: number
  status?: StudentStatus
  enrollmentDate?: string
}

// Query interfaces
export interface StudentListQuery {
  page?: number
  limit?: number
  search?: string
  status?: StudentStatus
  sortBy?: keyof Student
  sortOrder?: 'asc' | 'desc'
}

// Response interfaces
export interface StudentListResponse extends PaginatedResponse<Student> {}

export interface StudentResponse {
  data: Student
  message?: string
}

export interface StudentError extends ApiError {
  field?: keyof Student
}
