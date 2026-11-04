# NetPulse Monitoring Agent

Agen monitoring ringan berbasis Python untuk server target (Linux / Ubuntu / Debian).

## Cara Menjalankan

1. **Install Dependensi:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Buat Konfigurasi:**
   Salin `config.json.example` menjadi `config.json`:
   ```bash
   cp config.json.example config.json
   ```

3. **Isi `server_key`:**
   Dapatkan `server_key` dari Dashboard Web NetPulse setelah mendaftarkan server, lalu masukkan ke dalam `config.json`:
   ```json
   {
     "api_url": "http://<IP_BACKEND>:8000/api/v1/ingest",
     "server_key": "np_sec_xxxxxxxxxxxxxxxxxxxxxx",
     "interval_seconds": 10
   }
   ```

4. **Jalankan Agen:**
   ```bash
   python3 agent.py
   ```
