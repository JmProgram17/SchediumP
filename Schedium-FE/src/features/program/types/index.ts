/**
 * Programa Académico Types
 * Generated automatically by CRUD generator
 */

import { BaseEntity, PaginatedResponse, ApiError } from '@/types'


// Enum types for Program
export enum ProgramStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED'
}

export enum ProgramLevel {
  TECNICO = 'TECNICO',
  TECNOLOGO = 'TECNOLOGO',
  ESPECIALIZACION = 'ESPECIALIZACION'
}







// Main entity interface
export interface Program extends BaseEntity {
  program_id: number
  name: string
  nomenclature_id?: number
  chain_id?: number
  department_id?: number
  level_id?: number
  active: boolean
  nomenclature?: {
    nomenclature_id: number
    code: string
  }
  chain?: {
    chain_id: number
    name: string
  }
  department?: {
    department_id: number
    name: string
    phone_number?: string
    email?: string
  }
  level?: {
    level_id: number
    study_type: string
    duration: number
  }
  readonly created_at: string
  readonly updated_at: string
}

// DTO interfaces for API operations
export interface CreateProgramDTO {
  name: string
  nomenclature_id?: number
  chain_id?: number
  department_id?: number
  level_id?: number
  active?: boolean
}

export interface UpdateProgramDTO {
  name?: string
  nomenclature_id?: number
  chain_id?: number
  department_id?: number
  level_id?: number
  active?: boolean
}

// Query interfaces
export interface ProgramListQuery {
  page?: number
  limit?: number
  search?: string
  status?: ProgramStatus
  sortBy?: keyof Program
  sortOrder?: 'asc' | 'desc'
}

// Response interfaces
export interface ProgramListResponse extends PaginatedResponse<Program> {}

export interface ProgramResponse {
  data: Program
  message?: string
}

export interface ProgramError extends ApiError {
  field?: keyof Program
}
