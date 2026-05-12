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
import { I } from "../components/Icons";
import { useToast } from "../components/ToastContext";

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
      padding: 24, maxWidth: 600, margin: "0 auto",
      fontFamily: "system-ui, sans-serif",
    }}>
      <h1 style={{
        background: "linear-gradient(90deg, #e85a2b, #c4421b)",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
      }}>
        🛠 Playground
      </h1>
      <p>Пиши любой React-код и экспериментируй.</p>

      <button
        onClick={() => setCount(c => c + 1)}
        style={{
          background: "#e85a2b", color: "white", border: "none",
          padding: "10px 18px", fontSize: 14, fontWeight: 600,
          borderRadius: 10, cursor: "pointer",
          boxShadow: "0 8px 28px rgba(232,90,43,0.25)",
        }}
      >
        Нажато {count} раз
      </button>

      <p style={{ color: "#6b6760", fontSize: 13, marginTop: 16 }}>
        Хуки доступны без import. Код сохраняется автоматически.
      </p>
    </div>
  );
}

render(<App />);`;

const TEMPLATES: Record<string, { code: string; description: string }> = {
  Минимум: {
    description: "Простейший компонент, чтобы стартануть с нуля.",
    code: `function App() {
  return <h1>Hello!</h1>;
}

render(<App />);`,
  },
  Стартер: {
    description: "Счётчик с useState — базовое состояние.",
    code: DEFAULT_CODE,
  },
  Список: {
    description: "Добавление и рендеринг массива через map.",
    code: `function App() {
  const [items, setItems] = useState(["React", "TypeScript"]);
  const [text, setText] = useState("");

  const add = () => {
    if (!text.trim()) return;
    setItems([...items, text]);
    setText("");
  };

  return (
    <div style={{ padding: 24, fontFamily: "sans-serif" }}>
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
  },
  Эффект: {
    description: "useEffect с таймером — побочные эффекты и cleanup.",
    code: `function App() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ padding: 24, textAlign: "center" }}>
      <h1>{time.toLocaleTimeString()}</h1>
    </div>
  );
}

render(<App />);`,
  },
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

type Tab = "preview" | "templates" | "tips";

export default function Playground() {
  const [code, setCode] = useState<string>(loadCode);
  const [tab, setTab] = useState<Tab>("preview");
  const { fireToast } = useToast();

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, code);
      } catch {
        // ignore
      }
    }, 400);
    return () => clearTimeout(t);
  }, [code]);

  const applyTemplate = (name: string) => {
    if (!window.confirm(`Заменить текущий код на шаблон «${name}»?`)) return;
    setCode(TEMPLATES[name].code);
    fireToast(`Шаблон «${name}» применён`);
    setTab("preview");
  };

  const reset = () => {
    if (!window.confirm("Сбросить код к стартовому?")) return;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setCode(DEFAULT_CODE);
    fireToast("Код сброшен");
  };

  const editorKey = useMemo(() => code.slice(0, 32), [code]);
  const lines = code.split("\n").length;

  return (
    <div className="col" style={{ gap: 18 }}>
      <div className="row between" style={{ flexWrap: "wrap", gap: 12 }}>
        <div>
          <div className="row" style={{ gap: 8, marginBottom: 6 }}>
            <span className="chip success">Песочница</span>
            <span className="chip"><I.code size={11} /> React + JSX</span>
            <span className="chip warning"><I.bolt size={11} /> Live preview</span>
          </div>
          <h1 className="serif" style={{ fontSize: 26 }}>Эксперименты с кодом</h1>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn btn-ghost" onClick={reset}>
            <I.refresh size={14} /> Сбросить
          </button>
        </div>
      </div>

      <LiveProvider key={editorKey} code={code} scope={SCOPE} noInline theme={themes.vsDark}>
        <div className="sandbox-split">
          <div className="pane">
            <div className="pane-head">
              <div className="row" style={{ gap: 10 }}>
                <span className="chip" style={{ background: "var(--surface)" }}>
                  <I.code size={12} /> playground.jsx
                </span>
              </div>
              <span className="small muted">JSX · Авто-сохранение</span>
            </div>
            <div style={{ background: "#1e1d1a", flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ flex: 1, overflow: "auto" }}>
                <LiveEditor
                  onChange={(v) => setCode(v)}
                  style={{
                    background: "transparent",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 13.5,
                    minHeight: 420,
                    color: "#e4dccd",
                  }}
                />
              </div>
              <div
                style={{
                  padding: "8px 14px",
                  borderTop: "1px solid #2d2b27",
                  color: "#857d6f",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>Ln {lines}</span>
                <span>UTF-8 · LF</span>
              </div>
            </div>
          </div>

          <div className="pane">
            <div className="pane-head">
              <div className="tabs">
                <button className={tab === "preview" ? "active" : ""} onClick={() => setTab("preview")}>
                  <I.eye size={13} style={{ marginRight: 6 }} />
                  Preview
                </button>
                <button className={tab === "templates" ? "active" : ""} onClick={() => setTab("templates")}>
                  <I.list size={13} style={{ marginRight: 6 }} />
                  Шаблоны
                </button>
                <button className={tab === "tips" ? "active" : ""} onClick={() => setTab("tips")}>
                  <I.spark size={13} style={{ marginRight: 6 }} />
                  Подсказки
                </button>
              </div>
            </div>

            <div className="pane-body">
              {tab === "preview" && (
                <div>
                  <div
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      padding: 16,
                      minHeight: 360,
                    }}
                  >
                    <LivePreview />
                  </div>
                  <LiveError
                    style={{
                      marginTop: 12,
                      background: "var(--danger-soft)",
                      color: "var(--danger)",
                      padding: "10px 14px",
                      borderRadius: 10,
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 12.5,
                      whiteSpace: "pre-wrap",
                    }}
                  />
                </div>
              )}

              {tab === "templates" && (
                <div className="col" style={{ gap: 10 }}>
                  <div className="small muted" style={{ marginBottom: 4 }}>
                    Готовые отправные точки — клик заменит текущий код.
                  </div>
                  {Object.entries(TEMPLATES).map(([name, t]) => (
                    <button
                      key={name}
                      className="card tight"
                      style={{ textAlign: "left", padding: "14px 16px", cursor: "pointer", border: "1px solid var(--border)", background: "var(--surface)" }}
                      onClick={() => applyTemplate(name)}
                    >
                      <div className="row between" style={{ marginBottom: 4 }}>
                        <div style={{ fontWeight: 700 }}>{name}</div>
                        <I.arrow size={14} style={{ color: "var(--accent)" }} />
                      </div>
                      <div className="small muted">{t.description}</div>
                    </button>
                  ))}
                </div>
              )}

              {tab === "tips" && (
                <div className="col" style={{ gap: 10 }}>
                  <div className="card soft tight" style={{ borderColor: "var(--accent-soft)", background: "var(--accent-tint)" }}>
                    <div style={{ fontWeight: 700, marginBottom: 6, color: "var(--accent-deep)" }}>Главное</div>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: "var(--ink-2)" }}>
                      <li>В конце файла обязательно <code>render(&lt;App /&gt;)</code></li>
                      <li>Хуки (<code>useState</code>, <code>useEffect</code> и т.д.) уже в scope — без import</li>
                      <li>Код сохраняется автоматически в браузере</li>
                    </ul>
                  </div>
                  <div className="card tight">
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>Доступные хуки</div>
                    <code style={{ fontSize: 12.5, color: "var(--muted)" }}>
                      useState, useEffect, useMemo, useRef, useReducer,<br />
                      useCallback, useContext, useLayoutEffect, useId,<br />
                      useTransition, useDeferredValue, createContext,<br />
                      memo, forwardRef, Fragment, lazy, Suspense
                    </code>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </LiveProvider>
    </div>
  );
}
