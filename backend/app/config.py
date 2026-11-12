import os
from pathlib import Path
from typing import List
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
    TELEGRAM_BOT_TOKEN: str = os.getenv(
        "TELEGRAM_BOT_TOKEN",
        "9072021490:AAEwiyVaxeyrwd0-q-2HksOfnQsun3UqyUk",
    )
    TELEGRAM_CHAT_ID: str = os.getenv("TELEGRAM_CHAT_ID", "-5527206156")
    DISCORD_WEBHOOK_URL: str = os.getenv("DISCORD_WEBHOOK_URL", "")

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")


settings = Settings()
