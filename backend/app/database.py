import logging
from typing import AsyncGenerator
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base

from app.config import settings

logger = logging.getLogger("NetPulse.Database")

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
    pool_pre_ping=True,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_timescaledb():
    """Inisialisasi ekstensi TimescaleDB dan Hypertable untuk metrik."""
    async with engine.begin() as conn:
        try:
            # Aktifkan ekstensi timescaledb jika belum aktif
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;"))
            logger.info("TimescaleDB extension verified/enabled.")

            # Buat hypertable untuk server_metrics jika belum ada
            await conn.execute(
                text(
                    "SELECT create_hypertable('server_metrics', 'time', if_not_exists => TRUE);"
                )
            )
            logger.info("Hypertable 'server_metrics' verified/created.")
        except Exception as e:
            logger.warning(f"TimescaleDB hypertable initialization note: {e}")
