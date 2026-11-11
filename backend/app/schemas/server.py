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
    api_key: str
    last_seen_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Alias untuk backward-compatibility
ServerWithKeyResponse = ServerResponse
