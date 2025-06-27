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
  instructor_id: number
  first_name: string
  last_name: string
  email: string
  phone_number?: string
  hour_count: number
  contract_id?: number
  department_id?: number
  active: boolean
  full_name?: string  // Optional since backend computed property
  contract?: {
    contract_id: number
    contract_type: string
    hour_limit?: number
  }
  department?: {
    department_id: number
    name: string
    phone_number?: string
    email?: string
  }
  readonly created_at: string
  readonly updated_at: string
}

// DTO interfaces for API operations
export interface CreateInstructorDTO {
  first_name: string
  last_name: string
  email: string
  phone_number?: string
  contract_id: number  // Now required
  department_id: number  // Now required
  active?: boolean
}

export interface UpdateInstructorDTO {
  first_name?: string
  last_name?: string
  email?: string
  phone_number?: string
  contract_id?: number  // Optional for updates
  department_id?: number  // Optional for updates
  active?: boolean
}

// Query interfaces
export interface InstructorListQuery {
  page?: number
  limit?: number
  search?: string
  department_id?: number
  contract_id?: number
  active?: boolean
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
