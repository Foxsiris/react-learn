## 📝 Теория

Три "не-визуальные" примитива React, которые решают разные задачи:

| | Что делает | Когда нужен |
|---|---|---|
| **Fragment** | Группирует элементы без обёртки в DOM | Возврат нескольких элементов, таблицы, `<dl>`-списки |
| **Portal** | Рендерит JSX в другой DOM-узел | Модалки, тултипы, дропдауны, тосты |
| **Error Boundary** | Перехватывает ошибки render/effect в дереве | Не дать одному компоненту уронить всё приложение |

---

## 🧩 Fragment

### Зачем нужен

JSX-функция должна вернуть **один корневой элемент**. Раньше для этого оборачивали в `<div>`, что ломало семантику (нелегальные дочерние теги в `<table>`, лишние боксы в Flex/Grid). Fragment решает проблему — он не создаёт DOM-узел.

```tsx
// ❌ Без Fragment — нельзя вернуть несколько элементов
function List() {
  return (
    <li>One</li>
    <li>Two</li>  // SyntaxError
  );
}

// ❌ Лишний div ломает <ul><li> структуру
function List() {
  return (
    <div>
      <li>One</li>
      <li>Two</li>
    </div>
  );
}
// HTML: <ul><div><li>...</li></div></ul> — невалидный

// ✅ Fragment — без обёртки в DOM
function List() {
  return (
    <>
      <li>One</li>
      <li>Two</li>
    </>
  );
}
// HTML: <ul><li>One</li><li>Two</li></ul> — чисто
```

### Два синтаксиса

```tsx
// 1. Краткий — без атрибутов
<>
  <Header />
  <Main />
</>

// 2. Полный — с key (для списков)
import { Fragment } from "react";

{items.map(item => (
  <Fragment key={item.id}>
    <dt>{item.term}</dt>
    <dd>{item.definition}</dd>
  </Fragment>
))}

// Краткий синтаксис НЕ поддерживает key и другие атрибуты:
<key="x"></>  // ❌ SyntaxError
```

### Типичные кейсы

```tsx
// 1. Таблицы — нужно вернуть несколько <tr>
function TableRows({ data }) {
  return (
    <>
      {data.map(row => (
        <Fragment key={row.id}>
          <tr><td>{row.name}</td></tr>
          <tr className="details"><td>{row.details}</td></tr>
        </Fragment>
      ))}
    </>
  );
}

// 2. Description list — пары <dt>/<dd>
{users.map(u => (
  <Fragment key={u.id}>
    <dt>{u.name}</dt>
    <dd>{u.email}</dd>
  </Fragment>
))}

// 3. Условный рендер нескольких элементов
function Status({ user }) {
  return (
    <>
      {user.online && <span className="dot" />}
      <span>{user.name}</span>
    </>
  );
}

// 4. Layout без лишних боксов в Flex/Grid
function Card() {
  return (
    <div className="grid"> {/* родитель — grid */}
      <ChildA />
      <ChildB />
      <>
        <ChildC />  {/* тоже элементы grid, не вложенные */}
        <ChildD />
      </>
    </div>
  );
}
```

---

## 🌀 Portal

### Зачем нужен

Portal позволяет отрендерить JSX **в любой DOM-узел**, при этом компонент остаётся в React-дереве на своём месте. Используется когда визуально элемент должен "вырваться" из родителя — модалки, тултипы, дропдауны, тосты.

**Проблема, которую решает Portal:**

```tsx
// ❌ Модалка внутри карточки с overflow: hidden и относительным z-index
<div className="card" style={{ overflow: "hidden", position: "relative", zIndex: 1 }}>
  <Header />
  {showModal && (
    <div className="modal" style={{ position: "fixed" }}>
      Модалка обрезается родительским overflow: hidden!
    </div>
  )}
</div>
```

**Решение через Portal:**

```tsx
import { createPortal } from "react-dom";

function Modal({ children }: { children: React.ReactNode }) {
  return createPortal(
    <div className="modal-overlay">
      <div className="modal-content">{children}</div>
    </div>,
    document.body  // рендерим в самый верх DOM
  );
}

// Использование — не важно, как глубоко
<div className="card" style={{ overflow: "hidden" }}>
  {showModal && (
    <Modal>
      <h2>Привет!</h2>
      <button onClick={onClose}>×</button>
    </Modal>
  )}
</div>
// В DOM: модалка прямо в <body>, обрезание не действует
// В React-дереве: модалка логически внутри Card
```

### События и контекст в Portal

**События всплывают по React-дереву, а НЕ по DOM:**

```tsx
function App() {
  return (
    <div onClick={() => console.log("App clicked")}>
      <Modal>
        <button>Click me</button>
      </Modal>
    </div>
  );
}
// Клик на button → "App clicked" сработает!
// Хотя в DOM кнопка в <body>, а App в #root
```

**Контекст работает как обычно** — Portal сохраняет связь с React-родителем:

```tsx
const ThemeContext = createContext("light");

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Modal>
        <ThemedButton />  {/* useContext(ThemeContext) === "dark" ✓ */}
      </Modal>
    </ThemeContext.Provider>
  );
}
```

### Создание контейнера на лету

```tsx
function Toast({ message }: { message: string }) {
  const containerRef = useRef<HTMLDivElement>();

  if (!containerRef.current) {
    containerRef.current = document.createElement("div");
    containerRef.current.className = "toast-portal";
  }

  useEffect(() => {
    const el = containerRef.current!;
    document.body.appendChild(el);
    return () => {
      document.body.removeChild(el);
    };
  }, []);

  return createPortal(
    <div className="toast">{message}</div>,
    containerRef.current
  );
}
```

### Производственный паттерн — выделенный root

```html
<!-- index.html -->
<div id="root"></div>
<div id="modal-root"></div>
<div id="toast-root"></div>
<div id="tooltip-root"></div>
```

```tsx
function Modal({ children }) {
  return createPortal(children, document.getElementById("modal-root")!);
}
```

Преимущества:
- Чёткая структура DOM.
- Каждый тип overlay имеет свой z-index в CSS.
- Легче отлаживать.

---

## 🛡️ Error Boundary

### Что это

Error Boundary — это **классовый** компонент с методами `getDerivedStateFromError` и/или `componentDidCatch`, который перехватывает ошибки в **поддереве**. Это страховка от того, чтобы одна ошибка не уронила всё приложение.

### Базовая реализация

```tsx
import { Component, ReactNode, ErrorInfo } from "react";

interface Props {
  fallback: ReactNode | ((err: Error, reset: () => void) => ReactNode);
  children: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  // Вызывается при render-ошибке → обновляем state, чтобы показать fallback
  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  // Сайд-эффект (логирование). НЕ для смены state
  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info);
    // Sentry/LogRocket/etc.
    console.error("Caught:", error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      const { fallback } = this.props;
      return typeof fallback === "function"
        ? fallback(this.state.error, this.reset)
        : fallback;
    }
    return this.props.children;
  }
}
```

### Использование

```tsx
<ErrorBoundary
  fallback={(err, reset) => (
    <div className="error">
      <h2>Что-то сломалось</h2>
      <pre>{err.message}</pre>
      <button onClick={reset}>Попробовать снова</button>
    </div>
  )}
  onError={(err) => Sentry.captureException(err)}
>
  <RiskyComponent />
</ErrorBoundary>
```

### Что Error Boundary **НЕ ловит**

```tsx
// 1. ❌ Async ошибки
useEffect(() => {
  setTimeout(() => {
    throw new Error("won't be caught");  // Error Boundary не увидит
  }, 1000);
}, []);

// 2. ❌ Promise.catch / async/await без try-catch
useEffect(() => {
  fetchData().then(data => {
    throw new Error("not caught");  // Error Boundary не увидит
  });
}, []);

// 3. ❌ Ошибки в обработчиках событий
<button onClick={() => { throw new Error("not caught"); }}>Click</button>

// 4. ❌ Ошибки в самом Error Boundary
class BrokenBoundary extends Component {
  render() { throw new Error("infinite loop"); }
}

// 5. ❌ Ошибки в SSR (нужны другие средства)
```

### Как ловить async ошибки

```tsx
function useThrowOnError() {
  const [, setState] = useState();
  return (error: Error) => {
    setState(() => { throw error; });  // выкидываем в render → Error Boundary поймает
  };
}

function MyComponent() {
  const throwError = useThrowOnError();
  
  useEffect(() => {
    fetchData().catch(throwError);  // теперь Error Boundary поймает
  }, []);
}
```

Или используй [`react-error-boundary`](https://github.com/bvaughn/react-error-boundary):

```tsx
import { ErrorBoundary, useErrorBoundary } from "react-error-boundary";

function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => {/* reset state */}}>
      <Routes />
    </ErrorBoundary>
  );
}

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert">
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

// Внутри компонента — кидать ошибки в render
function MyForm() {
  const { showBoundary } = useErrorBoundary();
  
  const onSubmit = async (data) => {
    try {
      await api.submit(data);
    } catch (err) {
      showBoundary(err);  // покажется fallback
    }
  };
}
```

### Гранулярность Error Boundary

```tsx
// ❌ Один корневой Error Boundary — любая ошибка ломает всю страницу
<ErrorBoundary fallback={<ErrorPage />}>
  <Header />
  <Sidebar />
  <Main />     {/* если упадёт — пропадёт всё, включая Header */}
  <Footer />
</ErrorBoundary>

// ✅ Локальные Error Boundary вокруг рискованных секций
<Header />
<Sidebar />
<ErrorBoundary fallback={<MainError />}>
  <Main />     {/* упадёт только Main, остальное работает */}
</ErrorBoundary>
<Footer />

// ✅ Layered подход — корневой + локальные
<ErrorBoundary fallback={<FullPageError />}>  {/* последняя надежда */}
  <Layout>
    {routes.map(r => (
      <ErrorBoundary key={r.path} fallback={<RouteError />}>
        <Route {...r} />
      </ErrorBoundary>
    ))}
  </Layout>
</ErrorBoundary>
```

---

## ⚠️ Подводные камни

### Fragment

**1. Fragment не принимает CSS-классы и стили.**

```tsx
// ❌ Нельзя
<className="wrapper">...</>

// ✅ Если нужны классы → используй div или другой элемент
<div className="wrapper">...</div>
```

**2. Краткий синтаксис не поддерживает key.**

```tsx
// ❌ Не работает
{items.map(item => <key={item.id}>...</>)}

// ✅ Только полный синтаксис
{items.map(item => <Fragment key={item.id}>...</Fragment>)}
```

### Portal

**1. События всплывают по React-дереву, не DOM.**

Это и плюс (логичная связь), и минус (не работает `event.stopPropagation` в DOM-смысле).

```tsx
// Закрытие dropdown по клику вне:
useEffect(() => {
  function onClick(e: MouseEvent) {
    // e.target в DOM — внутри body, но это часть React-дерева dropdown!
    if (!dropdownRef.current?.contains(e.target as Node)) {
      setOpen(false);
    }
  }
  document.addEventListener("mousedown", onClick);
  return () => document.removeEventListener("mousedown", onClick);
}, []);
// ✅ Работает, потому что Portal содержимое физически ВНУТРИ document.body
```

**2. SSR и Portal — Portal не работает на сервере.**

```tsx
// На сервере document не существует
function Modal({ children }) {
  if (typeof document === "undefined") return null;  // SSR-safe
  return createPortal(children, document.body);
}
```

**3. Утечка памяти при динамическом создании контейнеров.**

```tsx
// ❌ Контейнер создаётся каждый рендер, не удаляется
function Modal({ children }) {
  const el = document.createElement("div");
  document.body.appendChild(el);
  return createPortal(children, el);
}

// ✅ useRef + useEffect cleanup
function Modal({ children }) {
  const elRef = useRef<HTMLDivElement>();
  if (!elRef.current) elRef.current = document.createElement("div");
  
  useEffect(() => {
    const el = elRef.current!;
    document.body.appendChild(el);
    return () => document.body.removeChild(el);
  }, []);
  
  return createPortal(children, elRef.current);
}
```

**4. z-index hell.**

Portal в `<body>` ≠ автоматически "сверху всех". Если у тебя есть другой `position: fixed` с z-index 9999 — твоя модалка может быть под ним.

```css
/* ✅ Договорись о z-index сразу */
.modal-overlay   { z-index: 1000; }
.toast-container { z-index: 2000; }
.tooltip         { z-index: 3000; }
```

### Error Boundary

**1. Только classcomponent умеет быть Error Boundary.**

Хук-альтернативы пока нет. Используй [`react-error-boundary`](https://github.com/bvaughn/react-error-boundary) для удобной обёртки.

**2. В dev-режиме ошибка показывается дважды.**

React сначала покажет красный overlay (для дебага), потом отдаст ошибку Error Boundary. В production — только Error Boundary.

```tsx
// Если хочешь убрать overlay (только в dev):
// React DevTools → settings → Theme → Disable error overlay
```

**3. `getDerivedStateFromError` не имеет доступа к `this`.**

Это `static`-метод. Логирование делай в `componentDidCatch`:

```tsx
class EB extends Component {
  static getDerivedStateFromError(error) {
    // ❌ this.props.onError(error) — нельзя, this не существует
    return { hasError: true };
  }
  
  componentDidCatch(error, info) {
    // ✅ Здесь this доступен
    this.props.onError?.(error, info);
  }
}
```

**4. State Error Boundary не сбросится сам после fix.**

Если ошибка случилась, fallback показан — он будет показан и после успешного исправления. Нужен явный `reset`:

```tsx
<ErrorBoundary
  resetKeys={[user.id]}  // react-error-boundary: сбросить при смене user.id
  onReset={() => refetch()}
  FallbackComponent={ErrorUI}
>
  <UserProfile id={user.id} />
</ErrorBoundary>
```

---

## 🔬 Тонкие моменты

**Fragment и DevTools** — отображается как `<>` в React DevTools, без отдельного узла.

**Portal и formik/RHF** — формы внутри Portal работают, но могут возникнуть проблемы с focus management (например, focus trap в модалке). Используй [`focus-trap-react`](https://github.com/focus-trap/focus-trap-react).

**Suspense + Error Boundary** — Suspense ловит асинхронные пропуски (loading), Error Boundary — ошибки. Часто их используют вместе:

```tsx
<ErrorBoundary fallback={<Error />}>
  <Suspense fallback={<Loading />}>
    <AsyncComponent />
  </Suspense>
</ErrorBoundary>
```

**`useId` для accessibility внутри Portal** — у Portal может не быть прямого DOM-связывания с триггером (`aria-controls`), используй `useId` для генерации стабильных ID.

```tsx
function Tooltip({ children, content }) {
  const id = useId();
  return (
    <>
      <span aria-describedby={id}>{children}</span>
      {createPortal(
        <div id={id} role="tooltip">{content}</div>,
        document.body
      )}
    </>
  );
}
```

**React 18: createPortal принимает третий аргумент `key`** — нужен только при множественных Portal в одном parent (редко).

---

## 🧩 Задачи для закрепления

**Задача 1 — `<Modal>` через Portal**
Реализуй `<Modal isOpen onClose>`:
- Рендерится в `#modal-root` через Portal.
- Закрывается по `Escape`, клику на overlay, клику на `<button>×</button>`.
- Focus-trap: Tab внутри модалки циклически переходит по фокусируемым элементам, не выходя за пределы.
- При открытии — фокус на первом элементе. При закрытии — возвращается на триггер.
- Блокировка скролла body когда модалка открыта.

**Задача 2 — `<Toast>` система**
Реализуй `useToast()` хук, который позволяет вызвать `toast.success("Сохранено")`, `toast.error("Ошибка")`. Тосты:
- Рендерятся через Portal в `#toast-root`.
- Анимируются появлением/исчезновением.
- Автоматически закрываются через 3 секунды.
- Стэкаются друг под другом.

Используй Context для глобального доступа к `toast`.

**Задача 3 — `<Tooltip>` через Portal**
Тултип, который позиционируется относительно триггера (использует `getBoundingClientRect`). Появляется через Portal в `<body>` (чтобы не обрезался `overflow: hidden`). Поддержи placement: `top | bottom | left | right`. Не вылезай за границы экрана (auto-flip).

**Задача 4 — ErrorBoundary с разными fallback по типу ошибки**
Создай `<ErrorBoundary>` который различает типы ошибок:
- `NetworkError` → "Проверьте соединение" + кнопка retry.
- `AuthError` → редирект на /login.
- `NotFoundError` → 404-страница.
- Остальное → общий fallback.

Реализуй кастомные классы ошибок.

**Задача 5 — Глобальный + локальный ErrorBoundary**
Структура: `<App>` → `<Layout>` → `<Routes>` → конкретные страницы.
- Корневой ErrorBoundary — последний рубеж, показывает full-page error.
- На уровне Layout — ErrorBoundary вокруг `<main>`, чтобы Header/Sidebar остались.
- На уровне Route — индивидуальный ErrorBoundary для каждой страницы.
- На уровне виджета (например, `<UserMiniprofile>`) — мини-ErrorBoundary для виджета.

Покажи, как ошибка в виджете не уронит ни route, ни layout, ни app.

**Задача 6 — `<Drawer>` (slide-out panel)**
Боковая панель через Portal. Открывается слева/справа/сверху/снизу. Поддержи swipe-to-close на тач-устройствах. Когда открыта — кликом вне панели закрывается. Анимация — через CSS transform.
