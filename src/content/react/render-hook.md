## 📝 Теория

### Зачем renderHook

Кастомные хуки — это функции, но запускать их можно только внутри React-компонента (правила хуков). `renderHook` из `@testing-library/react` создаёт минимальный компонент-обёртку, чтобы протестировать хук изолированно.

```tsx
import { renderHook, act } from "@testing-library/react";

test("useCounter инкрементирует", () => {
  const { result } = renderHook(() => useCounter());
  
  expect(result.current.count).toBe(0);
  
  act(() => result.current.increment());
  expect(result.current.count).toBe(1);
});
```

---

### renderHook — что возвращает

```tsx
const { result, rerender, unmount } = renderHook(
  (props) => useMyHook(props),
  { initialProps: { value: "initial" }, wrapper: MyProvider }
);

result.current;  // последнее возвращаемое значение хука
rerender(newProps);  // обновить аргументы
unmount();          // размонтировать (cleanup useEffect)
```

`result.current` — **текущее** значение. Не сохраняй в переменную:

```tsx
// ❌
const { count, increment } = result.current;
act(() => increment());
expect(count).toBe(0);  // count всё ещё старое значение

// ✅
const { result } = renderHook(() => useCounter());
expect(result.current.count).toBe(0);
act(() => result.current.increment());
expect(result.current.count).toBe(1);
```

---

### act — обёртка для state updates

```tsx
act(() => {
  result.current.increment();
  result.current.decrement();
});
// React обработает все обновления, потом выйдет из act
expect(result.current.count).toBe(0);
```

`act` гарантирует, что React закончил все обновления перед assertion.

В большинстве случаев — нужен.

---

### Async act

```tsx
await act(async () => {
  await result.current.fetchData();
});
expect(result.current.data).toEqual([...]);
```

Для async хуков — `await act(async () => ...)`.

Альтернатива — `waitFor`:

```tsx
result.current.fetchData();
await waitFor(() => expect(result.current.loading).toBe(false));
```

---

### Передача props и rerender

```tsx
test("useDebounce", () => {
  jest.useFakeTimers();
  
  const { result, rerender } = renderHook(
    ({ value, delay }) => useDebounce(value, delay),
    { initialProps: { value: "first", delay: 500 } }
  );
  
  expect(result.current).toBe("first");
  
  rerender({ value: "second", delay: 500 });
  expect(result.current).toBe("first");  // ещё не обновилось
  
  act(() => { jest.advanceTimersByTime(500); });
  expect(result.current).toBe("second");
});
```

---

### wrapper для Context

```tsx
const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider value={{ user: { name: "Test" } }}>
    {children}
  </AuthProvider>
);

const { result } = renderHook(() => useAuth(), { wrapper });
expect(result.current.user.name).toBe("Test");
```

С QueryClient:

```tsx
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

const { result } = renderHook(() => useUserQuery(1), { wrapper });
await waitFor(() => expect(result.current.isSuccess).toBe(true));
```

---

### Тест useState-based хука

```tsx
function useCounter(initial = 0) {
  const [count, setCount] = useState(initial);
  return {
    count,
    increment: () => setCount(c => c + 1),
    decrement: () => setCount(c => c - 1),
    reset: () => setCount(initial),
  };
}

test("useCounter", () => {
  const { result } = renderHook(() => useCounter(5));
  
  expect(result.current.count).toBe(5);
  
  act(() => result.current.increment());
  expect(result.current.count).toBe(6);
  
  act(() => result.current.reset());
  expect(result.current.count).toBe(5);
});
```

---

### Тест useEffect-based хука

```tsx
function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title;
  }, [title]);
}

test("useDocumentTitle", () => {
  const { rerender } = renderHook(({ title }) => useDocumentTitle(title), {
    initialProps: { title: "Home" },
  });
  expect(document.title).toBe("Home");
  
  rerender({ title: "Dashboard" });
  expect(document.title).toBe("Dashboard");
});
```

---

### Тест cleanup

```tsx
function useEventListener(event: string, handler: () => void) {
  useEffect(() => {
    window.addEventListener(event, handler);
    return () => window.removeEventListener(event, handler);
  }, [event, handler]);
}

test("cleanup", () => {
  const handler = jest.fn();
  const { unmount } = renderHook(() => useEventListener("click", handler));
  
  window.dispatchEvent(new Event("click"));
  expect(handler).toHaveBeenCalledTimes(1);
  
  unmount();
  
  window.dispatchEvent(new Event("click"));
  expect(handler).toHaveBeenCalledTimes(1);  // не вызван после unmount
});
```

---

### Тест async хука

```tsx
function useFetch<T>(url: string) {
  const [state, setState] = useState<{ data?: T; loading: boolean; error?: Error }>({ loading: true });
  
  useEffect(() => {
    let cancelled = false;
    fetch(url)
      .then(r => r.json())
      .then(data => { if (!cancelled) setState({ data, loading: false }); })
      .catch(error => { if (!cancelled) setState({ error, loading: false }); });
    return () => { cancelled = true; };
  }, [url]);
  
  return state;
}

test("useFetch success", async () => {
  global.fetch = jest.fn().mockResolvedValue({
    json: async () => ({ id: 1, name: "Test" }),
  }) as any;
  
  const { result } = renderHook(() => useFetch("/api/user"));
  
  expect(result.current.loading).toBe(true);
  
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.data).toEqual({ id: 1, name: "Test" });
});

test("useFetch error", async () => {
  global.fetch = jest.fn().mockRejectedValue(new Error("Network error")) as any;
  
  const { result } = renderHook(() => useFetch("/api/user"));
  
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.error?.message).toBe("Network error");
});

test("useFetch отмена при размонтировании", async () => {
  let resolveFn: (val: any) => void;
  global.fetch = jest.fn().mockReturnValue(
    new Promise(resolve => { resolveFn = resolve; })
  ) as any;
  
  const { result, unmount } = renderHook(() => useFetch("/api"));
  unmount();
  
  resolveFn!({ json: async () => ({}) });
  // setState не вызовется — нет ошибки "set state on unmounted"
});
```

---

### Тест useReducer

```tsx
test("useReducer", () => {
  const { result } = renderHook(() => useReducer(reducer, initialState));
  const [state, dispatch] = result.current;
  
  expect(state.count).toBe(0);
  
  act(() => result.current[1]({ type: "INCREMENT" }));
  expect(result.current[0].count).toBe(1);
});
```

---

### Тест useLocalStorage

```tsx
test("useLocalStorage", () => {
  // Setup
  localStorage.clear();
  
  const { result, rerender } = renderHook(() => useLocalStorage("key", "default"));
  
  expect(result.current[0]).toBe("default");
  
  // Запись
  act(() => result.current[1]("new value"));
  expect(result.current[0]).toBe("new value");
  expect(localStorage.getItem("key")).toBe(JSON.stringify("new value"));
  
  // Чтение из localStorage при mount
  localStorage.setItem("key2", JSON.stringify("from storage"));
  const { result: result2 } = renderHook(() => useLocalStorage("key2", "default"));
  expect(result2.current[0]).toBe("from storage");
});
```

---

### Тест useDebounce с fake timers

```tsx
test("useDebounce", () => {
  jest.useFakeTimers();
  
  const { result, rerender } = renderHook(
    ({ value }) => useDebounce(value, 500),
    { initialProps: { value: "a" } }
  );
  
  expect(result.current).toBe("a");
  
  rerender({ value: "ab" });
  rerender({ value: "abc" });
  expect(result.current).toBe("a");  // ещё не обновилось
  
  act(() => { jest.advanceTimersByTime(499); });
  expect(result.current).toBe("a");
  
  act(() => { jest.advanceTimersByTime(1); });
  expect(result.current).toBe("abc");
  
  jest.useRealTimers();
});
```

---

### Тест с Provider (Context)

```tsx
const ThemeContext = createContext<"light" | "dark">("light");
const useTheme = () => useContext(ThemeContext);

test("useTheme", () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <ThemeContext.Provider value="dark">{children}</ThemeContext.Provider>
  );
  
  const { result } = renderHook(() => useTheme(), { wrapper });
  expect(result.current).toBe("dark");
});
```

---

### Тест throw в хуке

```tsx
function useStrictAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("Must be in AuthProvider");
  return auth;
}

test("throws without provider", () => {
  // Подавляем console.error от React
  const spy = jest.spyOn(console, "error").mockImplementation(() => {});
  
  expect(() => renderHook(() => useStrictAuth())).toThrow("Must be in AuthProvider");
  
  spy.mockRestore();
});
```

---

### Тест async actions

```tsx
function useUser(id: string) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  
  const refetch = useCallback(async () => {
    setLoading(true);
    const data = await api.getUser(id);
    setUser(data);
    setLoading(false);
  }, [id]);
  
  return { user, loading, refetch };
}

test("useUser refetch", async () => {
  const { result } = renderHook(() => useUser("1"));
  
  await act(async () => {
    await result.current.refetch();
  });
  
  expect(result.current.user).toEqual({ id: "1", ... });
  expect(result.current.loading).toBe(false);
});
```

---

## ⚠️ Подводные камни

### 1. Деструктуризация result

```tsx
// ❌ Capture старого значения
const { result } = renderHook(() => useCounter());
const { count, increment } = result.current;
act(() => increment());
expect(count).toBe(0);  // count = старое значение, всё ещё 0

// ✅
expect(result.current.count).toBe(0);
act(() => result.current.increment());
expect(result.current.count).toBe(1);
```

### 2. Забытый act

```tsx
// ❌ Без act — React warning, неконсистентное состояние
result.current.increment();

// ✅
act(() => result.current.increment());
```

### 3. Async без await act

```tsx
// ❌ Тест может пройти раньше времени
act(() => { result.current.fetchData(); });

// ✅
await act(async () => { await result.current.fetchData(); });
// или
result.current.fetchData();
await waitFor(() => expect(result.current.loading).toBe(false));
```

### 4. State из closure в callbacks

Если хук возвращает callback, который использует state — закрытие может быть устаревшим:

```tsx
function useCounter() {
  const [count, setCount] = useState(0);
  // ❌ устаревший count в closure
  const log = () => console.log(count);
  return { count, setCount, log };
}

// При вызове log из ref — увидит старый count
```

Правильно — функциональные обновления / useRef.

### 5. fake timers и async

```tsx
// ❌
jest.useFakeTimers();
await waitFor(...);  // ждёт реального времени, но таймеры fake → бесконечно

// ✅
jest.useFakeTimers({ legacyFakeTimers: false });  // modern (default in Jest 27+)
// или
await act(async () => { jest.advanceTimersByTime(500); });
```

### 6. localStorage / sessionStorage не очищаются

```tsx
// Между тестами state в localStorage сохраняется
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});
```

### 7. Document.title между тестами

```tsx
// useDocumentTitle меняет document.title
afterEach(() => {
  document.title = "";
});
```

### 8. unmount не вызвался

`renderHook` не вызывает unmount автоматически. Если хук имеет cleanup, и тест проверяет cleanup — нужно явно `unmount()`.

### 9. useFetch без cancellation — warning

```tsx
// ⚠️ "Can't perform a state update on an unmounted component"
// Если хук не учитывает cancelled при unmount

// ✅ Хук должен иметь cleanup:
useEffect(() => {
  let cancelled = false;
  fetch(...).then(d => { if (!cancelled) setData(d); });
  return () => { cancelled = true; };
}, []);
```

### 10. RTL renderHook vs react-hooks-testing-library

`react-hooks-testing-library` — старая библиотека, теперь deprecated. Используй `renderHook` из `@testing-library/react` (v13+).

---

## 🔬 Тонкие моменты

**renderHook не рендерит JSX**

Под капотом — минимальный компонент:

```tsx
function TestComponent({ children }) {
  hookResult.current = children();
  return null;
}
```

**rerender vs новый renderHook**

```tsx
const { rerender } = renderHook(...);
rerender(newProps);  // ← тот же экземпляр, useState сохраняется

// vs
const { result: r1 } = renderHook(...);
const { result: r2 } = renderHook(...);
// два разных экземпляра, независимые
```

**Тест Suspense-based хуков**

```tsx
const wrapper = ({ children }) => (
  <Suspense fallback={<div>Loading</div>}>{children}</Suspense>
);

const { result } = renderHook(() => useSuspenseQuery(...), { wrapper });
// Ждём, пока Suspense разрешится
```

**Тест useSyncExternalStore**

```tsx
const store = createStore(...);

test("useStore", () => {
  const { result } = renderHook(() => useStore(store, s => s.count));
  
  expect(result.current).toBe(0);
  
  act(() => { store.setState({ count: 1 }); });
  expect(result.current).toBe(1);
});
```

**StrictMode в тестах**

```tsx
const wrapper = ({ children }) => <StrictMode>{children}</StrictMode>;
renderHook(..., { wrapper });
// Хук вызывается дважды → проверяет, что нет side effects в render
```

**typeof result.current**

```tsx
const { result } = renderHook<ReturnType<typeof useCounter>, void>(() => useCounter());
// Generic для типизации
```

**console.error в strict mode тестах**

React StrictMode логирует много warning. Подавляй или фильтруй:

```tsx
const error = jest.spyOn(console, "error").mockImplementation((msg, ...args) => {
  if (typeof msg === "string" && msg.includes("ignored warning")) return;
  console.warn(msg, ...args);
});
```

**Тест хука с timer + fake timers**

```tsx
jest.useFakeTimers();
const { result } = renderHook(() => useTimer(1000));
expect(result.current).toBe(0);
act(() => { jest.advanceTimersByTime(1000); });
expect(result.current).toBe(1);
jest.useRealTimers();
```

---

## 🧩 Задачи для закрепления

**Задача 1 — useCounter**
Простой хук с increment/decrement/reset. Тестируй каждый метод.

**Задача 2 — useToggle**
Хук [bool, toggle]. Тестируй initial value, toggle.

**Задача 3 — useLocalStorage**
Тестируй initial value, set, чтение из localStorage при mount, multi-tab sync (через storage event).

**Задача 4 — useDebounce**
Тестируй с fake timers: значение обновляется только после delay.

**Задача 5 — useFetch**
Тестируй success / error / cancellation при unmount.

**Задача 6 — useEventListener**
Тестируй subscribe/unsubscribe, cleanup при unmount.

**Задача 7 — useReducer-based**
Хук-обёртка над useReducer для todo. Тестируй каждый action.

**Задача 8 — useContext-based**
Тестируй с custom Provider. Verify throw error без Provider.

**Задача 9 — useQuery (React Query)**
Тестируй кастомный query hook. Используй QueryClient с retry: false. Mock fetch.

**Задача 10 — Custom auth hook**
useAuth() возвращающий { user, login, logout }. Тестируй с mocked api, провайдером, persistence.
