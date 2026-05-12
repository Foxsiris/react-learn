## 📝 Теория

### Что такое React.memo

`React.memo(Component, [areEqual])` — это **HOC** (higher-order component), оборачивающий компонент. Перед каждым рендером он сравнивает **новые props со старыми**. Если props равны — компонент **не рендерится** (используется предыдущий результат).

```tsx
const MyComponent = React.memo(function MyComponent({ name, age }: Props) {
  console.log("render");
  return <p>{name}, {age}</p>;
});

// При повторных рендерах с теми же props — лог "render" не появится
```

### Зачем нужен

Любой родительский рендер по умолчанию вызывает рендер всех детей. Это окей в большинстве случаев. Но если:
- Компонент **тяжёлый** (много DOM, расчётов).
- Он **рендерится часто** (родитель часто обновляется).
- Его **props стабильны** (не зависят от меняющегося state родителя).

→ можно сэкономить через `React.memo`.

### Дефолтное сравнение — shallow

```tsx
function shallowEqual(prevProps, nextProps) {
  if (Object.keys(prevProps).length !== Object.keys(nextProps).length) return false;
  for (const key of Object.keys(prevProps)) {
    if (!Object.is(prevProps[key], nextProps[key])) return false;
  }
  return true;
}
```

Сравнение по `Object.is` (≈ `===`):
- Примитивы — по значению.
- Объекты, массивы, функции — по ссылке.

```tsx
React.memo(Child)({ x: 1 })           // === React.memo(Child)({ x: 1 }) → true
React.memo(Child)({ x: { a: 1 } })   // !== React.memo(Child)({ x: { a: 1 } }) → false (объекты)
React.memo(Child)({ fn: () => 1 })   // !== ... → false (функции)
```

---

### Базовое использование

```tsx
interface ItemProps {
  id: number;
  name: string;
  onSelect: (id: number) => void;
}

const Item = React.memo(function Item({ id, name, onSelect }: ItemProps) {
  console.log("render", id);
  return (
    <li onClick={() => onSelect(id)}>
      {name}
    </li>
  );
});
```

### Custom areEqual function

```tsx
const Avatar = React.memo(
  function Avatar({ user }: { user: User }) {
    return <img src={user.avatar} alt={user.name} />;
  },
  (prevProps, nextProps) => {
    // true → не рендерить (props равны)
    return prevProps.user.id === nextProps.user.id
        && prevProps.user.avatar === nextProps.user.avatar;
  }
);

// ⚠️ Логика обратная useEffect deps:
// useEffect: deps РАЗНЫЕ → выполнить
// areEqual:  return TRUE → НЕ рендерить
```

---

### React.memo + useCallback + useMemo — троица

`React.memo` помогает только если props **стабильны**. Если родитель передаёт новые объекты/функции каждый рендер — мемоизация не сработает:

```tsx
function Parent() {
  const [count, setCount] = useState(0);

  // ❌ Каждый рендер — новая функция
  return <MemoChild onClick={() => doStuff()} />;

  // ❌ Каждый рендер — новый объект
  return <MemoChild config={{ x: 1, y: 2 }} />;

  // ✅ Стабильная функция
  const handleClick = useCallback(() => doStuff(), []);
  // ✅ Стабильный объект
  const config = useMemo(() => ({ x: 1, y: 2 }), []);
  return <MemoChild onClick={handleClick} config={config} />;
}
```

Правило: `React.memo` без `useCallback`/`useMemo` на нестабильных props — **бесполезен**.

---

### Когда React.memo помогает

#### 1. Большие списки

```tsx
const Row = React.memo(function Row({ item, onSelect }: Props) {
  return <div onClick={() => onSelect(item.id)}>{item.name}</div>;
});

function List({ items }: { items: Item[] }) {
  const [selected, setSelected] = useState<number | null>(null);
  
  // selected меняется → List рендерится
  // Без memo: все 1000 Row рендерятся
  // С memo: ни один Row не рендерится (если item и onSelect стабильны)
  
  const handleSelect = useCallback((id: number) => setSelected(id), []);
  
  return (
    <>
      {items.map(item => (
        <Row key={item.id} item={item} onSelect={handleSelect} />
      ))}
    </>
  );
}
```

#### 2. Компонент с тяжёлым render

```tsx
const Chart = React.memo(function Chart({ data }: { data: DataPoint[] }) {
  // Тяжёлая работа: расчёты, SVG, canvas
  return <ComplexChart data={data} />;
});

function Dashboard() {
  const [time, setTime] = useState(Date.now());
  // Часы обновляются каждую секунду, но Chart не зависит от time → не рендерится
  return (
    <>
      <Clock value={time} />
      <Chart data={chartData} />
    </>
  );
}
```

#### 3. Изолированные виджеты

Sidebar, Header, Footer — обычно стабильные. Можно обернуть в memo, чтобы при изменении контента они не рендерились.

---

### Когда React.memo НЕ помогает

#### 1. Props всегда новые

```tsx
// ❌ Каждый рендер — новый style → memo не сработает
<MemoChild style={{ color: "red" }} />

// ❌ Каждый рендер — новый children
<MemoChild>
  <span>{count}</span>  // children меняется при изменении count
</MemoChild>

// ✅ Стабильные props
const STYLE = { color: "red" };
<MemoChild style={STYLE} />
```

#### 2. Маленький компонент

```tsx
// React.memo сам имеет накладные расходы (сравнение props)
// Для тривиального компонента это дороже, чем сам рендер
const Tiny = React.memo(({ x }) => <span>{x}</span>);  // лишнее
```

#### 3. Компонент уже не рендерится часто

Если родитель рендерится редко — мемоизация бесполезна (компонент и так не рендерится).

#### 4. Компонент использует Context

```tsx
const Memo = React.memo(function Memo() {
  const value = useContext(SomeCtx);  // ← подписка на контекст
  return <p>{value}</p>;
});
// memo не помогает — компонент рендерится при любом изменении контекста,
// даже если props не менялись
```

---

### Когда вообще НЕ ОПТИМИЗИРОВАТЬ

> "Premature optimization is the root of all evil" — Donald Knuth

Сначала **измерь**, потом оптимизируй. React по умолчанию быстрый. Большинство приложений работают отлично без `React.memo`. Преждевременная оптимизация:
- Усложняет код.
- Замедляет приложение (накладные расходы на сравнение props).
- Скрывает реальные проблемы.

**Алгоритм:**
1. Заметил тормоза.
2. Открыл React Profiler.
3. Нашёл компонент, который рендерится больше всего.
4. Понял, что можно сэкономить.
5. Обернул в memo + добавил useCallback/useMemo.
6. Замерил снова — стало лучше? Оставить. Не стало? Откатить.

---

### React Compiler (Forget) — конец эры ручной мемоизации

В React 19 появляется официальный компилятор (раньше известный как Forget). Он автоматически вставляет мемоизацию там, где нужно. Это значит, что:
- `React.memo` для большинства случаев станет не нужен.
- `useMemo`/`useCallback` тоже.
- Ты пишешь "наивный" код, компилятор оптимизирует.

Сейчас — переходный период. Некоторые проекты уже используют Compiler, большинство — нет. Знание `React.memo` и `useCallback` остаётся полезным.

---

### Memo для дочерних компонентов в списках

Очень частый кейс — большой список, и каждый элемент дорогой для рендера:

```tsx
// items: 1000 объектов
const ListItem = React.memo(function ListItem({ item, onSelect, isSelected }) {
  return (
    <li
      style={{ background: isSelected ? "blue" : "white" }}
      onClick={() => onSelect(item.id)}
    >
      {item.name}
    </li>
  );
});

function List() {
  const [items] = useState(generateItems(1000));
  const [selected, setSelected] = useState<number | null>(null);
  
  const handleSelect = useCallback((id: number) => {
    setSelected(id);
  }, []);

  return (
    <ul>
      {items.map(item => (
        <ListItem
          key={item.id}
          item={item}
          isSelected={item.id === selected}  // ← разное значение для каждого элемента!
          onSelect={handleSelect}
        />
      ))}
    </ul>
  );
}
// При смене selected:
// Только TWO ListItem рендерятся: старый selected (false → false ничего;
// но isSelected меняется) и новый selected (false → true).
// Остальные 998 — пропускают рендер благодаря memo.
```

Это даёт **огромный выигрыш** на больших списках.

---

### memo + props-spreading — внимательно

```tsx
// ❌ Spread может разрушить мемоизацию из-за нестабильных props
const someProps = useMemo(() => ({ a: 1, b: 2 }), []);
<MemoChild {...someProps} key={x} />  // если х меняется — всё пересоздаётся
// (ну, key всегда "вне memo" — он меняет identity)
```

---

## ⚠️ Подводные камни

### 1. Бесполезный memo на нестабильных props

```tsx
// ❌ Каждый рендер — новый объект → memo не работает
<MemoChild config={{ x: 1 }} />

// ✅ Стабильный props
const CONFIG = { x: 1 };
<MemoChild config={CONFIG} />
// или
const config = useMemo(() => ({ x: 1 }), []);
<MemoChild config={config} />
```

### 2. memo + children

```tsx
// ❌ children — это React элемент, новый каждый рендер
<MemoChild>
  <span>Hi</span>
</MemoChild>

// Шанс что memo поможет — низкий
// React элементы сравниваются по ссылке, и каждый JSX <span/> — новый объект
```

### 3. memo + контекст

```tsx
// ❌ memo не помогает с контекстом
const Memo = React.memo(function Comp() {
  const ctx = useContext(SomeCtx);  // подписан на контекст
  return ...;
});
// При изменении контекста — рендерится, даже если props не менялись
```

### 4. Custom areEqual + забыл проверить все props

```tsx
// ❌ Сравниваем только id, но игнорируем onClick — кнопка может перестать работать
React.memo(Item, (prev, next) => prev.id === next.id);
// Если onClick меняется — компонент НЕ перерендерится → старый callback в DOM

// ✅ Проверяй ВСЕ props, или используй default shallow
```

### 5. Накладные расходы

```tsx
// memo дорогой, если props большие (много полей для сравнения)
React.memo(Component);  // shallow compare 50 полей → не очевидно быстрее
// Иногда дешевле просто рендерить, чем сравнивать
```

### 6. forwardRef + memo

```tsx
// ❌ Неправильный порядок — type errors
const Comp = React.memo(forwardRef((props, ref) => ...));  // ✅ memo снаружи

// или, что более удобно:
import { memo, forwardRef } from "react";
const Comp = memo(forwardRef<RefType, Props>((props, ref) => {...}));
```

### 7. memo на компоненте, который использует state

memo помогает только с props. Если внутри компонента state меняется — рендер всё равно произойдёт.

---

## 🔬 Тонкие моменты

**displayName в DevTools**

```tsx
// React.memo "съедает" имя в DevTools
const Comp = React.memo(({ x }) => <div>{x}</div>);
// DevTools: <Memo>

// ✅ Назови функцию или задай displayName
const Comp = React.memo(function MyComponent({ x }) { ... });
// DevTools: <MyComponent>

// или
const Comp = React.memo(({ x }) => <div>{x}</div>);
Comp.displayName = "MyComponent";
```

**memo сам по себе — это объект-обёртка**

```tsx
const MemoComp = React.memo(MyComp);
// MemoComp.type === { $$typeof: Symbol(react.memo), type: MyComp, compare: null }
// Это — особый тип, который React узнаёт при reconciliation
```

**Сравнение memo с PureComponent**

В классовых компонентах был `PureComponent` — то же самое, что memo для функциональных. Сравнивает props и state shallow.

```tsx
class MyComp extends React.PureComponent {
  // shouldComponentUpdate — shallow compare props и state
}
```

**memo и переключение типа компонента**

Если оборачиваешь компонент в memo — DOM-узел будет тот же, но React-fiber изменится:

```tsx
// До: <MyComp /> (Type: function)
// После: <MemoComp /> (Type: { $$typeof: ..., type: MyComp })
// → разные типы → ремаунт компонента, state потеряется
```

Так что не оборачивай существующие компоненты в memo на лету.

**Когда areEqual возвращает true — что происходит?**

React сохраняет старый result. Никаких эффектов не запускается, никаких DOM-операций.

**Производительность сравнения props**

Сравнение N полей — O(N). Для 100 props это ~100 операций сравнения. Сам рендер компонента может быть быстрее. Поэтому:
- Маленький компонент с 5 props → memo лишний.
- Большой компонент с 5 props → memo полезен.
- Большой компонент с 50 props → меряй.

**memo и React Compiler**

Когда RC включён, ручной memo обычно не нужен — компилятор сам понимает, какие компоненты нужно мемоизировать. Это будущее.

---

## 🧩 Задачи для закрепления

**Задача 1 — Большой список с фильтром**
1000 элементов. Фильтр в TextField сверху. Без memo/useCallback — заметишь лагание ввода. С memo + useCallback — ввод плавный, рендерятся только подходящие элементы.

**Задача 2 — Profiler before/after**
Возьми любую существующую страницу. Запиши Profiler сессию. Найди компонент, который рендерится "впустую" (Why did this render? — props не изменились, но он рендерится). Оберни в memo. Запиши снова — сравни.

**Задача 3 — Нестабильные props**
Создай родителя, который передаёт `config={{ a: 1 }}` в memo-ребёнка. Покажи, что memo бесполезен (через console.log в children). Исправь через useMemo. Замерь Profiler.

**Задача 4 — Custom areEqual**
Компонент `<Avatar user />` где user — большой объект, но визуально важен только `user.id` и `user.avatar`. Напиши custom areEqual, сравнивающий только эти два поля. Подтверди, что компонент не рендерится при изменении `user.lastSeen`.

**Задача 5 — Дерево комментариев**
Рекурсивный компонент `<Comment comment={c} />`. У каждого комментария может быть массив replies. Без memo — добавление комментария рендерит всё дерево. С memo — только новый и его родитель.

**Задача 6 — Анти-паттерн поиск**
Найди (или придумай) код с бесполезным memo. Например:
- memo на компоненте, использующем useContext.
- memo с children prop.
- memo с inline-функциями.

Объясни, почему memo не работает.

**Задача 7 — Сравнение скорости**
Реализуй benchmark: компонент рендерит 5000 простых div'ов. Сравни время:
1. Без memo.
2. С memo.
3. С memo + custom areEqual (всегда true → нет рендера).

Используй React.Profiler программно для замера.

**Задача 8 — Эмуляция React Compiler**
Возьми готовый компонент с inline функциями и объектами. Вручную "компилируй" его в стиле RC: вынеси все стабильные значения в useMemo/useCallback. Сравни читаемость.
