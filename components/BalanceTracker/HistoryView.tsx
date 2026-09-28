"use client";

import { BalanceEntry } from "@/lib/types";
import { formatCurrency, calculateDaysBetween, getPerDaySpend } from "@/lib/utils";
import { Calendar, CheckCircle2, Clock, ChevronRight, Trash2, ArrowDownRight, ArrowUpRight } from "lucide-react";

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
      <div className="text-center py-10 px-4 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <Calendar className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No balance history yet</h4>
        <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
          Start by recording your starting balance (e.g. Sunday), then record the next day (Monday) to see the difference!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
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
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              isSelected
                ? "bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-600 ring-2 ring-indigo-500/20 shadow-sm"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs uppercase ${
                    entry.isSettled
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                  }`}
                >
                  {entry.dayName.slice(0, 3)}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {entry.dayName}
                    </span>
                    <span className="text-xs text-slate-400">({entry.date})</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Bal: {formatCurrency(entry.balance)}
                    </span>
                    {entry.previousBalance !== null && (
                      <span className="text-[11px] text-slate-400">
                        • Prev: {formatCurrency(entry.previousBalance)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {isOutflow ? (
                      <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
                    ) : (
                      <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                    )}
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {formatCurrency(Math.abs(diff))}
                    </span>
                  </div>
                  {diff !== 0 && (
                    <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                      {formatCurrency(perDay)}/day {days > 1 ? `(${days}d)` : ""}
                    </div>
                  )}
                  <span
                    className={`inline-block text-[10px] font-semibold mt-0.5 ${
                      entry.isSettled ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {entry.isSettled ? "Settled" : "In Progress"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete entry for ${entry.dayName} (${entry.date})?`)) {
                      onDeleteEntry(entry.id);
                    }
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition"
                  title="Delete entry"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
