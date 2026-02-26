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
app.add_middleware(RateLimitMiddleware, requests_per_minute=settings.RATE_LIMIT_PER_MINUTE)

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
