"use client";

import { useState } from "react";
import { X, Calendar } from "lucide-react";
import { dataService } from "@/lib/storage";
import { BalanceEntry } from "@/lib/types";
import { getDayName, getTodayDateString } from "@/lib/utils";

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
}: BalanceEntryModalProps) {
  const [date, setDate] = useState(getTodayDateString());
  const [balance, setBalance] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!balance || isNaN(Number(balance))) {
      setError("Please enter a valid balance amount");
      return;
    }
    setError("");
    setLoading(true);

    try {
      // Automatically looks up previous balance and calculates difference in background
      const created = await dataService.recordBalance(
        date,
        parseFloat(balance)
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

          {/* 1. Date Selector */}
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

          {/* 2. Balance Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {dayName}&apos;s Balance
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-2xl transition shadow-lg shadow-indigo-600/25 disabled:opacity-50 mt-2"
          >
            {loading ? "Saving..." : `Save ${dayName} Balance`}
          </button>
        </form>
      </div>
    </div>
  );
}
