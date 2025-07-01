"""Add additional fields to quarter table

Revision ID: add_quarter_additional_fields
Revises: corrected_missing_fields
Create Date: 2025-06-30 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_quarter_additional_fields'
down_revision: Union[str, None] = '20250629_2312'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add new fields to quarter table
    op.add_column('quarter', sa.Column('quarter_number', sa.Integer(), nullable=True, comment='Quarter number (1-4)'))
    op.add_column('quarter', sa.Column('academic_year', sa.Integer(), nullable=True, comment='Academic year'))
    op.add_column('quarter', sa.Column('enrollment_deadline', sa.Date(), nullable=True, comment='Enrollment deadline'))
    op.add_column('quarter', sa.Column('description', sa.Text(), nullable=True, comment='Quarter description'))
    op.add_column('quarter', sa.Column('is_active', sa.Boolean(), nullable=False, server_default='0', comment='Whether quarter is active'))


def downgrade() -> None:
    # Remove fields from quarter table
    op.drop_column('quarter', 'is_active')
    op.drop_column('quarter', 'description')
    op.drop_column('quarter', 'enrollment_deadline')
    op.drop_column('quarter', 'academic_year')
    op.drop_column('quarter', 'quarter_number')