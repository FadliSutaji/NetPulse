import os
from pathlib import Path
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_BASE_DIR = Path(__file__).resolve().parent.parent
_DEFAULT_DB_PATH = (_BASE_DIR / "netpulse_local.db").as_posix()


class Settings(BaseSettings):
    PROJECT_NAME: str = "NetPulse"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "netpulse-dev-secret-key-please-change-in-prod-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 jam

    # Database: Default ke SQLite lokal relatif terhadap backend jika jalan tanpa Docker, atau PostgreSQL/TimescaleDB via ENV
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        f"sqlite+aiosqlite:///{_DEFAULT_DB_PATH}",
    )

    # CORS
    CORS_ORIGINS: List[str] = ["*"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return ["*"]

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
