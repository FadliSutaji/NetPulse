import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from app.config import settings
from app.core.security import get_password_hash, verify_password
from app.database import AsyncSessionLocal, Base, engine, init_timescaledb
from app.models.user import User
from app.routers.alerts import router as alerts_router
from app.routers.auth import router as auth_router
from app.routers.ingest import router as ingest_router
from app.routers.metrics import router as metrics_router
from app.routers.servers import router as servers_router
from app.services.alert_worker import alert_background_loop


async def seed_default_admin():
    """Membuat admin hanya jika bootstrap password dikonfigurasi."""
    password = settings.BOOTSTRAP_ADMIN_PASSWORD
    if password and (len(password) < 12 or len(password.encode("utf-8")) > 72):
        raise ValueError("BOOTSTRAP_ADMIN_PASSWORD must contain at least 12 characters")
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.username == "admin"))
        existing = result.scalar_one_or_none()
        if existing and verify_password("admin123", existing.hashed_password):
            # Retire the previously shipped public password on existing installs.
            if password:
                existing.hashed_password = get_password_hash(password)
                existing.is_active = True
            else:
                existing.is_active = False
            await db.commit()
        elif not existing and password:
            default_admin = User(
                username="admin",
                email="admin@netpulse.local",
                hashed_password=get_password_hash(settings.BOOTSTRAP_ADMIN_PASSWORD),
                role="admin",
                is_active=True,
            )
            db.add(default_admin)
            await db.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Buat tabel database relasional
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # 2. Inisialisasi ekstensi TimescaleDB & Hypertable
    await init_timescaledb()

    # 3. Bootstrap admin secara eksplisit jika dikonfigurasi
    await seed_default_admin()

    # 4. Jalankan Background Alert Worker
    alert_task = asyncio.create_task(alert_background_loop())

    yield

    # Cleanup saat shutdown
    alert_task.cancel()
    try:
        await alert_task
    except asyncio.CancelledError:
        pass


app = FastAPI(
    title="NetPulse API",
    description="Backend API Ingestion & Observability Platform — NetPulse Cloud Monitoring",
    version="1.0.0",
    lifespan=lifespan,
)

# Konfigurasi CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrasi Router dengan Prefix /api/v1
api_v1 = settings.API_V1_STR
app.include_router(auth_router, prefix=api_v1)
app.include_router(servers_router, prefix=api_v1)
app.include_router(ingest_router, prefix=api_v1)
app.include_router(metrics_router, prefix=api_v1)
app.include_router(alerts_router, prefix=api_v1)


@app.get("/", tags=["Health"])
async def root():
    return {
        "status": "ok",
        "service": "NetPulse Cloud Monitoring API",
        "version": "1.0.0",
        "docs": "/docs",
    }
