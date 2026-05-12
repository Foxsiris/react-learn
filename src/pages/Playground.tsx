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
  const mountedOnceRef = useRef(false);

  useEffect(() => {
    const host = containerRef.current;
    if (!host || mountedOnceRef.current) return;
    mountedOnceRef.current = true;

    let cancelled = false;
    sdk
      .embedProject(host, PROJECT, {
        height: "100%",
        width: "100%",
        view: "default",
        openFile: "src/App.tsx",
        theme: "dark",
        terminalHeight: 30,
        hideExplorer: false,
        hideNavigation: false,
        showSidebar: true,
      })
      .then(() => {
        if (cancelled) return;
        const iframe = host.querySelector("iframe");
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
    };
  }, []);

  const openInTab = () => {
    sdk.openProject(PROJECT, { newWindow: true, openFile: "src/App.tsx" });
  };

  return (
    <div className="col" style={{ gap: 18 }}>
      <div className="row between" style={{ flexWrap: "wrap", gap: 12 }}>
        <div>
          <div className="row" style={{ gap: 8, marginBottom: 6 }}>
            <span className="chip success">Песочница</span>
            <span className="chip info"><I.code size={11} /> React + TS + Vite</span>
            <span className="chip warning"><I.bolt size={11} /> WebContainers</span>
          </div>
          <h1 className="serif" style={{ fontSize: 26 }}>Полноценная среда</h1>
          <div className="small muted" style={{ maxWidth: 620, marginTop: 4 }}>
            VS Code-подобный редактор прямо в браузере: автодополнение, подсветка,
            форматирование, реальный <code>npm install</code> и dev-сервер.
          </div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn btn-ghost" onClick={openInTab}>
            <I.arrow size={14} /> Открыть в новой вкладке
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        style={{
          height: "calc(100vh - 200px)",
          minHeight: 540,
          border: "1px solid var(--border)",
          borderRadius: 16,
          overflow: "hidden",
          background: "#1e1d1a",
        }}
      />

      <div className="row between" style={{ flexWrap: "wrap", gap: 8 }}>
        <div className="small muted">
          Первый запуск может занять 10–20 секунд — StackBlitz поднимает Node-окружение в браузере.
        </div>
        <a
          href="https://stackblitz.com"
          target="_blank"
          rel="noreferrer"
          className="small muted"
          style={{ textDecoration: "underline" }}
        >
          Powered by StackBlitz
        </a>
      </div>
    </div>
  );
}
