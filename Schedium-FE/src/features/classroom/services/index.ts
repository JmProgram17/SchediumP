/**
 * Classroom Service - API integration with React Query
 * Implements all CRUD operations with caching, optimistic updates and error handling
 */

import { BaseApiService } from '@/services/api/base.service'
import { axiosClient } from '@/services/api/axios-client'
import { 
  Classroom, 
  CreateClassroomDTO, 
  UpdateClassroomDTO, 
  ClassroomListQuery,
  ClassroomListResponse,
  ClassroomResponse 
} from '../types'

export class ClassroomService extends BaseApiService {
  protected baseUrl = '/api/v1'
  private readonly endpoint = '/infrastructure/classrooms'

  /**
   * Get paginated list of classrooms
   */
  async getClassrooms(query: ClassroomListQuery = {}): Promise<ClassroomListResponse> {
    const params = new URLSearchParams()
    
    if (query.page) params.append('page', query.page.toString())
    if (query.limit) params.append('limit', query.limit.toString())
    if (query.search) params.append('search', query.search)
    if (query.status) params.append('status', query.status)
    if (query.sortBy) params.append('sort_by', query.sortBy)
    if (query.sortOrder) params.append('sort_order', query.sortOrder)

    const queryString = params.toString()
    const url = queryString ? `${this.endpoint}?${queryString}` : this.endpoint

    const response = await this.get<ClassroomListResponse>(url)
    return response.data!
  }

  /**
   * Get classroom by ID
   */
  async getClassroom(id: string): Promise<Classroom> {
    const response = await this.get<ClassroomResponse>(`${this.endpoint}/${id}`)
    return response.data!.data
  }

  /**
   * Create new classroom
   */
  async createClassroom(data: CreateClassroomDTO): Promise<Classroom> {
    const sanitizedData = this.sanitizeClassroomData(data)
    const response = await this.post<ClassroomResponse>(this.endpoint, sanitizedData)
    return response.data!.data
  }

  /**
   * Update existing classroom
   */
  async updateClassroom(id: string, data: UpdateClassroomDTO): Promise<Classroom> {
    const sanitizedData = this.sanitizeClassroomData(data)
    const response = await this.put<ClassroomResponse>(`${this.endpoint}/${id}`, sanitizedData)
    return response.data!.data
  }

  /**
   * Delete classroom (soft delete)
   */
  async deleteClassroom(id: string): Promise<void> {
    await this.delete(`${this.endpoint}/${id}`)
  }

  /**
   * Bulk operations
   */
  async bulkDeleteClassrooms(ids: string[]): Promise<{ message: string; deletedCount: number }> {
    const response = await this.post<{ message: string; deletedCount: number }>(`${this.endpoint}/bulk-delete`, { ids })
    return response.data!
  }

  async bulkUpdateClassrooms(updates: Array<{ id: string; data: UpdateClassroomDTO }>): Promise<{ message: string; updatedCount: number }> {
    const response = await this.post<{ message: string; updatedCount: number }>(`${this.endpoint}/bulk-update`, { updates })
    return response.data!
  }

  /**
   * Export classrooms data
   */
  async exportClassrooms(query: ClassroomListQuery = {}, format: 'csv' | 'xlsx' = 'csv'): Promise<Blob> {
    const params = new URLSearchParams()
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, value.toString())
    })
    params.append('format', format)

    const response = await axiosClient.get(`${this.endpoint}/export?${params.toString()}`, {
      responseType: 'blob'
    })
    
    return response.data
  }

  /**
   * Data validation and sanitization
   */
  private sanitizeClassroomData(data: CreateClassroomDTO | UpdateClassroomDTO): CreateClassroomDTO | UpdateClassroomDTO {
    const sanitized = { ...data }

    if (sanitized.name) {
      sanitized.name = sanitized.name.trim().replace(/[<>]/g, '')
    }
    if (sanitized.code) {
      sanitized.code = sanitized.code.trim().toUpperCase().replace(/[<>]/g, '')
    }
    if (sanitized.building) {
      sanitized.building = sanitized.building.trim().replace(/[<>]/g, '')
    }
    if (sanitized.capacity) {
      sanitized.capacity = Math.max(1, Math.floor(sanitized.capacity))
    }
    if (sanitized.floor) {
      sanitized.floor = Math.floor(sanitized.floor)
    }
    if (sanitized.equipment) {
      sanitized.equipment = sanitized.equipment.map(item => item.trim()).filter(item => item.length > 0)
    }

    return sanitized
  }
}

// Create singleton instance
export const classroomService = new ClassroomService()
