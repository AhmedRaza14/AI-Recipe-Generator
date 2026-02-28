from pydantic_settings import BaseSettings
from typing import List, Optional


class Settings(BaseSettings):
    # App
    APP_NAME: str = "AI Recipe Generator"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Google OAuth
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str

    # Gemini AI (Multiple keys for quota rotation)
    GEMINI_API_KEY_1: str
    GEMINI_API_KEY_2: Optional[str] = None

    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60

    @property
    def gemini_api_keys(self) -> List[str]:
        """Return list of available Gemini API keys"""
        keys = [self.GEMINI_API_KEY_1]
        if self.GEMINI_API_KEY_2:
            keys.append(self.GEMINI_API_KEY_2)
        return keys

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
