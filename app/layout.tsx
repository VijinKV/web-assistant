import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

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
  themeColor: "#fafafa",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-zinc-100 dark:bg-black text-zinc-900 dark:text-zinc-50 antialiased min-h-screen selection:bg-zinc-900 selection:text-white dark:selection:bg-white dark:selection:text-zinc-900">
        {/* Mobile Viewport Container Shell */}
        <div className="max-w-md mx-auto min-h-screen bg-zinc-50 dark:bg-zinc-950 relative flex flex-col">
          <main className="flex-1 pb-24">{children}</main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
