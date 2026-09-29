"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import AuthModal from "@/components/AuthModal";
import ReconciliationCard from "@/components/BalanceTracker/ReconciliationCard";
import ExpenseList from "@/components/BalanceTracker/ExpenseList";
import HistoryView from "@/components/BalanceTracker/HistoryView";
import BalanceEntryModal from "@/components/BalanceTracker/BalanceEntryModal";
import AddExpenseModal from "@/components/BalanceTracker/AddExpenseModal";
import { dataService } from "@/lib/storage";
import { BalanceEntry, ExpenseItem } from "@/lib/types";
import { 
  ArrowLeft, 
  Plus, 
  Wallet
} from "lucide-react";

export default function BalanceTrackerPage() {
  const [entries, setEntries] = useState<BalanceEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<BalanceEntry | null>(null);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);

  // Active Tab: "reconciliation" | "history"
  const [activeTab, setActiveTab] = useState<"reconciliation" | "history">("reconciliation");

  const loadData = async (preferredEntryId?: string) => {
    setLoading(true);
    try {
      const all = await dataService.getBalanceEntries();
      setEntries(all);

      if (all.length > 0) {
        let target = all[0];
        if (preferredEntryId) {
          const found = all.find((e) => e.id === preferredEntryId);
          if (found) target = found;
        } else if (selectedEntry) {
          const found = all.find((e) => e.id === selectedEntry.id);
          if (found) target = found;
        }
        setSelectedEntry(target);

        const expList = await dataService.getExpenses(target.id);
        setExpenses(expList);
      } else {
        setSelectedEntry(null);
        setExpenses([]);
      }
    } catch (err) {
      console.error("Failed to load balance entries:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectEntry = async (entry: BalanceEntry) => {
    setSelectedEntry(entry);
    setActiveTab("reconciliation");
    try {
      const expList = await dataService.getExpenses(entry.id);
      setExpenses(expList);
    } catch (err) {
      console.error("Failed to load expenses for entry:", err);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      await dataService.deleteExpense(expenseId);
      if (selectedEntry) {
        const updated = await dataService.getExpenses(selectedEntry.id);
        setExpenses(updated);
      }
    } catch (err) {
      console.error("Failed to delete expense:", err);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    try {
      await dataService.deleteBalanceEntry(entryId);
      await loadData();
    } catch (err) {
      console.error("Failed to delete entry:", err);
    }
  };

  const handleSettled = (updatedEntry: BalanceEntry, settledExpense?: ExpenseItem) => {
    setSelectedEntry(updatedEntry);
    setEntries((prev) => prev.map((e) => (e.id === updatedEntry.id ? updatedEntry : e)));
    if (settledExpense) {
      setExpenses((prev) => [...prev, settledExpense]);
    }
  };

  // Math calculations for the active reconciliation
  const totalAccounted = expenses.reduce((sum, e) => sum + e.amount, 0);
  const remainingDifference = selectedEntry
    ? Math.max(0, selectedEntry.difference - totalAccounted)
    : 0;

  return (
    <div className="min-h-full">
      <Navbar onOpenAuth={() => setAuthModalOpen(true)} />

      <div className="px-5 pt-4 pb-6 space-y-6">
        {/* Module Header Bar */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="icon-btn -ml-1.5"
              title="Back to Web Assistant Hub"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="font-semibold text-zinc-900 dark:text-white text-xl tracking-tight">
                Balance Tracker
              </h1>
              <p className="text-xs text-zinc-400">
                Day-by-day balance and spend
              </p>
            </div>
          </div>

          <button
            onClick={() => setBalanceModalOpen(true)}
            className="btn-primary px-3.5 py-2 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Day
          </button>
        </div>

        {/* Tab Switcher: Reconcile vs History */}
        <div className="flex rounded-xl bg-zinc-100 dark:bg-zinc-900 p-1">
          <button
            onClick={() => setActiveTab("reconciliation")}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === "reconciliation"
                ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            Reconcile
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === "history"
                ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            History <span className="text-zinc-400 tabular-nums">{entries.length}</span>
          </button>
        </div>

        {/* TAB 1: RECONCILIATION VIEW */}
        {activeTab === "reconciliation" && (
          <div className="space-y-8">
            {selectedEntry ? (
              <>
                {/* Core Reconciliation Card */}
                <ReconciliationCard
                  entry={selectedEntry}
                  expenses={expenses}
                  allEntries={entries}
                  onAddExpenseClick={() => setExpenseModalOpen(true)}
                  onSettled={handleSettled}
                />

                {/* Itemized Expenses Section */}
                <section className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="eyebrow">
                      Expenses · {selectedEntry.dayName}
                    </h3>

                    <button
                      onClick={() => setExpenseModalOpen(true)}
                      className="btn-ghost"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add
                    </button>
                  </div>

                  <ExpenseList
                    expenses={expenses}
                    onDeleteExpense={handleDeleteExpense}
                    isSettled={selectedEntry.isSettled}
                  />
                </section>
              </>
            ) : (
              <div className="card text-center py-12 space-y-5">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-300 flex items-center justify-center">
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900 dark:text-white text-base">
                    Start tracking
                  </h3>
                  <p className="text-sm text-zinc-500 mt-1.5 max-w-xs mx-auto leading-relaxed">
                    Log a starting balance (e.g. Sunday: ₹5,000), then the next day&apos;s (Monday: ₹4,200). The ₹800 difference is worked out for you.
                  </p>
                </div>
                <button
                  onClick={() => setBalanceModalOpen(true)}
                  className="btn-primary"
                >
                  <Plus className="w-4 h-4" />
                  Record First Balance
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: HISTORY VIEW */}
        {activeTab === "history" && (
          <div className="space-y-3">
            <p className="text-xs text-zinc-400 px-1">
              Tap a day to inspect its expenses or reconcile.
            </p>

            <HistoryView
              entries={entries}
              selectedEntryId={selectedEntry?.id || null}
              onSelectEntry={handleSelectEntry}
              onDeleteEntry={handleDeleteEntry}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => loadData(selectedEntry?.id)}
      />

      <BalanceEntryModal
        isOpen={balanceModalOpen}
        onClose={() => setBalanceModalOpen(false)}
        onSuccess={(newEntry) => {
          loadData(newEntry.id);
        }}
        existingEntries={entries}
      />

      {selectedEntry && (
        <AddExpenseModal
          isOpen={expenseModalOpen}
          onClose={() => setExpenseModalOpen(false)}
          balanceEntryId={selectedEntry.id}
          remainingDifference={remainingDifference}
          onSuccess={(newExpense) => {
            setExpenses((prev) => [...prev, newExpense]);
          }}
        />
      )}
    </div>
  );
}
