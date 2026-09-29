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
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldCheck, 
  Server, 
  Github, 
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

const TRACKERS_SQL = `-- Web Assistant: Habit / daily trackers (gym, Coca-Cola, chicken, sugar, ...)
-- Run once in the Supabase SQL Editor. Safe to re-run.
-- Per-user row level security, same model as schema.sql / restore-rls.sql:
-- each row belongs to a signed-in account (auth.uid() = user_id).

CREATE TABLE IF NOT EXISTS public.trackers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    kind TEXT NOT NULL DEFAULT 'yesno' CHECK (kind IN ('yesno', 'count')),
    unit TEXT NOT NULL DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tracker_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    tracker_id UUID REFERENCES public.trackers(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    value NUMERIC(12, 2) NOT NULL DEFAULT 0,
    skipped BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (tracker_id, date)
);

ALTER TABLE public.trackers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracker_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own trackers" ON public.trackers;
DROP POLICY IF EXISTS "Users can manage their own tracker logs" ON public.tracker_logs;

CREATE POLICY "Users can manage their own trackers"
    ON public.trackers
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- A log must also point at a tracker the same user owns.
CREATE POLICY "Users can manage their own tracker logs"
    ON public.tracker_logs
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM public.trackers t
            WHERE t.id = tracker_id AND t.user_id = auth.uid()
        )
    );

CREATE INDEX IF NOT EXISTS idx_trackers_user ON public.trackers(user_id);
CREATE INDEX IF NOT EXISTS idx_tracker_logs_user_date ON public.tracker_logs(user_id, date DESC);
`;

export default function SettingsPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedTrackers, setCopiedTrackers] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    dataService.getUser().then(setUser);
  }, []);

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyTrackersSql = () => {
    navigator.clipboard.writeText(TRACKERS_SQL);
    setCopiedTrackers(true);
    setTimeout(() => setCopiedTrackers(false), 2000);
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
      localStorage.removeItem("web_assistant_trackers");
      localStorage.removeItem("web_assistant_tracker_logs");
      localStorage.removeItem("web_assistant_balance_skips");
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-full">
      <Navbar onOpenAuth={() => setAuthModalOpen(true)} />

      <div className="p-4 sm:p-5 space-y-6">
        <div className="flex items-center gap-2.5">
          <Link
            href="/"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-extrabold text-slate-900 dark:text-white text-lg tracking-tight">
              Settings & Database
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">
              Supabase Configuration & Vercel Deployment
            </p>
          </div>
        </div>

        {/* User Account Section */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className="font-bold text-slate-900 dark:text-white text-sm">
                Account Status
              </h2>
            </div>
            {user ? (
              <button
                onClick={handleSignOut}
                className="text-xs text-rose-500 hover:underline flex items-center gap-1 font-semibold"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
              >
                Sign In / Up
              </button>
            )}
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-200">
                {user ? user.name || user.email : "Guest / Local Demo Mode"}
              </p>
              <p className="text-slate-500 text-[11px]">
                {user ? user.email : "Data stored locally in browser storage"}
              </p>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isSupabaseConfigured
                  ? "bg-emerald-500/10 text-emerald-600"
                  : "bg-amber-500/10 text-amber-600"
              }`}
            >
              {isSupabaseConfigured ? "Supabase Cloud" : "Local Mode"}
            </span>
          </div>
        </div>

        {/* Is Supabase Free? Explainer */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/30 border border-indigo-100 dark:border-indigo-900/60 rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200">
            <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="font-bold text-sm">Is Supabase Free?</h2>
          </div>
          <p className="text-xs text-indigo-950/80 dark:text-indigo-200/80 leading-relaxed">
            <strong>Yes, 100% free!</strong> Supabase offers one of the most generous free tiers in the industry with <strong>no credit card required</strong>:
          </p>
          <ul className="text-xs text-indigo-950/80 dark:text-indigo-200/80 space-y-1.5 list-disc pl-4">
            <li><strong>50,000</strong> monthly active users for Authentication (Google, Email, etc.)</li>
            <li><strong>500 MB</strong> PostgreSQL database (stores millions of balance entries)</li>
            <li><strong>Unlimited</strong> API requests</li>
            <li><strong>Row Level Security (RLS)</strong> so each user only sees their own finances</li>
          </ul>
        </div>

        {/* Vercel & Supabase Setup Steps */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h2 className="font-bold text-slate-900 dark:text-white text-sm">
              Deploy to Vercel with Supabase
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
              <span className="font-bold text-slate-900 dark:text-white block mb-1">
                Step 1: Create Free Supabase Project
              </span>
              <p className="text-slate-500 mb-2">
                Visit supabase.com and create a new free project.
              </p>
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Supabase Dashboard <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-900 dark:text-white">
                  Step 2: Run SQL Schema
                </span>
                <button
                  onClick={handleCopySql}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  {copied ? "Copied SQL!" : "Copy SQL"}
                </button>
              </div>
              <p className="text-slate-500">
                Go to the Supabase SQL Editor and paste the schema to create tables and RLS security rules.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-900 dark:text-white">
                  Habits SQL (gym, Coca-Cola, ...)
                </span>
                <button
                  onClick={handleCopyTrackersSql}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {copiedTrackers ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  {copiedTrackers ? "Copied SQL!" : "Copy SQL"}
                </button>
              </div>
              <p className="text-slate-500">
                Run once in the Supabase SQL Editor to enable the Habits check-in. Same as <code>supabase/trackers.sql</code>.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
              <span className="font-bold text-slate-900 dark:text-white block mb-1">
                Step 3: Add Vercel Environment Variables
              </span>
              <p className="text-slate-500 mb-2">
                Under your Vercel Project Settings &gt; Environment Variables (or in <code>.env.local</code>):
              </p>
              <div className="bg-slate-900 text-slate-200 p-2.5 rounded-xl font-mono text-[10px] space-y-1 overflow-x-auto">
                <div>NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co</div>
                <div>NEXT_PUBLIC_SUPABASE_ANON_KEY=ey...</div>
              </div>
            </div>
          </div>
        </div>

        {/* Reset Demo Data Action */}
        <div className="pt-2">
          <button
            onClick={handleResetData}
            className="w-full py-2.5 px-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-rose-500 hover:bg-rose-500/10 font-medium text-xs transition flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Reset Local Demo Data
          </button>
        </div>
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => dataService.getUser().then(setUser)}
      />
    </div>
  );
}
