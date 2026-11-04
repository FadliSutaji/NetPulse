# NetPulse Web Dashboard (Frontend)

Modul Web Dashboard untuk NetPulse, dibangun menggunakan **Next.js / React + Tailwind CSS + Recharts**.
Dikerjakan oleh: **Reihan** (`feature/dashboard-alerts`).

---

## 🚀 Panduan Inisialisasi Project

Untuk membuat boilerplate Next.js di dalam direktori `frontend/`:

```bash
# Jalankan di dalam folder netpulse/frontend:
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Install Recharts dan icon library
npm install recharts lucide-react axios
```

---

## 🎨 Halaman Utama yang Perlu Dibuat

1. **Halaman Login (`/login`):**
   - Form Username & Password.
   - Request `POST /api/v1/auth/login`.
   - Simpan JWT token di `localStorage` atau cookies.

2. **Halaman Utama / Servers List (`/dashboard`):**
   - Menampilkan daftar server yang dipantau (`GET /api/v1/servers`).
   - Kartu status: Jumlah Server Online, Warning, dan Offline.
   - Tombol "+ Tambah Server" (Modal form input nama server & copy Server Key).

3. **Halaman Detail Server (`/servers/[id]`):**
   - Kartu metrik realtime (CPU % & RAM terpakai).
   - Grafik garis waktu nyata (**Recharts** `LineChart`) dari `GET /api/v1/metrics/{server_id}/history?minutes=60`.
   - Tabel riwayat alert (`GET /api/v1/alerts/logs?server_id={id}`).

---

## 🔗 Endpoint API Backend
- Base URL (Lokal): `http://localhost:8000/api/v1`
- Swagger Documentation: `http://localhost:8000/docs`
