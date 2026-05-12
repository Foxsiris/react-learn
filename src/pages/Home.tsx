import { Link } from "react-router-dom";
import { blocks } from "../data/topics";
import ProgressBar from "../components/ProgressBar";
import StatusButtons from "../components/StatusButtons";
import { useTopicStatus, STATUS_META } from "../hooks/useProgress";
import styles from "./Home.module.css";

function TopicRow({ topicId, title, description }: { topicId: string; title: string; description: string }) {
  const status = useTopicStatus(topicId);
  const meta = STATUS_META[status];
  return (
    <div className={styles.row}>
      <Link to={`/topic/${topicId}`} className={styles.rowLink}>
        <span className={styles.statusBadge} title={meta.label}>{meta.emoji}</span>
        <span className={styles.title}>{title}</span>
        <span className={styles.desc}>{description}</span>
      </Link>
      <StatusButtons topicId={topicId} />
    </div>
  );
}

export default function Home() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>⚛️ React Middle — план изучения</h1>
        <p className={styles.subtitle}>
          Меняй статус кликом по кнопкам справа. Прогресс сохраняется в браузере.
        </p>
      </header>

      <ProgressBar />

      {blocks.map((block) => (
        <section key={block.id} className={styles.block}>
          <div className={styles.blockHeader}>
            <h2>
              <span className={styles.blockEmoji}>{block.emoji}</span>
              {block.title}
            </h2>
            <p className={styles.blockDesc}>{block.description}</p>
          </div>
          <div className={styles.list}>
            {block.topics.map((topic) => (
              <TopicRow
                key={topic.id}
                topicId={topic.id}
                title={topic.title}
                description={topic.description}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
