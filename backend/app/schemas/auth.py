from typing import Optional
from pydantic import BaseModel
from uuid import UUID


class UserRegister(BaseModel):
    username: str
    email: str
    password: str
    role: Optional[str] = "admin"


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: UUID
    username: str
    email: str
    role: str
    is_active: bool

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
