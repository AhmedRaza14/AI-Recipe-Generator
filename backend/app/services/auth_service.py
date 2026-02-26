from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from google.oauth2 import id_token
from google.auth.transport import requests
from app.config import settings
from app.schemas.auth import TokenResponse, GoogleAuthRequest, SignupRequest, LoginRequest, UserResponse
from app.repositories.user_repository import UserRepository
from app.utils.security import hash_password, verify_password
from sqlalchemy.orm import Session
import logging

logger = logging.getLogger(__name__)


class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)

    async def authenticate_google(self, google_token: str) -> TokenResponse:
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

            # Check if user exists
            user = self.user_repo.get_by_google_id(google_id)

            # Create user if doesn't exist
            if not user:
                user = self.user_repo.create({
                    'email': email,
                    'name': name,
                    'google_id': google_id
                })
                logger.info(f"New user created: {email}")
            else:
                logger.info(f"User logged in: {email}")

            # Generate JWT token
            access_token = self._create_access_token(
                data={"sub": user.email, "email": user.email, "user_id": user.id}
            )

            user_response = UserResponse(id=user.id, email=user.email, name=user.name)
            return TokenResponse(access_token=access_token, token_type="bearer", user=user_response)

        except ValueError as e:
            logger.error(f"Google authentication failed: {e}")
            raise ValueError(f"Authentication failed: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error during authentication: {e}")
            raise ValueError("Authentication failed")

    def _create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """Create JWT access token"""
        to_encode = data.copy()

        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        return encoded_jwt

    async def signup(self, signup_data: SignupRequest) -> TokenResponse:
        """Register a new user with email and password"""

        try:
            # Check if user already exists
            existing_user = self.user_repo.get_by_email(signup_data.email)
            if existing_user:
                raise ValueError("Email already registered")

            # Hash password
            hashed_password = hash_password(signup_data.password)

            # Create user
            user = self.user_repo.create({
                'email': signup_data.email,
                'name': signup_data.name,
                'password_hash': hashed_password,
                'google_id': None
            })

            logger.info(f"New user registered: {user.email}")

            # Generate JWT token
            access_token = self._create_access_token(
                data={"sub": user.email, "email": user.email, "user_id": user.id}
            )

            user_response = UserResponse(id=user.id, email=user.email, name=user.name)
            return TokenResponse(access_token=access_token, token_type="bearer", user=user_response)

        except ValueError as e:
            logger.error(f"Signup failed: {e}")
            raise ValueError(str(e))
        except Exception as e:
            logger.error(f"Unexpected error during signup: {e}")
            raise ValueError("Signup failed")

    async def login(self, login_data: LoginRequest) -> TokenResponse:
        """Login user with email and password"""

        try:
            # Debug logging
            logger.info(f"Login attempt for email: {login_data.email}")

            # Get user by email
            user = self.user_repo.get_by_email(login_data.email)

            if not user:
                logger.warning(f"User not found: {login_data.email}")
                raise ValueError("Invalid email or password")

            logger.info(f"User found: {user.name}")

            # Check if user has password (not Google OAuth user)
            if not user.password_hash:
                logger.warning(f"User {login_data.email} has no password hash")
                raise ValueError("This account uses Google Sign-In. Please login with Google.")

            logger.info("User has password hash, verifying...")

            # Verify password
            is_valid = verify_password(login_data.password, user.password_hash)
            logger.info(f"Password verification result: {is_valid}")

            if not is_valid:
                logger.warning(f"Password verification failed for {login_data.email}")
                raise ValueError("Invalid email or password")

            logger.info(f"User logged in: {user.email}")

            # Generate JWT token
            access_token = self._create_access_token(
                data={"sub": user.email, "email": user.email, "user_id": user.id}
            )

            user_response = UserResponse(id=user.id, email=user.email, name=user.name)
            return TokenResponse(access_token=access_token, token_type="bearer", user=user_response)

        except ValueError as e:
            logger.error(f"Login failed: {e}")
            raise ValueError(str(e))
        except Exception as e:
            logger.error(f"Unexpected error during login: {e}")
            raise ValueError("Login failed")

    def verify_token(self, token: str) -> Optional[dict]:
        """Verify JWT token and return payload"""
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            return payload
        except JWTError:
            return None
