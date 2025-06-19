/**
 * Report Service - Complete report generation and management
 * Handles report creation, templates, scheduling, and export
 */

import { BaseApiService } from '@/services/api/base.service'
import { axiosClient } from '@/services/api/axios-client'

export interface ReportTemplate {
  id: string
  name: string
  description: string
  type: 'schedule' | 'academic' | 'hr' | 'infrastructure' | 'custom'
  category: string
  fields: ReportField[]
  filters: ReportFilter[]
  groupBy?: string[]
  sortBy?: ReportSort[]
  format: ReportFormat[]
  isPublic: boolean
  createdBy: string
  createdAt: Date
  updatedAt: Date
  tags: string[]
  permissions: string[]
}

export interface ReportField {
  id: string
  name: string
  label: string
  type: 'string' | 'number' | 'date' | 'boolean' | 'enum'
  required: boolean
  defaultValue?: any
  options?: { label: string; value: any }[]
  format?: string
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max'
}

export interface ReportFilter {
  id: string
  field: string
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains' | 'startsWith' | 'endsWith'
  value: any
  label: string
  type: 'input' | 'select' | 'date' | 'dateRange' | 'multiSelect'
}

export interface ReportSort {
  field: string
  direction: 'asc' | 'desc'
}

export interface ReportFormat {
  type: 'pdf' | 'excel' | 'csv' | 'json' | 'html'
  enabled: boolean
  options?: any
}

export interface ReportRequest {
  templateId: string
  parameters: Record<string, any>
  filters: Record<string, any>
  format: 'pdf' | 'excel' | 'csv' | 'json' | 'html'
  options?: {
    orientation?: 'portrait' | 'landscape'
    pageSize?: 'A4' | 'Letter' | 'A3' | 'Legal'
    includeCharts?: boolean
    includeImages?: boolean
    compress?: boolean
  }
  delivery?: {
    type: 'download' | 'email' | 'cloud'
    email?: string
    schedule?: ScheduleConfig
  }
}

export interface ScheduleConfig {
  frequency: 'once' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  interval?: number
  dayOfWeek?: number
  dayOfMonth?: number
  time?: string
  timezone?: string
  endDate?: Date
}

export interface ReportJob {
  id: string
  templateId: string
  templateName: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  progress: number
  parameters: Record<string, any>
  format: string
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  errorMessage?: string
  fileSize?: number
  downloadUrl?: string
  expiresAt?: Date
  createdBy: string
  estimatedDuration?: number
}

export interface ReportStats {
  totalReports: number
  completedToday: number
  failedToday: number
  avgGenerationTime: number
  popularTemplates: Array<{
    id: string
    name: string
    usageCount: number
  }>
  formatDistribution: Record<string, number>
  sizeDistribution: {
    small: number // < 1MB
    medium: number // 1-10MB
    large: number // > 10MB
  }
}

export class ReportService extends BaseApiService {
  protected baseUrl = '/api/v1'
  private readonly endpoint = '/reports'

  // Template Management
  async getTemplates(filters?: {
    type?: string
    category?: string
    isPublic?: boolean
    search?: string
  }): Promise<ReportTemplate[]> {
    const params = new URLSearchParams()
    if (filters?.type) params.append('type', filters.type)
    if (filters?.category) params.append('category', filters.category)
    if (filters?.isPublic !== undefined) params.append('is_public', filters.isPublic.toString())
    if (filters?.search) params.append('search', filters.search)

    const response = await this.get<{ data: ReportTemplate[] }>(`${this.endpoint}/templates?${params}`)
    return response.data!.data
  }

  async getTemplate(id: string): Promise<ReportTemplate> {
    const response = await this.get<{ data: ReportTemplate }>(`${this.endpoint}/templates/${id}`)
    return response.data!.data
  }

  async createTemplate(template: Omit<ReportTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReportTemplate> {
    const response = await this.post<{ data: ReportTemplate }>(`${this.endpoint}/templates`, template)
    return response.data!.data
  }

  async updateTemplate(id: string, template: Partial<ReportTemplate>): Promise<ReportTemplate> {
    const response = await this.put<{ data: ReportTemplate }>(`${this.endpoint}/templates/${id}`, template)
    return response.data!.data
  }

  async deleteTemplate(id: string): Promise<void> {
    await this.delete(`${this.endpoint}/templates/${id}`)
  }

  async duplicateTemplate(id: string, name: string): Promise<ReportTemplate> {
    const response = await this.post<{ data: ReportTemplate }>(`${this.endpoint}/templates/${id}/duplicate`, { name })
    return response.data!.data
  }

  // Report Generation
  async generateReport(request: ReportRequest): Promise<ReportJob> {
    const response = await this.post<{ data: ReportJob }>(`${this.endpoint}/generate`, request)
    return response.data!.data
  }

  async previewReport(templateId: string, parameters: Record<string, any>, limit = 10): Promise<any> {
    const response = await this.post<{ data: any }>(`${this.endpoint}/preview`, {
      templateId,
      parameters,
      limit
    })
    return response.data!.data
  }

  async validateReportRequest(request: Omit<ReportRequest, 'format'>): Promise<{
    isValid: boolean
    errors: string[]
    warnings: string[]
    estimatedSize: number
    estimatedDuration: number
  }> {
    const response = await this.post<{
      data: {
        isValid: boolean
        errors: string[]
        warnings: string[]
        estimatedSize: number
        estimatedDuration: number
      }
    }>(`${this.endpoint}/validate`, request)
    return response.data!.data
  }

  // Job Management
  async getJobs(filters?: {
    status?: string
    templateId?: string
    userId?: string
    dateFrom?: Date
    dateTo?: Date
    page?: number
    limit?: number
  }): Promise<{
    jobs: ReportJob[]
    total: number
    page: number
    totalPages: number
  }> {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    if (filters?.templateId) params.append('template_id', filters.templateId)
    if (filters?.userId) params.append('user_id', filters.userId)
    if (filters?.dateFrom) params.append('date_from', filters.dateFrom.toISOString())
    if (filters?.dateTo) params.append('date_to', filters.dateTo.toISOString())
    if (filters?.page) params.append('page', filters.page.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())

    const response = await this.get<{
      data: {
        jobs: ReportJob[]
        total: number
        page: number
        totalPages: number
      }
    }>(`${this.endpoint}/jobs?${params}`)
    return response.data!.data
  }

  async getJob(id: string): Promise<ReportJob> {
    const response = await this.get<{ data: ReportJob }>(`${this.endpoint}/jobs/${id}`)
    return response.data!.data
  }

  async cancelJob(id: string): Promise<void> {
    await this.post(`${this.endpoint}/jobs/${id}/cancel`)
  }

  async retryJob(id: string): Promise<ReportJob> {
    const response = await this.post<{ data: ReportJob }>(`${this.endpoint}/jobs/${id}/retry`)
    return response.data!.data
  }

  async downloadReport(jobId: string): Promise<Blob> {
    const response = await axiosClient.get(`${this.endpoint}/jobs/${jobId}/download`, {
      responseType: 'blob'
    })
    return response.data
  }

  async getJobLogs(id: string): Promise<string[]> {
    const response = await this.get<{ data: string[] }>(`${this.endpoint}/jobs/${id}/logs`)
    return response.data!.data
  }

  // Scheduled Reports
  async scheduleReport(request: ReportRequest & { schedule: ScheduleConfig }): Promise<{
    id: string
    nextRun: Date
  }> {
    const response = await this.post<{
      data: {
        id: string
        nextRun: Date
      }
    }>(`${this.endpoint}/schedule`, request)
    return response.data!.data
  }

  async getScheduledReports(): Promise<Array<{
    id: string
    templateId: string
    templateName: string
    schedule: ScheduleConfig
    lastRun?: Date
    nextRun: Date
    enabled: boolean
    createdBy: string
  }>> {
    const response = await this.get<{
      data: Array<{
        id: string
        templateId: string
        templateName: string
        schedule: ScheduleConfig
        lastRun?: Date
        nextRun: Date
        enabled: boolean
        createdBy: string
      }>
    }>(`${this.endpoint}/scheduled`)
    return response.data!.data
  }

  async updateScheduledReport(id: string, schedule: Partial<ScheduleConfig>): Promise<void> {
    await this.put(`${this.endpoint}/scheduled/${id}`, { schedule })
  }

  async enableScheduledReport(id: string, enabled: boolean): Promise<void> {
    await this.put(`${this.endpoint}/scheduled/${id}/enabled`, { enabled })
  }

  async deleteScheduledReport(id: string): Promise<void> {
    await this.delete(`${this.endpoint}/scheduled/${id}`)
  }

  // Statistics and Analytics
  async getReportStats(period?: 'day' | 'week' | 'month' | 'year'): Promise<ReportStats> {
    const params = period ? `?period=${period}` : ''
    const response = await this.get<{ data: ReportStats }>(`${this.endpoint}/stats${params}`)
    return response.data!.data
  }

  async getUsageAnalytics(dateFrom: Date, dateTo: Date): Promise<{
    daily: Array<{
      date: string
      reports: number
      size: number
      avgDuration: number
    }>
    templates: Array<{
      id: string
      name: string
      usage: number
      avgSize: number
      avgDuration: number
    }>
    users: Array<{
      id: string
      name: string
      reports: number
    }>
    formats: Record<string, number>
  }> {
    const params = new URLSearchParams({
      date_from: dateFrom.toISOString(),
      date_to: dateTo.toISOString()
    })

    const response = await this.get<{
      data: {
        daily: Array<{
          date: string
          reports: number
          size: number
          avgDuration: number
        }>
        templates: Array<{
          id: string
          name: string
          usage: number
          avgSize: number
          avgDuration: number
        }>
        users: Array<{
          id: string
          name: string
          reports: number
        }>
        formats: Record<string, number>
      }
    }>(`${this.endpoint}/analytics?${params}`)
    return response.data!.data
  }

  // Utility Methods
  async getAvailableFields(type: string): Promise<ReportField[]> {
    const response = await this.get<{ data: ReportField[] }>(`${this.endpoint}/fields/${type}`)
    return response.data!.data
  }

  async getFilterOptions(field: string): Promise<Array<{ label: string; value: any }>> {
    const response = await this.get<{
      data: Array<{ label: string; value: any }>
    }>(`${this.endpoint}/filters/${field}/options`)
    return response.data!.data
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    const response = await this.get<{
      data: { success: boolean; message: string }
    }>(`${this.endpoint}/test`)
    return response.data!.data
  }

  // Bulk Operations
  async bulkDownload(jobIds: string[]): Promise<Blob> {
    const response = await axiosClient.post(`${this.endpoint}/bulk-download`, 
      { jobIds }, 
      { responseType: 'blob' }
    )
    return response.data
  }

  async bulkDelete(jobIds: string[]): Promise<{
    deleted: number
    failed: number
    errors: string[]
  }> {
    const response = await this.post<{
      data: {
        deleted: number
        failed: number
        errors: string[]
      }
    }>(`${this.endpoint}/bulk-delete`, { jobIds })
    return response.data!.data
  }

  // Template Import/Export
  async exportTemplate(id: string): Promise<Blob> {
    const response = await axiosClient.get(`${this.endpoint}/templates/${id}/export`, {
      responseType: 'blob'
    })
    return response.data
  }

  async importTemplate(file: File): Promise<ReportTemplate> {
    const formData = new FormData()
    formData.append('template', file)

    const response = await axiosClient.post<{ data: ReportTemplate }>(
      `${this.endpoint}/templates/import`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    )
    return response.data.data
  }

  // Real-time Updates
  subscribeToJobUpdates(jobId: string, callback: (job: ReportJob) => void): () => void {
    // This would integrate with the WebSocket service
    const eventSource = new EventSource(`${this.baseUrl}${this.endpoint}/jobs/${jobId}/stream`)
    
    eventSource.onmessage = (event) => {
      try {
        const job = JSON.parse(event.data) as ReportJob
        callback(job)
      } catch (error) {
        console.error('Failed to parse job update:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error)
    }

    return () => {
      eventSource.close()
    }
  }
}

export const reportService = new ReportService()