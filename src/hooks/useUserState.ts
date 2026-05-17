import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { OWNER_ID } from "../lib/owner";

export type UserState = {
  hearts: number;
  hearts_max: number;
  hearts_updated_at: string;
  longest_streak: number;
};

const DEFAULTS: UserState = {
  hearts: 5,
  hearts_max: 5,
  hearts_updated_at: new Date().toISOString(),
  longest_streak: 0,
};

// One heart regenerates every 30 minutes (matches the prototype's "+1 через 27 мин" hint).
const HEART_REGEN_MS = 30 * 60 * 1000;

function applyRegen(s: UserState): { state: UserState; nextRegenMs: number } {
  if (s.hearts >= s.hearts_max) return { state: s, nextRegenMs: 0 };
  const elapsed = Date.now() - new Date(s.hearts_updated_at).getTime();
  const regen = Math.min(s.hearts_max - s.hearts, Math.floor(elapsed / HEART_REGEN_MS));
  if (regen <= 0) {
    return { state: s, nextRegenMs: HEART_REGEN_MS - (elapsed % HEART_REGEN_MS) };
  }
  const advanced = new Date(new Date(s.hearts_updated_at).getTime() + regen * HEART_REGEN_MS).toISOString();
  const nextHearts = s.hearts + regen;
  return {
    state: { ...s, hearts: nextHearts, hearts_updated_at: nextHearts >= s.hearts_max ? new Date().toISOString() : advanced },
    nextRegenMs: nextHearts >= s.hearts_max ? 0 : HEART_REGEN_MS,
  };
}

// Shared singleton store so every consumer sees the same hearts immediately.
let cache: UserState = DEFAULTS;
let hydrated = false;
const listeners = new Set<() => void>();
function emit() { listeners.forEach((l) => l()); }

async function persist(patch: Partial<UserState>) {
  const { error } = await supabase
    .from("user_state")
    .upsert({ user_id: OWNER_ID, ...patch, updated_at: new Date().toISOString() });
  if (error) console.error("[user_state] persist failed:", error);
}

async function hydrate() {
  if (hydrated) return;
  hydrated = true;
  const { data, error } = await supabase
    .from("user_state")
    .select("hearts, hearts_max, hearts_updated_at, longest_streak")
    .eq("user_id", OWNER_ID)
    .maybeSingle();
  if (error) console.error("[user_state] hydrate failed:", error);
  if (!data) {
    await persist(DEFAULTS);
    cache = DEFAULTS;
  } else {
    cache = data as UserState;
  }
  const { state } = applyRegen(cache);
  if (state.hearts !== cache.hearts) void persist({ hearts: state.hearts, hearts_updated_at: state.hearts_updated_at });
  cache = state;
  emit();
}

hydrate();

export function loseHeart() {
  if (cache.hearts <= 0) return;
  const nextHearts = cache.hearts - 1;
  // Start the regen clock as soon as we drop from full.
  const next: UserState = {
    ...cache,
    hearts: nextHearts,
    hearts_updated_at: cache.hearts === cache.hearts_max ? new Date().toISOString() : cache.hearts_updated_at,
  };
  cache = next;
  emit();
  void persist({ hearts: next.hearts, hearts_updated_at: next.hearts_updated_at });
}

export function refillHearts() {
  cache = { ...cache, hearts: cache.hearts_max, hearts_updated_at: new Date().toISOString() };
  emit();
  void persist({ hearts: cache.hearts, hearts_updated_at: cache.hearts_updated_at });
}

export function bumpLongestStreak(streak: number) {
  if (streak <= cache.longest_streak) return;
  cache = { ...cache, longest_streak: streak };
  emit();
  void persist({ longest_streak: streak });
}

export function useUserState() {
  const [state, setState] = useState<UserState>(cache);
  const [nextRegen, setNextRegen] = useState<number>(0);

  useEffect(() => {
    const sync = () => {
      const { state: regen, nextRegenMs } = applyRegen(cache);
      if (regen !== cache) {
        cache = regen;
        void persist({ hearts: regen.hearts, hearts_updated_at: regen.hearts_updated_at });
        emit();
      }
      setState(regen);
      setNextRegen(nextRegenMs);
    };
    const unsubscribe = () => listeners.delete(sync);
    listeners.add(sync);
    sync();
    const id = setInterval(sync, 1000);
    return () => {
      unsubscribe();
      clearInterval(id);
    };
  }, []);

  return { state, nextRegenMs: nextRegen };
}
