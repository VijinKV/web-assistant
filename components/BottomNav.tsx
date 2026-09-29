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
      label: "Settings",
      href: "/settings",
      icon: Settings,
      isActive: pathname === "/settings",
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-50/85 dark:bg-zinc-950/85 backdrop-blur-lg pb-safe">
      <div className="max-w-md mx-auto h-16 flex items-center justify-around px-6 border-t border-zinc-200/70 dark:border-zinc-800/70">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 w-20 py-1 transition-colors ${
                item.isActive
                  ? "text-zinc-900 dark:text-white"
                  : "text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={item.isActive ? 2.25 : 1.75} />
              <span className={`text-[10px] tracking-tight ${item.isActive ? "font-semibold" : "font-medium"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
