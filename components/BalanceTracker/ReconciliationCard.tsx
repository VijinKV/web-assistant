"use client";

import { useState } from "react";
import confetti from "canvas-confetti";
import { 
  ArrowRight, 
  CheckCircle2, 
  Plus, 
  Sparkles, 
  AlertCircle, 
  TrendingDown, 
  TrendingUp, 
  Clock, 
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import { BalanceEntry, ExpenseItem } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { dataService } from "@/lib/storage";

interface ReconciliationCardProps {
  entry: BalanceEntry;
  expenses: ExpenseItem[];
  onAddExpenseClick: () => void;
  onSettled: (updatedEntry: BalanceEntry, settledExpense?: ExpenseItem) => void;
}

export default function ReconciliationCard({
  entry,
  expenses,
  onAddExpenseClick,
  onSettled,
}: ReconciliationCardProps) {
  const [settling, setSettling] = useState(false);
  const [confirmSettle, setConfirmSettle] = useState(false);

  // Math
  const totalAccounted = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const diff = entry.difference; // Previous - Current (amount spent)
  const isOutflow = diff > 0;
  const isIncome = diff < 0;
  const remainingDifference = Math.max(0, diff - totalAccounted);
  const isFullyAccounted = isOutflow && remainingDifference <= 0.009;
  const progressPercent = diff > 0 ? Math.min(100, Math.round((totalAccounted / diff) * 100)) : 100;

  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#6366f1", "#10b981", "#f59e0b", "#8b5cf6"],
      });
    } catch (e) {
      // ignore in environments without canvas
    }
  };

  const handleSettle = async () => {
    setSettling(true);
    try {
      const result = await dataService.settleBalance(entry, expenses);
      triggerCelebration();
      setConfirmSettle(false);
      onSettled(result.updatedEntry, result.settledExpense);
    } catch (err) {
      console.error("Failed to settle balance:", err);
    } finally {
      setSettling(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-5">
      {/* Top Header: Day & Status */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            {entry.dayName} Reconciliation
          </span>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
            {entry.date}
          </h2>
        </div>
        <div>
          {entry.isSettled ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Settled
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Clock className="w-3.5 h-3.5" />
              Reconciling
            </span>
          )}
        </div>
      </div>

      {/* Balance Flow: Sunday -> Monday subtraction display */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
        <div className="grid grid-cols-2 gap-4 items-center">
          <div>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              {entry.previousBalance !== null ? "Previous Balance" : "Starting"}
            </span>
            <p className="text-base font-bold text-slate-800 dark:text-slate-200 mt-0.5">
              {entry.previousBalance !== null ? formatCurrency(entry.previousBalance) : "—"}
            </p>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              {entry.dayName} Balance
            </span>
            <p className="text-base font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
              {formatCurrency(entry.balance)}
            </p>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-750 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {isOutflow ? (
              <TrendingDown className="w-4 h-4 text-rose-500" />
            ) : isIncome ? (
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-slate-400" />
            )}
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {isOutflow ? "Total Difference (Spent)" : isIncome ? "Balance Inflow" : "Balanced"}
            </span>
          </div>
          <span className="text-sm font-extrabold text-slate-900 dark:text-white">
            {formatCurrency(Math.abs(diff))}
          </span>
        </div>
      </div>

      {/* Reconciliation Progress Bar */}
      {isOutflow && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-600 dark:text-slate-400">
              Accounted: <strong className="text-slate-900 dark:text-white">{formatCurrency(totalAccounted)}</strong>
            </span>
            <span className={remainingDifference > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}>
              Remaining: <strong>{formatCurrency(remainingDifference)}</strong>
            </span>
          </div>

          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                isFullyAccounted ? "bg-emerald-500" : "bg-gradient-to-r from-indigo-500 to-amber-500"
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Settlement Callout if not settled yet */}
      {!entry.isSettled && isOutflow && (
        <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 space-y-3">
          <div className="flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-xs text-indigo-950 dark:text-indigo-200">
              <p className="font-semibold">Ready to reconcile this day?</p>
              <p className="text-[11px] opacity-80 mt-0.5">
                Add known expenses like Food or Bills. If you can&apos;t recall the rest, tap <strong>Settle</strong> and the remaining {formatCurrency(remainingDifference)} will automatically transfer to &quot;Others&quot;.
              </p>
            </div>
          </div>

          {confirmSettle ? (
            <div className="space-y-2 pt-1 border-t border-indigo-200/50 dark:border-indigo-800/40">
              <p className="text-xs font-semibold text-indigo-900 dark:text-indigo-200">
                Confirm settling remaining {formatCurrency(remainingDifference)} into &quot;Others&quot;?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleSettle}
                  disabled={settling}
                  className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-sm"
                >
                  {settling ? "Settling..." : "Yes, Settle Now"}
                </button>
                <button
                  onClick={() => setConfirmSettle(false)}
                  className="py-2 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2 pt-1">
              <button
                onClick={onAddExpenseClick}
                className="flex-1 py-2.5 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-800 dark:text-slate-200 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Add Expense
              </button>

              <button
                onClick={() => setConfirmSettle(true)}
                className="flex-1 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {remainingDifference > 0 ? "Settle to Others" : "Mark as Settled"}
              </button>
            </div>
          )}
        </div>
      )}

      {entry.isSettled && (
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>This day is settled and completely reconciled.</span>
          </div>
          <button
            onClick={onAddExpenseClick}
            className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 underline"
          >
            + Add more
          </button>
        </div>
      )}
    </div>
  );
}
