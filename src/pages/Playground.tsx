import { useEffect, useMemo, useState } from "react";
import {
  useState as r_useState,
  useEffect as r_useEffect,
  useMemo as r_useMemo,
  useRef as r_useRef,
  useReducer as r_useReducer,
  useCallback as r_useCallback,
  useContext as r_useContext,
  useLayoutEffect as r_useLayoutEffect,
  useId as r_useId,
  useTransition as r_useTransition,
  useDeferredValue as r_useDeferredValue,
  createContext as r_createContext,
  memo as r_memo,
  forwardRef as r_forwardRef,
  Fragment as r_Fragment,
  lazy as r_lazy,
  Suspense as r_Suspense,
} from "react";
import { LiveProvider, LiveEditor, LiveError, LivePreview } from "react-live";
import { themes } from "prism-react-renderer";
import styles from "./Playground.module.css";

const STORAGE_KEY = "react-learn:playground-v2";

const SCOPE = {
  useState: r_useState,
  useEffect: r_useEffect,
  useMemo: r_useMemo,
  useRef: r_useRef,
  useReducer: r_useReducer,
  useCallback: r_useCallback,
  useContext: r_useContext,
  useLayoutEffect: r_useLayoutEffect,
  useId: r_useId,
  useTransition: r_useTransition,
  useDeferredValue: r_useDeferredValue,
  createContext: r_createContext,
  memo: r_memo,
  forwardRef: r_forwardRef,
  Fragment: r_Fragment,
  lazy: r_lazy,
  Suspense: r_Suspense,
};

const DEFAULT_CODE = `function App() {
  const [count, setCount] = useState(0);

  return (
    <div style={{
      padding: 24,
      maxWidth: 600,
      margin: "0 auto",
      fontFamily: "-apple-system, system-ui, sans-serif",
      color: "#e6edf3",
    }}>
      <h1 style={{
        background: "linear-gradient(90deg, #58a6ff, #bc8cff)",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
      }}>
        🛠 Playground
      </h1>
      <p>Это твоя песочница. Пиши любой React-код и экспериментируй.</p>

      <div style={{
        background: "#161b22",
        border: "1px solid #30363d",
        borderRadius: 12,
        padding: 24,
        margin: "20px 0",
      }}>
        <button
          onClick={() => setCount(c => c + 1)}
          style={{
            background: "#238636",
            color: "white",
            border: "none",
            padding: "10px 18px",
            fontSize: 14,
            fontWeight: 600,
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          Нажато {count} раз
        </button>
      </div>

      <p style={{ color: "#8b949e", fontSize: 13 }}>
        Всё сохраняется в браузере. Хуки доступны без import.
      </p>
    </div>
  );
}

render(<App />);`;

const TEMPLATES: Record<string, string> = {
  Минимум: `function App() {
  return <h1>Hello!</h1>;
}

render(<App />);`,
  Стартер: DEFAULT_CODE,
  Список: `function App() {
  const [items, setItems] = useState(["React", "TypeScript"]);
  const [text, setText] = useState("");

  const add = () => {
    if (!text.trim()) return;
    setItems([...items, text]);
    setText("");
  };

  return (
    <div style={{ padding: 24, fontFamily: "sans-serif", color: "#e6edf3" }}>
      <input
        value={text}
        onChange={e => setText(e.target.value)}
        style={{ padding: 6, marginRight: 6 }}
      />
      <button onClick={add}>+</button>
      <ul>{items.map((x, i) => <li key={i}>{x}</li>)}</ul>
    </div>
  );
}

render(<App />);`,
  Эффект: `function App() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ padding: 24, textAlign: "center", color: "#e6edf3" }}>
      <h1>{time.toLocaleTimeString()}</h1>
    </div>
  );
}

render(<App />);`,
};

function loadCode(): string {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && raw.trim().length > 0) return raw;
  } catch {
    // ignore
  }
  return DEFAULT_CODE;
}

export default function Playground() {
  const [code, setCode] = useState<string>(loadCode);

  // Дебаунсим запись в localStorage
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, code);
      } catch {
        // localStorage full / disabled
      }
    }, 400);
    return () => clearTimeout(t);
  }, [code]);

  const applyTemplate = (name: string) => {
    if (!confirm(`Заменить текущий код на шаблон "${name}"?`)) return;
    setCode(TEMPLATES[name]);
  };

  const resetAll = () => {
    if (!confirm("Удалить всё и вернуть стартовый шаблон?")) return;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setCode(DEFAULT_CODE);
  };

  // key, чтобы при смене шаблона LiveEditor пересоздался с новым value
  const editorKey = useMemo(() => code.slice(0, 32), [code]);

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <div className={styles.left}>
          <h1>🛠️ Песочница</h1>
          <span className={styles.subtitle}>
            Живой React-редактор без iframe. Хуки в scope, render(&lt;App /&gt;) в конце.
          </span>
        </div>
        <div className={styles.right}>
          <span className={styles.templLabel}>Шаблон:</span>
          {Object.keys(TEMPLATES).map((name) => (
            <button
              key={name}
              className={styles.tplBtn}
              onClick={() => applyTemplate(name)}
            >
              {name}
            </button>
          ))}
          <button className={styles.resetBtn} onClick={resetAll}>
            🗑 Сброс
          </button>
        </div>
      </div>

      <div className={styles.editor}>
        <LiveProvider key={editorKey} code={code} scope={SCOPE} noInline theme={themes.vsDark}>
          <div className={styles.editorPane}>
            <LiveEditor
              onChange={(v) => setCode(v)}
              className={styles.codeArea}
            />
          </div>
          <div className={styles.previewPane}>
            <LivePreview />
            <LiveError className={styles.error} />
          </div>
        </LiveProvider>
      </div>
    </div>
  );
}
