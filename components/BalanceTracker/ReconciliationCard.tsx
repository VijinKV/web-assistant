"use client";

import { useState } from "react";
import confetti from "canvas-confetti";
import { 
  CheckCircle2, 
  Plus, 
  TrendingDown, 
  TrendingUp, 
  Clock
} from "lucide-react";
import { BalanceEntry, ExpenseItem } from "@/lib/types";
import { formatCurrency, calculateDaysBetween, getPerDaySpend } from "@/lib/utils";
import { dataService } from "@/lib/storage";

interface ReconciliationCardProps {
  entry: BalanceEntry;
  expenses: ExpenseItem[];
  allEntries?: BalanceEntry[];
  onAddExpenseClick: () => void;
  onSettled: (updatedEntry: BalanceEntry, settledExpense?: ExpenseItem) => void;
}

export default function ReconciliationCard({
  entry,
  expenses,
  allEntries,
  onAddExpenseClick,
  onSettled,
}: ReconciliationCardProps) {
  const [settling, setSettling] = useState(false);
  const [confirmSettle, setConfirmSettle] = useState(false);

  // Interval & Per-Day frequency
  const previousEntry = allEntries ? allEntries.find((e) => e.date < entry.date) : null;
  const daysDiff = (previousEntry && entry) ? calculateDaysBetween(previousEntry.date, entry.date) : 1;
  const perDaySpend = getPerDaySpend(entry.difference, daysDiff);

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
        colors: ["#18181b", "#10b981", "#a1a1aa", "#f59e0b"],
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
    <div className="card space-y-6">
      {/* Top Header: Day & Status */}
      <div className="flex items-start justify-between">
        <div>
          <p className="eyebrow">{entry.dayName}</p>
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-1">
            {entry.date}
          </h2>
        </div>
        {entry.isSettled ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Settled
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Reconciling
          </span>
        )}
      </div>

      {/* Headline difference */}
      <div>
        <p className="text-xs text-zinc-400 flex items-center gap-1">
          {isOutflow ? (
            <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
          ) : isIncome ? (
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5" />
          )}
          {isOutflow ? "Total difference (spent)" : isIncome ? "Balance inflow" : "Balanced"}
        </p>
        <p className="amount text-3xl font-semibold text-zinc-900 dark:text-white mt-1">
          {formatCurrency(Math.abs(diff))}
        </p>
        {isOutflow && previousEntry && (
          <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span className="amount text-zinc-600 dark:text-zinc-300 font-medium">{formatCurrency(perDaySpend)}</span>
            / day over {daysDiff} {daysDiff === 1 ? "day" : "days"} ({previousEntry.dayName.slice(0, 3)} → {entry.dayName.slice(0, 3)})
          </p>
        )}
      </div>

      {/* Balance Flow: previous -> current */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
        <div>
          <p className="eyebrow">
            {entry.previousBalance !== null ? "Previous" : "Starting"}
          </p>
          <p className="amount text-sm font-medium text-zinc-700 dark:text-zinc-300 mt-1">
            {entry.previousBalance !== null ? formatCurrency(entry.previousBalance) : "—"}
          </p>
        </div>
        <div>
          <p className="eyebrow">{entry.dayName}</p>
          <p className="amount text-sm font-medium text-zinc-900 dark:text-white mt-1">
            {formatCurrency(entry.balance)}
          </p>
        </div>
      </div>

      {/* Reconciliation Progress Bar */}
      {isOutflow && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400">
              Accounted <span className="amount font-medium text-zinc-900 dark:text-white">{formatCurrency(totalAccounted)}</span>
            </span>
            <span className="text-zinc-400">
              Remaining{" "}
              <span
                className={`amount font-medium ${
                  remainingDifference > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {formatCurrency(remainingDifference)}
              </span>
            </span>
          </div>

          <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isFullyAccounted ? "bg-emerald-500" : "bg-zinc-900 dark:bg-white"
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Settlement actions if not settled yet */}
      {!entry.isSettled && isOutflow && (
        <div className="space-y-3">
          {confirmSettle ? (
            <div className="panel p-4 space-y-3">
              <p className="text-sm text-zinc-700 dark:text-zinc-200">
                Move the remaining <span className="amount font-medium">{formatCurrency(remainingDifference)}</span> into &quot;Others&quot;?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleSettle}
                  disabled={settling}
                  className="btn-primary flex-1 py-2 text-xs"
                >
                  {settling ? "Settling..." : "Yes, Settle Now"}
                </button>
                <button
                  onClick={() => setConfirmSettle(false)}
                  className="btn-secondary py-2 text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <button onClick={onAddExpenseClick} className="btn-secondary flex-1 text-xs">
                  <Plus className="w-3.5 h-3.5" />
                  Add Expense
                </button>
                <button onClick={() => setConfirmSettle(true)} className="btn-primary flex-1 text-xs">
                  {remainingDifference > 0 ? "Settle to Others" : "Mark as Settled"}
                </button>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Add what you remember. Settling moves the remaining {formatCurrency(remainingDifference)} to &quot;Others&quot;.
              </p>
            </>
          )}
        </div>
      )}

      {entry.isSettled && (
        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span>This day is fully reconciled.</span>
          <button onClick={onAddExpenseClick} className="btn-ghost">
            <Plus className="w-3 h-3" />
            Add more
          </button>
        </div>
      )}
    </div>
  );
}
