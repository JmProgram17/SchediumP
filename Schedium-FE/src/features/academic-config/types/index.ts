/**
 * Academic Configuration Types
 * Types for academic configuration module including quarters, time blocks, and academic settings
 */

// Base types
export interface BaseEntity {
  created_at: string
  updated_at: string
}

// Quarter Management
export interface Quarter extends BaseEntity {
  quarter_id: number
  name: string
  start_date: string
  end_date: string
  quarter_number?: number
  academic_year?: number
  is_active: boolean
  description?: string
}

export interface CreateQuarterRequest {
  name: string
  start_date: string
  end_date: string
  quarter_number?: number
  academic_year?: number
  description?: string
  is_active?: boolean
}

export interface UpdateQuarterRequest extends Partial<CreateQuarterRequest> {
  is_active?: boolean
}

// Time Block Management
export interface TimeBlock extends BaseEntity {
  time_block_id: number
  start_time: string
  end_time: string
  name?: string
  description?: string
  is_active: boolean
}

export interface CreateTimeBlockRequest {
  start_time: string
  end_time: string
  name?: string
  description?: string
}

export interface UpdateTimeBlockRequest extends Partial<CreateTimeBlockRequest> {
  is_active?: boolean
}

// Day Configuration
export interface DayConfig extends BaseEntity {
  day_id: number
  name: string
  short_name: string
  is_active: boolean
  sort_order: number
}

export interface UpdateDayConfigRequest {
  is_active?: boolean
  sort_order?: number
}

// Academic Configuration Settings
export interface AcademicConfig {
  config_id: number
  config_key: string
  config_value: string
  description?: string
  data_type: 'string' | 'number' | 'boolean' | 'json'
  category: 'general' | 'scheduling' | 'academic' | 'system'
  updated_by?: number
  updated_at: string
}

export interface ConfigurationSettings {
  // Academic settings
  max_weekly_hours_instructor: number
  max_daily_hours_instructor: number
  min_break_between_classes: number
  max_consecutive_hours: number
  
  // Scheduling settings
  allow_weekend_classes: boolean
  default_class_duration: number
  auto_assign_classrooms: boolean
  conflict_resolution_mode: 'strict' | 'warning' | 'flexible'
  
  // Quarter settings
  auto_archive_on_quarter_end: boolean
  allow_overlapping_quarters: boolean
  quarter_transition_buffer_days: number
  
  // Notification settings
  notify_schedule_conflicts: boolean
  notify_quarter_transitions: boolean
  notify_instructor_overload: boolean
  notification_advance_days: number
}

export interface UpdateConfigRequest {
  config_key: string
  config_value: string
  description?: string
}

// Quarter Transition
export interface QuarterTransition {
  from_quarter_id: number
  to_quarter_id: number
  transition_date: string
  archive_previous: boolean
  copy_schedules: boolean
  notify_users: boolean
}

export interface TransitionSummary {
  total_schedules: number
  schedules_to_archive: number
  schedules_to_copy: number
  affected_instructors: number
  affected_groups: number
  conflicts_detected: number
  warnings: string[]
}

// Form data types
export interface QuarterFormData extends CreateQuarterRequest {}
export interface TimeBlockFormData extends CreateTimeBlockRequest {}

// API Response types
export interface QuartersResponse {
  quarters: Quarter[]
  total: number
  active_quarter?: Quarter
}

export interface TimeBlocksResponse {
  time_blocks: TimeBlock[]
  total: number
}

export interface DaysResponse {
  days: DayConfig[]
  total: number
}

export interface ConfigurationResponse {
  settings: ConfigurationSettings
  last_updated: string
  updated_by?: string
}

// Filter and pagination types
export interface QuarterFilters {
  is_active?: boolean
  academic_year?: number
  search?: string
}

export interface TimeBlockFilters {
  is_active?: boolean
  search?: string
}

// Validation types
export interface ValidationError {
  field: string
  message: string
  code: string
}

export interface QuarterValidation {
  is_valid: boolean
  errors: ValidationError[]
  warnings: string[]
}

// Export all types
export type {
  Quarter,
  TimeBlock,
  DayConfig,
  AcademicConfig,
  ConfigurationSettings,
  QuarterTransition,
  TransitionSummary,
  QuarterFormData,
  TimeBlockFormData,
  QuartersResponse,
  TimeBlocksResponse,
  DaysResponse,
  ConfigurationResponse,
  QuarterFilters,
  TimeBlockFilters,
  ValidationError,
  QuarterValidation
}