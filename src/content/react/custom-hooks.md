## 📝 Теория

### Что такое кастомный хук

Кастомный хук — обычная JavaScript-функция, которая:
1. Начинается с префикса `use` (`useFoo`, `useBar`).
2. Внутри использует другие хуки React (`useState`, `useEffect` и т.д.).
3. Может вызываться только из **компонента** или **другого хука**.

```tsx
function useCounter(initial = 0) {
  const [count, setCount] = useState(initial);
  const inc   = useCallback(() => setCount(c => c + 1), []);
  const dec   = useCallback(() => setCount(c => c - 1), []);
  const reset = useCallback(() => setCount(initial), [initial]);
  return { count, inc, dec, reset };
}

function App() {
  const { count, inc, dec } = useCounter(10);
  return (
    <>
      <p>{count}</p>
      <button onClick={inc}>+</button>
      <button onClick={dec}>−</button>
    </>
  );
}
```

### Зачем нужны кастомные хуки

- ✅ **Переиспользование логики** между компонентами без HOC/render-props.
- ✅ **Изоляция сложности** — компонент проще читать, логика — в хуке.
- ✅ **Тестируемость** — хук можно тестировать через `renderHook` (RTL).
- ✅ **Композиция** — комбинировать маленькие хуки в большие.

### Правила хуков (применяются и к кастомным)

1. **Только на верхнем уровне.** Не вызывать хуки в условиях, циклах, вложенных функциях.
2. **Только из React-функций.** Не из обычных функций — это хук React, ему нужен контекст.

```tsx
// ❌ Хук в условии
function useThing(flag: boolean) {
  if (flag) {
    return useState(0);  // ❌ нарушение
  }
}

// ✅ Условие внутри логики хука
function useThing(flag: boolean) {
  const [count, setCount] = useState(0);
  if (flag) return [count, setCount];
  return [0, () => {}];
}
```

ESLint-правило `react-hooks/rules-of-hooks` следит за этим автоматически.

---

### Палитра типичных кастомных хуков

#### useToggle

```tsx
function useToggle(initial = false) {
  const [value, setValue] = useState(initial);
  const toggle  = useCallback(() => setValue(v => !v), []);
  const setOn   = useCallback(() => setValue(true), []);
  const setOff  = useCallback(() => setValue(false), []);
  return [value, { toggle, setOn, setOff }] as const;
}

// Использование
const [isOpen, { toggle, setOff }] = useToggle();
<button onClick={toggle}>{isOpen ? "Закрыть" : "Открыть"}</button>
{isOpen && <Modal onClose={setOff} />}
```

#### useLocalStorage

```tsx
function useLocalStorage<T>(key: string, initialValue: T) {
  const [stored, setStored] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStored(prev => {
      const next = typeof value === "function" ? (value as (p: T) => T)(prev) : value;
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch (e) {
        console.error("localStorage error:", e);
      }
      return next;
    });
  }, [key]);

  // Синхронизация между вкладками
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === key && e.newValue) {
        try { setStored(JSON.parse(e.newValue)); } catch {}
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key]);

  return [stored, setValue] as const;
}
```

#### useDebounce

```tsx
function useDebounce<T>(value: T, delay = 500): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}

// Использование
const [query, setQuery] = useState("");
const debouncedQuery = useDebounce(query, 300);

useEffect(() => {
  if (debouncedQuery) fetchResults(debouncedQuery);
}, [debouncedQuery]);
```

#### useThrottle

```tsx
function useThrottle<T>(value: T, limit: number): T {
  const [throttled, setThrottled] = useState(value);
  const lastRan = useRef(Date.now());

  useEffect(() => {
    const now = Date.now();
    const diff = now - lastRan.current;
    
    if (diff >= limit) {
      setThrottled(value);
      lastRan.current = now;
    } else {
      const id = setTimeout(() => {
        setThrottled(value);
        lastRan.current = Date.now();
      }, limit - diff);
      return () => clearTimeout(id);
    }
  }, [value, limit]);

  return throttled;
}
```

#### useFetch

```tsx
function useFetch<T>(url: string, options?: RequestInit) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch(url, { ...options, signal: controller.signal })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setData)
      .catch(e => {
        if (e.name !== "AbortError") setError(e);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [url, JSON.stringify(options)]);  // упрощённо; лучше передать стабильный options через useMemo

  return { data, loading, error };
}
```

#### useClickOutside

```tsx
function useClickOutside<T extends HTMLElement>(handler: () => void) {
  const ref = useRef<T>(null);

  useEffect(() => {
    function listener(e: MouseEvent) {
      if (!ref.current || ref.current.contains(e.target as Node)) return;
      handler();
    }
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [handler]);

  return ref;
}

// Использование
function Dropdown() {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));

  return (
    <div ref={ref}>
      <button onClick={() => setOpen(!open)}>Меню</button>
      {open && <div className="menu">...</div>}
    </div>
  );
}
```

#### useMediaQuery

```tsx
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

// Использование
const isMobile = useMediaQuery("(max-width: 768px)");
```

#### useIntersectionObserver

```tsx
function useIntersectionObserver(options?: IntersectionObserverInit) {
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const [el, setEl] = useState<Element | null>(null);

  useEffect(() => {
    if (!el) return;
    const observer = new IntersectionObserver(([e]) => setEntry(e), options);
    observer.observe(el);
    return () => observer.disconnect();
  }, [el, JSON.stringify(options)]);

  return { ref: setEl, entry, isVisible: entry?.isIntersecting ?? false };
}

// Использование
function LazyImage({ src }) {
  const { ref, isVisible } = useIntersectionObserver({ threshold: 0.1 });
  return <img ref={ref} src={isVisible ? src : ""} />;
}
```

#### usePrevious

```tsx
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  useEffect(() => { ref.current = value; });
  return ref.current;
}

// Использование
function Counter({ count }: { count: number }) {
  const prev = usePrevious(count);
  return <p>Now: {count}, was: {prev ?? "—"}</p>;
}
```

#### useEventListener

```tsx
function useEventListener<K extends keyof WindowEventMap>(
  event: K,
  handler: (e: WindowEventMap[K]) => void,
  target: EventTarget = window
) {
  const handlerRef = useRef(handler);
  useEffect(() => { handlerRef.current = handler; });

  useEffect(() => {
    const listener = (e: Event) => handlerRef.current(e as any);
    target.addEventListener(event, listener);
    return () => target.removeEventListener(event, listener);
  }, [event, target]);
}

// Использование
useEventListener("keydown", e => {
  if (e.key === "Escape") closeModal();
});
```

#### useAsync — generic для async-операций

```tsx
function useAsync<T, Args extends any[]>(
  fn: (...args: Args) => Promise<T>
) {
  const [state, setState] = useState<{
    status: "idle" | "loading" | "success" | "error";
    data: T | null;
    error: Error | null;
  }>({ status: "idle", data: null, error: null });

  const run = useCallback(async (...args: Args) => {
    setState({ status: "loading", data: null, error: null });
    try {
      const data = await fn(...args);
      setState({ status: "success", data, error: null });
      return data;
    } catch (e) {
      setState({ status: "error", data: null, error: e as Error });
      throw e;
    }
  }, [fn]);

  return { ...state, run };
}

// Использование
const { status, data, run } = useAsync(api.getUser);
useEffect(() => { run(123); }, []);
```

---

### Композиция кастомных хуков

```tsx
// Маленькие хуки → большой хук
function useAuth() {
  const [user, setUser] = useLocalStorage<User | null>("user", null);
  const { run: login,  status: loginStatus  } = useAsync(api.login);
  const { run: logout } = useAsync(api.logout);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === "user" && !e.newValue) setUser(null);  // logout в другой вкладке
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [setUser]);

  return {
    user,
    isAuthed: !!user,
    isLoggingIn: loginStatus === "loading",
    login: async (creds: Creds) => {
      const u = await login(creds);
      setUser(u);
    },
    logout: async () => {
      await logout();
      setUser(null);
    },
  };
}
```

---

## ⚠️ Подводные камни

### 1. Имя без `use` — ESLint молчит

```tsx
// ❌ ESLint не проверяет правила хуков для функций без префикса use
function getCounter(initial = 0) {
  const [count, setCount] = useState(initial);  // правила не проверяются!
  return [count, setCount];
}

// ✅ Префикс use — обязателен
function useCounter(initial = 0) { /* ... */ }
```

### 2. Вызов хука условно

```tsx
// ❌ Условный вызов хука — нарушение
function useFeature(enabled: boolean) {
  if (!enabled) return null;  // ❌
  return useSomething();
}

// ✅ Всегда вызывай хук, потом ветви
function useFeature(enabled: boolean) {
  const data = useSomething();
  return enabled ? data : null;
}
```

### 3. Возврат JSX из хука = это уже компонент

```tsx
// ❌ JSX в хуке = компонент, должен называться с большой буквы
function useModal({ isOpen, children }) {
  return <div>{isOpen && children}</div>;  // это компонент Modal, не хук
}

// ✅ Если возвращает state/функции/значения — хук
function useModal() {
  const [isOpen, setOpen] = useState(false);
  return { isOpen, open: () => setOpen(true), close: () => setOpen(false) };
}
```

### 4. Stale closure в хуках

```tsx
// ❌ count замкнулось на 0 в setInterval
function useAutoIncrement() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setCount(count + 1), 1000);  // count всегда 0!
    return () => clearInterval(id);
  }, []);
  return count;
}

// ✅ Функциональное обновление
useEffect(() => {
  const id = setInterval(() => setCount(c => c + 1), 1000);
  return () => clearInterval(id);
}, []);
```

### 5. Бесконечные эффекты при нестабильных deps

```tsx
// ❌ options пересоздаётся каждый рендер → useFetch перезапускается бесконечно
function Component() {
  const { data } = useFetch("/api/users", { headers: { Authorization: "..." } });
}

// ✅ Стабилизируй опции
function Component() {
  const options = useMemo(() => ({ headers: { Authorization: "..." } }), []);
  const { data } = useFetch("/api/users", options);
}
```

### 6. Возврат массива vs объекта

```tsx
// Массив — позволяет переименовать через деструктуризацию (как useState)
const [count, setCount] = useState(0);

// Объект — лучше когда полей много (хук возвращает 5+ вещей)
const { data, loading, error, refetch, mutate } = useQuery(...);

// Не делай так:
const [data, loading, error, refetch, mutate] = useQuery(...);  // 5 значений по позиции — путаница
```

### 7. Не пропускай зависимости в useEffect

```tsx
// ❌ ESLint warning, stale closure в будущем
useEffect(() => {
  doSomething(prop);
}, []);  // prop пропущен!

// ✅ Все used переменные — в deps
useEffect(() => {
  doSomething(prop);
}, [prop]);
```

---

## 🔬 Тонкие моменты

**Каждый вызов хука — отдельный экземпляр**

```tsx
function App() {
  const c1 = useCounter(0);
  const c2 = useCounter(100);
  // c1 и c2 — независимые состояния
}
```

Это базовое свойство. Хук не "глобальный" — он живёт внутри компонента, в котором вызван.

**Хуки можно вызывать в other хуках, не только в компонентах**

```tsx
function useParent() {
  const child = useChild();  // ✅ можно
  return child;
}
```

**Хуки не подходят для shared state**

```tsx
// ❌ "Глобальный" state через хук — неработает
function useGlobalCounter() {
  const [count, setCount] = useState(0);
  return [count, setCount];
}
const A = () => { const [c] = useGlobalCounter(); }  // свой counter
const B = () => { const [c] = useGlobalCounter(); }  // другой counter
// A и B имеют разные счётчики, не общий

// ✅ Для shared state — Context или Zustand/Redux
```

**Обёртки над сторонними API**

Кастомные хуки часто служат "адаптером" над не-React API:

```tsx
// Обёртка над localStorage
useLocalStorage(key, initial)

// Обёртка над WebSocket
useWebSocket(url, onMessage)

// Обёртка над API клиентом
useApi(endpoint)
```

**Тестирование через `renderHook`**

```tsx
// React Testing Library
import { renderHook, act } from "@testing-library/react";

test("useCounter inc", () => {
  const { result } = renderHook(() => useCounter(0));
  expect(result.current.count).toBe(0);
  
  act(() => result.current.inc());
  expect(result.current.count).toBe(1);
});
```

**Хуки и Server Components (React 19)**

В RSC хуков **нет**. Кастомные хуки — только для Client Components (`"use client"`).

**Готовые библиотеки**

Не изобретай велосипед — используй проверенные:
- [usehooks-ts](https://usehooks-ts.com/) — TypeScript хуки
- [ahooks](https://ahooks.js.org/) — большая коллекция (Ant Design команда)
- [react-use](https://github.com/streamich/react-use) — самая большая
- [@uidotdev/usehooks](https://usehooks.com/) — collection by ui.dev

---

## 🧩 Задачи для закрепления

**Задача 1 — useForm**
Реализуй generic `useForm<T>(initialValues, options)` с:
- `values`, `errors`, `touched`.
- `setValue(field, value)`, `setError(field, error)`, `reset()`.
- `handleSubmit(onSubmit)` — валидация + вызов callback.
- Опционально: `validate: (values) => Errors`.

Должен работать с любой формой. TypeScript полностью типизирован.

**Задача 2 — useIntersectionObserver + Lazy Image**
Реализуй `useIntersectionObserver` (см. пример). На его основе сделай `<LazyImage src placeholder />` — изображение подгружается только когда попадает в viewport. Обработай отписку.

**Задача 3 — useWebSocket с reconnect**
Хук `useWebSocket(url)` со следующим поведением:
- Подключается к WebSocket при mount, отключается при unmount.
- Очередь сообщений, отправляются после connect.
- Auto-reconnect при разрыве (с exponential backoff).
- Возвращает: `{ status, sendMessage, lastMessage }`.

**Задача 4 — useUndoRedo<T>**
Хук, оборачивающий любое значение в историю undo/redo.
```tsx
const { state, set, undo, redo, canUndo, canRedo } = useUndoRedo({ value: "init" });
```
Поддержи: ограничение длины истории, очистка при `set` с заменой "future".

**Задача 5 — useKeyboardShortcut**
```tsx
useKeyboardShortcut("cmd+s", () => save());
useKeyboardShortcut("ctrl+shift+p", () => openCommandPalette());
```
Поддержи: cmd на Mac → ctrl на Windows; игнорирование при фокусе в input/textarea (опционально); множественные подписки на одну клавишу.

**Задача 6 — useDarkMode**
Хук с переключением темы:
- Дефолт берёт из системы (`prefers-color-scheme`).
- Можно переопределить вручную.
- Сохраняет выбор в localStorage.
- Применяет класс к `document.documentElement`.
- Слушает изменения системной темы (если пользователь не выбрал явно).

**Задача 7 — useAsync (extended)**
Расширь `useAsync` до полноценного хука для async-операций:
- `cancel` — отмена через AbortController.
- `retry` — повтор с задержкой.
- Кеширование результата по ключу.
- Stale-while-revalidate (показываем старое, пока грузим новое).

**Задача 8 — Композиция**
Используя 3+ маленьких хука (`useLocalStorage`, `useFetch`, `useDebounce`), собери `useSearch(query)` — хук поиска с автокомплитом и кешированием.
