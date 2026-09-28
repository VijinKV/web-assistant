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
import { formatCurrency } from "@/lib/utils";
import { 
  ArrowLeft, 
  Plus, 
  Wallet, 
  History, 
  Receipt, 
  Sparkles,
  TrendingDown,
  Layers
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

      <div className="p-4 sm:p-5 space-y-5">
        {/* Module Header Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition"
              title="Back to Web Assistant Hub"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="font-extrabold text-slate-900 dark:text-white text-lg tracking-tight">
                Balance Tracker
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">
                Day-by-Day Balance & Spend Settlement
              </p>
            </div>
          </div>

          <button
            onClick={() => setBalanceModalOpen(true)}
            className="py-2 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Day
          </button>
        </div>

        {/* Tab Switcher: Reconcile vs History */}
        <div className="flex rounded-2xl bg-slate-200/70 dark:bg-slate-800/70 p-1">
          <button
            onClick={() => setActiveTab("reconciliation")}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === "reconciliation"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            Current Reconciliation
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === "history"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Past Days ({entries.length})
          </button>
        </div>

        {/* TAB 1: RECONCILIATION VIEW */}
        {activeTab === "reconciliation" && (
          <div className="space-y-5">
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
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                        Expenses for {selectedEntry.dayName}
                      </h3>
                    </div>

                    <button
                      onClick={() => setExpenseModalOpen(true)}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Add Expense
                    </button>
                  </div>

                  <ExpenseList
                    expenses={expenses}
                    onDeleteExpense={handleDeleteExpense}
                    isSettled={selectedEntry.isSettled}
                  />
                </div>
              </>
            ) : (
              <div className="text-center py-12 px-5 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-4">
                <div className="w-14 h-14 mx-auto rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner">
                  <Wallet className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Start Your Balance Tracker
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                    First, log your starting balance (e.g. <strong>Sunday balance: ₹5,000</strong>). Next, enter Monday&apos;s balance (e.g. <strong>₹4,200</strong>) and it will compute the ₹800 difference automatically!
                  </p>
                </div>
                <button
                  onClick={() => setBalanceModalOpen(true)}
                  className="py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl shadow-lg shadow-indigo-600/25 transition inline-flex items-center gap-2"
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
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Balance Records
                </h3>
                <p className="text-xs text-slate-500">
                  Select any day to inspect its expenses or reconcile
                </p>
              </div>
            </div>

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
