"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  Check,
  Copy,
  Cpu,
  Flame,
  HardDrive,
  PowerOff,
  RefreshCw,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertLogItem,
  fetchAlertLogs,
  fetchServerMetrics,
  fetchServers,
  getAuthSession,
  MetricPoint,
  ServerItem,
  simulateServerCondition,
} from "@/lib/api";

export default function ServerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const serverId = params.id as string;

  const [server, setServer] = useState<ServerItem | null>(null);
  const [latest, setLatest] = useState<MetricPoint | null>(null);
  const [history, setHistory] = useState<MetricPoint[]>([]);
  const [alerts, setAlerts] = useState<AlertLogItem[]>([]);
  const [copied, setCopied] = useState(false);
  const [simNotice, setSimNotice] = useState("");

  const loadDetail = useCallback(async () => {
    const allServers = await fetchServers();
    const found = allServers.find((s) => s.id === serverId) || null;
    setServer(found);

    const { latest: latestPt, history: histSeries } =
      await fetchServerMetrics(serverId);
    setLatest(latestPt);
    setHistory(histSeries);

    const srvAlerts = await fetchAlertLogs(serverId);
    setAlerts(srvAlerts);
  }, [serverId]);

  useEffect(() => {
    const { token } = getAuthSession();
    if (!token) {
      router.replace("/login");
      return;
    }
    loadDetail();
    const interval = setInterval(loadDetail, 4000);
    return () => clearInterval(interval);
  }, [router, loadDetail]);

  const handleSimulate = async (
    cond: "ONLINE" | "WARNING" | "OFFLINE",
    label: string
  ) => {
    await simulateServerCondition(serverId, cond);
    setSimNotice(`Simulasi "${label}" diaktifkan!`);
    await loadDetail();
    setTimeout(() => setSimNotice(""), 3500);
  };

  const copyKey = () => {
    if (!server?.api_key) return;
    navigator.clipboard.writeText(server.api_key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!server) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-center text-slate-400">
        Memuat detail server...
      </div>
    );
  }

  const cpuVal = server.status === "OFFLINE" ? 0 : latest?.cpu_percent ?? 0;
  const ramVal = server.status === "OFFLINE" ? 0 : latest?.ram_percent ?? 0;
  const ramUsedGb =
    server.status === "OFFLINE"
      ? "0.0"
      : ((latest?.ram_used_bytes || 0) / 1024 ** 3).toFixed(2);
  const ramTotalGb = ((latest?.ram_total_bytes || 8589934592) / 1024 ** 3).toFixed(
    1
  );

  const chartData = history.map((pt) => ({
    timeLabel: new Date(pt.time).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
    cpu: pt.cpu_percent,
    ram: pt.ram_percent,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Navigasi Kembali */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-emerald-400 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Daftar Server
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{server.name}</h1>
            <span className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 font-mono text-xs text-slate-300">
              {server.ip_address}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-bold ${
                server.status === "ONLINE"
                  ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                  : server.status === "WARNING"
                  ? "border-amber-500/40 bg-amber-500/15 text-amber-300"
                  : "border-rose-500/40 bg-rose-500/15 text-rose-300"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  server.status === "ONLINE"
                    ? "bg-emerald-400"
                    : server.status === "WARNING"
                    ? "bg-amber-400"
                    : "bg-rose-500"
                } animate-pulse`}
              />
              {server.status}
            </span>
          </div>
        </div>

        {/* Panel Kontrol Simulasi Demo Dosen */}
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/80 p-2.5">
          <span className="px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Simulasi Demo Dosen:
          </span>
          <button
            onClick={() => handleSimulate("ONLINE", "Kondisi Normal")}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/25 transition"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Normal (ONLINE)
          </button>
          <button
            onClick={() => handleSimulate("WARNING", "Lonjakan CPU > 85%")}
            className="flex items-center gap-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 px-3 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-500/25 transition"
          >
            <Flame className="h-3.5 w-3.5" />
            Overload CPU (&gt;85%)
          </button>
          <button
            onClick={() => handleSimulate("OFFLINE", "Server Down / Mati")}
            className="flex items-center gap-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 px-3 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-500/25 transition"
          >
            <PowerOff className="h-3.5 w-3.5" />
            Matikan Server (OFFLINE)
          </button>
        </div>
      </div>

      {simNotice && (
        <div className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-xs font-medium text-emerald-300">
          {simNotice}
        </div>
      )}

      {/* Kartu Ringkasan Metrik Realtime */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>REAL-TIME CPU LOAD</span>
            <Cpu className="h-4 w-4 text-sky-400" />
          </div>
          <p className="mt-2 font-mono text-3xl font-bold text-white">
            {cpuVal.toFixed(1)}%
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Logical Cores: {latest?.cpu_cores || 4} vCPU (Threshold: 85%)
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>REAL-TIME MEMORY (RAM)</span>
            <HardDrive className="h-4 w-4 text-purple-400" />
          </div>
          <p className="mt-2 font-mono text-3xl font-bold text-white">
            {ramVal.toFixed(1)}%
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Terpakai: {ramUsedGb} GB dari {ramTotalGb} GB (Threshold: 90%)
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>AGENT AUTHENTICATION KEY</span>
            <Terminal className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <code className="truncate rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 font-mono text-xs text-emerald-400">
              {server.api_key || "np_sec_configured_on_server"}
            </code>
            {server.api_key && (
              <button
                onClick={copyKey}
                className="rounded-lg bg-slate-800 p-1.5 text-slate-200 hover:bg-slate-700"
                title="Salin X-Server-Key"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Heartbeat Terakhir:{" "}
            <span className="text-slate-200">
              {new Date(server.last_seen_at).toLocaleTimeString("id-ID")}
            </span>
          </p>
        </div>
      </div>

      {/* 2 Grafik Garis Real-Time (CPU & RAM) */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Grafik CPU */}
        <div className="rounded-2xl border border-slate-800/90 bg-slate-900/60 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Cpu className="h-4 w-4 text-sky-400" />
                Tren Penggunaan CPU (%)
              </h3>
              <p className="text-xs text-slate-400">
                Data deret waktu TimescaleDB (Auto-refresh)
              </p>
            </div>
            <RefreshCw className="h-4 w-4 animate-spin text-slate-600" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="timeLabel"
                  stroke="#64748b"
                  fontSize={11}
                  tickMargin={8}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke="#64748b"
                  fontSize={11}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="cpu"
                  name="CPU Usage (%)"
                  stroke="#38bdf8"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#cpuGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grafik RAM */}
        <div className="rounded-2xl border border-slate-800/90 bg-slate-900/60 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-purple-400" />
                Tren Penggunaan Memory / RAM (%)
              </h3>
              <p className="text-xs text-slate-400">
                Kapasitas total: {ramTotalGb} GB
              </p>
            </div>
            <RefreshCw className="h-4 w-4 animate-spin text-slate-600" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="ramGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c084fc" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#c084fc" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="timeLabel"
                  stroke="#64748b"
                  fontSize={11}
                  tickMargin={8}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke="#64748b"
                  fontSize={11}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="ram"
                  name="RAM Usage (%)"
                  stroke="#c084fc"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#ramGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Log Alert Khusus Server Ini */}
      <div className="mt-8">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Bell className="h-4 w-4 text-amber-400" />
          Log Peringatan Server ({server.name})
        </h3>

        <div className="mt-3 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
          {alerts.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              Belum ada insiden pada server ini. Gunakan tombol &quot;Simulasi Demo Dosen&quot; di kanan atas untuk menguji pemicu alert.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 bg-slate-900/90 uppercase text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Waktu</th>
                    <th className="px-4 py-3">Tipe</th>
                    <th className="px-4 py-3">Severity</th>
                    <th className="px-4 py-3">Detail Pesan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {alerts.map((a) => (
                    <tr key={a.id}>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-slate-400">
                        {new Date(a.triggered_at).toLocaleString("id-ID")}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-white">
                        {a.alert_type}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            a.severity === "CRITICAL"
                              ? "bg-rose-500/20 text-rose-300"
                              : "bg-amber-500/20 text-amber-300"
                          }`}
                        >
                          {a.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{a.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
