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




export enum ProgramModality {
  PRESENCIAL = 'PRESENCIAL',
  VIRTUAL = 'VIRTUAL',
  MIXTA = 'MIXTA'
}

export enum ProgramLevel {
  TECNICO = 'TECNICO',
  TECNOLOGO = 'TECNOLOGO',
  ESPECIALIZACION = 'ESPECIALIZACION'
}







// Main entity interface
export interface Program extends BaseEntity {
  readonly id: string
  code: string
  name: string
  description?: string
  duration: number
  modality: ProgramModality
  level: ProgramLevel
  department: string
  status: ProgramStatus
  readonly createdAt: string
  readonly updatedAt: string
}

// DTO interfaces for API operations
export interface CreateProgramDTO {
  code: string
  name: string
  description?: string
  duration: number
  modality: ProgramModality
  level: ProgramLevel
  department: string
  status: ProgramStatus
}

export interface UpdateProgramDTO {
  code?: string
  name?: string
  description?: string
  duration?: number
  modality?: ProgramModality
  level?: ProgramLevel
  department?: string
  status?: ProgramStatus
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
