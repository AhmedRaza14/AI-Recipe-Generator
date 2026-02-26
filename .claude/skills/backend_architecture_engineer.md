---
name: backend_architecture_engineer
description: Design and implement FastAPI backend with modular service/repository architecture
---

When this skill is invoked, create a production-ready FastAPI backend following clean architecture principles.

## Project Structure

Create the following structure:

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app entry point
│   ├── config.py               # Settings and environment variables
│   ├── dependencies.py         # Dependency injection
│   │
│   ├── routers/                # API endpoints
│   │   ├── __init__.py
│   │   ├── recipe.py           # Recipe generation endpoints
│   │   ├── auth.py             # Authentication endpoints
│   │   ├── chat.py             # Chatbot endpoint
│   │   └── saved.py            # Saved recipes (protected)
│   │
│   ├── services/               # Business logic layer
│   │   ├── __init__.py
│   │   ├── ai_service.py       # Gemini AI integration
│   │   ├── auth_service.py     # OAuth and JWT logic
│   │   ├── recipe_service.py   # Recipe business logic
│   │   └── cache_service.py    # Redis caching
│   │
│   ├── repositories/           # Data access layer
│   │   ├── __init__.py
│   │   ├── user_repository.py
│   │   └── recipe_repository.py
│   │
│   ├── models/                 # SQLAlchemy ORM models
│   │   ├── __init__.py
│   │   ├── user.py
│   │   └── recipe.py
│   │
│   ├── schemas/                # Pydantic schemas
│   │   ├── __init__.py
│   │   ├── recipe.py           # Recipe request/response schemas
│   │   ├── auth.py             # Auth schemas
│   │   └── user.py             # User schemas
│   │
│   ├── database/               # Database configuration
│   │   ├── __init__.py
│   │   ├── session.py          # Database session management
│   │   └── base.py             # Base model class
│   │
│   ├── middleware/             # Custom middleware
│   │   ├── __init__.py
│   │   ├── rate_limit.py       # Rate limiting
│   │   ├── cors.py             # CORS configuration
│   │   └── error_handler.py    # Global error handling
│   │
│   └── utils/                  # Utility functions
│       ├── __init__.py
│       ├── security.py         # JWT, password hashing
│       ├── validators.py       # Input validation
│       └── prompt_guard.py     # Prompt injection prevention
│
├── tests/                      # Test suite
│   ├── __init__.py
│   ├── test_recipe.py
│   ├── test_auth.py
│   └── test_ai_service.py
│
├── alembic/                    # Database migrations
│   └── versions/
│
├── .env.example                # Environment variables template
├── requirements.txt            # Python dependencies
├── alembic.ini                 # Alembic configuration
└── README.md                   # Backend documentation
```

## Step 1: Create main.py

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import recipe, auth, chat, saved
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.error_handler import error_handler_middleware

app = FastAPI(
    title="AI Recipe Generator API",
    description="Production-ready recipe generation API with Gemini AI",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiting
app.add_middleware(RateLimitMiddleware)

# Error handling
app.middleware("http")(error_handler_middleware)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(recipe.router, prefix="/recipe", tags=["Recipe"])
app.include_router(chat.router, prefix="/chat", tags=["Chat"])
app.include_router(saved.router, prefix="/saved", tags=["Saved Recipes"])

@app.get("/")
async def root():
    return {"message": "AI Recipe Generator API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
```

## Step 2: Create config.py

```python
from pydantic_settings import BaseSettings
from typing import List

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

    # Gemini AI
    GEMINI_API_KEY: str

    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
```

## Step 3: Create dependencies.py

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.utils.security import verify_token
from app.repositories.user_repository import UserRepository

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Dependency to get current authenticated user"""
    token = credentials.credentials
    payload = verify_token(token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )

    user_repo = UserRepository(db)
    user = user_repo.get_by_email(payload.get("email"))

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    return user
```

## Step 4: Create Recipe Router

```python
# app/routers/recipe.py
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.services.ai_service import ai_service
from app.schemas.recipe import RecipeRequest, RecipeResponse, IngredientRequest

router = APIRouter()

@router.post("/generate-recipe", response_model=RecipeResponse)
async def generate_recipe(request: RecipeRequest):
    """Generate recipe from dish name"""
    try:
        recipe = await ai_service.generate_recipe(request.dish_name)
        return recipe
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Recipe generation failed")

@router.post("/generate-from-ingredients")
async def generate_from_ingredients(request: IngredientRequest):
    """Generate recipe suggestions from ingredients"""
    try:
        result = await ai_service.generate_from_ingredients(request.ingredients)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Generation failed")
```

## Step 5: Create Saved Recipes Router

```python
# app/routers/saved.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.dependencies import get_current_user
from app.repositories.recipe_repository import RecipeRepository
from app.schemas.recipe import SaveRecipeRequest

router = APIRouter()

@router.post("/save-recipe")
async def save_recipe(
    request: SaveRecipeRequest,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Save recipe for authenticated user"""
    recipe_repo = RecipeRepository(db)
    saved = recipe_repo.create({
        'user_id': current_user.id,
        'recipe_json': request.recipe_data
    })
    return {"id": saved.id, "message": "Recipe saved successfully"}

@router.get("/recipes")
async def get_saved_recipes(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all saved recipes for user"""
    recipe_repo = RecipeRepository(db)
    recipes = recipe_repo.get_by_user_id(current_user.id)
    return recipes

@router.delete("/recipes/{recipe_id}")
async def delete_recipe(
    recipe_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete saved recipe"""
    recipe_repo = RecipeRepository(db)
    success = recipe_repo.delete(recipe_id, current_user.id)

    if not success:
        raise HTTPException(status_code=404, detail="Recipe not found")

    return {"message": "Recipe deleted successfully"}
```

## Step 6: Create Chat Router

```python
# app/routers/chat.py
from fastapi import APIRouter
from app.services.ai_service import ai_service
from app.schemas.chat import ChatRequest, ChatResponse

router = APIRouter()

@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Handle cooking-related chat queries"""
    try:
        response = await ai_service.chat_response(
            request.message,
            request.context
        )
        return {"response": response}
    except ValueError as e:
        return {"response": str(e)}
```

## Step 7: Create Middleware

```python
# app/middleware/rate_limit.py
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
import time
from collections import defaultdict

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, requests_per_minute: int = 60):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.requests = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host
        current_time = time.time()

        # Clean old requests
        self.requests[client_ip] = [
            req_time for req_time in self.requests[client_ip]
            if current_time - req_time < 60
        ]

        # Check rate limit
        if len(self.requests[client_ip]) >= self.requests_per_minute:
            raise HTTPException(status_code=429, detail="Too many requests")

        self.requests[client_ip].append(current_time)
        response = await call_next(request)
        return response
```

```python
# app/middleware/error_handler.py
from fastapi import Request
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)

async def error_handler_middleware(request: Request, call_next):
    """Global error handler"""
    try:
        response = await call_next(request)
        return response
    except Exception as e:
        logger.error(f"Unhandled error: {e}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"}
        )
```

## Step 8: Create requirements.txt

```txt
fastapi==0.109.0
uvicorn[standard]==0.27.0
sqlalchemy==2.0.25
psycopg2-binary==2.9.9
alembic==1.13.1
pydantic==2.5.3
pydantic-settings==2.1.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
google-auth==2.27.0
google-generativeai==0.3.2
redis==5.0.1
httpx==0.26.0
pytest==7.4.4
pytest-asyncio==0.23.3
```

## Step 9: Create .env.example

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/recipe_db

# Redis
REDIS_URL=redis://localhost:6379

# Security
SECRET_KEY=your-secret-key-min-32-characters-long
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# CORS
ALLOWED_ORIGINS=["http://localhost:3000"]

# Environment
ENVIRONMENT=development
DEBUG=True

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60
```

## Architecture Principles

1. **Separation of Concerns:**
   - Routers: Handle HTTP requests/responses
   - Services: Business logic
   - Repositories: Data access
   - Models: Database entities
   - Schemas: Data validation

2. **Dependency Injection:**
   - Use FastAPI's Depends()
   - Inject database sessions
   - Inject services into routers

3. **Async/Await:**
   - All endpoints are async
   - Use async database operations
   - Non-blocking AI calls

4. **Error Handling:**
   - Global error handler middleware
   - Proper HTTP status codes
   - Structured error responses

5. **Security:**
   - JWT authentication
   - Rate limiting
   - Input validation
   - Prompt injection prevention

After creating the structure, implement each layer following the service/repository pattern.
