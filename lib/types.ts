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
  difference: number; // previousBalance - balance (e.g. $500 - $420 = $80 outflow)
  isSettled: boolean;
  settledAt?: string | null;
  notes?: string;
  createdAt: string;
}

export interface ExpenseItem {
  id: string;
  userId: string;
  balanceEntryId: string;
  category: string; // "Food", "Groceries", "Transport", "Bills", "Shopping", "Entertainment", "Others"
  amount: number;
  description: string;
  isAutoSettled: boolean; // true if this was auto-created when pressing "Settle"
  createdAt: string;
}

export type Category = 
  | "Food" 
  | "Groceries" 
  | "Transport" 
  | "Bills" 
  | "Shopping" 
  | "Entertainment" 
  | "Health" 
  | "Others";

export interface CategoryInfo {
  name: Category;
  icon: string;
  color: string;
  bg: string;
}
