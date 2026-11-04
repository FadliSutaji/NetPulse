# Spesifikasi Teknis & Pembagian Tugas — NetPulse

> **Proyek:** NetPulse — Layanan Cloud Monitoring Server  
> **Repository:** Monorepo (`netpulse`)  
> **Project Lead / QA:** Fadli Sutaji Muidita  
> **Tim Pengembang:** Fadli Sutaji Muidita, Haikal, Reihan  
> **Database:** PostgreSQL 16 + TimescaleDB Extension  
> **Target Rilis MVP:** Versi 1.0 (Core Resource Metrics: CPU & RAM)  

---

## 1. Arsitektur Sistem

```
┌─────────────────────────────────┐
│     Target Server (Linux)       │
│  ┌───────────────────────────┐  │
│  │   NetPulse Agent (Python) │  │
│  │  - psutil probe           │  │
│  │  - Interval: 10s          │  │
│  └─────────────┬─────────────┘  │
└────────────────┼────────────────┘
                 │ HTTP POST /api/v1/ingest (Header: X-Server-Key)
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                 NetPulse Cloud Backend (FastAPI)            │
│  ┌─────────────────────────┐   ┌─────────────────────────┐  │
│  │  Ingestion & Auth API   │   │  Alert Evaluation Engine│  │
│  │  - Validasi X-Server-Key│   │  - Deadman's Switch     │  │
│  │  - Update last_seen_at  │   │  - Threshold CPU & RAM  │  │
│  └─────────────┬───────────┘   └────────────┬────────────┘  │
└────────────────┼────────────────────────────┼───────────────┘
                 │                            │
                 ▼                            ▼
┌────────────────────────────────┐   ┌────────────────────────┐
│ PostgreSQL 16 + TimescaleDB    │   │ Notifier Service       │
│  - servers (tabel metadata)    │   │  - Telegram Bot API    │
│  - server_metrics (hypertable) │   │  - Discord Webhook     │
│  - alert_logs                  │   └────────────────────────┘
└────────────────┬───────────────┘
                 │ REST API /api/v1/metrics
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                 Web Dashboard (Next.js / React)             │
│  - Tampilan Status Server (Online / Offline / Warning)      │
│  - Grafik Realtime CPU Usage (%) & RAM (Usage %, Used/Total)│
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Strategi Branching (Git Workflow)

Setiap anggota tim **dilarang langsung commit ke branch `main` atau `develop`**.

```
feature/backend-core (Fadli)    ──┐
feature/agent-ingest (Haikal)   ──┼──▶ develop (QA & Integration) ──▶ main (Production MVP)
feature/dashboard-alerts (Reihan) ┘
```

| Branch | Fungsi & Aturan |
|---|---|
| `main` | Branch produksi. Hanya di-merge dari `develop` oleh Lead (Fadli) setelah pengujian rilis MVP. |
| `develop` | Branch integrasi harian. Semua Pull Request (PR) diarahkan ke sini. |
| `feature/backend-core` | Modul auth, server registration, database setup & TimescaleDB init (Fadli). |
| `feature/agent-ingest` | Modul python agent & endpoint ingest data telemetri (Haikal). |
| `feature/dashboard-alerts` | Modul web dashboard & background worker alert / notifikasi (Reihan). |

---

## 3. Struktur Direktori Proyek (Monorepo)

```text
netpulse/
├── .github/
│   └── workflows/
│       └── ci.yml                     ← Lead (Linting & Docker build check)
├── agent/                             ← Haikal (feature/agent-ingest)
│   ├── agent.py                       ← Program utama pembaca metrik
│   ├── config.json.example            ← Contoh konfigurasi agent
│   ├── requirements.txt               ← Dependensi agent (psutil, httpx)
│   └── README.md                      ← Panduan menjalankan agent di server target
├── backend/                           ← Fadli & Haikal & Reihan
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py              ← Konfigurasi ENV Pydantic (Fadli)
│   │   │   ├── security.py            ← Hash password, JWT, API Key generator (Fadli)
│   │   │   └── deps.py                ← Dependency injection: get_db, auth_user, verify_agent (Fadli)
│   │   ├── database.py                ← Engine Async SQLAlchemy & Timescale hypertable init (Fadli)
│   │   ├── models/
│   │   │   ├── user.py                ← Tabel users (Fadli)
│   │   │   ├── server.py              ← Tabel servers (Fadli)
│   │   │   ├── metric.py              ← Hypertable server_metrics (Haikal)
│   │   │   └── alert.py               ← Tabel alert_logs & alert_rules (Reihan)
│   │   ├── schemas/
│   │   │   ├── auth.py                ← Skema UserRegister, UserLogin, Token (Fadli)
│   │   │   ├── server.py              ← Skema ServerCreate, ServerResponse (Fadli)
│   │   │   ├── metric.py              ← Skema IngestPayload, MetricSeriesResponse (Haikal)
│   │   │   └── alert.py               ← Skema AlertLogResponse (Reihan)
│   │   ├── routers/
│   │   │   ├── auth.py                ← /api/v1/auth (Fadli)
│   │   │   ├── servers.py             ← /api/v1/servers (Fadli)
│   │   │   ├── ingest.py              ← /api/v1/ingest (Haikal)
│   │   │   ├── metrics.py             ← /api/v1/metrics (Haikal)
│   │   │   └── alerts.py              ← /api/v1/alerts (Reihan)
│   │   ├── services/
│   │   │   ├── alert_worker.py        ← Pengecek berkala threshold & deadman's switch (Reihan)
│   │   │   └── notifier.py            ← Pengirim Telegram Bot & Discord Webhook (Reihan)
│   │   └── main.py                    ← Entry point FastAPI & route aggregator (Fadli)
│   ├── Dockerfile                     ← Lead (Fadli)
│   ├── requirements.txt               ← Lead (Fadli)
│   └── .env.example                   ← Lead (Fadli)
├── frontend/                          ← Reihan (feature/dashboard-alerts)
│   ├── src/                           ← Next.js / React application
│   ├── package.json
│   └── README.md
├── docker-compose.yml                 ← Setup TimescaleDB + Backend + Frontend lokal
├── .gitignore
├── README.md
└── spec.md
```

---

## 4. Skema Database (PostgreSQL + TimescaleDB)

### 4.1. Tabel `users`
Menyimpan akun tim/operator yang berhak membuka dashboard web.
- `id`: UUID / Integer (Primary Key)
- `email`: VARCHAR(255) (Unique, Not Null)
- `username`: VARCHAR(100) (Unique, Not Null)
- `hashed_password`: VARCHAR(255) (Not Null)
- `role`: VARCHAR(50) (Default: `"admin"`)
- `created_at`: TIMESTAMPTZ (Default: `NOW()`)

### 4.2. Tabel `servers`
Menyimpan identitas server yang dipantau.
- `id`: UUID / String (Primary Key)
- `name`: VARCHAR(100) (Nama server, contoh: `"Web-Server-Prod-01"`)
- `ip_address`: VARCHAR(45) (IP server target)
- `api_key`: VARCHAR(128) (Token unik rahasia yang dimasukkan ke agent config)
- `status`: VARCHAR(20) (`"ONLINE"`, `"OFFLINE"`, `"WARNING"`)
- `last_seen_at`: TIMESTAMPTZ (Waktu terakhir menerima heartbeat dari agent)
- `created_at`: TIMESTAMPTZ (Default: `NOW()`)

### 4.3. Hypertable `server_metrics` (TimescaleDB)
Tabel time-series untuk histori performa server.
```sql
CREATE TABLE server_metrics (
    time TIMESTAMPTZ NOT NULL,
    server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
    cpu_percent DOUBLE PRECISION NOT NULL,
    cpu_cores INT NOT NULL,
    ram_percent DOUBLE PRECISION NOT NULL,
    ram_used_bytes BIGINT NOT NULL,
    ram_total_bytes BIGINT NOT NULL
);

-- Konversi menjadi hypertable terpartisi berdasarkan waktu:
SELECT create_hypertable('server_metrics', 'time', if_not_exists => TRUE);
```

### 4.4. Tabel `alert_logs`
Riwayat peringatan yang pernah dipicu oleh sistem.
- `id`: BIGSERIAL (Primary Key)
- `server_id`: UUID (Foreign Key ke `servers`)
- `alert_type`: VARCHAR(50) (`"HIGH_CPU"`, `"HIGH_RAM"`, `"SERVER_DOWN"`)
- `severity`: VARCHAR(20) (`"CRITICAL"`, `"WARNING"`, `"RESOLVED"`)
- `message`: TEXT
- `triggered_at`: TIMESTAMPTZ (Default: `NOW()`)
- `resolved_at`: TIMESTAMPTZ (Nullable)

---

## 5. Kontrak Data Telemetri (Agent ➔ Backend Ingestion)

### 5.1. Header Permintaan
```http
POST /api/v1/ingest
Content-Type: application/json
X-Server-Key: np_sec_xxxxxxxxxxxxxxxxxxxxxx
```

### 5.2. Payload JSON (Core Tahap 1)
```json
{
  "timestamp": 1730773800,
  "metrics": {
    "cpu": {
      "percent": 42.5,
      "cores": 4
    },
    "memory": {
      "percent": 68.2,
      "used_bytes": 5857214464,
      "total_bytes": 8589934592
    }
  }
}
```

### 5.3. Respons Sukses Backend
```json
{
  "status": "success",
  "received_at": "2026-11-05T02:30:00Z"
}
```

---

## 6. Pembagian Tugas Anggota Tim Secara Rinci

---

### A. Fadli Sutaji Muidita — `feature/backend-core` (Project Lead & QA)
**Tanggung jawab:** Fondasi backend, konfigurasi database TimescaleDB, autentikasi pengguna, manajemen server, dan integrasi branch tim.

1. **Setup Awal & Infrastruktur:**
   - Menyusun `backend/app/main.py`, `backend/app/config.py`, `backend/app/database.py`.
   - Membuat `docker-compose.yml` (TimescaleDB container dengan extension aktif + FastAPI app).
   - Inisialisasi hypertable TimescaleDB saat startup aplikasi.
2. **Modul Keamanan & Dependensi (`backend/app/core/`):**
   - `security.py`: Password hashing (bcrypt), token JWT encode/decode, fungsi generator `api_key` server (`secrets.token_urlsafe(32)`).
   - `deps.py`: `get_db()`, `get_current_user()`.
3. **Modul Database & Schema:**
   - `models/user.py` & `schemas/auth.py`
   - `models/server.py` & `schemas/server.py`
4. **Router Endpoint yang Wajib Dibuat:**
   | Method | Endpoint | Auth | Deskripsi |
   |---|---|---|---|
   | `POST` | `/api/v1/auth/register` | Public | Mendaftarkan akun admin/operator |
   | `POST` | `/api/v1/auth/login` | Public | Login dan memperoleh access token JWT |
   | `GET` | `/api/v1/auth/me` | JWT | Melihat profil user yang aktif |
   | `GET` | `/api/v1/servers` | JWT | Menampilkan seluruh server yang terdaftar |
   | `POST` | `/api/v1/servers` | JWT | Mendaftarkan server baru & menghasilkan `api_key` |
   | `DELETE` | `/api/v1/servers/{server_id}` | JWT | Menghapus server dari monitoring |

---

### B. Haikal — `feature/agent-ingest` (Agent & Ingestion Specialist)
**Tanggung jawab:** Program agen pengumpul metrik sistem di Linux dan endpoint ingest cepat di backend.

1. **Pembuatan Monitoring Agent (`agent/`):**
   - Program `agent.py`: Memanfaatkan library `psutil` untuk membaca:
     - `psutil.cpu_percent(interval=1)`
     - `psutil.cpu_count(logical=True)`
     - `psutil.virtual_memory()` (percent, used, total)
   - Membaca konfigurasi dari `config.json` (berisi: `api_url`, `server_key`, `interval_seconds=10`).
   - Loop pengiriman background HTTP POST menggunakan `httpx` atau `requests`.
   - Penanganan error: jika backend tidak bisa dihubungi, lakukan retry tanpa membuat agent *crash*.
2. **Backend Telemetry Ingestion (`backend/app/routers/ingest.py`):**
   - Validasi header `X-Server-Key` terhadap tabel `servers`.
   - Update `last_seen_at = NOW()` dan `status = 'ONLINE'` pada tabel `servers`.
   - Insert batch metrik ke hypertable `server_metrics`.
3. **Endpoint Query Metrik (`backend/app/routers/metrics.py`):**
   | Method | Endpoint | Auth | Deskripsi |
   |---|---|---|---|
   | `POST` | `/api/v1/ingest` | `X-Server-Key` | Ditembak berkala oleh Agent (Payload metrik) |
   | `GET` | `/api/v1/metrics/{server_id}/latest` | JWT | Mengambil metrik terakhir untuk kartu realtime |
   | `GET` | `/api/v1/metrics/{server_id}/history` | JWT | Mengambil data metrik rentang waktu (1 jam / 24 jam) untuk grafik |

---

### C. Reihan — `feature/dashboard-alerts` (Frontend & Alerting Specialist)
**Tanggung jawab:** Web Dashboard modern untuk visualisasi data dan background worker alert (Deadman's Switch & threshold) ke Telegram/Discord.

1. **Layanan Alerting & Notifier (`backend/app/services/`):**
   - `notifier.py`: Mengirim pesan alert terformat ke:
     - **Telegram Bot API**: `https://api.telegram.org/bot<TOKEN>/sendMessage`
     - **Discord Webhook**: `POST <WEBHOOK_URL>`
   - `alert_worker.py`: Background loop (jalan berkala tiap 15 detik):
     - **Deadman's Switch:** Cek semua server di DB. Jika `NOW() - last_seen_at > 30 detik` dan status masih `ONLINE`, ubah status jadi `OFFLINE` dan kirim notifikasi: `⚠️ Server [Nama] OFFLINE: Tidak mengirim data > 30 detik!`.
     - **Threshold Check:** Jika CPU > 85% atau RAM > 90% selama 3 data berturut-turut, picu notifikasi `🔥 Server [Nama] High Resource Usage!`.
     - Catat log ke tabel `alert_logs`.
2. **Router Alert Backend (`backend/app/routers/alerts.py`):**
   | Method | Endpoint | Auth | Deskripsi |
   |---|---|---|---|
   | `GET` | `/api/v1/alerts/logs` | JWT | Menampilkan riwayat peringatan yang pernah terjadi |
3. **Frontend Dashboard (`frontend/`):**
   - Framework: **Next.js / React + Tailwind CSS + Recharts**.
   - Halaman 1: **Login & Register**.
   - Halaman 2: **Daftar Server** (Tabel nama server, IP, status badge ONLINE/OFFLINE, waktu terakhir aktif).
   - Halaman 3: **Detail Server & Visualisasi**:
     - Widget ringkasan angka: CPU saat ini, RAM terpakai / total.
     - Grafik garis (Line Chart) tren CPU 1 jam terakhir.
     - Grafik garis tren RAM 1 jam terakhir.
     - Tombol copy token `X-Server-Key` dan contoh cara jalan agent.

---

## 7. Rencana Tahapan Pengembangan (Roadmap Sprint)

- **Sprint 1 (Fondasi & Setup):**
  - Fadli menyiapkan Monorepo, database TimescaleDB, dan modul Auth.
  - Haikal membuat prototype script agent pembaca CPU & RAM.
  - Reihan menyiapkan layout Next.js / Tailwind.
- **Sprint 2 (Pipeline Ingest & Storage):**
  - Haikal menghubungkan pengiriman data Agent ke endpoint `/api/v1/ingest`.
  - Data berhasil tersimpan rapi di hypertable TimescaleDB.
  - Fadli menguji performa ingest dan query time-series.
- **Sprint 3 (Visualisasi & Alert System):**
  - Reihan menghubungkan grafik Recharts ke endpoint data riwayat metrik.
  - Reihan mengaktifkan notifikasi Telegram Bot dan Discord Webhook saat server mati (deadman switch).
- **Sprint 4 (Integrasi & Uji Coba Demo):**
  - Pengujian end-to-end: Jalankan backend di Docker, jalankan agent di VM Ubuntu, matikan agent paksa untuk memastikan bot Telegram berbunyi dan status dashboard berubah menjadi merah (OFFLINE).
