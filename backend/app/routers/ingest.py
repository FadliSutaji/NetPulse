from datetime import datetime, timezone
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.deps import verify_server_key
from app.database import get_db
from app.models.alert import AlertLog
from app.models.metric import ServerMetric
from app.models.server import Server
from app.schemas.metric import IngestPayload, IngestResponse
from app.services.notifier import notify_all

router = APIRouter(prefix="/ingest", tags=["Ingest"])


@router.post("", response_model=IngestResponse, status_code=status.HTTP_200_OK)
async def ingest_metrics(
    payload: IngestPayload,
    server: Server = Depends(verify_server_key),
    db: AsyncSession = Depends(get_db),
):
    """
    Endpoint telemetri cepat yang ditembak berkala (10 detik) oleh Monitoring Agent.
    Memeriksa header 'X-Server-Key', mengupdate status server, menyimpan metrik,
    serta mengevaluasi threshold CPU & RAM.
    """
    now = datetime.now(timezone.utc)
    if payload.timestamp:
        metric_time = datetime.fromtimestamp(payload.timestamp, tz=timezone.utc)
    else:
        metric_time = now

    cpu_pct = payload.metrics.cpu.percent
    ram_pct = payload.metrics.memory.percent

    # Update heartbeat & status server
    server.last_seen_at = now
    if cpu_pct >= settings.ALERT_CPU_THRESHOLD or ram_pct >= settings.ALERT_RAM_THRESHOLD:
        server.status = "WARNING"
    else:
        server.status = "ONLINE"

    # Insert metrik ke tabel server_metrics
    metric_record = ServerMetric(
        time=metric_time,
        server_id=server.id,
        cpu_percent=cpu_pct,
        cpu_cores=payload.metrics.cpu.cores,
        ram_percent=ram_pct,
        ram_used_bytes=payload.metrics.memory.used_bytes,
        ram_total_bytes=payload.metrics.memory.total_bytes,
    )
    db.add(metric_record)

    # Evaluasi Threshold CPU
    if cpu_pct >= settings.ALERT_CPU_THRESHOLD:
        msg = (
            f"🔥 *[ALERT] HIGH CPU USAGE*\n\n"
            f"• *Server:* `{server.name}`\n"
            f"• *CPU Usage:* `{cpu_pct:.1f}%` (Batas: {settings.ALERT_CPU_THRESHOLD}%)\n"
            f"• *Waktu:* `{now.strftime('%Y-%m-%d %H:%M:%S UTC')}`"
        )
        db.add(
            AlertLog(
                server_id=server.id,
                alert_type="HIGH_CPU",
                severity="WARNING",
                message=msg,
            )
        )
        await notify_all(msg)

    # Evaluasi Threshold RAM
    if ram_pct >= settings.ALERT_RAM_THRESHOLD:
        msg = (
            f"⚠️ *[ALERT] HIGH RAM USAGE*\n\n"
            f"• *Server:* `{server.name}`\n"
            f"• *RAM Usage:* `{ram_pct:.1f}%` (Batas: {settings.ALERT_RAM_THRESHOLD}%)\n"
            f"• *Waktu:* `{now.strftime('%Y-%m-%d %H:%M:%S UTC')}`"
        )
        db.add(
            AlertLog(
                server_id=server.id,
                alert_type="HIGH_RAM",
                severity="WARNING",
                message=msg,
            )
        )
        await notify_all(msg)

    await db.commit()

    return IngestResponse(status="success", received_at=now)
