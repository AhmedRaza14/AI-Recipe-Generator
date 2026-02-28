"""
Quick script to add avatar column to users table
Run this once to fix the migration issue
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.session import engine
from sqlalchemy import text

def add_avatar_column():
    """Add avatar column to users table"""

    with engine.connect() as conn:
        try:
            # Check if column already exists
            result = conn.execute(text("""
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name='users' AND column_name='avatar'
            """))

            if result.fetchone():
                print("✓ Avatar column already exists!")
                return

            # Add the avatar column
            conn.execute(text("""
                ALTER TABLE users
                ADD COLUMN avatar VARCHAR
            """))

            # Set default value for existing users
            conn.execute(text("""
                UPDATE users
                SET avatar = 'chef'
                WHERE avatar IS NULL
            """))

            conn.commit()
            print("✓ Avatar column added successfully!")
            print("✓ Existing users set to 'chef' avatar")

        except Exception as e:
            print(f"✗ Error: {e}")
            conn.rollback()
            raise

if __name__ == "__main__":
    print("Adding avatar column to users table...")
    add_avatar_column()
    print("\nDone! You can now restart your backend server.")
