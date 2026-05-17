import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { OWNER_ID } from "../lib/owner";

export type Phase = "work" | "short" | "long";

export type FocusSettings = {
  work_seconds: number;
  short_seconds: number;
  long_seconds: number;
  cycles_before_long: number;
  auto_break: boolean;
  sound: boolean;
};

export type FocusSession = {
  id: string;
  started_at: string;
  ended_at: string;
  duration_seconds: number;
  phase: Phase;
  group_id: string | null;
  topic_id: string | null;
  topic_label: string | null;
};

const DEFAULT_SETTINGS: FocusSettings = {
  work_seconds: 25 * 60,
  short_seconds: 5 * 60,
  long_seconds: 15 * 60,
  cycles_before_long: 4,
  auto_break: true,
  sound: true,
};

type RuntimeState = {
  settings: FocusSettings;
  phase: Phase;
  remaining: number;
  running: boolean;
  cycles: number;
  groupId: string | null;
  topicLabel: string;
  startedAt: number | null;
  sessions: FocusSession[];
  loaded: boolean;
};

let state: RuntimeState = {
  settings: DEFAULT_SETTINGS,
  phase: "work",
  remaining: DEFAULT_SETTINGS.work_seconds,
  running: false,
  cycles: 0,
  groupId: "react",
  topicLabel: "",
  startedAt: null,
  sessions: [],
  loaded: false,
};

const listeners = new Set<() => void>();
function emit() { listeners.forEach((l) => l()); }
function set(patch: Partial<RuntimeState>) { state = { ...state, ...patch }; emit(); }

function durationForPhase(s: FocusSettings, p: Phase): number {
  if (p === "work") return s.work_seconds;
  if (p === "short") return s.short_seconds;
  return s.long_seconds;
}

async function loadSettings() {
  const { data, error } = await supabase
    .from("focus_settings")
    .select("work_seconds, short_seconds, long_seconds, cycles_before_long, auto_break, sound")
    .eq("user_id", OWNER_ID)
    .maybeSingle();
  if (error) console.error("[focus_settings] load failed:", error);
  if (!data) {
    await supabase.from("focus_settings").upsert({ user_id: OWNER_ID, ...DEFAULT_SETTINGS });
    return DEFAULT_SETTINGS;
  }
  return data as FocusSettings;
}

async function loadRecentSessions() {
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const { data, error } = await supabase
    .from("focus_sessions")
    .select("id, started_at, ended_at, duration_seconds, phase, group_id, topic_id, topic_label")
    .eq("user_id", OWNER_ID)
    .gte("started_at", since.toISOString())
    .order("started_at", { ascending: false })
    .limit(60);
  if (error) console.error("[focus_sessions] load failed:", error);
  return (data ?? []) as FocusSession[];
}

async function recordSession(payload: {
  startedAt: number;
  endedAt: number;
  durationSeconds: number;
  phase: Phase;
  groupId: string | null;
  topicLabel: string;
}) {
  const row = {
    user_id: OWNER_ID,
    started_at: new Date(payload.startedAt).toISOString(),
    ended_at: new Date(payload.endedAt).toISOString(),
    duration_seconds: payload.durationSeconds,
    phase: payload.phase,
    group_id: payload.groupId,
    topic_label: payload.topicLabel || null,
  };
  const { data, error } = await supabase
    .from("focus_sessions")
    .insert(row)
    .select("id, started_at, ended_at, duration_seconds, phase, group_id, topic_id, topic_label")
    .single();
  if (error || !data) {
    console.error("[focus_sessions] insert failed:", error);
    return;
  }
  set({ sessions: [data as FocusSession, ...state.sessions].slice(0, 60) });
}

async function hydrate() {
  const [settings, sessions] = await Promise.all([loadSettings(), loadRecentSessions()]);
  set({
    settings,
    sessions,
    remaining: durationForPhase(settings, state.phase),
    loaded: true,
  });
}

hydrate();

// Global tick — one interval, regardless of how many components subscribe.
let intervalId: ReturnType<typeof setInterval> | null = null;
function ensureTick() {
  if (intervalId) return;
  intervalId = setInterval(() => {
    if (!state.running) return;
    if (state.remaining > 1) {
      set({ remaining: state.remaining - 1 });
      return;
    }
    // Phase complete.
    const endedAt = Date.now();
    const startedAt = state.startedAt ?? endedAt - durationForPhase(state.settings, state.phase) * 1000;
    const phaseJustFinished = state.phase;
    const completedFullDuration = durationForPhase(state.settings, phaseJustFinished);
    void recordSession({
      startedAt,
      endedAt,
      durationSeconds: completedFullDuration,
      phase: phaseJustFinished,
      groupId: state.groupId,
      topicLabel: state.topicLabel,
    });

    if (phaseJustFinished === "work") {
      const nextCycles = state.cycles + 1;
      const isLong = nextCycles % state.settings.cycles_before_long === 0;
      const nextPhase: Phase = isLong ? "long" : "short";
      set({
        phase: nextPhase,
        remaining: durationForPhase(state.settings, nextPhase),
        cycles: nextCycles,
        running: state.settings.auto_break,
        startedAt: state.settings.auto_break ? Date.now() : null,
      });
    } else {
      set({
        phase: "work",
        remaining: state.settings.work_seconds,
        running: state.settings.auto_break,
        startedAt: state.settings.auto_break ? Date.now() : null,
      });
    }
  }, 1000);
}

export function useFocus() {
  const [snapshot, setSnapshot] = useState(state);
  useEffect(() => {
    const sync = () => setSnapshot(state);
    listeners.add(sync);
    ensureTick();
    return () => {
      listeners.delete(sync);
    };
  }, []);

  return {
    ...snapshot,
    totalForPhase: durationForPhase(snapshot.settings, snapshot.phase),
    start() {
      set({ running: true, startedAt: state.startedAt ?? Date.now() });
    },
    pause() {
      set({ running: false });
    },
    reset() {
      set({
        running: false,
        remaining: durationForPhase(state.settings, state.phase),
        startedAt: null,
      });
    },
    skip() {
      // Skip without recording — same logic as a phase ending but no row inserted.
      if (state.phase === "work") {
        const nextCycles = state.cycles + 1;
        const isLong = nextCycles % state.settings.cycles_before_long === 0;
        const nextPhase: Phase = isLong ? "long" : "short";
        set({
          phase: nextPhase,
          remaining: durationForPhase(state.settings, nextPhase),
          cycles: nextCycles,
          running: false,
          startedAt: null,
        });
      } else {
        set({
          phase: "work",
          remaining: state.settings.work_seconds,
          running: false,
          startedAt: null,
        });
      }
    },
    setPhase(p: Phase) {
      set({
        phase: p,
        remaining: durationForPhase(state.settings, p),
        running: false,
        startedAt: null,
      });
    },
    setGroupId(id: string | null) {
      set({ groupId: id });
    },
    setTopicLabel(label: string) {
      set({ topicLabel: label });
    },
    async setSetting<K extends keyof FocusSettings>(key: K, value: FocusSettings[K]) {
      const next = { ...state.settings, [key]: value };
      set({
        settings: next,
        remaining:
          key === state.phase + "_seconds" && !state.running
            ? durationForPhase(next, state.phase)
            : state.remaining,
      });
      const { error } = await supabase
        .from("focus_settings")
        .upsert({ user_id: OWNER_ID, ...next, updated_at: new Date().toISOString() });
      if (error) console.error("[focus_settings] save failed:", error);
    },
    async setDuration(phase: Phase, minutes: number) {
      const key = (phase + "_seconds") as keyof FocusSettings;
      const value = Math.max(1, Math.round(minutes)) * 60;
      const next = { ...state.settings, [key]: value };
      set({
        settings: next,
        remaining: phase === state.phase && !state.running ? value : state.remaining,
      });
      const { error } = await supabase
        .from("focus_settings")
        .upsert({ user_id: OWNER_ID, ...next, updated_at: new Date().toISOString() });
      if (error) console.error("[focus_settings] save failed:", error);
    },
  };
}
