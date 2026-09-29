"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import AuthModal from "@/components/AuthModal";
import { trackerService } from "@/lib/trackers";
import { computeTrackerStats } from "@/lib/trackerStats";
import { CHECKIN_CHANGED_EVENT, CHECKIN_OPEN_EVENT } from "@/lib/checkin";
import { Tracker, TrackerKind, TrackerLog } from "@/lib/types";
import { getDayName, getTodayDateString, shiftDateString } from "@/lib/utils";
import { ArrowLeft, Plus, Trash2, Flame, BellRing } from "lucide-react";

const STARTERS: { name: string; kind: TrackerKind; unit: string }[] = [
  { name: "Gym", kind: "yesno", unit: "" },
  { name: "Coca-Cola", kind: "count", unit: "cans" },
  { name: "Chicken", kind: "yesno", unit: "" },
  { name: "Sugar", kind: "count", unit: "spoons" },
];

export default function TrackersPage() {
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [logs, setLogs] = useState<TrackerLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<TrackerKind>("yesno");
  const [unit, setUnit] = useState("");
  const [error, setError] = useState("");

  const today = getTodayDateString();

  const load = useCallback(async () => {
    try {
      const [list, recent] = await Promise.all([
        trackerService.getTrackers(),
        trackerService.getLogs(shiftDateString(getTodayDateString(), -60)),
      ]);
      setTrackers(list);
      setLogs(recent);
    } catch (err: any) {
      setError(err.message || "Could not load trackers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    window.addEventListener(CHECKIN_CHANGED_EVENT, load);
    return () => window.removeEventListener(CHECKIN_CHANGED_EVENT, load);
  }, [load]);

  const add = async (n: string, k: TrackerKind, u: string) => {
    if (!n.trim()) {
      setError("Give the tracker a name");
      return;
    }
    if (trackers.some((t) => t.name.toLowerCase() === n.trim().toLowerCase())) {
      setError(`"${n.trim()}" already exists`);
      return;
    }
    setError("");
    try {
      await trackerService.addTracker(n, k, u);
      setName("");
      setUnit("");
      await load();
    } catch (err: any) {
      const msg: string = err.message || "Could not add tracker";
      setError(msg.includes("sign in") ? msg : `${msg} (run supabase/trackers.sql in Supabase if you have not yet)`);
    }
  };

  const remove = async (t: Tracker) => {
    if (!confirm(`Delete "${t.name}" and all its history?`)) return;
    try {
      await trackerService.deleteTracker(t.id);
      await load();
    } catch (err: any) {
      setError(err.message || "Could not delete tracker");
    }
  };

  const missingStarters = STARTERS.filter(
    (s) => !trackers.some((t) => t.name.toLowerCase() === s.name.toLowerCase())
  );

  return (
    <div className="min-h-full">
      <Navbar onOpenAuth={() => setAuthModalOpen(true)} />

      <div className="p-4 sm:p-5 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="font-extrabold text-slate-900 dark:text-white text-lg tracking-tight">
                Habits
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">
                Asked once a day: yesterday, or tonight after 10 PM
              </p>
            </div>
          </div>
          <button
            onClick={() => window.dispatchEvent(new Event(CHECKIN_OPEN_EVENT))}
            className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 transition"
            aria-label="Open check-in now"
            title="Open check-in now"
          >
            <BellRing className="w-4 h-4" />
          </button>
        </div>

        {/* Add tracker */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
          <h2 className="font-bold text-slate-900 dark:text-white text-sm">Add something to track</h2>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Coca-Cola, Gym, Sugar"
            className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />

          <div className="flex gap-2">
            {(
              [
                ["yesno", "Yes / No"],
                ["count", "Count"],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setKind(k)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                  kind === k
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                }`}
              >
                {label}
              </button>
            ))}
            {kind === "count" && (
              <input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="unit (cans)"
                className="w-28 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
            )}
          </div>

          <button
            onClick={() => add(name, kind, unit)}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add tracker
          </button>

          {missingStarters.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-400">Quick add:</span>
              {missingStarters.map((s) => (
                <button
                  key={s.name}
                  onClick={() => add(s.name, s.kind, s.unit)}
                  className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-indigo-500/10 hover:text-indigo-600 transition"
                >
                  + {s.name}
                </button>
              ))}
            </div>
          )}

          {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
        </div>

        {/* Tracker cards */}
        {loading ? (
          <p className="text-center text-xs text-slate-400 py-6">Loading...</p>
        ) : trackers.length === 0 ? (
          <p className="text-center text-xs text-slate-500 py-6">
            Nothing tracked yet. Add your first tracker above.
          </p>
        ) : (
          <div className="space-y-3">
            {trackers.map((t) => {
              const stats = computeTrackerStats(t, logs, today);
              return (
                <div
                  key={t.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">{t.name}</h3>
                      <p className="text-[11px] text-slate-500">
                        {t.kind === "yesno"
                          ? `${stats.weekTotal}/7 days this week`
                          : `${stats.weekTotal} ${t.unit || "total"} this week`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {stats.streak > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-bold">
                          <Flame className="w-3 h-3" /> {stats.streak}d
                        </span>
                      )}
                      <button
                        onClick={() => remove(t)}
                        aria-label={`Delete ${t.name}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-1.5">
                    {stats.week.map((d) => {
                      const filled = d.value !== null && d.value > 0;
                      const cell =
                        t.kind === "count" && d.value !== null ? d.value : filled ? "✓" : d.value === 0 ? "–" : "";
                      return (
                        <div key={d.date} className="flex flex-col items-center gap-1">
                          <div
                            className={`w-full h-8 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                              filled
                                ? "bg-indigo-600 text-white"
                                : d.value === 0
                                ? "bg-slate-200 dark:bg-slate-700 text-slate-500"
                                : "border border-dashed border-slate-200 dark:border-slate-700 text-slate-300"
                            }`}
                            title={d.skipped ? "skipped" : d.value === null ? "no answer" : String(d.value)}
                          >
                            {cell}
                          </div>
                          <span className="text-[9px] text-slate-400">{getDayName(d.date).slice(0, 1)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={load}
      />
    </div>
  );
}
