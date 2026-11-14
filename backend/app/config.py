import os
from pathlib import Path
from typing import List
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_BASE_DIR = Path(__file__).resolve().parent.parent
_DEFAULT_DB_PATH = (_BASE_DIR / "netpulse_local.db").as_posix()


class Settings(BaseSettings):
    PROJECT_NAME: str = "NetPulse"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = Field(min_length=32)
    BOOTSTRAP_ADMIN_PASSWORD: str = ""

    @field_validator("SECRET_KEY")
    @classmethod
    def reject_published_secret(cls, value: str) -> str:
        if value in {"netpulse-dev-secret-key-please-change-in-prod-2026", "netpulse-super-secret-key-2026", "ganti-dengan-kunci-rahasia-jwt-32-karakter-acak"}:
            raise ValueError("Generate a new random SECRET_KEY")
        return value

    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 jam

    # Database: Default ke SQLite lokal relatif terhadap backend jika jalan tanpa Docker, atau PostgreSQL/TimescaleDB via ENV
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        f"sqlite+aiosqlite:///{_DEFAULT_DB_PATH}",
    )

    # CORS disimpan sebagai string agar Pydantic EnvSettingsSource tidak pernah error parsing
    CORS_ORIGINS: str = "*"

    @property
    def cors_origins_list(self) -> List[str]:
        if not self.CORS_ORIGINS or self.CORS_ORIGINS == "*":
            return ["*"]
        return [i.strip() for i in self.CORS_ORIGINS.split(",") if i.strip()]

    # Alert Thresholds
    ALERT_CPU_THRESHOLD: float = float(os.getenv("ALERT_CPU_THRESHOLD", "85.0"))
    ALERT_RAM_THRESHOLD: float = float(os.getenv("ALERT_RAM_THRESHOLD", "90.0"))
    DEADMAN_TIMEOUT_SECONDS: int = int(os.getenv("DEADMAN_TIMEOUT_SECONDS", "30"))

    # Notifiers
    TELEGRAM_BOT_TOKEN: str = ""
    TELEGRAM_CHAT_ID: str = ""
    DISCORD_WEBHOOK_URL: str = os.getenv("DISCORD_WEBHOOK_URL", "")

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")


settings = Settings()
