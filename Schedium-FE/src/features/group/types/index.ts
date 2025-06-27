/**
 * Types and interfaces for Student Groups (Fichas)
 */

export interface StudentGroup {
  group_id: number
  group_number: number
  program_id: number
  start_date: string
  end_date: string
  schedule_id: number
  active: boolean
  created_at: string
  updated_at: string
  program?: Program
  schedule?: ScheduleInfo
}

export interface Program {
  program_id: number
  name: string
  nomenclature_id?: number
  chain_id?: number
  department_id?: number
  level_id?: number
  active: boolean
  created_at: string
  updated_at: string
  nomenclature?: Nomenclature
  chain?: Chain
  department?: Department
  level?: Level
}

export interface Nomenclature {
  nomenclature_id: number
  code: string
  created_at: string
  updated_at: string
}

export interface Chain {
  chain_id: number
  name: string
  created_at: string
  updated_at: string
}

export interface Department {
  department_id: number
  name: string
  coordinator_id?: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface Level {
  level_id: number
  study_type: string
  duration?: number
  created_at: string
  updated_at: string
}

export interface ScheduleInfo {
  schedule_id: number
  name: string
  start_time: string
  end_time: string
}

export interface StudentGroupCreate {
  group_number: number
  program_id: number
  start_date: string
  end_date: string
  schedule_id: number
  active?: boolean
}

export interface StudentGroupUpdate {
  group_number?: number
  program_id?: number
  start_date?: string
  end_date?: string
  schedule_id?: number
  active?: boolean
}

export interface StudentGroupFilters {
  search?: string
  program_id?: number
  schedule_id?: number
  active?: boolean
  start_date_from?: string
  start_date_to?: string
}

export interface StudentGroupQuery extends StudentGroupFilters {
  page?: number
  limit?: number
  sortBy?: keyof StudentGroup
  sortOrder?: 'asc' | 'desc'
}

export interface StudentGroupResponse {
  items: StudentGroup[]
  total: number
  page: number
  pages: number
  limit: number
}

export interface StudentGroupExportQuery extends StudentGroupQuery {
  format: 'csv' | 'xlsx'
}