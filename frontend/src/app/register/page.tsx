"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  Mail,
  Lock,
  User as UserIcon,
  UserPlus,
  AlertCircle,
} from "lucide-react";
import { registerApi } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await registerApi(username.trim(), email.trim(), password);
      router.push("/login");
    } catch (err: any) {
      setError(err.message || "Gagal mendaftarkan akun");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-slate-950 px-4 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400">
          <Activity className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-center text-2xl font-bold tracking-tight text-white">
          Registrasi Operator Net<span className="text-emerald-400">Pulse</span>
        </h1>
        <p className="mt-1.5 text-center text-sm text-slate-400">
          Buat akun baru untuk mengelola monitoring server
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-2xl border border-slate-800/90 bg-slate-900/70 px-6 py-8 shadow-2xl backdrop-blur-sm sm:px-8">
          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3.5 text-xs text-rose-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder="fadli_admin"
                  className="block w-full rounded-xl border border-slate-700/80 bg-slate-950/90 py-2.5 pl-10 pr-3.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-300">
                Email
              </label>
              <div className="relative mt-1.5">
                <Mail className="pointer-events-none absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@netpulse.id"
                  className="block w-full rounded-xl border border-slate-700/80 bg-slate-950/90 py-2.5 pl-10 pr-3.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
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
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="block w-full rounded-xl border border-slate-700/80 bg-slate-950/90 py-2.5 pl-10 pr-3.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50 transition"
            >
              <UserPlus className="h-4 w-4" />
              {loading ? "Mendaftarkan..." : "Daftar Sekarang"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            Sudah punya akun?{" "}
            <Link
              href="/login"
              className="font-semibold text-emerald-400 hover:text-emerald-300"
            >
              Kembali ke Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
