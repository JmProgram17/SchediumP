/**
 * Tipos para el módulo de Sedes (Campus)
 */

export interface Campus {
  campus_id: number
  name: string
  address: string
  phone?: string
  email?: string
  city: string
  state: string
  postal_code?: string
  active: boolean
  created_at: string
  updated_at: string
  environments_count?: number
}

export interface CampusCreate {
  name: string
  address: string
  phone?: string
  email?: string
  city: string
  state: string
  postal_code?: string
  active?: boolean
}

export interface CampusUpdate extends Partial<CampusCreate> {}

export interface CampusFilters {
  search?: string
  city?: string
  state?: string
  active?: boolean
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
  city?: string
  state?: string
  active?: boolean
  sort_by?: 'name' | 'city' | 'created_at'
  sort_order?: 'asc' | 'desc'
}