import type { TopicStatus } from "../data/topics";
import { STATUS_META, setStatus, useTopicStatus } from "../hooks/useProgress";
import styles from "./StatusButtons.module.css";

const ORDER: TopicStatus[] = ["done", "review", "skip", "todo"];

interface Props {
  topicId: string;
  size?: "sm" | "md";
}

export default function StatusButtons({ topicId, size = "sm" }: Props) {
  const current = useTopicStatus(topicId);

  return (
    <div className={`${styles.group} ${size === "md" ? styles.md : ""}`}>
      {ORDER.map((status) => {
        const meta = STATUS_META[status];
        const active = current === status;
        return (
          <button
            key={status}
            type="button"
            className={`${styles.btn} ${active ? styles.active : ""}`}
            title={meta.label}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setStatus(topicId, status);
            }}
          >
            <span>{meta.emoji}</span>
          </button>
        );
      })}
    </div>
  );
}
