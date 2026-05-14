import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { OWNER_ID } from "../lib/owner";
import { useProgress } from "./useProgress";

const TABLE = "user_progress";
const WEEKS = 26;
const DAYS = WEEKS * 7;

export type Activity = {
  loading: boolean;
  streak: number;
  longestStreak: number;
  todayCount: number;
  heatmap: number[];
  activeDays: number;
  recent: Array<{ topic_id: string; status: string; updated_at: string }>;
};

const empty: Activity = {
  loading: true,
  streak: 0,
  longestStreak: 0,
  todayCount: 0,
  heatmap: new Array(DAYS).fill(0),
  activeDays: 0,
  recent: [],
};

function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function levelFromCount(c: number): number {
  if (c === 0) return 0;
  if (c === 1) return 1;
  if (c <= 3) return 2;
  if (c <= 6) return 3;
  return 4;
}

export function useActivity(): Activity {
  const userId = OWNER_ID;
  const progress = useProgress();
  const [state, setState] = useState<Activity>(empty);

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    (async () => {
      const { data, error } = await supabase
        .from(TABLE)
        .select("topic_id, status, updated_at")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });
      if (!alive) return;
      if (error || !data) {
        setState({ ...empty, loading: false });
        return;
      }
      const rows = data as Array<{ topic_id: string; status: string; updated_at: string }>;

      const counts: Record<string, number> = {};
      for (const r of rows) {
        const key = localDateKey(new Date(r.updated_at));
        counts[key] = (counts[key] ?? 0) + 1;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const heatmap: number[] = [];
      let activeDays = 0;
      for (let i = DAYS - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const c = counts[localDateKey(d)] ?? 0;
        if (c > 0) activeDays++;
        heatmap.push(levelFromCount(c));
      }

      let streak = 0;
      const cursor = new Date(today);
      while (counts[localDateKey(cursor)] && counts[localDateKey(cursor)] > 0) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      }
      if (streak === 0 && !counts[localDateKey(today)]) {
        const y = new Date(today);
        y.setDate(y.getDate() - 1);
        const c2 = new Date(y);
        while (counts[localDateKey(c2)] && counts[localDateKey(c2)] > 0) {
          streak++;
          c2.setDate(c2.getDate() - 1);
        }
      }

      let longestStreak = 0;
      let run = 0;
      const sortedKeys = Object.keys(counts).sort();
      let prev: Date | null = null;
      for (const k of sortedKeys) {
        const d = new Date(k);
        if (prev) {
          const diff = Math.round((d.getTime() - prev.getTime()) / (24 * 3600 * 1000));
          if (diff === 1) run++;
          else run = 1;
        } else {
          run = 1;
        }
        if (run > longestStreak) longestStreak = run;
        prev = d;
      }

      const todayCount = counts[localDateKey(today)] ?? 0;

      setState({
        loading: false,
        streak,
        longestStreak: Math.max(longestStreak, streak),
        todayCount,
        heatmap,
        activeDays,
        recent: rows.slice(0, 8),
      });
    })();
    return () => {
      alive = false;
    };
  }, [userId, progress]);

  return state;
}
