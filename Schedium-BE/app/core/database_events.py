"""
Database Event Listeners for Real-time Notifications
Listens to SQLAlchemy events and triggers WebSocket notifications when data changes.
"""

import asyncio
import logging
from typing import Any, Dict, Optional
from sqlalchemy import event
from sqlalchemy.orm import Session

from app.core.websocket_manager import websocket_manager

logger = logging.getLogger(__name__)


class DatabaseEventHandler:
    """Handles database events and triggers WebSocket notifications."""
    
    def __init__(self):
        self.event_loop = None
        
    def set_event_loop(self, loop):
        """Set the event loop for async operations."""
        self.event_loop = loop
        
    def _run_async(self, coro):
        """Run async function from sync context."""
        if self.event_loop and self.event_loop.is_running():
            asyncio.create_task(coro)
        else:
            # Fallback for when we can't access the loop
            try:
                asyncio.get_event_loop().run_until_complete(coro)
            except Exception as e:
                logger.error(f"Failed to run async notification: {e}")
    
    def after_insert(self, mapper, connection, target):
        """Handle after insert events."""
        table_name = mapper.class_.__tablename__
        
        # Extract relevant data
        data = self._extract_model_data(target)
        
        logger.info(f"Database INSERT detected: {table_name}")
        
        # Trigger async notification
        self._run_async(
            websocket_manager.broadcast_database_change(
                table=table_name,
                operation="create", 
                data=data
            )
        )
        
    def after_update(self, mapper, connection, target):
        """Handle after update events."""
        table_name = mapper.class_.__tablename__
        
        # Extract relevant data
        data = self._extract_model_data(target)
        
        # Get changed fields
        changed_fields = []
        if hasattr(target, '__dict__'):
            session = Session.object_session(target)
            if session:
                # Get the state of the instance
                state = session.identity_map.get(target.__class__, target)
                if state and hasattr(state, 'committed_state'):
                    # Compare with committed state to find changes
                    pass  # SQLAlchemy provides this through other means
        
        logger.info(f"Database UPDATE detected: {table_name}")
        
        # Trigger async notification
        self._run_async(
            websocket_manager.broadcast_database_change(
                table=table_name,
                operation="update",
                data=data
            )
        )
        
    def after_delete(self, mapper, connection, target):
        """Handle after delete events."""
        table_name = mapper.class_.__tablename__
        
        # Extract relevant data (usually just ID)
        data = self._extract_model_data(target, include_all=False)
        
        logger.info(f"Database DELETE detected: {table_name}")
        
        # Trigger async notification  
        self._run_async(
            websocket_manager.broadcast_database_change(
                table=table_name,
                operation="delete",
                data=data
            )
        )
    
    def _extract_model_data(self, target, include_all=True) -> Dict[str, Any]:
        """Extract relevant data from SQLAlchemy model instance."""
        data = {}
        
        try:
            # Get primary key
            mapper = target.__mapper__
            pk_cols = mapper.primary_key
            for col in pk_cols:
                pk_value = getattr(target, col.name, None)
                data[col.name] = pk_value
                
            if include_all:
                # Include some key fields (not all to avoid sensitive data)
                safe_fields = [
                    'name', 'title', 'description', 'is_active', 'status',
                    'start_time', 'end_time', 'start_date', 'end_date',
                    'duration_minutes', 'capacity', 'group_number',
                    'code', 'credits', 'level', 'formation_chain'
                ]
                
                for field in safe_fields:
                    if hasattr(target, field):
                        value = getattr(target, field, None)
                        # Convert datetime objects to ISO strings
                        if hasattr(value, 'isoformat'):
                            value = value.isoformat()
                        data[field] = value
                        
        except Exception as e:
            logger.error(f"Error extracting model data: {e}")
            
        return data


# Global instance
db_event_handler = DatabaseEventHandler()


def setup_database_events():
    """Setup database event listeners for all relevant models."""
    # We'll register events for models that affect the frontend
    
    # Import models here to avoid circular imports
    try:
        from app.models.academic_config import Day, TimeBlock, ScheduleConfig, Quarter
        from app.models.scheduling import ClassSchedule, DayTimeBlock
        from app.models.academic import StudentGroup, Program
        from app.models.hr import Instructor
        from app.models.infrastructure import Classroom
        
        models_to_monitor = [
            Day, TimeBlock, ScheduleConfig, Quarter,  # Academic config
            ClassSchedule, DayTimeBlock,              # Scheduling
            StudentGroup, Program,                    # Academic
            Instructor,                               # HR
            Classroom                                 # Infrastructure
        ]
        
        for model in models_to_monitor:
            # Register event listeners
            event.listen(model, 'after_insert', db_event_handler.after_insert)
            event.listen(model, 'after_update', db_event_handler.after_update)
            event.listen(model, 'after_delete', db_event_handler.after_delete)
            
        logger.info(f"Database event listeners registered for {len(models_to_monitor)} models")
        
    except ImportError as e:
        logger.error(f"Failed to import models for event registration: {e}")
    except Exception as e:
        logger.error(f"Failed to setup database events: {e}")


def set_event_loop_for_db_events(loop):
    """Set the event loop for database event notifications."""
    db_event_handler.set_event_loop(loop)