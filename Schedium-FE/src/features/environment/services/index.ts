/**
 * Servicios para el módulo de Ambientes (Environments)
 */

import { enhancedApiService } from '@/services/api/enhanced-api.service'
import type { 
  Environment, 
  EnvironmentCreate, 
  EnvironmentUpdate, 
  EnvironmentListParams,
  EnvironmentStats,
  EnvironmentType
} from '../types'
import type { PaginatedResponse } from '@/types/api.types'

export class EnvironmentService {
  private static readonly BASE_URL = '/infrastructure/classrooms'

  /**
   * Obtener lista de ambientes con paginación
   */
  static async getEnvironments(params: EnvironmentListParams = {}): Promise<PaginatedResponse<Environment>> {
    const { data } = await enhancedApiService.get(this.BASE_URL, { params })
    return data
  }

  /**
   * Obtener ambiente por ID
   */
  static async getEnvironment(id: number): Promise<Environment> {
    const { data } = await enhancedApiService.get(`${this.BASE_URL}/${id}`)
    return data
  }

  /**
   * Crear nuevo ambiente
   */
  static async createEnvironment(environment: EnvironmentCreate): Promise<Environment> {
    const { data } = await enhancedApiService.post(this.BASE_URL, environment)
    return data
  }

  /**
   * Actualizar ambiente
   */
  static async updateEnvironment(id: number, environment: EnvironmentUpdate): Promise<Environment> {
    const { data } = await enhancedApiService.put(`${this.BASE_URL}/${id}`, environment)
    return data
  }

  /**
   * Eliminar ambiente
   */
  static async deleteEnvironment(id: number): Promise<void> {
    await enhancedApiService.delete(`${this.BASE_URL}/${id}`)
  }

  /**
   * Obtener estadísticas de ambientes
   */
  static async getEnvironmentStats(): Promise<EnvironmentStats> {
    const { data } = await enhancedApiService.get(`${this.BASE_URL}/stats`)
    return data
  }

  /**
   * Obtener lista simple de ambientes para dropdowns
   */
  static async getEnvironmentOptions(): Promise<Array<{ value: number; label: string }>> {
    try {
      const response = await this.getEnvironments({ page_size: 100, active: true })
      return response.items.map(environment => ({
        value: environment.classroom_id,
        label: `${environment.room_number} - ${environment.classroom_type}`
      }))
    } catch (error) {
      console.error('Error fetching environment options:', error)
      return []
    }
  }

  /**
   * Verificar disponibilidad de ambientes
   */
  static async checkAvailability(params: {
    campus_id?: number
    start_time?: string
    end_time?: string
    date?: string
  }): Promise<Environment[]> {
    const { data } = await enhancedApiService.get(`${this.BASE_URL}/availability`, { params })
    return data
  }

  /**
   * Verificar si un ambiente puede ser eliminado
   */
  static async canDeleteEnvironment(id: number): Promise<{ canDelete: boolean; reason?: string }> {
    const { data } = await enhancedApiService.get(`${this.BASE_URL}/${id}/can-delete`)
    return data
  }

  /**
   * Obtener ambientes disponibles para programación
   */
  static async getAvailableEnvironments(campusId?: number): Promise<Environment[]> {
    const params = campusId ? { campus_id: campusId, available_for_scheduling: true } : { available_for_scheduling: true }
    const response = await this.getEnvironments(params)
    return response.items
  }

  /**
   * Verificar si un código de ambiente está disponible
   */
  static async isCodeAvailable(code: string, excludeId?: number): Promise<boolean> {
    try {
      const response = await this.getEnvironments({ search: code })
      const environments = response.items.filter(env => 
        env.room_number.toLowerCase() === code.toLowerCase() && 
        (!excludeId || env.classroom_id !== excludeId)
      )
      return environments.length === 0
    } catch (error) {
      console.error('Error checking code availability:', error)
      return false
    }
  }
}

export const environmentService = EnvironmentService