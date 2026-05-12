## 📝 Теория

### Что такое Concurrent Rendering

**Concurrent Rendering** (раньше называлось "Concurrent Mode") — фундаментальное изменение в React 18: render может быть **прерван, отложен и продолжен**. До этого rendering был синхронным — раз начали, не остановишь до конца.

### Зачем

Без concurrent: тяжёлый rendering (например, 200ms) **блокирует UI**. Пользователь печатает в input — ничего не происходит, пока React не закончит рендер.

С concurrent: React **прерывает** рендер, обрабатывает срочные события (ввод), потом возвращается к рендеру.

```
Sync rendering (React 17):
[render 200ms ─────────────] [click reacts]
                    user clicks here, ждёт 100ms

Concurrent rendering (React 18):
[render 50ms] [click handled] [render 50ms] [render 50ms] [render 50ms]
              ↑ instant
```

### Включение

Concurrent rendering активируется через **`createRoot`**:

```tsx
// React 18+ — concurrent ON
import { createRoot } from "react-dom/client";

const root = createRoot(document.getElementById("root")!);
root.render(<App />);

// ❌ Старый ReactDOM.render — НЕТ concurrent
ReactDOM.render(<App />, container);
```

После этого появляются **возможности**, но они не используются автоматически — нужно явно помечать обновления.

---

### Архитектура: 2 типа обновлений

В Concurrent React все обновления делятся на две категории:

#### 1. Urgent (срочные)

Обычные `setState` — обрабатываются немедленно, синхронно. UI должен реагировать сразу.

```tsx
function onChange(e) {
  setQuery(e.target.value);  // urgent — пользователь вводит, должен видеть сразу
}
```

#### 2. Transition (переход)

Обернутые в `startTransition` — могут быть отложены/прерваны.

```tsx
function onChange(e) {
  setQuery(e.target.value);  // urgent: ввод
  
  startTransition(() => {
    setFilteredResults(filter(e.target.value));  // transition: фильтрация может ждать
  });
}
```

При новом срочном обновлении — старая transition может быть **выкинута**.

---

### `useTransition` — с pending state

```tsx
import { useTransition } from "react";

function Filter() {
  const [query, setQuery] = useState("");
  const [list, setList] = useState(items);
  const [isPending, startTransition] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);  // ← urgent

    startTransition(() => {
      setList(items.filter(i => i.name.includes(e.target.value)));  // ← transition
    });
  }

  return (
    <>
      <input value={query} onChange={onChange} />
      {isPending && <Spinner />}
      <ul style={{ opacity: isPending ? 0.5 : 1 }}>
        {list.map(i => <li key={i.id}>{i.name}</li>)}
      </ul>
    </>
  );
}
```

---

### `startTransition` (standalone)

Если не нужен `isPending`:

```tsx
import { startTransition } from "react";

function Tab({ id }) {
  return (
    <button onClick={() => {
      startTransition(() => {
        setActiveTab(id);  // переключение — низкий приоритет
      });
    }}>
      Tab {id}
    </button>
  );
}
```

---

### `useDeferredValue` — отложенное значение

Похож на debounce, но **управляется React**:

```tsx
function SearchResults({ query }) {
  const deferredQuery = useDeferredValue(query);
  // deferredQuery отстаёт от query во время тяжёлого рендера
  
  const isStale = query !== deferredQuery;
  const results = useMemo(() => heavySearch(deferredQuery), [deferredQuery]);
  
  return (
    <div style={{ opacity: isStale ? 0.5 : 1 }}>
      {results.map(...)}
    </div>
  );
}
```

См. подробнее: useId, useDeferredValue, useTransition.

---

### Suspense — асинхронный рендер

Concurrent позволяет компоненту "приостановить" рендер, если данных ещё нет:

```tsx
function UserProfile({ id }: { id: number }) {
  // Если данные грузятся — компонент "suspends" → Suspense fallback
  const user = use(getUserPromise(id));  // React 19
  // или
  const { data: user } = useSuspenseQuery({ queryKey: ["user", id], queryFn: ... });
  
  return <p>{user.name}</p>;
}

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <UserProfile id={42} />
    </Suspense>
  );
}
```

Под капотом: компонент `throw new Promise(...)` → Suspense ловит → fallback. Когда promise resolves → React пробует снова.

### Suspense + transition — без "loading flash"

```tsx
function App() {
  const [tab, setTab] = useState("home");
  
  return (
    <>
      <button onClick={() => startTransition(() => setTab("profile"))}>Profile</button>
      <Suspense fallback={<Spinner />}>
        {tab === "home" ? <Home /> : <Profile />}
      </Suspense>
    </>
  );
}
// При смене tab внутри transition — Suspense НЕ показывает spinner
// Старый контент остаётся, пока новый не загрузился
```

---

### Что под капотом

Concurrent — это:

1. **Fiber reconciler** — итеративный обход дерева, можно прерывать.
2. **Lane model** — каждое обновление имеет приоритет (lane).
3. **Двойной буфер** — current tree (на экране) + work-in-progress (рендерится).
4. **Time slicing** — между fiber'ами React проверяет "не пора ли уступить main thread?".

```
[main thread]: [render fiber A][обработка input][render fiber B][...][render fiber C]
                ↑ react              ↑ user
```

---

### Concurrent — НЕ многопоточность

JavaScript однопоточен. Concurrent — это:
- **Прерываемая работа** (yield to main thread).
- **Приоритизация** обновлений.
- **Возможность** работы "в фоне" (но всё равно в main thread).

Это **не** настоящий мультитрединг. Web Workers — отдельная история.

---

### Side effects в Concurrent

В Concurrent компонент может рендериться **несколько раз** до коммита (transitions могут быть прерваны и перезапущены). Это значит:

```tsx
function MyComp() {
  console.log("rendering");  // ← может вызваться дважды/трижды
  return ...;
}
```

**Правило:** render-функции должны быть **чистыми**. Side effects — только в:
- `useEffect` (после commit).
- `useLayoutEffect` (после DOM, перед paint).
- Event handlers.

```tsx
// ❌ Side effect в render — может выполниться много раз!
function Bad() {
  fetch("/api/data");  // ❌
  return ...;
}

// ✅
function Good() {
  useEffect(() => { fetch("/api/data"); }, []);
  return ...;
}
```

---

### StrictMode — защита от не-чистых компонентов

В Strict Mode (development) React **специально вызывает рендер дважды** и **дважды монтирует/размонтирует** компоненты. Это для отлова багов:
- Не-чистого render.
- Не-cleaned-up эффектов.

```tsx
<StrictMode>
  <App />
</StrictMode>

// useEffect: запустится → cleanup → запустится снова
// Если cleanup не корректный → утечки/баги станут видны сразу
```

---

### Реальная польза для пользователей

Без concurrent — приложение "лагает" при тяжёлых рендерах. С concurrent:
- Ввод плавный.
- Переключение вкладок мгновенное (transitioning content).
- Suspense + transition = плавный UX без лоадеров.

---

## ⚠️ Подводные камни

### 1. Не активировал createRoot

```tsx
// ❌ Concurrent не работает — старый рендеринг
ReactDOM.render(<App />, container);

// ✅
createRoot(container).render(<App />);
```

### 2. Side effects в render

```tsx
// ❌ В Concurrent компонент может рендериться несколько раз
function MyComp() {
  trackPageView();  // ❌ Может trigger ditambah
}

// ✅
useEffect(() => { trackPageView(); }, []);
```

### 3. startTransition с async

```tsx
// ❌ Promise игнорируется
startTransition(async () => {
  const data = await fetch(...);
  setData(data);  // ← ВНЕ transition
});

// ✅
async function load() {
  const data = await fetch(...);
  startTransition(() => setData(data));
}
```

### 4. useTransition не для сетевых запросов

```tsx
// ❌ useTransition не отменит fetch
startTransition(() => {
  fetch(...);  // запрос идёт в любом случае
});

// ✅ Для отмены fetch — AbortController
```

### 5. Не каждое обновление выгодно делать transition

Только тяжёлые рендеры. Простые setState в transition — overhead без пользы.

### 6. StrictMode дабл-рендер пугает разработчиков

В консоли всё дублируется. Это **намеренно** — найди real bug, не отключай StrictMode.

### 7. Не все библиотеки support Concurrent

Старые библиотеки могут полагаться на синхронный рендер. Большинство популярных давно адаптированы.

---

## 🔬 Тонкие моменты

**Lane model**

React 18 имеет 31 приоритет (lanes):
- Sync (немедленно).
- InputContinuous (для непрерывного ввода).
- Default.
- Transition (низкий).
- Idle (самый низкий).

Каждое обновление помечается lane'ом. React выбирает самые приоритетные для рендера.

**Render может быть выкинут**

```tsx
function Comp() {
  console.log("renders:", ++renderCount);
  // ...
}
// Если transition прервался — этот рендер не попал в DOM
// renderCount всё равно увеличился (sideEffect в render!)
```

Это причина, почему side effects в render — плохо.

**`useDeferredValue` vs `useTransition` глубже**

```tsx
// useTransition — ты решаешь, что низкоприоритетное
startTransition(() => setSlow(value));

// useDeferredValue — ты используешь старое значение, пока новое в фоне
const slow = useDeferredValue(value);  // value меняется срочно, slow с задержкой
```

**Concurrent + Suspense + use (React 19)**

```tsx
import { use } from "react";

function Profile({ promise }) {
  const user = use(promise);  // suspends если promise pending
  return <p>{user.name}</p>;
}

<Suspense fallback={<Spinner />}>
  <Profile promise={fetchUser(42)} />
</Suspense>
```

`use()` — новый хук, может вызываться в условиях.

**Production vs development**

В dev — двойной рендер из-за StrictMode. В production — одинарный (concurrent работает обычным образом).

**Профилирование Concurrent**

В React DevTools Profiler видно:
- Какой lane был использован для каждого обновления.
- Какие рендеры были прерваны.
- Time slicing в действии.

**Suspense waterfalls**

```tsx
// ❌ Каскадная загрузка — последовательно
<Suspense fallback={<Spinner />}>
  <UserProfile />  {/* грузит user */}
</Suspense>

function UserProfile() {
  const user = use(fetchUser());
  return (
    <Suspense fallback={<Spinner />}>
      <UserPosts userId={user.id} />  {/* потом грузит posts */}
    </Suspense>
  );
}

// ✅ Параллельно — запускай fetch на верхнем уровне
const userPromise = fetchUser(id);
const postsPromise = fetchPostsByUser(id);

<Suspense fallback={<Spinner />}>
  <UserProfile promise={userPromise} />
  <UserPosts promise={postsPromise} />
</Suspense>
```

**TanStack Query Suspense mode**

```tsx
const { data } = useSuspenseQuery({...});  // throw promise если loading
```

Интегрируется с Suspense нативно.

---

## 🧩 Задачи для закрепления

**Задача 1 — Активация Concurrent**
Перейди на `createRoot` в проекте (если ещё нет). Покажи через тест, что после этого `setTimeout(() => { setA(1); setB(2); })` даёт один рендер.

**Задача 2 — Tabs с тяжёлым контентом**
3 вкладки. Каждая — большой компонент с задержкой рендера (искусственная для теста, например, цикл на 100ms). Без `useTransition` — переключение лагает. С — мгновенное.

**Задача 3 — Поиск с useDeferredValue**
Поле поиска по 10 000 элементов. Дорогой расчёт результатов. Используй `useDeferredValue` + `useMemo`. Сравни с реализацией без — заметишь разницу при быстрой печати.

**Задача 4 — startTransition vs setTimeout**
Реализуй два варианта "отложенного" обновления:
1. `setTimeout(() => setHeavy(...), 0);`
2. `startTransition(() => setHeavy(...));`

В чём разница? Замерь поведение при быстрых последовательных вызовах.

**Задача 5 — Suspense + transition**
Lazy-loaded страницы. При навигации между страницами — `startTransition`. Покажи, что fallback не появляется, старая страница остаётся видимой пока новая загружается.

**Задача 6 — StrictMode дабл-рендер**
Включи StrictMode. Найди компонент, у которого в render есть side effect (например, `console.log`). Покажи, что он выводится дважды. Исправь.

**Задача 7 — Suspense waterfalls**
Создай компонент с двумя последовательными fetch (user → posts). Покажи waterfall в Network. Перепиши на параллельные promises на верхнем уровне.

**Задача 8 — Profiler в Concurrent**
Запиши Profiler сессию для:
1. Простого `setState`.
2. `setState` в `startTransition`.

Сравни приоритеты, время рендера.

**Задача 9 — Полный пример**
Сделай страницу с поиском и списком 10 000 элементов:
- Поле ввода — `urgent`.
- Filter results — в `startTransition`.
- Каждый элемент — `React.memo`.
- При hover на элементе — prefetch деталей через React Query.
- Открытие деталей — `startTransition` + Suspense (старый контент остаётся, пока загружаются детали).

Замерь всё в Profiler.

**Задача 10 — Lane visualization**
В Profiler найди разные lanes для разных обновлений. Покажи, что ввод имеет более высокий lane чем transition.
