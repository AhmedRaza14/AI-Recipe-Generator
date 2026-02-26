# AI Recipe Generator Backend

Production-ready FastAPI backend for AI-powered recipe generation using Google Gemini AI.

## Features

- **Recipe Generation**: Generate detailed recipes from dish names
- **Ingredient-Based Suggestions**: Get recipe suggestions from available ingredients
- **Cooking Chatbot**: Ask cooking-related questions (session-based, no persistence)
- **User Authentication**: Google OAuth 2.0 with JWT tokens
- **Saved Recipes**: Authenticated users can save and manage recipes
- **Security**: Rate limiting, prompt injection prevention, input validation
- **Clean Architecture**: Service layer, repository pattern, dependency injection

## Tech Stack

- FastAPI (async)
- PostgreSQL + SQLAlchemy
- Google Generative AI (Gemini)
- Google OAuth 2.0
- JWT authentication
- Alembic (migrations)
- Pydantic (validation)

## Setup

1. **Install dependencies**:
```bash
pip install -r requirements.txt
```

2. **Configure environment**:
```bash
cp .env.example .env
# Edit .env with your credentials
```

3. **Setup database**:
```bash
# Create PostgreSQL database
createdb recipe_db

# Run migrations
alembic upgrade head
```

4. **Run server**:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

### Authentication
- `POST /auth/google` - Authenticate with Google OAuth token

### Recipe Generation
- `POST /recipe/generate-recipe` - Generate recipe from dish name
- `POST /recipe/generate-from-ingredients` - Generate from ingredients list

### Chat
- `POST /chat/` - Ask cooking-related questions

### Saved Recipes (Protected)
- `POST /saved/save-recipe` - Save a recipe
- `GET /saved/recipes` - Get all saved recipes
- `DELETE /saved/recipes/{id}` - Delete a recipe

## Environment Variables

See `.env.example` for required configuration:
- `DATABASE_URL` - PostgreSQL connection string
- `GEMINI_API_KEY` - Google Gemini API key
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `SECRET_KEY` - JWT secret key (min 32 characters)
- `ALLOWED_ORIGINS` - CORS allowed origins

## Architecture

```
app/
├── main.py              # FastAPI app
├── config.py            # Settings
├── dependencies.py      # Dependency injection
├── routers/             # API endpoints
├── services/            # Business logic
├── repositories/        # Data access
├── models/              # SQLAlchemy models
├── schemas/             # Pydantic schemas
├── database/            # DB configuration
├── middleware/          # Custom middleware
└── utils/               # Utilities
```

## Security Features

- Rate limiting (60 requests/minute)
- Prompt injection prevention
- Input sanitization
- JWT token expiration
- CORS protection
- Domain-restricted chatbot (cooking only)

## Testing

```bash
pytest
```

## Production Deployment

1. Set `ENVIRONMENT=production` in `.env`
2. Use production database
3. Enable HTTPS
4. Configure proper CORS origins
5. Set up Redis for caching (optional)
6. Use production WSGI server (gunicorn + uvicorn workers)
