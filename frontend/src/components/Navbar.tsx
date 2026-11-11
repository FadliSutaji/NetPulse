"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Activity,
  LogOut,
  Server,
  ShieldCheck,
  Sparkles,
  User as UserIcon,
} from "lucide-react";
import { getAuthSession, logoutUser, User } from "@/lib/api";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [mode, setMode] = useState<"live" | "demo">("demo");

  useEffect(() => {
    const session = getAuthSession();
    setUser(session.user);
    setMode(session.mode);
  }, [pathname]);

  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  const handleLogout = () => {
    logoutUser();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 group-hover:bg-emerald-500/25 transition">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white">
                Net<span className="text-emerald-400">Pulse</span>
              </span>
              <span className="ml-2 hidden rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-400 sm:inline-block">
                v1.0 MVP
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/dashboard"
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                pathname === "/dashboard"
                  ? "bg-slate-800/90 text-emerald-400"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
              }`}
            >
              <Server className="h-4 w-4" />
              Servers & Alerts
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* Mode Indicator Badge */}
          {mode === "live" ? (
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Live Backend API</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Prototype Demo Mode</span>
            </div>
          )}

          {user && (
            <div className="hidden sm:flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-1.5 text-xs text-slate-300">
              <UserIcon className="h-3.5 w-3.5 text-emerald-400" />
              <span className="font-semibold text-white">{user.username}</span>
              <span className="text-slate-500">({user.role})</span>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-300 transition"
            title="Keluar dari sesi"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
