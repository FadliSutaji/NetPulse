from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from uuid import UUID


class AlertLogResponse(BaseModel):
    id: int
    server_id: UUID
    alert_type: str
    severity: str
    message: str
    triggered_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True
