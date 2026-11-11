"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  Bell,
  Check,
  Copy,
  Cpu,
  HardDrive,
  Plus,
  RefreshCw,
  Server,
  Trash2,
  Wifi,
  WifiOff,
  X,
  ArrowUpRight,
} from "lucide-react";
import {
  AlertLogItem,
  createServerApi,
  deleteServerApi,
  fetchAlertLogs,
  fetchServerMetrics,
  fetchServers,
  getAuthSession,
  MetricPoint,
  ServerItem,
} from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const [servers, setServers] = useState<ServerItem[]>([]);
  const [latestMap, setLatestMap] = useState<Record<string, MetricPoint | null>>({});
  const [alerts, setAlerts] = useState<AlertLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Tambah Server
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newServerName, setNewServerName] = useState("");
  const [newServerIp, setNewServerIp] = useState("");
  const [createdServer, setCreatedServer] = useState<ServerItem | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const loadDashboardData = useCallback(async () => {
    const srvList = await fetchServers();
    setServers(srvList);

    const metricsObj: Record<string, MetricPoint | null> = {};
    await Promise.all(
      srvList.map(async (srv) => {
        const { latest } = await fetchServerMetrics(srv.id);
        metricsObj[srv.id] = latest;
      })
    );
    setLatestMap(metricsObj);

    const alertList = await fetchAlertLogs();
    setAlerts(alertList);
    setLoading(false);
  }, []);

  useEffect(() => {
    const { token } = getAuthSession();
    if (!token) {
      router.replace("/login");
      return;
    }
    loadDashboardData();
    const timer = setInterval(loadDashboardData, 6000);
    return () => clearInterval(timer);
  }, [router, loadDashboardData]);

  const handleCreateServer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServerName.trim()) return;
    const created = await createServerApi(
      newServerName.trim(),
      newServerIp.trim() || "103.150.10.30"
    );
    setCreatedServer(created);
    setNewServerName("");
    setNewServerIp("");
    await loadDashboardData();
  };

  const handleDeleteServer = async (id: string, name: string) => {
    if (!confirm(`Hapus server "${name}" dari pemantauan NetPulse?`)) return;
    await deleteServerApi(id);
    await loadDashboardData();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const onlineCount = servers.filter((s) => s.status === "ONLINE").length;
  const warningCount = servers.filter((s) => s.status === "WARNING").length;
  const offlineCount = servers.filter((s) => s.status === "OFFLINE").length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header Bar */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Cloud Server Fleet Overview
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Pemantauan metrik CPU, RAM, dan status Heartbeat secara real-time (Interval 10 detik)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadDashboardData}
            className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
          >
            <RefreshCw className="h-3.5 w-3.5 text-emerald-400" />
            Refresh
          </button>

          <button
            onClick={() => {
              setCreatedServer(null);
              setIsAddOpen(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition"
          >
            <Plus className="h-4 w-4" />
            Tambah Server
          </button>
        </div>
      </div>

      {/* 4 Kartu Ringkasan */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-800/90 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Total Server
            </span>
            <Server className="h-5 w-5 text-slate-400" />
          </div>
          <p className="mt-3 text-3xl font-bold text-white">{servers.length}</p>
          <p className="mt-1 text-xs text-slate-500">Node terdaftar di TimescaleDB</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-emerald-300">
              Server Online
            </span>
            <Wifi className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="mt-3 text-3xl font-bold text-emerald-400">{onlineCount}</p>
          <p className="mt-1 text-xs text-emerald-300/70">Heartbeat aktif &lt; 30 detik</p>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-amber-300">
              High Load (Warning)
            </span>
            <AlertTriangle className="h-5 w-5 text-amber-400" />
          </div>
          <p className="mt-3 text-3xl font-bold text-amber-400">{warningCount}</p>
          <p className="mt-1 text-xs text-amber-300/70">CPU &gt; 85% atau RAM &gt; 90%</p>
        </div>

        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-rose-300">
              Server Offline
            </span>
            <WifiOff className="h-5 w-5 text-rose-400" />
          </div>
          <p className="mt-3 text-3xl font-bold text-rose-400">{offlineCount}</p>
          <p className="mt-1 text-xs text-rose-300/70">Deadman&apos;s Switch terpicu</p>
        </div>
      </div>

      {/* Daftar Server */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-400" />
            Daftar Target Server & VM
          </h2>
          <span className="text-xs text-slate-400">
            Klik kartu server untuk melihat grafik detail & kontrol simulasi
          </span>
        </div>

        {loading ? (
          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/50 p-12 text-center text-sm text-slate-400">
            Memuat data telemetri server...
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {servers.map((srv) => {
              const metric = latestMap[srv.id];
              const cpu = srv.status === "OFFLINE" ? 0 : metric?.cpu_percent ?? 0;
              const ram = srv.status === "OFFLINE" ? 0 : metric?.ram_percent ?? 0;

              const statusBadge =
                srv.status === "ONLINE"
                  ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                  : srv.status === "WARNING"
                  ? "border-amber-500/40 bg-amber-500/15 text-amber-300"
                  : "border-rose-500/40 bg-rose-500/15 text-rose-300";

              const dotColor =
                srv.status === "ONLINE"
                  ? "bg-emerald-400"
                  : srv.status === "WARNING"
                  ? "bg-amber-400"
                  : "bg-rose-500";

              return (
                <div
                  key={srv.id}
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-800/90 bg-slate-900/70 p-5 hover:border-emerald-500/50 hover:bg-slate-900 transition"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link
                          href={`/servers/${srv.id}`}
                          className="text-base font-bold text-white group-hover:text-emerald-400 transition flex items-center gap-1.5"
                        >
                          {srv.name}
                          <ArrowUpRight className="h-4 w-4 opacity-60 group-hover:opacity-100" />
                        </Link>
                        <p className="mt-0.5 font-mono text-xs text-slate-400">
                          IP: {srv.ip_address || "N/A"}
                        </p>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusBadge}`}
                      >
                        <span className={`h-2 w-2 rounded-full ${dotColor} animate-pulse`} />
                        {srv.status}
                      </span>
                    </div>

                    {/* CPU & RAM Bars */}
                    <div className="mt-5 space-y-3.5">
                      <div>
                        <div className="flex justify-between text-xs">
                          <span className="flex items-center gap-1.5 text-slate-400">
                            <Cpu className="h-3.5 w-3.5 text-sky-400" />
                            CPU Usage ({metric?.cpu_cores || 4} Cores)
                          </span>
                          <span className="font-mono font-semibold text-white">
                            {cpu.toFixed(1)}%
                          </span>
                        </div>
                        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              cpu >= 85
                                ? "bg-rose-500"
                                : cpu >= 70
                                ? "bg-amber-400"
                                : "bg-sky-400"
                            }`}
                            style={{ width: `${Math.min(100, cpu)}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs">
                          <span className="flex items-center gap-1.5 text-slate-400">
                            <HardDrive className="h-3.5 w-3.5 text-purple-400" />
                            RAM Usage
                          </span>
                          <span className="font-mono font-semibold text-white">
                            {ram.toFixed(1)}%
                          </span>
                        </div>
                        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              ram >= 90
                                ? "bg-rose-500"
                                : ram >= 75
                                ? "bg-amber-400"
                                : "bg-purple-400"
                            }`}
                            style={{ width: `${Math.min(100, ram)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-slate-800/80 pt-3.5 text-[11px] text-slate-400">
                    <span>
                      Last seen:{" "}
                      <span className="text-slate-300">
                        {new Date(srv.last_seen_at).toLocaleTimeString("id-ID")}
                      </span>
                    </span>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/servers/${srv.id}`}
                        className="rounded-lg bg-slate-800 px-2.5 py-1 font-medium text-emerald-400 hover:bg-slate-700 transition"
                      >
                        Lihat Grafik
                      </Link>
                      <button
                        onClick={() => handleDeleteServer(srv.id, srv.name)}
                        className="rounded-lg p-1 text-slate-500 hover:bg-rose-500/15 hover:text-rose-400 transition"
                        title="Hapus Server"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tabel Riwayat Alert Telegram / Discord */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Bell className="h-5 w-5 text-amber-400" />
          Riwayat Peringatan Otomatis (Telegram & Discord Alert Logs)
        </h2>

        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-800/90 bg-slate-900/60">
          {alerts.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">
              Belum ada peringatan yang terpicu. Semua server berjalan normal.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 bg-slate-900/90 uppercase text-slate-400">
                  <tr>
                    <th className="px-4 py-3.5">Waktu</th>
                    <th className="px-4 py-3.5">Tipe Alert</th>
                    <th className="px-4 py-3.5">Severity</th>
                    <th className="px-4 py-3.5">Pesan Notifikasi (Telegram / Discord)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {alerts.slice(0, 10).map((item) => (
                    <tr key={item.id} className="hover:bg-slate-900/40">
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-slate-400">
                        {new Date(item.triggered_at).toLocaleString("id-ID")}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-white">
                        {item.alert_type}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            item.severity === "CRITICAL"
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                              : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          }`}
                        >
                          {item.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{item.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Tambah Server Baru */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                Daftarkan Server / VM Baru
              </h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {!createdServer ? (
              <form onSubmit={handleCreateServer} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300">
                    Nama Server / VM Target
                  </label>
                  <input
                    type="text"
                    required
                    value={newServerName}
                    onChange={(e) => setNewServerName(e.target.value)}
                    placeholder="Contoh: VM-Ubuntu-Kelompok-01"
                    className="mt-1.5 block w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300">
                    Alamat IP Server
                  </label>
                  <input
                    type="text"
                    required
                    value={newServerIp}
                    onChange={(e) => setNewServerIp(e.target.value)}
                    placeholder="Contoh: 192.168.1.50 atau 103.150.10.25"
                    className="mt-1.5 block w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
                  >
                    Generate X-Server-Key
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-200">
                  Server <strong>{createdServer.name}</strong> berhasil didaftarkan! Salin{" "}
                  <code>X-Server-Key</code> di bawah ini ke dalam file{" "}
                  <code>agent/config.json</code> di VM Anda.
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400">
                    Secret X-Server-Key:
                  </label>
                  <div className="mt-1.5 flex items-center gap-2">
                    <code className="flex-1 overflow-x-auto rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 font-mono text-xs text-emerald-400">
                      {createdServer.api_key}
                    </code>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(createdServer.api_key || "")}
                      className="flex items-center gap-1.5 rounded-xl bg-slate-800 px-3 py-2.5 text-xs font-medium text-white hover:bg-slate-700"
                    >
                      {copiedKey ? (
                        <>
                          <Check className="h-4 w-4 text-emerald-400" />
                          Tersalin
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400">
                    Contoh isi <code>agent/config.json</code>:
                  </label>
                  <pre className="mt-1.5 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-[11px] text-slate-300">
{`{
  "api_url": "http://localhost:8000/api/v1/ingest",
  "server_key": "${createdServer.api_key}",
  "interval_seconds": 10
}`}
                  </pre>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="rounded-xl bg-emerald-500 px-5 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
                  >
                    Selesai & Tutup
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
