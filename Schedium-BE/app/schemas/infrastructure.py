"""
Infrastructure domain schemas.
Provides validation and serialization for infrastructure entities.
"""

from typing import List, Optional

from pydantic import EmailStr, Field, field_validator

from app.schemas.common import BaseSchema, TimestampSchema
from app.utils.validators import validate_phone


# Campus Schemas
class CampusBase(BaseSchema):
    """Base campus schema."""

    name: str = Field(
        ..., min_length=1, max_length=100, description="Campus name"
    )
    address: str = Field(
        ..., min_length=5, max_length=255, description="Campus address"
    )
    phone_number: Optional[str] = Field(None, max_length=20, description="Phone number")
    email: Optional[EmailStr] = Field(None, description="Email address")

    @field_validator("phone_number")
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        """Validate phone number format."""
        if v and not validate_phone(v):
            raise ValueError("Invalid phone number format")
        return v


class CampusCreate(CampusBase):
    """Schema for creating a campus."""

    pass


class CampusUpdate(BaseSchema):
    """Schema for updating a campus."""

    name: Optional[str] = Field(None, min_length=1, max_length=100)
    address: Optional[str] = Field(None, min_length=5, max_length=255)
    phone_number: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None


class Campus(CampusBase, TimestampSchema):
    """Campus schema for API responses."""

    campus_id: int = Field(..., description="Campus ID")
    # Explicitly add environments_count field
    environments_count: int = Field(default=0, description="Number of environments in this campus")
    
    # Override model_dump to ensure environments_count is included
    def model_dump(self, **kwargs):
        data = super().model_dump(**kwargs)
        if hasattr(self, 'environments_count'):
            data['environments_count'] = self.environments_count
        return data


# Classroom Schemas
class ClassroomBase(BaseSchema):
    """Base classroom schema."""

    room_number: str = Field(
        ..., min_length=1, max_length=20, description="Room number"
    )
    campus_id: int = Field(..., description="Campus ID")


class ClassroomCreate(ClassroomBase):
    """Schema for creating a classroom."""

    pass


class ClassroomUpdate(BaseSchema):
    """Schema for updating a classroom."""

    room_number: Optional[str] = Field(None, min_length=1, max_length=20)
    campus_id: Optional[int] = None


class Classroom(ClassroomBase, TimestampSchema):
    """Classroom schema for API responses."""

    classroom_id: int = Field(..., description="Classroom ID")
    campus: Optional[Campus] = None


# Department-Classroom Relationship Schemas
class DepartmentClassroomBase(BaseSchema):
    """Base department-classroom relationship schema."""

    department_id: int = Field(..., description="Department ID")
    classroom_id: int = Field(..., description="Classroom ID")
    priority: int = Field(0, ge=0, le=10, description="Booking priority (0-10)")
    is_primary: bool = Field(False, description="Is primary classroom for department")


class DepartmentClassroomCreate(DepartmentClassroomBase):
    """Schema for creating a department-classroom relationship."""

    pass


class DepartmentClassroomUpdate(BaseSchema):
    """Schema for updating a department-classroom relationship."""

    priority: Optional[int] = Field(None, ge=0, le=10)
    is_primary: Optional[bool] = None


class DepartmentClassroom(DepartmentClassroomBase, TimestampSchema):
    """Department-classroom relationship schema for API responses."""

    pass


class ClassroomAvailability(BaseSchema):
    """Classroom availability schema."""

    classroom_id: int = Field(..., description="Classroom ID")
    room_number: str = Field(..., description="Room number")
    campus: str = Field(..., description="Campus address")
    is_available: bool = Field(..., description="Availability status")
    day: str = Field(..., description="Day of week")
    time_block: str = Field(..., description="Time block")
    current_class: Optional[str] = Field(None, description="Current class if occupied")
    instructor: Optional[str] = Field(
        None, description="Current instructor if occupied"
    )
