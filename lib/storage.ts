import { supabase, isSupabaseConfigured } from "./supabase";
import { BalanceEntry, ExpenseItem, UserProfile } from "./types";
import { getDayName } from "./utils";

const LOCAL_BALANCES_KEY = "web_assistant_balances";
const LOCAL_EXPENSES_KEY = "web_assistant_expenses";
const LOCAL_USER_KEY = "web_assistant_user";
const LOCAL_DEMO_USER_ID = "local_demo";

// Local storage fallback helpers
function getLocalBalances(): BalanceEntry[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(LOCAL_BALANCES_KEY);
  return raw ? JSON.parse(raw) : [];
}

function setLocalBalances(entries: BalanceEntry[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_BALANCES_KEY, JSON.stringify(entries));
}

function getLocalExpenses(): ExpenseItem[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(LOCAL_EXPENSES_KEY);
  return raw ? JSON.parse(raw) : [];
}

function setLocalExpenses(expenses: ExpenseItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_EXPENSES_KEY, JSON.stringify(expenses));
}

export const dataService = {
  // Current user / auth status
  async getUser(): Promise<UserProfile | null> {
    if (isSupabaseConfigured) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      return {
        id: user.id,
        email: user.email || "",
        name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
        avatarUrl: user.user_metadata?.avatar_url,
      };
    } else {
      if (typeof window === "undefined") return null;
      const raw = localStorage.getItem(LOCAL_USER_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    }
  },

  // Supabase data is only reachable when signed in (row level security uses auth.uid()).
  // Local demo mode keeps everything in this browser, so it needs no account.
  async getEffectiveUserId(): Promise<string> {
    const user = await this.getUser();
    if (user) return user.id;
    if (isSupabaseConfigured) throw new Error("Please sign in to save and view your data.");
    return LOCAL_DEMO_USER_ID;
  },

  // Get all balance entries sorted descending by date
  async getBalanceEntries(): Promise<BalanceEntry[]> {
    if (isSupabaseConfigured) {
      const user = await this.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("balance_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (error) {
        console.error("Error fetching balance entries from Supabase:", error);
        return [];
      }

      return (data || []).map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        date: row.date,
        dayName: row.day_name,
        balance: Number(row.balance),
        previousBalance: row.previous_balance ? Number(row.previous_balance) : null,
        difference: Number(row.difference),
        isSettled: row.is_settled,
        settledAt: row.settled_at,
        notes: row.notes,
        createdAt: row.created_at,
      }));
    } else {
      const list = getLocalBalances();
      return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
  },

  // Get the most recent balance entry prior to a specific date
  async getLatestBalanceBefore(date: string): Promise<BalanceEntry | null> {
    const all = await this.getBalanceEntries();
    const older = all.filter((entry) => entry.date < date);
    return older.length > 0 ? older[0] : null;
  },

  // Record a new balance entry (auto-calculates difference from previous entry)
  async recordBalance(
    date: string,
    balance: number,
    manualPreviousBalance?: number | null,
    notes?: string
  ): Promise<BalanceEntry> {
    const userId = await this.getEffectiveUserId();
    const dayName = getDayName(date);

    // Determine previous balance: if not manually specified, find latest preceding entry
    let prevBal = manualPreviousBalance;
    if (prevBal === undefined) {
      const prevEntry = await this.getLatestBalanceBefore(date);
      prevBal = prevEntry ? prevEntry.balance : null;
    }

    // Difference = previousBalance - currentBalance (how much spent)
    // E.g. Sunday ₹5000, Monday ₹4200 => Difference = ₹800 spent
    const difference = prevBal !== null ? prevBal - balance : 0;

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("balance_entries")
        .insert({
          user_id: userId,
          date,
          day_name: dayName,
          balance,
          previous_balance: prevBal,
          difference,
          is_settled: difference === 0, // auto-settled if 0 difference
          notes: notes || "",
        })
        .select()
        .single();

      if (error) {
        console.error("Supabase insert error, falling back to local:", error);
        throw new Error(error.message);
      }

      return {
        id: data.id,
        userId: data.user_id,
        date: data.date,
        dayName: data.day_name,
        balance: Number(data.balance),
        previousBalance: data.previous_balance ? Number(data.previous_balance) : null,
        difference: Number(data.difference),
        isSettled: data.is_settled,
        settledAt: data.settled_at,
        notes: data.notes,
        createdAt: data.created_at,
      };
    } else {
      const newEntry: BalanceEntry = {
        id: "bal_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
        userId,
        date,
        dayName,
        balance,
        previousBalance: prevBal,
        difference,
        isSettled: difference === 0,
        settledAt: null,
        notes: notes || "",
        createdAt: new Date().toISOString(),
      };

      const existing = getLocalBalances();
      const filtered = existing.filter((b) => b.date !== date);
      setLocalBalances([newEntry, ...filtered]);
      return newEntry;
    }
  },

  // Get expenses associated with a balance entry
  async getExpenses(balanceEntryId: string): Promise<ExpenseItem[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("balance_entry_id", balanceEntryId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching expenses:", error);
        return [];
      }

      return (data || []).map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        balanceEntryId: row.balance_entry_id,
        category: row.category,
        subcategory: row.subcategory || undefined,
        amount: Number(row.amount),
        description: row.description,
        isAutoSettled: row.is_auto_settled,
        createdAt: row.created_at,
      }));
    } else {
      return getLocalExpenses().filter((exp) => exp.balanceEntryId === balanceEntryId);
    }
  },

  // Add an expense against a balance entry
  async addExpense(
    balanceEntryId: string,
    category: string,
    amount: number,
    description: string,
    subcategory?: string
  ): Promise<ExpenseItem> {
    const userId = await this.getEffectiveUserId();

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("expenses")
        .insert({
          user_id: userId,
          balance_entry_id: balanceEntryId,
          category,
          subcategory: subcategory || "",
          amount,
          description: description || "",
          is_auto_settled: false,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);

      return {
        id: data.id,
        userId: data.user_id,
        balanceEntryId: data.balance_entry_id,
        category: data.category,
        subcategory: data.subcategory || undefined,
        amount: Number(data.amount),
        description: data.description,
        isAutoSettled: data.is_auto_settled,
        createdAt: data.created_at,
      };
    } else {
      const newExpense: ExpenseItem = {
        id: "exp_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
        userId,
        balanceEntryId,
        category,
        subcategory: subcategory || undefined,
        amount,
        description: description || "",
        isAutoSettled: false,
        createdAt: new Date().toISOString(),
      };

      const list = getLocalExpenses();
      setLocalExpenses([...list, newExpense]);
      return newExpense;
    }
  },

  // Delete an expense
  async deleteExpense(expenseId: string): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from("expenses").delete().eq("id", expenseId);
      if (error) throw new Error(error.message);
    } else {
      const list = getLocalExpenses().filter((e) => e.id !== expenseId);
      setLocalExpenses(list);
    }
  },

  // Settle balance: allocates remaining difference to "Others" and marks entry as settled
  async settleBalance(
    entry: BalanceEntry,
    currentExpenses: ExpenseItem[]
  ): Promise<{ settledExpense?: ExpenseItem; updatedEntry: BalanceEntry }> {
    const userId = await this.getEffectiveUserId();

    const totalAccounted = currentExpenses.reduce((sum, item) => sum + item.amount, 0);
    const remainingDifference = Math.max(0, entry.difference - totalAccounted);

    let settledExpense: ExpenseItem | undefined = undefined;

    // If there is an unaccounted difference remaining, record it into "Others"
    if (remainingDifference > 0) {
      if (isSupabaseConfigured) {
        const { data: expData, error: expError } = await supabase
          .from("expenses")
          .insert({
            user_id: userId,
            balance_entry_id: entry.id,
            category: "Others",
            amount: remainingDifference,
            description: "Auto-settled remaining difference",
            is_auto_settled: true,
          })
          .select()
          .single();

        if (expError) throw new Error(expError.message);
        settledExpense = {
          id: expData.id,
          userId: expData.user_id,
          balanceEntryId: expData.balance_entry_id,
          category: expData.category,
          amount: Number(expData.amount),
          description: expData.description,
          isAutoSettled: true,
          createdAt: expData.created_at,
        };
      } else {
        settledExpense = {
          id: "exp_settle_" + Date.now(),
          userId,
          balanceEntryId: entry.id,
          category: "Others",
          amount: remainingDifference,
          description: "Auto-settled remaining difference",
          isAutoSettled: true,
          createdAt: new Date().toISOString(),
        };
        const list = getLocalExpenses();
        setLocalExpenses([...list, settledExpense]);
      }
    }

    const settledAt = new Date().toISOString();

    // Mark balance entry as settled
    if (isSupabaseConfigured) {
      const { data: updatedData, error: updateError } = await supabase
        .from("balance_entries")
        .update({
          is_settled: true,
          settled_at: settledAt,
        })
        .eq("id", entry.id)
        .select()
        .single();

      if (updateError) throw new Error(updateError.message);

      return {
        settledExpense,
        updatedEntry: {
          id: updatedData.id,
          userId: updatedData.user_id,
          date: updatedData.date,
          dayName: updatedData.day_name,
          balance: Number(updatedData.balance),
          previousBalance: updatedData.previous_balance ? Number(updatedData.previous_balance) : null,
          difference: Number(updatedData.difference),
          isSettled: true,
          settledAt,
          notes: updatedData.notes,
          createdAt: updatedData.created_at,
        },
      };
    } else {
      const updatedEntry: BalanceEntry = {
        ...entry,
        isSettled: true,
        settledAt,
      };

      const all = getLocalBalances();
      const updatedList = all.map((b) => (b.id === entry.id ? updatedEntry : b));
      setLocalBalances(updatedList);

      return {
        settledExpense,
        updatedEntry,
      };
    }
  },

  // Delete balance entry and its expenses
  async deleteBalanceEntry(entryId: string): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from("balance_entries").delete().eq("id", entryId);
      if (error) throw new Error(error.message);
    } else {
      const balances = getLocalBalances().filter((b) => b.id !== entryId);
      setLocalBalances(balances);
      const expenses = getLocalExpenses().filter((e) => e.balanceEntryId !== entryId);
      setLocalExpenses(expenses);
    }
  },
};
