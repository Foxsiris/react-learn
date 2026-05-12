import { useState, useMemo } from "react";
import { useProgress } from "../hooks/useProgress";
import { computeAchievements } from "../lib/stats";
import { I } from "../components/Icons";
import { useToast } from "../components/ToastContext";

type Filter = "all" | "earned" | "locked";

export default function Achievements() {
  const progress = useProgress();
  const achievements = useMemo(() => computeAchievements(progress), [progress]);
  const [filter, setFilter] = useState<Filter>("all");
  const { fireToast } = useToast();

  const filtered = useMemo(
    () =>
      achievements.filter((a) =>
        filter === "all" ? true : filter === "earned" ? a.earned : !a.earned
      ),
    [achievements, filter]
  );

  const featured = achievements.find((a) => a.earned && a.ribbon === "NEW") ?? achievements.find((a) => a.earned);

  return (
    <div className="col" style={{ gap: 20 }}>
      <div className="row between" style={{ flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="serif" style={{ marginBottom: 6 }}>Достижения</h1>
          <p className="muted">
            Получено {achievements.filter((a) => a.earned).length} из {achievements.length}. Так держать!
          </p>
        </div>
        <div className="tabs">
          <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>
            Все
          </button>
          <button className={filter === "earned" ? "active" : ""} onClick={() => setFilter("earned")}>
            Получено
          </button>
          <button className={filter === "locked" ? "active" : ""} onClick={() => setFilter("locked")}>
            В процессе
          </button>
        </div>
      </div>

      {featured && (
        <div
          className="card"
          style={{ background: "linear-gradient(135deg, var(--accent-tint), #fff8f1)", borderColor: "var(--accent-soft)" }}
        >
          <div className="row between" style={{ flexWrap: "wrap", gap: 16 }}>
            <div className="row" style={{ gap: 18 }}>
              <div className="badge" style={{ width: 80, aspectRatio: "1", padding: 0, background: "var(--accent)" }}>
                <div style={{ fontSize: 32 }}>{featured.glyph}</div>
              </div>
              <div>
                <div className="chip accent" style={{ marginBottom: 8 }}>
                  {featured.ribbon === "NEW" ? "Свежее" : "Гордость коллекции"}
                </div>
                <h3 style={{ fontSize: 20 }}>{featured.title}</h3>
                <div className="muted" style={{ fontSize: 14 }}>{featured.sub}</div>
              </div>
            </div>
            <div className="row" style={{ gap: 8 }}>
              <button
                className="btn btn-primary"
                onClick={() => fireToast("Молодец! Продолжай в том же духе")}
              >
                Спасибо!
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid-4">
        {filtered.map((a) => (
          <div
            key={a.id}
            className={"badge" + (a.earned ? "" : " locked")}
            onClick={() =>
              fireToast(
                a.earned
                  ? `«${a.title}» получено!`
                  : a.target
                    ? `${a.progress ?? 0} / ${a.target} — почти у цели!`
                    : "Продолжай — это будет твоим"
              )
            }
          >
            {a.ribbon && <span className="ribbon">{a.ribbon}</span>}
            <div className="glyph" style={{ fontSize: 28 }}>{a.glyph}</div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{a.title}</div>
            <div className="small muted" style={{ fontSize: 11.5, minHeight: 28 }}>{a.sub}</div>
            {a.earned ? (
              <div className="chip success" style={{ fontSize: 10.5 }}>
                <I.check size={10} /> получено
              </div>
            ) : a.target != null && a.progress != null ? (
              <div style={{ width: "100%" }}>
                <div className="progress thin">
                  <span style={{ width: `${Math.min(100, (a.progress / a.target) * 100)}%` }} />
                </div>
                <div className="small muted" style={{ marginTop: 4, fontSize: 11 }}>
                  {a.progress} / {a.target}
                </div>
              </div>
            ) : (
              <div className="chip" style={{ fontSize: 10.5 }}>
                <I.lock size={10} /> закрыто
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
