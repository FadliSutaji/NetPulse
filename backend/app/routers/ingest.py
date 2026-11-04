from datetime import datetime, timezone
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import verify_server_key
from app.database import get_db
from app.models.metric import ServerMetric
from app.models.server import Server
from app.schemas.metric import IngestPayload, IngestResponse

router = APIRouter(prefix="/ingest", tags=["Ingest"])


@router.post("", response_model=IngestResponse, status_code=status.HTTP_200_OK)
async def ingest_metrics(
    payload: IngestPayload,
    server: Server = Depends(verify_server_key),
    db: AsyncSession = Depends(get_db),
):
    """
    Endpoint telemetri cepat yang ditembak berkala (10 detik) oleh Monitoring Agent.
    Memeriksa header 'X-Server-Key', mengupdate status server, dan menyimpan metrik
    ke hypertable TimescaleDB.
    """
    now = datetime.now(timezone.utc)
    if payload.timestamp:
        metric_time = datetime.fromtimestamp(payload.timestamp, tz=timezone.utc)
    else:
        metric_time = now

    # Update heartbeat server
    server.last_seen_at = now
    server.status = "ONLINE"

    # Insert metrik ke TimescaleDB hypertable
    metric_record = ServerMetric(
        time=metric_time,
        server_id=server.id,
        cpu_percent=payload.metrics.cpu.percent,
        cpu_cores=payload.metrics.cpu.cores,
        ram_percent=payload.metrics.memory.percent,
        ram_used_bytes=payload.metrics.memory.used_bytes,
        ram_total_bytes=payload.metrics.memory.total_bytes,
    )

    db.add(metric_record)
    await db.commit()

    return IngestResponse(status="success", received_at=now)
