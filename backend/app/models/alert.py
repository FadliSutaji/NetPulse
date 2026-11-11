from datetime import datetime, timezone
from sqlalchemy import Column, BigInteger, Integer, String, Text, DateTime, ForeignKey, Uuid

from app.database import Base


class AlertLog(Base):
    __tablename__ = "alert_logs"

    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    server_id = Column(Uuid(as_uuid=True), ForeignKey("servers.id", ondelete="CASCADE"), nullable=False, index=True)
    alert_type = Column(String(50), nullable=False)  # HIGH_CPU, HIGH_RAM, SERVER_DOWN
    severity = Column(String(20), default="CRITICAL")  # CRITICAL, WARNING, RESOLVED
    message = Column(Text, nullable=False)
    triggered_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
