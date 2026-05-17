import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useCatalog, findCatalogGroupOf } from "../hooks/useTopicsCatalog";
import { useReviewSchedule, useProgress, recordReviewOutcome, setStatus } from "../hooks/useProgress";
import { getQuizForTopic } from "../data/quizzes";
import { findTopic } from "../data/topics";
import Quiz from "../components/Quiz";
import { I } from "../components/Icons";
import { useToast } from "../components/ToastContext";

type DueTopic = {
  topicId: string;
  title: string;
  groupTitle: string;
  groupColor: string;
  groupSoft: string;
  groupEmoji: string;
  nextReviewAt: string;
  intervalDays: number;
  daysOverdue: number;
};

function dayDiff(a: Date, b: Date): number {
  return Math.floor((a.getTime() - b.getTime()) / (24 * 3600 * 1000));
}

export default function Review() {
  const catalog = useCatalog();
  const schedule = useReviewSchedule();
  const progress = useProgress();
  const { fireToast } = useToast();
  const [recallChoice, setRecallChoice] = useState<"good" | "miss" | null>(null);

  const due: DueTopic[] = useMemo(() => {
    const now = new Date();
    const items: DueTopic[] = [];
    for (const [topicId, sched] of Object.entries(schedule)) {
      if (!sched.nextReviewAt) continue;
      const dueAt = new Date(sched.nextReviewAt);
      if (dueAt > now) continue; // not yet due
      const t = catalog.topics.find((x) => x.id === topicId);
      const g = findCatalogGroupOf(catalog, topicId);
      if (!t || !g) continue;
      items.push({
        topicId,
        title: t.title,
        groupTitle: g.title,
        groupColor: g.color,
        groupSoft: g.color_soft,
        groupEmoji: g.emoji,
        nextReviewAt: sched.nextReviewAt,
        intervalDays: sched.intervalDays,
        daysOverdue: dayDiff(now, dueAt),
      });
    }
    return items.sort((a, b) => b.daysOverdue - a.daysOverdue);
  }, [schedule, catalog]);

  const upcoming = useMemo(() => {
    const now = new Date();
    const items: DueTopic[] = [];
    for (const [topicId, sched] of Object.entries(schedule)) {
      if (!sched.nextReviewAt) continue;
      const dueAt = new Date(sched.nextReviewAt);
      if (dueAt <= now) continue;
      const t = catalog.topics.find((x) => x.id === topicId);
      const g = findCatalogGroupOf(catalog, topicId);
      if (!t || !g) continue;
      items.push({
        topicId,
        title: t.title,
        groupTitle: g.title,
        groupColor: g.color,
        groupSoft: g.color_soft,
        groupEmoji: g.emoji,
        nextReviewAt: sched.nextReviewAt,
        intervalDays: sched.intervalDays,
        daysOverdue: 0,
      });
    }
    return items.sort((a, b) => a.nextReviewAt.localeCompare(b.nextReviewAt));
  }, [schedule, catalog]);

  const [activeIdx, setActiveIdx] = useState(0);
  const active = due[Math.min(activeIdx, due.length - 1)];
  const activeQuiz = active ? getQuizForTopic(active.topicId) : undefined;
  const activeContent = active ? findTopic(active.topicId) : undefined;

  function nextStep(intervalDays: number): number {
    const steps = [1, 3, 7, 14];
    const idx = steps.indexOf(intervalDays);
    return steps[Math.min(idx + 1, steps.length - 1)];
  }

  function handleRecall(recalled: boolean) {
    if (!active) return;
    setRecallChoice(recalled ? "good" : "miss");
    recordReviewOutcome(active.topicId, recalled);
    const nextDays = recalled ? nextStep(active.intervalDays) : 1;
    fireToast(
      recalled
        ? `Помню! Следующее повторение через ${nextDays} ${nextDays === 1 ? "день" : "дн"}.`
        : "Сбросили интервал на 1 день — повторим скоро."
    );
    setTimeout(() => {
      setRecallChoice(null);
      setActiveIdx((i) => Math.min(i + 1, due.length));
    }, 700);
  }

  function markDone() {
    if (!active) return;
    setStatus(active.topicId, "done");
    fireToast("Закрыли тему — больше не покажем в повторении");
    setActiveIdx((i) => Math.min(i + 1, due.length));
  }

  return (
    <div className="col" style={{ gap: 20 }}>
      <div>
        <h1 className="serif" style={{ marginBottom: 6 }}>Повторение на сегодня</h1>
        <p className="muted">
          Spaced repetition: каждая тема, отмеченная «Повторить», возвращается по графику 1 → 3 → 7 → 14 дней.
          Помнишь — интервал растёт, забыл — сбрасывается на 1 день.
        </p>
      </div>

      <div className="grid-4">
        <div className="card tight">
          <div className="muted small">К повторению сейчас</div>
          <div style={{ fontWeight: 800, fontSize: 26, marginTop: 2 }}>{due.length}</div>
        </div>
        <div className="card tight">
          <div className="muted small">Запланировано</div>
          <div style={{ fontWeight: 800, fontSize: 26, marginTop: 2 }}>{upcoming.length}</div>
        </div>
        <div className="card tight">
          <div className="muted small">Всего на повторении</div>
          <div style={{ fontWeight: 800, fontSize: 26, marginTop: 2 }}>
            {Object.values(progress).filter((s) => s === "review").length}
          </div>
        </div>
        <div className="card tight">
          <div className="muted small">Среднее интервал</div>
          <div style={{ fontWeight: 800, fontSize: 26, marginTop: 2 }}>
            {Object.values(schedule).length > 0
              ? Math.round(
                  Object.values(schedule).reduce((s, x) => s + x.intervalDays, 0) /
                    Object.values(schedule).length
                )
              : 0}
            <span className="muted" style={{ fontSize: 14, fontWeight: 500 }}> дн</span>
          </div>
        </div>
      </div>

      {due.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🌿</div>
          <h3 style={{ fontSize: 18, marginBottom: 6 }}>Сегодня нечего повторять</h3>
          <p className="muted" style={{ marginBottom: 18 }}>
            Отметь любую пройденную тему как «Повторить» — и она вернётся завтра.
          </p>
          <Link to="/catalog" className="btn btn-primary">
            <I.map size={14} /> К карте обучения
          </Link>
        </div>
      ) : (
        active && (
          <div className="card">
            <div className="row between" style={{ marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
              <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
                <span
                  className="chip"
                  style={{ background: active.groupSoft, color: active.groupColor, borderColor: active.groupColor + "33" }}
                >
                  {active.groupEmoji} {active.groupTitle}
                </span>
                <span className="chip warning">
                  <I.clock size={11} /> просрочено на {active.daysOverdue} дн
                </span>
                <span className="chip">шаг {active.intervalDays} дн</span>
                <span className="chip">{activeIdx + 1} / {due.length}</span>
              </div>
              <Link to={`/topic/${active.topicId}`} className="btn btn-quiet small">
                <I.book size={13} /> Перечитать тему
              </Link>
            </div>

            <h2 className="serif" style={{ fontSize: 26, marginBottom: 8 }}>{active.title}</h2>
            {activeContent && (
              <p className="muted" style={{ marginBottom: 18 }}>
                {findTopic(active.topicId)?.theory.slice(0, 180)}…
              </p>
            )}

            {activeQuiz && activeQuiz.length > 0 ? (
              <Quiz
                key={active.topicId}
                questions={activeQuiz}
                onComplete={(correct) => {
                  handleRecall(correct >= Math.ceil(activeQuiz.length / 2));
                }}
              />
            ) : (
              <div className="col" style={{ gap: 14 }}>
                <div className="card soft tight" style={{ borderColor: "var(--accent-soft)" }}>
                  <div className="small muted" style={{ marginBottom: 6, fontWeight: 700 }}>
                    Самопроверка
                  </div>
                  <div style={{ fontSize: 14 }}>
                    Вспомни, что ты знаешь про <b>«{active.title}»</b>. Открыл — оцени себя честно.
                  </div>
                </div>
                <div className="row" style={{ gap: 10, justifyContent: "flex-end" }}>
                  <button
                    className="btn btn-ghost"
                    onClick={() => handleRecall(false)}
                    disabled={recallChoice !== null}
                    style={{
                      borderColor: "var(--st-skip-border)",
                      color: "var(--st-skip)",
                      background: recallChoice === "miss" ? "var(--st-skip-bg)" : "var(--surface)",
                    }}
                  >
                    <I.close size={14} /> Забыл
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleRecall(true)}
                    disabled={recallChoice !== null}
                    style={{
                      background: recallChoice === "good" ? "var(--st-done)" : undefined,
                    }}
                  >
                    <I.check size={14} /> Помню!
                  </button>
                </div>
                <button className="btn btn-quiet small" onClick={markDone} style={{ alignSelf: "flex-end" }}>
                  Закрыть тему окончательно →
                </button>
              </div>
            )}
          </div>
        )
      )}

      {upcoming.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: 16, marginBottom: 12 }}>Запланированные</h3>
          <div className="col" style={{ gap: 0 }}>
            {upcoming.slice(0, 10).map((t) => {
              const days = dayDiff(new Date(t.nextReviewAt), new Date());
              return (
                <Link
                  to={`/topic/${t.topicId}`}
                  key={t.topicId}
                  className="row"
                  style={{
                    gap: 12,
                    padding: "10px 4px",
                    borderBottom: "1px solid var(--border)",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <span
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 9,
                      background: t.groupSoft,
                      color: t.groupColor,
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    {t.groupEmoji}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{t.title}</div>
                    <div className="small muted">{t.groupTitle}</div>
                  </div>
                  <span className="chip">
                    через {days === 0 ? "сегодня" : `${days} дн`} · шаг {t.intervalDays} дн
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
