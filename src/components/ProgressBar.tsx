import { useMemo } from "react";
import { allTopics } from "../data/topics";
import { useProgress, STATUS_META } from "../hooks/useProgress";
import styles from "./ProgressBar.module.css";

export default function ProgressBar() {
  const progress = useProgress();

  const stats = useMemo(() => {
    const total = allTopics.length;
    const counts = { done: 0, review: 0, skip: 0, todo: 0 };
    for (const t of allTopics) {
      const s = progress[t.id] ?? "todo";
      counts[s] += 1;
    }
    return { total, ...counts };
  }, [progress]);

  const pct = stats.total ? Math.round((stats.done / stats.total) * 100) : 0;
  const seg = (n: number) => (n / stats.total) * 100;

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <span className={styles.label}>📈 Общий прогресс</span>
        <span className={styles.count}>
          {stats.done} / {stats.total} изучено
        </span>
      </div>
      <div className={styles.bar}>
        {stats.done > 0 && (
          <div className={styles.segDone} style={{ width: `${seg(stats.done)}%` }} />
        )}
        {stats.review > 0 && (
          <div className={styles.segReview} style={{ width: `${seg(stats.review)}%` }} />
        )}
        {stats.skip > 0 && (
          <div className={styles.segSkip} style={{ width: `${seg(stats.skip)}%` }} />
        )}
      </div>
      <div className={styles.legend}>
        {(["done", "review", "skip", "todo"] as const).map((k) => (
          <span key={k} className={styles.chip}>
            <span
              className={styles.dot}
              style={{ background: STATUS_META[k].color }}
            />
            {STATUS_META[k].emoji} {STATUS_META[k].label} · {stats[k]}
          </span>
        ))}
        <span className={styles.pct}>{pct}%</span>
      </div>
    </div>
  );
}
