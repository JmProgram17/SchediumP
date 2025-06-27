/**
 * API services for Student Groups (Fichas)
 */

import { api } from '@/services/api'
import type {
  StudentGroup,
  StudentGroupCreate,
  StudentGroupUpdate,
  StudentGroupQuery,
  StudentGroupResponse,
  StudentGroupExportQuery,
  Program,
  ScheduleInfo
} from '../types'

const BASE_URL = '/academic/groups'

export const groupService = {
  /**
   * Get paginated list of student groups
   */
  getGroups: async (query: StudentGroupQuery): Promise<StudentGroupResponse> => {
    const params = new URLSearchParams()
    
    if (query.page) params.append('page', query.page.toString())
    if (query.limit) params.append('limit', query.limit.toString())
    if (query.search) params.append('search', query.search)
    if (query.program_id) params.append('program_id', query.program_id.toString())
    if (query.schedule_id) params.append('schedule_id', query.schedule_id.toString())
    if (query.active !== undefined) params.append('active', query.active.toString())
    if (query.start_date_from) params.append('start_date_from', query.start_date_from)
    if (query.start_date_to) params.append('start_date_to', query.start_date_to)
    if (query.sortBy) params.append('sort_by', query.sortBy)
    if (query.sortOrder) params.append('sort_order', query.sortOrder)
    
    const response = await api.get(`${BASE_URL}?${params.toString()}`)
    return response.data.data
  },

  /**
   * Get a single student group by ID
   */
  getGroup: async (groupId: number): Promise<StudentGroup> => {
    const response = await api.get(`${BASE_URL}/${groupId}`)
    return response.data.data
  },

  /**
   * Create a new student group
   */
  createGroup: async (data: StudentGroupCreate): Promise<StudentGroup> => {
    const response = await api.post(BASE_URL, data)
    return response.data.data
  },

  /**
   * Update an existing student group
   */
  updateGroup: async (groupId: number, data: StudentGroupUpdate): Promise<StudentGroup> => {
    const response = await api.put(`${BASE_URL}/${groupId}`, data)
    return response.data.data
  },

  /**
   * Delete a student group
   */
  deleteGroup: async (groupId: number): Promise<void> => {
    await api.delete(`${BASE_URL}/${groupId}`)
  },

  /**
   * Delete multiple student groups
   */
  bulkDeleteGroups: async (groupIds: number[]): Promise<void> => {
    await api.post(`${BASE_URL}/bulk-delete`, { ids: groupIds })
  },

  /**
   * Export student groups to CSV or Excel
   */
  exportGroups: async (query: StudentGroupExportQuery): Promise<Blob> => {
    const params = new URLSearchParams()
    
    if (query.search) params.append('search', query.search)
    if (query.program_id) params.append('program_id', query.program_id.toString())
    if (query.schedule_id) params.append('schedule_id', query.schedule_id.toString())
    if (query.active !== undefined) params.append('active', query.active.toString())
    if (query.start_date_from) params.append('start_date_from', query.start_date_from)
    if (query.start_date_to) params.append('start_date_to', query.start_date_to)
    params.append('format', query.format)
    
    const response = await api.get(`${BASE_URL}/export?${params.toString()}`, {
      responseType: 'blob'
    })
    
    return response.data
  },

  /**
   * Get all programs for dropdown
   */
  getAllPrograms: async (): Promise<Program[]> => {
    const response = await api.get('/academic/programs?limit=1000')
    return response.data.data.items
  },

  /**
   * Get all schedules for dropdown
   */
  getAllSchedules: async (): Promise<ScheduleInfo[]> => {
    const response = await api.get('/scheduling/schedules?limit=100')
    return response.data.data.items
  },

  /**
   * Check if a group number already exists
   */
  checkGroupNumberExists: async (groupNumber: number, excludeGroupId?: number): Promise<boolean> => {
    try {
      const params = new URLSearchParams()
      params.append('search', groupNumber.toString())
      if (excludeGroupId) {
        params.append('exclude_id', excludeGroupId.toString())
      }
      
      const response = await api.get(`${BASE_URL}?${params.toString()}`)
      const groups = response.data.data.items || []
      
      // Verificar si existe alguna ficha con ese número exacto
      return groups.some((group: StudentGroup) => group.group_number === groupNumber)
    } catch (error) {
      console.error('Error checking group number:', error)
      return false
    }
  }
}