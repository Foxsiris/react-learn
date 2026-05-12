import { useSyncExternalStore } from "react";
import type { TopicStatus } from "../data/topics";
import { supabase } from "../lib/supabase";

const TABLE = "user_progress";
const LEGACY_STORAGE_KEY = "react-learn:progress";

type ProgressMap = Record<string, TopicStatus>;

let cache: ProgressMap = {};
let cacheUserId: string | null = null;
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

async function migrateLegacy(userId: string, remote: ProgressMap) {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return;
    const legacy = JSON.parse(raw) as ProgressMap;
    const now = new Date().toISOString();
    const toUpload = Object.entries(legacy)
      .filter(([id]) => !(id in remote))
      .map(([topic_id, status]) => ({ user_id: userId, topic_id, status, updated_at: now }));
    if (toUpload.length > 0) {
      const { error } = await supabase.from(TABLE).upsert(toUpload);
      if (error) {
        console.error("[supabase] legacy migration failed, will retry:", error);
        return;
      }
      for (const row of toUpload) cache[row.topic_id] = row.status as TopicStatus;
    }
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    /* private mode / parse error — ignore */
  }
}

export async function hydrateProgressFor(userId: string | null) {
  if (userId === cacheUserId) return;
  cacheUserId = userId;
  cache = {};
  emit();
  if (!userId) return;

  const { data, error } = await supabase
    .from(TABLE)
    .select("topic_id, status")
    .eq("user_id", userId);
  if (error || !data) {
    console.error("[supabase] hydrate failed:", error);
    return;
  }
  const remote: ProgressMap = {};
  for (const row of data as Array<{ topic_id: string; status: TopicStatus }>) {
    remote[row.topic_id] = row.status;
  }
  cache = remote;
  await migrateLegacy(userId, remote);
  emit();
}

async function syncRemote(topicId: string, status: TopicStatus | null) {
  const userId = cacheUserId;
  if (!userId) return;
  if (status === null) {
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq("user_id", userId)
      .eq("topic_id", topicId);
    if (error) console.error("[supabase] delete failed:", error);
  } else {
    const { error } = await supabase
      .from(TABLE)
      .upsert({ user_id: userId, topic_id: topicId, status, updated_at: new Date().toISOString() });
    if (error) console.error("[supabase] upsert failed:", error);
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
