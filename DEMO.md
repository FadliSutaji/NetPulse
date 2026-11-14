> Panduan prototipe lama. Untuk aplikasi utama, ikuti [SECURITY_SETUP.md](SECURITY_SETUP.md).

# NetPulse — Demo & Deployment Guide

> Real-time Cloud Server Monitoring dengan TimescaleDB, FastAPI, dan Telegram Alerting.

---

## Arsitektur Deployment

```
┌─────────────────────────────────────────────────────────┐
│  Ubuntu VM (Oracle Cloud) — 100.103.223.101 (Tailscale) │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ TimescaleDB  │  │  Backend API │  │  Frontend UI  │  │
│  │ (Docker)     │◄─│  (Docker)    │◄─│  (Node.js)    │  │
│  │ Port: 5432   │  │  Port: 8000  │  │  Port: 3000   │  │
│  └──────────────┘  └──────┬───────┘  └───────────────┘  │
│                           ▲                             │
│                    ┌──────┴───────┐                      │
│                    │  Agent.py    │                      │
│                    │  (venv)      │                      │
│                    └──────────────┘                      │
└─────────────────────────────────────────────────────────┘
         ▲
         │ Tailscale VPN
         ▼
┌─────────────────────────────┐
│  Laptop / PC (Browser)      │
│  http://100.103.223.101:3000│
└─────────────────────────────┘
```

---

## Prerequisites

- **Ubuntu Server 22.04+** (Oracle Cloud VM atau VPS lain)
- **Docker** & **Docker Compose** terinstall
- **Node.js 18+** (untuk frontend)
- **Python 3.10+** dengan `venv` (untuk agent)
- **Tailscale** (opsional, untuk akses remote dari laptop)

---

## 1️⃣ Clone Repository & Jalankan Backend + Database

```bash
# Clone repo
git clone https://github.com/FadliSutaji/NetPulse.git
cd NetPulse
git checkout develop

# Jalankan TimescaleDB + Backend via Docker Compose
sudo docker compose up -d --build

# Verifikasi container berjalan
sudo docker compose ps
# Pastikan: netpulse-db (healthy), netpulse-backend (up)
```

Konfigurasi environment (opsional) di `docker-compose.yml`:
```yaml
environment:
  CORS_ORIGINS: "*"
  TELEGRAM_BOT_TOKEN: "your_bot_token"
  TELEGRAM_CHAT_ID: "your_chat_id"
```

## 2️⃣ Jalankan Frontend Dashboard

```bash
cd frontend
npm install        # pertama kali saja
node server.js &   # serve di port 3000
```

Buka browser: **`http://<IP_SERVER>:3000`**

Login: `admin` / `admin123`

## 3️⃣ Daftarkan Server Target dari Dashboard

1. Klik **"+ Tambah Server / VM Baru"** di dashboard
2. Isi nama server dan IP address
3. Klik **"Generate X-Server-Key"**
4. **Salin API Key** yang muncul (klik tombol 📋 Salin Key)

## 4️⃣ Konfigurasi & Jalankan Agent

```bash
cd /path/to/NetPulse/agent

# Buat virtual environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Konfigurasi agent
cp config.json.example config.json
nano config.json
```

Isi `config.json`:
```json
{
  "api_url": "http://<IP_SERVER>:8000/api/v1/ingest",
  "server_key": "<PASTE_API_KEY_DARI_DASHBOARD>",
  "interval_seconds": 10
}
```

Jalankan agent:
```bash
source venv/bin/activate
python3 agent.py
```

Output yang diharapkan:
```
[INFO] Memulai NetPulse Monitoring Agent...
[INFO] Telemetri terkirim! CPU: 12.5% | RAM: 45.2%
```

Dashboard akan menampilkan server **● ONLINE** dengan grafik CPU & RAM real-time.

## 5️⃣ Test Fitur Alert

### High CPU / High RAM Alert
Tambahkan override di `config.json`:
```json
{
  "api_url": "http://<IP_SERVER>:8000/api/v1/ingest",
  "server_key": "<API_KEY>",
  "interval_seconds": 10,
  "force_high_cpu": 95,
  "force_high_ram": 92
}
```
Restart agent → Dashboard menampilkan **WARNING** + alert log + notifikasi Telegram.

### Deadman's Switch (Server Down Detection)
1. Stop agent: `Ctrl+C`
2. Tunggu ~30 detik
3. Backend otomatis menandai server **● OFFLINE**
4. Alert `SERVER_DOWN` muncul di dashboard dan terkirim ke Telegram

## 6️⃣ Validasi Data di TimescaleDB

```bash
# Query 5 metrik terakhir
sudo docker exec -it netpulse-db psql -U netpulse -d netpulse_db -c \
  "SELECT time, cpu_percent, ram_percent, ram_total_bytes FROM server_metrics ORDER BY time DESC LIMIT 5;"

# Cek jumlah total data metrik
sudo docker exec -it netpulse-db psql -U netpulse -d netpulse_db -c \
  "SELECT COUNT(*) FROM server_metrics;"

# Cek server terdaftar
sudo docker exec -it netpulse-db psql -U netpulse -d netpulse_db -c \
  "SELECT id, name, ip_address, status, last_seen_at FROM servers;"

# Cek alert logs
sudo docker exec -it netpulse-db psql -U netpulse -d netpulse_db -c \
  "SELECT id, server_id, alert_type, severity, message, triggered_at FROM alert_logs ORDER BY triggered_at DESC LIMIT 5;"
```

## 7️⃣ Multi-Server Monitoring

Untuk monitoring beberapa server sekaligus:

1. Daftarkan server baru dari dashboard (ulangi langkah 3)
2. Install agent di setiap target server
3. Masing-masing agent pakai API key unik dari dashboard
4. Dashboard menampilkan semua server dalam satu fleet overview

## 8️⃣ Quick Start Script (Ubuntu VM)

```bash
#!/bin/bash
# start_netpulse.sh - Jalankan semua komponen NetPulse

cd /home/fadli/NetPulse

# Start database + backend
sudo docker compose up -d

# Start frontend
cd frontend
pkill -f "node server.js" 2>/dev/null
nohup node server.js > /tmp/netpulse-frontend.log 2>&1 &

# Start agent
cd ../agent
source venv/bin/activate
nohup python3 agent.py > /tmp/netpulse-agent.log 2>&1 &

echo "✅ NetPulse is running!"
echo "   Dashboard: http://$(hostname -I | awk '{print $1}'):3000"
echo "   Backend:   http://$(hostname -I | awk '{print $1}'):8000/docs"
```

---

## Teknologi yang Digunakan

| Komponen | Teknologi |
|----------|-----------|
| Database | TimescaleDB (PostgreSQL + time-series extension) |
| Backend API | FastAPI (Python) + Uvicorn |
| Frontend | Vanilla JS + Tailwind CSS (single-file prototype) |
| Agent | Python + psutil + httpx |
| Containerization | Docker & Docker Compose |
| Alerting | Telegram Bot API / Discord Webhook |
| Networking | Tailscale VPN |

---

## Tim Pengembang

- **Fadli Sutaji Muidita** — System Architect & DevOps
- **Haikal** — Backend & Database
- **Reihan** — Frontend & UI/UX

---
