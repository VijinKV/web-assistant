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
    <div className="modal-backdrop">
      <div className="modal">
        <div className="px-6 pt-6 pb-2 flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-white text-lg tracking-tight">Record Balance</h3>
            <p className="text-sm text-zinc-500 mt-0.5">Closing balance for {dayName}</p>
          </div>
          <button onClick={onClose} className="icon-btn -mr-1.5">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pt-4 pb-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs">
              {error}
            </div>
          )}

          {/* 1. Date Selector */}
          <div className="space-y-1.5">
            <label className="field-label flex items-center justify-between">
              <span>Date</span>
              <span className="text-zinc-900 dark:text-white">{dayName}</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>

          {/* 2. Balance Input */}
          <div className="space-y-1.5">
            <label className="field-label">
              {dayName}&apos;s Balance
            </label>
            <div className="relative">
              <span className="text-2xl font-medium text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">₹</span>
              <input
                type="number"
                step="0.01"
                required
                autoFocus
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="0.00"
                className="input amount pl-10 py-3 text-2xl font-semibold"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3"
          >
            {loading ? "Saving..." : `Save ${dayName} Balance`}
          </button>
        </form>
      </div>
    </div>
  );
}
