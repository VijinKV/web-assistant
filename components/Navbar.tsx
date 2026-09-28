"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Database, ShieldCheck, User as UserIcon, LogOut, CheckCircle2 } from "lucide-react";
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
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 dark:text-white text-base tracking-tight">
                Web Assistant
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium leading-none">
              {pathname === "/balance-tracker" ? "Balance Tracker" : "All-in-One Tools"}
            </p>
          </div>
        </Link>

        {/* Database Status & User Profile */}
        <div className="flex items-center gap-2">
          <Link
            href="/settings"
            title={isSupabaseConfigured ? "Connected to Supabase Cloud" : "Local Storage Demo Mode"}
            className={`flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full transition-colors border ${
              isSupabaseConfigured
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
            }`}
          >
            <Database className="w-3 h-3" />
            <span>{isSupabaseConfigured ? "Supabase" : "Local"}</span>
          </Link>

          {onOpenAuth && (
            <button
              onClick={onOpenAuth}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition"
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
