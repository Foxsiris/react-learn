import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { OWNER_ID } from "../lib/owner";
import { useActivity } from "./useActivity";

export type DailyQuest = {
  id: string;
  title: string;
  xp: number;
  progress: number;
  target: number;
  completed: boolean;
};

type QuestRow = {
  quest_id: string;
  progress: number;
  target: number;
  xp: number;
  completed: boolean;
};

function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Static catalog — rules describe how progress is derived from activity stats.
// Adding a new quest = add an entry here; the row will be created on demand.
const QUEST_CATALOG: Array<Pick<DailyQuest, "id" | "title" | "xp" | "target"> & {
  derive: (ctx: { todayCount: number; streak: number; focusMinutes: number }) => number;
}> = [
  {
    id: "one-topic",
    title: "Закрой 1 тему сегодня",
    xp: 30,
    target: 1,
    derive: ({ todayCount }) => Math.min(1, todayCount),
  },
  {
    id: "three-topics",
    title: "Закрой 3 темы за день",
    xp: 50,
    target: 3,
    derive: ({ todayCount }) => Math.min(3, todayCount),
  },
  {
    id: "focus-50",
    title: "50 минут фокуса",
    xp: 40,
    target: 50,
    derive: ({ focusMinutes }) => Math.min(50, focusMinutes),
  },
];

async function syncRow(row: QuestRow) {
  const { error } = await supabase
    .from("daily_quests")
    .upsert({
      user_id: OWNER_ID,
      day: todayKey(),
      ...row,
      completed_at: row.completed ? new Date().toISOString() : null,
    });
  if (error) console.error("[daily_quests] upsert failed:", error);
}

export function useDailyQuests(focusMinutesToday: number = 0): DailyQuest[] {
  const activity = useActivity();
  const [persisted, setPersisted] = useState<Map<string, QuestRow>>(new Map());

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data, error } = await supabase
        .from("daily_quests")
        .select("quest_id, progress, target, xp, completed")
        .eq("user_id", OWNER_ID)
        .eq("day", todayKey());
      if (!alive) return;
      if (error) {
        console.error("[daily_quests] load failed:", error);
        return;
      }
      const map = new Map<string, QuestRow>();
      for (const r of (data ?? []) as QuestRow[]) map.set(r.quest_id, r);
      setPersisted(map);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const ctx = {
    todayCount: activity.todayCount,
    streak: activity.streak,
    focusMinutes: focusMinutesToday,
  };

  const computed: DailyQuest[] = QUEST_CATALOG.map((q) => {
    const progress = q.derive(ctx);
    const completed = progress >= q.target;
    return {
      id: q.id,
      title: q.title,
      xp: q.xp,
      target: q.target,
      progress,
      completed,
    };
  });

  // Mirror changes into Supabase whenever derived progress crosses the row we
  // last persisted. This is fire-and-forget — UI never blocks on it.
  useEffect(() => {
    for (const q of computed) {
      const prev = persisted.get(q.id);
      if (!prev || prev.progress !== q.progress || prev.completed !== q.completed) {
        const row: QuestRow = {
          quest_id: q.id,
          progress: q.progress,
          target: q.target,
          xp: q.xp,
          completed: q.completed,
        };
        persisted.set(q.id, row);
        void syncRow(row);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [computed.map((q) => `${q.id}:${q.progress}:${q.completed}`).join("|")]);

  return computed;
}
