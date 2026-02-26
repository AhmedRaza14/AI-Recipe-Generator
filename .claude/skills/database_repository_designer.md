---
name: database_repository_designer
description: Design PostgreSQL database schema and implement repository pattern for data access
---

When this skill is invoked, create database models and repository layer following clean architecture.

## Step 1: Create database session management

```python
# app/database/session.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from app.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db() -> Session:
    """Dependency for database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

## Step 2: Create User model

```python
# app/models/user.py
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    google_id = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationship
    recipes = relationship("Recipe", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email})>"
```

## Step 3: Create Recipe model

```python
# app/models/recipe.py
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.session import Base

class Recipe(Base):
    __tablename__ = "recipes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    recipe_json = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationship
    user = relationship("User", back_populates="recipes")

    def __repr__(self):
        return f"<Recipe(id={self.id}, user_id={self.user_id})>"
```

## Step 4: Create User Repository

```python
# app/repositories/user_repository.py
from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.user import User

class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: int) -> Optional[User]:
        """Get user by ID"""
        return self.db.query(User).filter(User.id == user_id).first()

    def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        return self.db.query(User).filter(User.email == email).first()

    def get_by_google_id(self, google_id: str) -> Optional[User]:
        """Get user by Google ID"""
        return self.db.query(User).filter(User.google_id == google_id).first()

    def create(self, user_data: dict) -> User:
        """Create new user"""
        user = User(**user_data)
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def update(self, user_id: int, user_data: dict) -> Optional[User]:
        """Update user"""
        user = self.get_by_id(user_id)
        if not user:
            return None

        for key, value in user_data.items():
            setattr(user, key, value)

        self.db.commit()
        self.db.refresh(user)
        return user

    def delete(self, user_id: int) -> bool:
        """Delete user"""
        user = self.get_by_id(user_id)
        if not user:
            return False

        self.db.delete(user)
        self.db.commit()
        return True

    def get_all(self, skip: int = 0, limit: int = 100) -> List[User]:
        """Get all users with pagination"""
        return self.db.query(User).offset(skip).limit(limit).all()
```

## Step 5: Create Recipe Repository

```python
# app/repositories/recipe_repository.py
from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.recipe import Recipe

class RecipeRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, recipe_id: int) -> Optional[Recipe]:
        """Get recipe by ID"""
        return self.db.query(Recipe).filter(Recipe.id == recipe_id).first()

    def get_by_user_id(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 50
    ) -> List[Recipe]:
        """Get all recipes for a user"""
        return (
            self.db.query(Recipe)
            .filter(Recipe.user_id == user_id)
            .order_by(Recipe.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def create(self, recipe_data: dict) -> Recipe:
        """Create new recipe"""
        recipe = Recipe(**recipe_data)
        self.db.add(recipe)
        self.db.commit()
        self.db.refresh(recipe)
        return recipe

    def delete(self, recipe_id: int, user_id: int) -> bool:
        """Delete recipe (only if owned by user)"""
        recipe = (
            self.db.query(Recipe)
            .filter(Recipe.id == recipe_id, Recipe.user_id == user_id)
            .first()
        )

        if not recipe:
            return False

        self.db.delete(recipe)
        self.db.commit()
        return True

    def count_by_user(self, user_id: int) -> int:
        """Count recipes for a user"""
        return self.db.query(Recipe).filter(Recipe.user_id == user_id).count()
```

## Step 6: Create Alembic migration

```bash
# Initialize Alembic
alembic init alembic

# Create migration
alembic revision --autogenerate -m "Create users and recipes tables"

# Apply migration
alembic upgrade head
```

## Step 7: Create initial migration file

```python
# alembic/versions/001_create_tables.py
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSON

def upgrade():
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('google_id', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)
    op.create_index('ix_users_google_id', 'users', ['google_id'], unique=True)

    # Create recipes table
    op.create_table(
        'recipes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('recipe_json', JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_recipes_user_id', 'recipes', ['user_id'])

def downgrade():
    op.drop_table('recipes')
    op.drop_table('users')
```

## Database Schema

```sql
-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    name VARCHAR NOT NULL,
    google_id VARCHAR UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);

-- Recipes table
CREATE TABLE recipes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipe_json JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_recipes_user_id ON recipes(user_id);
```

## Repository Pattern Benefits

1. **Separation of Concerns:** Data access logic isolated from business logic
2. **Testability:** Easy to mock repositories for testing
3. **Maintainability:** Database changes don't affect business logic
4. **Reusability:** Common queries in one place
5. **Type Safety:** Proper typing with SQLAlchemy models

## Usage in Services

```python
# app/services/recipe_service.py
from app.repositories.recipe_repository import RecipeRepository

class RecipeService:
    def __init__(self, db: Session):
        self.recipe_repo = RecipeRepository(db)

    async def save_recipe(self, user_id: int, recipe_data: dict):
        """Save recipe for user"""
        return self.recipe_repo.create({
            'user_id': user_id,
            'recipe_json': recipe_data
        })

    async def get_user_recipes(self, user_id: int):
        """Get all recipes for user"""
        return self.recipe_repo.get_by_user_id(user_id)
```

## Database Connection Pooling

```python
# Optimized for production
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,      # Check connection before using
    pool_size=10,            # Number of connections to maintain
    max_overflow=20,         # Max additional connections
    pool_recycle=3600,       # Recycle connections after 1 hour
    echo=False               # Set True for SQL logging in dev
)
```

Implement this database layer with proper indexing and connection management.
