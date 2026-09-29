export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}

export interface BalanceEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  dayName: string; // e.g. "Sunday", "Monday"
  balance: number; // Stored current balance
  previousBalance: number | null; // Balance of the preceding day/entry
  difference: number; // previousBalance - balance (e.g. ₹5000 - ₹4200 = ₹800 outflow)
  isSettled: boolean;
  settledAt?: string | null;
  notes?: string;
  createdAt: string;
}

export interface ExpenseItem {
  id: string;
  userId: string;
  balanceEntryId: string;
  category: string; // e.g. "EMI", "Food", "Bills"
  subcategory?: string; // e.g. "CRED", "Electronics"
  amount: number;
  description: string;
  isAutoSettled: boolean; // true if this was auto-created when pressing "Settle"
  createdAt: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  subcategories: string[];
  icon?: string;
  color?: string;
  bg?: string;
}

export type Category = string;

export interface CategoryInfo {
  name: string;
  icon?: string;
  color: string;
  bg: string;
}

export type TrackerKind = "yesno" | "count";

export interface Tracker {
  id: string;
  userId: string;
  name: string; // e.g. "Gym", "Coca-Cola"
  kind: TrackerKind; // yesno = did it / didn't, count = how many
  unit: string; // e.g. "cans" (count trackers only)
  isActive: boolean;
  createdAt: string;
}

export interface TrackerLog {
  id: string;
  userId: string;
  trackerId: string;
  date: string; // YYYY-MM-DD the answer is about
  value: number; // yesno: 1 = yes, 0 = no; count: the amount
  skipped: boolean; // true = user chose not to answer; never asked again
  createdAt: string;
}
