import { useSyncExternalStore } from "react";
import type { TopicStatus } from "../data/topics";
import { supabase } from "../lib/supabase";
import { OWNER_ID } from "../lib/owner";

const TABLE = "user_progress";

// SRS intervals (days) — when a review recall succeeds, the step advances
// to the next value; on miss, it resets to the first.
const SRS_STEPS = [1, 3, 7, 14];

type ProgressRow = {
  status: TopicStatus;
  review_interval_days: number;
  next_review_at: string | null;
};

type ProgressMap = Record<string, TopicStatus>;
type ReviewMap = Record<string, { intervalDays: number; nextReviewAt: string | null }>;

let cache: ProgressMap = {};
let reviewCache: ReviewMap = {};
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

function getReviewSnapshot() {
  return reviewCache;
}

async function hydrate() {
  if (hydrated) return;
  hydrated = true;
  const { data, error } = await supabase
    .from(TABLE)
    .select("topic_id, status, review_interval_days, next_review_at")
    .eq("user_id", OWNER_ID);
  if (error || !data) {
    console.error("[supabase] progress hydrate failed:", error);
    return;
  }
  const next: ProgressMap = {};
  const nextReview: ReviewMap = {};
  for (const row of data as Array<ProgressRow & { topic_id: string }>) {
    next[row.topic_id] = row.status;
    if (row.next_review_at) {
      nextReview[row.topic_id] = {
        intervalDays: row.review_interval_days ?? 1,
        nextReviewAt: row.next_review_at,
      };
    }
  }
  cache = next;
  reviewCache = nextReview;
  emit();
}

hydrate();

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

async function syncRemote(
  topicId: string,
  status: TopicStatus | null,
  reviewPatch?: { interval: number; nextReviewAt: string | null }
) {
  if (status === null) {
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq("user_id", OWNER_ID)
      .eq("topic_id", topicId);
    if (error) console.error("[supabase] progress delete failed:", error);
    return;
  }
  const row: Record<string, unknown> = {
    user_id: OWNER_ID,
    topic_id: topicId,
    status,
    updated_at: new Date().toISOString(),
  };
  if (reviewPatch) {
    row.review_interval_days = reviewPatch.interval;
    row.next_review_at = reviewPatch.nextReviewAt;
  } else if (status !== "review") {
    // Clear review schedule when leaving the review status.
    row.next_review_at = null;
    row.review_interval_days = 1;
  }
  const { error } = await supabase.from(TABLE).upsert(row);
  if (error) console.error("[supabase] progress upsert failed:", error);
}

export function setStatus(topicId: string, status: TopicStatus | null) {
  cache = { ...cache };
  const nextReview = { ...reviewCache };

  if (status === null) {
    delete cache[topicId];
    delete nextReview[topicId];
    reviewCache = nextReview;
    emit();
    void syncRemote(topicId, null);
    return;
  }

  cache[topicId] = status;

  let reviewPatch: { interval: number; nextReviewAt: string | null } | undefined;
  if (status === "review") {
    // Marking a topic for review starts the SRS clock at the first step.
    const interval = SRS_STEPS[0];
    const dueAt = addDays(interval);
    nextReview[topicId] = { intervalDays: interval, nextReviewAt: dueAt };
    reviewPatch = { interval, nextReviewAt: dueAt };
  } else {
    delete nextReview[topicId];
  }

  reviewCache = nextReview;
  emit();
  void syncRemote(topicId, status, reviewPatch);
}

/** Record the outcome of a spaced-repetition recall: advance interval on
 *  success, reset on miss. Topic stays in `review` either way until the
 *  user marks it `done` from the topic page. */
export function recordReviewOutcome(topicId: string, recalled: boolean) {
  const existing = reviewCache[topicId];
  const currentIdx = existing ? SRS_STEPS.indexOf(existing.intervalDays) : 0;
  const nextIdx = recalled ? Math.min(currentIdx + 1, SRS_STEPS.length - 1) : 0;
  const nextInterval = SRS_STEPS[nextIdx];
  const dueAt = addDays(nextInterval);

  cache = { ...cache, [topicId]: "review" };
  reviewCache = { ...reviewCache, [topicId]: { intervalDays: nextInterval, nextReviewAt: dueAt } };
  emit();
  void syncRemote(topicId, "review", { interval: nextInterval, nextReviewAt: dueAt });
}

export function useProgress() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useReviewSchedule() {
  return useSyncExternalStore(subscribe, getReviewSnapshot, getReviewSnapshot);
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
