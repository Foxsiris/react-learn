## 📝 Теория

### Что такое useCallback

`useCallback(fn, deps)` — возвращает **ту же ссылку на функцию** между рендерами, пока не изменятся `deps`. Это **частный случай `useMemo`**:

```tsx
useCallback(fn, deps) === useMemo(() => fn, deps)
```

```tsx
const handleClick = useCallback(() => {
  console.log("clicked");
}, []);
// handleClick — одна и та же функция между рендерами
```

### Зачем нужен

Главная цель — **стабильность ссылки**. Это важно когда:

1. Функция передаётся в **`React.memo`-обёрнутый дочерний компонент** как prop.
2. Функция — **зависимость `useEffect`/`useMemo`/другого `useCallback`**.
3. Функция передаётся в **сторонний компонент**, который сам мемоизирует логику по props.

```tsx
// 1. Стабильный prop для React.memo
const MemoChild = React.memo(Child);
const handler = useCallback(() => {...}, []);
<MemoChild onClick={handler} />  // Child не перерендерится

// 2. Зависимость useEffect
const fetchData = useCallback(async () => {
  const res = await api.get(`/users/${userId}`);
  setUser(res);
}, [userId]);

useEffect(() => { fetchData(); }, [fetchData]);  // нет бесконечного цикла
```

---

### Как работает под капотом

```tsx
// Псевдокод
function useCallback(fn, deps) {
  return useMemo(() => fn, deps);
  // useMemo вызывает () => fn → возвращает fn
  // Если deps не изменились — возвращает старый fn
}
```

> ⚠️ Сама функция, которую ты передаёшь, **создаётся при каждом рендере** (это просто литерал). useCallback просто решает, какую из них (новую или старую) вернуть. То есть useCallback не предотвращает создание функции, а **выбирает**, использовать ли свежую или закешированную.

---

### Базовые сценарии

#### 1. Стабильный handler для memo-компонента

```tsx
const Item = React.memo(function Item({ item, onDelete }: ItemProps) {
  console.log("render", item.id);
  return (
    <li>
      {item.name}
      <button onClick={() => onDelete(item.id)}>×</button>
    </li>
  );
});

function List({ items }: { items: Item[] }) {
  const [internalItems, setItems] = useState(items);

  // ❌ Без useCallback
  // const handleDelete = (id) => setItems(prev => prev.filter(i => i.id !== id));
  // → каждый рендер List → новая ссылка → ВСЕ Item рендерятся заново

  // ✅ С useCallback
  const handleDelete = useCallback((id: number) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);  // нет deps, потому что используем функциональное обновление

  return (
    <ul>
      {internalItems.map(item => (
        <Item key={item.id} item={item} onDelete={handleDelete} />
      ))}
    </ul>
  );
}
```

#### 2. Async-функция как зависимость

```tsx
function UserPage({ userId }: { userId: number }) {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // useCallback нужен, потому что fetchUser в deps useEffect
  const fetchUser = useCallback(async () => {
    try {
      const res = await api.get(`/users/${userId}`);
      setUser(res);
    } catch (e) {
      setError(e as Error);
    }
  }, [userId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);  // fetchUser стабильна, пока userId не изменится

  return <button onClick={fetchUser}>Refresh</button>;  // и в обработчике используем
}
```

#### 3. Кастомный хук возвращает функции

```tsx
function useCounter(initial = 0) {
  const [count, setCount] = useState(initial);

  // useCallback нужен, чтобы потребители хука получали стабильные функции
  const inc   = useCallback(() => setCount(c => c + 1), []);
  const dec   = useCallback(() => setCount(c => c - 1), []);
  const reset = useCallback(() => setCount(initial), [initial]);

  return { count, inc, dec, reset };
}

// Иначе любой компонент, использующий { inc, dec } в deps,
// будет ловить бесконечные перезапуски эффектов.
```

#### 4. Передача функции в Context

```tsx
const AuthContext = createContext<AuthCtx | null>(null);

function AuthProvider({ children }) {
  const [user, setUser] = useState<User | null>(null);

  const login  = useCallback(async (creds: Creds) => { setUser(await api.login(creds)); }, []);
  const logout = useCallback(() => { setUser(null); }, []);

  // value мемоизируем — внутри стабильные функции
  const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
```

---

### Когда useCallback НЕ нужен

```tsx
// ❌ Дочерний компонент НЕ обёрнут в React.memo
function Parent() {
  const handler = useCallback(() => {...}, []);
  return <NormalChild onClick={handler} />;  // NormalChild и так рендерится при рендере Parent
}
// useCallback здесь — мёртвый код, удаляй

// ❌ Функция нигде не передаётся как prop
function Component() {
  const handleClick = useCallback(() => {...}, []);
  return <button onClick={handleClick}>Click</button>;
  // <button> — это native DOM элемент, ему пофиг на стабильность
}

// ❌ Функция вызывается прямо в рендере (или не передаётся в memo/effect/callback)
const formatted = useCallback((x) => x.toFixed(2), []);
const result = formatted(value);  // нет смысла мемоизировать
```

**Правило:** `useCallback` имеет смысл **только в паре** с `React.memo` (на дочернем) или как зависимость другого хука. Иначе это мусор в коде.

---

### Альтернатива: ref для "latest callback"

Если функция нужна только внутри эффекта/обработчика и не должна триггерить перезапуск, лучше использовать ref:

```tsx
function useEvent<T extends (...args: any[]) => any>(fn: T): T {
  const ref = useRef(fn);
  useEffect(() => { ref.current = fn; });
  return useCallback(((...args) => ref.current(...args)) as T, []);
}

// Использование
function Component({ onSave }: { onSave: () => void }) {
  const stableSave = useEvent(onSave);  // всегда одна и та же ссылка, всегда актуальная

  useEffect(() => {
    const id = setInterval(stableSave, 1000);
    return () => clearInterval(id);
  }, [stableSave]);  // эффект НИКОГДА не перезапустится
}
```

> Этот паттерн обсуждается как RFC `useEvent` от React-команды — будет встроен в React.

---

### useCallback и React Compiler (React 19+)

С React Compiler (Forget) большинство `useCallback`/`useMemo` становится не нужно — компилятор сам понимает, какие функции нужно стабилизировать. Сейчас на проектах он опционален; ручной `useCallback` остаётся актуальным.

---

## ⚠️ Подводные камни

### 1. useCallback без React.memo на дочернем — бесполезен

```tsx
// ❌ Child рендерится каждый раз когда рендерится Parent — useCallback не помогает
function Parent() {
  const handler = useCallback(() => {}, []);
  return <Child onClick={handler} />;
}

// ✅ Чтобы useCallback имел смысл — Child должен быть memo-обёрнут
const Child = React.memo(NormalChild);
```

### 2. Stale closure — забытые зависимости

```tsx
// ❌ count замкнулся на 0, useCallback с пустыми deps — всегда показывает 0
function Counter() {
  const [count, setCount] = useState(0);
  const log = useCallback(() => console.log(count), []);  // count не в deps!
  
  return <button onClick={log}>Log {count}</button>;
}

// ✅ Добавь зависимость
const log = useCallback(() => console.log(count), [count]);

// ✅ Или функциональное обновление, если допустимо
const inc = useCallback(() => setCount(c => c + 1), []);  // не нужен count в deps

// ✅ Или ref-pattern
const countRef = useRef(count);
countRef.current = count;
const log = useCallback(() => console.log(countRef.current), []);
```

### 3. eslint-plugin-react-hooks выручает

```tsx
// ESLint плагин exhaustive-deps подскажет:
//   "React Hook useCallback has a missing dependency: 'count'"

// Никогда не отключай это правило без понимания последствий
// eslint-disable-next-line react-hooks/exhaustive-deps
const log = useCallback(() => console.log(count), []);  // ❌ опасно
```

### 4. Inline-функция внутри useCallback

```tsx
// ❌ Бессмысленно — useCallback вернёт ссылку на новый литерал каждый рендер
const handler = useCallback(() => () => doStuff(), []);
// handler — стабильная функция, но возвращает новую внутреннюю функцию каждый вызов
// Ребёнок получает каждый раз новую ссылку из вызова

// ✅ Если паттерн "функция-фабрика" → useCallback должен возвращать готовую функцию
const handlerFactory = useCallback((id: number) => () => doStuff(id), []);
// Но это всё равно генерирует новые функции каждый вызов handlerFactory(id)
// Если важна стабильность — не используй inline-фабрики

// ✅ Лучше — передавай id через data-атрибут
const handler = useCallback((e: MouseEvent<HTMLButtonElement>) => {
  doStuff(Number(e.currentTarget.dataset.id));
}, []);
```

### 5. Объекты/массивы в deps

```tsx
// ❌ options создаётся каждый рендер → useCallback пересоздаёт функцию
function Comp({ options }) {
  const handler = useCallback(() => doStuff(options), [options]);
}

// ✅ Деструктурируй до примитивов
function Comp({ options: { url, page } }) {
  const handler = useCallback(() => doStuff({ url, page }), [url, page]);
}
```

### 6. useCallback со стабильным dispatch / setState

```tsx
// ❌ Лишняя зависимость — setState стабилен, его не нужно указывать
const handler = useCallback(() => setCount(c => c + 1), [setCount]);

// ✅ setState/dispatch гарантированно стабильны — не пиши их в deps
const handler = useCallback(() => setCount(c => c + 1), []);
```

---

## 🔬 Тонкие моменты

**useCallback не "сохраняет" функцию — он выбирает между новой и старой**

Каждый рендер ты создаёшь новый литерал функции. useCallback просто решает, вернуть его или прошлый. То есть память на функцию выделяется всегда, useCallback не предотвращает GC.

**useCallback в кастомных хуках — обязателен**

Если хук возвращает функции наружу, и их могут использовать в effect/memo — оборачивай в useCallback. Это контракт API хука.

```tsx
// ✅ Любой консьюмер может писать useEffect(..., [trigger])
function useApi() {
  const trigger = useCallback(() => api.call(), []);
  return { trigger };
}
```

**`useCallback` против `useMemo(() => fn, [...])`**

```tsx
// Эти две строки эквивалентны:
const fn1 = useCallback(handler, [a, b]);
const fn2 = useMemo(() => handler, [a, b]);

// Но useCallback семантически понятнее для функций
```

**В тестах — useCallback не влияет на логику**

`useCallback` — это performance-оптимизация. Тесты функциональности должны проходить и без неё. Если тест ломается без useCallback — у тебя баг (обычно stale closure, не правильно запоминаешь данные).

**`useCallback` и Server Components (React 19)**

В Server Components хуков нет вообще. `useCallback` — только в Client Components. Если функция передаётся как prop из Server в Client — мемоизация не имеет смысла, она же просто сериализуется.

**Производительность измерения**

```tsx
// Как понять, что useCallback нужен?
// 1. React DevTools → Profiler → "Why did this render?"
//    Если "props changed: onClick" — стабилизируй ссылку.
// 2. Включи "Highlight updates when components render" → пере-рендер при каждом клике родителя?
```

---

## 🧩 Задачи для закрепления

**Задача 1 — InfiniteList**
Реализуй компонент с подгрузкой при скролле. `<List items onLoadMore />`. List внутри использует IntersectionObserver. `onLoadMore` должен быть стабильной ссылкой через useCallback, чтобы IntersectionObserver не пересоздавался каждый рендер.

**Задача 2 — Дерево с React.memo**
Большое дерево узлов (>100 элементов). Каждый node — `React.memo`. Через React DevTools Profiler покажи, что без useCallback на обработчиках клик по одному node перерисовывает все, а с useCallback — только тот, у которого изменились props.

**Задача 3 — Форма с мемоизированными полями**
Форма из 20 полей. Каждое поле — `React.memo`. На уровне формы — массив обработчиков, каждый через useCallback. Покажи в Profiler, что ввод в одно поле перерисовывает только это поле (плюс саму форму, для отслеживания state).

**Задача 4 — useEvent (latest callback)**
Реализуй хук `useEvent<T>(fn: T): T` (паттерн выше). Используй его в компоненте с `setInterval`, который должен вызывать актуальный callback. Сравни поведение с `useCallback` — useEvent не требует пересоздания эффекта.

**Задача 5 — Анти-паттерн**
Найди (или придумай) код, где `useCallback` используется без необходимости (нет React.memo на ребёнке и не используется в deps других хуков). Покажи, что удаление useCallback ничего не меняет в производительности.

**Задача 6 — Custom hook with stable API**
Реализуй `useCart()` хук, возвращающий `{ items, add, remove, clear, total }`. Все функции — стабильные через useCallback. Покажи, что компонент-потребитель может класть `add` в `useEffect` без race conditions.
