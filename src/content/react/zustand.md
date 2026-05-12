## 📝 Теория

### Что такое Zustand

**Zustand** (нем. "состояние") — минималистичная библиотека state-менеджмента (~1KB gzipped). Создана командой [poimandres](https://github.com/pmndrs) (те же что react-three-fiber, jotai). Основные принципы:

- 🎯 **Никакого Provider** в корне — store работает как глобальная переменная (но с подпиской).
- 🎯 **Гранулярные подписки** через селекторы — компонент рендерится только при изменении нужного поля.
- 🎯 **Минимум boilerplate** — описываешь state и actions в одной функции.
- 🎯 **Совместимость с TS, Immer, persist, devtools, middleware**.
- 🎯 Под капотом — `useSyncExternalStore` (React 18) для безопасной интеграции.

### Когда выбрать Zustand

- ✅ Простой/средний проект, не хочешь Redux-boilerplate.
- ✅ Нужна гранулярность подписок без `use-context-selector` костылей.
- ✅ Несколько независимых сторов (mini-stores per feature).
- ✅ Нужен store вне React (тесты, утилиты).

### Когда не подходит

- ❌ Огромное приложение со строгими процессами (Redux + Redux Toolkit).
- ❌ Только серверный state — лучше React Query.
- ❌ Реактивность по графу (производные значения с цепной зависимостью) — лучше Jotai.

---

### Базовый цикл работы

```tsx
import { create } from "zustand";

interface CounterState {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
}

const useCounterStore = create<CounterState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
}));

// Использование
function Counter() {
  const count = useCounterStore((s) => s.count);
  const inc   = useCounterStore((s) => s.increment);
  
  return <button onClick={inc}>{count}</button>;
}
```

**Что происходит:**
1. `create(...)` создаёт store. Возвращает hook + методы (`getState`, `setState`, `subscribe`).
2. `useCounterStore((s) => s.count)` — подписывает компонент на поле `count`. При изменении других полей — нет рендера.
3. `inc()` вызывает `set` → новый state → подписчики уведомляются.

---

### `set` API — обновление state

```tsx
const useStore = create((set) => ({
  count: 0,
  user: { name: "Anon", age: 0 },
  
  // Объект — сливается со старым state (shallow merge)
  setCount: (count) => set({ count }),
  // эквивалент: set((state) => ({ ...state, count }))
  
  // Функция — есть доступ к prev state
  increment: () => set((state) => ({ count: state.count + 1 })),
  
  // ВНИМАНИЕ: shallow merge, вложенные объекты надо копировать вручную
  updateName: (name) => set((state) => ({
    user: { ...state.user, name }
  })),
  
  // Заменить state полностью (НЕ merge) — true вторым аргументом
  reset: () => set({ count: 0, user: { name: "Anon", age: 0 } }, true),
}));
```

### `get` API — чтение state в actions

```tsx
const useStore = create((set, get) => ({
  items: [],
  total: 0,
  
  addItem: (item) => {
    const items = [...get().items, item];
    set({ items, total: items.reduce((s, i) => s + i.price, 0) });
  },
  
  // Используй get() когда нужно текущее значение в action
  // (вместо передачи через set callback)
}));
```

---

### Селекторы — гранулярные подписки

```tsx
// ❌ Подписка на ВЕСЬ store — рендер при любом изменении
function Bad() {
  const store = useCartStore();  // объект целиком
  return <span>{store.items.length}</span>;
}

// ✅ Селектор — рендер только при изменении items
function Good() {
  const items = useCartStore((s) => s.items);
  return <span>{items.length}</span>;
}

// ✅ Возврат примитива — лучшая гранулярность
function Best() {
  const count = useCartStore((s) => s.items.length);
  return <span>{count}</span>;
}
```

### Множественные значения через `useShallow`

```tsx
import { useShallow } from "zustand/react/shallow";

// ❌ Объект из селектора — каждый рендер новая ссылка → лишние рендеры
const { name, email } = useUserStore((s) => ({ name: s.name, email: s.email }));

// ✅ useShallow — сравнение по shallow equal
const { name, email } = useUserStore(
  useShallow((s) => ({ name: s.name, email: s.email }))
);

// ✅ Или несколько вызовов
const name  = useUserStore((s) => s.name);
const email = useUserStore((s) => s.email);
```

---

### Async actions

Async-логика встраивается в actions без специальных оберток:

```tsx
const useUserStore = create<UserState>((set) => ({
  user: null,
  status: "idle",
  error: null,
  
  fetchUser: async (id: number) => {
    set({ status: "loading", error: null });
    try {
      const res = await fetch(`/api/users/${id}`);
      const user = await res.json();
      set({ user, status: "success" });
    } catch (e) {
      set({ status: "error", error: (e as Error).message });
    }
  },
}));

// Использование
const { user, status, fetchUser } = useUserStore();
useEffect(() => { fetchUser(42); }, [fetchUser]);
```

> Actions — **стабильные ссылки** между рендерами (не пересоздаются), их можно безопасно класть в deps.

---

### Middleware

Zustand имеет несколько встроенных middleware:

#### persist — сохранение в localStorage

```tsx
import { persist, createJSONStorage } from "zustand/middleware";

const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "light",
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "theme-storage",                  // ключ в localStorage
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ theme: state.theme }),  // что сохранять
      version: 1,                             // для миграций
      migrate: (persistedState, version) => { /* ... */ },
    }
  )
);
```

#### devtools — Redux DevTools Extension

```tsx
import { devtools } from "zustand/middleware";

const useStore = create<State>()(
  devtools(
    (set) => ({ count: 0, inc: () => set((s) => ({ count: s.count + 1 })) }),
    { name: "MyStore" }
  )
);

// Все set с именем action: set({ count: 1 }, false, "increment")
//                                                     ^^^^^^^^^^^
```

#### immer — мутируемая запись

```tsx
import { immer } from "zustand/middleware/immer";

const useStore = create<State>()(
  immer((set) => ({
    deeply: { nested: { value: 0 } },
    inc: () => set((state) => {
      state.deeply.nested.value++;  // безопасная "мутация" через Immer
    }),
  }))
);
```

#### Композиция middleware

```tsx
const useStore = create<State>()(
  devtools(
    persist(
      immer(
        (set) => ({/* ... */})
      ),
      { name: "store" }
    ),
    { name: "Store" }
  )
);
// Порядок важен: devtools → persist → immer → state
```

---

### Selector slice pattern (большие сторы)

Когда store большой, разделяй на slices:

```tsx
import { create, StateCreator } from "zustand";

// Slice 1
interface AuthSlice {
  user: User | null;
  login: (creds: Creds) => Promise<void>;
  logout: () => void;
}

const createAuthSlice: StateCreator<AuthSlice & CartSlice, [], [], AuthSlice> = (set) => ({
  user: null,
  login: async (creds) => { /* ... */ set({ user: ... }); },
  logout: () => set({ user: null }),
});

// Slice 2
interface CartSlice {
  items: Item[];
  add: (item: Item) => void;
  remove: (id: number) => void;
}

const createCartSlice: StateCreator<AuthSlice & CartSlice, [], [], CartSlice> = (set) => ({
  items: [],
  add: (item) => set((s) => ({ items: [...s.items, item] })),
  remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
});

// Композиция
export const useStore = create<AuthSlice & CartSlice>()((set, get, api) => ({
  ...createAuthSlice(set, get, api),
  ...createCartSlice(set, get, api),
}));
```

---

### Использование вне React (vanilla)

```tsx
// store.ts
const useCart = create<CartState>((set) => ({
  items: [],
  add: (item) => set((s) => ({ items: [...s.items, item] })),
}));

// Где-то в utils
useCart.getState().add(item);

// Подписка в обычном JS
const unsub = useCart.subscribe((state) => console.log("changed:", state));
unsub();  // отписка
```

---

### subscribeWithSelector — точечная подписка

```tsx
import { subscribeWithSelector } from "zustand/middleware";

const useStore = create<State>()(
  subscribeWithSelector(
    (set) => ({ count: 0, name: "" })
  )
);

// Подписка на конкретное поле с компаратором
const unsub = useStore.subscribe(
  (state) => state.count,        // селектор
  (count, prevCount) => {        // callback
    console.log("count:", prevCount, "→", count);
  },
  { equalityFn: Object.is, fireImmediately: true }
);
```

---

### Несколько сторов

В Zustand нет одного "глобального" store — можно создавать сколько угодно:

```tsx
// stores/cart.ts
export const useCartStore = create<CartState>(...);

// stores/auth.ts
export const useAuthStore = create<AuthState>(...);

// stores/theme.ts
export const useThemeStore = create<ThemeState>(...);

// Использование — где надо, импортируешь
function Header() {
  const cartCount = useCartStore((s) => s.items.length);
  const user      = useAuthStore((s) => s.user);
  const theme     = useThemeStore((s) => s.theme);
}
```

Это **прорыв** для архитектуры — каждая фича может иметь свой store, без необходимости лезть в глобальный rootReducer.

---

## ⚠️ Подводные камни

### 1. Подписка на весь стор без селектора

```tsx
// ❌ Рендер при ЛЮБОМ изменении
const store = useCartStore();

// ✅ Селектор
const items = useCartStore((s) => s.items);
```

### 2. Объект-селектор без useShallow

```tsx
// ❌ Каждый рендер — новый объект → лишние рендеры
const { a, b } = useStore((s) => ({ a: s.a, b: s.b }));

// ✅ useShallow или несколько вызовов
const { a, b } = useStore(useShallow((s) => ({ a: s.a, b: s.b })));
```

### 3. Shallow merge — вложенные объекты надо копировать

```tsx
const useStore = create((set) => ({
  user: { name: "Bob", address: { city: "NYC" } },
  
  // ❌ Shallow merge не копирует вложенный address
  updateCity: (city) => set({ user: { address: { city } } }),  // потеряет name!
  
  // ✅ Сам копируй
  updateCity: (city) => set((s) => ({
    user: { ...s.user, address: { ...s.user.address, city } }
  })),
  
  // ✅ Или используй immer middleware
  // (с immer middleware: state.user.address.city = city)
}));
```

### 4. Невнимательность к стабильности селекторов

```tsx
// ❌ Селектор-функция новая каждый рендер — Zustand обнаружит,
// но если внутри селектора создаёшь объект — будут лишние рендеры
const items = useStore((s) => s.items.filter(i => i.active));
// Каждый рендер — новый массив, даже если фактически не изменился

// ✅ Мемоизируй на уровне селектора через useMemo вне store
const items = useStore((s) => s.items);
const active = useMemo(() => items.filter(i => i.active), [items]);
```

### 5. Несериализуемые значения и persist

```tsx
// ❌ Date, Map, функции — JSON.stringify сломается
const useStore = create(persist(...))((set) => ({
  createdAt: new Date(),  // ❌ при загрузке Date станет string
  cb: () => {},          // ❌ функции не сериализуются
}));

// ✅ partialize — выбираем сериализуемые поля
persist(creator, {
  partialize: (state) => ({ count: state.count, name: state.name }),
})
```

### 6. Конфликт нескольких persist-ов на одном ключе

```tsx
const useA = create(persist(..., { name: "store" }));
const useB = create(persist(..., { name: "store" }));  // ❌ один ключ — конфликт
```

### 7. SSR и hydration

При SSR начальное значение store на сервере и клиенте может отличаться, что приведёт к hydration mismatch:

```tsx
// ❌ Может отличаться на server и client
const useStore = create(persist((set) => ({
  theme: "light",  // SSR: "light", клиент после hydration: "dark" из localStorage
}), { name: "theme" }));

// ✅ Используй "skipHydration" + явная hydrate в useEffect
const useStore = create(persist((set) => ({...}), {
  name: "theme",
  skipHydration: true,
}));

useEffect(() => { useStore.persist.rehydrate(); }, []);
```

---

## 🔬 Тонкие моменты

**Сравнение значений — Object.is (как в React)**

```tsx
const items = useStore((s) => s.items);
// Если ссылка items не изменилась — нет рендера
// Если изменилась (даже если содержимое то же) — рендер
```

**`fireImmediately` в subscribeWithSelector**

```tsx
useStore.subscribe(s => s.count, (count) => console.log(count), { fireImmediately: true });
// Вызывает callback сразу с текущим значением
```

**Тестирование stores**

```tsx
import { renderHook, act } from "@testing-library/react";

test("counter increments", () => {
  const { result } = renderHook(() => useCounterStore());
  expect(result.current.count).toBe(0);
  
  act(() => result.current.increment());
  expect(result.current.count).toBe(1);
});

// Сброс state между тестами:
beforeEach(() => useCounterStore.setState({ count: 0 }));
```

**Async actions не возвращают Promise по умолчанию**

```tsx
// Если хочешь await — возвращай Promise
const useStore = create((set) => ({
  load: async () => {
    const data = await fetch(...).then(r => r.json());
    set({ data });
    return data;  // ← await будет работать
  },
}));

const data = await useStore.getState().load();
```

**Создание store с props**

```tsx
const createBoundedStore = (initialCount: number) =>
  create<{ count: number; inc: () => void }>((set) => ({
    count: initialCount,
    inc: () => set((s) => ({ count: s.count + 1 })),
  }));

// Использование (один экземпляр на инстанс компонента — нужен Provider-паттерн)
```

**Сравнение Zustand vs Redux Toolkit**

| | Zustand | RTK |
|---|---|---|
| Размер | 1KB | 15KB |
| Boilerplate | Минимум | Средний |
| DevTools | Через middleware | Из коробки |
| Server state | Нет, отдельно (React Query) | RTK Query |
| Гранулярность | Через селекторы | Через `useSelector` |
| Нескольких сторов | Да, легко | Один глобальный |
| Provider | Не нужен | Нужен |
| Время на изучение | 10 минут | 1 день |

**Концептуально: Zustand — это эволюция useReducer + useContext**

В корне идея та же (state + actions), только:
- Нет Provider — store как singleton.
- Гранулярная подписка через `useSyncExternalStore`.
- API проще (нет actions/dispatch — просто методы).

---

## 🧩 Задачи для закрепления

**Задача 1 — Cart**
Реализуй store корзины: `items`, `total`, `add`, `remove`, `setQty`, `clear`. Используй селекторы для получения только `total` в `<Header>` и только `items` в `<CartPage>`. Покажи в Profiler, что Header не рендерится при изменении количества.

**Задача 2 — Persist**
Добавь `persist` middleware к корзине из задачи 1. Перезагрузи страницу — корзина сохраняется. Используй `partialize`, чтобы сохранять только `items` (без `loading`/`error` флагов).

**Задача 3 — Auth + DevTools**
Реализуй authStore с `user`, `token`, `login`, `logout`, `loadUser` (async). Подключи `devtools` middleware. Открой Redux DevTools Extension и time-travel.

**Задача 4 — Slice pattern**
Сделай большой store, разделённый на 3 slice: `auth`, `cart`, `ui`. Каждый slice — своя функция-creator. Объедини в один store. Покажи, как actions одного slice могут читать state другого через `get()`.

**Задача 5 — Несколько сторов**
Сделай 3 независимых store: `useCartStore`, `useAuthStore`, `useThemeStore`. Покажи, что они могут импортироваться независимо в разные компоненты.

**Задача 6 — Subscribe вне React**
Используй `useStore.subscribe` для слежения за состоянием в обычном JS-коде:
- При смене `auth.user` отправлять событие в analytics.
- При смене `cart.items` логировать в консоль.

**Задача 7 — Immer middleware**
Сделай store с глубоко вложенным state (например, `users[id].posts[id].comments`). С `immer` напиши action добавления комментария — сравни читаемость с обычным spread.

**Задача 8 — Тестирование**
Напиши unit-тесты для cart store через `renderHook` + `act`. Сбрасывай state между тестами. Покажи, что тесты не зависят от React.

**Задача 9 — Сравнение с Redux**
Возьми существующее приложение на Redux Toolkit (можно из задач RTK). Перепиши на Zustand. Сравни: количество строк кода, читаемость, performance.
