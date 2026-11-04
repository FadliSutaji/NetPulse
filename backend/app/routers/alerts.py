from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.database import get_db
from app.models.alert import AlertLog
from app.models.user import User
from app.schemas.alert import AlertLogResponse

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("/logs", response_model=List[AlertLogResponse])
async def list_alert_logs(
    server_id: Optional[UUID] = Query(None, description="Filter berdasarkan server ID"),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Menampilkan riwayat alert yang pernah terpicu oleh sistem."""
    query = select(AlertLog).order_by(AlertLog.triggered_at.desc()).limit(limit)
    if server_id:
        query = query.where(AlertLog.server_id == server_id)

    result = await db.execute(query)
    return result.scalars().all()
