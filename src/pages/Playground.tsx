import { useEffect, useRef } from "react";
import sdk, { type Project } from "@stackblitz/sdk";
import { I } from "../components/Icons";

const APP_TSX = `import { useState } from "react";

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div
      style={{
        padding: 24,
        maxWidth: 600,
        margin: "0 auto",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <h1
        style={{
          background: "linear-gradient(90deg, #e85a2b, #c4421b)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        }}
      >
        🛠 React Playground
      </h1>
      <p>Пиши любой React-код. У тебя полноценная среда с автодополнением.</p>

      <button
        onClick={() => setCount((c) => c + 1)}
        style={{
          background: "#e85a2b",
          color: "white",
          border: "none",
          padding: "10px 18px",
          fontSize: 14,
          fontWeight: 600,
          borderRadius: 10,
          cursor: "pointer",
          boxShadow: "0 8px 28px rgba(232,90,43,0.25)",
        }}
      >
        Нажато {count} раз
      </button>
    </div>
  );
}
`;

const MAIN_TSX = `import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
`;

const INDEX_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React Playground</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;

const PACKAGE_JSON = `{
  "name": "react-playground",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "typescript": "^5.5.3",
    "vite": "^5.4.0"
  }
}
`;

const VITE_CONFIG = `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});
`;

const TSCONFIG = `{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["DOM", "DOM.Iterable", "ES2020"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  },
  "include": ["src"]
}
`;

const PROJECT: Project = {
  title: "React Playground",
  description: "Полноценная React + TS + Vite песочница с автодополнением.",
  template: "node",
  files: {
    "package.json": PACKAGE_JSON,
    "vite.config.ts": VITE_CONFIG,
    "tsconfig.json": TSCONFIG,
    "index.html": INDEX_HTML,
    "src/main.tsx": MAIN_TSX,
    "src/App.tsx": APP_TSX,
  },
};

export default function Playground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const content = document.querySelector("main.content");
    content?.classList.add("playground-fullscreen");
    return () => {
      content?.classList.remove("playground-fullscreen");
    };
  }, []);

  useEffect(() => {
    const wrapper = containerRef.current;
    if (!wrapper) return;

    // The SDK replaces the host element with an iframe. If we pass the
    // React-owned ref'd div directly, StrictMode's double-invoke + reconciliation
    // can orphan the iframe. Use an inner DOM-only div and clean it up ourselves.
    const inner = document.createElement("div");
    inner.style.width = "100%";
    inner.style.height = "100%";
    wrapper.appendChild(inner);

    let cancelled = false;
    sdk
      .embedProject(inner, PROJECT, {
        height: "100%",
        width: "100%",
        view: "default",
        openFile: "src/App.tsx",
        theme: "dark",
        terminalHeight: 30,
        showSidebar: true,
      })
      .then(() => {
        if (cancelled) return;
        const iframe = wrapper.querySelector("iframe");
        if (iframe) {
          iframe.style.width = "100%";
          iframe.style.height = "100%";
          iframe.style.border = "0";
          iframe.style.display = "block";
        }
      })
      .catch(() => {
        // ignore — user will see a load failure in the iframe itself.
      });

    return () => {
      cancelled = true;
      while (wrapper.firstChild) wrapper.removeChild(wrapper.firstChild);
    };
  }, []);

  const openInTab = () => {
    sdk.openProject(PROJECT, { newWindow: true, openFile: "src/App.tsx" });
  };

  return (
    <div className="playground-shell">
      <div className="row between" style={{ flexWrap: "wrap", gap: 12 }}>
        <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
          <span className="chip success">Песочница</span>
          <span className="chip info"><I.code size={11} /> React + TS + Vite</span>
          <span className="chip warning"><I.bolt size={11} /> WebContainers</span>
          <span className="small muted" style={{ marginLeft: 4 }}>
            Полная среда с автодополнением. Первый запуск ~10–20с.
          </span>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <a
            href="https://stackblitz.com"
            target="_blank"
            rel="noreferrer"
            className="small muted"
            style={{ textDecoration: "underline" }}
          >
            Powered by StackBlitz
          </a>
          <button className="btn btn-ghost" onClick={openInTab}>
            <I.arrow size={14} /> В новой вкладке
          </button>
        </div>
      </div>

      <div ref={containerRef} className="playground-embed" />
    </div>
  );
}
