import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine, init_timescaledb
from app.routers.alerts import router as alerts_router
from app.routers.auth import router as auth_router
from app.routers.ingest import router as ingest_router
from app.routers.metrics import router as metrics_router
from app.routers.servers import router as servers_router
from app.services.alert_worker import alert_background_loop


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Buat tabel database relasional
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # 2. Inisialisasi ekstensi TimescaleDB & Hypertable
    await init_timescaledb()

    # 3. Jalankan Background Alert Worker
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
    allow_origins=settings.CORS_ORIGINS,
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
