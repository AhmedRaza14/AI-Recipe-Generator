"""add avatar to users

Revision ID: 003
Revises: 002
Create Date: 2026-03-01

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add avatar column to users table
    op.add_column('users', sa.Column('avatar', sa.String(), nullable=True))

    # Set default value for existing users
    op.execute("UPDATE users SET avatar = 'chef' WHERE avatar IS NULL")


def downgrade() -> None:
    # Remove avatar column
    op.drop_column('users', 'avatar')
