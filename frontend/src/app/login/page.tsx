"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  KeyRound,
  Lock,
  Sparkles,
  User as UserIcon,
  AlertCircle,
} from "lucide-react";
import { loginApi } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await loginApi(username.trim(), password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Gagal melakukan login");
    } finally {
      setLoading(false);
    }
  };

  const fillDefaultAdmin = () => {
    setUsername("admin");
    setPassword("admin123");
    setError("");
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-slate-950 px-4 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 shadow-lg shadow-emerald-500/10">
          <Activity className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-center text-2xl font-bold tracking-tight text-white">
          Net<span className="text-emerald-400">Pulse</span> Cloud Monitoring
        </h1>
        <p className="mt-1.5 text-center text-sm text-slate-400">
          Server Observability, TimescaleDB Telemetry & Telegram Alerting
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-2xl border border-slate-800/90 bg-slate-900/70 px-6 py-8 shadow-2xl backdrop-blur-sm sm:px-8">
          {/* Info Box Akun Default Dosen/Admin */}
          <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-200">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-semibold text-emerald-300">
                <Sparkles className="h-4 w-4" />
                Akun Default Prototype Siap Pakai:
              </span>
              <button
                type="button"
                onClick={fillDefaultAdmin}
                className="rounded bg-emerald-500/20 px-2 py-0.5 text-[11px] font-medium text-emerald-300 hover:bg-emerald-500/30 transition"
              >
                Isi Otomatis
              </button>
            </div>
            <div className="mt-1.5 flex items-center gap-4 text-slate-300">
              <span>
                Username: <code className="font-bold text-white">admin</code>
              </span>
              <span>
                Password: <code className="font-bold text-white">admin123</code>
              </span>
            </div>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3.5 text-xs text-rose-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-300">
                Username
              </label>
              <div className="relative mt-1.5">
                <UserIcon className="pointer-events-none absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="block w-full rounded-xl border border-slate-700/80 bg-slate-950/90 py-2.5 pl-10 pr-3.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-300">
                Password
              </label>
              <div className="relative mt-1.5">
                <Lock className="pointer-events-none absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full rounded-xl border border-slate-700/80 bg-slate-950/90 py-2.5 pl-10 pr-3.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 disabled:opacity-50 transition"
            >
              <KeyRound className="h-4 w-4" />
              {loading ? "Memverifikasi..." : "Masuk ke Dashboard"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            Belum punya akun operator tambahan?{" "}
            <Link
              href="/register"
              className="font-semibold text-emerald-400 hover:text-emerald-300"
            >
              Daftar Akun Baru
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
