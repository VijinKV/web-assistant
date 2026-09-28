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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl my-auto">
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

          {/* Category Section with Hierarchical Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span>Category</span>
                {selectedSubcategory && (
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-0.5">
                    <ChevronRight className="w-3 h-3" />
                    {selectedSubcategory}
                  </span>
                )}
              </label>
              <button
                type="button"
                onClick={() => setShowAddCategory(!showAddCategory)}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3" />
                {showAddCategory ? "Close" : "New Category"}
              </button>
            </div>

            {/* Inline New Category Creator */}
            {showAddCategory && (
              <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-2 animate-fade-in">
                <span className="text-[11px] font-bold text-indigo-900 dark:text-indigo-200">
                  Create New Category Hierarchy
                </span>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    placeholder="Category name (e.g. Subscriptions, EMI)"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  />
                  <input
                    type="text"
                    placeholder="Optional subcategory (e.g. Netflix, CRED)"
                    value={newCatSub}
                    onChange={(e) => setNewCatSub(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="flex gap-2 justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddCategory(false)}
                    className="px-2.5 py-1 text-xs text-slate-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateCategory}
                    disabled={!newCatName.trim()}
                    className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50"
                  >
                    Save Category
                  </button>
                </div>
              </div>
            )}

            {/* Category Grid */}
            <div className="grid grid-cols-4 gap-1.5 max-h-36 overflow-y-auto pr-0.5">
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
                    className={`flex flex-col items-center justify-center p-2 rounded-2xl border text-xs font-medium transition-all ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                    }`}
                  >
                    <Icon className={`w-4 h-4 mb-1 ${isSelected ? "text-indigo-600 dark:text-indigo-400" : cat.color || "text-slate-500"}`} />
                    <span className="text-[10px] truncate max-w-full font-semibold">{cat.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Subcategories Strip for Selected Category */}
            {currentCategoryItem && (
              <div className="pt-1 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500">
                    {selectedCategory} Subcategories:
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddSubcategory(!showAddSubcategory)}
                    className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-0.5"
                  >
                    <Plus className="w-2.5 h-2.5" />
                    Add Subcategory
                  </button>
                </div>

                {/* Inline Add Subcategory input */}
                {showAddSubcategory && (
                  <div className="flex gap-1.5 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <input
                      type="text"
                      placeholder={`New subcategory for ${selectedCategory}...`}
                      value={newSubName}
                      onChange={(e) => setNewSubName(e.target.value)}
                      className="flex-1 px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={handleCreateSubcategory}
                      disabled={!newSubName.trim()}
                      className="px-2.5 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50"
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
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-medium transition ${
                      selectedSubcategory === ""
                        ? "bg-slate-800 text-white dark:bg-white dark:text-slate-900 font-bold"
                        : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                    }`}
                  >
                    All / General
                  </button>

                  {currentCategoryItem.subcategories.map((sub) => {
                    const isSubSelected = selectedSubcategory === sub;
                    return (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => setSelectedSubcategory(isSubSelected ? "" : sub)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-medium transition flex items-center gap-1 ${
                          isSubSelected
                            ? "bg-indigo-600 text-white font-bold shadow-sm"
                            : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                        }`}
                      >
                        {isSubSelected && <Check className="w-2.5 h-2.5" />}
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
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Note / Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Phone EMI, Lunch with team..."
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-2xl transition shadow-lg shadow-indigo-600/25 disabled:opacity-50 mt-1"
          >
            {loading ? "Adding..." : "Add Expense"}
          </button>
        </form>
      </div>
    </div>
  );
}
