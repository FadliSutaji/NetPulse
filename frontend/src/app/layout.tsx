import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "NetPulse — Cloud Server Monitoring Dashboard",
  description:
    "Platform pemantauan kondisi server real-time (CPU, RAM, Uptime) dengan sistem peringatan otomatis Telegram & Discord.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100">
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
