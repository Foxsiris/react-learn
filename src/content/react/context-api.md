> Базовое использование `useContext` подробно разобрано в useContext. Здесь — взгляд на Context **как на инструмент state management**: оптимизации, паттерны, ограничения и сравнение с другими решениями.

---

## 📝 Теория

### Context — это не state-менеджер

Многие используют Context как "бесплатный Redux", но это ошибка. Context — это **dependency injection**: способ "опустить" значение в дерево, минуя пропсы. Реактивности на уровне полей в Context нет — любое изменение `value` перерисовывает **всех** потребителей.

```
Provider value={A}     →  все useContext рендерятся
Provider value={B}     →  все useContext рендерятся
Provider value={A, B}  →  изменение A или B → все useContext рендерятся
```

### Почему "плохо для частых обновлений"

```tsx
// ❌ ANTI-PATTERN: позиция мыши через Context
const MousePosCtx = createContext({ x: 0, y: 0 });

function MousePosProvider({ children }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const onMove = (e) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);
  return <MousePosCtx.Provider value={pos}>{children}</MousePosCtx.Provider>;
}

function Crosshair() {
  const { x, y } = useContext(MousePosCtx);  // обновляется на каждое движение
  // Все потребители рендерятся 60+ раз в секунду
}
```

Решения для частых обновлений:
- **Zustand с селектором** (фильтрует по ravnstvu).
- **Ref-based subscription** — храним state в ref, оповещаем подписчиков напрямую.
- **use-context-selector** — патчит React и добавляет селекторы для Context.

---

### Архитектурные паттерны Context

#### 1. State + Dispatch разделение

```tsx
const StateCtx    = createContext<State | null>(null);
const DispatchCtx = createContext<Dispatch<Action> | null>(null);

export function Provider({ children }) {
  const [state, dispatch] = useReducer(reducer, initial);
  return (
    <DispatchCtx.Provider value={dispatch}>
      <StateCtx.Provider value={state}>{children}</StateCtx.Provider>
    </DispatchCtx.Provider>
  );
}

export const useState = () => useContext(StateCtx)!;
export const useDispatch = () => useContext(DispatchCtx)!;
```

**Зачем:** компоненты, использующие только `dispatch` (например, кнопки-actions), не перерисовываются при изменении state. `dispatch` — стабильная ссылка от `useReducer`.

#### 2. Несколько контекстов по доменам

```tsx
// ❌ Один God-context
<AppContext.Provider value={{ user, theme, cart, settings }}>

// ✅ Разделено по ответственности
<AuthProvider>
  <ThemeProvider>
    <CartProvider>
      <SettingsProvider>
        <App />
```

При изменении cart-а — перерисовываются только потребители CartContext.

#### 3. Provider-фабрики (динамические провайдеры)

```tsx
function FormProvider({ initialValues, validate, children }) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});

  const setField = useCallback((name, value) => {
    setValues(v => ({ ...v, [name]: value }));
  }, []);

  const value = useMemo(() => ({ values, errors, setField }), [values, errors, setField]);

  return <FormContext.Provider value={value}>{children}</FormContext.Provider>;
}

// Несколько форм на странице — каждая со своим контекстом
<FormProvider initialValues={{ email: "" }}>
  <SignupForm />
</FormProvider>

<FormProvider initialValues={{ search: "" }}>
  <SearchForm />
</FormProvider>
```

#### 4. Context + ref для subscriber-pattern (без ре-рендеров)

```tsx
type Subscriber<T> = (value: T) => void;

interface Store<T> {
  get: () => T;
  set: (next: T) => void;
  subscribe: (s: Subscriber<T>) => () => void;
}

function createStore<T>(initial: T): Store<T> {
  let value = initial;
  const subs = new Set<Subscriber<T>>();
  return {
    get: () => value,
    set: (next) => { value = next; subs.forEach(s => s(value)); },
    subscribe: (s) => { subs.add(s); return () => { subs.delete(s); }; },
  };
}

const StoreCtx = createContext<Store<any> | null>(null);

function useStoreSelector<T, R>(selector: (state: T) => R): R {
  const store = useContext(StoreCtx)!;
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.get())
  );
}
```

Это — суть того, как работают Zustand/Redux. Ниже мы это сравним.

---

### `useSyncExternalStore` — нативное решение для гранулярных подписок

React 18 ввёл хук `useSyncExternalStore`, специально для интеграции с внешними сторами (Redux, Zustand используют его под капотом):

```tsx
const value = useSyncExternalStore(
  subscribe,        // (callback) => unsubscribe
  getSnapshot,      // () => current value
  getServerSnapshot // () => SSR-value (опционально)
);
```

С его помощью можно сделать "Context с гранулярностью":

```tsx
// Создаём ref-based store
const storeRef = useRef({ items: [], total: 0 });
const subscribers = useRef(new Set<() => void>());

const subscribe = useCallback((cb: () => void) => {
  subscribers.current.add(cb);
  return () => subscribers.current.delete(cb);
}, []);

const set = (next) => {
  storeRef.current = next;
  subscribers.current.forEach(cb => cb());
};

// В дочернем компоненте
function CartItemsCount() {
  const count = useSyncExternalStore(
    subscribe,
    () => storeRef.current.items.length
  );
  // Рендерится ТОЛЬКО когда меняется items.length
  return <span>{count}</span>;
}
```

---

### Сравнение Context vs внешний store

| | Context | Zustand/Redux |
|---|---|---|
| Гранулярность подписок | Нет (без `use-context-selector`) | Да (через селекторы) |
| DevTools | Нет | Да |
| Persist | Сам пишешь | Middleware |
| SSR | Через value | Через hydration |
| Boilerplate | Мало (для простого) | От малого до большого |
| Лучше для | DI: тема, локаль, auth | Сложный реактивный state |
| Размер | 0 (встроено) | 1KB / 15KB |

---

### Антипаттерны

```tsx
// 1. ❌ Всё в одном контексте
<AppContext.Provider value={{ user, theme, cart, settings, posts, comments }}>

// 2. ❌ Часто меняющиеся данные
<MousePosContext.Provider value={mousePosition}>  // 60 fps → лаг

// 3. ❌ Серверные данные в Context
const PostsContext = createContext(null);
function PostsProvider({ children }) {
  const [posts, setPosts] = useState([]);
  useEffect(() => fetch("/posts").then(r => r.json()).then(setPosts), []);
}
// ✅ Это работа React Query / SWR

// 4. ❌ Контекст без useMemo
<ThemeContext.Provider value={{ theme, setTheme }}>
//   ↑ новый объект каждый рендер → все потребители рендерятся
```

---

## ⚠️ Подводные камни

### 1. Любое изменение value → все useContext рендерятся

Это ОСОБЕННОСТЬ, не баг. Запомни и проектируй с этим в голове.

### 2. useMemo на value — обязателен

```tsx
const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);
```

### 3. `useContext` подписывает компонент даже если значение не используется

```tsx
function Comp() {
  const ctx = useContext(BigCtx);  // подписан → перерисовка при любом изменении ctx
  return <div>nothing from ctx</div>;
}
```

### 4. Default value в createContext != fallback

```tsx
const Ctx = createContext("default");

<App />  // вне Provider → получит "default"
<Provider><App /></Provider>  // получит value Provider
```

Не путай `null` и `undefined` — это разные значения.

### 5. Forbidden inside Provider's value

Не клади в value:
- Промисы (compone не реактивен к их разрешению).
- Не-сериализуемые объекты (для SSR).
- Большие неизменяемые конфиги (загромождают snapshot).

### 6. Иерархия Provider-ов важна

Если `B` зависит от значения `A` через хук `useA()` внутри `BProvider` — `A` должен быть СНАРУЖИ `B`:

```tsx
<RouterProvider>
  <AuthProvider>  {/* AuthProvider использует useRouter() */}
    <App />
```

---

## 🔬 Тонкие моменты

**Context-stacking (сила композиции)**

```tsx
function ComposeProviders({ providers, children }) {
  return providers.reduceRight(
    (acc, Provider) => <Provider>{acc}</Provider>,
    <>{children}</>
  );
}

<ComposeProviders providers={[AuthProvider, ThemeProvider, I18nProvider]}>
  <App />
</ComposeProviders>
```

**Performance bailout — если value не изменилось**

Если ты передаёшь стабильный value (например, через `useState`/`useReducer`), и React видит, что `Object.is(prevValue, nextValue) === true` — потребители не перерисовываются.

**`use(Context)` — новый хук React 19**

```tsx
// React 19+
import { use } from "react";
const value = use(MyContext);
// Можно вызывать в условных блоках! (в отличие от useContext)
if (cond) {
  const value = use(MyContext);  // OK
}
```

**SSR + Context работают идеально**

Provider передаёт value на сервере, hydrate использует ту же DOM-структуру. Главное — детерминированные значения (не `Math.random()` без useId).

**TypeScript: `null`-default vs полный объект**

```tsx
// Подход A: null default + хук-обёртка
const Ctx = createContext<Value | null>(null);
function useValue() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("Wrap in Provider");
  return ctx;
}

// Подход B: dummy default
const dummy: Value = { ... };
const Ctx = createContext<Value>(dummy);
// Если используется без Provider — получит dummy (тихо)
```

Подход A безопаснее — заметишь ошибку сразу.

---

## 🧩 Задачи для закрепления

**Задача 1 — Auth + защищённые роуты**
Реализуй `<AuthProvider>` с состояниями `idle | loading | authed | error`. Хук `useAuth()` возвращает `{ user, status, login, logout }`. Создай `<ProtectedRoute>` который редиректит на `/login` если пользователь не залогинен.

**Задача 2 — Раздели State и Dispatch**
Возьми существующий "большой" Context и раздели на `StateCtx` + `DispatchCtx`. Замерь рендеры в Profiler "до" и "после" — кнопка "выйти" не должна перерисовываться при смене темы.

**Задача 3 — Композиция Provider-ов**
Создай 5 провайдеров (Auth, Theme, I18n, Router, Toast). Напиши хелпер `compose(...providers)` для удобной обёртки. Покажи разницу в DevTools — обычная пирамида vs скомпозированный.

**Задача 4 — useContextSelector**
Поставь `use-context-selector`. Сделай `<UserContext>` с полями `{ id, name, email, avatar, settings }`. В Profiler покажи, что компонент с `useContextSelector(ctx, c => c.name)` не перерисовывается при изменении `email`.

**Задача 5 — useSyncExternalStore + ref-based store**
Реализуй мини-Zustand на 50 строк через `useSyncExternalStore` и ref. API: `createStore(initial)` → `useStore(selector)`. Сравни с обычным Context на 1000 итерациях обновления.

**Задача 6 — Динамический Provider**
Реализуй `<FormProvider initialValues schema>` который создаёт Context для одной формы. Несколько форм могут быть на одной странице независимо (вложенные Provider-ы для шагов wizard'а).

**Задача 7 — Context-based mini-router**
Сделай `<Router>` с маршрутами через Context. `useRoute()` возвращает текущий path. `<Link>` обновляет путь через `dispatch`. Не используй react-router.
