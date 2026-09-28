import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Category, CategoryInfo } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getDayName(dateString: string): string {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", { weekday: "long" });
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const CATEGORIES: Record<Category, CategoryInfo> = {
  Food: {
    name: "Food",
    icon: "Utensils",
    color: "text-amber-500",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  Groceries: {
    name: "Groceries",
    icon: "ShoppingCart",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  Transport: {
    name: "Transport",
    icon: "Car",
    color: "text-blue-500",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  Bills: {
    name: "Bills",
    icon: "Receipt",
    color: "text-rose-500",
    bg: "bg-rose-500/10 border-rose-500/20",
  },
  Shopping: {
    name: "Shopping",
    icon: "Bag",
    color: "text-purple-500",
    bg: "bg-purple-500/10 border-purple-500/20",
  },
  Entertainment: {
    name: "Entertainment",
    icon: "Film",
    color: "text-indigo-500",
    bg: "bg-indigo-500/10 border-indigo-500/20",
  },
  Health: {
    name: "Health",
    icon: "HeartPulse",
    color: "text-teal-500",
    bg: "bg-teal-500/10 border-teal-500/20",
  },
  Others: {
    name: "Others",
    icon: "MoreHorizontal",
    color: "text-slate-500",
    bg: "bg-slate-500/10 border-slate-500/20",
  },
};
