"""
Academic Configuration Schemas
Pydantic models for academic configuration module
"""

from typing import List, Optional, Dict, Any
from datetime import date, time, datetime
from pydantic import BaseModel, Field, validator

from app.schemas.common import BaseSchema, TimestampSchema

# =============================================================================
# QUARTER SCHEMAS
# =============================================================================

class QuarterBase(BaseModel):
    """Base schema for Quarter"""
    name: str = Field(..., min_length=3, max_length=100, description="Quarter name")
    start_date: date = Field(..., description="Quarter start date")
    end_date: date = Field(..., description="Quarter end date")
    quarter_number: Optional[int] = Field(None, ge=1, le=4, description="Quarter number (1-4)")
    academic_year: Optional[int] = Field(None, ge=2020, le=2050, description="Academic year")
    description: Optional[str] = Field(None, max_length=500, description="Quarter description")

class QuarterCreate(QuarterBase):
    """Schema for creating a quarter"""
    pass

class QuarterUpdate(BaseModel):
    """Schema for updating a quarter"""
    name: Optional[str] = Field(None, min_length=3, max_length=100)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    quarter_number: Optional[int] = Field(None, ge=1, le=4)
    academic_year: Optional[int] = Field(None, ge=2020, le=2050)
    description: Optional[str] = Field(None, max_length=500)
    is_active: Optional[bool] = None

class QuarterInDB(QuarterBase):
    """Schema for Quarter from database"""
    quarter_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class QuartersListData(BaseModel):
    """Data schema for quarters list response"""
    quarters: List[QuarterInDB]
    total: int
    active_quarter: Optional[QuarterInDB] = None
    page: int
    limit: int
    total_pages: int

# =============================================================================
# TIME BLOCK SCHEMAS
# =============================================================================

class TimeBlockBase(BaseModel):
    """Base schema for TimeBlock"""
    start_time: time = Field(..., description="Block start time")
    end_time: time = Field(..., description="Block end time")
    name: Optional[str] = Field(None, max_length=50, description="Block name")
    description: Optional[str] = Field(None, max_length=200, description="Block description")

class TimeBlockCreate(TimeBlockBase):
    """Schema for creating a time block"""
    pass

class TimeBlockUpdate(BaseModel):
    """Schema for updating a time block"""
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    name: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = Field(None, max_length=200)
    is_active: Optional[bool] = None

class TimeBlockInDB(TimeBlockBase):
    """Schema for TimeBlock from database"""
    time_block_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class TimeBlocksListData(BaseModel):
    """Data schema for time blocks list response"""
    time_blocks: List[TimeBlockInDB]
    total: int

# =============================================================================
# DAY CONFIGURATION SCHEMAS
# =============================================================================

class DayConfigBase(BaseModel):
    """Base schema for Day configuration"""
    day_id: int
    name: str
    short_name: str
    is_active: bool
    sort_order: int

class DayConfigUpdate(BaseModel):
    """Schema for updating day configuration"""
    is_active: Optional[bool] = None
    sort_order: Optional[int] = Field(None, ge=0, le=6)

class DayConfigInDB(DayConfigBase):
    """Schema for Day from database"""
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class DaysListData(BaseModel):
    """Data schema for days list response"""
    days: List[DayConfigInDB]
    total: int

# =============================================================================
# CONFIGURATION SETTINGS SCHEMAS
# =============================================================================

class ConfigurationSettings(BaseModel):
    """Schema for configuration settings"""
    # Academic settings
    max_weekly_hours_instructor: int = Field(40, ge=1, le=60, description="Maximum weekly hours per instructor")
    max_daily_hours_instructor: int = Field(8, ge=1, le=12, description="Maximum daily hours per instructor")
    min_break_between_classes: int = Field(15, ge=0, le=60, description="Minimum break between classes in minutes")
    max_consecutive_hours: int = Field(4, ge=1, le=8, description="Maximum consecutive teaching hours")
    
    # Scheduling settings
    allow_weekend_classes: bool = Field(False, description="Allow scheduling classes on weekends")
    default_class_duration: int = Field(120, ge=30, le=240, description="Default class duration in minutes")
    auto_assign_classrooms: bool = Field(True, description="Automatically assign available classrooms")
    conflict_resolution_mode: str = Field("strict", pattern="^(strict|warning|flexible)$", description="Conflict resolution mode")
    
    # Quarter settings
    auto_archive_on_quarter_end: bool = Field(True, description="Automatically archive schedules on quarter end")
    allow_overlapping_quarters: bool = Field(False, description="Allow overlapping quarter dates")
    quarter_transition_buffer_days: int = Field(7, ge=0, le=30, description="Buffer days between quarters")
    
    # Notification settings
    notify_schedule_conflicts: bool = Field(True, description="Send notifications for schedule conflicts")
    notify_quarter_transitions: bool = Field(True, description="Send notifications for quarter transitions")
    notify_instructor_overload: bool = Field(True, description="Send notifications for instructor overload")
    notification_advance_days: int = Field(7, ge=1, le=30, description="Days in advance to send notifications")

class ConfigurationSettingUpdate(BaseModel):
    """Schema for updating a configuration setting"""
    config_key: str = Field(..., description="Configuration key")
    config_value: str = Field(..., description="Configuration value as string")
    description: Optional[str] = Field(None, description="Setting description")

class ConfigurationUpdateRequest(BaseModel):
    """Request schema for updating multiple settings"""
    settings: List[ConfigurationSettingUpdate]

class ConfigurationSettingsData(BaseModel):
    """Data schema for configuration settings response"""
    settings: ConfigurationSettings
    last_updated: str
    updated_by: Optional[str] = None

# =============================================================================
# QUARTER TRANSITION SCHEMAS
# =============================================================================

class QuarterTransitionRequest(BaseModel):
    """Request schema for quarter transition"""
    from_quarter_id: int = Field(..., description="Source quarter ID")
    to_quarter_id: int = Field(..., description="Target quarter ID")
    transition_date: Optional[date] = Field(None, description="Transition date (defaults to today)")
    archive_previous: bool = Field(True, description="Archive schedules from previous quarter")
    copy_schedules: bool = Field(False, description="Copy schedules to new quarter")
    notify_users: bool = Field(True, description="Send notifications to affected users")

class TransitionSummary(BaseModel):
    """Summary of transition effects"""
    total_schedules: int = Field(..., description="Total schedules in source quarter")
    schedules_to_archive: int = Field(..., description="Schedules to be archived")
    schedules_to_copy: int = Field(..., description="Schedules to be copied")
    affected_instructors: int = Field(..., description="Number of affected instructors")
    affected_groups: int = Field(..., description="Number of affected student groups")
    conflicts_detected: int = Field(..., description="Number of conflicts detected")
    warnings: List[str] = Field(default_factory=list, description="Warning messages")

class QuarterTransitionPreview(BaseModel):
    """Preview response for quarter transition"""
    data: TransitionSummary
    message: str = "Transition preview generated successfully"

class QuarterTransitionResult(BaseModel):
    """Result response for quarter transition execution"""
    data: TransitionSummary
    message: str = "Quarter transition executed successfully"

# Transition responses use the above classes in endpoints

# =============================================================================
# VALIDATION SCHEMAS
# =============================================================================

class ValidationError(BaseModel):
    """Schema for validation error"""
    field: str
    message: str
    code: str

class QuarterValidation(BaseModel):
    """Schema for quarter validation result"""
    is_valid: bool
    errors: List[ValidationError]
    warnings: List[str]

# =============================================================================
# ACADEMIC SCHEDULE CONFIG SCHEMAS
# =============================================================================

class AcademicScheduleConfigBase(BaseModel):
    """Base schema for AcademicScheduleConfig"""
    day_start_time: time = Field(..., description="Daily academic schedule start time")
    day_end_time: time = Field(..., description="Daily academic schedule end time")
    min_class_duration_minutes: int = Field(60, ge=1, le=480, description="Minimum class duration in minutes")
    max_class_duration_minutes: int = Field(240, ge=1, le=480, description="Maximum class duration in minutes")

    @validator('day_end_time')
    def validate_day_times(cls, v, values):
        """Validate that end time is after start time"""
        if 'day_start_time' in values and v <= values['day_start_time']:
            raise ValueError('day_end_time must be after day_start_time')
        return v

    @validator('max_class_duration_minutes')
    def validate_duration_range(cls, v, values):
        """Validate that max duration is greater than or equal to min duration"""
        if 'min_class_duration_minutes' in values and v < values['min_class_duration_minutes']:
            raise ValueError('max_class_duration_minutes must be >= min_class_duration_minutes')
        return v

class AcademicScheduleConfigCreate(AcademicScheduleConfigBase):
    """Schema for creating an academic schedule configuration"""
    pass

class AcademicScheduleConfigUpdate(BaseModel):
    """Schema for updating an academic schedule configuration"""
    day_start_time: Optional[time] = None
    day_end_time: Optional[time] = None
    min_class_duration_minutes: Optional[int] = Field(None, ge=1, le=480)
    max_class_duration_minutes: Optional[int] = Field(None, ge=1, le=480)
    is_active: Optional[bool] = None

class AcademicScheduleConfigInDB(AcademicScheduleConfigBase):
    """Schema for AcademicScheduleConfig from database"""
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class AcademicScheduleConfigData(BaseModel):
    """Data schema for academic schedule config response"""
    config: AcademicScheduleConfigInDB