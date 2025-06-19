/**
 * Matrícula Service
 * Generated automatically by CRUD generator
 */

import { BaseApiService } from '@/services/api/base.service'
import type {
  Enrollment,
  CreateEnrollmentDTO,
  UpdateEnrollmentDTO,
  EnrollmentListQuery,
  EnrollmentListResponse,
  EnrollmentResponse
} from '../types'

export class EnrollmentService extends BaseApiService {
  protected baseUrl = ''
  private readonly basePath = '/api/enrollments'

  /**
   * Get paginated list of Matrículas
   */
  async getList(query: EnrollmentListQuery = {}): Promise<EnrollmentListResponse> {
    const response = await this.get<EnrollmentListResponse>(this.basePath, {
      params: query
    })
    return response.data!
  }

  /**
   * Get single Matrícula by ID
   */
  async getById(id: string): Promise<Enrollment> {
    const response = await this.get<EnrollmentResponse>(`${this.basePath}/${id}`)
    return response.data!.data
  }

  /**
   * Create new Matrícula
   */
  async create(data: CreateEnrollmentDTO): Promise<Enrollment> {
    const response = await this.post<EnrollmentResponse>(this.basePath, data)
    return response.data!.data
  }

  /**
   * Update existing Matrícula
   */
  async update(id: string, data: UpdateEnrollmentDTO): Promise<Enrollment> {
    const response = await this.put<EnrollmentResponse>(`${this.basePath}/${id}`, data)
    return response.data!.data
  }

  /**
   * Delete Matrícula
   */
  async deleteItem(id: string): Promise<void> {
    await this.delete(`${this.basePath}/${id}`)
  }
}

// Create singleton instance
export const enrollmentService = new EnrollmentService()
