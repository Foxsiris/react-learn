## 📝 Теория

### Что такое Context

Context — механизм React для передачи данных через дерево компонентов **без props на каждом уровне**. Решает проблему **prop drilling** — когда данные нужно прокинуть через 5 промежуточных компонентов, чтобы они дошли до целевого.

```
❌ Prop drilling
App → Page → Sidebar → UserMenu → Avatar (нужен user)
       │      │         │
       user ─→ user ──→ user

✅ Context
App (Provider value={user})
 │
 Page → Sidebar → UserMenu → Avatar (useContext → user)
```

### Базовый цикл работы

```tsx
// 1. Создание контекста с дефолтным значением
const ThemeContext = createContext<"light" | "dark">("light");

// 2. Provider — указывает значение для поддерева
function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Page />
    </ThemeContext.Provider>
  );
}

// 3. Потребление — useContext в любом компоненте поддерева
function Header() {
  const theme = useContext(ThemeContext);
  return <header className={theme}>...</header>;
}
```

**Правила:**
- Если потребитель **внутри Provider** — получает `value` из Provider.
- Если потребитель **вне Provider** — получает дефолт из `createContext(defaultValue)`.
- Любое изменение `value` → **все** потребители контекста ре-рендерятся.

---

### Когда использовать

✅ **Хорошие кейсы:**
- Тема (light/dark) — меняется редко, нужна везде.
- Локализация (i18n) — текущий язык.
- Авторизованный пользователь — `{ user, login, logout }`.
- Настройки приложения, конфиги.
- Хост-роутер, store-инстанс (как в Redux).

❌ **Плохие кейсы:**
- Часто обновляемые данные (например, текущая позиция мыши) — будет лагать.
- Большое state-дерево с гранулярными обновлениями — используй Zustand/Redux.
- Серверный state — используй React Query / SWR.

---

### Полный паттерн с TypeScript

```tsx
import { createContext, useContext, useState, useMemo, useCallback, ReactNode } from "react";

// 1. Определяем форму контекста
interface ThemeContextValue {
  theme: "light" | "dark";
  toggle: () => void;
  setTheme: (theme: "light" | "dark") => void;
}

// 2. Создаём контекст с null (вместо дефолта) — заставит проверять
const ThemeContext = createContext<ThemeContextValue | null>(null);

// 3. Хук-обёртка для безопасного использования
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used inside <ThemeProvider>");
  }
  return ctx;
}

// 4. Provider компонент
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const toggle = useCallback(() => {
    setTheme(t => t === "light" ? "dark" : "light");
  }, []);

  // Стабилизируем value, чтобы не перерисовывать всех потребителей
  const value = useMemo<ThemeContextValue>(
    () => ({ theme, toggle, setTheme }),
    [theme, toggle]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// 5. Использование
function App() {
  return (
    <ThemeProvider>
      <Header />
    </ThemeProvider>
  );
}

function Header() {
  const { theme, toggle } = useTheme();
  return (
    <button onClick={toggle}>
      Тема: {theme}
    </button>
  );
}
```

---

### Несколько контекстов

Каждый контекст — независим. Можно вкладывать произвольно.

```tsx
function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <I18nProvider>
          <RouterProvider>
            <Page />
          </RouterProvider>
        </I18nProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

// Антипаттерн "пирамида провайдеров" → объедини через хелпер
function compose(...providers: React.FC<{ children: ReactNode }>[]) {
  return ({ children }: { children: ReactNode }) =>
    providers.reduceRight((acc, P) => <P>{acc}</P>, <>{children}</>);
}

const AppProviders = compose(AuthProvider, ThemeProvider, I18nProvider, RouterProvider);

function App() {
  return <AppProviders><Page /></AppProviders>;
}
```

---

### Разделение data и actions (оптимизация)

При изменении только `actions` (`login`, `logout`) — компоненты-читатели `user` тоже перерисовываются. Решение — **разделить контексты**:

```tsx
const UserStateContext   = createContext<User | null>(null);
const UserActionsContext = createContext<UserActions | null>(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);

  // Actions — стабильные ссылки, никогда не меняются
  const actions = useMemo<UserActions>(() => ({
    login:  async (creds) => setUser(await api.login(creds)),
    logout: () => setUser(null),
  }), []);

  return (
    <UserActionsContext.Provider value={actions}>
      <UserStateContext.Provider value={user}>
        {children}
      </UserStateContext.Provider>
    </UserActionsContext.Provider>
  );
}

// Хуки
export const useUser        = () => useContext(UserStateContext);
export const useUserActions = () => useContext(UserActionsContext)!;

// Теперь компонент с useUserActions() НЕ перерисуется при смене user
function LogoutButton() {
  const { logout } = useUserActions();  // стабильно
  return <button onClick={logout}>Logout</button>;
}
```

---

### Селекторы — оптимизация на уровне компонента

Чтобы при изменении контекста **ре-рендерить только тех, кто реально использует** конкретное поле — нужны селекторы. React не предоставляет их встроенно (это плохо для контекста), но есть библиотеки:

```tsx
// use-context-selector — ре-рендер только если селектор вернул другое значение
import { createContext, useContextSelector } from "use-context-selector";

const AppContext = createContext({ user: null, theme: "light", cart: [] });

function ThemeBadge() {
  const theme = useContextSelector(AppContext, v => v.theme);  // только theme!
  return <span>{theme}</span>;
}
// Изменение user или cart — НЕ перерисовывает ThemeBadge
```

> ✅ Альтернатива — использовать **Zustand**: у него селекторы встроены и работают через подписку.

---

### Динамический Provider (значение зависит от пропсов)

```tsx
function FormProvider({ initialValues, children }) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});

  const value = useMemo(() => ({ values, errors, setValues, setErrors }), [values, errors]);

  return <FormContext.Provider value={value}>{children}</FormContext.Provider>;
}
```

---

### useReducer + Context — мини-Redux

```tsx
type State = { todos: Todo[]; filter: "all" | "active" | "done" };
type Action = { type: "ADD"; text: string } | { type: "TOGGLE"; id: number } | { type: "FILTER"; filter: State["filter"] };

const StateContext    = createContext<State | null>(null);
const DispatchContext = createContext<React.Dispatch<Action> | null>(null);

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ADD":    return { ...state, todos: [...state.todos, { id: Date.now(), text: action.text, done: false }] };
    case "TOGGLE": return { ...state, todos: state.todos.map(t => t.id === action.id ? { ...t, done: !t.done } : t) };
    case "FILTER": return { ...state, filter: action.filter };
  }
}

export function TodosProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, { todos: [], filter: "all" });
  return (
    <DispatchContext.Provider value={dispatch}>
      <StateContext.Provider value={state}>
        {children}
      </StateContext.Provider>
    </DispatchContext.Provider>
  );
}

export const useTodos    = () => useContext(StateContext)!;
export const useDispatch = () => useContext(DispatchContext)!;
```

---

## ⚠️ Подводные камни

### 1. Нестабильный value → все потребители ре-рендерятся

```tsx
// ❌ Каждый рендер Provider — НОВЫЙ объект → все потребители рендерятся
<ThemeContext.Provider value={{ theme, toggle }}>
  {children}
</ThemeContext.Provider>

// ✅ useMemo
const value = useMemo(() => ({ theme, toggle }), [theme, toggle]);
<ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
```

### 2. Один большой контекст для всего

```tsx
// ❌ Изменение любого поля → перерисовка ВСЕХ потребителей
<AppContext.Provider value={{ user, theme, cart, settings, notifications }}>

// ✅ Несколько контекстов по доменам
<UserContext.Provider value={user}>
  <ThemeContext.Provider value={theme}>
    <CartContext.Provider value={cart}>
```

### 3. useContext вне Provider возвращает дефолт

```tsx
const Ctx = createContext<User | null>(null);

function Comp() {
  const user = useContext(Ctx);
  user.name;  // 💥 TypeError: Cannot read 'name' of null
}

// ✅ Защита через хук-обёртку
function useUserContext() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("Wrap in <UserProvider>");
  return ctx;
}
```

### 4. Контекст — не для частых обновлений

```tsx
// ❌ Позиция мыши через контекст → каждый mousemove перерисовывает всё дерево потребителей
const MousePosCtx = createContext({ x: 0, y: 0 });

useEffect(() => {
  const onMove = (e) => setPos({ x: e.clientX, y: e.clientY });
  window.addEventListener("mousemove", onMove);
  return () => window.removeEventListener("mousemove", onMove);
}, []);

// ✅ Используй ref + событие, или Zustand с selector
```

### 5. Контекст не помогает с гранулярностью

Все потребители контекста ре-рендерятся при любом изменении value. Если нужна реактивность по конкретным полям — **используй сторы (Zustand/Redux/Jotai)**. Контекст — это про DI, не про реактивность.

### 6. `Provider value` нельзя пропускать

```tsx
// ❌ value === undefined
<ThemeContext.Provider>
  {children}
</ThemeContext.Provider>

// ✅ Всегда явно
<ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
```

### 7. Nesting providers — сохраняй порядок

Если `B` зависит от `A` (внутри `B` Provider читает `A`) — `A` должен быть **снаружи**:

```tsx
// ✅ AuthProvider читает RouterContext → Router снаружи
<RouterProvider>
  <AuthProvider>
    <App />
  </AuthProvider>
</RouterProvider>
```

---

## 🔬 Тонкие моменты

**Дефолтное значение `createContext` используется ТОЛЬКО вне Provider**

```tsx
const Ctx = createContext("default");

<Ctx.Provider value="provided">
  <Child />  {/* useContext(Ctx) → "provided" */}
</Ctx.Provider>

<Child />  {/* useContext(Ctx) → "default" */}
```

**`Context.Consumer` — устаревший API**

```tsx
// ❌ Старый паттерн (render prop)
<ThemeContext.Consumer>
  {theme => <span>{theme}</span>}
</ThemeContext.Consumer>

// ✅ Хук
const theme = useContext(ThemeContext);
```

**В React 19 — упрощённый синтаксис**

```tsx
// React 19+ — Provider можно использовать напрямую:
<ThemeContext value="dark">
  <App />
</ThemeContext>
// Без .Provider
```

**`useContext` подписывает компонент, даже если значение не используется**

```tsx
function Comp() {
  const ctx = useContext(BigCtx);  // подписан → перерисовка при любом изменении ctx
  return <div>nothing from ctx</div>;  // даже если не используем!
}

// ✅ Если не нужно — не вызывай хук
```

**Несколько React-приложений на странице**

Если у тебя несколько React-приложений (например, в микрофронтендах), у каждого своё дерево, и контексты не пересекаются. `createContext` создаёт уникальный объект.

**Контекст и SSR**

Контекст работает с SSR без проблем — Provider передаёт value на сервере, гидратация продолжает с тем же значением. Но не клади в контекст не-сериализуемые объекты, если планируешь передавать их через RSC.

---

## 🧩 Задачи для закрепления

**Задача 1 — i18n через контекст**
Реализуй провайдер для переключения языка. `LangContext` хранит `{ lang, setLang, t: (key) => string }`. `t` берёт перевод из ресурсов. Покажи переключение `ru ↔ en`. Используй `useMemo` для value.

**Задача 2 — CartContext**
Корзина: `addToCart`, `removeFromCart`, `clearCart`, `items`, `total`. Хедер показывает счётчик товаров. Карточка товара — кнопку "Добавить". Реализуй так, чтобы при добавлении товара перерисовался ТОЛЬКО хедер (через useMemo) и карточка с кнопкой меняла надпись.

**Задача 3 — Разделение state/actions**
Возьми существующий `<AuthProvider>` (где `user`, `login`, `logout` в одном контексте). Разнеси на два контекста: `UserStateContext` и `UserActionsContext`. Покажи в Profiler, что компоненты, использующие только actions, не перерисовываются при login.

**Задача 4 — useReducer + Context (мини-Redux)**
Реализуй todo-приложение с reducer-ом и двумя контекстами (state + dispatch). Действия: ADD, TOGGLE, REMOVE, FILTER. Покажи, что список и фильтр работают независимо.

**Задача 5 — compose providers**
Напиши хелпер `compose(...providers)` который превращает массив провайдеров в один. Применеи к 5+ провайдерам.

**Задача 6 — useContextSelector**
Поставь библиотеку `use-context-selector`. Сделай большой `<AppContext>` с user/theme/cart. Покажи в Profiler разницу: с `useContext` vs `useContextSelector(ctx, v => v.theme)`.

**Задача 7 — Hot reset контекста через key**
Реализуй кнопку "Сбросить всё", которая сбрасывает state контекстов. Идея: оберни Provider в `<div key={resetKey}>`, при клике увеличивай resetKey — Provider пересоздастся с дефолтным state.
