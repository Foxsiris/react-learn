import { Link, useNavigate } from "react-router-dom";
import { useProgress } from "../hooks/useProgress";
import { useActivity } from "../hooks/useActivity";
import { computeAchievements, computeBlockStats, computeStats, findCurrentTopic } from "../lib/stats";
import { blocks, findBlockOf } from "../data/topics";
import { USER_NAME } from "../lib/user";
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

export default function Dashboard() {
  const progress = useProgress();
  const activity = useActivity();
  const stats = computeStats(progress);
  const blockStats = computeBlockStats(progress);
  const current = findCurrentTopic(progress);
  const currentBlock = current ? findBlockOf(current.id) : undefined;
  const achievements = computeAchievements(progress);
  const earned = achievements.filter((a) => a.earned).slice(-3).reverse();
  const navigate = useNavigate();
  const { fireToast } = useToast();

  const quests = [
    {
      id: "lesson",
      title: "Пройди 1 урок сегодня",
      xp: 30,
      progress: Math.min(activity.todayCount, 1),
      target: 1,
      done: activity.todayCount >= 1,
    },
    {
      id: "streak",
      title: `Поддержи стрик (${activity.streak} дн)`,
      xp: 20,
      progress: Math.min(activity.todayCount, 1),
      target: 1,
      done: activity.todayCount >= 1,
    },
    {
      id: "many",
      title: "Закрой 3 темы за день",
      xp: 50,
      progress: Math.min(activity.todayCount, 3),
      target: 3,
      done: activity.todayCount >= 3,
    },
  ];

  const weekday = (new Date().getDay() + 6) % 7;
  const weekLabels = ["П", "В", "С", "Ч", "П", "С", "В"];

  return (
    <div className="col" style={{ gap: 20 }}>
      <div className="grid-2">
        <div
          className="card"
          style={{
            background: "linear-gradient(135deg, var(--accent-tint) 0%, #fbf3ec 100%)",
            borderColor: "var(--accent-soft)",
            display: "flex",
            flexDirection: "column",
            gap: 22,
          }}
        >
          <div style={{ flex: 1 }}>
            <div className="chip accent" style={{ marginBottom: 12 }}>
              <I.bolt size={12} /> Продолжаем
            </div>
            <h1 className="serif" style={{ fontSize: 30, marginBottom: 8 }}>
              Привет, {USER_NAME}! Готов продолжить?
            </h1>
            <p className="muted" style={{ marginBottom: 18, maxWidth: 520 }}>
              {current ? (
                <>
                  Сейчас на теме <b style={{ color: "var(--ink)" }}>«{current.title}»</b>
                  {currentBlock && <> из блока «{currentBlock.title}»</>}. Закроем её сегодня?
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
              <button className="btn btn-ghost btn-lg" onClick={() => navigate("/playground")}>
                <I.code size={14} /> Открыть песочницу
              </button>
            </div>
          </div>
        </div>

        <div className="col">
          <div className="card tight">
            <div className="row between">
              <div>
                <div className="muted small">Уровень {stats.level}</div>
                <div style={{ fontWeight: 800, fontSize: 22, marginTop: 2 }}>
                  {stats.xpInLevel}{" "}
                  <span className="muted" style={{ fontWeight: 500, fontSize: 14 }}>
                    / 250 XP
                  </span>
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
                        i < weekday ? "var(--accent)" : i === weekday ? (activity.todayCount ? "var(--accent)" : "var(--accent-tint)") : "var(--bg-2)",
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
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <SectionTitle
            icon={<I.target size={16} />}
            title="Сегодняшние квесты"
            action={<span className="chip">{quests.filter((q) => q.done).length}/{quests.length}</span>}
          />
          <div className="col" style={{ gap: 4 }}>
            {quests.map((q) => (
              <div key={q.id} className="quest">
                <div className={"qbox" + (q.done ? " done" : "")}>
                  {q.done ? <I.check size={18} /> : <I.target size={16} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="row between" style={{ marginBottom: 6 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 13.5,
                        textDecoration: q.done ? "line-through" : "none",
                        color: q.done ? "var(--muted)" : "var(--ink)",
                      }}
                    >
                      {q.title}
                    </div>
                    <span className="chip accent" style={{ fontSize: 11 }}>+{q.xp} XP</span>
                  </div>
                  <div className="progress thin">
                    <span style={{ width: `${Math.min(100, (q.progress / q.target) * 100)}%` }} />
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

        <div className="col">
          <div className="card tight">
            <div className="row between">
              <div>
                <div className="muted small">Жизни</div>
                <div style={{ fontWeight: 800, fontSize: 22, marginTop: 2 }}>
                  5 <span className="muted" style={{ fontWeight: 500, fontSize: 14 }}>/ 5</span>
                </div>
              </div>
              <span className="hearts-bar">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className="full">
                    <I.heart size={14} />
                  </span>
                ))}
              </span>
            </div>
            <div className="row" style={{ marginTop: 14, gap: 8 }}>
              <I.clock size={14} style={{ color: "var(--muted)" }} />
              <span className="small muted">Декоративные пока — учиться можно бесконечно</span>
            </div>
          </div>

          <div className="card">
            <SectionTitle
              icon={<I.book size={16} />}
              title="Мои разделы"
              action={
                <Link to="/catalog" className="btn btn-quiet small">
                  Все →
                </Link>
              }
            />
            <div className="col" style={{ gap: 12 }}>
              {blocks.slice(0, 4).map((b) => {
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
                        background: "var(--accent-tint)",
                        color: "var(--accent-deep)",
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
                        <span className="small muted">
                          {s ? Math.round(s.progress * 100) : 0}%
                        </span>
                      </div>
                      <div className="progress thin">
                        <span style={{ width: `${s ? s.progress * 100 : 0}%` }} />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

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
    </div>
  );
}
