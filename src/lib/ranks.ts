// Universal rank ladder based on focus hours.
// Applies both to overall hours and per-track hours (each topic_group is a
// "track" — React, Algorithms, System Design, LeetCode).

export type Rank = {
  id: number;
  name: string;
  glyph: string;
  min: number;
  max: number;
  color: string;
  tint: string;
};

export const RANKS: Rank[] = [
  { id: 0, name: "Новичок",  glyph: "🌱", min: 0,   max: 1,        color: "#7a9b7e", tint: "#e9f1ea" },
  { id: 1, name: "Ученик",   glyph: "🐣", min: 1,   max: 5,        color: "#c8973a", tint: "#fbf0d2" },
  { id: 2, name: "Любитель", glyph: "🔥", min: 5,   max: 15,       color: "#d4642a", tint: "#fbe3d2" },
  { id: 3, name: "Практик",  glyph: "⚔️", min: 15,  max: 30,       color: "#4a7c59", tint: "#dfeede" },
  { id: 4, name: "Знаток",   glyph: "🎯", min: 30,  max: 50,       color: "#3d6dcc", tint: "#dde6f7" },
  { id: 5, name: "Эксперт",  glyph: "🧙", min: 50,  max: 100,      color: "#7b4ccc", tint: "#ebdef8" },
  { id: 6, name: "Мастер",   glyph: "🏆", min: 100, max: 200,      color: "#c4421b", tint: "#fbe0d3" },
  { id: 7, name: "Гуру",     glyph: "🐉", min: 200, max: Infinity, color: "#1d1a3a", tint: "#e1dff0" },
];

export type RankInfo = Rank & {
  idx: number;
  next: Rank | null;
  progress: number;
  hours: number;
  toNext: number;
};

export function getRank(hours: number): RankInfo {
  const h = Math.max(0, hours || 0);
  let idx = 0;
  for (let i = 0; i < RANKS.length; i++) if (h >= RANKS[i].min) idx = i;
  const cur = RANKS[idx];
  const next = RANKS[idx + 1] ?? null;
  const span = (next ? next.min : cur.max) - cur.min;
  const into = h - cur.min;
  const progress = next ? Math.min(1, into / span) : 1;
  return {
    ...cur,
    idx,
    next,
    progress,
    hours: h,
    toNext: next ? Math.max(0, next.min - h) : 0,
  };
}
