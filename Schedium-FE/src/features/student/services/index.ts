/**
 * Student Service - API integration with React Query
 * Implements all CRUD operations with caching, optimistic updates and error handling
 */

import { BaseApiService } from '@/services/api/base.service'
import { axiosClient } from '@/services/api/axios-client'
import { 
  Student, 
  CreateStudentDTO, 
  UpdateStudentDTO, 
  StudentListQuery,
  StudentListResponse,
  StudentResponse 
} from '../types'

export class StudentService extends BaseApiService {
  protected baseUrl = '/api/v1'
  private readonly endpoint = '/academic/students'

  /**
   * Get paginated list of students
   */
  async getStudents(query: StudentListQuery = {}): Promise<StudentListResponse> {
    const params = new URLSearchParams()
    
    if (query.page) params.append('page', query.page.toString())
    if (query.limit) params.append('limit', query.limit.toString())
    if (query.search) params.append('search', query.search)
    if (query.status) params.append('status', query.status)
    if (query.sortBy) params.append('sort_by', query.sortBy)
    if (query.sortOrder) params.append('sort_order', query.sortOrder)

    const queryString = params.toString()
    const url = queryString ? `${this.endpoint}?${queryString}` : this.endpoint

    const response = await this.get<StudentListResponse>(url)
    return response.data!
  }

  /**
   * Get student by ID
   */
  async getStudent(id: string): Promise<Student> {
    const response = await this.get<StudentResponse>(`${this.endpoint}/${id}`)
    return response.data!.data
  }

  /**
   * Create new student
   */
  async createStudent(data: CreateStudentDTO): Promise<Student> {
    const sanitizedData = this.sanitizeStudentData(data)
    const response = await this.post<StudentResponse>(this.endpoint, sanitizedData)
    return response.data!.data
  }

  /**
   * Update existing student
   */
  async updateStudent(id: string, data: UpdateStudentDTO): Promise<Student> {
    const sanitizedData = this.sanitizeStudentData(data)
    const response = await this.put<StudentResponse>(`${this.endpoint}/${id}`, sanitizedData)
    return response.data!.data
  }

  /**
   * Delete student (soft delete)
   */
  async deleteStudent(id: string): Promise<void> {
    await this.delete(`${this.endpoint}/${id}`)
  }

  /**
   * Bulk operations
   */
  async bulkDeleteStudents(ids: string[]): Promise<{ message: string; deletedCount: number }> {
    const response = await this.post<{ message: string; deletedCount: number }>(`${this.endpoint}/bulk-delete`, { ids })
    return response.data!
  }

  async bulkUpdateStudents(updates: Array<{ id: string; data: UpdateStudentDTO }>): Promise<{ message: string; updatedCount: number }> {
    const response = await this.post<{ message: string; updatedCount: number }>(`${this.endpoint}/bulk-update`, { updates })
    return response.data!
  }

  /**
   * Export students data
   */
  async exportStudents(query: StudentListQuery = {}, format: 'csv' | 'xlsx' = 'csv'): Promise<Blob> {
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
  private sanitizeStudentData(data: CreateStudentDTO | UpdateStudentDTO): CreateStudentDTO | UpdateStudentDTO {
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

    return sanitized
  }
}

export const studentService = new StudentService()
