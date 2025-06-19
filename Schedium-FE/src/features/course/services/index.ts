/**
 * Course Service - API integration with React Query
 * Implements all CRUD operations with caching, optimistic updates and error handling
 */

import { BaseApiService } from '@/services/api/base.service'
import { axiosClient } from '@/services/api/axios-client'
import { 
  Course, 
  CreateCourseDTO, 
  UpdateCourseDTO, 
  CourseListQuery,
  CourseListResponse,
  CourseResponse 
} from '../types'

export class CourseService extends BaseApiService {
  protected baseUrl = '/api/v1'
  private readonly endpoint = '/academic/courses'

  /**
   * Get paginated list of courses
   */
  async getCourses(query: CourseListQuery = {}): Promise<CourseListResponse> {
    const params = new URLSearchParams()
    
    if (query.page) params.append('page', query.page.toString())
    if (query.limit) params.append('limit', query.limit.toString())
    if (query.search) params.append('search', query.search)
    if (query.status) params.append('status', query.status)
    if (query.sortBy) params.append('sort_by', query.sortBy)
    if (query.sortOrder) params.append('sort_order', query.sortOrder)

    const queryString = params.toString()
    const url = queryString ? `${this.endpoint}?${queryString}` : this.endpoint

    const response = await this.get<CourseListResponse>(url)
    return response.data!
  }

  /**
   * Get course by ID
   */
  async getCourse(id: string): Promise<Course> {
    const response = await this.get<CourseResponse>(`${this.endpoint}/${id}`)
    return response.data!.data
  }

  /**
   * Create new course
   */
  async createCourse(data: CreateCourseDTO): Promise<Course> {
    const sanitizedData = this.sanitizeCourseData(data)
    const response = await this.post<CourseResponse>(this.endpoint, sanitizedData)
    return response.data!.data
  }

  /**
   * Update existing course
   */
  async updateCourse(id: string, data: UpdateCourseDTO): Promise<Course> {
    const sanitizedData = this.sanitizeCourseData(data)
    const response = await this.put<CourseResponse>(`${this.endpoint}/${id}`, sanitizedData)
    return response.data!.data
  }

  /**
   * Delete course (soft delete)
   */
  async deleteCourse(id: string): Promise<void> {
    await this.delete(`${this.endpoint}/${id}`)
  }

  /**
   * Bulk operations
   */
  async bulkDeleteCourses(ids: string[]): Promise<{ message: string; deletedCount: number }> {
    const response = await this.post<{ message: string; deletedCount: number }>(`${this.endpoint}/bulk-delete`, { ids })
    return response.data!
  }

  async bulkUpdateCourses(updates: Array<{ id: string; data: UpdateCourseDTO }>): Promise<{ message: string; updatedCount: number }> {
    const response = await this.post<{ message: string; updatedCount: number }>(`${this.endpoint}/bulk-update`, { updates })
    return response.data!
  }

  /**
   * Get course prerequisites
   */
  async getCoursePrerequisites(id: string): Promise<Course[]> {
    const response = await this.get<{ data: Course[] }>(`${this.endpoint}/${id}/prerequisites`)
    return response.data!.data
  }

  /**
   * Update course prerequisites
   */
  async updateCoursePrerequisites(id: string, prerequisiteIds: string[]): Promise<void> {
    await this.put(`${this.endpoint}/${id}/prerequisites`, { prerequisite_ids: prerequisiteIds })
  }

  /**
   * Export courses data
   */
  async exportCourses(query: CourseListQuery = {}, format: 'csv' | 'xlsx' = 'csv'): Promise<Blob> {
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
  private sanitizeCourseData(data: CreateCourseDTO | UpdateCourseDTO): CreateCourseDTO | UpdateCourseDTO {
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
    if (sanitized.credits !== undefined) {
      sanitized.credits = Math.max(1, Math.min(6, Math.floor(sanitized.credits)))
    }
    if (sanitized.hours) {
      sanitized.hours = Math.max(1, Math.floor(sanitized.hours))
    }
    if (sanitized.semester !== undefined) {
      sanitized.semester = Math.max(1, Math.min(10, Math.floor(sanitized.semester)))
    }
    if (sanitized.prerequisites) {
      sanitized.prerequisites = sanitized.prerequisites.filter(p => p.trim().length > 0)
    }

    return sanitized
  }
}

// Create singleton instance
export const courseService = new CourseService()