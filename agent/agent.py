#!/usr/bin/env python3
"""
NetPulse Monitoring Agent (Linux / MVP)
Mengumpulkan metrik performa CPU & RAM dan mengirimkannya secara berkala
ke endpoint ingest NetPulse Cloud.
"""

import json
import logging
import os
import sys
import time
import httpx
import psutil

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("NetPulseAgent")


def load_config(config_path: str = "config.json") -> dict:
    if not os.path.exists(config_path):
        logger.error(f"Berkas konfigurasi '{config_path}' tidak ditemukan!")
        logger.info("Silakan salin 'config.json.example' menjadi 'config.json' dan isi API Key Anda.")
        sys.exit(1)

    with open(config_path, "r", encoding="utf-8") as f:
        return json.load(f)


def collect_metrics() -> dict:
    """Mengambil metrik sistem Core (CPU & RAM)."""
    cpu_percent = psutil.cpu_percent(interval=1)
    cpu_cores = psutil.cpu_count(logical=True) or 1
    mem = psutil.virtual_memory()

    return {
        "timestamp": int(time.time()),
        "metrics": {
            "cpu": {
                "percent": float(cpu_percent),
                "cores": int(cpu_cores),
            },
            "memory": {
                "percent": float(mem.percent),
                "used_bytes": int(mem.used),
                "total_bytes": int(mem.total),
            },
        },
    }


def send_telemetry(client: httpx.Client, url: str, key: str, payload: dict) -> bool:
    headers = {
        "Content-Type": "application/json",
        "X-Server-Key": key,
    }
    try:
        response = client.post(url, json=payload, headers=headers, timeout=5.0)
        if response.status_code == 200:
            logger.info(
                f"Telemetri terkirim! CPU: {payload['metrics']['cpu']['percent']}% | "
                f"RAM: {payload['metrics']['memory']['percent']}%"
            )
            return True
        else:
            logger.warning(f"Gagal mengirim data! Status: {response.status_code} - {response.text}")
            return False
    except httpx.RequestError as exc:
        logger.error(f"Koneksi gagal ke {url}: {exc}")
        return False


def main():
    logger.info("Memulai NetPulse Monitoring Agent...")
    config = load_config()

    api_url = config.get("api_url", "http://localhost:8000/api/v1/ingest")
    server_key = config.get("server_key", "")
    interval = config.get("interval_seconds", 10)

    if not server_key or server_key == "YOUR_SERVER_API_KEY_HERE":
        logger.error("Nilai 'server_key' belum diisi pada config.json!")
        sys.exit(1)

    logger.info(f"Target Ingestion URL : {api_url}")
    logger.info(f"Interval Pengiriman  : {interval} detik")

    with httpx.Client() as client:
        while True:
            try:
                data = collect_metrics()

                # Optional: override nilai CPU/RAM untuk tes alert (isi di config.json)
                if config.get("force_high_cpu") is not None:
                    data["metrics"]["cpu"]["percent"] = float(config["force_high_cpu"])
                if config.get("force_high_ram") is not None:
                    data["metrics"]["memory"]["percent"] = float(config["force_high_ram"])

                send_telemetry(client, api_url, server_key, data)
            except KeyboardInterrupt:
                logger.info("Agen dihentikan oleh pengguna.")
                break
            except Exception as e:
                logger.exception(f"Terjadi kesalahan tak terduga: {e}")

            time.sleep(interval)


if __name__ == "__main__":
    main()
