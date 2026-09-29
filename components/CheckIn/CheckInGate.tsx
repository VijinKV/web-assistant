"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import CheckInModal from "./CheckInModal";
import {
  CHECKIN_CHANGED_EVENT,
  CHECKIN_OPEN_EVENT,
  CheckInStatus,
  dismissForSession,
  getCheckInStatus,
  hasPendingCheckIn,
  isDismissedThisSession,
} from "@/lib/checkin";

// Mounted once in the root layout. Opens the daily check-in popup when the site is
// opened (or the tab is brought back) and something is still unanswered.
export default function CheckInGate() {
  const [status, setStatus] = useState<CheckInStatus | null>(null);
  const checking = useRef(false);

  const check = useCallback(async (force: boolean) => {
    if (checking.current) return;
    checking.current = true;
    try {
      const next = await getCheckInStatus();
      if (hasPendingCheckIn(next) && (force || !isDismissedThisSession(next.targetDate))) {
        setStatus(next);
      } else {
        setStatus(null);
      }
    } catch (err) {
      console.error("Check-in status failed:", err);
    } finally {
      checking.current = false;
    }
  }, []);

  useEffect(() => {
    check(false);

    const onVisible = () => {
      if (document.visibilityState === "visible") check(false);
    };
    const onOpen = () => check(true);

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener(CHECKIN_OPEN_EVENT, onOpen);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener(CHECKIN_OPEN_EVENT, onOpen);
    };
  }, [check]);

  if (!status) return null;

  return (
    <CheckInModal
      status={status}
      onClose={() => {
        dismissForSession(status.targetDate);
        setStatus(null);
        window.dispatchEvent(new Event(CHECKIN_CHANGED_EVENT));
      }}
      onSaved={() => {
        setStatus(null);
        window.dispatchEvent(new Event(CHECKIN_CHANGED_EVENT));
      }}
    />
  );
}
