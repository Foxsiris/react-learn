import { useState } from "react";
import type { QuizQuestion } from "../data/topics";
import { I } from "./Icons";
import { loseHeart, useUserState } from "../hooks/useUserState";
import { useToast } from "./ToastContext";

type Props = {
  questions: QuizQuestion[];
  /** Called after the last question is answered (correct or not). */
  onComplete?: (correctCount: number) => void;
};

export default function Quiz({ questions, onComplete }: Props) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [answered, setAnswered] = useState<boolean[]>([]);
  const [done, setDone] = useState(false);
  const { state } = useUserState();
  const { fireToast } = useToast();

  if (questions.length === 0) return null;
  const q = questions[idx];
  const isLast = idx === questions.length - 1;

  function pick(option: number) {
    if (picked !== null) return;
    setPicked(option);
    const correct = option === q.correct;
    setAnswered((a) => [...a, correct]);
    if (correct) {
      fireToast("Верно! +5 XP");
    } else {
      if (state.hearts > 0) {
        loseHeart();
        fireToast("Неверно — минус жизнь 💔");
      } else {
        fireToast("Неверно — жизней нет, но учимся дальше");
      }
    }
  }

  function next() {
    if (isLast) {
      const correctCount = answered.filter(Boolean).length;
      setDone(true);
      onComplete?.(correctCount);
      return;
    }
    setIdx((i) => i + 1);
    setPicked(null);
  }

  function restart() {
    setIdx(0);
    setPicked(null);
    setAnswered([]);
    setDone(false);
  }

  if (done) {
    const correct = answered.filter(Boolean).length;
    const total = questions.length;
    const perfect = correct === total;
    return (
      <div
        className="card soft tight"
        style={{
          borderColor: perfect ? "var(--st-done-border)" : "var(--accent-soft)",
          background: perfect ? "var(--st-done-bg)" : "var(--accent-tint)",
        }}
      >
        <div className="row" style={{ gap: 10, alignItems: "center" }}>
          <span style={{ color: perfect ? "var(--st-done)" : "var(--accent-deep)" }}>
            {perfect ? <I.trophy size={22} /> : <I.spark size={22} />}
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700 }}>
              {perfect ? "Идеально!" : `Готово: ${correct} / ${total} верно`}
            </div>
            <div className="small muted" style={{ fontSize: 12 }}>
              {perfect
                ? "Все ответы правильные — закрепили материал."
                : "Пройди тему ещё раз и попробуй снова."}
            </div>
          </div>
          <button className="btn btn-ghost small" onClick={restart}>
            <I.refresh size={13} /> Заново
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="col" style={{ gap: 14 }}>
      <div className="row between">
        <div className="row" style={{ gap: 8 }}>
          <span className="chip accent" style={{ fontSize: 11 }}>
            Вопрос {idx + 1} / {questions.length}
          </span>
          <span className="chip" style={{ fontSize: 11 }}>
            <I.heart size={11} /> {state.hearts}/{state.hearts_max}
          </span>
        </div>
        <div className="row" style={{ gap: 4 }}>
          {questions.map((_, i) => {
            const cur = i === idx;
            const ans = answered[i];
            const bg =
              ans === true
                ? "var(--st-done)"
                : ans === false
                  ? "var(--st-skip)"
                  : cur
                    ? "var(--accent)"
                    : "var(--bg-2)";
            return (
              <span
                key={i}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: bg,
                }}
              />
            );
          })}
        </div>
      </div>

      <div style={{ fontSize: 15.5, fontWeight: 600, color: "var(--ink)" }}>{q.question}</div>

      <div className="col" style={{ gap: 10 }}>
        {q.options.map((opt, i) => {
          const isPicked = picked === i;
          const isCorrect = picked !== null && i === q.correct;
          const isWrong = isPicked && i !== q.correct;
          return (
            <button
              key={i}
              className="card tight"
              onClick={() => pick(i)}
              disabled={picked !== null}
              style={{
                textAlign: "left",
                padding: "12px 14px",
                cursor: picked === null ? "pointer" : "default",
                border:
                  "1px solid " +
                  (isCorrect
                    ? "var(--st-done)"
                    : isWrong
                      ? "var(--st-skip)"
                      : isPicked
                        ? "var(--accent)"
                        : "var(--border)"),
                background: isCorrect
                  ? "var(--st-done-bg)"
                  : isWrong
                    ? "var(--st-skip-bg)"
                    : "var(--surface)",
              }}
            >
              <div className="row between">
                <span style={{ fontSize: 14, color: "var(--ink)" }}>{opt}</span>
                {isCorrect && <I.check size={16} style={{ color: "var(--st-done)" }} />}
                {isWrong && <I.close size={16} style={{ color: "var(--st-skip)" }} />}
              </div>
            </button>
          );
        })}
      </div>

      {picked !== null && q.explanation && (
        <div className="card soft tight" style={{ fontSize: 13.5, color: "var(--ink-2)" }}>
          <b style={{ color: "var(--accent-deep)" }}>Пояснение: </b>
          {q.explanation}
        </div>
      )}

      {picked !== null && (
        <div className="row" style={{ justifyContent: "flex-end" }}>
          <button className="btn btn-primary" onClick={next}>
            {isLast ? "Завершить" : "Следующий"} <I.arrow size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
