import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useProgress } from "../hooks/useProgress";
import { useCatalog } from "../hooks/useTopicsCatalog";
import { computeBlockStats, findCurrentTopic } from "../lib/stats";
import { I } from "../components/Icons";

export default function Catalog() {
  const progress = useProgress();
  const catalog = useCatalog();
  const groups = catalog.groups;
  const blockStats = computeBlockStats(progress, groups);
  const current = findCurrentTopic(progress, catalog.topics);

  const [active, setActive] = useState<string>("");
  const activeId = active || (() => {
    if (current) {
      const g = groups.find((bl) => bl.topics.some((t) => t.id === current.id));
      if (g) return g.id;
    }
    return groups[0]?.id ?? "";
  })();

  const activeBlock = useMemo(
    () => groups.find((b) => b.id === activeId) ?? groups[0],
    [groups, activeId]
  );
  const [search, setSearch] = useState("");

  const filteredTopics = useMemo(() => {
    if (!activeBlock) return [];
    if (!search.trim()) return activeBlock.topics;
    const q = search.toLowerCase();
    return activeBlock.topics.filter(
      (t) => t.title.toLowerCase().includes(q) || (t.description ?? "").toLowerCase().includes(q)
    );
  }, [activeBlock, search]);

  return (
    <div className="col" style={{ gap: 20 }}>
      <div>
        <h1 className="serif" style={{ marginBottom: 6 }}>Карта обучения</h1>
        <p className="muted">Выбери раздел и иди по дорожной карте — от основ до продвинутых тем.</p>
      </div>

      <div className="row between" style={{ flexWrap: "wrap", gap: 10 }}>
        <div className="tabs" style={{ flexWrap: "wrap" }}>
          {groups.map((b) => (
            <button key={b.id} className={activeId === b.id ? "active" : ""} onClick={() => setActive(b.id)}>
              {b.emoji} {b.title}
            </button>
          ))}
        </div>
        <div style={{ position: "relative" }}>
          <I.search size={14} style={{ position: "absolute", left: 12, top: 11, color: "var(--muted)" }} />
          <input
            className="input"
            placeholder="Поиск темы…"
            style={{ paddingLeft: 34, width: 260 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid-3">
        {groups.map((b) => {
          const s = blockStats.find((x) => x.blockId === b.id);
          const isActive = b.id === activeId;
          return (
            <div
              key={b.id}
              className="card"
              style={{
                padding: 22,
                cursor: "pointer",
                borderColor: isActive ? "var(--accent-soft)" : "var(--border)",
                outline: isActive ? "2px solid var(--accent-soft)" : "none",
              }}
              onClick={() => setActive(b.id)}
            >
              <div className="row between" style={{ marginBottom: 14 }}>
                <span
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: "var(--accent-tint)",
                    color: "var(--accent-deep)",
                    display: "grid",
                    placeItems: "center",
                    fontSize: 24,
                  }}
                >
                  {b.emoji}
                </span>
                {isActive && <span className="chip accent">Активный блок</span>}
              </div>
              <h3 style={{ fontSize: 18, marginBottom: 4 }}>{b.title}</h3>
              <p className="muted small" style={{ marginBottom: 14 }}>{b.description}</p>
              <div className="progress" style={{ marginBottom: 8 }}>
                <span style={{ width: `${(s?.progress ?? 0) * 100}%` }} />
              </div>
              <div className="row between small">
                <span className="muted">{s?.done ?? 0} / {s?.total ?? 0} тем</span>
                <span className="muted">~ {Math.max(0, (s?.total ?? 0) - (s?.done ?? 0))} осталось</span>
              </div>
            </div>
          );
        })}
      </div>

      {activeBlock && (
        <div className="card">
          <div className="between" style={{ marginBottom: 14 }}>
            <div className="row">
              <span style={{ color: "var(--accent)", display: "grid", placeItems: "center" }}>
                <I.map size={16} />
              </span>
              <h3 style={{ fontSize: 16 }}>
                Дорожная карта: {activeBlock.emoji} {activeBlock.title}
              </h3>
            </div>
            <span className="chip">
              {filteredTopics.filter((t) => (progress[t.id] ?? "todo") === "done").length} / {filteredTopics.length} тем
            </span>
          </div>

          <div className="road">
            <div className="road-track">
              {filteredTopics.length > 0 && <div className="road-line" />}
              {filteredTopics.map((t, idx) => {
                const status = progress[t.id] ?? "todo";
                const isCurrent = current?.id === t.id;
                let nodeClass: "done" | "current" | "locked" | "" = "";
                if (status === "done") nodeClass = "done";
                else if (isCurrent || status === "review") nodeClass = "current";
                const side = idx % 2 === 0 ? "left" : "right";
                return (
                  <div key={t.id} className={`road-node ${side} ${nodeClass}`}>
                    <Link to={`/topic/${t.id}`} className="road-card">
                      <div className="row between" style={{ marginBottom: 6 }}>
                        <h3 style={{ fontSize: 15.5 }}>{t.title}</h3>
                        {status === "done" && (
                          <span className="chip status-done">
                            <I.done size={12} /> Готово
                          </span>
                        )}
                        {status === "review" && (
                          <span className="chip status-pause">
                            <I.pause size={12} /> Повторить
                          </span>
                        )}
                        {status === "skip" && (
                          <span className="chip status-skip">
                            <I.skip size={12} /> пропущено
                          </span>
                        )}
                        {isCurrent && status === "todo" && (
                          <span className="chip status-current pulse">
                            <I.current size={12} /> сейчас
                          </span>
                        )}
                      </div>
                      <div className="muted small" style={{ marginBottom: 10 }}>{t.description}</div>
                      <div className="row between small">
                        <span className="muted">
                          {t.example_count > 0 ? `${t.example_count} примера` : "теория"}
                        </span>
                        {isCurrent && (
                          <span style={{ color: "var(--accent-deep)", fontWeight: 700 }}>
                            +50 XP
                          </span>
                        )}
                      </div>
                    </Link>
                    <div className="road-blob">
                      {status === "done" ? <I.check size={20} /> : idx + 1}
                    </div>
                  </div>
                );
              })}
              {filteredTopics.length === 0 && (
                <div className="road-empty small">
                  {catalog.loading ? "Загружаем карту…" : `Ничего не найдено по «${search}»`}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
