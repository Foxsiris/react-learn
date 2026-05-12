## 📝 Теория

### Что такое code splitting

**Code splitting** — разбивка JS-бандла на несколько файлов, загружаемых **по требованию**. Без него весь код приложения собирается в один большой `bundle.js`, который надо скачать целиком при первом заходе.

### Зачем

- **Быстрый initial load** — пользователь скачивает только нужное для первого экрана.
- **Параллельная загрузка** — браузер может качать чанки параллельно.
- **Кеш** — обновление одной части не инвалидирует кеш других.
- **Меньше памяти** — браузер не парсит код, который не используется.

### Без code splitting (плохо)

```
bundle.js  ──┐
             │  Один файл 5MB → 3 секунды на 4G
             │  Парсинг, выполнение → блок UI
             └─→ React видим только через 5 сек
```

### С code splitting (хорошо)

```
main.js (200KB) ─→ React видим через 0.5 сек
                   при навигации:
                   dashboard.js (300KB) ─→ загружается, показывается
                   при клике на Settings:
                   settings.js (150KB) ─→ загружается, показывается
```

---

### Dynamic import — основа всего

JS-стандарт `import()` возвращает **Promise**, разрешающийся в module:

```tsx
// Статический import — всё в bundle
import { Heavy } from "./Heavy";

// Динамический — отдельный chunk
import("./Heavy").then(module => {
  // module.Heavy
});
```

Бандлеры (Vite, Webpack) **автоматически** видят `import(...)` и создают chunk.

---

### React.lazy + Suspense

`React.lazy` оборачивает динамический импорт в **компонент**. Вместе с `<Suspense>` он показывает fallback, пока загружается chunk.

```tsx
import { lazy, Suspense } from "react";

const Dashboard = lazy(() => import("./Dashboard"));
const Settings  = lazy(() => import("./Settings"));

function App() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings"  element={<Settings />} />
      </Routes>
    </Suspense>
  );
}
```

**Что происходит:**
1. Пользователь идёт на `/dashboard`.
2. React встречает `<Dashboard />` → видит, что это lazy.
3. "Suspends" — приостанавливает рендер.
4. Ближайший Suspense показывает fallback.
5. Загружается `dashboard.js`.
6. Загрузка завершилась → React рендерит Dashboard, fallback убирается.

### Именованный экспорт

`React.lazy` ожидает default export. Для именованного:

```tsx
// Если ./Chart экспортирует { Chart, ChartLegend }
const Chart = lazy(() =>
  import("./Chart").then((module) => ({ default: module.Chart }))
);

// Или, если ваш Chart — основной экспорт, лучше переименовать в default:
// chart.tsx:
// export default Chart;
```

---

### Стратегии разбиения

#### 1. По роутам (самое частое)

Каждый route — отдельный chunk. Пользователь, никогда не зашедший в админку, не качает её код.

```tsx
const Home      = lazy(() => import("./pages/Home"));
const Profile   = lazy(() => import("./pages/Profile"));
const Admin     = lazy(() => import("./pages/Admin"));

<Routes>
  <Route path="/"         element={<Home />} />
  <Route path="/profile"  element={<Profile />} />
  <Route path="/admin"    element={<Admin />} />
</Routes>
```

#### 2. По модальным/тяжёлым виджетам

```tsx
// Heavy chart показывается только при клике на "Show stats"
const StatsModal = lazy(() => import("./StatsModal"));

function Page() {
  const [showStats, setShowStats] = useState(false);
  return (
    <>
      <button onClick={() => setShowStats(true)}>Show stats</button>
      {showStats && (
        <Suspense fallback={<Spinner />}>
          <StatsModal onClose={() => setShowStats(false)} />
        </Suspense>
      )}
    </>
  );
}
```

#### 3. По крупным библиотекам

```tsx
// Большая библиотека (например, react-pdf, mapbox) только когда нужна
const PDFViewer = lazy(() => import("./PDFViewer"));  // включает react-pdf
const MapView   = lazy(() => import("./MapView"));    // включает mapbox-gl
```

#### 4. По условиям загрузки

```tsx
// Админ-фичи только для админов
const AdminPanel = lazy(() => import("./AdminPanel"));

function App() {
  const { user } = useAuth();
  return user.isAdmin ? (
    <Suspense fallback={<Spinner />}>
      <AdminPanel />
    </Suspense>
  ) : <UserPanel />;
}
```

---

### Prefetching — подгрузка заранее

Можно начать загрузку **до того, как пользователь нажал** на ссылку:

```tsx
// При hover на ссылку — начинаем загружать
function NavLink() {
  return (
    <Link
      to="/dashboard"
      onMouseEnter={() => import("./pages/Dashboard")}
    >
      Dashboard
    </Link>
  );
}
```

Когда пользователь действительно кликнет — chunk либо уже загружен, либо ему осталось чуть-чуть.

### Webpack magic comments (предзагрузка)

```tsx
const Dashboard = lazy(() =>
  import(/* webpackPrefetch: true */ "./Dashboard")
);
// Webpack добавит <link rel="prefetch"> для этого chunk
// Браузер скачает в idle time

const CriticalChunk = lazy(() =>
  import(/* webpackPreload: true */ "./CriticalChunk")
);
// rel="preload" — высокий приоритет загрузки
```

---

### Next.js dynamic

В Next.js — встроенный `next/dynamic`:

```tsx
import dynamic from "next/dynamic";

const HeavyChart = dynamic(() => import("./HeavyChart"), {
  loading: () => <Skeleton />,
  ssr: false,  // не рендерить на сервере (полезно для виджетов с window)
});

// Именованный экспорт
const Map = dynamic(() => import("./Map").then((m) => m.MapComponent), {
  ssr: false,
});
```

`next/dynamic` под капотом — это `React.lazy` + `Suspense`, но с опциями `loading` и `ssr`.

---

### Vite — automatic code splitting

Vite автоматически создаёт чанки при `import()`. Можно настроить ручное разделение:

```tsx
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react":   ["react", "react-dom"],
          "vendor-router":  ["react-router-dom"],
          "vendor-charts":  ["recharts", "d3"],
        },
      },
    },
  },
});
// Создаст vendor-react.js, vendor-router.js — отдельные кешируемые чанки
```

---

### Bundle analyzer

После сборки — проанализируй, что попало в каждый chunk:

```bash
# Vite
npx vite-bundle-visualizer

# Webpack
npx webpack-bundle-analyzer

# Next.js
ANALYZE=true npm run build
```

Откроется treemap. Ищи:
- **Огромные библиотеки** (moment, lodash) → можно ли заменить или tree-shake?
- **Дубликаты** (несколько версий одной библиотеки).
- **Полифиллы**, которые не нужны для современных браузеров.

---

### Замены тяжёлых библиотек

```tsx
// ❌ moment.js — 290KB
import moment from "moment";

// ✅ date-fns — tree-shakable
import { format } from "date-fns";

// ❌ lodash целиком — ~70KB
import _ from "lodash";
_.debounce(...)

// ✅ Точечный импорт
import debounce from "lodash/debounce";
// или lodash-es

// ❌ chart.js — 80KB+
// ✅ собственный SVG для простых графиков
```

---

## ⚠️ Подводные камни

### 1. Слишком мелкое дробление

```tsx
// ❌ 50 lazy компонентов — 50 HTTP-запросов при первом заходе на страницу
const Btn1 = lazy(() => import("./Btn1"));
const Btn2 = lazy(() => import("./Btn2"));
// ...

// ✅ Дроби по логическим секциям, не по компонентам
const Buttons = lazy(() => import("./Buttons"));  // все кнопки в одном chunk
```

### 2. Lazy без Suspense

```tsx
// ❌ Suspense должен быть НАД lazy в дереве
function App() {
  const Dashboard = lazy(() => import("./Dashboard"));
  return <Dashboard />;  // ошибка: A React component suspended... but no fallback UI
}

// ✅ Suspense выше
<Suspense fallback={<Spinner />}>
  <Dashboard />
</Suspense>
```

### 3. Lazy + SSR без поддержки

```tsx
// ❌ React.lazy + ReactDOM.renderToString — выдаст ошибку
// ✅ Используй loadable-components, Next.js dynamic, или Suspense SSR (React 18)
```

### 4. Loading flash

Если chunk маленький и грузится за 50ms — пользователь увидит "вспышку" Spinner. UX страдает.

```tsx
// ✅ Минимальная задержка перед показом fallback
function DelayedFallback({ delay = 200, children }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(id);
  }, []);
  return show ? children : null;
}

<Suspense fallback={<DelayedFallback><Spinner /></DelayedFallback>}>
```

### 5. Lazy внутри map

```tsx
// ❌ Lazy не поддерживает дин. ключи как обычные импорты
items.map(item => {
  const C = lazy(() => import(`./components/${item.type}`));  // часто ломается в Webpack
  return <C key={item.id} />;
});

// ✅ Маппинг известных модулей
const componentMap = {
  text: lazy(() => import("./TextWidget")),
  chart: lazy(() => import("./ChartWidget")),
};
items.map(item => {
  const C = componentMap[item.type];
  return <C key={item.id} />;
});
```

### 6. Кеш chunk-ов после деплоя

После релиза chunk-ы получают новые имена (хеши). Если пользователь открывал старую версию и переходит на роут с lazy — браузер пытается загрузить старый chunk, которого больше нет → ошибка `Loading chunk N failed`.

```tsx
// ✅ Обработка ошибки + автообновление страницы
const Dashboard = lazy(async () => {
  try {
    return await import("./Dashboard");
  } catch (e) {
    // Возможно, новая версия задеплоена
    window.location.reload();
    throw e;
  }
});

// или используй ErrorBoundary с reload
```

### 7. Тестирование lazy

```tsx
// Jest / Vitest по умолчанию не любят dynamic import
// ✅ Mock или используй Suspense в тестах с фейковым модулем
```

---

## 🔬 Тонкие моменты

**`React.lazy` под капотом**

```tsx
function lazy(loader) {
  let status = "pending";
  let result;
  let promise = loader().then(
    m => { status = "resolved"; result = m.default; },
    e => { status = "rejected"; result = e; }
  );
  return {
    $$typeof: Symbol.for("react.lazy"),
    _payload: { _status: status, _result: result, ... },
    _init: (payload) => {
      if (status === "resolved") return result;
      if (status === "rejected") throw result;
      throw promise;  // ← Suspense ловит этот promise
    },
  };
}
```

**Suspense ловит throw promise**

Это базовый механизм React 18:
- Любой компонент может `throw new Promise(...)` — это сигнал "я ещё не готов".
- Ближайший Suspense ловит → показывает fallback.
- Когда promise resolves → React пробует снова.

`React.lazy` использует это, но также React Query (suspense mode), Relay, и др.

**Вложенные Suspense — гранулярные fallbacks**

```tsx
<Suspense fallback={<PageLoader />}>
  <Layout>
    <Sidebar />
    <Suspense fallback={<MainLoader />}>
      <MainContent />  {/* lazy */}
    </Suspense>
  </Layout>
</Suspense>
// Layout/Sidebar показываются сразу (если не lazy)
// MainContent грузится отдельно с MainLoader
```

**SuspenseList (experimental)**

```tsx
import { SuspenseList } from "react";

<SuspenseList revealOrder="forwards">
  <Suspense fallback={<Spinner />}><Card1 /></Suspense>
  <Suspense fallback={<Spinner />}><Card2 /></Suspense>
  <Suspense fallback={<Spinner />}><Card3 /></Suspense>
</SuspenseList>
// Карточки показываются по порядку, даже если Card3 загрузился раньше Card2
```

**Webpack magic comments — больше контроля**

```tsx
import(
  /* webpackChunkName: "dashboard" */
  /* webpackPrefetch: true */
  "./Dashboard"
);
// dashboard.chunk.js — кастомное имя
// <link rel="prefetch"> для предзагрузки
```

**Server Components (React 19)**

В RSC code splitting происходит "из коробки" — серверный код не отправляется на клиент вообще. Только Client Components попадают в bundle.

**Микрофронтенды и module federation**

Webpack 5 Module Federation позволяет приложению А загружать компоненты из приложения Б на лету. Это продвинутый код-сплит на уровне приложений.

**Performance Budget**

В CI можно проверять размер чанков:

```bash
# Размер не должен превышать 200KB для main
size-limit: { "path": "dist/main-*.js", "limit": "200 KB" }
```

---

## 🧩 Задачи для закрепления

**Задача 1 — Code splitting по роутам**
Создай SPA с 5+ роутами на React Router. Сделай каждый роут lazy. В DevTools Network посмотри: при заходе на главную грузится только main + home, при клике на /about — догружается about chunk.

**Задача 2 — Bundle analyzer**
Открой свой проект, поставь bundle analyzer (rollup-plugin-visualizer для Vite). Найди 3 самые большие зависимости. Подумай, как их уменьшить.

**Задача 3 — Prefetching на hover**
Список ссылок навигации. При hover — `import(./PageX)` запускается, кеш браузера готовит chunk. При клике — переход моментальный.

**Задача 4 — Lazy modal**
Тяжёлая модалка (например, с PDF Viewer). Без lazy: вес main bundle растёт. С lazy + Suspense: модалка грузится только при первом открытии.

**Задача 5 — Замена moment.js**
Найди (или придумай) проект, использующий moment.js. Замени на date-fns с точечными импортами. Сравни bundle size.

**Задача 6 — Loading flash**
Реализуй `<DelayedFallback delay={200}>` (см. пример). Покажи, что для быстро загружающихся chunks fallback не появляется (нет вспышки).

**Задача 7 — Chunk error recovery**
Настрой обработку `Loading chunk failed` через ErrorBoundary. При ошибке — кнопка "Перезагрузить страницу".

**Задача 8 — Manual chunks в Vite**
Настрой `manualChunks` в Vite-конфиге так, чтобы:
- React/ReactDOM в одном chunk.
- React Router отдельно.
- Все другие npm-зависимости в `vendor.js`.

Замерь, как уменьшилось время загрузки.

**Задача 9 — Code split + i18n**
Языковые файлы — отдельные chunks. При смене языка — динамический импорт нужного `i18n/${lang}.json`. Кешируй уже загруженные.

**Задача 10 — Performance budget в CI**
Поставь size-limit в проект. Настрой лимит на main chunk. Сделай PR, который добавляет тяжёлую библиотеку — CI должен упасть.
