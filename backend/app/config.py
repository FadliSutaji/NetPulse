import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "NetPulse"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "netpulse-dev-secret-key-please-change-in-prod-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 jam

    # Database: Default ke SQLite lokal jika jalan tanpa Docker, atau PostgreSQL/TimescaleDB via ENV
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "sqlite+aiosqlite:///./netpulse_local.db",
    )

    # CORS
    CORS_ORIGINS: List[str] = [x.strip() for x in os.getenv("CORS_ORIGINS", "*").split(",")]

    # Alert Thresholds
    ALERT_CPU_THRESHOLD: float = float(os.getenv("ALERT_CPU_THRESHOLD", "85.0"))
    ALERT_RAM_THRESHOLD: float = float(os.getenv("ALERT_RAM_THRESHOLD", "90.0"))
    DEADMAN_TIMEOUT_SECONDS: int = int(os.getenv("DEADMAN_TIMEOUT_SECONDS", "30"))

    # Notifiers
    TELEGRAM_BOT_TOKEN: str = os.getenv("TELEGRAM_BOT_TOKEN", "")
    TELEGRAM_CHAT_ID: str = os.getenv("TELEGRAM_CHAT_ID", "")
    DISCORD_WEBHOOK_URL: str = os.getenv("DISCORD_WEBHOOK_URL", "")

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")


settings = Settings()
