"use client";

import { useState, useEffect } from "react";
import { 
  X, 
  Plus, 
  Utensils, 
  ShoppingCart, 
  Car, 
  Receipt, 
  ShoppingBag, 
  Film, 
  HeartPulse, 
  MoreHorizontal, 
  CreditCard,
  Tag,
  ChevronRight,
  Check
} from "lucide-react";
import { ExpenseItem, CategoryItem } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { dataService } from "@/lib/storage";
import { categoryService, DEFAULT_CATEGORIES } from "@/lib/categories";

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  balanceEntryId: string;
  remainingDifference: number;
  onSuccess: (expense: ExpenseItem) => void;
}

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

export default function AddExpenseModal({
  isOpen,
  onClose,
  balanceEntryId,
  remainingDifference,
  onSuccess,
}: AddExpenseModalProps) {
  const [categories, setCategories] = useState<CategoryItem[]>(DEFAULT_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState<string>("EMI");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Quick category creation state
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatSub, setNewCatSub] = useState("");

  // Quick subcategory creation state
  const [showAddSubcategory, setShowAddSubcategory] = useState(false);
  const [newSubName, setNewSubName] = useState("");

  useEffect(() => {
    if (isOpen) {
      const cats = categoryService.getCategories();
      setCategories(cats);
      if (cats.length > 0) {
        setSelectedCategory(cats[0].name);
        setSelectedSubcategory("");
      }
      setShowAddCategory(false);
      setShowAddSubcategory(false);
      setNewCatName("");
      setNewCatSub("");
      setNewSubName("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentCategoryItem = categories.find(
    (c) => c.name.toLowerCase() === selectedCategory.toLowerCase()
  );

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
        selectedCategory,
        parsedAmount,
        description,
        selectedSubcategory || undefined
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

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const added = categoryService.addCategory(newCatName.trim(), newCatSub.trim() || undefined);
    const updated = categoryService.getCategories();
    setCategories(updated);
    setSelectedCategory(added.name);
    setSelectedSubcategory(newCatSub.trim() || "");
    setNewCatName("");
    setNewCatSub("");
    setShowAddCategory(false);
  };

  const handleCreateSubcategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim()) return;

    categoryService.addSubcategory(selectedCategory, newSubName.trim());
    const updated = categoryService.getCategories();
    setCategories(updated);
    setSelectedSubcategory(newSubName.trim());
    setNewSubName("");
    setShowAddSubcategory(false);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="px-6 pt-6 pb-2 flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-white text-lg tracking-tight">Add Expense</h3>
            <p className="text-sm text-zinc-500 mt-0.5">
              Remaining <span className="amount">{formatCurrency(remainingDifference)}</span>
            </p>
          </div>
          <button onClick={onClose} className="icon-btn -mr-1.5">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pt-4 pb-6 space-y-6">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs">
              {error}
            </div>
          )}

          {/* Amount Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="field-label">Amount</label>
              {remainingDifference > 0 && (
                <button
                  type="button"
                  onClick={handleFillRemaining}
                  className="btn-ghost"
                >
                  Use remaining ({formatCurrency(remainingDifference)})
                </button>
              )}
            </div>
            <div className="relative">
              <span className="text-2xl font-medium text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">₹</span>
              <input
                type="number"
                step="0.01"
                required
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="input amount pl-10 py-3 text-2xl font-semibold"
              />
            </div>

            {/* Quick amount chips */}
            <div className="flex gap-1.5">
              {[50, 100, 200, 500].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(String((parseFloat(amount) || 0) + val))}
                  className="flex-1 py-1.5 rounded-lg text-xs font-medium text-zinc-500 ring-1 ring-inset ring-zinc-200 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:ring-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors"
                >
                  +₹{val}
                </button>
              ))}
            </div>
          </div>

          {/* Category Section with Hierarchical Selection */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="field-label flex items-center gap-1">
                <span>Category</span>
                {selectedSubcategory && (
                  <span className="text-zinc-900 dark:text-white flex items-center gap-0.5">
                    <ChevronRight className="w-3 h-3" />
                    {selectedSubcategory}
                  </span>
                )}
              </label>
              <button
                type="button"
                onClick={() => setShowAddCategory(!showAddCategory)}
                className="btn-ghost"
              >
                {showAddCategory ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                {showAddCategory ? "Close" : "New"}
              </button>
            </div>

            {/* Inline New Category Creator */}
            {showAddCategory && (
              <div className="panel p-3 space-y-2">
                <input
                  type="text"
                  placeholder="Category name (e.g. Subscriptions, EMI)"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="input bg-white dark:bg-zinc-900 py-2 text-xs"
                />
                <input
                  type="text"
                  placeholder="Optional subcategory (e.g. Netflix, CRED)"
                  value={newCatSub}
                  onChange={(e) => setNewCatSub(e.target.value)}
                  className="input bg-white dark:bg-zinc-900 py-2 text-xs"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowAddCategory(false)}
                    className="btn-ghost px-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateCategory}
                    disabled={!newCatName.trim()}
                    className="btn-primary px-3 py-1.5 text-xs rounded-lg"
                  >
                    Save Category
                  </button>
                </div>
              </div>
            )}

            {/* Category Grid */}
            <div className="grid grid-cols-4 gap-1.5 max-h-40 overflow-y-auto">
              {categories.map((cat) => {
                const isSelected = selectedCategory.toLowerCase() === cat.name.toLowerCase();
                const Icon = CATEGORY_ICONS[cat.name] || Tag;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat.name);
                      setSelectedSubcategory("");
                      setShowAddSubcategory(false);
                    }}
                    className={`flex flex-col items-center justify-center gap-1 py-2.5 px-1 rounded-xl transition-colors ${
                      isSelected
                        ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                        : "bg-zinc-100/70 text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-800/60 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? "" : cat.color || "text-zinc-500"}`} />
                    <span className="text-[10px] truncate max-w-full font-medium">{cat.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Subcategories Strip for Selected Category */}
            {currentCategoryItem && (
              <div className="pt-1 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-zinc-400">
                    {selectedCategory} subcategories
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddSubcategory(!showAddSubcategory)}
                    className="btn-ghost text-[11px]"
                  >
                    <Plus className="w-3 h-3" />
                    Add
                  </button>
                </div>

                {/* Inline Add Subcategory input */}
                {showAddSubcategory && (
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder={`New subcategory for ${selectedCategory}...`}
                      value={newSubName}
                      onChange={(e) => setNewSubName(e.target.value)}
                      className="input flex-1 py-1.5 text-xs rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={handleCreateSubcategory}
                      disabled={!newSubName.trim()}
                      className="btn-primary px-3 py-1.5 text-xs rounded-lg"
                    >
                      Add
                    </button>
                  </div>
                )}

                {/* Subcategory Pills */}
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => setSelectedSubcategory("")}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                      selectedSubcategory === ""
                        ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                        : "text-zinc-500 ring-1 ring-inset ring-zinc-200 hover:text-zinc-900 dark:text-zinc-400 dark:ring-zinc-700 dark:hover:text-white"
                    }`}
                  >
                    General
                  </button>

                  {currentCategoryItem.subcategories.map((sub) => {
                    const isSubSelected = selectedSubcategory === sub;
                    return (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => setSelectedSubcategory(isSubSelected ? "" : sub)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors flex items-center gap-1 ${
                          isSubSelected
                            ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                            : "text-zinc-500 ring-1 ring-inset ring-zinc-200 hover:text-zinc-900 dark:text-zinc-400 dark:ring-zinc-700 dark:hover:text-white"
                        }`}
                      >
                        {isSubSelected && <Check className="w-3 h-3" />}
                        {sub}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="field-label">
              Note <span className="text-zinc-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Phone EMI, Lunch with team..."
              className="input"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3"
          >
            {loading ? "Adding..." : "Add Expense"}
          </button>
        </form>
      </div>
    </div>
  );
}
