"""
Academic Configuration API endpoints - Simplified Version
Manages quarters, time blocks, days configuration and academic settings
"""

from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.auth import User
from app.models.scheduling import Quarter, TimeBlock, Day
from app.core.responses import SuccessResponse

router = APIRouter(
    prefix="/academic-config",
    tags=["academic-config"],
    dependencies=[Depends(get_current_user)]
)

@router.get("/quarters")
async def get_quarters(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all quarters"""
    quarters = db.query(Quarter).order_by(Quarter.start_date.desc()).all()
    
    return SuccessResponse(
        success=True,
        message="Quarters retrieved successfully",
        data={
            "quarters": quarters,
            "total": len(quarters)
        }
    )

@router.get("/time-blocks")
async def get_time_blocks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all time blocks"""
    time_blocks = db.query(TimeBlock).order_by(TimeBlock.start_time).all()
    
    return SuccessResponse(
        success=True,
        message="Time blocks retrieved successfully",
        data={
            "time_blocks": time_blocks,
            "total": len(time_blocks)
        }
    )

@router.get("/days")
async def get_days(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all day configurations"""
    days = db.query(Day).order_by(Day.sort_order).all()
    
    return SuccessResponse(
        success=True,
        message="Days retrieved successfully",
        data={
            "days": days,
            "total": len(days)
        }
    )