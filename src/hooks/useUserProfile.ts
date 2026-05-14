import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { OWNER_ID } from "../lib/owner";

export type UserProfile = {
  display_name: string;
  handle: string;
  joined_at: string;
};

const DEFAULTS: Omit<UserProfile, "joined_at"> = {
  display_name: "Даниил",
  handle: "daniil",
};

const MONTHS_RU = [
  "январь","февраль","март","апрель","май","июнь",
  "июль","август","сентябрь","октябрь","ноябрь","декабрь",
];

export function formatJoined(iso: string): string {
  const d = new Date(iso);
  return `${MONTHS_RU[d.getMonth()]} ${d.getFullYear()}`;
}

export function useUserProfile() {
  const userId = OWNER_ID;
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    (async () => {
      const { data, error } = await supabase
        .from("user_profile")
        .select("display_name, handle, joined_at")
        .eq("user_id", userId)
        .maybeSingle();
      if (!alive) return;
      if (error) console.error("[profile] load failed:", error);

      if (data) {
        setProfile({
          display_name: data.display_name ?? DEFAULTS.display_name,
          handle: data.handle ?? DEFAULTS.handle,
          joined_at: data.joined_at,
        });
        return;
      }

      const seedRow = { user_id: userId, ...DEFAULTS };
      const { data: inserted, error: insErr } = await supabase
        .from("user_profile")
        .insert(seedRow)
        .select("display_name, handle, joined_at")
        .single();
      if (!alive) return;
      if (insErr || !inserted) {
        console.error("[profile] seed insert failed:", insErr);
        setProfile({ ...DEFAULTS, joined_at: new Date().toISOString() });
        return;
      }
      setProfile({
        display_name: inserted.display_name,
        handle: inserted.handle,
        joined_at: inserted.joined_at,
      });
    })();
    return () => {
      alive = false;
    };
  }, [userId]);

  const update = async (patch: Partial<Omit<UserProfile, "joined_at">>) => {
    if (!userId) return;
    setProfile((p) => (p ? { ...p, ...patch } : p));
    const { error } = await supabase
      .from("user_profile")
      .update(patch)
      .eq("user_id", userId);
    if (error) console.error("[profile] update failed:", error);
  };

  return { profile, update };
}
