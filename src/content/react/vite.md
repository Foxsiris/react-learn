## 📝 Теория

### Что такое Vite

**Vite** (французское "fast" / vit) — современный build tool, заменивший Webpack/CRA. Создан Эваном Ю (создатель Vue.js). Сегодня — стандарт для новых React-проектов.

**Архитектура (двойная):**

- **Dev:** нативный ESM в браузере + esbuild для transformation. Без бандлинга → старт <300ms.
- **Production:** Rollup для оптимального бандла.

**Главные преимущества:**

- ⚡ Старт dev сервера за <300ms (vs Webpack 30+ сек).
- 🔥 HMR <50ms (мгновенный).
- 📦 Нативный TypeScript, JSX, CSS modules.
- 🛠️ Простой config.
- 🌐 Огромная экосистема плагинов.

---

### Vite vs Webpack vs CRA

| | Webpack/CRA | Vite |
|---|---|---|
| Dev start | 30+ сек (большие проекты) | <1 сек |
| HMR | 1-3 сек | <100ms |
| Bundling в dev | Да (медленно) | Нет (ESM) |
| TypeScript | через ts-loader/babel | Нативный (esbuild) |
| Config | webpack.config.js (сложный) | vite.config.ts (простой) |
| Production bundle | Webpack | Rollup |
| Plugin ecosystem | Огромная | Большая, растёт |

---

### Базовый setup

```bash
npm create vite@latest my-app -- --template react-ts
cd my-app
npm install
npm run dev
```

```
my-app/
├── index.html         ← entry point (не в public!)
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   └── ...
├── public/            ← static assets (не процессятся Vite)
├── vite.config.ts
└── tsconfig.json
```

---

### Базовый vite.config.ts

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    open: true,           // открыть браузер
    host: true,            // доступно по сети
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom"],
          router: ["react-router-dom"],
          ui: ["@mui/material", "@emotion/react"],
        },
      },
    },
  },
});
```

---

### React plugins

```ts
// @vitejs/plugin-react — стандартный
import react from "@vitejs/plugin-react";
plugins: [react()];

// @vitejs/plugin-react-swc — быстрее (использует SWC)
import react from "@vitejs/plugin-react-swc";
plugins: [react()];
```

`plugin-react-swc` — в 20x быстрее на больших проектах, но без некоторых функций plugin-react (например, Babel plugins).

---

### Path aliases

```ts
// vite.config.ts
resolve: {
  alias: {
    "@": path.resolve(__dirname, "./src"),
    "@components": path.resolve(__dirname, "./src/components"),
    "@features": path.resolve(__dirname, "./src/features"),
  },
}
```

```json
// tsconfig.json — обязательно синхронизируй
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"]
    }
  }
}
```

```ts
// в коде
import { Button } from "@components/Button";
import { useAuth } from "@/features/auth";
```

Альтернатива — `vite-tsconfig-paths` плагин (читает paths из tsconfig автоматически).

---

### Environment variables

```bash
# .env
VITE_API_URL=https://api.example.com
VITE_GOOGLE_KEY=xyz123

# .env.development
VITE_API_URL=http://localhost:8080

# .env.production
VITE_API_URL=https://api.prod.example.com

# .env.local (gitignored)
VITE_SECRET=local-secret
```

```ts
// В коде — только VITE_* доступны
const apiUrl = import.meta.env.VITE_API_URL;
const isDev = import.meta.env.DEV;       // boolean
const mode = import.meta.env.MODE;        // "development" | "production"
const isProd = import.meta.env.PROD;
```

```ts
// envPrefix для другого префикса
defineConfig({
  envPrefix: "REACT_APP_",  // совместимость с CRA
});
```

⚠️ Всё, что начинается с VITE_, попадает в client-side bundle. **Не клади секреты!**

---

### Proxy для API в dev

```ts
server: {
  proxy: {
    "/api": {
      target: "http://localhost:8080",
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, ""),
      secure: false,         // для self-signed certs
      ws: true,               // WebSocket
    },
    // Несколько проксей
    "/auth": {
      target: "http://auth.local:9000",
    },
  },
}
```

`changeOrigin: true` — меняет Host header на target. Часто нужно для cross-origin.

---

### Build optimization

```ts
build: {
  outDir: "dist",
  assetsDir: "assets",
  sourcemap: true,                 // или "hidden" для production
  minify: "esbuild",               // или "terser" (медленнее, но меньше)
  target: "es2020",
  cssCodeSplit: true,              // отдельные CSS чанки
  
  rollupOptions: {
    output: {
      // Manual chunks
      manualChunks: {
        "react-vendor": ["react", "react-dom"],
        "router": ["react-router-dom"],
      },
      // Или функция
      manualChunks(id) {
        if (id.includes("node_modules")) {
          if (id.includes("react")) return "react";
          return "vendor";
        }
      },
    },
  },
  
  // Disable inline assets >4KB
  assetsInlineLimit: 4096,
  
  // Chunk size warning
  chunkSizeWarningLimit: 500,
}
```

---

### CSS / preprocessors

```ts
css: {
  modules: {
    localsConvention: "camelCase",
    generateScopedName: "[name]__[local]__[hash:base64:5]",
  },
  preprocessorOptions: {
    scss: {
      additionalData: `@import "@/styles/variables.scss";`,
    },
  },
  postcss: { ... },
}
```

```bash
# Установка препроцессоров — Vite автоматически использует
npm i -D sass
npm i -D less
npm i -D stylus
```

---

### CSS Modules

```css
/* Button.module.css */
.button { ... }
.primary { background: blue; }
```

```tsx
import styles from "./Button.module.css";
<button className={`${styles.button} ${styles.primary}`}>...</button>
```

Vite автоматически обрабатывает `.module.css/scss/less`.

---

### Tailwind CSS

```bash
npm i -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

```js
// tailwind.config.js
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: { extend: {} },
};
```

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

```tsx
import "./index.css";
<button className="px-4 py-2 bg-blue-500 text-white rounded">Click</button>
```

---

### Static assets

```
public/         ← копируется как есть, ссылки через /
src/assets/     ← обрабатывается Vite, импортируется как модуль
```

```tsx
// public/logo.png → URL /logo.png
<img src="/logo.png" />

// src/assets/avatar.png → импортируется
import avatar from "@/assets/avatar.png";
<img src={avatar} />

// SVG как React компонент (через vite-plugin-svgr)
import { ReactComponent as Logo } from "./logo.svg";
<Logo width={100} />
```

---

### vite-plugin-svgr

```bash
npm i -D vite-plugin-svgr
```

```ts
import svgr from "vite-plugin-svgr";
plugins: [svgr()];
```

```tsx
import Icon from "./icon.svg?react";
<Icon className="w-4 h-4 fill-current" />
```

---

### PWA

```bash
npm i -D vite-plugin-pwa
```

```ts
import { VitePWA } from "vite-plugin-pwa";

plugins: [
  VitePWA({
    registerType: "autoUpdate",
    workbox: {
      globPatterns: ["**/*.{js,css,html,svg,png}"],
    },
    manifest: {
      name: "My App",
      short_name: "App",
      theme_color: "#ffffff",
      icons: [
        { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      ],
    },
  }),
];
```

Service Worker автоматически генерируется. Offline режим — из коробки.

---

### Анализ бандла

```bash
npm i -D rollup-plugin-visualizer
```

```ts
import { visualizer } from "rollup-plugin-visualizer";

plugins: [
  visualizer({
    open: true,
    gzipSize: true,
    brotliSize: true,
  }),
];
```

После `npm run build` — открывается визуализация всех чанков.

---

### Code splitting автоматический

```tsx
const Dashboard = lazy(() => import("./pages/Dashboard"));
// Vite автоматически создаёт отдельный chunk
```

См. [Code splitting](Code%20splitting.md) и [Lazy loading роутов](Lazy%20loading%20роутов.md).

---

### Vite + Vitest

Тот же конфиг для тестов:

```ts
/// <reference types="vitest" />
import { defineConfig } from "vite";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
  },
});
```

Подробнее — [Vitest](Vitest.md).

---

### Dev experience

```ts
server: {
  watch: {
    usePolling: true,        // для Docker, WSL
  },
  hmr: {
    overlay: true,            // показывать ошибки в браузере
  },
  warmup: {
    clientFiles: ["./src/components/**/*.tsx"],  // прогрев hot файлов
  },
},

optimizeDeps: {
  include: ["lodash-es", "axios"],   // pre-bundle (для эффективного HMR)
  exclude: ["some-package"],
},
```

---

### Build для library

```ts
// vite.config.ts (для package, не app)
build: {
  lib: {
    entry: path.resolve(__dirname, "src/index.ts"),
    name: "MyLib",
    fileName: (format) => `my-lib.${format}.js`,
  },
  rollupOptions: {
    external: ["react", "react-dom"],
    output: {
      globals: { react: "React", "react-dom": "ReactDOM" },
    },
  },
}
```

Vite в режиме library создаёт ESM + UMD bundle для npm publish.

---

### SSR / SSG (опционально)

Vite поддерживает SSR через `vite.ssrLoadModule`. Но для full SSR — лучше **Next.js** (App Router) или **Remix**.

Для SSG в Vite — `vite-ssg`, `vite-plugin-ssr`.

---

### Useful plugins

```bash
# SVG как React компонент
npm i -D vite-plugin-svgr

# PWA
npm i -D vite-plugin-pwa

# Анализ бандла
npm i -D rollup-plugin-visualizer

# tsconfig paths без дублирования
npm i -D vite-tsconfig-paths

# Auto open browser
npm i -D vite-plugin-open-browser

# Inspect (debug)
npm i -D vite-plugin-inspect

# Sentry source maps
npm i -D @sentry/vite-plugin

# i18n
npm i -D @intlify/vite-plugin-vue-i18n
```

---

## ⚠️ Подводные камни

### 1. process.env не работает

```ts
// ❌ В Vite нет process.env
const url = process.env.REACT_APP_URL;

// ✅ import.meta.env
const url = import.meta.env.VITE_URL;
```

### 2. CommonJS пакеты ломаются

```
"react-pdf" хочет require("...") — но Vite в dev = ESM
```

Решения:
- `optimizeDeps.include` — pre-bundle в CJS.
- Если пакет несовместим — найти ESM альтернативу.

### 3. Imports из node_modules без @types

В dev Vite ругается, что не нашёл types. Установи `@types/...` или добавь declaration:

```ts
// src/types/missing.d.ts
declare module "some-untyped-package";
```

### 4. Public assets — не импортируй

```tsx
// ❌ Не работает (public не процессится)
import logo from "/logo.png";

// ✅ Используй URL string
<img src="/logo.png" />
```

### 5. Большой initial bundle

Без manual chunks все vendor зависимости в одном файле — большой initial bundle. Настраивай chunks.

### 6. Source maps в production

```ts
build: { sourcemap: true }
// Source maps публикуются → раскрывают код
// Решение: sourcemap: "hidden" + загрузка в Sentry
```

### 7. CSS imports order

В JSX import-ы CSS могут выполняться в неожиданном порядке. Используй CSS modules или явный import в main.tsx.

### 8. HMR не работает для класс компонентов

`react-refresh` не поддерживает классы. Перепиши на функциональные.

### 9. Cyclical imports

Vite + ESM строже к циклам, чем Webpack:

```
A → B → A
```

Может работать в одном случае и ломать в другом.

### 10. Build slower than expected

Если build долгий — проверь:
- Большие dependencies в bundle.
- Исключи unused imports (tree shaking).
- Используй `--mode production` явно.

---

## 🔬 Тонкие моменты

**Pre-bundling**

При первом dev запуске Vite собирает все node_modules в ESM-совместимые модули (через esbuild). Кэшируется в `node_modules/.vite`. Поэтому первый старт медленнее последующих.

**Force re-optimize**

```bash
vite --force
# или удалить node_modules/.vite
```

**Glob imports**

```tsx
const modules = import.meta.glob("./pages/*.tsx");
// { './pages/Home.tsx': () => import('./pages/Home.tsx'), ... }

const eager = import.meta.glob("./*.json", { eager: true });
// сразу импортирует, не lazy
```

Полезно для file-based routing.

**Suffix imports**

```tsx
import url from "./image.png?url";          // URL
import raw from "./file.txt?raw";           // как строка
import worker from "./worker.ts?worker";    // Web Worker
```

**Dynamic import + variables**

```ts
// ❌ Vite не может build-time проанализировать
const page = await import(`./pages/${name}.tsx`);

// ✅ Шаблон-литерал с хотя бы статической префиксом
// Vite включит ВСЕ файлы из ./pages/
```

**Vite vs Vite + esbuild напрямую**

В dev Vite использует esbuild для трансформации (быстро). В prod — Rollup (более оптимизированный bundle). Это компромисс между скоростью dev и качеством prod build.

**SSR через vite-ssg**

```bash
npm i -D vite-ssg
```

Превращает SPA в pre-rendered SSG. Подходит для блогов, документации.

**Module Federation**

Webpack-style microfrontends — есть `@originjs/vite-plugin-federation`. Хотя для real micro-frontend лучше специализированные solutions.

**ESM в production**

Vite генерирует ESM bundle. Старые браузеры (IE11) — нужен legacy plugin:

```ts
import legacy from "@vitejs/plugin-legacy";
plugins: [legacy({ targets: ["defaults", "not IE 11"] })];
```

**Vite + Storybook**

Storybook 7+ имеет нативную поддержку Vite (без webpack). Используй `@storybook/react-vite`.

**Inspect plugin**

```ts
import inspect from "vite-plugin-inspect";
plugins: [inspect()];
// Открой /__inspect/ — видишь, как Vite обрабатывает каждый файл
```

Помогает дебажить плагины.

---

## 🧩 Задачи для закрепления

**Задача 1 — Setup с нуля**
Создай Vite + React + TS проект. Настрой path aliases, .env, proxy для API.

**Задача 2 — Bundle analysis**
Подключи rollup-plugin-visualizer. Найди самые тяжёлые зависимости в твоём проекте. Оптимизируй через manual chunks.

**Задача 3 — PWA**
Настрой PWA с vite-plugin-pwa. Проверь offline режим (выключи сеть в DevTools → должно работать).

**Задача 4 — SVG как компоненты**
Установи vite-plugin-svgr. Импортируй SVG как React компонент. Стилизуй через CSS.

**Задача 5 — Tailwind setup**
Установи Tailwind. Настрой purge для production (только используемые классы).

**Задача 6 — Multiple env**
Сделай .env.development, .env.staging, .env.production. Используй `vite build --mode staging`.

**Задача 7 — Library mode**
Создай UI library как отдельный пакет. Build в lib mode → ESM + UMD. Опубликуй (или симулируй).

**Задача 8 — Migration с CRA**
Возьми CRA проект. Мигрируй на Vite. Запиши, что пришлось менять (env vars, paths, тесты).

**Задача 9 — SSG через vite-ssg**
Преврати SPA в pre-rendered SSG. Сравни Lighthouse скоры.

**Задача 10 — Performance benchmark**
Замерь time-to-first-render в dev для проекта 100+ компонентов: Vite vs Create React App.
