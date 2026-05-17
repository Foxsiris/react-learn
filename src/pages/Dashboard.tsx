import { Link, useNavigate } from "react-router-dom";
import { useProgress } from "../hooks/useProgress";
import { useActivity } from "../hooks/useActivity";
import { useCatalog, findCatalogGroupOf } from "../hooks/useTopicsCatalog";
import { useUserProfile } from "../hooks/useUserProfile";
import { useUserState } from "../hooks/useUserState";
import { useUserPreferences } from "../hooks/useUserPreferences";
import { useDailyQuests } from "../hooks/useDailyQuests";
import { useTrackStats } from "../hooks/useTrackStats";
import { useAchievements } from "../hooks/useAchievements";
import { computeBlockStats, computeStats, findCurrentTopic } from "../lib/stats";
import { I } from "../components/Icons";
import { HeartsBar } from "../components/RankUI";
import { useToast } from "../components/ToastContext";

function SectionTitle({ icon, title, action }: { icon: React.ReactNode; title: string; action?: React.ReactNode }) {
  return (
    <div className="between" style={{ marginBottom: 14 }}>
      <div className="row">
        <span style={{ color: "var(--accent)", display: "grid", placeItems: "center" }}>{icon}</span>
        <h3 style={{ fontSize: 16 }}>{title}</h3>
      </div>
      {action}
    </div>
  );
}

function formatRegen(ms: number): string {
  if (ms <= 0) return "восполнено";
  const m = Math.ceil(ms / 60000);
  return `+1 через ${m} мин`;
}

export default function Dashboard() {
  const progress = useProgress();
  const activity = useActivity();
  const catalog = useCatalog();
  const { profile } = useUserProfile();
  const { state: us, nextRegenMs } = useUserState();
  const { prefs } = useUserPreferences();
  const tracks = useTrackStats();
  const quests = useDailyQuests(tracks.todayMinutes);
  const achievements = useAchievements();
  const stats = computeStats(progress, catalog.topics.length);
  const blockStats = computeBlockStats(progress, catalog.groups);
  const current = findCurrentTopic(progress, catalog.topics);
  const currentGroup = current ? findCatalogGroupOf(catalog, current.id) : undefined;
  const earned = achievements.filter((a) => a.earned).slice(-3).reverse();
  const navigate = useNavigate();
  const { fireToast } = useToast();

  const layout = prefs.dashboard_layout;
  const isFocus = layout === "focus";
  const isCompact = layout === "compact";

  const weekday = (new Date().getDay() + 6) % 7;
  const weekLabels = ["П", "В", "С", "Ч", "П", "С", "В"];
  const todayHrs = Math.floor(tracks.todayMinutes / 60);
  const todayMins = tracks.todayMinutes % 60;
  const pomoToday = tracks.sessionsToday;
  const pomoGoal = 6;

  const heroCard = (
    <div
      className="card"
      style={{
        background: "linear-gradient(135deg, var(--accent-tint) 0%, #fbf3ec 100%)",
        borderColor: "var(--accent-soft)",
        padding: isFocus ? 32 : 24,
        display: "flex",
        flexDirection: isFocus ? "row" : "column",
        gap: 22,
        alignItems: isFocus ? "center" : "stretch",
      }}
    >
      <div style={{ flex: 1 }}>
        <div className="chip accent" style={{ marginBottom: 12 }}>
          <I.bolt size={12} /> Продолжаем
        </div>
        <h1 className="serif" style={{ fontSize: isFocus ? 38 : 30, marginBottom: 8 }}>
          Привет, {profile?.display_name ?? "…"}! Готов продолжить?
        </h1>
        <p className="muted" style={{ marginBottom: 18, maxWidth: 520 }}>
          {current ? (
            <>
              Сейчас на теме <b style={{ color: "var(--ink)" }}>«{current.title}»</b>
              {currentGroup && (
                <>
                  {" "}из трека «{currentGroup.title}»
                </>
              )}
              . Закроем её сегодня?
            </>
          ) : (
            <>Весь курс пройден — но всегда можно вернуться и повторить.</>
          )}
        </p>
        <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
          {current && (
            <button className="btn btn-primary btn-lg" onClick={() => navigate(`/topic/${current.id}`)}>
              <I.play size={14} /> Продолжить урок
            </button>
          )}
          <button className="btn btn-ghost btn-lg" onClick={() => navigate("/focus")}>
            <I.timer size={14} /> Фокус-сессия
          </button>
        </div>
      </div>
      {isFocus && current && (
        <div
          style={{
            width: 280,
            padding: 22,
            background: "rgba(255,255,255,0.7)",
            border: "1px solid var(--accent-soft)",
            borderRadius: 16,
          }}
        >
          <div className="muted small" style={{ marginBottom: 6 }}>Сейчас изучаешь</div>
          <div className="serif" style={{ fontSize: 22, marginBottom: 14 }}>{current.title}</div>
          <div className="progress" style={{ marginBottom: 10 }}>
            <span style={{ width: `${stats.overallProgress * 100}%` }} />
          </div>
          <div className="row between small muted">
            <span>{stats.doneCount}/{stats.totalTopics} тем</span>
            <span>+50 XP</span>
          </div>
        </div>
      )}
    </div>
  );

  const xpCard = (
    <div className="card tight">
      <div className="row between">
        <div>
          <div className="muted small">Уровень {stats.level}</div>
          <div style={{ fontWeight: 800, fontSize: 22, marginTop: 2 }}>
            {stats.xpInLevel}{" "}
            <span className="muted" style={{ fontWeight: 500, fontSize: 14 }}>/ 250 XP</span>
          </div>
        </div>
        <div className="stat-pill xp">
          <I.bolt size={13} /> Всего {stats.xpTotal}
        </div>
      </div>
      <div className="progress" style={{ marginTop: 14 }}>
        <span style={{ width: `${stats.progressInLevel * 100}%` }} />
      </div>
      <div className="small muted" style={{ marginTop: 8 }}>
        До уровня {stats.level + 1}: {stats.xpToNext} XP
      </div>
    </div>
  );

  const streakCard = (
    <div className="card tight" style={{ position: "relative", overflow: "hidden" }}>
      <div className="row between">
        <div>
          <div className="muted small">Стрик</div>
          <div className="row" style={{ marginTop: 2, gap: 8, alignItems: "baseline" }}>
            <span style={{ fontWeight: 800, fontSize: 28 }}>{activity.streak}</span>
            <span className="muted">дней подряд</span>
          </div>
        </div>
        <div style={{ fontSize: 36, lineHeight: 1, color: "var(--accent)" }}>
          <I.fire size={36} />
        </div>
      </div>
      <div className="row" style={{ gap: 4, marginTop: 14 }}>
        {weekLabels.map((d, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center" }}>
            <div className="muted small" style={{ marginBottom: 4 }}>{d}</div>
            <div
              style={{
                height: 22,
                borderRadius: 6,
                background:
                  i < weekday
                    ? "var(--accent)"
                    : i === weekday
                      ? activity.todayCount
                        ? "var(--accent)"
                        : "var(--accent-tint)"
                      : "var(--bg-2)",
                border: i === weekday && !activity.todayCount ? "2px dashed var(--accent)" : "none",
              }}
            />
          </div>
        ))}
      </div>
      <div className="small muted" style={{ marginTop: 10 }}>
        {activity.todayCount > 0 ? `Сегодня: ${activity.todayCount} активности 🔥` : "Не теряй ритм — пройди тему сегодня!"}
      </div>
    </div>
  );

  const heartsCard = (
    <div className="card tight" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      <div>
        <div className="muted small">Жизни</div>
        <div className="row" style={{ gap: 6, marginTop: 2, alignItems: "baseline" }}>
          <span style={{ fontWeight: 800, fontSize: 22 }}>{us.hearts}</span>
          <span className="muted small">/ {us.hearts_max}</span>
        </div>
        <div style={{ marginTop: 8 }}>
          <HeartsBar value={us.hearts} max={us.hearts_max} />
        </div>
        <div className="row" style={{ marginTop: 8, gap: 6 }}>
          <I.clock size={12} style={{ color: "var(--muted)" }} />
          <span className="small muted" style={{ fontSize: 11 }}>
            {us.hearts >= us.hearts_max ? "восполнено" : formatRegen(nextRegenMs)}
          </span>
        </div>
      </div>
      <div
        style={{ borderLeft: "1px solid var(--border)", paddingLeft: 14, cursor: "pointer" }}
        onClick={() => navigate("/focus")}
      >
        <div className="muted small">Фокус сегодня</div>
        <div className="row" style={{ gap: 4, marginTop: 2, alignItems: "baseline" }}>
          <span style={{ fontWeight: 800, fontSize: 22 }}>
            {todayHrs}ч {todayMins}м
          </span>
        </div>
        <div className="row" style={{ marginTop: 8, gap: 4 }}>
          {Array.from({ length: pomoGoal }).map((_, i) => (
            <span
              key={i}
              style={{
                width: 14,
                height: 14,
                borderRadius: 4,
                background: i < pomoToday ? "var(--accent)" : "var(--bg-2)",
                border: i < pomoToday ? "none" : "1px dashed var(--border-strong)",
              }}
            />
          ))}
        </div>
        <div className="small" style={{ marginTop: 8, color: "var(--accent-deep)", fontWeight: 600, fontSize: 11.5 }}>
          {pomoToday} / {pomoGoal} помодоро →
        </div>
      </div>
    </div>
  );

  const questsCard = (
    <div className="card">
      <SectionTitle
        icon={<I.target size={16} />}
        title="Сегодняшние квесты"
        action={
          <span className="chip">
            {quests.filter((q) => q.completed).length}/{quests.length}
          </span>
        }
      />
      <div className="col" style={{ gap: 4 }}>
        {quests.map((q) => (
          <div key={q.id} className="quest">
            <div className={"qbox" + (q.completed ? " done" : "")}>
              {q.completed ? <I.done size={18} /> : <I.target size={16} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="row between" style={{ marginBottom: 6 }}>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 13.5,
                    textDecoration: q.completed ? "line-through" : "none",
                    color: q.completed ? "var(--muted)" : "var(--ink)",
                  }}
                >
                  {q.title}
                </div>
                <span className="chip accent" style={{ fontSize: 11 }}>+{q.xp} XP</span>
              </div>
              <div className="progress thin">
                <span style={{ width: `${Math.min(100, (q.progress / q.target) * 100)}%` }} />
              </div>
              <div className="small muted" style={{ marginTop: 4, fontSize: 11 }}>
                {q.progress} / {q.target}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="sep" />
      <div className="row between">
        <span className="small muted">
          <I.clock size={12} /> Сбрасываются в полночь
        </span>
        <button
          className="btn btn-quiet small"
          style={{ color: "var(--accent)" }}
          onClick={() => fireToast("Больше квестов появятся скоро!")}
        >
          Посмотреть все
        </button>
      </div>
    </div>
  );

  const myTracksCard = (
    <div className="card">
      <SectionTitle
        icon={<I.book size={16} />}
        title="Мои треки"
        action={
          <Link to="/catalog" className="btn btn-quiet small">
            Все →
          </Link>
        }
      />
      <div className="col" style={{ gap: 12 }}>
        {catalog.groups.slice(0, 4).map((b) => {
          const s = blockStats.find((x) => x.blockId === b.id);
          return (
            <Link
              to="/catalog"
              key={b.id}
              className="row"
              style={{ gap: 14, padding: "8px 4px", textDecoration: "none", color: "inherit" }}
            >
              <span
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 11,
                  background: b.color_soft,
                  color: b.color,
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                  fontSize: 20,
                }}
              >
                {b.emoji}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="row between" style={{ marginBottom: 6 }}>
                  <div style={{ fontWeight: 600 }}>{b.title}</div>
                  <span className="small muted">{s ? Math.round(s.progress * 100) : 0}%</span>
                </div>
                <div className="progress thin">
                  <span style={{ width: `${s ? s.progress * 100 : 0}%`, background: b.color }} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );

  const recentBadgesCard = (
    <div className="card">
      <SectionTitle
        icon={<I.trophy size={16} />}
        title="Свежие достижения"
        action={
          <Link to="/achievements" className="btn btn-quiet small">
            Все →
          </Link>
        }
      />
      {earned.length === 0 ? (
        <div className="muted small" style={{ padding: "10px 4px" }}>
          Пройди первую тему — и здесь появится твой первый бейдж 🚀
        </div>
      ) : (
        <div className="grid-3">
          {earned.map((a) => (
            <Link
              to="/achievements"
              key={a.id}
              className="badge"
              style={{ aspectRatio: "auto", padding: 14, textDecoration: "none", color: "inherit" }}
            >
              <div className="glyph" style={{ width: 44, height: 44, fontSize: 22 }}>
                {a.glyph}
              </div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{a.title}</div>
              <div className="small muted" style={{ fontSize: 11 }}>{a.sub}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );

  if (isFocus) {
    return (
      <div className="col" style={{ gap: 20 }}>
        {heroCard}
        <div className="grid-4">
          {xpCard}
          {streakCard}
          {heartsCard}
          {questsCard}
        </div>
        <div className="grid-2">
          {myTracksCard}
          {recentBadgesCard}
        </div>
      </div>
    );
  }

  if (isCompact) {
    return (
      <div className="col" style={{ gap: 20 }}>
        <div className="grid-4">
          {xpCard}
          {streakCard}
          {heartsCard}
          <div
            className="card tight row"
            style={{ alignItems: "stretch", gap: 14, cursor: "pointer" }}
            onClick={() => (current ? navigate(`/topic/${current.id}`) : navigate("/catalog"))}
          >
            <div style={{ width: 4, background: "var(--accent)", borderRadius: 4 }} />
            <div style={{ flex: 1 }}>
              <div className="muted small">Продолжить</div>
              <div style={{ fontWeight: 700, marginTop: 4 }}>{current?.title ?? "Все темы пройдены"}</div>
              <div className="small muted" style={{ marginTop: 4 }}>
                {currentGroup ? currentGroup.title : "—"}
              </div>
            </div>
            <I.arrow size={18} style={{ color: "var(--accent)", alignSelf: "center" }} />
          </div>
        </div>
        <div className="grid-2">
          {questsCard}
          <div className="col">
            {myTracksCard}
            {recentBadgesCard}
          </div>
        </div>
      </div>
    );
  }

  // balanced (default)
  return (
    <div className="col" style={{ gap: 20 }}>
      <div className="grid-2">
        {heroCard}
        <div className="col">
          {xpCard}
          {streakCard}
        </div>
      </div>
      <div className="grid-2">
        {questsCard}
        <div className="col">
          {heartsCard}
          {myTracksCard}
        </div>
      </div>
      {recentBadgesCard}
    </div>
  );
}
