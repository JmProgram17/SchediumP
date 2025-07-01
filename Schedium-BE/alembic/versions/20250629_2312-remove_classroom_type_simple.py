"""Remove classroom_type field from classroom table

Revision ID: 20250629_2312
Revises: 5c1ef82badf8
Create Date: 2025-06-29 23:12:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20250629_2312'
down_revision = '5c1ef82badf8'
branch_labels = None
depends_on = None

def upgrade():
    """Remove classroom_type column from classroom table."""
    # Remove classroom_type column
    op.drop_column('classroom', 'classroom_type')

def downgrade():
    """Add classroom_type column back to classroom table."""
    # Add classroom_type column back
    op.add_column('classroom', sa.Column('classroom_type', sa.String(50), default="Standard"))