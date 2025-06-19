/**
 * Aula Types
 * Generated automatically by CRUD generator
 */

import { BaseEntity, PaginatedResponse, ApiError } from '@/types'


// Enum types for Classroom
export enum ClassroomStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE'
}






export enum ClassroomType {
  LABORATORIO = 'LABORATORIO',
  AULA_TEORICA = 'AULA_TEORICA',
  TALLER = 'TALLER',
  AUDITORIO = 'AUDITORIO'
}





// Main entity interface
export interface Classroom extends BaseEntity {
  readonly id: string
  code: string
  name: string
  capacity: number
  building: string
  floor: number
  equipment?: string[]
  type: ClassroomType
  status: ClassroomStatus
  readonly createdAt: string
  readonly updatedAt: string
}

// DTO interfaces for API operations
export interface CreateClassroomDTO {
  code: string
  name: string
  capacity: number
  building: string
  floor: number
  equipment?: string[]
  type: ClassroomType
  status: ClassroomStatus
}

export interface UpdateClassroomDTO {
  code?: string
  name?: string
  capacity?: number
  building?: string
  floor?: number
  equipment?: string[]
  type?: ClassroomType
  status?: ClassroomStatus
}

// Query interfaces
export interface ClassroomListQuery {
  page?: number
  limit?: number
  search?: string
  status?: ClassroomStatus
  sortBy?: keyof Classroom
  sortOrder?: 'asc' | 'desc'
}

// Response interfaces
export interface ClassroomListResponse extends PaginatedResponse<Classroom> {
  // Add helper properties for backward compatibility
  readonly items?: Classroom[]
  readonly total?: number
}

export interface ClassroomResponse {
  data: Classroom
  message?: string
}

export interface ClassroomError extends ApiError {
  field?: keyof Classroom
}
