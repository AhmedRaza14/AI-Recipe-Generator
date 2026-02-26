---
name: auth_security_engineer
description: Implement Google OAuth 2.0 authentication with JWT and security best practices
---

When this skill is invoked, implement a complete authentication system with Google OAuth and JWT tokens.

## Step 1: Create auth_service.py

```python
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from google.oauth2 import id_token
from google.auth.transport import requests
from app.config import settings
from app.schemas.auth import TokenResponse, GoogleAuthRequest
from app.repositories.user_repository import UserRepository
from sqlalchemy.orm import Session
import logging

logger = logging.getLogger(__name__)

class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)

    async def authenticate_google(
        self,
        google_token: str
    ) -> TokenResponse:
        """Authenticate user with Google OAuth token"""

        try:
            # Verify Google token
            idinfo = id_token.verify_oauth2_token(
                google_token,
                requests.Request(),
                settings.GOOGLE_CLIENT_ID
            )

            # Extract user info
            email = idinfo.get('email')
            name = idinfo.get('name')
            google_id = idinfo.get('sub')

            if not email:
                raise ValueError("Email not found in Google token")

            # Get or create user
            user = self.user_repo.get_by_email(email)

            if not user:
                user = self.user_repo.create({
                    'email': email,
                    'name': name,
                    'google_id': google_id
                })
                logger.info(f"New user created: {email}")
            else:
                # Update user info if changed
                if user.name != name or user.google_id != google_id:
                    user = self.user_repo.update(user.id, {
                        'name': name,
                        'google_id': google_id
                    })

            # Generate JWT token
            access_token = self._create_access_token(
                data={'email': email, 'user_id': user.id}
            )

            return TokenResponse(
                access_token=access_token,
                token_type='bearer',
                user={
                    'id': user.id,
                    'email': user.email,
                    'name': user.name
                }
            )

        except ValueError as e:
            logger.error(f"Google auth failed: {e}")
            raise ValueError(f"Invalid Google token: {str(e)}")

    def _create_access_token(
        self,
        data: dict,
        expires_delta: Optional[timedelta] = None
    ) -> str:
        """Create JWT access token"""

        to_encode = data.copy()

        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(
                minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
            )

        to_encode.update({'exp': expire})

        encoded_jwt = jwt.encode(
            to_encode,
            settings.SECRET_KEY,
            algorithm=settings.ALGORITHM
        )

        return encoded_jwt

    def verify_token(self, token: str) -> Optional[dict]:
        """Verify JWT token and return payload"""

        try:
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=[settings.ALGORITHM]
            )
            return payload

        except JWTError as e:
            logger.warning(f"Token verification failed: {e}")
            return None
```

## Step 2: Create auth router

```python
# app/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.services.auth_service import AuthService
from app.schemas.auth import GoogleAuthRequest, TokenResponse

router = APIRouter()

@router.post("/google", response_model=TokenResponse)
async def google_auth(
    request: GoogleAuthRequest,
    db: Session = Depends(get_db)
):
    """Authenticate with Google OAuth token"""

    auth_service = AuthService(db)

    try:
        token_response = await auth_service.authenticate_google(
            request.google_token
        )
        return token_response

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )

@router.get("/me")
async def get_current_user_info(
    current_user = Depends(get_current_user)
):
    """Get current authenticated user info"""

    return {
        'id': current_user.id,
        'email': current_user.email,
        'name': current_user.name,
        'created_at': current_user.created_at
    }
```

## Step 3: Create auth schemas

```python
# app/schemas/auth.py
from pydantic import BaseModel, EmailStr
from typing import Optional

class GoogleAuthRequest(BaseModel):
    google_token: str

class UserInfo(BaseModel):
    id: int
    email: EmailStr
    name: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserInfo

class TokenPayload(BaseModel):
    email: EmailStr
    user_id: int
    exp: int
```

## Step 4: Create security utilities

```python
# app/utils/security.py
from passlib.context import CryptContext
from jose import JWTError, jwt
from app.config import settings
from typing import Optional

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash password"""
    return pwd_context.hash(password)

def verify_token(token: str) -> Optional[dict]:
    """Verify JWT token"""
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        return None
```

## Step 5: Update dependencies.py

```python
# app/dependencies.py
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
    """Get current authenticated user from JWT token"""

    token = credentials.credentials
    payload = verify_token(token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    email = payload.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )

    user_repo = UserRepository(db)
    user = user_repo.get_by_email(email)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    return user
```

## Security Best Practices

1. **Token Security:**
   - JWT tokens expire after 30 minutes
   - Tokens signed with strong secret key (min 32 chars)
   - HS256 algorithm for signing

2. **Google OAuth:**
   - Verify tokens server-side
   - Validate token audience matches client ID
   - Check token expiration

3. **Password Security:**
   - Use bcrypt for hashing
   - Never store plain passwords
   - Use strong password requirements

4. **API Security:**
   - All protected routes require valid JWT
   - Bearer token authentication
   - Proper HTTP status codes (401, 403)

5. **CORS:**
   - Whitelist allowed origins
   - Enable credentials
   - Restrict methods if needed

## Protected Route Example

```python
@router.post("/save-recipe")
async def save_recipe(
    recipe_data: dict,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Save recipe (protected route)"""

    # User is authenticated, proceed
    recipe_repo = RecipeRepository(db)
    saved_recipe = recipe_repo.create({
        'user_id': current_user.id,
        'recipe_json': recipe_data
    })

    return saved_recipe
```

## Frontend Integration

```typescript
// Frontend: Send Google token to backend
const response = await fetch('/auth/google', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ google_token: googleToken })
});

const { access_token, user } = await response.json();

// Store JWT in localStorage or httpOnly cookie
localStorage.setItem('access_token', access_token);

// Use JWT for protected requests
const protectedResponse = await fetch('/saved-recipes', {
  headers: {
    'Authorization': `Bearer ${access_token}`
  }
});
```

Implement this authentication system with proper error handling and logging.
