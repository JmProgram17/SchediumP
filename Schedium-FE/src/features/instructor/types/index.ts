/**
 * Instructor Types
 * Generated automatically by CRUD generator
 */

import { BaseEntity, PaginatedResponse, ApiError } from '@/types'


// Enum types for Instructor
export enum DocumentType {
  CC = 'CC',
  TI = 'TI',
  CE = 'CE',
  PEP = 'PEP',
  NIT = 'NIT'
}

export enum InstructorStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED'
}


export enum ContractType {
  PLANTA = 'PLANTA',
  CONTRATO = 'CONTRATO',
  CATEDRA = 'CATEDRA'
}









// Main entity interface
export interface Instructor extends BaseEntity {
  readonly id: string
  documentType: DocumentType
  documentNumber: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  specialization: string
  department: string
  contractType: ContractType
  status: InstructorStatus
  hireDate: string
  readonly createdAt: string
  readonly updatedAt: string
}

// DTO interfaces for API operations
export interface CreateInstructorDTO {
  documentType: DocumentType
  documentNumber: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  specialization: string
  department: string
  contractType: ContractType
  status: InstructorStatus
  hireDate: string
}

export interface UpdateInstructorDTO {
  documentType?: DocumentType
  documentNumber?: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  specialization?: string
  department?: string
  contractType?: ContractType
  status?: InstructorStatus
  hireDate?: string
}

// Query interfaces
export interface InstructorListQuery {
  page?: number
  limit?: number
  search?: string
  status?: InstructorStatus
  sortBy?: keyof Instructor
  sortOrder?: 'asc' | 'desc'
}

// Response interfaces
export interface InstructorListResponse extends PaginatedResponse<Instructor> {}

export interface InstructorResponse {
  data: Instructor
  message?: string
}

export interface InstructorError extends ApiError {
  field?: keyof Instructor
}
