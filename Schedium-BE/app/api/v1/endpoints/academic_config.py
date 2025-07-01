"""
Academic Configuration API endpoints
Manages quarters, time blocks, days configuration and academic settings
"""

from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.api.deps import get_db, get_current_user
from app.models.auth import User
from app.models.scheduling import Quarter
from app.models.scheduling import TimeBlock, Day
from app.schemas.academic_config import (
    QuarterCreate,
    QuarterUpdate,
    QuarterInDB,
    QuartersListData,
    TimeBlockCreate,
    TimeBlockUpdate,
    TimeBlockInDB,
    TimeBlocksListData,
    DayConfigUpdate,
    DayConfigInDB,
    DaysListData,
    ConfigurationSettingsData,
    ConfigurationUpdateRequest,
    QuarterTransitionRequest,
    QuarterTransitionPreview,
    QuarterTransitionResult,
    TransitionSummary,
    AcademicScheduleConfigCreate,
    AcademicScheduleConfigUpdate,
    AcademicScheduleConfigData
)
from app.core.responses import SuccessResponse, CreatedResponse
from app.services.academic_config import AcademicConfigService

router = APIRouter(
    prefix="/academic-config",
    tags=["academic-config"]
)

# =============================================================================
# QUARTER ENDPOINTS
# =============================================================================

@router.get("/quarters", response_model=SuccessResponse[QuartersListData])
async def get_quarters(
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    academic_year: Optional[int] = Query(None, description="Filter by academic year"),
    search: Optional[str] = Query(None, description="Search in name and description"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Get all quarters with optional filters
    
    Permissions: Any authenticated user
    """
    service = AcademicConfigService(db)
    quarters, total = service.get_quarters(
        is_active=is_active,
        academic_year=academic_year,
        search=search,
        page=page,
        limit=limit
    )
    
    # Find active quarter
    active_quarter = service.get_active_quarter()
    
    return SuccessResponse(
        success=True,
        message="Quarters retrieved successfully",
        data=QuartersListData(
            quarters=quarters,
            total=total,
            active_quarter=active_quarter,
            page=page,
            limit=limit,
            total_pages=(total + limit - 1) // limit
        )
    )

@router.get("/quarters/active", response_model=SuccessResponse[QuarterInDB])
async def get_active_quarter(
    db: Session = Depends(get_db)
):
    """
    Get the currently active quarter
    
    Permissions: Any authenticated user
    """
    service = AcademicConfigService(db)
    quarter = service.get_active_quarter()
    
    if not quarter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active quarter found"
        )
    
    return SuccessResponse(message="Active quarter retrieved successfully", data=quarter)

@router.get("/quarters/{quarter_id}", response_model=SuccessResponse[QuarterInDB])
async def get_quarter(
    quarter_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific quarter by ID
    
    Permissions: Any authenticated user
    """
    service = AcademicConfigService(db)
    quarter = service.get_quarter_by_id(quarter_id)
    
    if not quarter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Quarter with ID {quarter_id} not found"
        )
    
    return SuccessResponse(data=quarter, message="Quarter retrieved successfully")

@router.post("/quarters", response_model=CreatedResponse[QuarterInDB], status_code=status.HTTP_201_CREATED)
async def create_quarter(
    quarter_data: QuarterCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new quarter
    
    Permissions: quarters.create
    """
    service = AcademicConfigService(db)
    
    # Validate dates
    if quarter_data.start_date >= quarter_data.end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End date must be after start date"
        )
    
    # Check for overlapping quarters
    if service.check_quarter_overlap(quarter_data.start_date, quarter_data.end_date):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quarter dates overlap with existing quarter"
        )
    
    quarter = service.create_quarter(quarter_data, current_user.user_id)
    
    return CreatedResponse(
        data=quarter,
        message="Quarter created successfully"
    )

@router.put("/quarters/{quarter_id}", response_model=SuccessResponse[QuarterInDB])

async def update_quarter(
    quarter_id: int,
    quarter_data: QuarterUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a quarter
    
    Permissions: quarters.update
    """
    service = AcademicConfigService(db)
    
    # Get existing quarter
    quarter = service.get_quarter_by_id(quarter_id)
    if not quarter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Quarter with ID {quarter_id} not found"
        )
    
    # Validate dates if provided
    if quarter_data.start_date and quarter_data.end_date:
        if quarter_data.start_date >= quarter_data.end_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="End date must be after start date"
            )
    
    # Update quarter
    updated_quarter = service.update_quarter(quarter_id, quarter_data, current_user.user_id)
    
    return SuccessResponse(
        data=updated_quarter,
        message="Quarter updated successfully"
    )

@router.delete("/quarters/{quarter_id}", status_code=status.HTTP_204_NO_CONTENT)

async def delete_quarter(
    quarter_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a quarter
    
    Permissions: quarters.delete
    """
    service = AcademicConfigService(db)
    
    # Get quarter
    quarter = service.get_quarter_by_id(quarter_id)
    if not quarter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Quarter with ID {quarter_id} not found"
        )
    
    # Prevent deleting active quarter
    if quarter.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete active quarter"
        )
    
    # Check if quarter has schedules
    if service.quarter_has_schedules(quarter_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete quarter with existing schedules"
        )
    
    service.delete_quarter(quarter_id)
    return None

@router.post("/quarters/{quarter_id}/activate", response_model=SuccessResponse[QuarterInDB])

async def activate_quarter(
    quarter_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Activate a quarter (deactivates all others)
    
    Permissions: quarters.activate
    """
    service = AcademicConfigService(db)
    
    # Get quarter
    quarter = service.get_quarter_by_id(quarter_id)
    if not quarter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Quarter with ID {quarter_id} not found"
        )
    
    # Activate quarter
    activated_quarter = service.activate_quarter(quarter_id, current_user.user_id)
    
    return SuccessResponse(
        data=activated_quarter,
        message="Quarter activated successfully"
    )

@router.post("/quarters/validate", response_model=dict)
async def validate_quarter(
    quarter_data: QuarterCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Validate quarter data without creating it
    
    Permissions: Any authenticated user
    """
    service = AcademicConfigService(db)
    
    errors = []
    warnings = []
    
    # Validate dates
    if quarter_data.start_date >= quarter_data.end_date:
        errors.append({
            "field": "end_date",
            "message": "End date must be after start date",
            "code": "INVALID_DATE_RANGE"
        })
    
    # Check duration
    duration = (quarter_data.end_date - quarter_data.start_date).days
    if duration < 30:
        errors.append({
            "field": "end_date",
            "message": "Quarter must be at least 30 days long",
            "code": "QUARTER_TOO_SHORT"
        })
    elif duration > 180:
        warnings.append("Quarter is longer than 6 months")
    
    # Check for overlapping quarters
    if service.check_quarter_overlap(quarter_data.start_date, quarter_data.end_date):
        errors.append({
            "field": "dates",
            "message": "Quarter dates overlap with existing quarter",
            "code": "OVERLAPPING_DATES"
        })
    
    # Check enrollment deadline
    if quarter_data.enrollment_deadline:
        if quarter_data.enrollment_deadline > quarter_data.start_date:
            errors.append({
                "field": "enrollment_deadline",
                "message": "Enrollment deadline must be before quarter start date",
                "code": "INVALID_ENROLLMENT_DATE"
            })
    
    return {
        "is_valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings
    }

# =============================================================================
# TIME BLOCK ENDPOINTS
# =============================================================================

@router.get("/time-blocks", response_model=SuccessResponse[TimeBlocksListData])
async def get_time_blocks(
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    search: Optional[str] = Query(None, description="Search in name and description"),
    db: Session = Depends(get_db)
):
    """
    Get all time blocks
    
    Permissions: Any authenticated user
    """
    service = AcademicConfigService(db)
    time_blocks = service.get_time_blocks(is_active=is_active, search=search)
    
    return SuccessResponse(
        message="Time blocks retrieved successfully",
        data={
            "time_blocks": time_blocks,
            "total": len(time_blocks)
        }
    )

@router.get("/time-blocks/{time_block_id}", response_model=SuccessResponse[TimeBlockInDB])
async def get_time_block(
    time_block_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific time block by ID
    
    Permissions: Any authenticated user
    """
    service = AcademicConfigService(db)
    time_block = service.get_time_block_by_id(time_block_id)
    
    if not time_block:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Time block with ID {time_block_id} not found"
        )
    
    return SuccessResponse(data=time_block, message="Time block retrieved successfully")

@router.post("/time-blocks", response_model=SuccessResponse[TimeBlockInDB], status_code=status.HTTP_201_CREATED)

async def create_time_block(
    time_block_data: TimeBlockCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new time block
    
    Permissions: time_blocks.create
    """
    service = AcademicConfigService(db)
    
    # Validate times
    if time_block_data.start_time >= time_block_data.end_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End time must be after start time"
        )
    
    # Check for overlapping time blocks
    if service.check_time_block_overlap(time_block_data.start_time, time_block_data.end_time):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Time block overlaps with existing time block"
        )
    
    time_block = service.create_time_block(time_block_data, current_user.user_id)
    
    return SuccessResponse[TimeBlockInDB](
        data=time_block,
        message="Time block created successfully"
    )

@router.put("/time-blocks/{time_block_id}", response_model=SuccessResponse[TimeBlockInDB])

async def update_time_block(
    time_block_id: int,
    time_block_data: TimeBlockUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a time block
    
    Permissions: time_blocks.update
    """
    service = AcademicConfigService(db)
    
    # Get existing time block
    time_block = service.get_time_block_by_id(time_block_id)
    if not time_block:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Time block with ID {time_block_id} not found"
        )
    
    # Update time block
    updated_time_block = service.update_time_block(time_block_id, time_block_data, current_user.user_id)
    
    return SuccessResponse[TimeBlockInDB](
        data=updated_time_block,
        message="Time block updated successfully"
    )

@router.delete("/time-blocks/{time_block_id}", status_code=status.HTTP_204_NO_CONTENT)

async def delete_time_block(
    time_block_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a time block
    
    Permissions: time_blocks.delete
    """
    service = AcademicConfigService(db)
    
    # Get time block
    time_block = service.get_time_block_by_id(time_block_id)
    if not time_block:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Time block with ID {time_block_id} not found"
        )
    
    # Check if time block is in use
    if service.time_block_has_schedules(time_block_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete time block with existing schedules"
        )
    
    service.delete_time_block(time_block_id)
    return None

# =============================================================================
# DAY CONFIGURATION ENDPOINTS
# =============================================================================

@router.get("/days", response_model=SuccessResponse[DaysListData])
async def get_day_configs(
    db: Session = Depends(get_db)
):
    """
    Get all day configurations
    
    Permissions: Any authenticated user
    """
    service = AcademicConfigService(db)
    days = service.get_day_configs()
    
    return SuccessResponse[DaysListData](
        message="Days configuration retrieved successfully",
        data={
            "days": days,
            "total": len(days)
        }
    )

@router.put("/days/{day_id}", response_model=SuccessResponse[DayConfigInDB])

async def update_day_config(
    day_id: int,
    day_data: DayConfigUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a day configuration
    
    Permissions: days.update
    """
    service = AcademicConfigService(db)
    
    # Get existing day
    day = service.get_day_by_id(day_id)
    if not day:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Day with ID {day_id} not found"
        )
    
    # Update day
    updated_day = service.update_day_config(day_id, day_data, current_user.user_id)
    
    return SuccessResponse[DayConfigInDB](
        data=updated_day,
        message="Day configuration updated successfully"
    )

# =============================================================================
# GENERAL CONFIGURATION ENDPOINTS
# =============================================================================

@router.get("/settings", response_model=SuccessResponse[ConfigurationSettingsData])
async def get_configuration(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all configuration settings
    
    Permissions: Any authenticated user
    """
    service = AcademicConfigService(db)
    settings = service.get_configuration_settings()
    
    return SuccessResponse[ConfigurationSettingsData](
        data={
            "settings": settings,
            "last_updated": datetime.now().isoformat(),
            "updated_by": None  # TODO: Track who last updated settings
        }
    )

@router.put("/settings", response_model=SuccessResponse[ConfigurationSettingsData])

async def update_configuration(
    config_data: ConfigurationUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update configuration settings
    
    Permissions: settings.update
    """
    service = AcademicConfigService(db)
    
    # Update settings
    for setting in config_data.settings:
        service.update_configuration_setting(
            key=setting.config_key,
            value=setting.config_value,
            user_id=current_user.user_id
        )
    
    # Get updated settings
    settings = service.get_configuration_settings()
    
    return SuccessResponse[ConfigurationSettingsData](
        data={
            "settings": settings,
            "last_updated": datetime.now().isoformat(),
            "updated_by": current_user.email
        },
        message="Configuration updated successfully"
    )

@router.post("/settings/reset", response_model=SuccessResponse[ConfigurationSettingsData])

async def reset_configuration(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Reset configuration to defaults
    
    Permissions: settings.reset
    """
    service = AcademicConfigService(db)
    service.reset_configuration_to_defaults(current_user.user_id)
    
    # Get updated settings
    settings = service.get_configuration_settings()
    
    return SuccessResponse[ConfigurationSettingsData](
        data={
            "settings": settings,
            "last_updated": datetime.now().isoformat(),
            "updated_by": current_user.email
        },
        message="Configuration reset to defaults successfully"
    )

# =============================================================================
# ACADEMIC SCHEDULE CONFIGURATION ENDPOINTS
# =============================================================================

@router.get("/schedule-config", response_model=SuccessResponse[AcademicScheduleConfigData])
async def get_schedule_config(
    db: Session = Depends(get_db)
):
    """
    Get the academic schedule configuration
    
    Permissions: Any authenticated user
    """
    service = AcademicConfigService(db)
    config = service.get_active_schedule_config()
    
    return SuccessResponse(
        message="Academic schedule configuration retrieved successfully",
        data=AcademicScheduleConfigData(config=config)
    )

@router.get("/schedule-config/active", response_model=SuccessResponse[AcademicScheduleConfigData])
async def get_active_schedule_config(
    db: Session = Depends(get_db)
):
    """
    Get the active academic schedule configuration
    
    Permissions: Any authenticated user
    """
    service = AcademicConfigService(db)
    config = service.get_active_schedule_config()
    
    return SuccessResponse(
        message="Active academic schedule configuration retrieved successfully",
        data=AcademicScheduleConfigData(config=config)
    )

@router.put("/schedule-config", response_model=SuccessResponse[AcademicScheduleConfigData])
async def update_schedule_config(
    config_data: AcademicScheduleConfigUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update the academic schedule configuration
    
    Permissions: schedule_config.update
    """
    service = AcademicConfigService(db)
    
    # Update configuration
    updated_config = service.update_schedule_config(config_data, current_user.user_id)
    
    return SuccessResponse(
        data=AcademicScheduleConfigData(config=updated_config),
        message="Academic schedule configuration updated successfully"
    )

@router.post("/schedule-config", response_model=CreatedResponse[AcademicScheduleConfigData], status_code=status.HTTP_201_CREATED)
async def create_schedule_config(
    config_data: AcademicScheduleConfigCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new academic schedule configuration
    
    Permissions: schedule_config.create
    """
    service = AcademicConfigService(db)
    
    # Create configuration
    new_config = service.create_schedule_config(config_data, current_user.user_id)
    
    return CreatedResponse(
        data=AcademicScheduleConfigData(config=new_config),
        message="Academic schedule configuration created successfully"
    )

# =============================================================================
# QUARTER TRANSITION ENDPOINTS
# =============================================================================

# Temporarily disabled - preview transition functionality
# @router.post("/quarters/transition/preview", response_model=QuarterTransitionPreview)

async def preview_quarter_transition_disabled(
    transition_data: QuarterTransitionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Preview the effects of a quarter transition
    
    Permissions: quarters.transition
    """
    service = AcademicConfigService(db)
    
    # Validate quarters exist
    from_quarter = service.get_quarter_by_id(transition_data.from_quarter_id)
    to_quarter = service.get_quarter_by_id(transition_data.to_quarter_id)
    
    if not from_quarter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Source quarter with ID {transition_data.from_quarter_id} not found"
        )
    
    if not to_quarter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Target quarter with ID {transition_data.to_quarter_id} not found"
        )
    
    # Get transition preview
    preview = service.preview_quarter_transition(
        from_quarter_id=transition_data.from_quarter_id,
        to_quarter_id=transition_data.to_quarter_id,
        archive_previous=transition_data.archive_previous,
        copy_schedules=transition_data.copy_schedules
    )
    
    return QuarterTransitionPreview(
        data=preview
    )

# Temporarily disabled - execute transition functionality  
# @router.post("/quarters/transition/execute", response_model=QuarterTransitionResult)

async def execute_quarter_transition_disabled(
    transition_data: QuarterTransitionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Execute a quarter transition
    
    Permissions: quarters.transition
    """
    service = AcademicConfigService(db)
    
    # Execute transition
    result = service.execute_quarter_transition(
        from_quarter_id=transition_data.from_quarter_id,
        to_quarter_id=transition_data.to_quarter_id,
        archive_previous=transition_data.archive_previous,
        copy_schedules=transition_data.copy_schedules,
        notify_users=transition_data.notify_users,
        user_id=current_user.user_id
    )
    
    return QuarterTransitionResult(
        data=result,
        message="Quarter transition executed successfully"
    )