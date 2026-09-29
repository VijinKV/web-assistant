"use client";

import { BalanceEntry } from "@/lib/types";
import { formatCurrency, calculateDaysBetween, getPerDaySpend } from "@/lib/utils";
import { Calendar, Trash2, ArrowDownRight, ArrowUpRight } from "lucide-react";

interface HistoryViewProps {
  entries: BalanceEntry[];
  selectedEntryId: string | null;
  onSelectEntry: (entry: BalanceEntry) => void;
  onDeleteEntry: (entryId: string) => void;
}

export default function HistoryView({
  entries,
  selectedEntryId,
  onSelectEntry,
  onDeleteEntry,
}: HistoryViewProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12 px-6 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
        <Calendar className="w-6 h-6 mx-auto text-zinc-300 dark:text-zinc-600 mb-3" />
        <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-200">No history yet</h4>
        <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto leading-relaxed">
          Record a starting balance (e.g. Sunday), then the next day (Monday) to see the difference.
        </p>
      </div>
    );
  }

  return (
    <div className="card p-0 divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden">
      {entries.map((entry) => {
        const isSelected = selectedEntryId === entry.id;
        const diff = entry.difference;
        const isOutflow = diff > 0;
        const prevEntry = entries.find((e) => e.date < entry.date);
        const days = prevEntry ? calculateDaysBetween(prevEntry.date, entry.date) : 1;
        const perDay = getPerDaySpend(diff, days);

        return (
          <div
            key={entry.id}
            onClick={() => onSelectEntry(entry)}
            className={`relative px-4 py-3.5 cursor-pointer transition-colors ${
              isSelected
                ? "bg-zinc-50 dark:bg-zinc-800/60"
                : "hover:bg-zinc-50/70 dark:hover:bg-zinc-800/30"
            }`}
          >
            {isSelected && (
              <span className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full bg-zinc-900 dark:bg-white" />
            )}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 text-center shrink-0">
                  <div className="text-[10px] font-medium uppercase text-zinc-400">
                    {entry.dayName.slice(0, 3)}
                  </div>
                  <div className="text-base font-semibold text-zinc-900 dark:text-white tabular-nums leading-tight">
                    {entry.date.slice(8, 10)}
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="amount font-medium text-zinc-900 dark:text-white text-sm">
                      {formatCurrency(entry.balance)}
                    </span>
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${entry.isSettled ? "bg-emerald-500" : "bg-amber-500"}`}
                      title={entry.isSettled ? "Settled" : "In Progress"}
                    />
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5 truncate">
                    {entry.date}
                    {entry.previousBalance !== null && (
                      <> · Prev {formatCurrency(entry.previousBalance)}</>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <div className="text-right">
                  <div className="flex items-center justify-end gap-0.5">
                    {isOutflow ? (
                      <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
                    ) : (
                      <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                    )}
                    <span className="amount text-sm font-medium text-zinc-900 dark:text-white">
                      {formatCurrency(Math.abs(diff))}
                    </span>
                  </div>
                  {diff !== 0 && (
                    <div className="amount text-[11px] text-zinc-400">
                      {formatCurrency(perDay)}/day {days > 1 ? `(${days}d)` : ""}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete entry for ${entry.dayName} (${entry.date})?`)) {
                      onDeleteEntry(entry.id);
                    }
                  }}
                  className="icon-btn hover:text-rose-500"
                  title="Delete entry"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
