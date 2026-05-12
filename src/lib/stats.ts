import type { TopicStatus } from "../data/topics";
import { allTopics, blocks } from "../data/topics";

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

export function computeStats(progress: ProgressMap): Stats {
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
  const totalTopics = allTopics.length;
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

export function findCurrentTopic(progress: ProgressMap) {
  const review = allTopics.find((t) => progress[t.id] === "review");
  if (review) return review;
  const first = allTopics.find((t) => {
    const s = progress[t.id] ?? "todo";
    return s === "todo";
  });
  return first ?? allTopics[allTopics.length - 1];
}

export type BlockStat = {
  blockId: string;
  total: number;
  done: number;
  inProgress: number;
  progress: number;
};

export function computeBlockStats(progress: ProgressMap): BlockStat[] {
  return blocks.map((b) => {
    const total = b.topics.length;
    let done = 0;
    let inProgress = 0;
    for (const t of b.topics) {
      const s = progress[t.id] ?? "todo";
      if (s === "done") done++;
      else if (s === "review") inProgress++;
    }
    return {
      blockId: b.id,
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

export function computeAchievements(progress: ProgressMap): Achievement[] {
  const stats = computeStats(progress);
  const blockStats = computeBlockStats(progress);
  const blocksFullyDone = blockStats.filter((b) => b.total > 0 && b.done === b.total).length;
  const blocksStarted = blockStats.filter((b) => b.done + b.inProgress > 0).length;

  const ach: Achievement[] = [
    { id: "first-step", glyph: "🔥", title: "Первый шаг", sub: "Заверши свой первый урок", earned: stats.doneCount >= 1, progress: Math.min(1, stats.doneCount), target: 1 },
    { id: "warmup", glyph: "⚡", title: "Разогрев", sub: "5 уроков пройдено", earned: stats.doneCount >= 5, progress: Math.min(5, stats.doneCount), target: 5 },
    { id: "bookworm", glyph: "📚", title: "Книжный червь", sub: "10 уроков пройдено", earned: stats.doneCount >= 10, progress: Math.min(10, stats.doneCount), target: 10 },
    { id: "scholar", glyph: "🎓", title: "Эрудит", sub: "25 уроков пройдено", earned: stats.doneCount >= 25, progress: Math.min(25, stats.doneCount), target: 25 },
    { id: "guru", glyph: "🏆", title: "Гуру", sub: "50 уроков пройдено", earned: stats.doneCount >= 50, progress: Math.min(50, stats.doneCount), target: 50 },
    { id: "completionist", glyph: "💎", title: "Перфекционист", sub: "Все темы курса пройдены", earned: stats.totalTopics > 0 && stats.doneCount === stats.totalTopics, progress: stats.doneCount, target: stats.totalTopics },
    { id: "block-master", glyph: "⭐", title: "Мастер раздела", sub: "Закрой целый блок тем", earned: blocksFullyDone >= 1, progress: Math.min(1, blocksFullyDone), target: 1, ribbon: blocksFullyDone >= 1 ? "NEW" : undefined },
    { id: "many-blocks", glyph: "🎯", title: "Широкий кругозор", sub: "Начни 3 разных блока", earned: blocksStarted >= 3, progress: Math.min(3, blocksStarted), target: 3 },
    { id: "comeback", glyph: "🔁", title: "Возвращенец", sub: "Отметь 5 тем на повторение", earned: stats.reviewCount >= 5, progress: Math.min(5, stats.reviewCount), target: 5 },
    { id: "pragmatic", glyph: "🛠️", title: "Прагматик", sub: "Отметь 3 темы как «пока не нужно»", earned: stats.skipCount >= 3, progress: Math.min(3, stats.skipCount), target: 3 },
    { id: "level-5", glyph: "🚀", title: "На взлёт", sub: "Достигни 5-го уровня", earned: stats.level >= 5, progress: Math.min(5, stats.level), target: 5 },
    { id: "level-10", glyph: "🧠", title: "Десятка", sub: "Достигни 10-го уровня", earned: stats.level >= 10, progress: Math.min(10, stats.level), target: 10 },
  ];
  return ach;
}
