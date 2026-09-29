import { Tracker, TrackerLog } from "./types";
import { shiftDateString } from "./utils";

export interface TrackerStats {
  streak: number; // consecutive days answered "yes" (yesno) or logged > 0 (count), ending today/yesterday
  weekTotal: number; // yesno: days done, count: sum, over the last 7 days
  week: { date: string; value: number | null; skipped: boolean }[]; // oldest -> newest, 7 entries
}

export function computeTrackerStats(tracker: Tracker, logs: TrackerLog[], today: string): TrackerStats {
  const byDate = new Map<string, TrackerLog>();
  for (const l of logs) if (l.trackerId === tracker.id) byDate.set(l.date, l);

  const hit = (date: string) => {
    const l = byDate.get(date);
    return !!l && !l.skipped && l.value > 0;
  };

  // Today may simply not be answered yet, so don't break the streak on it.
  let cursor = hit(today) ? today : shiftDateString(today, -1);
  let streak = 0;
  while (hit(cursor)) {
    streak++;
    cursor = shiftDateString(cursor, -1);
  }

  const week = [];
  let weekTotal = 0;
  for (let i = 6; i >= 0; i--) {
    const date = shiftDateString(today, -i);
    const l = byDate.get(date);
    week.push({ date, value: l && !l.skipped ? l.value : null, skipped: !!l?.skipped });
    if (l && !l.skipped) weekTotal += tracker.kind === "yesno" ? (l.value > 0 ? 1 : 0) : l.value;
  }

  return { streak, weekTotal, week };
}
