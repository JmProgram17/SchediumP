/**
 * Academic Configuration API Service
 * Handles API calls for academic configuration module
 */

import { enhancedApiService } from './enhanced-api.service'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'

// ============================================================================
// TYPES
// ============================================================================

export interface Quarter {
  quarter_id: number
  name: string
  start_date: string
  end_date: string
  quarter_number?: number
  academic_year?: number
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface QuarterCreate {
  name: string
  start_date: string
  end_date: string
  quarter_number?: number
  academic_year?: number
  description?: string
}

export interface QuarterUpdate {
  name?: string
  start_date?: string
  end_date?: string
  quarter_number?: number
  academic_year?: number
  description?: string
  is_active?: boolean
}

export interface QuartersListData {
  quarters: Quarter[]
  total: number
  active_quarter?: Quarter
  page: number
  limit: number
  total_pages: number
}

export interface TimeBlock {
  time_block_id: number
  start_time: string
  end_time: string
  name?: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TimeBlockCreate {
  start_time: string
  end_time: string
  name?: string
  description?: string
}

export interface TimeBlockUpdate {
  start_time?: string
  end_time?: string
  name?: string
  description?: string
  is_active?: boolean
}

export interface TimeBlocksListData {
  time_blocks: TimeBlock[]
  total: number
}

export interface DayConfig {
  day_id: number
  name: string
  short_name: string
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface DayConfigUpdate {
  is_active?: boolean
  sort_order?: number
}

export interface DaysListData {
  days: DayConfig[]
  total: number
}

export interface ConfigurationSettings {
  max_weekly_hours_instructor: number
  max_daily_hours_instructor: number
  min_break_between_classes: number
  max_consecutive_hours: number
  allow_weekend_classes: boolean
  default_class_duration: number
  auto_assign_classrooms: boolean
  conflict_resolution_mode: string
  auto_archive_on_quarter_end: boolean
  allow_overlapping_quarters: boolean
  quarter_transition_buffer_days: number
  notify_schedule_conflicts: boolean
  notify_quarter_transitions: boolean
  notify_instructor_overload: boolean
  notification_advance_days: number
}

export interface ConfigurationSettingsData {
  settings: ConfigurationSettings
  last_updated: string
  updated_by?: string
}

// Schedule Configuration types
export interface AcademicScheduleConfig {
  id: number
  day_start_time: string
  day_end_time: string
  min_class_duration_minutes: number
  max_class_duration_minutes: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AcademicScheduleConfigUpdate {
  day_start_time?: string
  day_end_time?: string
  min_class_duration_minutes?: number
  max_class_duration_minutes?: number
}

export interface AcademicScheduleConfigData {
  config: AcademicScheduleConfig
}

export interface QuarterFilters {
  is_active?: boolean
  academic_year?: number
  search?: string
  page?: number
  limit?: number
}

export interface TimeBlockFilters {
  is_active?: boolean
  search?: string
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

// Quarter API functions
export const academicConfigApi = {
  // ==================== QUARTERS ====================
  
  async getQuarters(filters: QuarterFilters = {}): Promise<ApiResponse<QuartersListData>> {
    return enhancedApiService.get('/academic-config/quarters', {
      params: filters
    })
  },

  async getActiveQuarter(): Promise<ApiResponse<Quarter>> {
    return enhancedApiService.get('/academic-config/quarters/active')
  },

  async getQuarter(quarterId: number): Promise<ApiResponse<Quarter>> {
    return enhancedApiService.get(`/academic-config/quarters/${quarterId}`)
  },

  async createQuarter(quarterData: QuarterCreate): Promise<ApiResponse<Quarter>> {
    return enhancedApiService.post('/academic-config/quarters', quarterData)
  },

  async updateQuarter(quarterId: number, quarterData: QuarterUpdate): Promise<ApiResponse<Quarter>> {
    return enhancedApiService.put(`/academic-config/quarters/${quarterId}`, quarterData)
  },

  async deleteQuarter(quarterId: number): Promise<void> {
    return enhancedApiService.delete(`/academic-config/quarters/${quarterId}`)
  },

  async activateQuarter(quarterId: number): Promise<ApiResponse<Quarter>> {
    return enhancedApiService.post(`/academic-config/quarters/${quarterId}/activate`, {})
  },

  async validateQuarter(quarterData: QuarterCreate): Promise<ApiResponse<any>> {
    return enhancedApiService.post('/academic-config/quarters/validate', quarterData)
  },

  // ==================== TIME BLOCKS ====================

  async getTimeBlocks(filters: TimeBlockFilters = {}): Promise<ApiResponse<TimeBlocksListData>> {
    return enhancedApiService.get('/academic-config/time-blocks', {
      params: filters
    })
  },

  async getTimeBlock(timeBlockId: number): Promise<ApiResponse<TimeBlock>> {
    return enhancedApiService.get(`/academic-config/time-blocks/${timeBlockId}`)
  },

  async createTimeBlock(timeBlockData: TimeBlockCreate): Promise<ApiResponse<TimeBlock>> {
    return enhancedApiService.post('/academic-config/time-blocks', timeBlockData)
  },

  async updateTimeBlock(timeBlockId: number, timeBlockData: TimeBlockUpdate): Promise<ApiResponse<TimeBlock>> {
    return enhancedApiService.put(`/academic-config/time-blocks/${timeBlockId}`, timeBlockData)
  },

  async deleteTimeBlock(timeBlockId: number): Promise<void> {
    return enhancedApiService.delete(`/academic-config/time-blocks/${timeBlockId}`)
  },

  // ==================== DAYS ====================

  async getDays(): Promise<ApiResponse<DaysListData>> {
    return enhancedApiService.get('/academic-config/days')
  },

  async updateDayConfig(dayId: number, dayData: DayConfigUpdate): Promise<ApiResponse<DayConfig>> {
    return enhancedApiService.put(`/academic-config/days/${dayId}`, dayData)
  },

  // ==================== CONFIGURATION ====================

  async getSettings(): Promise<ApiResponse<ConfigurationSettingsData>> {
    return enhancedApiService.get('/academic-config/settings')
  },

  async updateSettings(settings: any): Promise<ApiResponse<ConfigurationSettingsData>> {
    return enhancedApiService.put('/academic-config/settings', settings)
  },

  async resetSettings(): Promise<ApiResponse<ConfigurationSettingsData>> {
    return enhancedApiService.post('/academic-config/settings/reset', {})
  },

  // ==================== SCHEDULE CONFIGURATION ====================

  async getScheduleConfig(): Promise<ApiResponse<AcademicScheduleConfigData>> {
    return enhancedApiService.get('/academic-config/schedule-config')
  },

  async getActiveScheduleConfig(): Promise<ApiResponse<AcademicScheduleConfigData>> {
    return enhancedApiService.get('/academic-config/schedule-config/active')
  },

  async updateScheduleConfig(configData: AcademicScheduleConfigUpdate): Promise<ApiResponse<AcademicScheduleConfigData>> {
    return enhancedApiService.put('/academic-config/schedule-config', configData)
  }
}

export default academicConfigApi