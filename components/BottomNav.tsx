"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Wallet, History, Settings } from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Home",
      href: "/",
      icon: Home,
      isActive: pathname === "/",
    },
    {
      label: "Tracker",
      href: "/balance-tracker",
      icon: Wallet,
      isActive: pathname.startsWith("/balance-tracker"),
    },
    {
      label: "Settings & DB",
      href: "/settings",
      icon: Settings,
      isActive: pathname === "/settings",
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe">
      <div className="max-w-md mx-auto h-16 flex items-center justify-around px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-16 py-1 transition-all duration-200 ${
                item.isActive
                  ? "text-indigo-600 dark:text-indigo-400 font-semibold"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-all ${
                  item.isActive ? "bg-indigo-50 dark:bg-indigo-950/60" : ""
                }`}
              >
                <Icon className={`w-5 h-5 ${item.isActive ? "scale-110" : ""}`} />
              </div>
              <span className="text-[11px] mt-0.5 tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
