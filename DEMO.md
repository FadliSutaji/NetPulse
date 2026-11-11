# NetPulse Demo Guide

## Prerequisites
- **Python 3.10+** (virtualenv recommended) 
- **Node.js 20+** (for the demo UI) 
- **Docker** (optional – we use SQLite fallback, so not mandatory) 
- A **Discord webhook URL** or **Telegram Bot token + chat id** (to receive alerts).

## 1️⃣ Start the backend API
```powershell
# From the repo root
cd netpulse\backend
# If you prefer SQLite (no TimescaleDB), just run:
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```
- Ensure `backend/.env` contains the webhook values, e.g.:
```
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/xxxx/xxxx
# or
TELEGRAM_BOT_TOKEN=123456:ABCdef...
TELEGRAM_CHAT_ID=987654321
```
- Restart the server after any `.env` change.

## 2️⃣ Start the frontend dashboard (demo prototype)
```powershell
cd netpulse\frontend
npm install   # first time only
npm run dev    # serves UI on http://localhost:3000
```
You should see a login screen (default admin/admin123) and then the dashboard.

## 3️⃣ Register a server (once)
- Open Swagger UI: `http://localhost:8000/docs`.
- `POST /api/v1/auth/register` → create a user (e.g. `user@example.com` / `password`).
- `POST /api/v1/auth/login` → copy the **access token**.
- Click **Authorize** in Swagger, paste the token.
- `POST /api/v1/servers` with body:
```json
{
  "name": "Demo‑VM",
  "ip_address": "127.0.0.1"
}
```
- The response contains `api_key`. **Copy it** – you’ll need it for the agent.

## 4️⃣ Configure the agent
1. In `netpulse/agent` copy the template:
```powershell
cp config.json.example config.json
```
2. Edit `config.json`:
```json
{
  "api_url": "http://localhost:8000/api/v1/ingest",
  "server_key": "<PASTE_API_KEY_HERE>",
  "interval_seconds": 10
}
```
3. *(Optional – force high load for testing)* add two extra fields (they are ignored by default):
```json
  "force_high_cpu": 95,
  "force_high_ram": 92
```
4. Save the file.

## 5️⃣ Run the monitoring agent
```powershell
cd netpulse\agent
python agent.py
```
You should see log lines such as:
```
[INFO] Telemetri terkirim! CPU: 12.5% | RAM: 45.2%
```
The dashboard will now show the server card **GREEN (ONLINE)** and live line charts updating every 10 s.

## 6️⃣ Test alerts
### High‑CPU / High‑RAM
- Keep `force_high_cpu` / `force_high_ram` set as in step 4.3 and restart the agent.
- The dashboard will immediately display an **ALERT HIGH_CPU** / **HIGH_RAM** entry and the Discord/Telegram channel will receive a notification.
### Server‑down (dead‑man switch)
- Stop the agent with `Ctrl‑C`.
- After 30 s the backend marks the server **RED (OFFLINE)** and sends a *SERVER DOWN* alert.

## 7️⃣ Add more agents (multiple servers)
- Repeat steps 3–5 with a fresh API key for each new server.
- Each agent can run on a different machine/VM; the dashboard aggregates them all.

## 8️⃣ Clean‑up / stop services
```powershell
# Stop backend (Ctrl‑C in its terminal)
# Stop frontend (Ctrl‑C in its terminal)
# Optionally delete the SQLite DB:
rm netpulse_local.db
```

---
**That’s it!** You now have a fully‑functional NetPulse monitoring prototype that:
- Ingests telemetry via `agent.py`
- Stores metrics in SQLite (or TimescaleDB if you switch Docker‑compose)
- Shows real‑time graphs and server status on the UI
- Sends alerts to Discord/Telegram.

Feel free to ask for any of the following next:
- Guidance on adding the Discord webhook URL
- Adding the high‑load override to `agent.py`
- Switching to the full Next.js frontend instead of the demo prototype
- Persisting the demo steps into a CI script

---