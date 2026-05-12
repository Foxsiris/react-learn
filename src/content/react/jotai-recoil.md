## 📝 Теория

### Что такое атомарный state

Классические state-менеджеры (Redux, Zustand) хранят **одно большое дерево state**. Атомарный подход: state разбит на маленькие независимые единицы — **атомы**. Компоненты подписываются на конкретные атомы, и React рендерит только их при изменении.

```
[Redux/Zustand]            [Jotai/Recoil]
┌─────────────────┐        ┌──────┐ ┌──────┐ ┌──────┐
│  state object   │        │ atom │ │ atom │ │ atom │
│  user, cart,    │   vs   │ user │ │ cart │ │ count│
│  theme, ...     │        └──────┘ └──────┘ └──────┘
└─────────────────┘            ↓        ↓        ↓
       ↓                    component component
   selector                  
       ↓
   component
```

**Преимущества:**
- 🎯 Нет глобального state-объекта — нет необходимости его проектировать заранее.
- 🎯 Идеально для **derived state** (производных значений) — атомы можно комбинировать в граф зависимостей.
- 🎯 Гранулярные подписки "из коробки" — компонент рендерится только при изменении используемых атомов.
- 🎯 Минимум boilerplate.

**Недостатки:**
- ⚠ Сложнее проектировать большие графы — легко запутаться.
- ⚠ Меньше DevTools-инструментария по сравнению с Redux.

### Jotai vs Recoil

| | Jotai | Recoil |
|---|---|---|
| Размер | ~3KB | ~20KB |
| Авторы | poimandres (small libs) | Facebook |
| Статус | Активно поддерживается | **Заархивирован** (Jan 2025) |
| TypeScript | First-class | Хороший |
| API | Минималистичный | Шире, больше понятий |
| Ассинхронные атомы | Простые `async` | `selector` + `useRecoilValueLoadable` |
| Provider | Опционально (для изоляции) | Обязательно (`<RecoilRoot>`) |

> ⚠️ Recoil заархивирован Meta в 2025 — для новых проектов выбирай Jotai.

---

## 🧬 Jotai

### Базовое использование

```tsx
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";

// Объявление атома (вне компонентов)
const countAtom = atom(0);

function Counter() {
  const [count, setCount] = useAtom(countAtom);
  return (
    <button onClick={() => setCount((c) => c + 1)}>
      {count}
    </button>
  );
}

// Только чтение
function Display() {
  const count = useAtomValue(countAtom);
  return <p>{count}</p>;
}

// Только запись (без подписки на изменения)
function Reset() {
  const setCount = useSetAtom(countAtom);
  return <button onClick={() => setCount(0)}>Reset</button>;
  // Этот компонент НЕ рендерится при изменении count
}
```

### Derived atoms (вычисляемые)

```tsx
const countAtom  = atom(0);
const doubleAtom = atom((get) => get(countAtom) * 2);  // только чтение
const sumAtom    = atom((get) => get(countAtom) + get(doubleAtom));

function Display() {
  const count  = useAtomValue(countAtom);
  const double = useAtomValue(doubleAtom);
  const sum    = useAtomValue(sumAtom);
  return <p>{count} × 2 = {double}, sum = {sum}</p>;
}

// Если изменится countAtom — пересчитаются double и sum
```

### Writable derived atom

```tsx
const tempCelsius = atom(0);
const tempFahrenheit = atom(
  (get) => get(tempCelsius) * 9 / 5 + 32,        // read
  (get, set, newValue: number) => {              // write
    set(tempCelsius, (newValue - 32) * 5 / 9);
  }
);

function FahrenheitInput() {
  const [f, setF] = useAtom(tempFahrenheit);
  return <input value={f} onChange={e => setF(Number(e.target.value))} />;
  // При вводе F → пересчитывается C → React реактивно обновляет всё
}
```

### Async atoms

```tsx
// Async read — возвращает Promise → используется через Suspense
const userAtom = atom(async (get) => {
  const id = get(userIdAtom);
  const res = await fetch(`/api/users/${id}`);
  return res.json();
});

function Profile() {
  const user = useAtomValue(userAtom);  // если ещё не загружен — Suspense
  return <p>{user.name}</p>;
}

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <Profile />
    </Suspense>
  );
}

// Без Suspense — useAtomValue с loadable
import { loadable } from "jotai/utils";

const userLoadable = loadable(userAtom);

function Profile() {
  const result = useAtomValue(userLoadable);
  // { state: "loading" | "hasData" | "hasError", data?, error? }
}
```

### Async write atom

```tsx
const fetchUserAtom = atom(
  null,                                   // read возвращает null (или текущий)
  async (get, set, id: number) => {       // write — async
    set(loadingAtom, true);
    try {
      const user = await fetch(`/api/users/${id}`).then(r => r.json());
      set(userAtom, user);
    } finally {
      set(loadingAtom, false);
    }
  }
);

const triggerFetch = useSetAtom(fetchUserAtom);
useEffect(() => { triggerFetch(42); }, []);
```

### atomWithStorage — persist

```tsx
import { atomWithStorage } from "jotai/utils";

const themeAtom = atomWithStorage<"light" | "dark">("theme", "light");
// Автоматически синхронизируется с localStorage
// Слушает события storage между вкладками

// Использование как обычно
const [theme, setTheme] = useAtom(themeAtom);
```

### atomFamily — параметризованные атомы

```tsx
import { atomFamily } from "jotai/utils";

// Создаёт атом для каждого ID
const userAtomFamily = atomFamily((id: number) =>
  atom(async () => {
    const res = await fetch(`/api/users/${id}`);
    return res.json();
  })
);

function User({ id }: { id: number }) {
  const user = useAtomValue(userAtomFamily(id));  // отдельный атом для id=42
  return <p>{user.name}</p>;
}
```

### Provider — изоляция (для тестов и SSR)

```tsx
import { Provider } from "jotai";

// По умолчанию атомы — глобальные (один store на приложение)
// Provider создаёт изолированный store

function App() {
  return (
    <Provider>
      <Page />
    </Provider>
  );
}

// В тестах — каждый тест свой Provider:
test("counter", () => {
  render(
    <Provider>
      <Counter />
    </Provider>
  );
});
```

### atomEffects — побочные эффекты на изменение

```tsx
import { atomEffect } from "jotai-effect";

const logEffect = atomEffect((get, set) => {
  const count = get(countAtom);
  console.log("count changed:", count);
});

// Активировать эффект — нужен подписчик
function Logger() {
  useAtom(logEffect);  // активирует эффект
  return null;
}
```

---

## 🐙 Recoil (legacy, для понимания)

> Recoil заархивирован — для новых проектов используй Jotai. Этот раздел — для понимания концепций и работы с legacy-кодом.

### atom + selector

```tsx
import { atom, selector, useRecoilState, useRecoilValue } from "recoil";

const textState = atom({
  key: "textState",       // уникальный ID
  default: "",
});

const charCountState = selector({
  key: "charCountState",
  get: ({ get }) => get(textState).length,
});

function Counter() {
  const [text, setText] = useRecoilState(textState);
  const count = useRecoilValue(charCountState);
  
  return (
    <>
      <input value={text} onChange={(e) => setText(e.target.value)} />
      <p>Length: {count}</p>
    </>
  );
}
```

### Async selector

```tsx
const userQuery = selector({
  key: "userQuery",
  get: async ({ get }) => {
    const id = get(userIdState);
    const res = await fetch(`/api/users/${id}`);
    return res.json();
  },
});

function Profile() {
  const user = useRecoilValue(userQuery);  // Suspense-based
  return <p>{user.name}</p>;
}
```

### Loadable

```tsx
import { useRecoilValueLoadable } from "recoil";

function Profile() {
  const userLoadable = useRecoilValueLoadable(userQuery);
  
  switch (userLoadable.state) {
    case "loading": return <Spinner />;
    case "hasError": return <Error />;
    case "hasValue": return <p>{userLoadable.contents.name}</p>;
  }
}
```

### atomFamily / selectorFamily

```tsx
import { atomFamily, selectorFamily } from "recoil";

const userById = selectorFamily({
  key: "userById",
  get: (id: number) => async () => {
    const res = await fetch(`/api/users/${id}`);
    return res.json();
  },
});

const user42 = useRecoilValue(userById(42));
```

---

## ⚠️ Подводные камни

### Jotai

**1. Атомы — глобальные по дефолту**

```tsx
const counterAtom = atom(0);
// Этот атом — singleton. Его state живёт глобально.
// Тесты разных компонентов могут "наследовать" state друг от друга.
// Решение: оборачивай тесты в свой <Provider>.
```

**2. Forget Provider — другой store у разных частей приложения**

```tsx
<Provider>
  <Header />  {/* свой store */}
</Provider>
<Provider>
  <Main />    {/* другой store! Разные атомы */}
</Provider>
// Случайно поделил приложение → state не синхронизирован
```

**3. Async-атом + Suspense — блокирует tree**

Если async-атом ещё загружается — Suspense fallback показывается **в ближайшем родителе с Suspense**. Если нет Suspense → ошибка.

```tsx
// ✅ Всегда оборачивай async-компоненты в Suspense
<Suspense fallback={<Spinner />}>
  <ComponentUsingAsyncAtom />
</Suspense>
```

**4. atom внутри компонента**

```tsx
// ❌ Атом, созданный в компоненте, пересоздаётся каждый рендер
function Comp() {
  const myAtom = atom(0);  // ❌ нарушает консистентность
  const [v, setV] = useAtom(myAtom);
}

// ✅ Если нужно создавать атомы динамически — useMemo
function Comp() {
  const myAtom = useMemo(() => atom(0), []);
  const [v, setV] = useAtom(myAtom);
}
```

**5. atomFamily — утечка памяти**

```tsx
// atomFamily кеширует все созданные атомы навечно
const userAtomFamily = atomFamily((id) => atom(...));

// Если ID-значения меняются часто (UUID) — память растёт бесконечно
// Решение: вручную удалять или указать ёмкость кеша
userAtomFamily.remove(oldId);
```

### Recoil

**1. Каждый atom/selector — нужен уникальный key**

Дублирование key → ошибка в runtime.

**2. Recoil — Suspense-first**

Если не используешь Suspense — нужен `useRecoilValueLoadable` для всех async.

**3. RecoilRoot обязателен**

В отличие от Jotai, Recoil не работает без `<RecoilRoot>`.

---

## 🔬 Тонкие моменты

**Jotai vs Zustand**

| | Jotai | Zustand |
|---|---|---|
| Подход | Атомы (graph) | Store (object) |
| Boilerplate | Минимум | Минимум |
| Derived state | Автоматический граф | useMemo вне store |
| Провайдер | Опционально | Не нужен |
| Async | Suspense-friendly | Обычные actions |
| Лучше для | Сложные derived зависимости | Простой глобальный state |
| Размер | 3KB | 1KB |

**Когда атомы выигрывают**

```tsx
// Сложные зависимости — атомы идеальны
const filterAtom    = atom("");
const itemsAtom     = atom<Item[]>([...]);
const filteredAtom  = atom((get) => get(itemsAtom).filter(i => i.match(get(filterAtom))));
const sortedAtom    = atom((get) => [...get(filteredAtom)].sort());
const pageAtom      = atom(1);
const pagedAtom     = atom((get) => {
  const sorted = get(sortedAtom);
  const page = get(pageAtom);
  return sorted.slice(page * 10, (page + 1) * 10);
});

// Каждый компонент подписывается на нужный атом — гранулярные обновления
```

**Jotai для UI state**

Из-за маленького API Jotai отлично подходит для UI state в компонентных библиотеках — каждый виджет может иметь свой атом без накладных расходов.

**Persist в Recoil**

```tsx
import { atomEffect } from "recoil";

const themeAtom = atom({
  key: "theme",
  default: "light",
  effects: [
    ({ setSelf, onSet }) => {
      const saved = localStorage.getItem("theme");
      if (saved) setSelf(saved);
      onSet((newValue) => localStorage.setItem("theme", newValue));
    },
  ],
});
```

**SSR в Jotai**

```tsx
import { Provider } from "jotai";

// На сервере: hydrate с initial values
<Provider initialValues={[
  [userAtom, initialUser],
  [themeAtom, initialTheme],
]}>
  <App />
</Provider>
```

---

## 🧩 Задачи для закрепления

**Задача 1 — Counter c derived (Jotai)**
Атомы: `count`, `double` (derived), `formatted` (derived → `"x: 5 → 10"`). 3 компонента, каждый подписан только на свой атом. Покажи в Profiler гранулярность.

**Задача 2 — Каталог с фильтрами**
Атомы: `productsAtom`, `categoryFilterAtom`, `priceRangeAtom`, `sortByAtom`, `pageAtom`. Derived: `filteredProductsAtom`, `pagedProductsAtom`. UI: панель фильтров + список + пагинация. Каждый компонент рендерится только при изменении нужного атома.

**Задача 3 — Async user profile**
Атом `userIdAtom`. Derived `userAtom = atom(async (get) => fetch(.../users/${get(userIdAtom)}))`. Используй `<Suspense>`. Кнопка "Сменить пользователя" меняет `userIdAtom` — Profile перезагружается.

**Задача 4 — atomFamily для постов**
`postFamily(id)` — async атом для каждого поста. Список постов — мап ID → `<Post id={id} />`. Каждый Post подписан на свой атом. Покажи дедупликацию: 5 компонентов с `postFamily(42)` → один HTTP-запрос.

**Задача 5 — Theme + persist**
`themeAtom = atomWithStorage("theme", "light")`. Кнопка переключения. Перезагрузка страницы — тема сохраняется. Открой две вкладки — изменение в одной отражается в другой.

**Задача 6 — Сравнение с Zustand**
Сделай корзину покупок:
1. На Zustand (store с items, total, add, remove).
2. На Jotai (атомы + derived total).

Сравни читаемость, гранулярность рендеров, размер кода.

**Задача 7 — Tabs c независимым state**
Tabs-компонент: `<Tabs />`, `<Tabs.Panel id="A">`. У каждой панели — свой `atomFamily(panelId)`. Перешли между вкладками — state каждой панели сохраняется.

**Задача 8 — Сетевой граф зависимостей**
Сделай 5 атомов с цепной зависимостью: `A → B → C → D → E`. Измени A — покажи, что E пересчитывается, и каждый промежуточный кешируется (B не пересчитывается, если A не изменилось).
