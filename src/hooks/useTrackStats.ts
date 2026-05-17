import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { OWNER_ID } from "../lib/owner";
import { useFocus } from "./useFocus";

export type TrackHours = {
  groupId: string | null;
  hours: number;
  sessions: number;
};

export type TrackStats = {
  loading: boolean;
  byGroup: Map<string, TrackHours>;
  totalHours: number;
  todayMinutes: number;
  weekMinutes: number[]; // 7 elements, oldest first, today last
  sessionsToday: number;
  bestStreak: number; // longest consecutive completed work sessions
};

const empty: TrackStats = {
  loading: true,
  byGroup: new Map(),
  totalHours: 0,
  todayMinutes: 0,
  weekMinutes: [0, 0, 0, 0, 0, 0, 0],
  sessionsToday: 0,
  bestStreak: 0,
};

function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function useTrackStats(): TrackStats {
  const focus = useFocus();
  const [stats, setStats] = useState<TrackStats>(empty);

  useEffect(() => {
    let alive = true;
    (async () => {
      const since = new Date();
      since.setDate(since.getDate() - 7);
      const [{ data: weekRows, error: wErr }, { data: allRows, error: aErr }] = await Promise.all([
        supabase
          .from("focus_sessions")
          .select("started_at, duration_seconds, phase")
          .eq("user_id", OWNER_ID)
          .gte("started_at", since.toISOString()),
        supabase
          .from("focus_sessions")
          .select("group_id, duration_seconds, phase")
          .eq("user_id", OWNER_ID)
          .eq("phase", "work"),
      ]);
      if (!alive) return;
      if (wErr || aErr) console.error("[track_stats]", wErr ?? aErr);

      const byGroup = new Map<string, TrackHours>();
      for (const r of (allRows ?? []) as Array<{ group_id: string | null; duration_seconds: number; phase: string }>) {
        const key = r.group_id ?? "__none__";
        const cur = byGroup.get(key) ?? { groupId: r.group_id, hours: 0, sessions: 0 };
        cur.hours += r.duration_seconds / 3600;
        cur.sessions += 1;
        byGroup.set(key, cur);
      }
      const totalHours = Array.from(byGroup.values()).reduce((s, t) => s + t.hours, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekMinutes = [0, 0, 0, 0, 0, 0, 0];
      let todayMinutes = 0;
      let sessionsToday = 0;
      for (const r of (weekRows ?? []) as Array<{ started_at: string; duration_seconds: number; phase: string }>) {
        if (r.phase !== "work") continue;
        const d = new Date(r.started_at);
        const dayKey = new Date(d);
        dayKey.setHours(0, 0, 0, 0);
        const diff = Math.floor((today.getTime() - dayKey.getTime()) / (24 * 3600 * 1000));
        if (diff >= 0 && diff < 7) {
          weekMinutes[6 - diff] += Math.round(r.duration_seconds / 60);
        }
        if (localDateKey(d) === localDateKey(today)) {
          todayMinutes += Math.round(r.duration_seconds / 60);
          sessionsToday += 1;
        }
      }

      setStats({
        loading: false,
        byGroup,
        totalHours,
        todayMinutes,
        weekMinutes,
        sessionsToday,
        bestStreak: Math.max(0, sessionsToday), // simple proxy for "best today"; can be improved later
      });
    })();
    return () => {
      alive = false;
    };
  }, [focus.sessions.length]);

  return stats;
}
