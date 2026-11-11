@echo off
title NetPulse Backend & Frontend Runner
echo ====================================================
echo   Menjalankan NetPulse Backend API & Frontend...
echo ====================================================

start "NetPulse Backend API (Port 8000)" cmd /k "cd /d C:\Users\Fadli\Documents\Kulyeah\netpulse\backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000"

start "NetPulse Web Dashboard (Port 3000)" cmd /k "cd /d C:\Users\Fadli\Documents\Kulyeah\netpulse\frontend && node server.js"

echo Kedua server berhasil dibuka di jendela terminal masing-masing!
echo Backend : http://localhost:8000/docs
echo Frontend: http://localhost:3000
