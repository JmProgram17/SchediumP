"""Add academic schedule configuration table

Revision ID: add_academic_schedule_config
Revises: add_quarter_additional_fields
Create Date: 2025-07-01 02:00:00.000000

This migration creates a new table to store global academic schedule configuration
including daily start/end times and time block constraints.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_academic_schedule_config'
down_revision: Union[str, None] = 'add_quarter_additional_fields'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create academic_schedule_config table with global scheduling parameters."""
    
    # Create the academic_schedule_config table
    op.create_table(
        'academic_schedule_config',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('day_start_time', sa.Time(), nullable=False, server_default='06:00:00', 
                  comment='Daily academic schedule start time'),
        sa.Column('day_end_time', sa.Time(), nullable=False, server_default='22:00:00',
                  comment='Daily academic schedule end time'),
        sa.Column('min_class_duration_minutes', sa.Integer(), nullable=False, server_default='60',
                  comment='Minimum class duration in minutes'),
        sa.Column('max_class_duration_minutes', sa.Integer(), nullable=False, server_default='240',
                  comment='Maximum class duration in minutes'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1',
                  comment='Whether this configuration is active'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, 
                  server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')),
        
        # Constraints
        sa.CheckConstraint('day_start_time < day_end_time', name='ck_valid_day_times'),
        sa.CheckConstraint('min_class_duration_minutes > 0', name='ck_positive_min_duration'),
        sa.CheckConstraint('max_class_duration_minutes >= min_class_duration_minutes', 
                          name='ck_valid_duration_range'),
        
        # Indexes
        sa.Index('ix_academic_schedule_config_is_active', 'is_active'),
        
        comment='Global academic schedule configuration parameters'
    )
    
    # Insert default configuration record
    op.execute("""
        INSERT INTO academic_schedule_config 
        (day_start_time, day_end_time, min_class_duration_minutes, max_class_duration_minutes, is_active)
        VALUES ('06:00:00', '22:00:00', 60, 240, 1)
    """)


def downgrade() -> None:
    """Drop academic_schedule_config table."""
    op.drop_table('academic_schedule_config')