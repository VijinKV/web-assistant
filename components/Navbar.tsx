"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, User as UserIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { dataService } from "@/lib/storage";
import { isSupabaseConfigured } from "@/lib/supabase";
import { UserProfile } from "@/lib/types";

interface NavbarProps {
  onOpenAuth?: () => void;
}

export default function Navbar({ onOpenAuth }: NavbarProps) {
  const pathname = usePathname();
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    dataService.getUser().then(setUser);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full bg-zinc-50/85 dark:bg-zinc-950/85 backdrop-blur-lg">
      <div className="max-w-md mx-auto px-5 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-zinc-900 dark:bg-white flex items-center justify-center text-white dark:text-zinc-900">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div className="leading-tight">
            <span className="block font-semibold text-zinc-900 dark:text-white text-sm tracking-tight">
              Web Assistant
            </span>
            <span className="block text-[11px] text-zinc-400">
              {pathname === "/balance-tracker" ? "Balance Tracker" : "All-in-One Tools"}
            </span>
          </div>
        </Link>

        {/* Database Status & User Profile */}
        <div className="flex items-center gap-1.5">
          <Link
            href="/settings"
            title={isSupabaseConfigured ? "Connected to Supabase Cloud" : "Local Storage Demo Mode"}
            className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900 transition-colors"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${isSupabaseConfigured ? "bg-emerald-500" : "bg-amber-500"}`}
            />
            <span>{isSupabaseConfigured ? "Synced" : "Local"}</span>
          </Link>

          {onOpenAuth && (
            <button
              onClick={onOpenAuth}
              className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
              title={user ? `Signed in as ${user.email}` : "Sign in"}
            >
              <UserIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
