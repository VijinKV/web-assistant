"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import AuthModal from "@/components/AuthModal";
import BalanceEntryModal from "@/components/BalanceTracker/BalanceEntryModal";
import { dataService } from "@/lib/storage";
import { BalanceEntry, UserProfile } from "@/lib/types";
import { formatCurrency, getTodayDateString, getDayName, calculateDaysBetween, getPerDaySpend } from "@/lib/utils";
import { 
  Wallet, 
  ArrowRight, 
  Plus, 
  CheckCircle2, 
  TrendingDown, 
  Database, 
  FileText, 
  Clock
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
  const previousEntry = latestEntry ? entries.find((e) => e.date < latestEntry.date) : null;
  const daysDiff = (latestEntry && previousEntry)
    ? calculateDaysBetween(previousEntry.date, latestEntry.date)
    : 1;
  const perDaySpend = latestEntry ? getPerDaySpend(latestEntry.difference, daysDiff) : 0;

  const todayDate = getTodayDateString();
  const todayDayName = getDayName(todayDate);
  const hasLoggedToday = latestEntry?.date === todayDate;

  return (
    <div className="min-h-full">
      <Navbar onOpenAuth={() => setAuthModalOpen(true)} />

      <div className="px-5 pt-4 pb-6 space-y-8">
        {/* Greeting */}
        <section className="space-y-5">
          <div>
            <p className="eyebrow">
              {todayDayName}, {todayDate}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white mt-1.5">
              Hello, {user?.name || "Friend"}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
              Track balances day by day and settle the difference.
            </p>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setEntryModalOpen(true)} className="btn-primary flex-1">
              <Plus className="w-4 h-4" />
              Record Balance
            </button>
            <Link href="/balance-tracker" className="btn-secondary">
              Open Tracker
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* Latest Balance Quick Widget */}
        <section className="card space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Latest balance
            </h2>
            <Link href="/balance-tracker" className="btn-ghost">
              Details <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {latestEntry ? (
            <div className="space-y-5">
              <div>
                <div className="amount text-3xl font-semibold text-zinc-900 dark:text-white">
                  {formatCurrency(latestEntry.balance)}
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  {latestEntry.dayName}, {latestEntry.date}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <div>
                  <p className="eyebrow">
                    {daysDiff > 1 ? `Spent · ${daysDiff} days` : "Spent"}
                  </p>
                  <p className="amount mt-1 text-base font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <TrendingDown className="w-4 h-4" />
                    {formatCurrency(Math.abs(latestEntry.difference))}
                  </p>
                </div>
                <div>
                  <p className="eyebrow">Per day</p>
                  <p className="amount mt-1 text-base font-medium text-zinc-900 dark:text-white">
                    {latestEntry.difference !== 0 ? formatCurrency(perDaySpend) : "—"}
                  </p>
                  {previousEntry && (
                    <p className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {previousEntry.dayName.slice(0, 3)} → {latestEntry.dayName.slice(0, 3)}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Status</span>
                {latestEntry.isSettled ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Settled
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Needs settlement
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 space-y-2">
              <p className="text-sm text-zinc-500">No balances recorded yet.</p>
              <button
                onClick={() => setEntryModalOpen(true)}
                className="text-sm font-medium text-zinc-900 dark:text-white underline underline-offset-4 decoration-zinc-300 dark:decoration-zinc-600"
              >
                Add your first balance
              </button>
            </div>
          )}
        </section>

        {/* Installed Assistant Apps */}
        <section className="space-y-3">
          <h3 className="eyebrow px-1">Apps</h3>

          <div className="card p-0 divide-y divide-zinc-100 dark:divide-zinc-800">
            <Link
              href="/balance-tracker"
              className="p-4 flex items-center gap-3.5 group"
            >
              <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 flex items-center justify-center shrink-0">
                <Wallet className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-zinc-900 dark:text-white text-sm">
                  Balance Tracker
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                  Daily balance difference, expenses and auto-settle to Others.
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-900 dark:group-hover:text-white group-hover:translate-x-0.5 transition shrink-0" />
            </Link>

            <div className="p-4 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 text-zinc-300 dark:text-zinc-600 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-zinc-400 dark:text-zinc-500 text-sm">
                  Smart Notes & Tasks
                </h4>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 truncate">
                  Quick scratchpad and daily task checklist.
                </p>
              </div>
              <span className="text-[10px] font-medium text-zinc-400 shrink-0">Soon</span>
            </div>
          </div>
        </section>

        {/* Database Info */}
        <Link
          href="/settings"
          className="flex items-center justify-between px-1 text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5" />
            {isSupabaseConfigured ? "Connected to Supabase Cloud" : "Using Local Storage Demo"}
          </span>
          <span className="flex items-center gap-1">
            Database settings <ArrowRight className="w-3 h-3" />
          </span>
        </Link>
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
