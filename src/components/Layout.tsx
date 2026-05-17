import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { I, type IconKey } from "./Icons";
import { useProgress } from "../hooks/useProgress";
import { useActivity } from "../hooks/useActivity";
import { useCatalog } from "../hooks/useTopicsCatalog";
import { useUserPreferences, type AccentColor, type DashboardLayout } from "../hooks/useUserPreferences";
import { useUserProfile } from "../hooks/useUserProfile";
import { useUserState, bumpLongestStreak } from "../hooks/useUserState";
import { useFocus } from "../hooks/useFocus";
import { computeStats, findCurrentTopic, getRank } from "../lib/stats";
import { ToastProvider, useToast } from "./ToastContext";

const NAV: Array<{ to: string; label: string; icon: IconKey; end?: boolean }> = [
  { to: "/",             label: "Главная",        icon: "home",   end: true },
  { to: "/catalog",      label: "Карта обучения", icon: "map" },
  { to: "/lesson",       label: "Текущий урок",   icon: "book" },
  { to: "/playground",   label: "Песочница",      icon: "code" },
  { to: "/focus",        label: "Фокус-таймер",   icon: "timer" },
  { to: "/achievements", label: "Достижения",     icon: "trophy" },
  { to: "/profile",      label: "Профиль",        icon: "user" },
];

const ACCENTS: Record<AccentColor, { accent: string; deep: string; soft: string; tint: string }> = {
  terracotta: { accent: "#e85a2b", deep: "#c4421b", soft: "#fbe7dc", tint: "#fef3ec" },
  indigo:     { accent: "#5b6cff", deep: "#3d4dd6", soft: "#dfe3ff", tint: "#eef0ff" },
  forest:     { accent: "#3f8a5e", deep: "#2d6c47", soft: "#d8ead9", tint: "#e9f3ea" },
  plum:       { accent: "#9b4faa", deep: "#763a85", soft: "#ecd7f0", tint: "#f6eaf8" },
};

function Sidebar({ currentLessonId }: { currentLessonId: string | undefined }) {
  const progress = useProgress();
  const catalog = useCatalog();
  const { profile } = useUserProfile();
  const stats = computeStats(progress, catalog.topics.length);
  const initial = (profile?.display_name?.[0] ?? "?").toUpperCase();

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
            <div className="avatar" style={{ width: 40, height: 40 }}>{initial}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13.5 }}>{profile?.display_name ?? "…"}</div>
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

function PomodoroPill() {
  const focus = useFocus();
  const navigate = useNavigate();
  const m = Math.floor(focus.remaining / 60);
  const s = focus.remaining % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  const isWork = focus.phase === "work";

  return (
    <button
      className="stat-pill"
      onClick={() => navigate("/focus")}
      title={focus.running ? "Идёт фокус-сессия" : "Открыть таймер"}
      style={{
        cursor: "pointer",
        border: "1px solid var(--border)",
        background: focus.running ? (isWork ? "var(--accent-tint)" : "var(--success-soft)") : "var(--surface)",
        color: focus.running ? (isWork ? "var(--accent-deep)" : "var(--success)") : "var(--ink-2)",
        padding: "5px 10px 5px 6px",
      }}
    >
      <span
        className={focus.running ? "pulse" : ""}
        style={{
          width: 22,
          height: 22,
          borderRadius: 7,
          background: focus.running ? (isWork ? "var(--accent)" : "var(--success)") : "var(--bg-2)",
          color: focus.running ? "white" : "var(--muted)",
          display: "grid",
          placeItems: "center",
        }}
      >
        <I.clock size={12} />
      </span>
      <span className="mono" style={{ fontVariantNumeric: "tabular-nums", letterSpacing: "0.02em" }}>
        {mm}:{ss}
      </span>
    </button>
  );
}

function Topbar({ currentLessonId, isTopicRoute }: { currentLessonId: string | undefined; isTopicRoute: boolean }) {
  const progress = useProgress();
  const activity = useActivity();
  const catalog = useCatalog();
  const { state: us } = useUserState();
  const { profile } = useUserProfile();
  const stats = computeStats(progress, catalog.topics.length);
  const navigate = useNavigate();
  const { fireToast } = useToast();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const initial = (profile?.display_name?.[0] ?? "?").toUpperCase();

  const results = NAV.filter((n) => n.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="topbar">
      {isTopicRoute && (
        <NavLink to="/catalog" className="topic-back-btn" aria-label="К карте обучения">
          <I.arrowL size={18} />
        </NavLink>
      )}
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
        <PomodoroPill />
        <span className="stat-pill streak" title="Стрик — дни подряд">
          <I.fire size={14} /> {activity.streak}
        </span>
        <span className="stat-pill xp" title="Опыт">
          <I.bolt size={14} /> {stats.xp.toLocaleString("ru")}
        </span>
        <span className="stat-pill hearts" title="Жизни">
          <I.heart size={14} /> {us.hearts}/{us.hearts_max}
        </span>
        <button className="btn btn-quiet" style={{ padding: 8 }} onClick={() => fireToast("Нет новых уведомлений")}>
          <I.bell size={16} />
        </button>
        <NavLink to="/profile" className="avatar" style={{ textDecoration: "none" }}>
          {initial}
        </NavLink>
      </div>
    </div>
  );
}

function TweaksPanel() {
  const { prefs, update } = useUserPreferences();
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "fixed", right: 18, bottom: 18, zIndex: 100 }}>
      {open && (
        <div className="card" style={{ width: 280, marginBottom: 10, padding: 14 }}>
          <div className="between" style={{ marginBottom: 12 }}>
            <h3 style={{ fontSize: 14 }}>Tweaks</h3>
            <button className="btn btn-quiet small" style={{ padding: 4 }} onClick={() => setOpen(false)}>
              <I.close size={14} />
            </button>
          </div>
          <div className="nav-section-title" style={{ padding: "0 0 6px" }}>Акцент</div>
          <div className="row" style={{ gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
            {(Object.entries(ACCENTS) as Array<[AccentColor, typeof ACCENTS[AccentColor]]>).map(([key, c]) => (
              <button
                key={key}
                onClick={() => void update("accent_color", key)}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: c.accent,
                  border: prefs.accent_color === key ? "2px solid var(--ink)" : "2px solid transparent",
                  cursor: "pointer",
                }}
                aria-label={key}
              />
            ))}
          </div>
          <div className="nav-section-title" style={{ padding: "0 0 6px" }}>Раскладка дашборда</div>
          <div className="row" style={{ gap: 6, marginBottom: 14 }}>
            {(["balanced", "focus", "compact"] as DashboardLayout[]).map((id) => (
              <button
                key={id}
                onClick={() => void update("dashboard_layout", id)}
                className="btn btn-quiet small"
                style={{
                  flex: 1,
                  padding: "6px 8px",
                  background: prefs.dashboard_layout === id ? "var(--accent-tint)" : "var(--bg-2)",
                  color: prefs.dashboard_layout === id ? "var(--accent-deep)" : "var(--muted)",
                  fontWeight: 700,
                  textTransform: "capitalize",
                }}
              >
                {id === "balanced" ? "Баланс" : id === "focus" ? "Фокус" : "Компакт"}
              </button>
            ))}
          </div>
          <div className="nav-section-title" style={{ padding: "0 0 6px" }}>Интерфейс</div>
          <label className="row between" style={{ cursor: "pointer", padding: "4px 0" }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Анимации</span>
            <input
              type="checkbox"
              checked={prefs.animations_enabled}
              onChange={(e) => void update("animations_enabled", e.target.checked)}
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
  const catalog = useCatalog();
  const current = findCurrentTopic(progress, catalog.topics);
  const { prefs } = useUserPreferences();
  const activity = useActivity();
  const location = useLocation();
  const navigate = useNavigate();

  // Mirror the rolling longest-streak from useActivity into user_state so other
  // surfaces (achievements, profile) can read it without recomputing.
  useEffect(() => {
    if (activity.longestStreak > 0) bumpLongestStreak(activity.longestStreak);
  }, [activity.longestStreak]);

  useEffect(() => {
    const a = ACCENTS[prefs.accent_color] ?? ACCENTS.terracotta;
    const root = document.documentElement;
    root.style.setProperty("--accent", a.accent);
    root.style.setProperty("--accent-deep", a.deep);
    root.style.setProperty("--accent-soft", a.soft);
    root.style.setProperty("--accent-tint", a.tint);
    root.style.setProperty("--heart", a.accent);
    root.style.setProperty("--shadow-pop", `0 8px 28px ${a.accent}40`);
  }, [prefs.accent_color]);

  useEffect(() => {
    document.documentElement.dataset.anim = prefs.animations_enabled ? "on" : "off";
  }, [prefs.animations_enabled]);

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

  const isTopicRoute = location.pathname.startsWith("/topic/");

  return (
    <div className={"app" + (isTopicRoute ? " topic-mode" : "")}>
      <Sidebar currentLessonId={current?.id} />
      <div className="main">
        <Topbar currentLessonId={current?.id} isTopicRoute={isTopicRoute} />
        <main className="content">
          <Outlet />
        </main>
      </div>
      <TweaksPanel />
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
