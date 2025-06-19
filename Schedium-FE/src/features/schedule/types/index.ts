/**
 * Horario Types
 * Generated automatically by CRUD generator
 */

import { BaseEntity, PaginatedResponse, ApiError } from '@/types'


// Enum types for Schedule
export enum DocumentType {
  CC = 'CC',
  TI = 'TI',
  CE = 'CE',
  PEP = 'PEP',
  NIT = 'NIT'
}

export enum ScheduleStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED'
}








export enum DayOfWeek {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY'
}



// Main entity interface
export interface Schedule extends BaseEntity {
  readonly id: string
  courseId: string
  instructorId: string
  classroomId: string
  dayOfWeek: DayOfWeek
  startTime: string
  endTime: string
  startDate: string
  endDate: string
  group: string
  capacity: number
  readonly enrolled: number
  status: ScheduleStatus
  readonly createdAt: string
  readonly updatedAt: string
}

// DTO interfaces for API operations
export interface CreateScheduleDTO {
  courseId: string
  instructorId: string
  classroomId: string
  dayOfWeek: DayOfWeek
  startTime: string
  endTime: string
  startDate: string
  endDate: string
  group: string
  capacity: number
  status: ScheduleStatus
}

export interface UpdateScheduleDTO {
  courseId?: string
  instructorId?: string
  classroomId?: string
  dayOfWeek?: DayOfWeek
  startTime?: string
  endTime?: string
  startDate?: string
  endDate?: string
  group?: string
  capacity?: number
  status?: ScheduleStatus
}

// Query interfaces
export interface ScheduleListQuery {
  page?: number
  limit?: number
  search?: string
  status?: ScheduleStatus
  sortBy?: keyof Schedule
  sortOrder?: 'asc' | 'desc'
}

// Response interfaces
export interface ScheduleListResponse extends PaginatedResponse<Schedule> {}

export interface ScheduleResponse {
  data: Schedule
  message?: string
}

export interface ScheduleError extends ApiError {
  field?: keyof Schedule
}
