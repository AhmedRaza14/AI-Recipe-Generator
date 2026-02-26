from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.services.auth_service import AuthService
from app.schemas.auth import GoogleAuthRequest, SignupRequest, LoginRequest, TokenResponse

router = APIRouter()


@router.post("/signup", response_model=TokenResponse)
async def signup(request: SignupRequest, db: Session = Depends(get_db)):
    """Register a new user with email and password"""
    try:
        auth_service = AuthService(db)
        token_response = await auth_service.signup(request)
        return token_response
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Signup failed")


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Login with email and password"""
    try:
        auth_service = AuthService(db)
        token_response = await auth_service.login(request)
        return token_response
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Login failed")


@router.post("/google", response_model=TokenResponse)
async def google_auth(request: GoogleAuthRequest, db: Session = Depends(get_db)):
    """Authenticate with Google OAuth"""
    try:
        auth_service = AuthService(db)
        token_response = await auth_service.authenticate_google(request.token)
        return token_response
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Authentication failed")
