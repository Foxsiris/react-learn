## 📝 Теория

### Что такое Virtual DOM

Virtual DOM (vDOM) — **легковесное JavaScript-представление реального DOM**. Это обычный JS-объект, описывающий структуру UI. React использует его для:

1. **Описания нужного состояния UI** через render-функции компонентов.
2. **Diffing** — сравнения старого vDOM с новым.
3. **Минимальных DOM-операций** — применяет только различия.

```tsx
// JSX
<div className="card">
  <h1>Title</h1>
  <p>Hello</p>
</div>

// React.createElement (то, во что транспилируется)
React.createElement("div", { className: "card" }, [
  React.createElement("h1", null, "Title"),
  React.createElement("p", null, "Hello"),
]);

// Возвращает примерно такой объект (vDOM-узел)
{
  type: "div",
  props: { className: "card" },
  children: [
    { type: "h1", props: {}, children: ["Title"] },
    { type: "p",  props: {}, children: ["Hello"] },
  ],
}
```

### Зачем нужен vDOM

Прямые DOM-операции дорогие (reflow/repaint, layout invalidation). Подход React:

1. **Render** — компоненты вычисляют новое vDOM-дерево (быстрая JS-операция).
2. **Diff** — сравнение со старым vDOM (тоже в памяти).
3. **Commit** — минимальные изменения применяются к настоящему DOM.

```
Рендер:     UI(state) → vDOM
Diff:       vDOM_new vs vDOM_old → patches
Commit:     patches → real DOM
```

> 💡 Это не делает React "быстрее, чем ванильный JS" — теоретически руками всегда можно быстрее. React делает **разработку быстрее**, давая декларативную модель: ты описываешь *что должно быть*, React сам разбирается *как туда дойти*.

---

### Reconciliation (сверка)

**Reconciliation** — алгоритм, по которому React решает, какие DOM-операции применить.

Чтобы быть быстрым (O(n) вместо O(n³) для общего сравнения деревьев), React использует **эвристики**:

#### Эвристика 1. Разные типы → полное пересоздание

```tsx
// До:
<div><Counter /></div>

// После:
<span><Counter /></span>

// React: div и span — разные типы → удалить div со всем содержимым,
// создать span. Counter будет UNMOUNTED и MOUNTED заново → state потерян.
```

То же для компонентов:

```tsx
// До: <UserCard user={u} />
// После: <AdminCard user={u} />
// → React уничтожит UserCard и его state, создаст AdminCard
```

#### Эвристика 2. Одинаковый тип → обновление атрибутов + рекурсия

```tsx
// До:
<div className="old" id="x">
  <p>Text</p>
</div>

// После:
<div className="new" id="x">
  <p>Text</p>
</div>

// React: тип тот же → обновляет className, оставляет p как есть
```

#### Эвристика 3. Списки → сравнение по `key`

Без ключей React сравнивает по **позиции**:

```tsx
// До:  <li>A</li> <li>B</li>
// После: <li>X</li> <li>A</li> <li>B</li>

// React: pos 0: A → X (обновить),
//        pos 1: B → A (обновить),
//        pos 2: новый B (добавить)
// → 3 обновления вместо 1!
```

С ключами — React сопоставляет по ключу:

```tsx
<li key="a">A</li> <li key="b">B</li>
// →
<li key="x">X</li> <li key="a">A</li> <li key="b">B</li>

// React: a, b — те же, x — новый → 1 операция
```

---

### React Fiber (Reconciler v16+)

В React 16 reconciler был полностью переписан и назван **Fiber**. Главные изменения:

#### Что такое Fiber

Fiber — это **связанный список объектов**, где каждый объект описывает единицу работы (vDOM-узел + дополнительная мета). Каждый fiber содержит:
- `type` (компонент или DOM-тег)
- `props`
- `state` (для классов / hooks)
- `child`, `sibling`, `return` (links для обхода)
- `effectTag` (что нужно сделать: PLACEMENT, UPDATE, DELETION)

```
        [App fiber]
        /
   [Header fiber] → [Main fiber] → [Footer fiber]
                    /
              [Section fiber] → ...
```

Это позволило:

#### 1. Прерываемая работа

Старый reconciler (Stack) — рекурсивный, нельзя прервать. Если рендер занимает 100мс, UI зависает на 100мс.

Fiber обходит дерево как итератор по связному списку → может **прерваться, отложиться и продолжить** позже. Между fiber'ами React проверяет: "не пора ли уступить главный поток?"

#### 2. Приоритеты

Разные обновления имеют разные приоритеты:
- **Discrete events** (click, input) — высокий приоритет (немедленно).
- **Continuous events** (mousemove, scroll) — средний.
- **Transitions** (`startTransition`) — низкий, может прерваться.
- **Idle work** — самый низкий.

Это база для `useTransition`, `useDeferredValue`, Suspense.

#### 3. Concurrent Rendering (React 18)

Fiber + приоритеты + двухпроходный рендер дали **Concurrent Rendering** — возможность рендерить несколько версий дерева одновременно (work-in-progress vs current).

```
[current tree]   ← то, что сейчас на экране
[wip tree]       ← рендерится в фоне (transition)
```

Если приходит срочное обновление — React может выкинуть wip и начать заново.

---

### Render phase vs Commit phase

Жизненный цикл обновления делится на **2 фазы**:

#### Render phase

- Вызов компонентов (твои функции).
- Создание новых fiber'ов.
- Сравнение со старыми (diff).
- **Может быть прерван и перезапущен!**
- ⚠️ Не должна иметь side effects (нельзя `console.log("rendering")` для отладки — может вызваться много раз).

#### Commit phase

- Применение изменений к DOM.
- Запуск `useLayoutEffect`.
- Запуск `useEffect` (после paint).
- ⚠️ **Не прерывается** — атомарна.

```
Render (interruptible) → Commit (atomic)
   ↑ может откатиться
```

---

### Bailout — оптимизации reconciler-а

React **пропускает рендер** если:

1. **Тот же элемент** возвращён из useMemo и т.д.
2. **State не изменился** (`Object.is(prev, next)`).
3. **Props у memo-компонента не изменились** (shallow compare).

```tsx
// Bail out по равенству state
const [count, setCount] = useState(0);
setCount(0);  // если уже 0 → React не рендерит (после первой проверки)
```

---

### Hooks и vDOM

Хуки сохраняются на fiber-ноде в виде связного списка:

```
fiber.memoizedState → [hook1] → [hook2] → [hook3] → null
                      useState  useEffect useState
```

Поэтому **порядок вызова хуков важен** — React идёт по списку по индексу. Условный вызов сломает соответствие.

---

### Когда state сбрасывается

State в React-компоненте сбрасывается, если:

1. **Тип компонента изменился** (Counter → Spinner).
2. **Position в дереве изменилась** (но React пытается сохранить через key).
3. **Ключ изменился** (`<Component key={x} />` → key меняется).

Намеренный сброс через key:

```tsx
// При смене userId форма полностью пересоздаётся, state сбрасывается
<UserForm key={userId} userId={userId} />
```

---

### Mental model: компонент = функция

```
state, props → render() → vDOM → React → DOM
```

Render — это **чистая функция** в идеале. Side effects — в useEffect, не в теле компонента. Это позволяет React безопасно вызывать render много раз (Concurrent).

---

## ⚠️ Подводные камни

### 1. Side effects в render

```tsx
// ❌ Side effect в теле компонента
function Comp() {
  const [data, setData] = useState(null);
  fetch("/api").then(setData);  // ← каждый рендер!
  return ...;
}

// ✅ В useEffect
function Comp() {
  const [data, setData] = useState(null);
  useEffect(() => { fetch("/api").then(setData); }, []);
  return ...;
}
```

### 2. Условный вызов хуков

```tsx
// ❌ Порядок хуков должен быть стабильным
function Comp({ flag }) {
  if (flag) {
    const [x] = useState(0);  // ❌
  }
  const [y] = useState(0);
  // На втором рендере без flag хук x исчезнет, y съедет → state перепутается
}

// ✅ Условие внутри
function Comp({ flag }) {
  const [x] = useState(0);
  const [y] = useState(0);
  return flag ? <Use value={x} /> : <Use value={y} />;
}
```

### 3. Ожидание мгновенного DOM-обновления

```tsx
// ❌ setState — асинхронное
const [count, setCount] = useState(0);

function onClick() {
  setCount(1);
  console.log(document.querySelector("#count")?.textContent);  // ← старое значение
}

// ✅ Если нужна работа с DOM после обновления — useEffect или ref
useEffect(() => {
  console.log(document.querySelector("#count")?.textContent);
}, [count]);
```

### 4. State при смене ключа

```tsx
// ❌ Если key меняется случайно — state теряется
{items.map(item => <Form key={Math.random()} {...item} />)}
// Форма пересоздаётся каждый рендер → пользовательский ввод теряется

// ✅ Стабильный key
{items.map(item => <Form key={item.id} {...item} />)}
```

### 5. Неоптимальный diff из-за условных wrapper-ов

```tsx
// ❌ Wrapper меняет тип → весь Form пересоздаётся, state сбрасывается
{isAdmin ? (
  <AdminWrapper>
    <Form />
  </AdminWrapper>
) : (
  <Form />
)}

// ✅ Сделай wrapper условным внутри
<Form />  // тот же Form всегда; админский вид через props
```

---

## 🔬 Тонкие моменты

**StrictMode в dev — двойной рендер**

В StrictMode React вызывает функции компонентов дважды (только в dev). Это для отлова side effects в render. Не пугайся — это нормально.

**Components как ключи vs функции**

```tsx
// Эти два — РАЗНЫЕ типы для React (разные ссылки):
function Outer() {
  const Inner = () => <div>...</div>;  // Inner — новая функция каждый рендер!
  return <Inner />;
  // → Inner всегда unmount/mount — state теряется
}

// ✅ Объявляй компоненты вне родителя
const Inner = () => <div>...</div>;
function Outer() {
  return <Inner />;
}
```

**`React.Children` API**

```tsx
React.Children.map(children, child => /* */);
React.Children.toArray(children);
React.Children.count(children);
// Старые API для работы с children. Сейчас обычно достаточно map напрямую.
```

**Fragments в diffing**

Fragment не создаёт DOM-узел, но создаёт fiber. При переключении между Fragment и div — это разные типы, дети будут пересозданы.

**Server-side rendering**

При SSR React делает render на сервере → HTML строка. На клиенте — `hydrateRoot()` создаёт vDOM из существующего DOM, не создавая узлы заново. Если структура не совпадает — hydration mismatch.

**React Compiler (forget) и vDOM**

Новый компилятор автоматически мемоизирует то, что не меняется. Это уменьшает работу на render phase, но не меняет фундаментально diffing — он остаётся таким же.

**Размер vDOM не влияет на скорость browser**

Browser-у всё равно, есть ли vDOM — он работает только с реальным DOM. Скорость зависит от:
- Сколько работы делает render phase (зависит от количества компонентов и сложности).
- Сколько DOM-операций в commit (зависит от кол-ва изменений).

**vDOM vs Solid/Svelte**

Solid и Svelte отказались от vDOM — они компилируют код, который точечно обновляет DOM напрямую. Это быстрее в теории, но потеряны некоторые возможности React (Concurrent, Suspense, и т.д.).

---

## 🧩 Задачи для закрепления

**Задача 1 — Profile diffing**
Создай простое приложение с тремя списками. Меняй порядок элементов:
1. Без `key` (React предупредит).
2. С `key={index}`.
3. С `key={item.id}`.

В DevTools Profiler посмотри на количество DOM-операций в каждом случае.

**Задача 2 — Force re-mount через key**
Сделай форму с несколькими полями. Добавь dropdown для выбора пользователя. При смене пользователя форма должна полностью сбрасываться. Реализуй через `<Form key={userId} ...>`.

**Задача 3 — Inline компонент vs вынесенный**
Создай компонент с inline-определением дочернего:
```tsx
function Parent() {
  const Child = () => <input />;
  return <Child />;
}
```
Печатай в input что-то и пусти `setForceUpdate` родителя. Заметь, что input очищается (Child пересоздаётся). Вынеси Child наружу — баг исчезнет.

**Задача 4 — Fiber-обход**
Через React DevTools → Components посмотри на структуру компонентов в твоём приложении. Это и есть fiber-tree (упрощённо). Поэкспериментируй с открытием/закрытием узлов.

**Задача 5 — Render phase vs Commit phase**
Вставь `console.log("render Comp")` в тело компонента и `console.log("commit Comp")` в `useEffect(() => {})`. Что выводится при first mount и при update? Объясни порядок.

**Задача 6 — Reconciler diffing — статья**
Прочитай и пересскажи: [React docs — Reconciliation](https://react.dev/learn/preserving-and-resetting-state). Сделай заметки.

**Задача 7 — Concurrent rendering в действии**
Реализуй компонент, который при каждом рендере выполняет `for (let i = 0; i < 1e8; i++) {}`. Включи Concurrent через `createRoot`. Используй `useTransition` для смены state. Измерь, как ввод в input остаётся отзывчивым.
