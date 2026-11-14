# Konfigurasi keamanan NetPulse

1. Buat secret baru: `python -c "import secrets; print(secrets.token_urlsafe(48))"`.
2. Backend lokal: salin `backend/.env.example` ke `backend/.env`, isi `SECRET_KEY`
   dan `BOOTSTRAP_ADMIN_PASSWORD` (minimal 12 karakter, maksimal 72 byte UTF-8).
   Hapus baris DATABASE_URL untuk SQLite lokal. Jalankan backend dari folder backend.
3. Docker Compose: simpan variabel tersebut dalam `.env` di root proyek, lalu
   jalankan `docker compose up -d --build`. Compose tidak membaca backend/.env
   untuk interpolasi; konfigurasi database diberikan oleh Compose.
4. Login sebagai admin dengan password bootstrap. Setelah akun dibuat, hapus
   BOOTSTRAP_ADMIN_PASSWORD dari environment. Bootstrap tidak mengganti password
   akun yang sudah menggunakan password selain default lama.
5. Admin lama dengan password admin123 dinonaktifkan saat startup jika bootstrap
   kosong. Isi bootstrap dan restart untuk mengganti password dan mengaktifkannya.
   Audit admin lain yang sudah ada: role akun lama tidak otomatis diturunkan.
6. Cabut token Telegram lama melalui BotFather. Isi token pengganti hanya di
   environment backend: TELEGRAM_BOT_TOKEN dan TELEGRAM_CHAT_ID. Penghapusan dari
   source tidak mencabut token atau menghapusnya dari riwayat Git.

Registrasi publik menghasilkan viewer (baca dashboard). Hanya admin dapat
menambah/menghapus server. Key agent hanya ditampilkan pada respons pembuatan
server, jadi simpan key ketika membuat server.

## Frontend

Di frontend jalankan `npm ci`, lalu `npm run dev`. Produksi: `npm run build`
dan `npm start`. Untuk API lain, isi `.env.local` dengan:

```dotenv
NEXT_PUBLIC_API_URL=https://api.example.com/api/v1
```

Default API adalah hostname browser pada port 8000. `npm run demo` menyajikan
prototipe HTML lama untuk demo lokal. Simulasi tidak mengirim notifikasi Telegram.

## Verifikasi

- Dari backend: `python -m unittest discover -s tests -v` (SQLite in-memory,
  notifikasi dimock, tidak memakai database produksi).
- Dari frontend: `npm run build`.
