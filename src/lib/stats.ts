import type { TopicStatus } from "../data/topics";
import type { CatalogGroup, CatalogTopic } from "../hooks/useTopicsCatalog";

const XP_PER_STATUS: Record<TopicStatus, number> = {
  done: 50,
  review: 15,
  skip: 0,
  todo: 0,
};

const XP_PER_LEVEL = 250;

export type ProgressMap = Record<string, TopicStatus>;

export type Stats = {
  xp: number;
  xpTotal: number;
  level: number;
  xpInLevel: number;
  xpToNext: number;
  progressInLevel: number;
  doneCount: number;
  reviewCount: number;
  skipCount: number;
  todoCount: number;
  totalTopics: number;
  overallProgress: number;
};

export function computeStats(progress: ProgressMap, totalTopics: number): Stats {
  let xp = 0;
  let doneCount = 0;
  let reviewCount = 0;
  let skipCount = 0;
  for (const status of Object.values(progress)) {
    xp += XP_PER_STATUS[status] ?? 0;
    if (status === "done") doneCount++;
    else if (status === "review") reviewCount++;
    else if (status === "skip") skipCount++;
  }
  const todoCount = totalTopics - doneCount - reviewCount - skipCount;
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const xpInLevel = xp % XP_PER_LEVEL;
  const xpToNext = XP_PER_LEVEL - xpInLevel;
  const progressInLevel = xpInLevel / XP_PER_LEVEL;
  const overallProgress = totalTopics > 0 ? doneCount / totalTopics : 0;
  return {
    xp,
    xpTotal: xp,
    level,
    xpInLevel,
    xpToNext,
    progressInLevel,
    doneCount,
    reviewCount,
    skipCount,
    todoCount,
    totalTopics,
    overallProgress,
  };
}

export function getRank(level: number): string {
  if (level >= 20) return "Гуру React";
  if (level >= 12) return "Старший падаван";
  if (level >= 7) return "Энтузиаст кода";
  if (level >= 4) return "Уверенный новичок";
  return "Начинающий";
}

export type LessonStateForUI = "done" | "current" | "todo" | "review" | "skip";

export function findCurrentTopic(progress: ProgressMap, topics: CatalogTopic[]): CatalogTopic | undefined {
  const review = topics.find((t) => progress[t.id] === "review");
  if (review) return review;
  const first = topics.find((t) => (progress[t.id] ?? "todo") === "todo");
  return first ?? topics[topics.length - 1];
}

export type BlockStat = {
  blockId: string;
  total: number;
  done: number;
  inProgress: number;
  progress: number;
};

export function computeBlockStats(progress: ProgressMap, groups: CatalogGroup[]): BlockStat[] {
  return groups.map((g) => {
    const total = g.topics.length;
    let done = 0;
    let inProgress = 0;
    for (const t of g.topics) {
      const s = progress[t.id] ?? "todo";
      if (s === "done") done++;
      else if (s === "review") inProgress++;
    }
    return {
      blockId: g.id,
      total,
      done,
      inProgress,
      progress: total ? done / total : 0,
    };
  });
}

export type Achievement = {
  id: string;
  glyph: string;
  title: string;
  sub: string;
  earned: boolean;
  progress?: number;
  target?: number;
  ribbon?: "NEW";
};

export type AchievementContext = {
  progress: ProgressMap;
  groups: CatalogGroup[];
  totalTopics: number;
  streak: number;
  longestStreak: number;
  focusSessions: number;
  focusHours: number;
  bestStreak?: number;
};

export function computeAchievements(ctx: AchievementContext): Achievement[] {
  const stats = computeStats(ctx.progress, ctx.totalTopics);
  const blockStats = computeBlockStats(ctx.progress, ctx.groups);
  const blocksFullyDone = blockStats.filter((b) => b.total > 0 && b.done === b.total).length;
  const blocksStarted = blockStats.filter((b) => b.done + b.inProgress > 0).length;

  const ach: Achievement[] = [
    { id: "first-step",    glyph: "🐣", title: "Первый шаг",       sub: "Заверши свой первый урок",   earned: stats.doneCount >= 1,  progress: Math.min(1, stats.doneCount),    target: 1 },
    { id: "warmup",        glyph: "⚡", title: "Спринт",            sub: "5 уроков за всё время",       earned: stats.doneCount >= 5,  progress: Math.min(5, stats.doneCount),    target: 5 },
    { id: "bookworm",      glyph: "📚", title: "Книжный червь",    sub: "10 уроков пройдено",          earned: stats.doneCount >= 10, progress: Math.min(10, stats.doneCount),   target: 10 },
    { id: "sharp",         glyph: "🎯", title: "Меткий",            sub: "25 уроков пройдено",          earned: stats.doneCount >= 25, progress: Math.min(25, stats.doneCount),   target: 25 },
    { id: "star-hour",     glyph: "🌟", title: "Звёздный час",      sub: "Закрой целый блок тем",       earned: blocksFullyDone >= 1,  progress: Math.min(1, blocksFullyDone),    target: 1, ribbon: blocksFullyDone >= 1 ? "NEW" : undefined },
    { id: "takeoff",       glyph: "🚀", title: "На взлёт",          sub: "7 дней подряд",                earned: ctx.streak >= 7,        progress: Math.min(7, ctx.streak),         target: 7 },
    { id: "crystal",       glyph: "💎", title: "Кристалл",          sub: "30 дней подряд",               earned: ctx.longestStreak >= 30, progress: Math.min(30, ctx.longestStreak), target: 30 },
    { id: "polyglot",      glyph: "🧠", title: "Эрудит",            sub: "Начни 3 разных трека",         earned: blocksStarted >= 3,    progress: Math.min(3, blocksStarted),       target: 3 },
    { id: "champion",      glyph: "🏆", title: "Чемпион",           sub: "Заверши весь курс",            earned: stats.totalTopics > 0 && stats.doneCount === stats.totalTopics, progress: stats.doneCount, target: stats.totalTopics || 1 },
    { id: "comeback",      glyph: "🔁", title: "Возвращенец",       sub: "Отметь 5 тем на повторение",   earned: stats.reviewCount >= 5,  progress: Math.min(5, stats.reviewCount),  target: 5 },
    { id: "pragmatic",     glyph: "🛠️", title: "Прагматик",         sub: "Отметь 3 темы как «пока»",     earned: stats.skipCount >= 3,    progress: Math.min(3, stats.skipCount),    target: 3 },
    { id: "level-5",       glyph: "🔥", title: "Уровень 5",         sub: "Достигни 5-го уровня",         earned: stats.level >= 5,        progress: Math.min(5, stats.level),         target: 5 },
    { id: "level-10",      glyph: "⚔️", title: "Десятка",           sub: "Достигни 10-го уровня",        earned: stats.level >= 10,       progress: Math.min(10, stats.level),        target: 10 },
    { id: "pomodorer",     glyph: "🍅", title: "Помодорщик",        sub: "10 фокус-сессий за всё время", earned: ctx.focusSessions >= 10, progress: Math.min(10, ctx.focusSessions),  target: 10 },
    { id: "deep-work",     glyph: "🌙", title: "Полуночник",        sub: "5 часов фокуса",                earned: ctx.focusHours >= 5,     progress: Math.min(5, Math.floor(ctx.focusHours)), target: 5 },
    { id: "guru",          glyph: "🐉", title: "Гуру",              sub: "Достигни 200 часов фокуса",    earned: ctx.focusHours >= 200,   progress: Math.min(200, Math.floor(ctx.focusHours)), target: 200 },
  ];
  return ach;
}
