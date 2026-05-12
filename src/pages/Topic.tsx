import { Link, useParams, Navigate } from "react-router-dom";
import { useMemo } from "react";
import { findTopic, findBlockOf, allTopics } from "../data/topics";
import StatusButtons from "../components/StatusButtons";
import TheoryRenderer from "../components/TheoryRenderer";
import LiveExample from "../components/LiveExample";
import styles from "./Topic.module.css";

export default function TopicPage() {
  const { id } = useParams<{ id: string }>();
  const topic = id ? findTopic(id) : undefined;
  const block = id ? findBlockOf(id) : undefined;

  const neighbors = useMemo(() => {
    if (!id) return { prev: undefined, next: undefined };
    const idx = allTopics.findIndex((t) => t.id === id);
    return {
      prev: idx > 0 ? allTopics[idx - 1] : undefined,
      next: idx < allTopics.length - 1 ? allTopics[idx + 1] : undefined,
    };
  }, [id]);

  if (!topic) return <Navigate to="/" replace />;

  return (
    <div className={styles.page}>
      <Link to="/" className={styles.back}>← Назад к темам</Link>

      <header className={styles.header}>
        <div className={styles.crumbs}>
          {block && (
            <span>
              {block.emoji} {block.title}
            </span>
          )}
        </div>
        <div className={styles.titleRow}>
          <h1>{topic.title}</h1>
          <StatusButtons topicId={topic.id} size="md" />
        </div>
        <p className={styles.desc}>{topic.description}</p>
      </header>

      <section className={styles.section}>
        <h2>📖 Теория</h2>
        <TheoryRenderer markdown={topic.theory} />
      </section>

      {topic.examples.length > 0 && (
        <section className={styles.section}>
          <h2>🧪 Интерактивные примеры</h2>
          <p className={styles.hint}>
            Редактируй код прямо в браузере — результат обновляется на лету.
          </p>
          <div className={styles.examples}>
            {topic.examples.map((ex, i) => (
              <div key={i} className={styles.example}>
                <div className={styles.exampleHeader}>
                  <h3>{ex.title}</h3>
                  {ex.description && <p>{ex.description}</p>}
                </div>
                <LiveExample code={ex.code} />
              </div>
            ))}
          </div>
        </section>
      )}

      <footer className={styles.footer}>
        {neighbors.prev ? (
          <Link to={`/topic/${neighbors.prev.id}`} className={styles.navLink}>
            ← {neighbors.prev.title}
          </Link>
        ) : <span />}
        {neighbors.next ? (
          <Link to={`/topic/${neighbors.next.id}`} className={styles.navLink}>
            {neighbors.next.title} →
          </Link>
        ) : <span />}
      </footer>
    </div>
  );
}
