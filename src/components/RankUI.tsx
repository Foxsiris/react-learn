import { RANKS, getRank, type Rank } from "../lib/ranks";
import { I } from "./Icons";

export function RankBadge({ rank, size = 44 }: { rank: Rank; size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.32,
        background: rank.tint,
        color: rank.color,
        display: "grid",
        placeItems: "center",
        fontSize: size * 0.46,
        flexShrink: 0,
        border: `1px solid ${rank.color}22`,
      }}
    >
      {rank.glyph}
    </div>
  );
}

export function RankRow({
  title,
  icon,
  iconBg,
  iconColor,
  hours,
}: {
  title: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  hours: number;
}) {
  const r = getRank(hours);
  return (
    <div className="row" style={{ gap: 14, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
      <span
        style={{
          width: 40,
          height: 40,
          borderRadius: 11,
          background: iconBg,
          color: iconColor,
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
          fontSize: 20,
        }}
      >
        {icon}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="row between" style={{ marginBottom: 4 }}>
          <div style={{ fontWeight: 700 }}>{title}</div>
          <span className="row" style={{ gap: 6 }}>
            <span style={{ fontSize: 16 }}>{r.glyph}</span>
            <span style={{ fontWeight: 700, color: r.color }}>{r.name}</span>
          </span>
        </div>
        <div className="progress thin" style={{ marginTop: 4 }}>
          <span style={{ width: `${r.progress * 100}%`, background: r.color }} />
        </div>
        <div className="row between small muted" style={{ marginTop: 6, fontSize: 11.5 }}>
          <span>{r.hours.toFixed(1)} ч практики</span>
          {r.next ? (
            <span>
              До «{r.next.name}» {r.toNext.toFixed(1)} ч
            </span>
          ) : (
            <span>Макс. ранг — гуру!</span>
          )}
        </div>
      </div>
    </div>
  );
}

export function RankLadder({ hours }: { hours: number }) {
  const cur = getRank(hours);
  return (
    <div className="col" style={{ gap: 6 }}>
      {RANKS.map((r) => {
        const isCurrent = r.id === cur.id;
        const reached = hours >= r.min;
        return (
          <div
            key={r.id}
            className="row"
            style={{
              gap: 12,
              padding: "10px 12px",
              borderRadius: 10,
              background: isCurrent ? "var(--accent-tint)" : reached ? "var(--surface-2)" : "transparent",
              border: "1px solid " + (isCurrent ? "var(--accent-soft)" : "transparent"),
              opacity: reached ? 1 : 0.6,
            }}
          >
            <RankBadge rank={r} size={36} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="row between">
                <div
                  style={{
                    fontWeight: isCurrent ? 700 : 600,
                    color: isCurrent ? "var(--accent-deep)" : "var(--ink)",
                  }}
                >
                  {r.name}
                  {isCurrent && (
                    <span className="chip accent" style={{ marginLeft: 8, fontSize: 10.5 }}>
                      сейчас
                    </span>
                  )}
                </div>
                <span className="small muted">{r.max === Infinity ? `${r.min}+ ч` : `${r.min}–${r.max} ч`}</span>
              </div>
            </div>
            {reached && !isCurrent && <I.check size={14} style={{ color: "var(--success)" }} />}
          </div>
        );
      })}
    </div>
  );
}

export function HeartsBar({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <span className="hearts-bar" title={`${value} из ${max}`}>
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className={i < value ? "full" : "empty"}>
          {i < value ? <I.heart size={14} /> : <I.heartO size={14} />}
        </span>
      ))}
    </span>
  );
}

export function Ring({
  progress,
  color,
  bg,
  size = 260,
  stroke = 14,
  children,
}: {
  progress: number;
  color: string;
  bg: string;
  size?: number;
  stroke?: number;
  children: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke={bg} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - progress)}
          style={{ transition: "stroke-dashoffset 600ms cubic-bezier(.2,.7,.2,1)" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>{children}</div>
    </div>
  );
}
