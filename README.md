# NetPulse — Cloud Server Monitoring Service

NetPulse adalah layanan pemantauan kondisi server (*server observability & monitoring*) berbasis cloud. Sistem ini dirancang untuk mengumpulkan metrik performa (*CPU, RAM, Uptime*) dari target server, menyimpannya di database time-series **TimescaleDB**, dan menyajikannya dalam bentuk dashboard interaktif dengan sistem peringatan otomatis (*Telegram & Discord*).

Proyek ini dibangun sebagai solusi monitoring mandiri yang ringan, mudah di-*deploy*, dan andal.

---

## 🛠️ Tech Stack

- **Agent:** Python 3.10+ (`psutil`, `httpx`) — Ringan, periodik 10 detik.
- **Backend API:** FastAPI (Async), SQLAlchemy 2.0 (Asyncpg), Pydantic v2.
- **Database:** PostgreSQL 16 dengan ekstensi **TimescaleDB** (Hypertable time-series).
- **Dashboard:** Next.js / React, Tailwind CSS, Recharts.
- **Alert Channels:** Telegram Bot API & Discord Webhook.
- **Deployment:** Docker & Docker Compose.

---

## 📁 Struktur Monorepo

```text
netpulse/
├── agent/            # Monitoring agent yang dipasang di server target
├── backend/          # FastAPI Ingestion & Core API
├── frontend/         # Web Dashboard (Next.js / React)
├── docker-compose.yml# Orkestrasi backend & TimescaleDB
├── spec.md           # Spesifikasi teknis & pembagian tugas tim
└── README.md
```

---

## 🚀 Panduan Menjalankan Sistem (Local Development)

### 1. Prasyarat
- [Docker](https://www.docker.com/) & Docker Compose
- Python 3.10+ (untuk menjalankan agent atau backend secara lokal)

### 2. Menjalankan Database & Backend dengan Docker Compose
```bash
# Masuk ke direktori proyek
cd netpulse

# Salin berkas env contoh
cp backend/.env.example backend/.env

# Jalankan database TimescaleDB dan Backend API
docker compose up -d --build
```
Setelah aktif:
- Backend Swagger API Docs: `http://localhost:8000/docs`
- TimescaleDB port: `5432`

### 3. Menjalankan Monitoring Agent
```bash
cd agent
pip install -r requirements.txt
cp config.json.example config.json

# Sesuaikan API URL dan Server Key di config.json
python agent.py
```

---

## 👥 Tim Pengembang

- **Fadli Sutaji Muidita** — Project Lead & Core Backend (`feature/backend-core`)
- **Haikal** — Monitoring Agent & Telemetry Ingestion (`feature/agent-ingest`)
- **Reihan** — Frontend Dashboard & Alert Notifier (`feature/dashboard-alerts`)

Silakan lihat berkas **[`spec.md`](spec.md)** untuk detail pembagian tugas, kontrak API, dan arsitektur database.
