"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import AuthModal from "@/components/AuthModal";
import BalanceEntryModal from "@/components/BalanceTracker/BalanceEntryModal";
import { dataService } from "@/lib/storage";
import { BalanceEntry, UserProfile } from "@/lib/types";
import { formatCurrency, getTodayDateString, getDayName } from "@/lib/utils";
import { 
  Wallet, 
  ArrowRight, 
  Plus, 
  Sparkles, 
  CheckCircle2, 
  TrendingDown, 
  Database, 
  Layers, 
  Bot, 
  FileText, 
  Calendar 
} from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase";

export default function HomePage() {
  const [entries, setEntries] = useState<BalanceEntry[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allEntries, currentUser] = await Promise.all([
        dataService.getBalanceEntries(),
        dataService.getUser(),
      ]);
      setEntries(allEntries);
      setUser(currentUser);
    } catch (err) {
      console.error("Error loading home data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const latestEntry = entries.length > 0 ? entries[0] : null;
  const todayDate = getTodayDateString();
  const todayDayName = getDayName(todayDate);
  const hasLoggedToday = latestEntry?.date === todayDate;

  return (
    <div className="min-h-full">
      <Navbar onOpenAuth={() => setAuthModalOpen(true)} />

      <div className="p-5 space-y-6">
        {/* Welcome Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-6 text-white shadow-xl shadow-indigo-500/20">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-200">
                {todayDayName}, {todayDate}
              </span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/15 backdrop-blur-md">
                Web Assistant Hub
              </span>
            </div>
            <h1 className="text-xl font-extrabold mt-2 tracking-tight">
              Hello, {user?.name || "Friend"}! 👋
            </h1>
            <p className="text-xs text-indigo-100/90 mt-1 leading-relaxed">
              Track balances day-by-day, reconcile spending, and settle differences effortlessly.
            </p>

            <div className="mt-5 flex gap-2.5">
              <button
                onClick={() => setEntryModalOpen(true)}
                className="flex-1 py-2.5 px-4 bg-white hover:bg-slate-50 text-indigo-700 font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Record Balance
              </button>

              <Link
                href="/balance-tracker"
                className="py-2.5 px-4 bg-white/20 hover:bg-white/30 text-white font-semibold text-xs rounded-xl backdrop-blur-md transition flex items-center justify-center gap-1.5"
              >
                Open Tracker
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Latest Balance Quick Widget */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
              <h2 className="font-bold text-slate-900 dark:text-white text-sm">
                Latest Balance Status
              </h2>
            </div>
            <Link
              href="/balance-tracker"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
            >
              View details <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {latestEntry ? (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-850 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500">
                    Recorded for {latestEntry.dayName} ({latestEntry.date})
                  </span>
                  <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                    {formatCurrency(latestEntry.balance)}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-500">Day Difference</span>
                  <div className="flex items-center justify-end gap-1 text-sm font-bold text-rose-500 mt-0.5">
                    <TrendingDown className="w-4 h-4" />
                    {formatCurrency(Math.abs(latestEntry.difference))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-750 text-xs">
                <span className="text-slate-500">Status</span>
                {latestEntry.isSettled ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Settled
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                    <Sparkles className="w-3.5 h-3.5" /> Needs Settlement
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-slate-500 text-xs space-y-2">
              <p>No balances recorded yet.</p>
              <button
                onClick={() => setEntryModalOpen(true)}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
              >
                + Add your first balance (e.g. Sunday balance)
              </button>
            </div>
          )}
        </div>

        {/* Installed Assistant Apps Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Assistant Apps
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">Modular System</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {/* Balance Tracker App */}
            <Link
              href="/balance-tracker"
              className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition shadow-sm flex items-center justify-between group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                      Balance Tracker
                    </h4>
                    <span className="px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                    Sunday to Monday balance subtraction, expenses, and auto-settle to Others.
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition shrink-0 ml-2" />
            </Link>

            {/* Extensible Future App Slot 1 */}
            <div className="p-4 rounded-3xl bg-white/60 dark:bg-slate-900/60 border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-between opacity-70">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                      Smart Notes & Tasks
                    </h4>
                    <span className="px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-500 text-[10px] font-semibold">
                      Coming Next
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Quick scratchpad and daily task checklist for Web Assistant.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Database & Vercel Info Card */}
        <div className="p-4 rounded-3xl bg-gradient-to-tr from-slate-900 to-indigo-950 text-white shadow-lg space-y-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-400" />
            <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-300">
              Database & Vercel Deployment
            </h4>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Connected via <strong>{isSupabaseConfigured ? "Supabase Cloud Database" : "Local Storage Demo"}</strong>. 
            Supabase is 100% free with 50k users and PostgreSQL. Ready for 1-click deployment on Vercel via GitHub!
          </p>
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-300 hover:text-white transition underline"
          >
            Database Settings & SQL Schema <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={loadData}
      />

      <BalanceEntryModal
        isOpen={entryModalOpen}
        onClose={() => setEntryModalOpen(false)}
        onSuccess={() => {
          loadData();
        }}
        existingEntries={entries}
      />
    </div>
  );
}
