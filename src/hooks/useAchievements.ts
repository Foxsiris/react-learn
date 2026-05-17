import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { OWNER_ID } from "../lib/owner";
import { useProgress } from "./useProgress";
import { useActivity } from "./useActivity";
import { useCatalog } from "./useTopicsCatalog";
import { useUserState } from "./useUserState";
import { useTrackStats } from "./useTrackStats";
import { computeAchievements, type Achievement } from "../lib/stats";

export type AchievementWithDate = Achievement & { unlockedAt: string | null };

export function useAchievements() {
  const progress = useProgress();
  const activity = useActivity();
  const catalog = useCatalog();
  const { state } = useUserState();
  const tracks = useTrackStats();
  const totalFocusSessions = Array.from(tracks.byGroup.values()).reduce((s, t) => s + t.sessions, 0);

  const [unlocks, setUnlocks] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data, error } = await supabase
        .from("user_achievements")
        .select("achievement_id, unlocked_at")
        .eq("user_id", OWNER_ID);
      if (!alive) return;
      if (error) {
        console.error("[achievements] load failed:", error);
        return;
      }
      const map = new Map<string, string>();
      for (const r of (data ?? []) as Array<{ achievement_id: string; unlocked_at: string }>) {
        map.set(r.achievement_id, r.unlocked_at);
      }
      setUnlocks(map);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const computed = useMemo(
    () =>
      computeAchievements({
        progress,
        groups: catalog.groups,
        totalTopics: catalog.topics.length,
        streak: activity.streak,
        longestStreak: Math.max(activity.longestStreak, state.longest_streak),
        focusSessions: totalFocusSessions,
        focusHours: tracks.totalHours,
      }),
    [progress, catalog.groups, catalog.topics.length, activity.streak, activity.longestStreak, state.longest_streak, totalFocusSessions, tracks.totalHours]
  );

  // Persist newly-earned achievements with the moment they were unlocked.
  useEffect(() => {
    const fresh = computed.filter((a) => a.earned && !unlocks.has(a.id));
    if (fresh.length === 0) return;
    const now = new Date().toISOString();
    const rows = fresh.map((a) => ({ user_id: OWNER_ID, achievement_id: a.id, unlocked_at: now }));
    (async () => {
      const { error } = await supabase.from("user_achievements").upsert(rows);
      if (error) {
        console.error("[achievements] persist failed:", error);
        return;
      }
      setUnlocks((prev) => {
        const next = new Map(prev);
        for (const a of fresh) next.set(a.id, now);
        return next;
      });
    })();
  }, [computed, unlocks]);

  const withDates: AchievementWithDate[] = computed.map((a) => ({
    ...a,
    unlockedAt: unlocks.get(a.id) ?? null,
  }));

  return withDates;
}
