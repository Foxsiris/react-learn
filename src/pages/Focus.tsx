import { useFocus } from "../hooks/useFocus";
import { useCatalog } from "../hooks/useTopicsCatalog";
import { useTrackStats } from "../hooks/useTrackStats";
import { I } from "../components/Icons";
import { RankBadge, RankLadder, Ring } from "../components/RankUI";
import { getRank } from "../lib/ranks";
import { useToast } from "../components/ToastContext";

const PHASE_LABEL: Record<"work" | "short" | "long", { label: string; color: string; ring: string; bg: string }> = {
  work:  { label: "Фокус",          color: "var(--accent)",  ring: "var(--accent)",  bg: "var(--accent-tint)" },
  short: { label: "Короткий отдых", color: "var(--success)", ring: "var(--success)", bg: "var(--success-soft)" },
  long:  { label: "Долгий отдых",   color: "var(--info)",    ring: "var(--info)",    bg: "var(--info-soft)" },
};

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  if (isToday) return `сегодня, ${hh}:${mm}`;
  if (isYesterday) return `вчера, ${hh}:${mm}`;
  return d.toLocaleDateString("ru") + `, ${hh}:${mm}`;
}

export default function FocusPage() {
  const focus = useFocus();
  const catalog = useCatalog();
  const tracks = useTrackStats();
  const { fireToast } = useToast();

  const m = Math.floor(focus.remaining / 60);
  const s = focus.remaining % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  const progress = 1 - focus.remaining / focus.totalForPhase;
  const conf = PHASE_LABEL[focus.phase];

  const group = catalog.groups.find((g) => g.id === focus.groupId);
  const groupHours = group ? tracks.byGroup.get(group.id)?.hours ?? 0 : 0;
  const r = group ? getRank(groupHours) : getRank(tracks.totalHours);

  const weekMax = Math.max(...tracks.weekMinutes, 1);
  const todayMins = tracks.todayMinutes;

  return (
    <div className="col" style={{ gap: 20 }}>
      <div>
        <h1 className="serif" style={{ marginBottom: 6 }}>Фокус-сессия</h1>
        <p className="muted">
          Помодоро-таймер: {focus.settings.work_seconds / 60} минут глубокой работы → {focus.settings.short_seconds / 60} минут отдыха.
          Часы автоматически прибавляются к рангу выбранного трека.
        </p>
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: "1.3fr 1fr" }}>
        {/* Timer */}
        <div
          className="card"
          style={{
            padding: 30,
            background: conf.bg,
            borderColor: conf.color + "33",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div className="row" style={{ gap: 8, marginBottom: 20 }}>
            {(["work", "short", "long"] as const).map((p) => (
              <button
                key={p}
                className="btn"
                style={{
                  padding: "8px 16px",
                  borderRadius: 999,
                  fontSize: 13,
                  background: focus.phase === p ? PHASE_LABEL[p].color : "rgba(255,255,255,0.65)",
                  color: focus.phase === p ? "white" : "var(--ink-2)",
                  border: "1px solid " + (focus.phase === p ? "transparent" : "var(--border)"),
                  fontWeight: 600,
                }}
                onClick={() => focus.setPhase(p)}
              >
                {PHASE_LABEL[p].label}
              </button>
            ))}
          </div>

          <Ring progress={progress} color={conf.ring} bg="rgba(255,255,255,0.6)" size={280} stroke={14}>
            <div style={{ textAlign: "center" }}>
              <div className="muted small" style={{ letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700 }}>
                {conf.label}
              </div>
              <div
                className="mono"
                style={{ fontSize: 64, fontWeight: 700, color: "var(--ink)", lineHeight: 1, marginTop: 6 }}
              >
                {mm}
                <span style={{ opacity: 0.4 }}>:</span>
                {ss}
              </div>
              <div className="muted small" style={{ marginTop: 8 }}>
                {focus.phase === "work" ? `Помодоро ${focus.cycles + 1} · ${group?.short ?? "Без трека"}` : "Короткая передышка"}
              </div>
            </div>
          </Ring>

          <div className="row" style={{ gap: 10, marginTop: 24 }}>
            <button className="btn btn-ghost" onClick={focus.reset} title="Сбросить">
              <I.refresh size={14} />
            </button>
            {focus.running ? (
              <button className="btn btn-primary btn-lg" style={{ minWidth: 160 }} onClick={focus.pause}>
                <I.pauseSimple size={14} /> Пауза
              </button>
            ) : (
              <button className="btn btn-primary btn-lg" style={{ minWidth: 160 }} onClick={focus.start}>
                <I.play size={14} /> Старт
              </button>
            )}
            <button
              className="btn btn-ghost"
              onClick={() => {
                focus.skip();
                fireToast("Сессия пропущена");
              }}
              title="Пропустить"
            >
              <I.arrow size={14} />
            </button>
          </div>

          <div className="row" style={{ gap: 6, marginTop: 18 }}>
            {Array.from({ length: focus.settings.cycles_before_long }).map((_, i) => (
              <span
                key={i}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: i < focus.cycles % focus.settings.cycles_before_long ? "var(--accent)" : "rgba(255,255,255,0.7)",
                  border:
                    "1px solid " +
                    (i < focus.cycles % focus.settings.cycles_before_long ? "var(--accent)" : "var(--border)"),
                }}
              />
            ))}
          </div>
          <div className="small muted" style={{ marginTop: 8 }}>
            После {focus.settings.cycles_before_long} помодоро — длинный отдых {focus.settings.long_seconds / 60} мин
          </div>
        </div>

        {/* Right: session config + rank */}
        <div className="col" style={{ gap: 16 }}>
          <div className="card">
            <div className="muted small" style={{ marginBottom: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              На чём фокусируемся
            </div>

            <div className="muted small" style={{ marginBottom: 6 }}>Трек</div>
            <div className="row" style={{ gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              {catalog.groups.map((g) => (
                <button
                  key={g.id}
                  className="btn"
                  onClick={() => focus.setGroupId(g.id)}
                  style={{
                    padding: "8px 12px",
                    background: focus.groupId === g.id ? g.color_soft : "var(--surface)",
                    border: "1px solid " + (focus.groupId === g.id ? g.color : "var(--border)"),
                    color: focus.groupId === g.id ? g.color : "var(--ink-2)",
                    fontWeight: 600,
                  }}
                >
                  {g.emoji} {g.short}
                </button>
              ))}
            </div>

            <div className="muted small" style={{ marginBottom: 6 }}>Тема (опционально)</div>
            <input
              className="input"
              placeholder="Например: «useEffect»"
              value={focus.topicLabel}
              onChange={(e) => focus.setTopicLabel(e.target.value)}
            />

            <div className="sep" />

            <div className="muted small" style={{ marginBottom: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Длительности
            </div>
            <div className="grid-3" style={{ gap: 8 }}>
              {(
                [
                  { key: "work" as const, label: "Фокус", v: focus.settings.work_seconds / 60 },
                  { key: "short" as const, label: "Перерыв", v: focus.settings.short_seconds / 60 },
                  { key: "long" as const, label: "Длинный", v: focus.settings.long_seconds / 60 },
                ] as const
              ).map((d) => (
                <div key={d.key} className="card tight" style={{ padding: "10px 12px" }}>
                  <div className="small muted">{d.label}</div>
                  <div className="row" style={{ gap: 6, alignItems: "baseline", marginTop: 2 }}>
                    <div style={{ fontWeight: 800, fontSize: 22 }}>{d.v}</div>
                    <div className="small muted">мин</div>
                  </div>
                  <div className="row" style={{ gap: 4, marginTop: 6 }}>
                    <button
                      className="btn btn-ghost small"
                      style={{ padding: "2px 8px", flex: 1 }}
                      onClick={() => focus.setDuration(d.key, Math.max(d.key === "work" ? 5 : 1, d.v - 5))}
                    >
                      −
                    </button>
                    <button
                      className="btn btn-ghost small"
                      style={{ padding: "2px 8px", flex: 1 }}
                      onClick={() => focus.setDuration(d.key, d.v + 5)}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="row between" style={{ marginTop: 14 }}>
              <span className="small">Автозапуск перерыва</span>
              <button
                className="btn btn-quiet small"
                onClick={() => focus.setSetting("auto_break", !focus.settings.auto_break)}
                style={{
                  background: focus.settings.auto_break ? "var(--accent-tint)" : "var(--bg-2)",
                  color: focus.settings.auto_break ? "var(--accent-deep)" : "var(--muted)",
                  fontWeight: 700,
                }}
              >
                {focus.settings.auto_break ? "Вкл" : "Выкл"}
              </button>
            </div>
            <div className="row between" style={{ marginTop: 8 }}>
              <span className="small">Звук в конце</span>
              <button
                className="btn btn-quiet small"
                onClick={() => focus.setSetting("sound", !focus.settings.sound)}
                style={{
                  background: focus.settings.sound ? "var(--accent-tint)" : "var(--bg-2)",
                  color: focus.settings.sound ? "var(--accent-deep)" : "var(--muted)",
                  fontWeight: 700,
                }}
              >
                {focus.settings.sound ? "Вкл" : "Выкл"}
              </button>
            </div>
          </div>

          <div className="card">
            <div className="row between" style={{ marginBottom: 12 }}>
              <div className="row" style={{ gap: 10 }}>
                <RankBadge rank={r} size={40} />
                <div>
                  <div className="small muted">Ранг в {group?.title ?? "общем"}</div>
                  <div style={{ fontWeight: 800, fontSize: 17, color: r.color }}>{r.name}</div>
                </div>
              </div>
              <span className="chip">{r.hours.toFixed(1)} ч</span>
            </div>
            <div className="progress" style={{ marginBottom: 8 }}>
              <span style={{ width: `${r.progress * 100}%`, background: r.color }} />
            </div>
            <div className="small muted">
              {r.next ? (
                <>
                  Ещё <b style={{ color: "var(--ink)" }}>{r.toNext.toFixed(1)} ч</b> практики — и ты{" "}
                  <b style={{ color: r.next.color }}>{r.next.name}</b> {r.next.glyph}
                </>
              ) : (
                "Максимальный ранг — продолжай оттачивать мастерство!"
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom strip */}
      <div className="grid-3">
        <div className="card tight">
          <div className="muted small">Сегодня в фокусе</div>
          <div className="row" style={{ alignItems: "baseline", gap: 6, marginTop: 2 }}>
            <div style={{ fontWeight: 800, fontSize: 26 }}>
              {Math.floor(todayMins / 60)}ч {todayMins % 60}м
            </div>
          </div>
          <div className="row" style={{ gap: 4, marginTop: 12, height: 36, alignItems: "flex-end" }}>
            {tracks.weekMinutes.map((mins, i) => {
              const isToday = i === tracks.weekMinutes.length - 1;
              return (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div
                    style={{
                      width: "100%",
                      height: `${(mins / weekMax) * 100}%`,
                      minHeight: mins > 0 ? 4 : 0,
                      background: isToday ? "var(--accent)" : mins > 0 ? "var(--accent-soft)" : "var(--bg-2)",
                      borderRadius: 4,
                    }}
                  />
                </div>
              );
            })}
          </div>
          <div className="row" style={{ gap: 4, marginTop: 4 }}>
            {["П", "В", "С", "Ч", "П", "С", "В"].map((d, i) => (
              <div key={i} style={{ flex: 1, textAlign: "center" }} className="small muted">
                {d}
              </div>
            ))}
          </div>
        </div>

        <div className="card tight">
          <div className="muted small">Помодоро сегодня</div>
          <div style={{ fontWeight: 800, fontSize: 26, marginTop: 2 }}>
            {tracks.sessionsToday}{" "}
            <span className="muted" style={{ fontSize: 14, fontWeight: 500 }}>× {focus.settings.work_seconds / 60} мин</span>
          </div>
          <div className="small muted" style={{ marginTop: 14 }}>Цель дня</div>
          <div className="progress thin" style={{ marginTop: 6 }}>
            <span style={{ width: `${Math.min(100, (tracks.sessionsToday / 6) * 100)}%` }} />
          </div>
          <div className="row between small muted" style={{ marginTop: 6, fontSize: 11.5 }}>
            <span>{tracks.sessionsToday} из 6</span>
            <span>{Math.max(0, 6 - tracks.sessionsToday)} осталось</span>
          </div>
        </div>

        <div className="card tight">
          <div className="muted small">Всего фокус-часов</div>
          <div className="row" style={{ alignItems: "baseline", gap: 6, marginTop: 2 }}>
            <div style={{ fontWeight: 800, fontSize: 26 }}>{tracks.totalHours.toFixed(1)}</div>
            <div className="muted">ч за всё время</div>
          </div>
          <div className="row" style={{ gap: 8, marginTop: 14, alignItems: "center" }}>
            <I.fire size={18} style={{ color: "var(--accent)" }} />
            <div className="small muted">
              {Array.from(tracks.byGroup.values()).reduce((s, t) => s + t.sessions, 0)} сессий выполнено
            </div>
          </div>
        </div>
      </div>

      {/* Sessions list + rank ladder */}
      <div className="grid-2">
        <div className="card">
          <div className="between" style={{ marginBottom: 12 }}>
            <h3 style={{ fontSize: 16 }}>Последние сессии</h3>
            <span className="small muted">{focus.sessions.length} записей</span>
          </div>
          {focus.sessions.length === 0 ? (
            <div className="muted small" style={{ padding: 10 }}>
              Ещё нет сессий — нажми «Старт» и начни первую 🍅
            </div>
          ) : (
            <div className="col" style={{ gap: 0 }}>
              {focus.sessions.slice(0, 8).map((s) => {
                const g = catalog.groups.find((x) => x.id === s.group_id);
                return (
                  <div key={s.id} className="row" style={{ gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                    <span
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 9,
                        background: g?.color_soft ?? "var(--bg-2)",
                        color: g?.color ?? "var(--muted)",
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                        fontSize: 14,
                      }}
                    >
                      {g?.emoji ?? "•"}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>
                        {s.topic_label || g?.title || "Без трека"}
                      </div>
                      <div className="small muted">
                        {formatRelative(s.started_at)} · {s.phase === "work" ? "фокус" : s.phase === "short" ? "перерыв" : "отдых"}
                      </div>
                    </div>
                    <span className="chip">
                      <I.clock size={11} /> {Math.round(s.duration_seconds / 60)} мин
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card">
          <h3 style={{ fontSize: 16, marginBottom: 14 }}>Шкала рангов</h3>
          <RankLadder hours={group ? groupHours : tracks.totalHours} />
        </div>
      </div>
    </div>
  );
}
