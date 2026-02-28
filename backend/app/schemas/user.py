from pydantic import BaseModel
from typing import Optional


class UserBase(BaseModel):
    email: str
    name: str


class UserCreate(UserBase):
    google_id: str


class User(UserBase):
    id: int
    avatar: Optional[str] = "chef"

    class Config:
        from_attributes = True


class UpdateAvatarRequest(BaseModel):
    avatar: str
