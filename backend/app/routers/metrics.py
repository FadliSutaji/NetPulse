from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.database import get_db
from app.models.metric import ServerMetric
from app.models.server import Server
from app.models.user import User
from app.schemas.metric import MetricHistoryResponse, MetricPoint

router = APIRouter(prefix="/metrics", tags=["Metrics"])


@router.get("/{server_id}/latest", response_model=MetricPoint)
async def get_latest_metric(
    server_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Mengambil 1 data metrik paling mutakhir untuk kartu widget realtime dashboard."""
    query = (
        select(ServerMetric)
        .where(ServerMetric.server_id == server_id)
        .order_by(ServerMetric.time.desc())
        .limit(1)
    )
    result = await db.execute(query)
    latest = result.scalar_one_or_none()
    if not latest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Belum ada data metrik untuk server ini",
        )
    return latest


@router.get("/{server_id}/history", response_model=MetricHistoryResponse)
async def get_metric_history(
    server_id: UUID,
    minutes: int = Query(60, ge=5, le=1440, description="Rentang histori dalam menit"),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """
    Mengambil deret waktu histori metrik dari TimescaleDB untuk grafik frontend (Recharts).
    Default 60 menit terakhir.
    """
    # Verifikasi server ada
    server_check = await db.execute(select(Server).where(Server.id == server_id))
    if not server_check.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Server tidak ditemukan",
        )

    since = datetime.now(timezone.utc) - timedelta(minutes=minutes)
    query = (
        select(ServerMetric)
        .where(ServerMetric.server_id == server_id, ServerMetric.time >= since)
        .order_by(ServerMetric.time.asc())
    )
    result = await db.execute(query)
    data = result.scalars().all()

    return MetricHistoryResponse(server_id=server_id, count=len(data), data=data)
