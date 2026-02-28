from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.dependencies import get_current_user
from app.repositories.user_repository import UserRepository
from app.schemas.user import UpdateAvatarRequest, User

router = APIRouter()

# Available cooking-themed avatars
AVAILABLE_AVATARS = [
    "chef",
    "baker",
    "grill-master",
    "sushi-chef",
    "pizza-maker",
    "pastry-chef",
    "home-cook",
    "food-critic",
    "mixologist"
]


@router.get("/me", response_model=User)
async def get_current_user_profile(
    current_user=Depends(get_current_user)
):
    """Get current user profile"""
    return current_user


@router.put("/avatar", response_model=User)
async def update_avatar(
    request: UpdateAvatarRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user avatar"""

    # Validate avatar choice
    if request.avatar not in AVAILABLE_AVATARS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid avatar. Choose from: {', '.join(AVAILABLE_AVATARS)}"
        )

    # Update avatar
    user_repo = UserRepository(db)
    current_user.avatar = request.avatar
    db.commit()
    db.refresh(current_user)

    return current_user


@router.get("/avatars")
async def get_available_avatars():
    """Get list of available avatars"""
    return {"avatars": AVAILABLE_AVATARS}
