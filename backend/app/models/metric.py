from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, Float, Integer, BigInteger, ForeignKey, Uuid

from app.database import Base


class ServerMetric(Base):
    """
    Model Hypertable TimescaleDB untuk histori metrik server.
    Tabel ini dipartisi berdasarkan kolom 'time'.
    """
    __tablename__ = "server_metrics"

    time = Column(DateTime(timezone=True), primary_key=True, default=lambda: datetime.now(timezone.utc), index=True)
    server_id = Column(Uuid(as_uuid=True), ForeignKey("servers.id", ondelete="CASCADE"), primary_key=True, index=True)

    # Metrik CPU
    cpu_percent = Column(Float, nullable=False)
    cpu_cores = Column(Integer, nullable=False, default=1)

    # Metrik RAM
    ram_percent = Column(Float, nullable=False)
    ram_used_bytes = Column(BigInteger, nullable=False)
    ram_total_bytes = Column(BigInteger, nullable=False)
