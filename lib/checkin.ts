import { dataService } from "./storage";
import { trackerService } from "./trackers";
import { isSupabaseConfigured } from "./supabase";
import { Tracker } from "./types";
import { formatDateString, getDayName, getTodayDateString, shiftDateString } from "./utils";

// From this hour (local time) the check-in is about today; before it, about yesterday.
export const CHECKIN_HOUR = 22;
const MISSED_LOOKBACK_DAYS = 7;

const SESSION_DISMISS_KEY = "web_assistant_checkin_dismissed";
const LOCAL_BALANCE_SKIPS_KEY = "web_assistant_balance_skips";

export interface CheckInStatus {
  targetDate: string;
  isToday: boolean;
  label: string; // "today (Mon)" / "yesterday (Sun)"
  needsBalance: boolean;
  pendingTrackers: Tracker[];
  missedDays: number; // recent days with nothing logged; these are never asked again
}

export function getCheckInTarget(now: Date = new Date()): { date: string; isToday: boolean } {
  const today = formatDateString(now);
  if (now.getHours() >= CHECKIN_HOUR) return { date: today, isToday: true };
  return { date: shiftDateString(today, -1), isToday: false };
}

function readBalanceSkips(): string[] {
  try {
    const raw = localStorage.getItem(LOCAL_BALANCE_SKIPS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markBalanceSkipped(date: string) {
  try {
    const skips = readBalanceSkips();
    if (!skips.includes(date)) {
      // keep the list tiny; only recent dates matter
      localStorage.setItem(LOCAL_BALANCE_SKIPS_KEY, JSON.stringify([...skips.slice(-30), date]));
    }
  } catch {}
}

// Closing the popup with X = "ask me later": quiet for this browser session only.
export function isDismissedThisSession(date: string): boolean {
  try {
    return sessionStorage.getItem(SESSION_DISMISS_KEY) === date;
  } catch {
    return false;
  }
}

export function dismissForSession(date: string) {
  try {
    sessionStorage.setItem(SESSION_DISMISS_KEY, date);
  } catch {}
}

export async function getCheckInStatus(now: Date = new Date()): Promise<CheckInStatus> {
  const { date: targetDate, isToday } = getCheckInTarget(now);

  // With Supabase, data is per account: nothing to ask (or save) until signed in.
  if (isSupabaseConfigured && !(await dataService.getUser())) {
    return {
      targetDate,
      isToday,
      label: getDayName(targetDate).slice(0, 3),
      needsBalance: false,
      pendingTrackers: [],
      missedDays: 0,
    };
  }

  const [trackers, entries, recentLogs] = await Promise.all([
    trackerService.getTrackers(),
    dataService.getBalanceEntries(),
    trackerService.getLogs(shiftDateString(targetDate, -MISSED_LOOKBACK_DAYS)),
  ]);

  const answeredIds = new Set(recentLogs.filter((l) => l.date === targetDate).map((l) => l.trackerId));

  // A tracker added after the target day shouldn't be asked about that day.
  const pendingTrackers = trackers.filter(
    (t) => !answeredIds.has(t.id) && formatDateString(new Date(t.createdAt)) <= targetDate
  );

  // Don't ask for a balance older than one already recorded: it would corrupt that day's difference.
  const needsBalance =
    !entries.some((e) => e.date >= targetDate) && !readBalanceSkips().includes(targetDate);

  // Days in the last week with no balance and no tracker answer, counted only since tracking began.
  const startDates = [
    ...trackers.map((t) => formatDateString(new Date(t.createdAt))),
    ...entries.map((e) => e.date),
  ];
  let missedDays = 0;
  if (startDates.length > 0) {
    const start = startDates.reduce((a, b) => (a < b ? a : b));
    const active = new Set([...entries.map((e) => e.date), ...recentLogs.map((l) => l.date)]);
    for (let i = 1; i <= MISSED_LOOKBACK_DAYS; i++) {
      const day = shiftDateString(targetDate, -i);
      if (day >= start && !active.has(day)) missedDays++;
    }
  }

  const todayStr = getTodayDateString();
  return {
    targetDate,
    isToday,
    label: `${targetDate === todayStr ? "today" : "yesterday"} (${getDayName(targetDate).slice(0, 3)})`,
    needsBalance,
    pendingTrackers,
    missedDays,
  };
}

export function hasPendingCheckIn(status: CheckInStatus): boolean {
  return status.needsBalance || status.pendingTrackers.length > 0;
}

// Cross-component events so the popup, home banner and tracker page stay in sync.
export const CHECKIN_OPEN_EVENT = "checkin:open";
export const CHECKIN_CHANGED_EVENT = "checkin:changed";
