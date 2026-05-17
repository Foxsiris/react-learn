import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { OWNER_ID } from "../lib/owner";
import { useActivity } from "./useActivity";
import { useProgress, useReviewSchedule } from "./useProgress";

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

type DeriveCtx = {
  todayCount: number;
  streak: number;
  focusMinutes: number;
  reviewsDueCount: number;
  doneCountTotal: number;
};

type QuestTemplate = {
  id: string;
  title: (target: number) => string;
  xp: number;
  target: number;
  derive: (ctx: DeriveCtx) => number;
};

// Pool — 14 templates. Daily 3 are picked deterministically by date so each
// day stays stable across reloads but rotates over time.
const POOL: QuestTemplate[] = [
  {
    id: "one-topic",
    title: () => "Закрой 1 тему сегодня",
    xp: 30,
    target: 1,
    derive: ({ todayCount }) => Math.min(1, todayCount),
  },
  {
    id: "two-topics",
    title: (t) => `Закрой ${t} темы сегодня`,
    xp: 40,
    target: 2,
    derive: ({ todayCount }) => Math.min(2, todayCount),
  },
  {
    id: "three-topics",
    title: (t) => `Закрой ${t} темы за день`,
    xp: 60,
    target: 3,
    derive: ({ todayCount }) => Math.min(3, todayCount),
  },
  {
    id: "five-topics",
    title: (t) => `Героический день: ${t} тем`,
    xp: 100,
    target: 5,
    derive: ({ todayCount }) => Math.min(5, todayCount),
  },
  {
    id: "focus-25",
    title: (t) => `${t} минут фокуса`,
    xp: 25,
    target: 25,
    derive: ({ focusMinutes }) => Math.min(25, focusMinutes),
  },
  {
    id: "focus-50",
    title: (t) => `${t} минут фокуса`,
    xp: 40,
    target: 50,
    derive: ({ focusMinutes }) => Math.min(50, focusMinutes),
  },
  {
    id: "focus-90",
    title: (t) => `${t} минут глубокой работы`,
    xp: 70,
    target: 90,
    derive: ({ focusMinutes }) => Math.min(90, focusMinutes),
  },
  {
    id: "focus-150",
    title: (t) => `Марафон: ${t} минут фокуса`,
    xp: 120,
    target: 150,
    derive: ({ focusMinutes }) => Math.min(150, focusMinutes),
  },
  {
    id: "streak-3",
    title: () => "Поддержи стрик 3+ дня",
    xp: 30,
    target: 3,
    derive: ({ streak }) => Math.min(3, streak),
  },
  {
    id: "streak-7",
    title: () => "Стрик 7 дней — недельный ритм",
    xp: 60,
    target: 7,
    derive: ({ streak }) => Math.min(7, streak),
  },
  {
    id: "review-one",
    title: () => "Закрой 1 тему из повторения",
    xp: 35,
    target: 1,
    derive: ({ reviewsDueCount, todayCount }) =>
      reviewsDueCount === 0 ? 0 : Math.min(1, todayCount), // proxy: any activity today
  },
  {
    id: "review-three",
    title: (t) => `Повтори ${t} темы сегодня`,
    xp: 50,
    target: 3,
    derive: ({ reviewsDueCount, todayCount }) =>
      reviewsDueCount === 0 ? 0 : Math.min(3, todayCount),
  },
  {
    id: "show-up",
    title: () => "Открой приложение и поучись хотя бы немного",
    xp: 10,
    target: 1,
    derive: ({ focusMinutes, todayCount }) => (focusMinutes > 0 || todayCount > 0 ? 1 : 0),
  },
  {
    id: "milestone-50",
    title: () => "Дойди до 50 пройденных тем суммарно",
    xp: 80,
    target: 50,
    derive: ({ doneCountTotal }) => Math.min(50, doneCountTotal),
  },
];

function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Tiny seeded RNG so a given date always yields the same 3 quests.
function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h >>> 0;
}

function pickDaily(date: string, count: number): QuestTemplate[] {
  const seed = hashString(date);
  const indexes = POOL.map((_, i) => i);
  // Fisher–Yates with seeded LCG.
  let s = seed || 1;
  for (let i = indexes.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [indexes[i], indexes[j]] = [indexes[j], indexes[i]];
  }
  return indexes.slice(0, count).map((i) => POOL[i]);
}

async function syncRow(row: QuestRow) {
  const { error } = await supabase.from("daily_quests").upsert({
    user_id: OWNER_ID,
    day: todayKey(),
    ...row,
    completed_at: row.completed ? new Date().toISOString() : null,
  });
  if (error) console.error("[daily_quests] upsert failed:", error);
}

export function useDailyQuests(focusMinutesToday: number = 0): DailyQuest[] {
  const activity = useActivity();
  const progress = useProgress();
  const schedule = useReviewSchedule();
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

  const now = new Date();
  const reviewsDueCount = Object.values(schedule).filter(
    (x) => x.nextReviewAt && new Date(x.nextReviewAt) <= now
  ).length;
  const doneCountTotal = Object.values(progress).filter((s) => s === "done").length;

  const ctx: DeriveCtx = {
    todayCount: activity.todayCount,
    streak: activity.streak,
    focusMinutes: focusMinutesToday,
    reviewsDueCount,
    doneCountTotal,
  };

  const todaysTemplates = pickDaily(todayKey(), 3);

  const computed: DailyQuest[] = todaysTemplates.map((t) => {
    const progressValue = t.derive(ctx);
    const completed = progressValue >= t.target;
    return {
      id: t.id,
      title: t.title(t.target),
      xp: t.xp,
      target: t.target,
      progress: progressValue,
      completed,
    };
  });

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
