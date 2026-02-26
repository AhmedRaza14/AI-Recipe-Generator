"""Add password_hash column to users table

Revision ID: 002
Revises: 001
Create Date: 2026-02-26

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add password_hash column (nullable for Google OAuth users)
    op.add_column('users', sa.Column('password_hash', sa.String(), nullable=True))

    # Make google_id nullable (for manual signup users)
    op.alter_column('users', 'google_id', nullable=True)


def downgrade() -> None:
    # Remove password_hash column
    op.drop_column('users', 'password_hash')

    # Make google_id non-nullable again
    op.alter_column('users', 'google_id', nullable=False)
