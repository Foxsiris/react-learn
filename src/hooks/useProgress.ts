import { useSyncExternalStore } from "react";
import type { TopicStatus } from "../data/topics";
import { supabase } from "../lib/supabase";
import { OWNER_ID } from "../lib/owner";

const TABLE = "user_progress";

type ProgressMap = Record<string, TopicStatus>;

let cache: ProgressMap = {};
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot() {
  return cache;
}

async function hydrate() {
  if (hydrated) return;
  hydrated = true;
  const { data, error } = await supabase
    .from(TABLE)
    .select("topic_id, status")
    .eq("user_id", OWNER_ID);
  if (error || !data) {
    console.error("[supabase] progress hydrate failed:", error);
    return;
  }
  const next: ProgressMap = {};
  for (const row of data as Array<{ topic_id: string; status: TopicStatus }>) {
    next[row.topic_id] = row.status;
  }
  cache = next;
  emit();
}

hydrate();

async function syncRemote(topicId: string, status: TopicStatus | null) {
  if (status === null) {
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq("user_id", OWNER_ID)
      .eq("topic_id", topicId);
    if (error) console.error("[supabase] progress delete failed:", error);
  } else {
    const { error } = await supabase
      .from(TABLE)
      .upsert({ user_id: OWNER_ID, topic_id: topicId, status, updated_at: new Date().toISOString() });
    if (error) console.error("[supabase] progress upsert failed:", error);
  }
}

export function setStatus(topicId: string, status: TopicStatus | null) {
  cache = { ...cache };
  if (status === null) {
    delete cache[topicId];
  } else {
    cache[topicId] = status;
  }
  emit();
  void syncRemote(topicId, status);
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
