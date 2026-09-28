import { CategoryItem } from "./types";

const LOCAL_CATEGORIES_KEY = "web_assistant_categories_v2";

export const DEFAULT_CATEGORIES: CategoryItem[] = [
  {
    id: "cat_emi",
    name: "EMI",
    subcategories: ["CRED", "Electronics", "Personal Loan", "Vehicle", "Home Loan"],
    color: "text-rose-500",
    bg: "bg-rose-500/10 border-rose-500/20",
  },
  {
    id: "cat_food",
    name: "Food",
    subcategories: ["Dining Out", "Cafe / Coffee", "Delivery / Swiggy", "Snacks"],
    color: "text-amber-500",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  {
    id: "cat_groceries",
    name: "Groceries",
    subcategories: ["Supermarket", "Vegetables & Fruits", "Dairy / Milk", "Supplies"],
    color: "text-emerald-500",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  {
    id: "cat_bills",
    name: "Bills",
    subcategories: ["Electricity", "Wifi / Internet", "Mobile Recharge", "Rent", "Gas"],
    color: "text-red-500",
    bg: "bg-red-500/10 border-red-500/20",
  },
  {
    id: "cat_transport",
    name: "Transport",
    subcategories: ["Fuel / Petrol", "Cab / Auto", "Train / Metro", "Parking"],
    color: "text-blue-500",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  {
    id: "cat_shopping",
    name: "Shopping",
    subcategories: ["Clothing", "Gadgets", "Household", "Amazon / Online"],
    color: "text-purple-500",
    bg: "bg-purple-500/10 border-purple-500/20",
  },
  {
    id: "cat_entertainment",
    name: "Entertainment",
    subcategories: ["Movies", "OTT Subscriptions", "Games / Outing"],
    color: "text-indigo-500",
    bg: "bg-indigo-500/10 border-indigo-500/20",
  },
  {
    id: "cat_health",
    name: "Health",
    subcategories: ["Medicines", "Doctor / Clinic", "Gym / Fitness", "Tests"],
    color: "text-teal-500",
    bg: "bg-teal-500/10 border-teal-500/20",
  },
  {
    id: "cat_others",
    name: "Others",
    subcategories: ["Miscellaneous", "Cash Withdrawal", "Unplanned"],
    color: "text-slate-500",
    bg: "bg-slate-500/10 border-slate-500/20",
  },
];

export const categoryService = {
  getCategories(): CategoryItem[] {
    if (typeof window === "undefined") return DEFAULT_CATEGORIES;
    try {
      const raw = localStorage.getItem(LOCAL_CATEGORIES_KEY);
      if (!raw) {
        localStorage.setItem(LOCAL_CATEGORIES_KEY, JSON.stringify(DEFAULT_CATEGORIES));
        return DEFAULT_CATEGORIES;
      }
      return JSON.parse(raw);
    } catch (e) {
      return DEFAULT_CATEGORIES;
    }
  },

  saveCategories(categories: CategoryItem[]): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(LOCAL_CATEGORIES_KEY, JSON.stringify(categories));
  },

  addCategory(name: string, initialSubcategory?: string): CategoryItem {
    const list = this.getCategories();
    const trimmed = name.trim();
    const existing = list.find((c) => c.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      if (initialSubcategory && initialSubcategory.trim()) {
        return this.addSubcategory(existing.name, initialSubcategory.trim());
      }
      return existing;
    }

    const newCat: CategoryItem = {
      id: "cat_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      name: trimmed,
      subcategories: initialSubcategory && initialSubcategory.trim() ? [initialSubcategory.trim()] : [],
      color: "text-indigo-500",
      bg: "bg-indigo-500/10 border-indigo-500/20",
    };

    const updated = [...list, newCat];
    this.saveCategories(updated);
    return newCat;
  },

  addSubcategory(categoryName: string, subcategoryName: string): CategoryItem {
    const list = this.getCategories();
    const trimmedSub = subcategoryName.trim();
    const updated = list.map((cat) => {
      if (cat.name.toLowerCase() === categoryName.trim().toLowerCase()) {
        const hasSub = cat.subcategories.some(
          (s) => s.toLowerCase() === trimmedSub.toLowerCase()
        );
        if (!hasSub && trimmedSub) {
          return {
            ...cat,
            subcategories: [...cat.subcategories, trimmedSub],
          };
        }
      }
      return cat;
    });

    this.saveCategories(updated);
    return updated.find((c) => c.name.toLowerCase() === categoryName.trim().toLowerCase()) || list[0];
  },

  deleteSubcategory(categoryName: string, subcategoryName: string): void {
    const list = this.getCategories();
    const updated = list.map((cat) => {
      if (cat.name.toLowerCase() === categoryName.trim().toLowerCase()) {
        return {
          ...cat,
          subcategories: cat.subcategories.filter((s) => s !== subcategoryName),
        };
      }
      return cat;
    });
    this.saveCategories(updated);
  },

  deleteCategory(categoryId: string): void {
    const list = this.getCategories();
    const updated = list.filter((c) => c.id !== categoryId);
    this.saveCategories(updated);
  }
};
