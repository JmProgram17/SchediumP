/**
 * Servicios para el módulo de Sedes (Campus)
 */

import { enhancedApiService } from '@/services/api/enhanced-api.service'
import type { 
  Campus, 
  CampusCreate, 
  CampusUpdate, 
  CampusListParams,
  CampusStats 
} from '../types'
import type { PaginatedResponse } from '@/types/api.types'

export class CampusService {
  private static readonly BASE_URL = '/infrastructure/campuses'

  /**
   * Obtener lista de sedes con paginación
   */
  static async getCampuses(params: CampusListParams = {}): Promise<PaginatedResponse<Campus>> {
    const { data } = await enhancedApiService.get(this.BASE_URL, { params })
    return data
  }

  /**
   * Obtener sede por ID
   */
  static async getCampus(id: number): Promise<Campus> {
    const { data } = await enhancedApiService.get(`${this.BASE_URL}/${id}`)
    return data
  }

  /**
   * Crear nueva sede
   */
  static async createCampus(campus: CampusCreate): Promise<Campus> {
    const { data } = await enhancedApiService.post(this.BASE_URL, campus)
    return data
  }

  /**
   * Actualizar sede
   */
  static async updateCampus(id: number, campus: CampusUpdate): Promise<Campus> {
    const { data } = await enhancedApiService.put(`${this.BASE_URL}/${id}`, campus)
    return data
  }

  /**
   * Eliminar sede
   */
  static async deleteCampus(id: number): Promise<void> {
    await enhancedApiService.delete(`${this.BASE_URL}/${id}`)
  }

  /**
   * Obtener estadísticas de sedes
   */
  static async getCampusStats(): Promise<CampusStats> {
    const { data } = await enhancedApiService.get(`${this.BASE_URL}/stats`)
    return data
  }

  /**
   * Obtener lista simple de sedes para dropdowns
   */
  static async getCampusOptions(): Promise<Array<{ value: number; label: string }>> {
    try {
      const response = await this.getCampuses({ page_size: 100 })
      return response.items.map(campus => ({
        value: campus.campus_id,
        label: campus.name
      }))
    } catch (error) {
      console.error('Error fetching campus options:', error)
      return []
    }
  }

  /**
   * Verificar si una sede puede ser eliminada
   */
  static async canDeleteCampus(id: number): Promise<{ canDelete: boolean; reason?: string }> {
    const { data } = await enhancedApiService.get(`${this.BASE_URL}/${id}/can-delete`)
    return data
  }
}

export const campusService = CampusService