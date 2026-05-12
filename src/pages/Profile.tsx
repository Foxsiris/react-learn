import { useProgress } from "../hooks/useProgress";
import { useActivity } from "../hooks/useActivity";
import { computeAchievements, computeBlockStats, computeStats, getRank } from "../lib/stats";
import { blocks, findTopic } from "../data/topics";
import { USER_NAME, USER_HANDLE, USER_JOINED } from "../lib/user";
import { I } from "../components/Icons";
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
      return { icon: <I.check size={15} />, tint: "var(--success-soft)", color: "var(--success)", verb: "Закрыл" };
    case "review":
      return { icon: <I.refresh size={15} />, tint: "var(--warning-soft)", color: "#8c6a1f", verb: "Отметил на повторение" };
    case "skip":
      return { icon: <I.close size={15} />, tint: "var(--bg-2)", color: "var(--muted)", verb: "Пропустил" };
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

export default function Profile() {
  const progress = useProgress();
  const activity = useActivity();
  const stats = computeStats(progress);
  const blockStats = computeBlockStats(progress);
  const achievements = computeAchievements(progress);
  const { fireToast } = useToast();

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
            {USER_NAME[0]}
          </div>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div className="row" style={{ gap: 10, marginBottom: 6 }}>
              <h1 className="serif" style={{ fontSize: 30 }}>{USER_NAME}</h1>
              <span className="chip accent">Уровень {stats.level}</span>
            </div>
            <div className="muted" style={{ marginBottom: 12 }}>
              @{USER_HANDLE} · {getRank(stats.level)} · с {USER_JOINED}
            </div>
            <div className="progress" style={{ maxWidth: 420, marginBottom: 8 }}>
              <span style={{ width: `${stats.progressInLevel * 100}%` }} />
            </div>
            <div className="small muted">
              {stats.xpInLevel} / 250 XP до уровня {stats.level + 1}
            </div>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn btn-ghost" onClick={() => fireToast("Имя зашито в lib/user.ts — пока без UI редактирования")}>
              Редактировать
            </button>
          </div>
        </div>
      </div>

      <div className="grid-4">
        <Stat label="Всего XP" value={stats.xpTotal.toLocaleString("ru")} icon={<I.bolt size={18} />} tint="var(--warning-soft)" color="#8c6a1f" />
        <Stat label="Стрик" value={activity.streak + " дн"} icon={<I.fire size={18} />} tint="var(--accent-tint)" color="var(--accent-deep)" />
        <Stat label="Лучший стрик" value={activity.longestStreak + " дн"} icon={<I.flame size={18} />} tint="var(--accent-tint)" color="var(--accent-deep)" />
        <Stat
          label="Достижения"
          value={`${achievements.filter((a) => a.earned).length} / ${achievements.length}`}
          icon={<I.trophy size={18} />}
          tint="var(--info-soft)"
          color="var(--info)"
        />
      </div>

      <div className="grid-4">
        <Stat label="Изучено" value={`${stats.doneCount}`} icon={<I.check size={18} />} tint="var(--success-soft)" color="var(--success)" />
        <Stat label="Повторить" value={`${stats.reviewCount}`} icon={<I.refresh size={18} />} tint="var(--warning-soft)" color="#8c6a1f" />
        <Stat label="Пропущено" value={`${stats.skipCount}`} icon={<I.close size={18} />} tint="var(--bg-2)" color="var(--muted)" />
        <Stat label="Не начато" value={`${stats.todoCount}`} icon={<I.book size={18} />} tint="var(--info-soft)" color="var(--info)" />
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
              const t = findTopic(r.topic_id);
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

      <div className="card">
        <SectionTitle icon={<I.book size={16} />} title="Блоки в работе" />
        <div className="col" style={{ gap: 14 }}>
          {blocks.map((b) => {
            const s = blockStats.find((x) => x.blockId === b.id);
            return (
              <div key={b.id} className="row" style={{ gap: 14 }}>
                <span
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: "var(--accent-tint)",
                    color: "var(--accent-deep)",
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
                    <span style={{ width: `${(s?.progress ?? 0) * 100}%` }} />
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

function Stat({ label, value, icon, tint, color }: { label: string; value: string; icon: React.ReactNode; tint: string; color: string }) {
  return (
    <div className="card tight">
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 11,
          background: tint,
          color: color,
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
