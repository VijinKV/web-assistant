"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BellRing, CheckCircle2, Flame, ArrowRight } from "lucide-react";
import {
  CHECKIN_CHANGED_EVENT,
  CHECKIN_OPEN_EVENT,
  CheckInStatus,
  getCheckInStatus,
  hasPendingCheckIn,
} from "@/lib/checkin";
import { trackerService } from "@/lib/trackers";
import { computeTrackerStats } from "@/lib/trackerStats";
import { Tracker } from "@/lib/types";
import { getTodayDateString, shiftDateString } from "@/lib/utils";

// Home-screen summary: is a check-in waiting, and which streaks are alive.
export default function CheckInCard() {
  const [status, setStatus] = useState<CheckInStatus | null>(null);
  const [streaks, setStreaks] = useState<{ tracker: Tracker; streak: number }[]>([]);

  const load = useCallback(async () => {
    try {
      const today = getTodayDateString();
      const [next, trackers, logs] = await Promise.all([
        getCheckInStatus(),
        trackerService.getTrackers(),
        trackerService.getLogs(shiftDateString(today, -60)),
      ]);
      setStatus(next);
      setStreaks(
        trackers
          .map((tracker) => ({ tracker, streak: computeTrackerStats(tracker, logs, today).streak }))
          .filter((s) => s.streak > 0)
          .sort((a, b) => b.streak - a.streak)
      );
    } catch (err) {
      console.error("Check-in card failed:", err);
    }
  }, []);

  useEffect(() => {
    load();
    window.addEventListener(CHECKIN_CHANGED_EVENT, load);
    return () => window.removeEventListener(CHECKIN_CHANGED_EVENT, load);
  }, [load]);

  if (!status) return null;

  const pending = hasPendingCheckIn(status);
  const pendingCount = status.pendingTrackers.length + (status.needsBalance ? 1 : 0);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            {pending ? <BellRing className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          </div>
          <h2 className="font-bold text-slate-900 dark:text-white text-sm">Daily check-in</h2>
        </div>
        <Link
          href="/trackers"
          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
        >
          Habits <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {pending ? (
        <button
          onClick={() => window.dispatchEvent(new Event(CHECKIN_OPEN_EVENT))}
          className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition"
        >
          {pendingCount} thing{pendingCount === 1 ? "" : "s"} to log for {status.label}
        </button>
      ) : (
        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
          All caught up for {status.label}.
        </p>
      )}

      {streaks.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {streaks.map(({ tracker, streak }) => (
            <span
              key={tracker.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-bold"
            >
              <Flame className="w-3 h-3" /> {tracker.name} {streak}d
            </span>
          ))}
        </div>
      )}

      {status.missedDays > 0 && (
        <p className="text-[11px] text-slate-500 leading-relaxed">
          You skipped {status.missedDays} recent day{status.missedDays === 1 ? "" : "s"}. Those won&apos;t be
          asked again, so check in daily.
        </p>
      )}
    </div>
  );
}
