## 📝 Теория

### useState — type inference vs explicit

```tsx
// ✅ Type inference из initial value
const [count, setCount] = useState(0);          // number
const [name, setName] = useState("");           // string
const [user, setUser] = useState({ id: 1 });   // { id: number }

// ❌ Тип не выводится корректно
const [user, setUser] = useState(null);         // null (а потом не примет User)
const [items, setItems] = useState([]);          // never[]

// ✅ Явный тип когда initial недостаточно
const [user, setUser] = useState<User | null>(null);
const [items, setItems] = useState<string[]>([]);
const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
```

---

### useState с функцией-инициализатором

```tsx
// Lazy initial — TypeScript выводит из return type
const [data, setData] = useState(() => loadData());  // тип = ReturnType<typeof loadData>

// Явный generic при необходимости
const [data, setData] = useState<DataType>(() => loadData());
```

---

### Тип setState функции

```tsx
import { Dispatch, SetStateAction } from "react";

type SetCount = Dispatch<SetStateAction<number>>;
// = (value: number | ((prev: number) => number)) => void

// Передача setState в проп:
type ChildProps = {
  count: number;
  setCount: Dispatch<SetStateAction<number>>;
};
```

---

### useRef — три варианта

```tsx
// 1. DOM ref (подключаем к JSX)
const inputRef = useRef<HTMLInputElement>(null);
<input ref={inputRef} />
inputRef.current;  // HTMLInputElement | null

// 2. Mutable instance variable (НЕ для DOM)
const timerRef = useRef<number | null>(null);
const countRef = useRef<number>(0);  // current сразу 0, не null

// 3. ReturnType<typeof setTimeout> для timer
const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
timerRef.current = setTimeout(() => {}, 100);
```

---

### MutableRefObject vs RefObject

```tsx
import { RefObject, MutableRefObject } from "react";

// useRef<T>(null)        → RefObject<T>      (current: T | null, immutable)
// useRef<T>(initial)     → MutableRefObject<T> (current: T, mutable)
// useRef<T | null>(null) → MutableRefObject<T | null>

// RefObject — для DOM ref
function Input({ inputRef }: { inputRef: RefObject<HTMLInputElement> }) { ... }

// MutableRefObject — для instance variables
function Counter({ counterRef }: { counterRef: MutableRefObject<number> }) { ... }
```

---

### useReducer

```tsx
type State = {
  count: number;
  status: "idle" | "loading" | "error";
};

type Action =
  | { type: "INCREMENT" }
  | { type: "DECREMENT" }
  | { type: "SET_STATUS"; payload: State["status"] }
  | { type: "RESET" };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "INCREMENT": return { ...state, count: state.count + 1 };
    case "DECREMENT": return { ...state, count: state.count - 1 };
    case "SET_STATUS": return { ...state, status: action.payload };
    case "RESET": return { count: 0, status: "idle" };
    default:
      const _exhaustive: never = action;  // ← exhaustive check
      return state;
  }
};

const [state, dispatch] = useReducer(reducer, { count: 0, status: "idle" });

dispatch({ type: "INCREMENT" });
dispatch({ type: "SET_STATUS", payload: "loading" });
dispatch({ type: "INVALID" });  // ❌ TypeScript error
```

---

### Lazy initialization useReducer

```tsx
function init(initialCount: number): State {
  return { count: initialCount, status: "idle" };
}

const [state, dispatch] = useReducer(reducer, 5, init);
//                                      ↑ начальный аргумент   ↑ функция инициализации
// Полезно для дорогой инициализации (не пересчитывается на каждый рендер)
```

---

### useEffect / useLayoutEffect — типизация

```tsx
useEffect(() => {
  // setup
  return () => {
    // cleanup
  };
}, [deps]);

// Типизация cleanup автоматическая
useEffect(() => {
  const timer = setTimeout(() => { ... }, 1000);
  return () => clearTimeout(timer);
}, []);
```

⚠️ Async в useEffect:

```tsx
// ❌ Не возвращай Promise напрямую
useEffect(async () => { await ... }, []);  // Error

// ✅ Async внутри
useEffect(() => {
  (async () => {
    const data = await fetch(...);
    setData(data);
  })();
}, []);

// ✅ Или wrap
useEffect(() => {
  let cancelled = false;
  fetch(...).then(d => { if (!cancelled) setData(d); });
  return () => { cancelled = true; };
}, []);
```

---

### useCallback / useMemo

```tsx
const handler = useCallback((x: number) => doSomething(x), []);
// handler: (x: number) => void

const value = useMemo(() => expensiveCalc(items), [items]);
// value: ReturnType<typeof expensiveCalc>

// Явные типы:
const handler = useCallback<(x: number) => void>((x) => { ... }, []);
const value = useMemo<MyType>(() => calc(), [deps]);
```

---

### useContext

```tsx
const Ctx = createContext<User | null>(null);

function useUser() {
  const user = useContext(Ctx);
  if (!user) throw new Error("Must be inside UserProvider");
  return user;  // user: User (без null)
}

// Generic context factory
function createSafeContext<T>(name: string) {
  const Ctx = createContext<T | null>(null);
  
  function Provider({ value, children }: { value: T; children: ReactNode }) {
    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
  }
  
  function useCtx() {
    const v = useContext(Ctx);
    if (v === null) throw new Error(`${name} must be used inside Provider`);
    return v;
  }
  
  return [Provider, useCtx] as const;
}

const [UserProvider, useUserCtx] = createSafeContext<User>("User");
```

---

### Кастомные хуки — базовая типизация

```tsx
// Возвращаем кортеж — нужен `as const`
function useToggle(initial = false) {
  const [value, setValue] = useState(initial);
  const toggle = useCallback(() => setValue(v => !v), []);
  return [value, toggle] as const;
  // ↑ Без as const возвращалось бы (boolean | (() => void))[]
  // ↑ С as const — readonly [boolean, () => void]
}

const [isOpen, toggle] = useToggle();  // правильно типизировано

// Альтернатива — объект
function useToggle(initial = false) {
  const [value, setValue] = useState(initial);
  return { value, toggle: () => setValue(v => !v) };
}
const { value, toggle } = useToggle();
```

---

### Generic кастомный хук

```tsx
function useLocalStorage<T>(key: string, initial: T): [T, (val: T) => void] {
  const [val, setVal] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) as T : initial;
    } catch {
      return initial;
    }
  });
  
  const setValue = (v: T) => {
    setVal(v);
    localStorage.setItem(key, JSON.stringify(v));
  };
  
  return [val, setValue];
}

// Использование — T выводится из initial
const [user, setUser] = useLocalStorage("user", { name: "" });  // T = { name: string }

// Или явно
const [items, setItems] = useLocalStorage<string[]>("items", []);
```

---

### useFetch с типизацией

```tsx
type FetchState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: Error };

function useFetch<T>(url: string) {
  const [state, setState] = useState<FetchState<T>>({ status: "idle" });
  
  useEffect(() => {
    setState({ status: "loading" });
    let cancelled = false;
    
    fetch(url)
      .then(r => r.json() as Promise<T>)
      .then(data => { if (!cancelled) setState({ status: "success", data }); })
      .catch(error => { if (!cancelled) setState({ status: "error", error }); });
    
    return () => { cancelled = true; };
  }, [url]);
  
  return state;
}

// Использование
const state = useFetch<User>("/api/me");
if (state.status === "success") {
  state.data;  // typed as User
}
```

---

### useImperativeHandle

```tsx
type InputHandle = {
  focus: () => void;
  clear: () => void;
};

type InputProps = { ... };

const Input = forwardRef<InputHandle, InputProps>((props, ref) => {
  const inputRef = useRef<HTMLInputElement>(null);
  
  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    clear: () => { if (inputRef.current) inputRef.current.value = ""; },
  }), []);
  
  return <input ref={inputRef} {...props} />;
});

// Использование
const ref = useRef<InputHandle>(null);
ref.current?.focus();
```

---

### useSyncExternalStore

```tsx
function useStore<T, S>(store: { subscribe: (cb: () => void) => () => void; getSnapshot: () => T }, selector: (state: T) => S): S {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getSnapshot()),
  );
}
```

---

### useMap, useSet — типизированные коллекции

```tsx
function useMap<K, V>(initial?: [K, V][]) {
  const [map, setMap] = useState(() => new Map(initial));
  
  const set = useCallback((key: K, value: V) => {
    setMap(prev => new Map(prev).set(key, value));
  }, []);
  
  const remove = useCallback((key: K) => {
    setMap(prev => {
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
  }, []);
  
  const clear = useCallback(() => setMap(new Map()), []);
  
  return { map, set, remove, clear };
}

const { map, set } = useMap<string, User>();
set("u1", { id: "u1", name: "John" });
```

---

### useDebounce

```tsx
function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  
  return debounced;
}

const search = useDebounce(input, 500);  // T = string
```

---

### useEvent (latest callback pattern)

```tsx
function useEvent<T extends (...args: any[]) => any>(handler: T): T {
  const ref = useRef(handler);
  
  useLayoutEffect(() => {
    ref.current = handler;
  });
  
  return useCallback(((...args) => ref.current(...args)) as T, []);
}

// Использование
const onSubmit = useEvent((data: FormData) => {
  // всегда видит последние state, props
  console.log(data, currentState);
});
```

---

## ⚠️ Подводные камни

### 1. useState без типа для null/[] значений

```tsx
// ❌ Тип выведется как never[] / null
const [items, setItems] = useState([]);
setItems([1, 2, 3]);  // ❌ Type 'number' is not assignable to type 'never'

const [user, setUser] = useState(null);
setUser({ name: "John" });  // ❌ Не примет

// ✅
const [items, setItems] = useState<number[]>([]);
const [user, setUser] = useState<User | null>(null);
```

### 2. useRef<T>(null) vs useRef<T | null>(null)

```tsx
const ref1 = useRef<HTMLInputElement>(null);
ref1.current = newEl;  // ❌ readonly

const ref2 = useRef<HTMLInputElement | null>(null);
ref2.current = newEl;  // ✅

// useRef<T>(null) делает ref readonly (для DOM)
// useRef<T | null>(null) делает mutable
```

### 3. Кортеж без as const

```tsx
function useToggle() {
  return [value, toggle];  // (boolean | (() => void))[]
}

// ✅
function useToggle() {
  return [value, toggle] as const;  // readonly [boolean, () => void]
}
```

### 4. Зависимости useCallback/useMemo с типом

```tsx
const memo = useMemo(() => {
  return data.map(d => d.id);
}, [data]);

// Если data — any, memo тоже any
// Решение — типизируй data:
const data: Item[] = ...;
```

### 5. useEffect не должен возвращать Promise

```tsx
// ❌ async useEffect
useEffect(async () => { ... }, []);  // вернёт Promise → React выдаст warning

// ✅
useEffect(() => {
  (async () => { ... })();
}, []);
```

### 6. State changing type (any anti-pattern)

```tsx
// ❌
const [data, setData] = useState<any>(null);

// ✅ Discriminated union
const [state, setState] = useState<
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; data: User }
>({ status: "idle" });
```

### 7. setState в типе пропа — Dispatch<SetStateAction>

```tsx
// ❌ Слишком узко
type Props = { setCount: (n: number) => void };
// Тогда не сможешь передать setCount(c => c + 1)

// ✅
import { Dispatch, SetStateAction } from "react";
type Props = { setCount: Dispatch<SetStateAction<number>> };
```

### 8. useReducer без exhaustive check

```tsx
// ❌ Если забыли case — TypeScript не помогает
switch (action.type) {
  case "INC": ...
  // забыли DEC, SET_STATUS — баг
}

// ✅ Exhaustive check через never
switch (action.type) {
  case "INC": ...
  case "DEC": ...
  default:
    const _: never = action;  // если не все case покрыты — ошибка компиляции
    return state;
}
```

### 9. useImperativeHandle с устаревшим closure

```tsx
useImperativeHandle(ref, () => ({
  doSomething: () => console.log(state),  // ← state из closure
}), []);  // ← пустые deps → state замораживается

// ✅ Добавь state в deps или используй ref
useImperativeHandle(ref, () => ({
  doSomething: () => console.log(stateRef.current),
}), []);
```

### 10. Generic в кастомном хуке не выводится

```tsx
function useFetch<T>(url: string) { ... }

const data = useFetch("/api");  // T = unknown
const data = useFetch<User>("/api");  // ✅ Явно
```

---

## 🔬 Тонкие моменты

**ReactNode vs JSX.Element для callback props**

```tsx
// Если callback возвращает что-то для рендера — ReactNode
type Props = { renderItem: (item: T) => ReactNode };
```

**useState callback overload**

```tsx
useState<T>();           // T | undefined
useState<T>(initial);    // T
useState<T>(() => initial); // T
```

**SetStateAction — функция или значение**

```tsx
SetStateAction<T> = T | ((prev: T) => T);
```

**useReducer Dispatch type**

```tsx
import { Dispatch } from "react";
const [state, dispatch] = useReducer(reducer, init);
// dispatch: Dispatch<Action>
```

**Exhaustive switch trick**

```tsx
function assertNever(x: never): never {
  throw new Error(`Unexpected: ${x}`);
}
default: assertNever(action);  // компилятор + рантайм проверка
```

**useRef для callback ref**

```tsx
type CallbackRef<T> = (instance: T | null) => void;
const ref: CallbackRef<HTMLDivElement> = (el) => { ... };
```

**Custom hook возвращает promise**

```tsx
async function useAsyncFn<T>(fn: () => Promise<T>) {
  // useAsyncFn — не хук! Имена должны соответствовать use*, но это уже не хук
  // Хуки не возвращают Promise напрямую
}

// Правильнее:
function useAsync<T>(fn: () => Promise<T>) {
  const [state, setState] = useState<{ data?: T; loading: boolean; error?: Error }>({ loading: false });
  const run = useCallback(() => {
    setState({ loading: true });
    fn().then(data => setState({ data, loading: false }))
        .catch(error => setState({ error, loading: false }));
  }, [fn]);
  return { ...state, run };
}
```

**Generic хук с дефолтом**

```tsx
function useStorage<T = string>(key: string, initial: T): [T, (v: T) => void] {
  // T defaults to string if not provided
}
```

**typeof для useRef со значением**

```tsx
const ref = useRef(0);  // MutableRefObject<number>
const ref = useRef<number>();  // MutableRefObject<number | undefined>
```

---

## 🧩 Задачи для закрепления

**Задача 1 — useToggle**
Хук возвращает [boolean, () => void]. Используй as const. Верни также setOpen, setClose явно.

**Задача 2 — useLocalStorage<T>**
Generic хук, синхронизирующийся с localStorage. Поддержи set, remove, clear. Корректная типизация для T.

**Задача 3 — useFetch<T>**
Хук с discriminated union state: idle, loading, success(data), error(err). T выводится из generic.

**Задача 4 — useReducer с exhaustive check**
Реализуй reducer для todo-list (add, remove, toggle, edit, clearCompleted). Используй never в default для exhaustive check.

**Задача 5 — useMap<K, V>**
Хук, оборачивающий Map. Методы: get, set, delete, clear, has, size. Полная типизация для K, V.

**Задача 6 — useDebounce<T>**
Generic debounce хук. Должен работать для string, number, object.

**Задача 7 — useImperativeHandle типизация**
Реализуй Input компонент с handle: focus, clear, getValue. Типизируй handle через interface.

**Задача 8 — Generic context factory**
Функция createContext<T>(name) → [Provider, useCtx]. Гарантия non-null в useCtx (throw если outside provider).

**Задача 9 — useEvent (latest callback)**
Реализуй useEvent<T>(callback) → stable reference, всегда вызывает latest. Корректно типизируй generic T.

**Задача 10 — useAsync с runner**
Хук, возвращающий { data, loading, error, run }. run — функция, запускающая async операцию. T выводится автоматически.
