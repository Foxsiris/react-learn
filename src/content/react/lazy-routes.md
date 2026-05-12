## 📝 Теория

### Что это и зачем

**Lazy loading роутов** — загрузка кода страницы только при первом переходе на неё, а не при старте приложения. Каждая страница становится отдельным **chunk**, который скачивается асинхронно.

**Зачем:**

- ⚡ Меньше initial bundle → быстрый Time-to-Interactive.
- 💰 Не грузим страницы, на которые юзер может никогда не зайти.
- 📊 Лучше Lighthouse / Web Vitals.

```
Без lazy:
  index.js (3 MB)  ← всё приложение в одном файле
  
С lazy:
  index.js     (300 KB)  ← только App + Home
  dashboard.js (200 KB)  ← по требованию
  profile.js   (150 KB)  ← по требованию
  admin.js     (500 KB)  ← по требованию
```

---

### React.lazy + Suspense

```tsx
import { lazy, Suspense } from "react";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Profile   = lazy(() => import("./pages/Profile"));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile"   element={<Profile />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
```

`React.lazy` принимает функцию, возвращающую `Promise` от модуля с `default` экспортом.

---

### Named exports — нужен wrap

`React.lazy` ожидает default export. Если у тебя named — оборачивай:

```tsx
// pages/Dashboard.tsx
export function Dashboard() { ... }

// router.tsx
const Dashboard = lazy(() =>
  import("./pages/Dashboard").then(m => ({ default: m.Dashboard }))
);
```

---

### Гранулярность Suspense

Suspense можно ставить на разных уровнях:

**Один глобальный (просто):**
```tsx
<Suspense fallback={<PageLoader />}>
  <Routes>...</Routes>
</Suspense>
```
Минус: при переходе с Dashboard на Profile видно один большой spinner на весь экран.

**На каждый роут отдельно:**
```tsx
<Routes>
  <Route path="/dashboard" element={
    <Suspense fallback={<DashboardSkeleton />}>
      <Dashboard />
    </Suspense>
  } />
  <Route path="/profile" element={
    <Suspense fallback={<ProfileSkeleton />}>
      <Profile />
    </Suspense>
  } />
</Routes>
```
Плюс: тонкие skeleton-ы для каждой страницы.

**Со скрытым layout (lazy только контент):**
```tsx
<Route element={<MainLayout />}>
  <Route path="/dashboard" element={
    <Suspense fallback={<ContentSkeleton />}>
      <Dashboard />
    </Suspense>
  } />
</Route>
// Layout (header/sidebar) рендерится сразу, skeleton только в content area
```

---

### Prefetch при hover

Загружаем чанк до клика — клик становится мгновенным:

```tsx
const prefetch = (importFn: () => Promise<unknown>) => () => { importFn(); };

<Link
  to="/dashboard"
  onMouseEnter={prefetch(() => import("./pages/Dashboard"))}
  onFocus={prefetch(() => import("./pages/Dashboard"))}
>
  Dashboard
</Link>
```

Хук:

```tsx
function usePrefetch(importFn: () => Promise<unknown>) {
  return useCallback(() => { importFn(); }, []);
}

const prefetchDashboard = usePrefetch(() => import("./pages/Dashboard"));
<Link to="/dashboard" onMouseEnter={prefetchDashboard}>...</Link>
```

---

### Prefetch критичных страниц idle-time

```tsx
useEffect(() => {
  const idle = (cb: () => void) =>
    "requestIdleCallback" in window
      ? requestIdleCallback(cb)
      : setTimeout(cb, 1000);
  
  idle(() => {
    import("./pages/Dashboard");  // подгрузим, пока пользователь читает Home
    import("./pages/Profile");
  });
}, []);
```

---

### Webpack magic comments

```tsx
const Dashboard = lazy(() =>
  import(
    /* webpackChunkName: "dashboard" */
    /* webpackPrefetch: true */
    "./pages/Dashboard"
  )
);
```

- `webpackChunkName` — имя файла (полезно для отладки).
- `webpackPrefetch: true` — браузер загружает в idle (низкий приоритет, через `<link rel="prefetch">`).
- `webpackPreload: true` — параллельно с родительским чанком (высокий приоритет).

---

### Vite — автоматическое разделение

В Vite каждый `import()` = отдельный chunk автоматически.

```tsx
const Dashboard = lazy(() => import("./pages/Dashboard"));
// Vite создаст dashboard-[hash].js без дополнительных настроек
```

Manual chunks:

```ts
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "ui-vendor":    ["@mui/material", "@emotion/react"],
        },
      },
    },
  },
});
```

---

### Lazy loading с Error Boundary

Чанк может не загрузиться (плохой интернет, deploy с новым хешем). Нужен fallback:

```tsx
class LazyErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div>
          <p>Failed to load. Please refresh.</p>
          <button onClick={() => location.reload()}>Refresh</button>
        </div>
      );
    }
    return this.props.children;
  }
}

<LazyErrorBoundary>
  <Suspense fallback={<Loader />}>
    <Routes>...</Routes>
  </Suspense>
</LazyErrorBoundary>
```

---

### Retry chunk loading

Иногда чанк не грузится временно (сеть). Можно retry:

```tsx
function lazyWithRetry<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  retries = 3
) {
  return lazy(async () => {
    let lastError: any;
    for (let i = 0; i < retries; i++) {
      try {
        return await importFn();
      } catch (err) {
        lastError = err;
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
      }
    }
    throw lastError;
  });
}

const Dashboard = lazyWithRetry(() => import("./pages/Dashboard"));
```

---

### Auto-reload при ChunkLoadError (deploy)

После деплоя хеши меняются → старая страница пытается загрузить старый чанк → 404 → ошибка. Решение — автоматический reload:

```tsx
window.addEventListener("error", (e) => {
  if (/Loading chunk \d+ failed/.test(e.message)) {
    location.reload();
  }
});

// или через Error Boundary
class ChunkErrorBoundary extends Component {
  componentDidCatch(error: Error) {
    if (error.name === "ChunkLoadError") {
      location.reload();
    }
  }
  // ...
}
```

---

### Data Router + lazy (v6.4+)

```tsx
const router = createBrowserRouter([
  {
    path: "/dashboard",
    lazy: async () => {
      const { Dashboard, dashboardLoader } = await import("./pages/Dashboard");
      return { Component: Dashboard, loader: dashboardLoader };
    },
  },
]);
```

Можно lazy-грузить и компонент, и loader, и action одновременно.

---

### Группировка чанков

Иногда несколько маленьких страниц лучше сгруппировать в один чанк:

```tsx
// Webpack magic comment
const Dashboard = lazy(() =>
  import(/* webpackChunkName: "main" */ "./pages/Dashboard")
);
const Profile = lazy(() =>
  import(/* webpackChunkName: "main" */ "./pages/Profile")
);
// Оба в main.chunk.js
```

---

### Нелэйзи компоненты в чанке

Чанк включает не только код страницы, но и всё, что она импортирует. Если Dashboard и Profile оба импортируют тяжёлый Chart, он может быть в обоих чанках:

```
dashboard.js (с Chart) - 500 KB
profile.js   (с Chart) - 500 KB
```

Webpack/Vite по умолчанию выносит общие зависимости в отдельный chunk (commons), но можно настраивать через `splitChunks`.

---

### Анализ бандла

```bash
# Vite
npm i -D rollup-plugin-visualizer
# vite.config.ts
import { visualizer } from "rollup-plugin-visualizer";
export default { plugins: [visualizer({ open: true })] };

# Webpack
npm i -D webpack-bundle-analyzer
```

Покажет визуализацию: какие чанки, что в них, дублируется ли что-то.

---

## ⚠️ Подводные камни

### 1. Suspense без fallback или с пустым fallback

```tsx
// ❌ При первой загрузке — пустой экран на 1-2 секунды
<Suspense>
  <Routes>...</Routes>
</Suspense>

// ✅ Спиннер или skeleton
<Suspense fallback={<PageLoader />}>
  <Routes>...</Routes>
</Suspense>
```

### 2. Lazy грузит уже импортированное модуля

```tsx
// app.tsx
import { Dashboard } from "./pages/Dashboard";  // обычный импорт
const LazyDashboard = lazy(() => import("./pages/Dashboard"));
// LazyDashboard теперь бесполезен — Dashboard уже в main bundle
```

### 3. `lazy()` внутри компонента — пересоздаётся на каждый рендер

```tsx
// ❌ Каждый рендер — новый lazy → потеря кэша
function App() {
  const Dashboard = lazy(() => import("./pages/Dashboard"));  // ← плохо
  return <Suspense><Dashboard /></Suspense>;
}

// ✅ На уровне модуля
const Dashboard = lazy(() => import("./pages/Dashboard"));
function App() { return <Suspense><Dashboard /></Suspense>; }
```

### 4. Условный lazy

```tsx
// ❌ Webpack не сможет определить что разделить
const Component = condition
  ? lazy(() => import("./A"))
  : lazy(() => import("./B"));
// Создаст оба чанка, грузить будет тот, что выбран
// Часто это нормально, но осознавай поведение

// Динамический путь — особенно опасно
const Component = lazy(() => import(`./pages/${name}`));
// Webpack включит ВСЕ файлы из ./pages в граф зависимостей
```

### 5. Lazy для маленьких компонентов

```tsx
// ❌ Чанк меньше overhead = бессмысленно
const Button = lazy(() => import("./Button"));  // 1 KB
// Сетевой запрос дороже самого кода

// ✅ Lazy для крупных страниц/виджетов (>30 KB)
```

### 6. Не считайся с CSS чанками

При lazy-загрузке страницы её CSS тоже подгружается асинхронно. Может быть FOUC (Flash of Unstyled Content) или layout shift. Решение — критический CSS inline + остальное lazy.

### 7. SSR несовместим с React.lazy (до Suspense SSR)

В старом React (до 18) `React.lazy` не работал на SSR. В React 18 поддерживается через streaming SSR + Suspense.

В Next.js используй `next/dynamic`:

```tsx
const Dashboard = dynamic(() => import("./Dashboard"), { ssr: false });
```

### 8. Чанк падает после деплоя

После деплоя хеши меняются. Открытая в браузере вкладка пытается загрузить старый `dashboard-abc123.js`, а новый — `dashboard-xyz789.js`.

```
GET /static/dashboard-abc123.js → 404
ChunkLoadError
```

Решение — auto-reload при ChunkLoadError.

### 9. Слишком много мелких чанков → много network запросов

Если каждая мелочь lazy → много HTTP запросов → медленно. HTTP/2 multiplexing помогает, но всё равно overhead.

Балансируй: страница = 1 чанк. Очень тяжёлые виджеты внутри — отдельные чанки.

---

## 🔬 Тонкие моменты

**Suspense ловит promise**

`React.lazy` под капотом throws promise при первом рендере. Suspense ловит этот promise и показывает fallback. Когда promise resolved — снова рендерит.

**`React.lazy` кэширует промис**

```tsx
const Dashboard = lazy(() => import("./Dashboard"));
// Первый рендер — throws promise
// При втором рендере (после resolve) — вернёт компонент мгновенно
```

**Несколько Suspense одновременно**

Если компонент завернут в несколько Suspense, "ловится" ближайший:

```tsx
<Suspense fallback="outer">
  <Suspense fallback="inner">
    <LazyA />
  </Suspense>
</Suspense>
// При загрузке LazyA показывается "inner"
```

**Suspense + parallel lazy**

```tsx
<Suspense fallback={<Loader />}>
  <LazyA />
  <LazyB />
</Suspense>
```

Оба компонента грузятся параллельно. Suspense ждёт оба — fallback показан, пока хоть один не готов.

**Streaming Suspense (React 18)**

В Suspense-aware data fetching (TanStack Query, Relay) Suspense может показывать частичный UI:

```tsx
<Suspense fallback={<Skeleton />}>
  <Header />  // ← показывается сразу
  <Suspense fallback={<ContentSkeleton />}>
    <Content />  // ← если ждёт, content area = skeleton
  </Suspense>
</Suspense>
```

**preload через React 19 (`React.preload`)**

В будущих версиях React будет `preload` API:

```tsx
// (концепт, может измениться)
import { preload } from "react-dom";
preload("/static/dashboard.js", { as: "script" });
```

**Bundle size budget**

Установи лимиты:

```json
// package.json (с bundlesize)
"bundlesize": [
  { "path": "./dist/main-*.js", "maxSize": "300 KB" },
  { "path": "./dist/dashboard-*.js", "maxSize": "200 KB" }
]
```

CI проверит, что бандл не вырос сверх лимита.

**Совместимость lazy + animation на route transition**

Lazy-чанк тормозит появление страницы. Если есть transition animation, она запускается до загрузки чанка. Решение — preload перед animation start, или использовать `useTransition`:

```tsx
const [isPending, startTransition] = useTransition();
startTransition(() => navigate("/dashboard"));
// isPending = true, пока чанк грузится
```

---

## 🧩 Задачи для закрепления

**Задача 1 — Базовый lazy**
Раздели приложение на 5 страниц. Все, кроме Home, сделай lazy. Проверь в Network tab — чанки грузятся при переходе.

**Задача 2 — Prefetch при hover**
Реализуй `<Link>` с prefetch при hover/focus. Покажи в Network tab — чанк грузится при наведении, переход мгновенный.

**Задача 3 — Idle prefetch**
После загрузки Home через `requestIdleCallback` подгрузи Dashboard и Profile в фоне. Проверь, что переход на них мгновенный.

**Задача 4 — Гранулярные Suspense**
Сделай тонкие skeleton-ы для каждой страницы вместо одного глобального loader. Layout (header/sidebar) показывается сразу, skeleton — только в content area.

**Задача 5 — Retry при сетевой ошибке**
Реализуй `lazyWithRetry`. Симулируй ошибку (например, throw в первом импорте). Проверь, что retry работает.

**Задача 6 — ChunkLoadError + auto-reload**
Реализуй обработчик ChunkLoadError, который автоматически релоадит страницу. Симулируй (закомить старый чанк → попробуй открыть страницу).

**Задача 7 — Bundle analysis**
Подключи `rollup-plugin-visualizer` (Vite) или `webpack-bundle-analyzer`. Найди дублирование зависимостей. Оптимизируй через manual chunks.

**Задача 8 — Lazy виджет внутри страницы**
На странице Dashboard есть тяжёлый Chart-виджет (предположим — 500KB). Сделай его lazy внутри страницы. Покажи skeleton, пока грузится.

**Задача 9 — useTransition + lazy**
При переходе по ссылке используй `startTransition`. Пока чанк грузится — показывай spinner на старой странице (не пустой fallback).

**Задача 10 — Lazy в Data Router**
Используй React Router 6.4+ Data Router. Сделай lazy-загрузку компонента + loader для /dashboard. Проверь, что и компонент, и данные грузятся одним пакетом.
