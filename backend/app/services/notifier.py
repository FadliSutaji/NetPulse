import logging
import httpx
from app.config import settings

logger = logging.getLogger("NetPulse.Notifier")


async def send_telegram_alert(message: str) -> bool:
    if not settings.TELEGRAM_BOT_TOKEN or not settings.TELEGRAM_CHAT_ID:
        return False

    url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": settings.TELEGRAM_CHAT_ID,
        "text": message,
        "parse_mode": "Markdown",
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code != 200:
                logger.warning("Telegram menolak notifikasi (HTTP %s)", resp.status_code)
                return False
            return True
    except Exception as e:
        logger.error("Gagal kirim notifikasi Telegram: %s", type(e).__name__)
        return False


async def send_discord_alert(message: str) -> bool:
    if not settings.DISCORD_WEBHOOK_URL:
        return False

    payload = {"content": message}
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(settings.DISCORD_WEBHOOK_URL, json=payload)
            return resp.status_code in (200, 204)
    except Exception as e:
        logger.error(f"Gagal kirim notifikasi Discord: {e}")
        return False


async def notify_all(message: str):
    """Mengirim pesan alert serentak ke Telegram dan Discord jika dikonfigurasi."""
    logger.warning(f"[ALERT TRIGGERED] {message}")
    await send_telegram_alert(message)
    await send_discord_alert(message)
