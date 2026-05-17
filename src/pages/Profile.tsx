import { useProgress } from "../hooks/useProgress";
import { useActivity } from "../hooks/useActivity";
import { useCatalog } from "../hooks/useTopicsCatalog";
import { useUserProfile, formatJoined } from "../hooks/useUserProfile";
import { useTrackStats } from "../hooks/useTrackStats";
import { useAchievements } from "../hooks/useAchievements";
import { useUserState } from "../hooks/useUserState";
import { computeBlockStats, computeStats, getRank as getXpRank } from "../lib/stats";
import { getRank } from "../lib/ranks";
import { I } from "../components/Icons";
import { RankRow, RankLadder } from "../components/RankUI";
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

function statusToActivityType(status: string): { icon: React.ReactNode; tint: string; color: string; verb: string } {
  switch (status) {
    case "done":
      return { icon: <I.done size={16} />, tint: "var(--st-done-bg)", color: "var(--st-done)", verb: "Закрыл" };
    case "review":
      return { icon: <I.pause size={16} />, tint: "var(--st-pause-bg)", color: "var(--st-pause)", verb: "Отметил на повторение" };
    case "skip":
      return { icon: <I.skip size={16} />, tint: "var(--st-skip-bg)", color: "var(--st-skip)", verb: "Пропустил" };
    default:
      return { icon: <I.book size={15} />, tint: "var(--accent-tint)", color: "var(--accent-deep)", verb: "Начал" };
  }
}

function timeAgo(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return "только что";
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)} дн назад`;
  return d.toLocaleDateString("ru");
}

function Stat({ label, value, icon, tint, color }: { label: string; value: string; icon: React.ReactNode; tint: string; color: string }) {
  return (
    <div className="card tight">
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 11,
          background: tint,
          color,
          display: "grid",
          placeItems: "center",
          marginBottom: 12,
        }}
      >
        {icon}
      </div>
      <div className="muted small">{label}</div>
      <div style={{ fontWeight: 800, fontSize: 22, marginTop: 2 }}>{value}</div>
    </div>
  );
}

export default function Profile() {
  const progress = useProgress();
  const activity = useActivity();
  const catalog = useCatalog();
  const { profile } = useUserProfile();
  const { state: us } = useUserState();
  const stats = computeStats(progress, catalog.topics.length);
  const blockStats = computeBlockStats(progress, catalog.groups);
  const achievements = useAchievements();
  const tracks = useTrackStats();
  const { fireToast } = useToast();
  const globalRank = getRank(tracks.totalHours);

  const displayName = profile?.display_name ?? "…";
  const handle = profile?.handle ?? "—";
  const joined = profile ? formatJoined(profile.joined_at) : "";
  const initial = (displayName[0] ?? "?").toUpperCase();

  return (
    <div className="col" style={{ gap: 20 }}>
      <div className="card" style={{ padding: 28 }}>
        <div className="row" style={{ gap: 22, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 24,
              background: "linear-gradient(135deg, #f9d2b8, var(--accent))",
              color: "white",
              display: "grid",
              placeItems: "center",
              fontWeight: 800,
              fontSize: 38,
              fontFamily: "Fraunces, serif",
              boxShadow: "var(--shadow-pop)",
            }}
          >
            {initial}
          </div>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div className="row" style={{ gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
              <h1 className="serif" style={{ fontSize: 30 }}>{displayName}</h1>
              <span className="chip accent">Уровень {stats.level}</span>
              <span
                className="chip"
                style={{ background: globalRank.tint, color: globalRank.color, borderColor: globalRank.color + "33" }}
              >
                {globalRank.glyph} {globalRank.name}
              </span>
            </div>
            <div className="muted" style={{ marginBottom: 12 }}>
              @{handle} · {getXpRank(stats.level)}{joined && ` · с ${joined}`}
            </div>
            <div className="progress" style={{ maxWidth: 420, marginBottom: 8 }}>
              <span style={{ width: `${stats.progressInLevel * 100}%` }} />
            </div>
            <div className="small muted">
              {stats.xpInLevel} / 250 XP до уровня {stats.level + 1}
            </div>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn btn-ghost" onClick={() => fireToast("Имя редактируется в БД — UI редактора скоро")}>
              Редактировать
            </button>
          </div>
        </div>
      </div>

      <div className="grid-4">
        <Stat label="Всего XP" value={stats.xpTotal.toLocaleString("ru")} icon={<I.bolt size={18} />} tint="var(--warning-soft)" color="#8c6a1f" />
        <Stat label="Часов фокуса" value={tracks.totalHours.toFixed(1) + " ч"} icon={<I.clock size={18} />} tint={globalRank.tint} color={globalRank.color} />
        <Stat label="Стрик" value={activity.streak + " дн"} icon={<I.fire size={18} />} tint="var(--accent-tint)" color="var(--accent-deep)" />
        <Stat
          label="Достижения"
          value={`${achievements.filter((a) => a.earned).length} / ${achievements.length}`}
          icon={<I.trophy size={18} />}
          tint="var(--info-soft)"
          color="var(--info)"
        />
      </div>

      <div className="grid-4">
        <Stat label="Изучено" value={`${stats.doneCount}`} icon={<I.done size={20} />} tint="var(--st-done-bg)" color="var(--st-done)" />
        <Stat label="Повторить" value={`${stats.reviewCount}`} icon={<I.pause size={20} />} tint="var(--st-pause-bg)" color="var(--st-pause)" />
        <Stat label="Лучший стрик" value={`${Math.max(activity.longestStreak, us.longest_streak)} дн`} icon={<I.flame size={20} />} tint="var(--accent-tint)" color="var(--accent-deep)" />
        <Stat label="Сессий фокуса" value={`${Array.from(tracks.byGroup.values()).reduce((s, t) => s + t.sessions, 0)}`} icon={<I.timer size={18} />} tint="var(--info-soft)" color="var(--info)" />
      </div>

      <div className="card">
        <SectionTitle
          icon={<I.clock size={16} />}
          title="Когда я учусь"
          action={
            <span className="small muted">
              пик: {tracks.hourBuckets.indexOf(Math.max(...tracks.hourBuckets, 1))
                .toString()
                .padStart(2, "0")}
              :00
            </span>
          }
        />
        <div className="row" style={{ gap: 3, alignItems: "flex-end", height: 100 }}>
          {tracks.hourBuckets.map((mins, h) => {
            const max = Math.max(...tracks.hourBuckets, 1);
            const pct = (mins / max) * 100;
            const block = h < 6 ? "ночь" : h < 12 ? "утро" : h < 18 ? "день" : "вечер";
            const tint =
              block === "ночь"
                ? "var(--info-soft)"
                : block === "утро"
                  ? "var(--warning-soft)"
                  : block === "день"
                    ? "var(--accent-tint)"
                    : "var(--success-soft)";
            const bar =
              block === "ночь"
                ? "var(--info)"
                : block === "утро"
                  ? "#c89a3f"
                  : block === "день"
                    ? "var(--accent)"
                    : "var(--success)";
            return (
              <div
                key={h}
                title={`${h.toString().padStart(2, "0")}:00 — ${mins} мин`}
                style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}
              >
                <div
                  style={{
                    width: "100%",
                    minHeight: mins > 0 ? 4 : 2,
                    height: `${Math.max(pct, mins > 0 ? 8 : 4)}%`,
                    background: mins > 0 ? bar : tint,
                    borderRadius: 3,
                  }}
                />
              </div>
            );
          })}
        </div>
        <div className="row" style={{ gap: 0, marginTop: 6 }}>
          {tracks.hourBuckets.map((_, h) => (
            <div key={h} style={{ flex: 1, textAlign: "center" }} className="muted" >
              {h % 6 === 0 ? <span style={{ fontSize: 10 }}>{h.toString().padStart(2, "0")}</span> : <span>&nbsp;</span>}
            </div>
          ))}
        </div>
        <div className="row" style={{ gap: 14, marginTop: 12, flexWrap: "wrap", fontSize: 11.5 }}>
          <span className="row" style={{ gap: 4 }}>
            <i style={{ width: 10, height: 10, borderRadius: 2, background: "var(--info)" }} /> ночь 00–06
          </span>
          <span className="row" style={{ gap: 4 }}>
            <i style={{ width: 10, height: 10, borderRadius: 2, background: "#c89a3f" }} /> утро 06–12
          </span>
          <span className="row" style={{ gap: 4 }}>
            <i style={{ width: 10, height: 10, borderRadius: 2, background: "var(--accent)" }} /> день 12–18
          </span>
          <span className="row" style={{ gap: 4 }}>
            <i style={{ width: 10, height: 10, borderRadius: 2, background: "var(--success)" }} /> вечер 18–24
          </span>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <SectionTitle
            icon={<I.flame size={16} />}
            title="Активность за 26 недель"
            action={<span className="small muted">{activity.activeDays} активных дней</span>}
          />
          <div className="heatmap">
            {activity.heatmap.map((v, i) => (
              <i key={i} className={v > 0 ? `l${v}` : ""} title={v ? `${v}× активность` : "нет активности"} />
            ))}
          </div>
          <div className="row" style={{ gap: 6, marginTop: 14, fontSize: 11.5, alignItems: "center" }}>
            <span className="muted small">меньше</span>
            <i style={{ width: 12, height: 12, borderRadius: 3, background: "var(--bg-2)" }} />
            <i style={{ width: 12, height: 12, borderRadius: 3, background: "#f7d9c4" }} />
            <i style={{ width: 12, height: 12, borderRadius: 3, background: "#f1b189" }} />
            <i style={{ width: 12, height: 12, borderRadius: 3, background: "#e8814f" }} />
            <i style={{ width: 12, height: 12, borderRadius: 3, background: "var(--accent)" }} />
            <span className="muted small">больше</span>
          </div>
        </div>

        <div className="card">
          <SectionTitle icon={<I.clock size={16} />} title="История активности" />
          <div className="col" style={{ gap: 2 }}>
            {activity.recent.length === 0 && (
              <div className="muted small" style={{ padding: 10 }}>Пока ничего нет — закрой первую тему 🚀</div>
            )}
            {activity.recent.map((r, i) => {
              const t = catalog.topics.find((x) => x.id === r.topic_id);
              const a = statusToActivityType(r.status);
              return (
                <div
                  key={i}
                  className="row"
                  style={{
                    gap: 12,
                    padding: "10px 4px",
                    borderBottom: i < activity.recent.length - 1 ? "1px solid var(--border)" : "none",
                  }}
                >
                  <span
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 9,
                      background: a.tint,
                      color: a.color,
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    {a.icon}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>
                      {a.verb} {t ? `«${t.title}»` : r.topic_id}
                    </div>
                    <div className="small muted">{timeAgo(r.updated_at)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <SectionTitle icon={<I.trophy size={16} />} title="Ранги по трекам" />
          <div className="col" style={{ gap: 0 }}>
            {catalog.groups.map((g) => (
              <RankRow
                key={g.id}
                title={g.title}
                icon={g.emoji}
                iconBg={g.color_soft}
                iconColor={g.color}
                hours={tracks.byGroup.get(g.id)?.hours ?? 0}
              />
            ))}
          </div>
        </div>
        <div className="card">
          <SectionTitle
            icon={<I.spark size={16} />}
            title="Общая шкала"
            action={
              <span
                className="chip"
                style={{ background: globalRank.tint, color: globalRank.color, borderColor: globalRank.color + "33" }}
              >
                {globalRank.glyph} {globalRank.name}
              </span>
            }
          />
          <RankLadder hours={tracks.totalHours} />
        </div>
      </div>

      <div className="card">
        <SectionTitle icon={<I.book size={16} />} title="Треки в работе" />
        <div className="col" style={{ gap: 14 }}>
          {catalog.groups.map((b) => {
            const s = blockStats.find((x) => x.blockId === b.id);
            return (
              <div key={b.id} className="row" style={{ gap: 14 }}>
                <span
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: b.color_soft,
                    color: b.color,
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                    fontSize: 22,
                  }}
                >
                  {b.emoji}
                </span>
                <div style={{ flex: 1 }}>
                  <div className="row between">
                    <div style={{ fontWeight: 700 }}>{b.title}</div>
                    <span className="small muted">
                      {s?.done ?? 0} / {s?.total ?? 0}
                    </span>
                  </div>
                  <div className="progress thin" style={{ marginTop: 6 }}>
                    <span style={{ width: `${(s?.progress ?? 0) * 100}%`, background: b.color }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
