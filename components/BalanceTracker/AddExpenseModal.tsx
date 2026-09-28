"use client";

import { useState } from "react";
import { X, DollarSign, Tag, Check, Utensils, ShoppingCart, Car, Receipt, ShoppingBag, Film, HeartPulse, MoreHorizontal } from "lucide-react";
import { Category, ExpenseItem } from "@/lib/types";
import { CATEGORIES, formatCurrency } from "@/lib/utils";
import { dataService } from "@/lib/storage";

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  balanceEntryId: string;
  remainingDifference: number;
  onSuccess: (expense: ExpenseItem) => void;
}

const CATEGORY_ICONS: Record<Category, any> = {
  Food: Utensils,
  Groceries: ShoppingCart,
  Transport: Car,
  Bills: Receipt,
  Shopping: ShoppingBag,
  Entertainment: Film,
  Health: HeartPulse,
  Others: MoreHorizontal,
};

export default function AddExpenseModal({
  isOpen,
  onClose,
  balanceEntryId,
  remainingDifference,
  onSuccess,
}: AddExpenseModalProps) {
  const [category, setCategory] = useState<Category>("Food");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const created = await dataService.addExpense(
        balanceEntryId,
        category,
        parsedAmount,
        description
      );
      onSuccess(created);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to add expense");
    } finally {
      setLoading(false);
    }
  };

  const handleFillRemaining = () => {
    if (remainingDifference > 0) {
      setAmount(String(remainingDifference));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Add Expense</h3>
            <p className="text-xs text-slate-500">
              Account for your spend • Remaining: {formatCurrency(remainingDifference)}
            </p>
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

          {/* Amount Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Expense Amount
              </label>
              {remainingDifference > 0 && (
                <button
                  type="button"
                  onClick={handleFillRemaining}
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                >
                  Use Remaining ({formatCurrency(remainingDifference)})
                </button>
              )}
            </div>
            <div className="relative">
              <span className="text-2xl font-bold text-slate-400 absolute left-3.5 top-2">₹</span>
              <input
                type="number"
                step="0.01"
                required
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-4 py-2.5 text-2xl font-bold bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white tracking-tight"
              />
            </div>

            {/* Quick amount chips */}
            <div className="flex gap-1.5 pt-1">
              {[50, 100, 200, 500].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(String((parseFloat(amount) || 0) + val))}
                  className="flex-1 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition"
                >
                  +₹{val}
                </button>
              ))}
            </div>
          </div>

          {/* Category Chips */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Category
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(CATEGORIES) as Category[]).map((catKey) => {
                const isSelected = category === catKey;
                const Icon = CATEGORY_ICONS[catKey] || MoreHorizontal;
                const info = CATEGORIES[catKey];
                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => setCategory(catKey)}
                    className={`flex flex-col items-center justify-center p-2 rounded-2xl border text-xs font-medium transition-all ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                    }`}
                  >
                    <Icon className={`w-4 h-4 mb-1 ${isSelected ? "text-indigo-600 dark:text-indigo-400" : info.color}`} />
                    <span className="text-[10px] truncate max-w-full">{catKey}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Note / Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Lunch at Cafe, Uber ride..."
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-2xl transition shadow-lg shadow-indigo-600/25 disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add Expense"}
          </button>
        </form>
      </div>
    </div>
  );
}
