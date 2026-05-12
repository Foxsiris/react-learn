## 📝 Теория

### Что такое useMemo

`useMemo(factory, deps)` — **кеширует результат** вызова `factory()` между рендерами. Пересчитывается только когда изменилась хотя бы одна зависимость из массива `deps`.

```tsx
const expensiveValue = useMemo(() => {
  return doExpensiveCalculation(a, b);
}, [a, b]);
```

Если на следующем рендере `a` и `b` не изменились (по `Object.is`), `expensiveValue` будет тем же объектом из прошлого рендера — без пересчёта.

### Зачем нужен

**Цель 1. Избежать дорогих вычислений** при каждом рендере (фильтрация/сортировка тысяч элементов, парсинг, форматирование).

**Цель 2. Стабилизировать ссылку** на объект/массив, чтобы:
- `React.memo` дочернего компонента работал.
- `useEffect`/`useMemo`/`useCallback` не запускались каждый рендер.
- Передача в Context был стабильна.

```tsx
// 1. Дорогое вычисление
const sorted = useMemo(() => 
  items.slice().sort((a, b) => a.name.localeCompare(b.name)),
  [items]
);

// 2. Стабильная ссылка
const options = useMemo(() => ({ url, timeout: 5000 }), [url]);
useEffect(() => fetchData(options), [options]);  // не бесконечный цикл
```

---

### Как работает кеширование

```tsx
// Псевдокод React (упрощённо)
function useMemo(factory, deps) {
  const prev = getStoredValue();  // { value, deps } из прошлого рендера
  
  if (prev && shallowEqual(prev.deps, deps)) {
    return prev.value;  // ← возвращаем кешированное
  }
  
  const value = factory();
  storeValue({ value, deps });
  return value;
}

// Сравнение зависимостей идёт через Object.is для каждого элемента массива
shallowEqual([1, 2], [1, 2])      // true  → кеш
shallowEqual([1, {}], [1, {}])    // false → пересчёт ({} !== {})
```

> ⚠️ React **не гарантирует**, что значение всегда будет в кеше. Внутри Concurrent Rendering React может выкинуть кеш для экономии памяти. Поэтому `useMemo` — это **оптимизация**, а не гарантия. Не клади туда логику с побочными эффектами.

---

### Когда useMemo нужен

#### 1. Дорогие вычисления

"Дорого" — это:
- Сортировка массивов от 1000 элементов.
- Фильтрация/поиск по тысячам записей.
- Парсинг JSON, регулярки на больших строках.
- Тяжёлая трансформация данных (group by, агрегации).

```tsx
function ProductList({ products, filter, sortKey }) {
  const filtered = useMemo(() => 
    products.filter(p => p.title.includes(filter)),
    [products, filter]
  );
  
  const sorted = useMemo(() => 
    [...filtered].sort((a, b) => a[sortKey] > b[sortKey] ? 1 : -1),
    [filtered, sortKey]
  );

  return <ul>{sorted.map(p => <li key={p.id}>{p.title}</li>)}</ul>;
}
```

#### 2. Стабильная ссылка для React.memo

```tsx
const HeavyChild = React.memo(function HeavyChild({ config }) {
  console.log("render");
  return <div>{config.name}</div>;
});

// ❌ config — новый объект каждый рендер → React.memo бесполезен
function Parent() {
  return <HeavyChild config={{ name: "Apple" }} />;
}

// ✅ useMemo стабилизирует ссылку
function Parent() {
  const config = useMemo(() => ({ name: "Apple" }), []);
  return <HeavyChild config={config} />;
}
```

#### 3. Зависимости useEffect

```tsx
// ❌ options — новый объект каждый рендер → effect запускается бесконечно
function Comp({ url, page }) {
  const options = { url, page, limit: 20 };
  useEffect(() => fetchData(options), [options]);
}

// ✅ useMemo
function Comp({ url, page }) {
  const options = useMemo(() => ({ url, page, limit: 20 }), [url, page]);
  useEffect(() => fetchData(options), [options]);
}

// ✅ Или ещё проще — указать примитивы в deps
function Comp({ url, page }) {
  useEffect(() => fetchData({ url, page, limit: 20 }), [url, page]);
}
```

#### 4. Контекст с объектом

```tsx
const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const login  = useCallback(...);
  const logout = useCallback(...);

  // ❌ value — новый объект каждый рендер → ВСЕ потребители контекста рендерятся
  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;

  // ✅ useMemo
  const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
```

---

### Когда useMemo НЕ нужен

```tsx
// ❌ Преждевременная оптимизация на простых вычислениях
const doubled = useMemo(() => value * 2, [value]);
// useMemo сам имеет накладные расходы → дешевле просто:
const doubled = value * 2;

// ❌ Примитивы в качестве value — у них нет проблемы reference equality
const fullName = useMemo(() => `${first} ${last}`, [first, last]);
// ✅ Просто:
const fullName = `${first} ${last}`;

// ❌ Если результат не используется в reference equality
const stats = useMemo(() => calc(data), [data]);
return <p>Total: {stats.total}</p>;  // используем поле, не сам объект
// → useMemo полезен только если calc дорогой; иначе бесполезен
```

**Правило:** сначала пиши БЕЗ `useMemo`. Если профайлер покажет тормоза — добавь.

---

### useMemo vs useCallback vs useState (initializer)

```tsx
// useMemo — кеширует значение
const computed = useMemo(() => fn(), [deps]);

// useCallback — кеширует функцию (это сахар над useMemo)
const handler = useCallback(() => doStuff(), [deps]);
// ≡ useMemo(() => () => doStuff(), [deps])

// useState с lazy initializer — вычисляет ОДИН РАЗ на первый рендер
const [data] = useState(() => heavyParse(json));
// Не пересчитывается даже при изменении json (в отличие от useMemo)
```

---

### React Compiler (React 19) — автоматическая мемоизация

С React Compiler (Forget) можно **не использовать useMemo/useCallback вручную** — компилятор сам определит, что нужно мемоизировать. Это меняет философию: `useMemo` остаётся ручной escape-hatch'ем, а в большинстве случаев его пишет компилятор.

```tsx
// С React Compiler — оставляешь как есть, мемоизация автоматически
function Component({ items, filter }) {
  const filtered = items.filter(i => i.match(filter));  // компилятор обернёт в useMemo
  return <List items={filtered} />;
}
```

---

## ⚠️ Подводные камни

### 1. Преждевременная оптимизация

```tsx
// ❌ useMemo стоит дороже, чем простая операция
const isAdult = useMemo(() => age >= 18, [age]);

// ✅ Просто:
const isAdult = age >= 18;
```

### 2. Нестабильные зависимости внутри factory

```tsx
// ❌ formatLabel создаётся каждый рендер → useMemo пересчитывается всегда
function Component({ items }) {
  const formatLabel = (item) => `${item.name} (${item.count})`;
  
  const formatted = useMemo(
    () => items.map(item => ({ ...item, label: formatLabel(item) })),
    [items, formatLabel]  // formatLabel — новая ссылка → пересчёт
  );
}

// ✅ useCallback или вынеси за пределы компонента
const formatLabel = (item: Item) => `${item.name} (${item.count})`;  // вне компонента

function Component({ items }) {
  const formatted = useMemo(
    () => items.map(item => ({ ...item, label: formatLabel(item) })),
    [items]
  );
}
```

### 3. Мутация внутри useMemo

```tsx
// ❌ Сортировка мутирует исходный массив
const sorted = useMemo(() => items.sort((a, b) => a - b), [items]);

// ✅ Копия + сортировка
const sorted = useMemo(() => [...items].sort((a, b) => a - b), [items]);
// или
const sorted = useMemo(() => items.toSorted((a, b) => a - b), [items]);
```

### 4. useMemo для боковых эффектов

```tsx
// ❌ useMemo НЕ для side effects
const data = useMemo(() => {
  fetch("/api/data").then(...);  // плохо!
  return null;
}, []);

// ✅ Для эффектов — useEffect
useEffect(() => { fetch("/api/data").then(...); }, []);
```

### 5. Объекты/массивы в deps

```tsx
// ❌ obj — новый объект каждый рендер → useMemo пересчитывается
function Parent({ obj }) {
  const x = useMemo(() => calc(obj), [obj]);
}

// ✅ Деструктурируй до примитивов
function Parent({ obj }) {
  const { a, b } = obj;
  const x = useMemo(() => calc({ a, b }), [a, b]);
}
```

### 6. Возврат функции вместо значения

```tsx
// ❌ Случайно вернули функцию (вместо вызова)
const data = useMemo(() => fetchSync, []);  // data — это функция, не результат
console.log(data);  // [Function: fetchSync]

// ✅ Вызвать
const data = useMemo(() => fetchSync(), []);
```

### 7. useMemo не работает между unmount/mount

Если компонент размонтируется и снова монтируется (например, через смену key) — `useMemo` пересчитается. Кеш не глобальный, а **на инстанс компонента**.

---

## 🔬 Тонкие моменты

**`useMemo` сравнивает deps через `Object.is`, не через deep equal**

```tsx
const stable = useMemo(() => ({ x: 1 }), []);          // стабилен
const unstable = useMemo(() => ({ x: 1 }), [{ x: 1 }]); // пересоздаётся каждый рендер ({} !== {})
```

**`useMemo(() => Component, [...])` — мемоизация JSX-узлов**

```tsx
// Можно мемоизировать целые куски JSX
const sidebar = useMemo(() => (
  <Sidebar items={items} onSelect={handleSelect} />
), [items, handleSelect]);

return <Layout>{sidebar}</Layout>;
// Аналог React.memo(Sidebar) с правильными пропсами
```

**`useMemo` vs ленивая инициализация useState**

| | useMemo | useState lazy |
|---|---|---|
| Вызов factory | каждый раз когда deps меняются | только один раз (на mount) |
| Результат | можно перевычислить | сохраняется навсегда (до setState) |
| Пример | filtered list | первоначальное значение из localStorage |

**`useMemo` и Concurrent rendering**

В Concurrent Mode React может **рендерить компонент несколько раз "впустую"** (рассмотреть гипотетический результат). useMemo гарантирует, что factory не выполнится лишний раз — но возвращённое значение может быть не тем, что попадёт в commit.

**Деопт: useMemo не помогает, если родительский useMemo сломан**

```tsx
// Если parent's items пересоздаётся → child's useMemo тоже пересчитается
function Child({ items }) {
  const filtered = useMemo(() => items.filter(...), [items]);
  // если items не стабилен — useMemo бесполезен
}

function Parent() {
  const items = data.map(...);  // ❌ новый каждый рендер
  return <Child items={items} />;
}
```

**Производительность измерения: console.time + Profiler**

```tsx
const sorted = useMemo(() => {
  console.time("sort");
  const result = [...items].sort((a, b) => a - b);
  console.timeEnd("sort");
  return result;
}, [items]);
```

В React DevTools Profiler видно, сколько ушло на render компонента. Если без useMemo рендер 50ms, с useMemo 5ms — оно того стоит.

---

## 🧩 Задачи для закрепления

**Задача 1 — Таблица 10 000 строк**
Компонент с большой таблицей. Реализуй фильтрацию (по имени), сортировку (по любой колонке), пагинацию. Все три используй внутри `useMemo`. Замерь производительность с `useMemo` и без.

**Задача 2 — DataGrid с группировкой**
Список объектов `{ id, category, price, country }`. Реализуй группировку по любому полю. Внутри useMemo:
1. Группировка через `reduce` → `Map<string, Item[]>`.
2. Подсчёт агрегатов (sum, avg, count) для каждой группы.
3. Сортировка групп.

**Задача 3 — Calendar grid**
Компонент календаря: на вход `month` и `year`, выдаёт массив дней (с пустыми ячейками в начале/конце для выравнивания). Все вычисления через `useMemo`. Бенчмарк: переключение месяца не должно приводить к лишним пересчётам других useMemo, не зависящих от month.

**Задача 4 — Profiling без оптимизации vs с оптимизацией**
Возьми компонент `<UserList>` который сначала фильтрует пользователей, потом мапит в карточки. Замерь в Profiler:
1. Без `useMemo`.
2. С `useMemo` на filter.
3. С `useMemo` + `React.memo` на карточке.
4. Покажи, на сколько % уменьшилось время.

**Задача 5 — Antipattern: useMemo на примитивы**
Найди в реальном проекте (или придумай) случаи, где `useMemo` используется бесполезно (возвращает примитив или цена ниже накладных расходов хука). Удали и докажи, что ничего не сломалось.

**Задача 6 — Контекст с useMemo**
Сделай большой `<AppContext>` с пропсами `{ user, settings, cart, notifications, openModal }`. Покажи как любая мутация перерисовывает всех потребителей. Затем разнеси по нескольким контекстам и оберни value в useMemo — покажи разницу в количестве рендеров.
