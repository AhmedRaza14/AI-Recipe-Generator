from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.session import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    google_id = Column(String, unique=True, nullable=True)  # Nullable for manual signup users
    password_hash = Column(String, nullable=True)  # Nullable for Google OAuth users
    avatar = Column(String, nullable=True, default="chef")  # Cooking-related avatar
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    recipes = relationship("Recipe", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email})>"
