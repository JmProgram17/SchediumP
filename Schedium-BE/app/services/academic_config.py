"""
Academic Configuration Service
Business logic for academic configuration management
"""

from typing import List, Optional, Dict, Any, Tuple
from datetime import date, time, datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func

from app.models.scheduling import Quarter, TimeBlock, Day, DayTimeBlock, ClassSchedule, AcademicScheduleConfig
from app.models.infrastructure import Classroom
from app.models.auth import User
from app.schemas.academic_config import (
    QuarterCreate,
    QuarterUpdate,
    TimeBlockCreate,
    TimeBlockUpdate,
    DayConfigUpdate,
    TransitionSummary,
    AcademicScheduleConfigCreate,
    AcademicScheduleConfigUpdate,
    ConfigurationSettings
)
from app.core.exceptions import ValidationException, ConflictException, NotFoundException

class AcademicConfigService:
    """Service class for academic configuration operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    # =============================================================================
    # QUARTER OPERATIONS
    # =============================================================================
    
    def get_quarters(
        self,
        is_active: Optional[bool] = None,
        academic_year: Optional[int] = None,
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 10
    ) -> Tuple[List[Quarter], int]:
        """Get quarters with filters and pagination"""
        query = self.db.query(Quarter)
        
        # Apply filters
        if is_active is not None:
            query = query.filter(Quarter.is_active == is_active)
        
        if academic_year:
            query = query.filter(Quarter.academic_year == academic_year)
        
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    Quarter.name.ilike(search_pattern),
                    Quarter.description.ilike(search_pattern)
                )
            )
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        offset = (page - 1) * limit
        quarters = query.order_by(Quarter.start_date.desc()).offset(offset).limit(limit).all()
        
        return quarters, total
    
    def get_active_quarter(self) -> Optional[Quarter]:
        """Get the currently active quarter"""
        return self.db.query(Quarter).filter(Quarter.is_active == True).first()
    
    def get_quarter_by_id(self, quarter_id: int) -> Optional[Quarter]:
        """Get a quarter by ID"""
        return self.db.query(Quarter).filter(Quarter.quarter_id == quarter_id).first()
    
    def check_quarter_overlap(
        self,
        start_date: date,
        end_date: date,
        exclude_id: Optional[int] = None
    ) -> bool:
        """Check if quarter dates overlap with existing quarters"""
        query = self.db.query(Quarter).filter(
            and_(
                Quarter.start_date <= end_date,
                Quarter.end_date >= start_date
            )
        )
        
        if exclude_id:
            query = query.filter(Quarter.quarter_id != exclude_id)
        
        return query.count() > 0
    
    def create_quarter(self, quarter_data: QuarterCreate, user_id: int) -> Quarter:
        """Create a new quarter"""
        # Create quarter
        quarter = Quarter(
            name=quarter_data.name,
            start_date=quarter_data.start_date,
            end_date=quarter_data.end_date,
            quarter_number=quarter_data.quarter_number,
            academic_year=quarter_data.academic_year,
            enrollment_deadline=quarter_data.enrollment_deadline,
            description=quarter_data.description,
            is_active=False  # New quarters start as inactive
        )
        
        self.db.add(quarter)
        self.db.commit()
        self.db.refresh(quarter)
        
        return quarter
    
    def update_quarter(
        self,
        quarter_id: int,
        quarter_data: QuarterUpdate,
        user_id: int
    ) -> Quarter:
        """Update a quarter"""
        quarter = self.get_quarter_by_id(quarter_id)
        if not quarter:
            raise NotFoundException(f"Quarter with ID {quarter_id} not found")
        
        # Update fields if provided
        update_data = quarter_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(quarter, field, value)
        
        # Check for date overlap if dates were updated
        if 'start_date' in update_data or 'end_date' in update_data:
            if self.check_quarter_overlap(
                quarter.start_date,
                quarter.end_date,
                exclude_id=quarter_id
            ):
                raise ConflictException("Updated dates overlap with existing quarter")
        
        self.db.commit()
        self.db.refresh(quarter)
        
        return quarter
    
    def delete_quarter(self, quarter_id: int) -> None:
        """Delete a quarter"""
        quarter = self.get_quarter_by_id(quarter_id)
        if not quarter:
            raise NotFoundException(f"Quarter with ID {quarter_id} not found")
        
        if quarter.is_active:
            raise ValidationException("Cannot delete active quarter")
        
        # Check if quarter has schedules
        if self.quarter_has_schedules(quarter_id):
            raise ValidationException("Cannot delete quarter with existing schedules")
        
        self.db.delete(quarter)
        self.db.commit()
    
    def activate_quarter(self, quarter_id: int, user_id: int) -> Quarter:
        """Activate a quarter and deactivate all others"""
        quarter = self.get_quarter_by_id(quarter_id)
        if not quarter:
            raise NotFoundException(f"Quarter with ID {quarter_id} not found")
        
        # Deactivate all quarters
        self.db.query(Quarter).update({Quarter.is_active: False})
        
        # Activate the selected quarter
        quarter.is_active = True
        
        self.db.commit()
        self.db.refresh(quarter)
        
        return quarter
    
    def quarter_has_schedules(self, quarter_id: int) -> bool:
        """Check if a quarter has any schedules"""
        # For now, return False as we don't have quarter relationship in ClassSchedule
        # TODO: Add quarter_id to ClassSchedule model
        return False
    
    # =============================================================================
    # TIME BLOCK OPERATIONS
    # =============================================================================
    
    def get_time_blocks(
        self,
        is_active: Optional[bool] = None,
        search: Optional[str] = None
    ) -> List[TimeBlock]:
        """Get time blocks with filters"""
        query = self.db.query(TimeBlock)
        
        if is_active is not None:
            query = query.filter(TimeBlock.is_active == is_active)
        
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    TimeBlock.name.ilike(search_pattern),
                    TimeBlock.description.ilike(search_pattern)
                )
            )
        
        return query.order_by(TimeBlock.start_time).all()
    
    def get_time_block_by_id(self, time_block_id: int) -> Optional[TimeBlock]:
        """Get a time block by ID"""
        return self.db.query(TimeBlock).filter(TimeBlock.time_block_id == time_block_id).first()
    
    def check_time_block_overlap(
        self,
        start_time: time,
        end_time: time,
        exclude_id: Optional[int] = None
    ) -> bool:
        """Check if time block overlaps with existing blocks"""
        query = self.db.query(TimeBlock).filter(
            and_(
                TimeBlock.start_time < end_time,
                TimeBlock.end_time > start_time,
                TimeBlock.is_active == True
            )
        )
        
        if exclude_id:
            query = query.filter(TimeBlock.time_block_id != exclude_id)
        
        return query.count() > 0
    
    def create_time_block(self, time_block_data: TimeBlockCreate, user_id: int) -> TimeBlock:
        """Create a new time block"""
        from sqlalchemy import text
        
        # Use raw SQL to avoid generated column issue
        result = self.db.execute(
            text("""
                INSERT INTO time_block (start_time, end_time, name, description, is_active, created_at, updated_at)
                VALUES (:start_time, :end_time, :name, :description, :is_active, NOW(), NOW())
            """),
            {
                "start_time": time_block_data.start_time,
                "end_time": time_block_data.end_time,
                "name": time_block_data.name,
                "description": time_block_data.description,
                "is_active": True
            }
        )
        self.db.commit()
        
        # Get the inserted record
        time_block_id = result.lastrowid
        time_block = self.db.query(TimeBlock).filter(TimeBlock.time_block_id == time_block_id).first()
        
        # Create DayTimeBlock associations for all active days
        active_days = self.db.query(Day).filter(Day.is_active == True).all()
        for day in active_days:
            day_time_block = DayTimeBlock(
                day_id=day.day_id,
                time_block_id=time_block.time_block_id
            )
            self.db.add(day_time_block)
        
        self.db.commit()
        
        return time_block
    
    def update_time_block(
        self,
        time_block_id: int,
        time_block_data: TimeBlockUpdate,
        user_id: int
    ) -> TimeBlock:
        """Update a time block"""
        time_block = self.get_time_block_by_id(time_block_id)
        if not time_block:
            raise NotFoundException(f"Time block with ID {time_block_id} not found")
        
        # Update fields if provided
        update_data = time_block_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(time_block, field, value)
        
        # Check for time overlap if times were updated
        if 'start_time' in update_data or 'end_time' in update_data:
            if self.check_time_block_overlap(
                time_block.start_time,
                time_block.end_time,
                exclude_id=time_block_id
            ):
                raise ConflictException("Updated times overlap with existing time block")
        
        self.db.commit()
        self.db.refresh(time_block)
        
        return time_block
    
    def delete_time_block(self, time_block_id: int) -> None:
        """Delete a time block"""
        time_block = self.get_time_block_by_id(time_block_id)
        if not time_block:
            raise NotFoundException(f"Time block with ID {time_block_id} not found")
        
        # Check if time block has schedules
        if self.time_block_has_schedules(time_block_id):
            raise ValidationException("Cannot delete time block with existing schedules")
        
        # Delete DayTimeBlock associations
        self.db.query(DayTimeBlock).filter(
            DayTimeBlock.time_block_id == time_block_id
        ).delete()
        
        # Delete time block
        self.db.delete(time_block)
        self.db.commit()
    
    def time_block_has_schedules(self, time_block_id: int) -> bool:
        """Check if a time block has any schedules"""
        # Check through DayTimeBlock
        day_time_blocks = self.db.query(DayTimeBlock).filter(
            DayTimeBlock.time_block_id == time_block_id
        ).all()
        
        for dtb in day_time_blocks:
            if self.db.query(ClassSchedule).filter(
                ClassSchedule.day_time_block_id == dtb.day_time_block_id
            ).first():
                return True
        
        return False
    
    # =============================================================================
    # DAY CONFIGURATION OPERATIONS
    # =============================================================================
    
    def get_day_configs(self) -> List[Day]:
        """Get all day configurations"""
        return self.db.query(Day).order_by(Day.sort_order).all()
    
    def get_day_by_id(self, day_id: int) -> Optional[Day]:
        """Get a day by ID"""
        return self.db.query(Day).filter(Day.day_id == day_id).first()
    
    def update_day_config(
        self,
        day_id: int,
        day_data: DayConfigUpdate,
        user_id: int
    ) -> Day:
        """Update a day configuration"""
        day = self.get_day_by_id(day_id)
        if not day:
            raise NotFoundException(f"Day with ID {day_id} not found")
        
        # Update fields if provided
        update_data = day_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(day, field, value)
        
        # If day is being deactivated, remove its time block associations
        if 'is_active' in update_data and not update_data['is_active']:
            self.db.query(DayTimeBlock).filter(
                DayTimeBlock.day_id == day_id
            ).delete()
        # If day is being activated, create time block associations
        elif 'is_active' in update_data and update_data['is_active']:
            active_time_blocks = self.db.query(TimeBlock).filter(
                TimeBlock.is_active == True
            ).all()
            for time_block in active_time_blocks:
                # Check if association already exists
                existing = self.db.query(DayTimeBlock).filter(
                    and_(
                        DayTimeBlock.day_id == day_id,
                        DayTimeBlock.time_block_id == time_block.time_block_id
                    )
                ).first()
                if not existing:
                    day_time_block = DayTimeBlock(
                        day_id=day_id,
                        time_block_id=time_block.time_block_id
                    )
                    self.db.add(day_time_block)
        
        self.db.commit()
        self.db.refresh(day)
        
        return day
    
    # =============================================================================
    # CONFIGURATION SETTINGS OPERATIONS
    # =============================================================================
    
    def get_configuration_settings(self) -> ConfigurationSettings:
        """Get all configuration settings"""
        # For now, return default settings
        # TODO: Implement institution_config table storage
        return ConfigurationSettings()
    
    def update_configuration_setting(
        self,
        key: str,
        value: str,
        user_id: int
    ) -> None:
        """Update a configuration setting"""
        # TODO: Implement institution_config table storage
        pass
    
    def reset_configuration_to_defaults(self, user_id: int) -> None:
        """Reset all configuration to defaults"""
        # TODO: Implement institution_config table storage
        pass
    
    # =============================================================================
    # QUARTER TRANSITION OPERATIONS
    # =============================================================================
    
    def preview_quarter_transition(
        self,
        from_quarter_id: int,
        to_quarter_id: int,
        archive_previous: bool,
        copy_schedules: bool
    ) -> TransitionSummary:
        """Preview the effects of a quarter transition"""
        # Get quarters
        from_quarter = self.get_quarter_by_id(from_quarter_id)
        to_quarter = self.get_quarter_by_id(to_quarter_id)
        
        if not from_quarter or not to_quarter:
            raise NotFoundException("One or both quarters not found")
        
        # Count schedules in source quarter
        # TODO: Add quarter relationship to ClassSchedule
        total_schedules = 0  # Placeholder
        
        # Count affected entities
        affected_instructors = 0  # Placeholder
        affected_groups = 0  # Placeholder
        
        # Check for potential conflicts
        conflicts = 0
        warnings = []
        
        if from_quarter.end_date > to_quarter.start_date:
            warnings.append("Source quarter ends after target quarter starts")
        
        if copy_schedules and not archive_previous:
            warnings.append("Copying schedules without archiving may cause duplicates")
        
        return TransitionSummary(
            total_schedules=total_schedules,
            schedules_to_archive=total_schedules if archive_previous else 0,
            schedules_to_copy=total_schedules if copy_schedules else 0,
            affected_instructors=affected_instructors,
            affected_groups=affected_groups,
            conflicts_detected=conflicts,
            warnings=warnings
        )
    
    def execute_quarter_transition(
        self,
        from_quarter_id: int,
        to_quarter_id: int,
        archive_previous: bool,
        copy_schedules: bool,
        notify_users: bool,
        user_id: int
    ) -> TransitionSummary:
        """Execute a quarter transition"""
        # Get preview first
        preview = self.preview_quarter_transition(
            from_quarter_id,
            to_quarter_id,
            archive_previous,
            copy_schedules
        )
        
        # TODO: Implement actual transition logic
        # 1. Archive schedules if requested
        # 2. Copy schedules if requested
        # 3. Activate new quarter
        # 4. Send notifications if requested
        
        # For now, just activate the new quarter
        self.activate_quarter(to_quarter_id, user_id)
        
        return preview
    
    # =============================================================================
    # ACADEMIC SCHEDULE CONFIGURATION OPERATIONS
    # =============================================================================
    
    def get_schedule_config(self) -> Optional[AcademicScheduleConfig]:
        """Get the academic schedule configuration"""
        return self.db.query(AcademicScheduleConfig).filter(
            AcademicScheduleConfig.is_active == True
        ).first()
    
    def get_active_schedule_config(self) -> AcademicScheduleConfig:
        """Get the active academic schedule configuration, create default if none exists"""
        config = self.get_schedule_config()
        
        if not config:
            # Create default configuration if none exists
            default_config = AcademicScheduleConfig(
                day_start_time=time(6, 0),  # 06:00
                day_end_time=time(22, 0),   # 22:00
                min_class_duration_minutes=60,
                max_class_duration_minutes=240,
                is_active=True
            )
            self.db.add(default_config)
            self.db.commit()
            self.db.refresh(default_config)
            return default_config
        
        return config
    
    def update_schedule_config(
        self, 
        config_data: AcademicScheduleConfigUpdate, 
        user_id: int
    ) -> AcademicScheduleConfig:
        """Update the academic schedule configuration"""
        config = self.get_active_schedule_config()
        
        # Update fields if provided
        for field, value in config_data.dict(exclude_unset=True).items():
            setattr(config, field, value)
        
        # Validate the configuration
        self._validate_schedule_config(config)
        
        self.db.commit()
        self.db.refresh(config)
        
        return config
    
    def create_schedule_config(
        self, 
        config_data: AcademicScheduleConfigCreate, 
        user_id: int
    ) -> AcademicScheduleConfig:
        """Create a new academic schedule configuration"""
        # Deactivate existing configurations
        self.db.query(AcademicScheduleConfig).update({
            AcademicScheduleConfig.is_active: False
        })
        
        # Create new configuration
        config = AcademicScheduleConfig(
            day_start_time=config_data.day_start_time,
            day_end_time=config_data.day_end_time,
            min_class_duration_minutes=config_data.min_class_duration_minutes,
            max_class_duration_minutes=config_data.max_class_duration_minutes,
            is_active=True
        )
        
        # Validate the configuration
        self._validate_schedule_config(config)
        
        self.db.add(config)
        self.db.commit()
        self.db.refresh(config)
        
        return config
    
    def _validate_schedule_config(self, config: AcademicScheduleConfig) -> None:
        """Validate academic schedule configuration"""
        # Check time range
        if config.day_end_time <= config.day_start_time:
            raise ValidationException("day_end_time must be after day_start_time")
        
        # Check duration range
        if config.max_class_duration_minutes < config.min_class_duration_minutes:
            raise ValidationException("max_class_duration_minutes must be >= min_class_duration_minutes")
        
        # Check reasonable limits
        if config.min_class_duration_minutes < 15:
            raise ValidationException("min_class_duration_minutes must be at least 15 minutes")
        
        if config.max_class_duration_minutes > 480:  # 8 hours
            raise ValidationException("max_class_duration_minutes cannot exceed 480 minutes (8 hours)")
        
        # Check if day span is reasonable
        day_duration_minutes = (
            datetime.combine(date.today(), config.day_end_time) - 
            datetime.combine(date.today(), config.day_start_time)
        ).total_seconds() / 60
        
        if day_duration_minutes < config.min_class_duration_minutes:
            raise ValidationException("Daily time span must be at least as long as minimum class duration")
        
        if day_duration_minutes > 18 * 60:  # 18 hours max
            raise ValidationException("Daily time span cannot exceed 18 hours")
    
    def validate_time_block_against_config(
        self, 
        start_time: time, 
        end_time: time
    ) -> bool:
        """Validate if a time block fits within the academic schedule configuration"""
        config = self.get_active_schedule_config()
        
        # Check if time block is within daily time range
        if start_time < config.day_start_time or end_time > config.day_end_time:
            return False
        
        # Check duration
        duration_minutes = (
            datetime.combine(date.today(), end_time) - 
            datetime.combine(date.today(), start_time)
        ).total_seconds() / 60
        
        if (duration_minutes < config.min_class_duration_minutes or 
            duration_minutes > config.max_class_duration_minutes):
            return False
        
        return True