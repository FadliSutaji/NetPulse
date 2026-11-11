"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuthSession } from "@/lib/api";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const { token } = getAuthSession();
    if (token) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="flex items-center gap-3 text-slate-400">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        <span className="text-sm">Memuat NetPulse Dashboard...</span>
      </div>
    </div>
  );
}
