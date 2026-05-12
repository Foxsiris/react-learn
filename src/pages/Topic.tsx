import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useMemo } from "react";
import { findTopic, type TopicStatus } from "../data/topics";
import { useCatalog, findCatalogGroupOf } from "../hooks/useTopicsCatalog";
import TheoryRenderer from "../components/TheoryRenderer";
import LiveExample from "../components/LiveExample";
import { I, type IconKey } from "../components/Icons";
import { setStatus, useTopicStatus } from "../hooks/useProgress";
import { useToast } from "../components/ToastContext";

const STATUS_ORDER: Array<{ key: TopicStatus; icon: IconKey; label: string; toastMsg: string }> = [
  { key: "done",   icon: "done",  label: "Изучено",      toastMsg: "Молодец! +50 XP" },
  { key: "review", icon: "pause", label: "Повторить",    toastMsg: "Отметили на повторение" },
  { key: "skip",   icon: "skip",  label: "Пока не нужно", toastMsg: "Пропустили" },
  { key: "todo",   icon: "todo",  label: "Не начато",     toastMsg: "Сброшено" },
];

export default function TopicPage() {
  const { id } = useParams<{ id: string }>();
  const catalog = useCatalog();
  const content = id ? findTopic(id) : undefined;
  const meta = id ? catalog.topics.find((t) => t.id === id) : undefined;
  const group = id ? findCatalogGroupOf(catalog, id) : undefined;
  const status = useTopicStatus(id ?? "");
  const navigate = useNavigate();
  const { fireToast } = useToast();

  const neighbors = useMemo(() => {
    if (!id || catalog.topics.length === 0) return { prev: undefined, next: undefined };
    const ordered = catalog.topics;
    const idx = ordered.findIndex((t) => t.id === id);
    return {
      prev: idx > 0 ? ordered[idx - 1] : undefined,
      next: idx >= 0 && idx < ordered.length - 1 ? ordered[idx + 1] : undefined,
    };
  }, [id, catalog.topics]);

  if (!id) return <Navigate to="/catalog" replace />;
  if (catalog.loading && !meta) {
    return <div className="card"><div className="muted small">Загружаем тему…</div></div>;
  }
  if (!meta || !group) return <Navigate to="/catalog" replace />;

  const topicIdx = group.topics.findIndex((t) => t.id === id);

  const markDone = () => {
    setStatus(id, "done");
    fireToast("Молодец! +50 XP");
    if (neighbors.next) {
      setTimeout(() => navigate(`/topic/${neighbors.next!.id}`), 400);
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 20 }}>
      <div className="card tight" style={{ height: "fit-content", position: "sticky", top: 86 }}>
        <Link to="/catalog" className="btn btn-quiet small" style={{ padding: "6px 8px", marginBottom: 8 }}>
          <I.arrowL size={14} /> К карте
        </Link>
        <div className="muted small" style={{ padding: "4px 8px" }}>
          {group.emoji} {group.title}
        </div>
        <h3 style={{ padding: "0 8px 12px", fontSize: 17 }}>Содержание</h3>
        <div className="col" style={{ gap: 2 }}>
          {group.topics.map((t, i) => {
            const isCurrent = t.id === id;
            return (
              <Link
                key={t.id}
                to={`/topic/${t.id}`}
                className="row"
                style={{
                  padding: "8px 10px",
                  borderRadius: 8,
                  gap: 10,
                  background: isCurrent ? "var(--accent-tint)" : "transparent",
                  color: isCurrent ? "var(--accent-deep)" : "var(--ink-2)",
                  fontWeight: isCurrent ? 700 : 500,
                  fontSize: 13.5,
                  textDecoration: "none",
                }}
              >
                <TopicOutlineDot index={i} topicId={t.id} />
                <span style={{ flex: 1 }}>{t.title}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="col" style={{ gap: 16, minWidth: 0 }}>
        <div className="card">
          <div className="row between" style={{ marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
            <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
              <span className="chip accent">Тема {topicIdx + 1} из {group.topics.length}</span>
              <span className="chip"><I.clock size={11} /> ~10 мин</span>
              <span className="chip warning"><I.bolt size={11} /> +50 XP</span>
            </div>
            <div className="row" style={{ gap: 4 }}>
              {STATUS_ORDER.map((s) => {
                const active = status === s.key;
                const Ico = I[s.icon];
                const activeColor =
                  s.key === "done"   ? "var(--success)" :
                  s.key === "review" ? "#8c6a1f" :
                  s.key === "skip"   ? "var(--muted)" :
                                       "var(--accent)";
                return (
                  <button
                    key={s.key}
                    type="button"
                    title={s.label}
                    aria-label={s.label}
                    aria-pressed={active}
                    onClick={() => {
                      setStatus(id, s.key);
                      fireToast(s.toastMsg);
                    }}
                    style={{
                      border: "1px solid " + (active ? activeColor : "var(--border)"),
                      background: active ? "var(--accent-tint)" : "var(--surface)",
                      color: active ? activeColor : "var(--muted)",
                      borderRadius: 8,
                      padding: "6px 8px",
                      display: "grid",
                      placeItems: "center",
                      cursor: "pointer",
                      transition: "all 140ms",
                    }}
                  >
                    <Ico size={16} />
                  </button>
                );
              })}
            </div>
          </div>

          <h1 className="serif" style={{ fontSize: 30, marginBottom: 10 }}>{meta.title}</h1>
          <p style={{ color: "var(--ink-2)", fontSize: 15.5, marginBottom: 16, maxWidth: 720 }}>
            {meta.description}
          </p>

          {content && <TheoryRenderer markdown={content.theory} />}
        </div>

        {content && content.examples.length > 0 && (
          <div className="card">
            <div className="between" style={{ marginBottom: 14 }}>
              <div className="row">
                <span style={{ color: "var(--accent)", display: "grid", placeItems: "center" }}>
                  <I.code size={16} />
                </span>
                <h3 style={{ fontSize: 16 }}>Интерактивные примеры</h3>
              </div>
              <span className="small muted">{content.examples.length} {content.examples.length === 1 ? "пример" : "примера"}</span>
            </div>
            <div className="col" style={{ gap: 18 }}>
              {content.examples.map((ex, i) => (
                <div key={i} style={{ border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface-2)" }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{ex.title}</div>
                    {ex.description && <div className="small muted" style={{ marginTop: 4 }}>{ex.description}</div>}
                  </div>
                  <LiveExample code={ex.code} />
                </div>
              ))}
            </div>
          </div>
        )}

        {content?.links && content.links.length > 0 && (
          <div className="card soft tight" style={{ borderColor: "var(--accent-soft)", background: "var(--accent-tint)" }}>
            <div className="row" style={{ gap: 10, alignItems: "flex-start" }}>
              <span style={{ color: "var(--accent-deep)" }}><I.spark size={18} /></span>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 6, color: "var(--accent-deep)" }}>Полезные ссылки</div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5 }}>
                  {content.links.map((l, i) => (
                    <li key={i}>
                      <a href={l.url} target="_blank" rel="noreferrer" style={{ color: "var(--accent-deep)", fontWeight: 600 }}>
                        {l.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="row between" style={{ marginTop: 4, flexWrap: "wrap", gap: 10 }}>
          {neighbors.prev ? (
            <Link to={`/topic/${neighbors.prev.id}`} className="btn btn-ghost">
              <I.arrowL size={14} /> {neighbors.prev.title}
            </Link>
          ) : (
            <span />
          )}
          <div className="row" style={{ gap: 10 }}>
            <Link to="/playground" className="btn btn-ghost">
              <I.code size={14} /> В песочницу
            </Link>
            {status !== "done" ? (
              <button className="btn btn-primary" onClick={markDone}>
                <I.done size={14} /> Отметить пройденной
              </button>
            ) : neighbors.next ? (
              <Link to={`/topic/${neighbors.next.id}`} className="btn btn-primary">
                Следующая <I.arrow size={14} />
              </Link>
            ) : (
              <Link to="/catalog" className="btn btn-primary">
                <I.trophy size={14} /> Все темы пройдены!
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TopicOutlineDot({ index, topicId }: { index: number; topicId: string }) {
  const status = useTopicStatus(topicId);
  const isDone = status === "done";
  const isReview = status === "review";
  const isSkip = status === "skip";
  const bg = isDone ? "var(--success)" : isReview ? "var(--warning)" : isSkip ? "var(--muted-2)" : "var(--bg-2)";
  const color = isDone || isReview || isSkip ? "white" : "var(--muted)";
  return (
    <span
      style={{
        width: 20,
        height: 20,
        borderRadius: "50%",
        background: bg,
        color,
        display: "grid",
        placeItems: "center",
        fontSize: 11,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {isDone ? <I.check size={12} /> : index + 1}
    </span>
  );
}
