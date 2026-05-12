import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { I, type IconKey } from "./Icons";
import { useProgress } from "../hooks/useProgress";
import { useActivity } from "../hooks/useActivity";
import { computeStats, findCurrentTopic, getRank } from "../lib/stats";
import { USER_NAME } from "../lib/user";
import { ToastProvider, useToast } from "./ToastContext";

const NAV: Array<{ to: string; label: string; icon: IconKey; end?: boolean }> = [
  { to: "/",             label: "Главная",        icon: "home",   end: true },
  { to: "/catalog",      label: "Карта обучения", icon: "map" },
  { to: "/lesson",       label: "Текущий урок",   icon: "book" },
  { to: "/playground",   label: "Песочница",      icon: "code" },
  { to: "/achievements", label: "Достижения",     icon: "trophy" },
  { to: "/profile",      label: "Профиль",        icon: "user" },
];

const ACCENTS: Record<string, { accent: string; deep: string; soft: string; tint: string }> = {
  terracotta: { accent: "#e85a2b", deep: "#c4421b", soft: "#fbe7dc", tint: "#fef3ec" },
  indigo:     { accent: "#5b6cff", deep: "#3d4dd6", soft: "#dfe3ff", tint: "#eef0ff" },
  forest:     { accent: "#3f8a5e", deep: "#2d6c47", soft: "#d8ead9", tint: "#e9f3ea" },
  plum:       { accent: "#9b4faa", deep: "#763a85", soft: "#ecd7f0", tint: "#f6eaf8" },
};

const TWEAKS_KEY = "react-learn:tweaks";
type Tweaks = { accent: keyof typeof ACCENTS; animations: boolean };
const DEFAULT_TWEAKS: Tweaks = { accent: "terracotta", animations: true };

function loadTweaks(): Tweaks {
  try {
    const raw = localStorage.getItem(TWEAKS_KEY);
    if (!raw) return DEFAULT_TWEAKS;
    return { ...DEFAULT_TWEAKS, ...(JSON.parse(raw) as Partial<Tweaks>) };
  } catch {
    return DEFAULT_TWEAKS;
  }
}

function saveTweaks(t: Tweaks) {
  localStorage.setItem(TWEAKS_KEY, JSON.stringify(t));
}

function Sidebar({ currentLessonId }: { currentLessonId: string | undefined }) {
  const progress = useProgress();
  const stats = computeStats(progress);

  return (
    <aside className="sidebar">
      <NavLink to="/" className="nav-brand" end>
        <div className="brand-mark">R</div>
        <div>
          <div style={{ fontWeight: 800, fontFamily: "Fraunces, serif", fontSize: 18, letterSpacing: "-0.02em" }}>
            React Learn
          </div>
          <div className="small muted" style={{ marginTop: -2 }}>учись с улыбкой</div>
        </div>
      </NavLink>

      <div className="nav-section-title">Навигация</div>
      <div className="nav-section">
        {NAV.map((n, i) => {
          const Ico = I[n.icon];
          const to = n.to === "/lesson" && currentLessonId ? `/topic/${currentLessonId}` : n.to;
          return (
            <NavLink
              key={n.to}
              to={to}
              end={n.end}
              className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}
            >
              <span className="nav-ico"><Ico size={18} /></span>
              <span>{n.label}</span>
              <span className="small muted" style={{ marginLeft: "auto", opacity: 0.6, fontSize: 11 }}>
                {i + 1}
              </span>
            </NavLink>
          );
        })}
      </div>

      <div style={{ marginTop: "auto" }}>
        <NavLink
          to="/profile"
          className="card tight"
          style={{ background: "var(--surface-2)", textDecoration: "none", color: "inherit", display: "block" }}
        >
          <div className="row" style={{ gap: 10 }}>
            <div className="avatar" style={{ width: 40, height: 40 }}>{USER_NAME[0]}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13.5 }}>{USER_NAME}</div>
              <div className="small muted" style={{ fontSize: 11 }}>{getRank(stats.level)}</div>
            </div>
            <span style={{ padding: 4, color: "var(--muted)" }}><I.chevR size={14} /></span>
          </div>
          <div className="progress thin" style={{ marginTop: 10 }}>
            <span style={{ width: `${stats.progressInLevel * 100}%` }} />
          </div>
          <div className="row between small muted" style={{ marginTop: 6, fontSize: 11 }}>
            <span>Ур. {stats.level}</span>
            <span>{stats.xpToNext} XP до {stats.level + 1}</span>
          </div>
        </NavLink>
      </div>
    </aside>
  );
}

function Topbar({ currentLessonId }: { currentLessonId: string | undefined }) {
  const progress = useProgress();
  const activity = useActivity();
  const stats = computeStats(progress);
  const navigate = useNavigate();
  const { fireToast } = useToast();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const results = NAV.filter((n) => n.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="topbar">
      <div className="row" style={{ gap: 14, flex: 1 }}>
        <div style={{ position: "relative", maxWidth: 360, flex: 1 }}>
          <I.search size={14} style={{ position: "absolute", left: 12, top: 11, color: "var(--muted)" }} />
          <input
            className="input"
            placeholder="Найти раздел…"
            style={{ paddingLeft: 34 }}
            value={query}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
            onChange={(e) => setQuery(e.target.value)}
          />
          {searchOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                left: 0,
                right: 0,
                background: "var(--surface)",
                border: "1px solid var(--border-strong)",
                borderRadius: 14,
                padding: 8,
                boxShadow: "var(--shadow-2)",
                zIndex: 50,
              }}
            >
              <div className="nav-section-title" style={{ padding: "6px 10px" }}>Быстрый переход</div>
              {results.length === 0 && (
                <div className="small muted" style={{ padding: "8px 12px" }}>Ничего не найдено</div>
              )}
              {results.map((n) => {
                const Ico = I[n.icon];
                const to = n.to === "/lesson" && currentLessonId ? `/topic/${currentLessonId}` : n.to;
                return (
                  <div
                    key={n.to}
                    className="nav-item"
                    onMouseDown={() => {
                      navigate(to);
                      setSearchOpen(false);
                      setQuery("");
                    }}
                  >
                    <span className="nav-ico"><Ico size={16} /></span>{n.label}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <div className="row" style={{ gap: 10 }}>
        <span className="stat-pill streak" title="Стрик — дни подряд">
          <I.fire size={14} /> {activity.streak}
        </span>
        <span className="stat-pill xp" title="Опыт">
          <I.bolt size={14} /> {stats.xp.toLocaleString("ru")}
        </span>
        <span className="stat-pill hearts" title="Жизни (декоративно)">
          <I.heart size={14} /> 5/5
        </span>
        <button className="btn btn-quiet" style={{ padding: 8 }} onClick={() => fireToast("Нет новых уведомлений")}>
          <I.bell size={16} />
        </button>
        <NavLink to="/profile" className="avatar" style={{ textDecoration: "none" }}>
          {USER_NAME[0]}
        </NavLink>
      </div>
    </div>
  );
}

function TweaksPanel({
  tweaks,
  setTweak,
}: {
  tweaks: Tweaks;
  setTweak: <K extends keyof Tweaks>(k: K, v: Tweaks[K]) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "fixed", right: 18, bottom: 18, zIndex: 100 }}>
      {open && (
        <div className="card" style={{ width: 260, marginBottom: 10, padding: 14 }}>
          <div className="between" style={{ marginBottom: 12 }}>
            <h3 style={{ fontSize: 14 }}>Tweaks</h3>
            <button className="btn btn-quiet small" style={{ padding: 4 }} onClick={() => setOpen(false)}>
              <I.close size={14} />
            </button>
          </div>
          <div className="nav-section-title" style={{ padding: "0 0 6px" }}>Акцент</div>
          <div className="row" style={{ gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
            {Object.entries(ACCENTS).map(([key, c]) => (
              <button
                key={key}
                onClick={() => setTweak("accent", key as keyof typeof ACCENTS)}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: c.accent,
                  border: tweaks.accent === key ? "2px solid var(--ink)" : "2px solid transparent",
                  cursor: "pointer",
                }}
                aria-label={key}
              />
            ))}
          </div>
          <div className="nav-section-title" style={{ padding: "0 0 6px" }}>Интерфейс</div>
          <label className="row between" style={{ cursor: "pointer", padding: "4px 0" }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Анимации</span>
            <input
              type="checkbox"
              checked={tweaks.animations}
              onChange={(e) => setTweak("animations", e.target.checked)}
            />
          </label>
        </div>
      )}
      <button
        className="btn btn-primary"
        style={{ borderRadius: 999, padding: "10px 14px" }}
        onClick={() => setOpen((v) => !v)}
      >
        <I.settings size={14} /> Tweaks
      </button>
    </div>
  );
}

function LayoutInner() {
  const progress = useProgress();
  const current = findCurrentTopic(progress);
  const location = useLocation();
  const navigate = useNavigate();
  const [tweaks, setTweaks] = useState<Tweaks>(loadTweaks);

  useEffect(() => {
    const a = ACCENTS[tweaks.accent] ?? ACCENTS.terracotta;
    const root = document.documentElement;
    root.style.setProperty("--accent", a.accent);
    root.style.setProperty("--accent-deep", a.deep);
    root.style.setProperty("--accent-soft", a.soft);
    root.style.setProperty("--accent-tint", a.tint);
    root.style.setProperty("--heart", a.accent);
    root.style.setProperty("--shadow-pop", `0 8px 28px ${a.accent}40`);
  }, [tweaks.accent]);

  useEffect(() => {
    document.documentElement.dataset.anim = tweaks.animations ? "on" : "off";
  }, [tweaks.animations]);

  useEffect(() => {
    saveTweaks(tweaks);
  }, [tweaks]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /input|textarea/i.test(target.tagName)) return;
      const idx = parseInt(e.key, 10);
      if (idx >= 1 && idx <= NAV.length) {
        const n = NAV[idx - 1];
        const to = n.to === "/lesson" && current?.id ? `/topic/${current.id}` : n.to;
        navigate(to);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate, current?.id]);

  const setTweak = <K extends keyof Tweaks>(k: K, v: Tweaks[K]) => {
    setTweaks((prev) => ({ ...prev, [k]: v }));
  };

  return (
    <div className="app">
      <Sidebar currentLessonId={current?.id} />
      <div className="main">
        <Topbar currentLessonId={current?.id} />
        <main className="content">
          <Outlet />
        </main>
      </div>
      <TweaksPanel tweaks={tweaks} setTweak={setTweak} />
    </div>
  );
}

export default function Layout() {
  return (
    <ToastProvider>
      <LayoutInner />
    </ToastProvider>
  );
}
