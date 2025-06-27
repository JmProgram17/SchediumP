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
  classroom_id: number
  room_number: string
  capacity: number
  campus_id: number
  classroom_type: string
  campus?: {
    campus_id: number
    address: string
    phone_number?: string
    email?: string
  }
  readonly created_at: string
  readonly updated_at: string
}

// DTO interfaces for API operations
export interface CreateClassroomDTO {
  room_number: string
  capacity: number
  campus_id: number
  classroom_type?: string
}

export interface UpdateClassroomDTO {
  room_number?: string
  capacity?: number
  campus_id?: number
  classroom_type?: string
}

// Query interfaces
export interface ClassroomListQuery {
  page?: number
  limit?: number
  search?: string
  campus_id?: number
  classroom_type?: string
  min_capacity?: number
  max_capacity?: number
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
