"use client";

import { useState, useEffect } from "react";
import { X, Calendar, ArrowDownRight, ArrowUpRight, Info } from "lucide-react";
import { dataService } from "@/lib/storage";
import { BalanceEntry } from "@/lib/types";
import { formatCurrency, getDayName, getTodayDateString } from "@/lib/utils";

interface BalanceEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (entry: BalanceEntry) => void;
  existingEntries: BalanceEntry[];
}

export default function BalanceEntryModal({
  isOpen,
  onClose,
  onSuccess,
  existingEntries,
}: BalanceEntryModalProps) {
  const [date, setDate] = useState(getTodayDateString());
  const [balance, setBalance] = useState("");
  const [manualPrevBalance, setManualPrevBalance] = useState("");
  const [detectedPrevBalance, setDetectedPrevBalance] = useState<BalanceEntry | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      // Find the most recent entry before selected date
      const older = existingEntries.filter((e) => e.date < date);
      if (older.length > 0) {
        setDetectedPrevBalance(older[0]);
        setManualPrevBalance(String(older[0].balance));
      } else {
        setDetectedPrevBalance(null);
        setManualPrevBalance("");
      }
    }
  }, [date, isOpen, existingEntries]);

  if (!isOpen) return null;

  const currentBalNum = parseFloat(balance) || 0;
  const prevBalNum = parseFloat(manualPrevBalance) || (detectedPrevBalance?.balance ?? null);
  const diff = prevBalNum !== null ? prevBalNum - currentBalNum : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!balance || isNaN(Number(balance))) {
      setError("Please enter a valid balance amount");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const prev = manualPrevBalance !== "" ? parseFloat(manualPrevBalance) : undefined;
      const created = await dataService.recordBalance(
        date,
        parseFloat(balance),
        prev,
        notes
      );
      onSuccess(created);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to record balance");
    } finally {
      setLoading(false);
    }
  };

  const dayName = getDayName(date);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Record Balance</h3>
            <p className="text-xs text-slate-500">Log closing balance for {dayName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
              {error}
            </div>
          )}

          {/* Date Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Date</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">{dayName}</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Previous Balance Reference */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-750">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-medium text-slate-600 dark:text-slate-300">
                {detectedPrevBalance ? `Previous (${detectedPrevBalance.dayName}) Balance` : "Starting / Opening Balance"}
              </span>
              {detectedPrevBalance && (
                <span className="text-[11px] text-slate-400">Auto-detected</span>
              )}
            </div>
            <div className="relative">
              <span className="font-bold text-xs text-slate-400 absolute left-3.5 top-2.5">₹</span>
              <input
                type="number"
                step="0.01"
                value={manualPrevBalance}
                onChange={(e) => setManualPrevBalance(e.target.value)}
                placeholder="e.g. 5000.00"
                className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white font-medium"
              />
            </div>
          </div>

          {/* Current Day Balance Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {dayName}&apos;s New Balance
            </label>
            <div className="relative">
              <span className="text-xl font-bold text-slate-400 absolute left-3.5 top-2.5">₹</span>
              <input
                type="number"
                step="0.01"
                required
                autoFocus
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-4 py-2.5 text-xl font-bold bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white tracking-tight"
              />
            </div>
          </div>

          {/* Dynamic Difference Preview */}
          {prevBalNum !== null && balance !== "" && (
            <div
              className={`p-3.5 rounded-2xl border transition-all ${
                diff > 0
                  ? "bg-amber-500/10 border-amber-500/20 text-amber-900 dark:text-amber-200"
                  : diff < 0
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-900 dark:text-emerald-200"
                  : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="flex items-center gap-1">
                  {diff > 0 ? (
                    <ArrowDownRight className="w-4 h-4 text-amber-500" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                  )}
                  {diff > 0 ? "Total Spent (Difference)" : diff < 0 ? "Balance Increased (Income)" : "No Change"}
                </span>
                <span className="text-base font-extrabold">{formatCurrency(Math.abs(diff))}</span>
              </div>
              <p className="text-[11px] opacity-80 mt-1">
                {diff > 0
                  ? `You will be able to log expenses against this ${formatCurrency(diff)} difference and settle the rest into Others.`
                  : "New balance is equal or higher than previous."}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-2xl transition shadow-lg shadow-indigo-600/25 disabled:opacity-50"
          >
            {loading ? "Recording..." : `Save ${dayName} Balance`}
          </button>
        </form>
      </div>
    </div>
  );
}
