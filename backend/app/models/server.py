import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Uuid

from app.database import Base


class Server(Base):
    __tablename__ = "servers"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    ip_address = Column(String(45), nullable=True)
    api_key = Column(String(128), unique=True, index=True, nullable=False)
    status = Column(String(20), default="ONLINE", index=True)  # ONLINE, OFFLINE, WARNING
    last_seen_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
