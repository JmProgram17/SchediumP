/**
 * Horario Service
 * Generated automatically by CRUD generator
 */

import { BaseApiService } from '@/services/api/base.service'
import type {
  Schedule,
  CreateScheduleDTO,
  UpdateScheduleDTO,
  ScheduleListQuery,
  ScheduleListResponse,
  ScheduleResponse
} from '../types'

export class ScheduleService extends BaseApiService {
  protected baseUrl = ''
  private readonly basePath = '/api/schedules'

  /**
   * Get paginated list of Horarios
   */
  async getList(query: ScheduleListQuery = {}): Promise<ScheduleListResponse> {
    const response = await this.get<ScheduleListResponse>(this.basePath, {
      params: query
    })
    return response.data!
  }

  /**
   * Get single Horario by ID
   */
  async getById(id: string): Promise<Schedule> {
    const response = await this.get<ScheduleResponse>(`${this.basePath}/${id}`)
    return response.data!.data
  }

  /**
   * Create new Horario
   */
  async create(data: CreateScheduleDTO): Promise<Schedule> {
    const response = await this.post<ScheduleResponse>(this.basePath, data)
    return response.data!.data
  }

  /**
   * Update existing Horario
   */
  async update(id: string, data: UpdateScheduleDTO): Promise<Schedule> {
    const response = await this.put<ScheduleResponse>(`${this.basePath}/${id}`, data)
    return response.data!.data
  }

  /**
   * Delete Horario
   */
  async deleteItem(id: string): Promise<void> {
    await this.delete(`${this.basePath}/${id}`)
  }
}

// Create singleton instance
export const scheduleService = new ScheduleService()
