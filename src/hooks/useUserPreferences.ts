import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { OWNER_ID } from "../lib/owner";

export type AccentColor = "terracotta" | "indigo" | "forest" | "plum";

export type Preferences = {
  accent_color: AccentColor;
  animations_enabled: boolean;
};

const DEFAULTS: Preferences = { accent_color: "terracotta", animations_enabled: true };
const LEGACY_KEY = "react-learn:tweaks";

function readLegacy(): Partial<Preferences> | null {
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return null;
    const old = JSON.parse(raw) as { accent?: string; animations?: boolean };
    return {
      accent_color: (old.accent as AccentColor) ?? undefined,
      animations_enabled: typeof old.animations === "boolean" ? old.animations : undefined,
    };
  } catch {
    return null;
  }
}

export function useUserPreferences() {
  const userId = OWNER_ID;
  const [prefs, setPrefs] = useState<Preferences>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    (async () => {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("accent_color, animations_enabled")
        .eq("user_id", userId)
        .maybeSingle();
      if (!alive) return;

      if (error) {
        console.error("[prefs] load failed:", error);
      }

      if (data) {
        setPrefs({
          accent_color: data.accent_color as AccentColor,
          animations_enabled: data.animations_enabled,
        });
        setLoaded(true);
        try {
          localStorage.removeItem(LEGACY_KEY);
        } catch {
          /* ignore */
        }
        return;
      }

      const legacy = readLegacy();
      const seed: Preferences = {
        accent_color: (legacy?.accent_color as AccentColor) ?? DEFAULTS.accent_color,
        animations_enabled: legacy?.animations_enabled ?? DEFAULTS.animations_enabled,
      };
      const { error: insErr } = await supabase
        .from("user_preferences")
        .insert({ user_id: userId, ...seed });
      if (insErr) console.error("[prefs] seed insert failed:", insErr);
      if (!alive) return;
      setPrefs(seed);
      setLoaded(true);
      try {
        localStorage.removeItem(LEGACY_KEY);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      alive = false;
    };
  }, [userId]);

  const update = async <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    if (!userId) return;
    setPrefs((p) => ({ ...p, [key]: value }));
    const { error } = await supabase
      .from("user_preferences")
      .upsert({ user_id: userId, [key]: value, updated_at: new Date().toISOString() });
    if (error) console.error("[prefs] update failed:", error);
  };

  return { prefs, update, loaded };
}
