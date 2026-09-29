import { supabase, isSupabaseConfigured } from "./supabase";
import { dataService } from "./storage";
import { Tracker, TrackerKind, TrackerLog } from "./types";

const LOCAL_TRACKERS_KEY = "web_assistant_trackers";
const LOCAL_TRACKER_LOGS_KEY = "web_assistant_tracker_logs";

function readLocal<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

function writeLocal<T>(key: string, list: T[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(list));
}

function localId(prefix: string): string {
  return prefix + "_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
}

function mapTracker(row: any): Tracker {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    kind: row.kind,
    unit: row.unit || "",
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

function mapLog(row: any): TrackerLog {
  return {
    id: row.id,
    userId: row.user_id,
    trackerId: row.tracker_id,
    date: row.date,
    value: Number(row.value),
    skipped: row.skipped,
    createdAt: row.created_at,
  };
}

export const trackerService = {
  async getTrackers(): Promise<Tracker[]> {
    if (isSupabaseConfigured) {
      const user = await dataService.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("trackers")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching trackers (did you run supabase/trackers.sql?):", error);
        return [];
      }
      return (data || []).map(mapTracker);
    }

    return readLocal<Tracker>(LOCAL_TRACKERS_KEY)
      .filter((t) => t.isActive)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },

  async addTracker(name: string, kind: TrackerKind, unit: string): Promise<Tracker> {
    const userId = await dataService.getEffectiveUserId();
    const cleanName = name.trim();
    const cleanUnit = kind === "count" ? unit.trim() : "";

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("trackers")
        .insert({ user_id: userId, name: cleanName, kind, unit: cleanUnit })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return mapTracker(data);
    }

    const tracker: Tracker = {
      id: localId("trk"),
      userId,
      name: cleanName,
      kind,
      unit: cleanUnit,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    writeLocal(LOCAL_TRACKERS_KEY, [...readLocal<Tracker>(LOCAL_TRACKERS_KEY), tracker]);
    return tracker;
  },

  async deleteTracker(trackerId: string): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from("trackers").delete().eq("id", trackerId);
      if (error) throw new Error(error.message);
      return;
    }
    writeLocal(
      LOCAL_TRACKERS_KEY,
      readLocal<Tracker>(LOCAL_TRACKERS_KEY).filter((t) => t.id !== trackerId)
    );
    writeLocal(
      LOCAL_TRACKER_LOGS_KEY,
      readLocal<TrackerLog>(LOCAL_TRACKER_LOGS_KEY).filter((l) => l.trackerId !== trackerId)
    );
  },

  // All logs on/after sinceDate (YYYY-MM-DD), newest first
  async getLogs(sinceDate: string): Promise<TrackerLog[]> {
    if (isSupabaseConfigured) {
      const user = await dataService.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("tracker_logs")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", sinceDate)
        .order("date", { ascending: false });

      if (error) {
        console.error("Error fetching tracker logs:", error);
        return [];
      }
      return (data || []).map(mapLog);
    }

    return readLocal<TrackerLog>(LOCAL_TRACKER_LOGS_KEY)
      .filter((l) => l.date >= sinceDate)
      .sort((a, b) => b.date.localeCompare(a.date));
  },

  // One answer per tracker per day; saving again overwrites
  async saveLog(trackerId: string, date: string, value: number, skipped: boolean): Promise<void> {
    const userId = await dataService.getEffectiveUserId();

    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from("tracker_logs")
        .upsert(
          { user_id: userId, tracker_id: trackerId, date, value, skipped },
          { onConflict: "tracker_id,date" }
        );
      if (error) throw new Error(error.message);
      return;
    }

    const others = readLocal<TrackerLog>(LOCAL_TRACKER_LOGS_KEY).filter(
      (l) => !(l.trackerId === trackerId && l.date === date)
    );
    others.push({
      id: localId("log"),
      userId,
      trackerId,
      date,
      value,
      skipped,
      createdAt: new Date().toISOString(),
    });
    writeLocal(LOCAL_TRACKER_LOGS_KEY, others);
  },
};
