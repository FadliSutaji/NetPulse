import asyncio
import logging
from datetime import datetime, timedelta, timezone
from sqlalchemy import select
from app.config import settings
from app.database import AsyncSessionLocal
from app.models.server import Server
from app.models.alert import AlertLog
from app.services.notifier import notify_all

logger = logging.getLogger("NetPulse.AlertWorker")


async def run_alert_check_cycle():
    """Memeriksa heartbeat server (deadman's switch) dan status kesehatan."""
    async with AsyncSessionLocal() as db:
        now = datetime.now(timezone.utc)
        timeout_threshold = now - timedelta(seconds=settings.DEADMAN_TIMEOUT_SECONDS)
        wib_time = datetime.now(timezone(timedelta(hours=7))).strftime("%Y-%m-%d %H:%M:%S WIB")

        # 1. Deadman's Switch: Deteksi server yang berhenti kirim heartbeat
        query_offline = (
            select(Server)
            .where(Server.status.in_(["ONLINE", "WARNING"]))
            .where(Server.last_seen_at < timeout_threshold)
        )
        result = await db.execute(query_offline)
        offline_servers = result.scalars().all()

        for srv in offline_servers:
            srv.status = "OFFLINE"
            msg = (
                f"🚨 *[ALERT] SERVER DOWN*\n\n"
                f"• *Server:* `{srv.name}`\n"
                f"• *IP:* `{srv.ip_address or 'N/A'}`\n"
                f"• *Status:* `OFFLINE`\n"
                f"• *Catatan:* Tidak mengirim telemetri > {settings.DEADMAN_TIMEOUT_SECONDS} detik.\n"
                f"• *Waktu:* `{wib_time}`"
            )
            # Simpan log
            alert_entry = AlertLog(
                server_id=srv.id,
                alert_type="SERVER_DOWN",
                severity="CRITICAL",
                message=msg,
            )
            db.add(alert_entry)
            await notify_all(msg)

        if offline_servers:
            await db.commit()


async def alert_background_loop():
    """Background task yang berjalan secara berkala di lifecycle FastAPI."""
    logger.info(f"Background Alert Worker aktif (Interval cek: 15 detik, Deadman timeout: {settings.DEADMAN_TIMEOUT_SECONDS}s)")
    while True:
        try:
            await run_alert_check_cycle()
        except asyncio.CancelledError:
            logger.info("Alert Worker dihentikan.")
            break
        except Exception as e:
            logger.error(f"Error pada siklus Alert Worker: {e}")
        await asyncio.sleep(15)
