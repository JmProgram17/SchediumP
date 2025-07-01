"""Add name to campus and remove capacity from classroom

Revision ID: 5c1ef82badf8
Revises: 4b0de71badf7
Create Date: 2025-06-29 14:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "5c1ef82badf8"
down_revision: Union[str, None] = "4b0de71badf7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add name column to campus table
    op.add_column('campus', sa.Column('name', sa.String(length=100), nullable=True))
    
    # Update existing records with a default value
    op.execute("UPDATE campus SET name = CONCAT('Campus ', campus_id) WHERE name IS NULL")
    
    # Make the column NOT NULL
    op.alter_column('campus', 'name',
                    existing_type=sa.String(length=100),
                    nullable=False)
    
    # Remove capacity column from classroom table
    op.drop_column('classroom', 'capacity')


def downgrade() -> None:
    # Add capacity column back to classroom table
    op.add_column('classroom', sa.Column('capacity', sa.Integer(), nullable=True))
    
    # Update with default values
    op.execute("UPDATE classroom SET capacity = 30 WHERE capacity IS NULL")
    
    # Make the column NOT NULL
    op.alter_column('classroom', 'capacity',
                    existing_type=sa.Integer(),
                    nullable=False)
    
    # Remove name column from campus table
    op.drop_column('campus', 'name')