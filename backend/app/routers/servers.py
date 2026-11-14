from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, require_admin
from app.core.security import generate_server_api_key
from app.database import get_db
from app.models.server import Server
from app.models.user import User
from app.schemas.server import ServerCreate, ServerResponse, ServerWithKeyResponse

router = APIRouter(prefix="/servers", tags=["Servers"])


@router.get("", response_model=List[ServerResponse])
async def list_servers(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Menampilkan seluruh server yang terdaftar di NetPulse."""
    result = await db.execute(select(Server).order_by(Server.created_at.desc()))
    return result.scalars().all()


@router.post("", response_model=ServerWithKeyResponse, status_code=status.HTTP_201_CREATED)
async def create_server(
    server_in: ServerCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Mendaftarkan server baru dan menghasilkan X-Server-Key unik untuk agent."""
    new_server = Server(
        name=server_in.name,
        ip_address=server_in.ip_address,
        api_key=generate_server_api_key(),
        status="ONLINE",
    )
    db.add(new_server)
    await db.commit()
    await db.refresh(new_server)
    return new_server


@router.delete("/{server_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_server(
    server_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Menghapus server dari sistem monitoring NetPulse."""
    result = await db.execute(select(Server).where(Server.id == server_id))
    server = result.scalar_one_or_none()
    if not server:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Server tidak ditemukan",
        )
    await db.delete(server)
    await db.commit()
    return None
