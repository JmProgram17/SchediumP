/**
 * Tipos para el módulo de Sedes (Campus)
 */

export interface Campus {
  campus_id: number
  name: string
  address: string
  phone_number?: string
  email?: string
  created_at: string
  updated_at: string
  environments_count?: number
}

export interface CampusCreate {
  name: string
  address: string
  phone_number?: string
  email?: string
}

export interface CampusUpdate extends Partial<CampusCreate> {}

export interface CampusFilters {
  search?: string
}

export interface CampusStats {
  total_campus: number
  active_campus: number
  inactive_campus: number
  total_environments: number
  campus_by_city: Record<string, number>
  campus_by_state: Record<string, number>
}

export interface CampusListParams {
  page?: number
  page_size?: number
  search?: string
  sort_by?: 'name' | 'created_at'
  sort_order?: 'asc' | 'desc'
}