import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import CheckInGate from "@/components/CheckIn/CheckInGate";

export const metadata: Metadata = {
  title: "Web Assistant",
  description: "Your daily mobile assistant with Balance Tracker and reconciliation.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#4f46e5",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-50 antialiased min-h-screen selection:bg-indigo-500 selection:text-white">
        {/* Mobile Viewport Container Shell */}
        <div className="max-w-md mx-auto min-h-screen bg-slate-50 dark:bg-slate-900/90 shadow-2xl relative flex flex-col border-x border-slate-200/60 dark:border-slate-800">
          <main className="flex-1 pb-24">{children}</main>
          <BottomNav />
          <CheckInGate />
        </div>
      </body>
    </html>
  );
}
