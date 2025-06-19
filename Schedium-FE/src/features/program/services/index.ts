/**
 * Program Service - API integration with React Query
 * Implements all CRUD operations with caching, optimistic updates and error handling
 */

import { BaseApiService } from '@/services/api/base.service'
import { axiosClient } from '@/services/api/axios-client'
import { 
  Program, 
  CreateProgramDTO, 
  UpdateProgramDTO, 
  ProgramListQuery,
  ProgramListResponse,
  ProgramResponse 
} from '../types'

export class ProgramService extends BaseApiService {
  protected baseUrl = '/api/v1'
  private readonly endpoint = '/academic/programs'

  /**
   * Get paginated list of programs
   */
  async getPrograms(query: ProgramListQuery = {}): Promise<ProgramListResponse> {
    const params = new URLSearchParams()
    
    if (query.page) params.append('page', query.page.toString())
    if (query.limit) params.append('limit', query.limit.toString())
    if (query.search) params.append('search', query.search)
    if (query.status) params.append('status', query.status)
    if (query.sortBy) params.append('sort_by', query.sortBy)
    if (query.sortOrder) params.append('sort_order', query.sortOrder)

    const queryString = params.toString()
    const url = queryString ? `${this.endpoint}?${queryString}` : this.endpoint

    const response = await this.get<ProgramListResponse>(url)
    return response.data!
  }

  /**
   * Get program by ID
   */
  async getProgram(id: string): Promise<Program> {
    const response = await this.get<ProgramResponse>(`${this.endpoint}/${id}`)
    return response.data!.data
  }

  /**
   * Create new program
   */
  async createProgram(data: CreateProgramDTO): Promise<Program> {
    const sanitizedData = this.sanitizeProgramData(data)
    const response = await this.post<ProgramResponse>(this.endpoint, sanitizedData)
    return response.data!.data
  }

  /**
   * Update existing program
   */
  async updateProgram(id: string, data: UpdateProgramDTO): Promise<Program> {
    const sanitizedData = this.sanitizeProgramData(data)
    const response = await this.put<ProgramResponse>(`${this.endpoint}/${id}`, sanitizedData)
    return response.data!.data
  }

  /**
   * Delete program (soft delete)
   */
  async deleteProgram(id: string): Promise<void> {
    await this.delete(`${this.endpoint}/${id}`)
  }

  /**
   * Bulk operations
   */
  async bulkDeletePrograms(ids: string[]): Promise<{ message: string; deletedCount: number }> {
    const response = await this.post<{ message: string; deletedCount: number }>(`${this.endpoint}/bulk-delete`, { ids })
    return response.data!
  }

  async bulkUpdatePrograms(updates: Array<{ id: string; data: UpdateProgramDTO }>): Promise<{ message: string; updatedCount: number }> {
    const response = await this.post<{ message: string; updatedCount: number }>(`${this.endpoint}/bulk-update`, { updates })
    return response.data!
  }

  /**
   * Export programs data
   */
  async exportPrograms(query: ProgramListQuery = {}, format: 'csv' | 'xlsx' = 'csv'): Promise<Blob> {
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
  private sanitizeProgramData(data: CreateProgramDTO | UpdateProgramDTO): CreateProgramDTO | UpdateProgramDTO {
    const sanitized = { ...data }

    if (sanitized.name) {
      sanitized.name = sanitized.name.trim().replace(/[<>]/g, '')
    }
    if (sanitized.code) {
      sanitized.code = sanitized.code.trim().toUpperCase().replace(/[<>]/g, '')
    }
    if (sanitized.description) {
      sanitized.description = sanitized.description.trim().replace(/[<>]/g, '')
    }
    if (sanitized.department) {
      sanitized.department = sanitized.department.trim().replace(/[<>]/g, '')
    }
    if (sanitized.duration) {
      sanitized.duration = Math.max(1, Math.floor(sanitized.duration))
    }

    return sanitized
  }
}

// Create singleton instance
export const programService = new ProgramService()
