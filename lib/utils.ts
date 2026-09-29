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

export function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getTodayDateString(): string {
  return formatDateString(new Date());
}

// Shift a YYYY-MM-DD string by whole days (negative = past)
export function shiftDateString(dateString: string, days: number): string {
  const [year, month, day] = dateString.split("-").map(Number);
  return formatDateString(new Date(year, month - 1, day + days));
}

export function calculateDaysBetween(startDateStr: string, endDateStr: string): number {
  const [sy, sm, sd] = startDateStr.split("-").map(Number);
  const [ey, em, ed] = endDateStr.split("-").map(Number);
  const start = new Date(Date.UTC(sy, sm - 1, sd));
  const end = new Date(Date.UTC(ey, em - 1, ed));
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
}

export function getPerDaySpend(difference: number, days: number): number {
  return Math.abs(difference) / Math.max(1, days);
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
