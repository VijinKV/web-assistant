"use client";

import { useState } from "react";
import { X, Wallet, Check, Activity } from "lucide-react";
import { dataService } from "@/lib/storage";
import { trackerService } from "@/lib/trackers";
import { CheckInStatus, markBalanceSkipped } from "@/lib/checkin";

interface CheckInModalProps {
  status: CheckInStatus;
  onClose: () => void; // X = ask me later
  onSaved: () => void;
}

// value: null = not answered yet (saved as skipped), number = answered
type Answers = Record<string, number | null>;

export default function CheckInModal({ status, onClose, onSaved }: CheckInModalProps) {
  const [balance, setBalance] = useState("");
  const [answers, setAnswers] = useState<Answers>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const setAnswer = (id: string, value: number | null) =>
    setAnswers((prev) => ({ ...prev, [id]: value }));

  const handleSave = async () => {
    const balanceValue = balance.trim() === "" ? null : Number(balance);
    if (balanceValue !== null && isNaN(balanceValue)) {
      setError("Balance must be a number");
      return;
    }
    setError("");
    setSaving(true);

    try {
      if (status.needsBalance) {
        if (balanceValue !== null) {
          await dataService.recordBalance(status.targetDate, balanceValue);
        } else {
          markBalanceSkipped(status.targetDate);
        }
      }

      for (const tracker of status.pendingTrackers) {
        const answer = answers[tracker.id];
        if (answer === null || answer === undefined) {
          await trackerService.saveLog(tracker.id, status.targetDate, 0, true);
        } else {
          await trackerService.saveLog(tracker.id, status.targetDate, answer, false);
        }
      }
      onSaved();
    } catch (err: any) {
      setError(err.message || "Could not save check-in");
    } finally {
      setSaving(false);
    }
  };

  const answeredAny =
    balance.trim() !== "" || Object.values(answers).some((v) => v !== null && v !== undefined);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-sm max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between shrink-0">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Daily check-in</h3>
            <p className="text-xs text-slate-500">
              How was <span className="font-semibold">{status.label}</span>?
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Ask me later"
            className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          {status.needsBalance && (
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <Wallet className="w-4 h-4 text-indigo-500" />
                Closing balance
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  placeholder="Leave empty to skip"
                  className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>
            </div>
          )}

          {status.pendingTrackers.map((tracker) => {
            const answer = answers[tracker.id];
            return (
              <div
                key={tracker.id}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-2"
              >
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                  <Activity className="w-4 h-4 text-indigo-500" />
                  {tracker.kind === "yesno" ? `${tracker.name}?` : tracker.name}
                </div>

                {tracker.kind === "yesno" ? (
                  <div className="flex gap-2">
                    {[
                      { label: "Yes", value: 1 },
                      { label: "No", value: 0 },
                    ].map((opt) => (
                      <button
                        key={opt.label}
                        onClick={() => setAnswer(tracker.id, answer === opt.value ? null : opt.value)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                          answer === opt.value
                            ? "bg-indigo-600 border-indigo-600 text-white"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="any"
                      value={answer ?? ""}
                      onChange={(e) =>
                        setAnswer(tracker.id, e.target.value === "" ? null : Number(e.target.value))
                      }
                      placeholder={`How many${tracker.unit ? " " + tracker.unit : ""}?`}
                      className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                    />
                    <button
                      onClick={() => setAnswer(tracker.id, 0)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                        answer === 0
                          ? "bg-indigo-600 border-indigo-600 text-white"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      None
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
        </div>

        <div className="p-5 pt-0 space-y-2 shrink-0">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold text-sm transition flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            {saving ? "Saving..." : answeredAny ? "Save check-in" : "Skip all for this day"}
          </button>
          <p className="text-[10px] text-slate-400 text-center">
            Anything left blank is skipped and won&apos;t be asked again. Tap ✕ to be asked later.
          </p>
        </div>
      </div>
    </div>
  );
}
