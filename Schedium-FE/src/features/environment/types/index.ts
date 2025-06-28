/**
 * Tipos para el módulo de Ambientes (Environments)
 */

export interface Environment {
  // Estructura del backend (classroom)
  classroom_id: number
  room_number: string
  classroom_type: string
  capacity: number
  campus_id: number
  campus?: {
    campus_id: number
    address: string
    phone_number?: string
    email?: string
    created_at: string
    updated_at: string
  }
  created_at: string
  updated_at: string
}

export interface EnvironmentCreate {
  name: string
  code: string
  type: EnvironmentType
  capacity: number
  campus_id: number
  floor?: string
  building?: string
  description?: string
  equipment?: string[]
  active?: boolean
  available_for_scheduling?: boolean
}

export interface EnvironmentUpdate extends Partial<EnvironmentCreate> {}

export type EnvironmentType = 
  | 'classroom'        // Aula
  | 'laboratory'       // Laboratorio
  | 'workshop'         // Taller
  | 'auditorium'       // Auditorio
  | 'library'          // Biblioteca
  | 'computer_room'    // Sala de cómputo
  | 'conference_room'  // Sala de conferencias
  | 'office'           // Oficina
  | 'storage'          // Bodega
  | 'other'            // Otro

export interface EnvironmentFilters {
  search?: string
  campus_id?: number
  type?: EnvironmentType
  active?: boolean
  available_for_scheduling?: boolean
  min_capacity?: number
  max_capacity?: number
  equipment?: string[]
}

export interface EnvironmentStats {
  total_environments: number
  active_environments: number
  inactive_environments: number
  available_for_scheduling: number
  environments_by_type: Record<EnvironmentType, number>
  environments_by_campus: Record<string, number>
  average_capacity: number
  total_capacity: number
}

export interface EnvironmentListParams {
  page?: number
  page_size?: number
  search?: string
  campus_id?: number
  type?: EnvironmentType
  active?: boolean
  available_for_scheduling?: boolean
  min_capacity?: number
  max_capacity?: number
  sort_by?: 'name' | 'code' | 'type' | 'capacity' | 'created_at'
  sort_order?: 'asc' | 'desc'
}

export const ENVIRONMENT_TYPE_LABELS: Record<EnvironmentType, string> = {
  classroom: 'Aula',
  laboratory: 'Laboratorio',
  workshop: 'Taller',
  auditorium: 'Auditorio',
  library: 'Biblioteca',
  computer_room: 'Sala de Cómputo',
  conference_room: 'Sala de Conferencias',
  office: 'Oficina',
  storage: 'Bodega',
  other: 'Otro'
}

export const ENVIRONMENT_TYPE_COLORS: Record<EnvironmentType, string> = {
  classroom: 'bg-blue-100 text-blue-800',
  laboratory: 'bg-green-100 text-green-800',
  workshop: 'bg-orange-100 text-orange-800',
  auditorium: 'bg-purple-100 text-purple-800',
  library: 'bg-indigo-100 text-indigo-800',
  computer_room: 'bg-cyan-100 text-cyan-800',
  conference_room: 'bg-pink-100 text-pink-800',
  office: 'bg-gray-100 text-gray-800',
  storage: 'bg-yellow-100 text-yellow-800',
  other: 'bg-slate-100 text-slate-800'
}