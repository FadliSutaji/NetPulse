from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator
from uuid import UUID


class UserRegister(BaseModel):
    username: str
    email: str
    password: str = Field(min_length=12)
    model_config = ConfigDict(extra="forbid")

    @field_validator("password")
    @classmethod
    def password_fits_bcrypt(cls, value: str) -> str:
        if len(value.encode("utf-8")) > 72:
            raise ValueError("Password must not exceed 72 UTF-8 bytes")
        return value


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
