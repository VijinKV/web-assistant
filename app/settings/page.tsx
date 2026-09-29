"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import AuthModal from "@/components/AuthModal";
import { dataService } from "@/lib/storage";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { UserProfile } from "@/lib/types";
import { 
  ArrowLeft, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldCheck, 
  Trash2, 
  User, 
  LogOut 
} from "lucide-react";

const SUPABASE_SCHEMA_SQL = `-- Run this in your Supabase SQL Editor:
CREATE TABLE IF NOT EXISTS public.balance_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    day_name TEXT NOT NULL,
    balance NUMERIC(12, 2) NOT NULL,
    previous_balance NUMERIC(12, 2),
    difference NUMERIC(12, 2) NOT NULL DEFAULT 0,
    is_settled BOOLEAN NOT NULL DEFAULT FALSE,
    settled_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    balance_entry_id UUID REFERENCES public.balance_entries(id) ON DELETE CASCADE NOT NULL,
    category TEXT NOT NULL DEFAULT 'Others',
    amount NUMERIC(12, 2) NOT NULL,
    description TEXT DEFAULT '',
    is_auto_settled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.balance_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own balances" ON public.balance_entries
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own expenses" ON public.expenses
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);`;

export default function SettingsPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [copied, setCopied] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    dataService.getUser().then(setUser);
  }, []);

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSignOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    } else {
      localStorage.removeItem("web_assistant_user");
    }
    setUser(null);
  };

  const handleResetData = () => {
    if (confirm("Reset all local demo entries and expenses?")) {
      localStorage.removeItem("web_assistant_balances");
      localStorage.removeItem("web_assistant_expenses");
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-full">
      <Navbar onOpenAuth={() => setAuthModalOpen(true)} />

      <div className="px-5 pt-4 pb-6 space-y-8">
        <div className="flex items-center gap-2">
          <Link href="/" className="icon-btn -ml-1.5">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-semibold text-zinc-900 dark:text-white text-xl tracking-tight">
              Settings
            </h1>
            <p className="text-xs text-zinc-400">
              Account, database and deployment
            </p>
          </div>
        </div>

        {/* User Account Section */}
        <section className="space-y-3">
          <h2 className="eyebrow px-1">Account</h2>
          <div className="card flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                  {user ? user.name || user.email : "Guest / Local Demo Mode"}
                </p>
                <p className="text-xs text-zinc-400 truncate flex items-center gap-1.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      isSupabaseConfigured ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                  />
                  {user ? user.email : "Data stored locally in browser storage"}
                </p>
              </div>
            </div>
            {user ? (
              <button onClick={handleSignOut} className="btn-ghost hover:text-rose-500 shrink-0">
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            ) : (
              <button onClick={() => setAuthModalOpen(true)} className="btn-primary px-3 py-1.5 text-xs shrink-0">
                Sign In
              </button>
            )}
          </div>
        </section>

        {/* Is Supabase Free? Explainer */}
        <section className="space-y-3">
          <h2 className="eyebrow px-1">Database</h2>
          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-900 dark:text-white">
                {isSupabaseConfigured ? "Supabase Cloud" : "Local Mode"}
              </span>
              <span className="flex items-center gap-1 text-xs text-zinc-400">
                <ShieldCheck className="w-3.5 h-3.5" /> Free tier
              </span>
            </div>
            <ul className="text-xs text-zinc-500 dark:text-zinc-400 space-y-1.5 leading-relaxed">
              <li>50,000 monthly active users for authentication</li>
              <li>500 MB PostgreSQL database</li>
              <li>Unlimited API requests</li>
              <li>Row Level Security so each user only sees their own data</li>
            </ul>
          </div>
        </section>

        {/* Vercel & Supabase Setup Steps */}
        <section className="space-y-3">
          <h2 className="eyebrow px-1">Deploy to Vercel</h2>

          <ol className="card p-0 divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
            <li className="p-4 flex gap-3">
              <span className="w-5 h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-[10px] font-semibold flex items-center justify-center shrink-0">1</span>
              <div className="space-y-1">
                <p className="font-medium text-zinc-900 dark:text-white text-sm">Create a Supabase project</p>
                <p className="text-zinc-500">Visit supabase.com and create a new free project.</p>
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="btn-ghost text-zinc-900 dark:text-white pt-1"
                >
                  Supabase Dashboard <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </li>

            <li className="p-4 flex gap-3">
              <span className="w-5 h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-[10px] font-semibold flex items-center justify-center shrink-0">2</span>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-zinc-900 dark:text-white text-sm">Run the SQL schema</p>
                  <button onClick={handleCopySql} className="btn-ghost shrink-0">
                    {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    {copied ? "Copied" : "Copy SQL"}
                  </button>
                </div>
                <p className="text-zinc-500">
                  Paste it into the Supabase SQL Editor to create tables and security rules.
                </p>
              </div>
            </li>

            <li className="p-4 flex gap-3">
              <span className="w-5 h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-[10px] font-semibold flex items-center justify-center shrink-0">3</span>
              <div className="flex-1 min-w-0 space-y-2">
                <p className="font-medium text-zinc-900 dark:text-white text-sm">Add environment variables</p>
                <p className="text-zinc-500">
                  In Vercel Project Settings &gt; Environment Variables (or <code>.env.local</code>):
                </p>
                <div className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 p-3 rounded-lg font-mono text-[10px] space-y-1 overflow-x-auto">
                  <div>NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co</div>
                  <div>NEXT_PUBLIC_SUPABASE_ANON_KEY=ey...</div>
                </div>
              </div>
            </li>
          </ol>
        </section>

        {/* Reset Demo Data Action */}
        <button
          onClick={handleResetData}
          className="w-full py-2 text-xs font-medium text-zinc-400 hover:text-rose-500 transition-colors flex items-center justify-center gap-1.5"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Reset Local Demo Data
        </button>
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => dataService.getUser().then(setUser)}
      />
    </div>
  );
}
