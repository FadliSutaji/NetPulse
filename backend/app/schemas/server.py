from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from uuid import UUID


class ServerCreate(BaseModel):
    name: str
    ip_address: Optional[str] = None


class ServerResponse(BaseModel):
    id: UUID
    name: str
    ip_address: Optional[str] = None
    status: str
    last_seen_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class ServerWithKeyResponse(ServerResponse):
    """Dikembalikan saat pertama kali server didaftarkan, menyertakan api_key rahasia."""
    api_key: str
