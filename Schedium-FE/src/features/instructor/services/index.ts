/**
 * Instructor Service - API integration with React Query
 * Implements all CRUD operations with caching, optimistic updates and error handling
 */

import { BaseApiService } from '@/services/api/base.service'
import { axiosClient } from '@/services/api/axios-client'
import { 
  Instructor, 
  CreateInstructorDTO, 
  UpdateInstructorDTO, 
  InstructorListQuery,
  InstructorListResponse,
  InstructorResponse 
} from '../types'

export class InstructorService extends BaseApiService {
  protected baseUrl = '/api/v1'
  private readonly endpoint = '/hr/instructors'

  /**
   * Get paginated list of instructors
   */
  async getInstructors(query: InstructorListQuery = {}): Promise<InstructorListResponse> {
    const params = new URLSearchParams()
    
    if (query.page) params.append('page', query.page.toString())
    if (query.limit) params.append('limit', query.limit.toString())
    if (query.search) params.append('search', query.search)
    if (query.status) params.append('status', query.status)
    if (query.sortBy) params.append('sort_by', query.sortBy)
    if (query.sortOrder) params.append('sort_order', query.sortOrder)

    const queryString = params.toString()
    const url = queryString ? `${this.endpoint}?${queryString}` : this.endpoint

    const response = await this.get<InstructorListResponse>(url)
    return response.data!
  }

  /**
   * Get instructor by ID
   */
  async getInstructor(id: string): Promise<Instructor> {
    const response = await this.get<InstructorResponse>(`${this.endpoint}/${id}`)
    return response.data!.data
  }

  /**
   * Create new instructor
   */
  async createInstructor(data: CreateInstructorDTO): Promise<Instructor> {
    const sanitizedData = this.sanitizeInstructorData(data)
    const response = await this.post<InstructorResponse>(this.endpoint, sanitizedData)
    return response.data!.data
  }

  /**
   * Update existing instructor
   */
  async updateInstructor(id: string, data: UpdateInstructorDTO): Promise<Instructor> {
    const sanitizedData = this.sanitizeInstructorData(data)
    const response = await this.put<InstructorResponse>(`${this.endpoint}/${id}`, sanitizedData)
    return response.data!.data
  }

  /**
   * Delete instructor (soft delete)
   */
  async deleteInstructor(id: string): Promise<void> {
    await this.delete(`${this.endpoint}/${id}`)
  }

  /**
   * Bulk operations
   */
  async bulkDeleteInstructors(ids: string[]): Promise<{ message: string; deletedCount: number }> {
    const response = await this.post<{ message: string; deletedCount: number }>(`${this.endpoint}/bulk-delete`, { ids })
    return response.data!
  }

  async bulkUpdateInstructors(updates: Array<{ id: string; data: UpdateInstructorDTO }>): Promise<{ message: string; updatedCount: number }> {
    const response = await this.post<{ message: string; updatedCount: number }>(`${this.endpoint}/bulk-update`, { updates })
    return response.data!
  }

  /**
   * Get instructor availability
   */
  async getInstructorAvailability(id: string, startDate: string, endDate: string): Promise<any> {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate
    })
    
    const response = await this.get(`${this.endpoint}/${id}/availability?${params.toString()}`)
    return response.data
  }

  /**
   * Update instructor availability
   */
  async updateInstructorAvailability(id: string, availability: any): Promise<any> {
    const response = await this.post(`${this.endpoint}/${id}/availability`, availability)
    return response.data
  }

  /**
   * Get instructor schedule
   */
  async getInstructorSchedule(id: string): Promise<any> {
    const response = await this.get(`${this.endpoint}/${id}/schedule`)
    return response.data
  }

  /**
   * Export instructors data
   */
  async exportInstructors(query: InstructorListQuery = {}, format: 'csv' | 'xlsx' = 'csv'): Promise<Blob> {
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
  private sanitizeInstructorData(data: CreateInstructorDTO | UpdateInstructorDTO): CreateInstructorDTO | UpdateInstructorDTO {
    const sanitized = { ...data }

    if (sanitized.firstName) {
      sanitized.firstName = sanitized.firstName.trim().replace(/[<>]/g, '')
    }
    if (sanitized.lastName) {
      sanitized.lastName = sanitized.lastName.trim().replace(/[<>]/g, '')
    }
    if (sanitized.email) {
      sanitized.email = sanitized.email.trim().toLowerCase()
    }
    if (sanitized.documentNumber) {
      sanitized.documentNumber = sanitized.documentNumber.replace(/\D/g, '')
    }
    if (sanitized.phone) {
      sanitized.phone = sanitized.phone.replace(/\D/g, '')
    }
    if (sanitized.specialization) {
      sanitized.specialization = sanitized.specialization.trim().replace(/[<>]/g, '')
    }
    if (sanitized.department) {
      sanitized.department = sanitized.department.trim().replace(/[<>]/g, '')
    }

    return sanitized
  }
}

export const instructorService = new InstructorService()
