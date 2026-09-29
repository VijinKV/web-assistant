"use client";

import { ExpenseItem, Category } from "@/lib/types";
import { CATEGORIES, formatCurrency } from "@/lib/utils";
import { 
  Utensils, 
  ShoppingCart, 
  Car, 
  Receipt, 
  ShoppingBag, 
  Film, 
  HeartPulse, 
  MoreHorizontal, 
  Trash2, 
  CreditCard, 
  Tag, 
  ChevronRight 
} from "lucide-react";

const CATEGORY_ICONS: Record<string, any> = {
  EMI: CreditCard,
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
      <div className="text-center py-10 px-6 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">No expenses yet</p>
        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
          Add expenses to explain the difference, or settle the rest to Others.
        </p>
      </div>
    );
  }

  return (
    <div className="card p-0 divide-y divide-zinc-100 dark:divide-zinc-800">
      {expenses.map((expense) => {
        const Icon = CATEGORY_ICONS[expense.category] || Tag;
        const categoryMeta = CATEGORIES[expense.category as Category] || {
          color: "text-zinc-500",
        };

        return (
          <div
            key={expense.id}
            className="flex items-center justify-between gap-3 px-4 py-3.5"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                <Icon className={`w-4 h-4 ${categoryMeta.color}`} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-medium text-zinc-900 dark:text-white text-sm">
                    {expense.category}
                  </span>
                  {expense.subcategory && (
                    <span className="inline-flex items-center gap-0.5 text-xs text-zinc-400">
                      <ChevronRight className="w-3 h-3" />
                      {expense.subcategory}
                    </span>
                  )}
                  {expense.isAutoSettled && (
                    <span className="px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-medium">
                      Auto-settled
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 truncate max-w-[160px] sm:max-w-xs">
                  {expense.description || "Uncategorized item"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="amount text-sm font-medium text-zinc-900 dark:text-white">
                {formatCurrency(expense.amount)}
              </span>
              {!isSettled && (
                <button
                  onClick={() => onDeleteExpense(expense.id)}
                  title="Remove expense"
                  className="icon-btn hover:text-rose-500"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
