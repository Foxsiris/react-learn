## 📝 Теория

В React 18 появилось **Concurrent Rendering** — возможность прерывать рендеринг, выполнять его в "фоне" и приоритизировать. Эти три хука — публичный API для работы с приоритетами:

| Хук | Зачем нужен | Когда использовать |
|---|---|---|
| `useId` | Генерация стабильных уникальных ID (SSR-safe) | `htmlFor`/`aria-*`/`id` атрибуты |
| `useTransition` | Пометить обновление как "необязательное" — можно прервать | UI-обновления, не критичные к времени |
| `useDeferredValue` | "Отложить" использование значения | Дорогие списки от ввода (поиск) |

---

## 🆔 useId

### Зачем нужен

Раньше для уникальных ID использовали `Math.random()` или счётчик. Это ломало SSR — на сервере и клиенте генерировались разные ID, hydration падал. `useId` гарантирует **одинаковые ID на сервере и клиенте**.

```tsx
import { useId } from "react";

function FormField({ label, type = "text" }) {
  const id = useId();  // например, ":r0:" — стабильно между серверным и клиентским рендерами
  return (
    <>
      <label htmlFor={id}>{label}</label>
      <input id={id} type={type} />
    </>
  );
}
```

### Множественные ID из одного useId

```tsx
function Form() {
  const id = useId();  // например, ":r0:"
  return (
    <fieldset>
      <label htmlFor={`${id}-name`}>Имя</label>
      <input id={`${id}-name`} />
      
      <label htmlFor={`${id}-email`}>Email</label>
      <input id={`${id}-email`} />
    </fieldset>
  );
}
```

### `aria-describedby` и `aria-labelledby`

```tsx
function PasswordField({ label, hint }) {
  const labelId = useId();
  const hintId  = useId();
  return (
    <>
      <label id={labelId}>{label}</label>
      <input
        type="password"
        aria-labelledby={labelId}
        aria-describedby={hintId}
      />
      <p id={hintId}>{hint}</p>
    </>
  );
}
```

### Когда useId НЕ для чего

```tsx
// ❌ key в списке — useId не подходит, нужны id из данных
{items.map(item => <li key={useId()}>{item}</li>)}
// 1) хук в map — нарушение правил хуков
// 2) каждый useId генерирует один ID на компонент

// ❌ Уникальный ID для записи в БД — генерируй на сервере (UUID)
const id = useId();
api.create({ id, ...data });  // плохо: id вида ":r5:" — не подходит для БД
```

---

## ⏱️ useTransition

### Концепция

`useTransition` помечает обновление как **"переход" (transition)** — низкий приоритет. React может:
- Прервать его, если пришло срочное обновление (например, ввод).
- Отрендерить в "фоне", не блокируя UI.
- Показать стейл (старый) UI, пока новый рендерится.

```tsx
const [isPending, startTransition] = useTransition();

startTransition(() => {
  setBigState(newValue);  // это обновление — низкий приоритет
});
```

`isPending` — `true` пока transition идёт, можно показать спиннер.

### Базовый пример: фильтрация большого списка

```tsx
function ProductList({ items }: { items: Product[] }) {
  const [query, setQuery] = useState("");
  const [filtered, setFiltered] = useState(items);
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);  // ← срочное (UI-input должен реагировать сразу)

    startTransition(() => {
      // ↓ необязательное (фильтрация может занять время)
      setFiltered(items.filter(p => p.name.includes(e.target.value)));
    });
  }

  return (
    <>
      <input value={query} onChange={handleChange} />
      {isPending && <span>Обновляется...</span>}
      <ul style={{ opacity: isPending ? 0.5 : 1 }}>
        {filtered.map(p => <li key={p.id}>{p.name}</li>)}
      </ul>
    </>
  );
}
```

**Что происходит без useTransition?**
Если у тебя 10 000 товаров и фильтрация рендерится 200мс — ввод "лагает". Каждый символ блокирует main thread на 200мс.

**С useTransition** — ввод обновляется сразу, фильтрация рендерится "в фоне". Если пользователь продолжает печатать — старый transition отменяется.

### `startTransition` без хука

Можно использовать как standalone-функцию (без isPending):

```tsx
import { startTransition } from "react";

function Tab({ tabId }: { tabId: string }) {
  return (
    <button onClick={() => {
      startTransition(() => {
        setActiveTab(tabId);  // переключение вкладки — не критичное
      });
    }}>
      {tabId}
    </button>
  );
}
```

### Кейсы для useTransition

- ✅ Переключение **вкладок** с тяжёлым контентом.
- ✅ **Фильтрация/сортировка** больших списков.
- ✅ Навигация по **роутам** (с тяжёлыми страницами).
- ✅ Раскрытие сложного раздела/виджета.

### Не для всех async-операций

`useTransition` **не для fetch**. Он откладывает рендер, не сетевой запрос:

```tsx
// ❌ Не имеет смысла для async
startTransition(async () => {
  const data = await api.load();  // promise игнорируется!
  setData(data);
});

// ✅ Для async — отдельный паттерн (Suspense + use)
```

---

## 🐢 useDeferredValue

### Концепция

`useDeferredValue(value)` возвращает версию value, которая **отстаёт от текущей**. React пытается отрендерить с новым значением в фоне, а пока показывает старое.

```tsx
const deferredValue = useDeferredValue(value);
```

Похоже на debounce, но **управляется React** — задержка зависит от загрузки устройства (на быстром не задержки нет, на медленном — есть).

### Базовый пример: поиск с подсветкой

```tsx
function SearchPage() {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  
  const isStale = query !== deferredQuery;

  return (
    <>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      <ResultsList query={deferredQuery} />
      {isStale && <span>обновляется...</span>}
    </>
  );
}

const ResultsList = React.memo(function({ query }: { query: string }) {
  // Дорогая фильтрация
  const results = expensiveSearch(query);
  return <ul>{results.map(r => <li key={r.id}>{r.text}</li>)}</ul>;
});
```

**Логика:**
1. Пользователь вводит "react" — `query="react"`, `deferredQuery=""` (старое).
2. React начинает рендер ResultsList с deferredQuery="" (быстро) → показывает.
3. Параллельно начинает рендер с deferredQuery="react" (медленно).
4. Когда готово — показывает новый результат.
5. Если за это время query изменился ("react!") — старый рендер отменяется, начинается новый.

### Сравнение с useTransition

```tsx
// useTransition — ты КОНТРОЛИРУЕШЬ, какое обновление пометить как low-priority
function App() {
  const [filter, setFilter] = useState("");
  const [isPending, startTransition] = useTransition();
  
  function onChange(value: string) {
    setFilter(value);  // вне transition — срочно
    startTransition(() => {
      setComputedData(expensiveCompute(value));  // в transition — не срочно
    });
  }
}

// useDeferredValue — ты ИСПОЛЬЗУЕШЬ задержанное значение
function App() {
  const [filter, setFilter] = useState("");  // обновляется срочно
  const deferred = useDeferredValue(filter);  // используется в дорогом месте
  const result = useMemo(() => expensiveCompute(deferred), [deferred]);
}
```

| | `useTransition` | `useDeferredValue` |
|---|---|---|
| Что управляется | вызов `setState` | значение |
| Когда полезен | когда есть доступ к месту вызова setState | когда значение приходит "извне" (из props) |
| Pending UI | через `isPending` | через сравнение `value !== deferred` |

### Дочерний компонент с useDeferredValue

```tsx
// Если значение приходит как prop, и ты не можешь поменять родителя
function ExpensiveChild({ data }: { data: string }) {
  const deferred = useDeferredValue(data);
  const isStale = data !== deferred;
  
  const content = useMemo(() => heavyRender(deferred), [deferred]);
  
  return (
    <div style={{ opacity: isStale ? 0.5 : 1 }}>
      {content}
    </div>
  );
}
```

---

## ⚠️ Подводные камни

### useId

**1. Не использовать в `key`**

```tsx
// ❌ useId генерирует ОДИН ID на компонент, не уникальный по позиции
{items.map(item => <li key={useId()}>{item}</li>)}
// 1) Хук в map — запрещено
// 2) Все элементы получили бы одинаковый ID
```

**2. Не для бизнес-логики**

```tsx
// ❌ ID вида ":r5:" не пригодны для БД, URL, API
const id = useId();
api.create({ id, ...data });
```

**3. ID меняется между mount/unmount**

Если компонент размонтирован и снова смонтирован — у нового инстанса будет другой ID.

### useTransition

**1. setState вне startTransition не отложится**

```tsx
function onClick() {
  startTransition(() => {
    setSlow(...);  // в transition
  });
  setFast(...);   // СРОЧНО (вне transition)
}
```

**2. Нельзя использовать с async**

```tsx
// ❌ Promise игнорируется
startTransition(async () => {
  const data = await api.load();
  setData(data);  // вне transition!
});

// ✅ Если нужно async + transition — сначала await, потом transition
async function load() {
  const data = await api.load();
  startTransition(() => setData(data));
}
```

**3. isPending зависит от коммита, не сети**

`isPending` — это про "идёт ли rendering". Если внутри transition ты делаешь fetch — isPending не покажет загрузку сети.

**4. Внутри Concurrent Mode — не гарантировано прерывание**

React **может** прервать transition, но не обязан. На простых обновлениях (мало работы) ничего не прервётся. Если хочешь явный приоритет — используй с большими списками/тяжёлым DOM.

### useDeferredValue

**1. Без useMemo — нет смысла**

```tsx
// ❌ Без useMemo дорогая операция выполнится дважды (для query и для deferredQuery)
const result = expensiveCompute(deferred);

// ✅ С useMemo — только один раз для каждого значения
const result = useMemo(() => expensiveCompute(deferred), [deferred]);
```

**2. Не работает для примитивов без работы**

```tsx
// ❌ Бесполезно — нет дорогой работы
const deferredX = useDeferredValue(x);
return <div>{deferredX}</div>;
```

**3. Иногда показывает мерцание**

При первом рендере `deferredValue === value`, поэтому ничего не отстаёт. Лаг появляется только при изменении value.

---

## 🔬 Тонкие моменты

**`useId` на сервере и клиенте генерируется через дерево**

React-серверный рендерер обходит дерево в детерминированном порядке. ID генерируется по позиции, поэтому SSR и hydration совпадают.

**`startTransition` имеет 2 формы**

```tsx
// Форма 1: хук — есть isPending
const [isPending, startTransition] = useTransition();

// Форма 2: standalone — нет isPending
import { startTransition } from "react";
startTransition(() => { /* ... */ });
```

**В Suspense + transition пропадает fallback**

```tsx
<Suspense fallback={<Spinner />}>
  <AsyncContent />
</Suspense>

// Если переход к новому AsyncContent в startTransition →
// Spinner НЕ показывается, остаётся старый контент пока новый загружается
startTransition(() => setShowOther(true));
```

Это лучший UX: "не дёргаем" пользователя сменой контента → loader → новый контент.

**`useDeferredValue` лучше для props, `useTransition` для state**

Если значение твоё (state) — useTransition. Если значение приходит из props — useDeferredValue.

**Проверка через React Profiler**

В Profiler помечаются: render как "Render at low priority" → transition. Можно увидеть, что rendering реально откладывается.

**Не путай с debounce/throttle**

| | `useDeferredValue` | `debounce` |
|---|---|---|
| Когда срабатывает | Когда React освободит main thread | Через фиксированное время |
| Адаптивность | Адаптивно к нагрузке | Фиксированный интервал |
| Подходит для | Тяжёлый рендер | Сетевые запросы, логирование |

Часто используют **вместе**: `debounce` для API запросов, `useDeferredValue` для рендера.

---

## 🧩 Задачи для закрепления

**Задача 1 — useId в форме**
Реализуй переиспользуемый `<TextField label hint />` компонент. Используй `useId` для связи `label`/`input` (через htmlFor) и `aria-describedby` для hint. Открой инспектор — покажи, что id уникальны.

**Задача 2 — Search с 10 000 элементов**
Создай поле поиска по списку из 10 000 объектов. Реализуй три версии:
1. Без оптимизации — заметишь лагание ввода.
2. С `useTransition` — ввод плавный, обновления чуть отстают.
3. С `useDeferredValue` — то же, но в виде дочернего компонента.

Сравни в Profiler.

**Задача 3 — Tabs с тяжёлым контентом**
Табы, в каждом — большая визуализация (например, чарт с тысячей точек). Без useTransition переключение тормозит. С — мгновенно реагирует, контент догружается. Покажи `isPending` как индикатор.

**Задача 4 — Поиск + debounce + transition**
Поиск по API. Используй `debounce` для реального запроса (`fetch`) и `useTransition` для отрисовки результатов. Объясни, зачем ОБА.

**Задача 5 — Suspense + transition**
Используй `<Suspense>` + `lazy()` для маршрутов. При переключении страниц обёртывай навигацию в `startTransition` — пользователь не увидит loader (старая страница останется), пока новая не загрузится.

**Задача 6 — Stale UI indicator**
В компоненте с `useDeferredValue` покажи "stale" состояние: контент серый/полупрозрачный пока deferred отстаёт. После обновления — нормальный цвет.

**Задача 7 — Контролируемая форма с transition**
Большая форма (50 полей) с зависимостями (изменение поля A пересчитывает поле B через тяжёлую функцию). Без `useTransition` — лаги. С `useTransition` — ввод плавный, пересчёт идёт в фоне.
