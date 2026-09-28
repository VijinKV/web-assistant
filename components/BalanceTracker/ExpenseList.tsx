"use client";

import { ExpenseItem, Category } from "@/lib/types";
import { CATEGORIES, formatCurrency } from "@/lib/utils";
import { Utensils, ShoppingCart, Car, Receipt, ShoppingBag, Film, HeartPulse, MoreHorizontal, Trash2, Sparkles } from "lucide-react";

const CATEGORY_ICONS: Record<string, any> = {
  Food: Utensils,
  Groceries: ShoppingCart,
  Transport: Car,
  Bills: Receipt,
  Shopping: ShoppingBag,
  Entertainment: Film,
  Health: HeartPulse,
  Others: MoreHorizontal,
};

interface ExpenseListProps {
  expenses: ExpenseItem[];
  onDeleteExpense: (expenseId: string) => void;
  isSettled?: boolean;
}

export default function ExpenseList({
  expenses,
  onDeleteExpense,
  isSettled,
}: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <div className="text-center py-8 px-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <MoreHorizontal className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No expenses recorded yet</p>
        <p className="text-xs text-slate-400 mt-0.5">
          Add specific expenses to explain the difference, or settle remaining to Others.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {expenses.map((expense) => {
        const Icon = CATEGORY_ICONS[expense.category] || MoreHorizontal;
        const categoryMeta = CATEGORIES[expense.category as Category] || CATEGORIES.Others;

        return (
          <div
            key={expense.id}
            className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
              expense.isAutoSettled
                ? "bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40"
                : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-750 shadow-sm"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${categoryMeta.bg}`}
              >
                <Icon className={`w-5 h-5 ${categoryMeta.color}`} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-900 dark:text-white text-sm">
                    {expense.category}
                  </span>
                  {expense.isAutoSettled && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold border border-amber-500/20">
                      <Sparkles className="w-2.5 h-2.5" />
                      Auto-Settled
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[160px] sm:max-w-xs">
                  {expense.description || "Uncategorized item"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {formatCurrency(expense.amount)}
              </span>
              {!isSettled && (
                <button
                  onClick={() => onDeleteExpense(expense.id)}
                  title="Remove expense"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
