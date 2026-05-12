import { useSyncExternalStore } from "react";
import type { TopicStatus } from "../data/topics";
import { supabase } from "../lib/supabase";

const STORAGE_KEY = "react-learn:progress";
const TABLE = "topic_progress";

type ProgressMap = Record<string, TopicStatus>;

function readLocal(): ProgressMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ProgressMap) : {};
  } catch {
    return {};
  }
}

function writeLocal(map: ProgressMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

let cache: ProgressMap = readLocal();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return cache;
}

let hydrated = false;
async function hydrate() {
  if (hydrated) return;
  hydrated = true;
  const { data, error } = await supabase
    .from(TABLE)
    .select("topic_id, status");
  if (error || !data) return;
  const remote: ProgressMap = {};
  for (const row of data as Array<{ topic_id: string; status: TopicStatus }>) {
    remote[row.topic_id] = row.status;
  }
  cache = { ...cache, ...remote };
  writeLocal(cache);
  emit();
}
hydrate();

export function setStatus(topicId: string, status: TopicStatus | null) {
  cache = { ...cache };
  if (status === null) {
    delete cache[topicId];
  } else {
    cache[topicId] = status;
  }
  writeLocal(cache);
  emit();

  if (status === null) {
    void supabase.from(TABLE).delete().eq("topic_id", topicId);
  } else {
    void supabase
      .from(TABLE)
      .upsert({ topic_id: topicId, status, updated_at: new Date().toISOString() });
  }
}

export function useProgress() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useTopicStatus(topicId: string): TopicStatus {
  const progress = useProgress();
  return progress[topicId] ?? "todo";
}

export const STATUS_META: Record<
  TopicStatus,
  { emoji: string; label: string; color: string }
> = {
  done:   { emoji: "✅", label: "Изучено",      color: "#3fb950" },
  review: { emoji: "🔁", label: "Вернуться",    color: "#d29922" },
  skip:   { emoji: "⏸️", label: "Пока не нужно", color: "#8b949e" },
  todo:   { emoji: "⬜", label: "Не начато",    color: "#484f58" },
};
