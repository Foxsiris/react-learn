## 📝 Теория

### Что такое batching

**Batching** — объединение нескольких обновлений state в **один рендер**. Без batching каждый `setState` вызывал бы отдельный рендер. С batching — все вызовы в одной "транзакции" группируются.

```tsx
function handleClick() {
  setCount(c => c + 1);    // ┐
  setName("Bob");          // │ React выполнит ОДИН рендер
  setFlag(true);           // ┘ с обновлёнными count, name, flag
}
```

**Зачем:** меньше рендеров → выше производительность, отсутствие промежуточных "разорванных" состояний UI.

### React 17 — частичный batching

В React 17 batching работал **только в обработчиках событий React**:

```tsx
// React 17:

// ✅ Батчится — внутри React event handler
function onClick() {
  setA(1);    // ┐
  setB(2);    // │ один рендер
  setC(3);    // ┘
}

// ❌ Не батчится — setTimeout, Promise, нативные события
setTimeout(() => {
  setA(1);    // рендер
  setB(2);    // рендер
  setC(3);    // рендер
}, 0);

fetch("/api").then(() => {
  setA(1);    // рендер
  setB(2);    // рендер
});
```

### React 18 — Automatic Batching

В React 18 batching работает **везде**:

```tsx
// React 18:

// ✅ Батчится в любом контексте
setTimeout(() => {
  setA(1);    // ┐
  setB(2);    // │ один рендер
  setC(3);    // ┘
}, 0);

fetch("/api").then(() => {
  setA(1);    // ┐
  setB(2);    // ┘ один рендер
});

document.addEventListener("click", () => {
  setA(1);    // ┐
  setB(2);    // ┘ один рендер (нативное событие!)
});
```

### Условия для активации Automatic Batching

Чтобы получить новое поведение, нужно использовать:

```tsx
// React 18 createRoot — обязательно!
import { createRoot } from "react-dom/client";

const root = createRoot(document.getElementById("root")!);
root.render(<App />);

// ❌ Старый ReactDOM.render — поведение React 17
ReactDOM.render(<App />, container);
```

---

### `flushSync` — отключить batching принудительно

Иногда нужно, чтобы обновление **синхронно** применилось к DOM (без batching). Для этого — `flushSync`:

```tsx
import { flushSync } from "react-dom";

function handleClick() {
  flushSync(() => {
    setCount(c => c + 1);  // рендер сразу, до выхода из flushSync
  });
  // К этому моменту DOM уже обновлён
  
  flushSync(() => {
    setName("Bob");        // ещё один рендер сразу
  });
}
```

### Когда нужен flushSync

#### 1. Прокрутка к новому элементу

```tsx
function addAndScroll() {
  flushSync(() => {
    setMessages(m => [...m, newMsg]);  // DOM обновляется немедленно
  });
  // Теперь новый элемент уже в DOM — можно скроллить
  scrollContainer.scrollTop = scrollContainer.scrollHeight;
}

// ❌ Без flushSync скролл сработает ДО появления элемента → не туда
```

#### 2. Фокус на новый элемент

```tsx
function addInput() {
  flushSync(() => {
    setShowInput(true);
  });
  inputRef.current?.focus();  // input уже в DOM
}
```

#### 3. Анимация на основе нового layout

```tsx
function expand() {
  flushSync(() => {
    setHeight(measureContent());  // DOM обновился
  });
  startAnimation();  // нужны уже актуальные размеры
}
```

#### 4. Чтение DOM для измерений

```tsx
function show() {
  flushSync(() => {
    setVisible(true);  // элемент в DOM
  });
  const rect = ref.current!.getBoundingClientRect();  // правильные размеры
}
```

> ⚠️ `flushSync` — escape hatch. Используй только когда реально нужно. Обычно решения через `useLayoutEffect` чище.

---

### Старое API: `unstable_batchedUpdates`

В React 17 для группировки обновлений в нативных handler-ах использовалось:

```tsx
import { unstable_batchedUpdates } from "react-dom";

socket.on("message", (msg) => {
  unstable_batchedUpdates(() => {
    setMessage(msg);
    setUnread(true);
    setLastUpdate(Date.now());
  });
  // Один рендер вместо трёх
});
```

В React 18 это **не нужно** — automatic batching покрывает.

---

### setState — асинхронное

Понимай: даже без batching, `setState` асинхронно. Это значит:

```tsx
const [count, setCount] = useState(0);

function onClick() {
  setCount(1);
  console.log(count);  // 0 (старое значение!)
  // count обновится только после рендера
}

// ✅ Если нужно прочитать после обновления — useEffect или ref
useEffect(() => {
  console.log("count теперь:", count);
}, [count]);
```

---

### Functional updates

Когда новый state зависит от предыдущего — используй функцию:

```tsx
// ❌ count замкнулся на старом значении
function tripleClick() {
  setCount(count + 1);  // count = 0 → 1
  setCount(count + 1);  // count = 0 → 1 (тот же count в замыкании!)
  setCount(count + 1);  // count = 0 → 1
}
// Результат: count = 1, не 3!

// ✅ Functional update — берёт актуальное предыдущее значение
function tripleClick() {
  setCount(c => c + 1);  // 0 → 1
  setCount(c => c + 1);  // 1 → 2
  setCount(c => c + 1);  // 2 → 3
}
// Результат: count = 3 ✓
```

---

### Производительность batching

Без batching при 10 setState — 10 рендеров. С batching — 1 рендер. На больших деревьях разница огромная.

```tsx
// Симуляция тяжёлого обновления
function bulkUpdate() {
  for (let i = 0; i < 100; i++) {
    setItem(i);  // в React 18 — один рендер
  }
}

// ✅ В React 18 это работает быстро
// ❌ В React 17 — 100 рендеров → могут быть тормоза
```

---

### Concurrent rendering и batching

Concurrent rendering усиливает batching:
- Низкоприоритетные обновления (`startTransition`) могут быть **отложены** ещё дольше — пока есть что-то срочное.
- React может **выкинуть** запланированные обновления, если они стали неактуальны.

```tsx
function onChange(value) {
  setQuery(value);  // срочно — рендер быстро
  startTransition(() => {
    setFilteredResults(filter(value));  // не срочно — может откладываться
  });
}
```

---

## ⚠️ Подводные камни

### 1. Считается state до рендера

```tsx
// ❌ count в console.log — старое значение
function onClick() {
  setCount(1);
  console.log(count);  // 0
}

// ✅ Если нужно текущее значение — ref
function onClick() {
  setCount(1);
  countRef.current = 1;
  console.log(countRef.current);  // 1
}
```

### 2. flushSync в effect — антипаттерн

```tsx
// ❌ flushSync в useEffect → сразу синхронный рендер → может быть проблема
useEffect(() => {
  flushSync(() => setCount(c => c + 1));
}, []);

// ✅ Не используй flushSync в эффектах без особой необходимости
```

### 3. flushSync дорогой

```tsx
// ❌ flushSync в цикле — каждое обновление = синхронный рендер
for (let i = 0; i < 100; i++) {
  flushSync(() => setItem(i));  // 100 рендеров!
}

// ✅ Без flushSync — automatic batching → один рендер
for (let i = 0; i < 100; i++) {
  setItem(i);
}
```

### 4. Старый ReactDOM.render не даёт automatic batching

```tsx
// ❌ Не используй
ReactDOM.render(<App />, container);  // legacy

// ✅ React 18+
const root = createRoot(container);
root.render(<App />);
```

### 5. Тестирование с разными версиями

В тестах с jest-dom и testing-library важно использовать `act` чтобы дождаться окончания всех batch-обновлений:

```tsx
import { act } from "@testing-library/react";

await act(async () => {
  fireEvent.click(button);
  // дождаться всех setState
});
```

### 6. Race conditions при async batching

```tsx
async function loadData() {
  const data = await fetch(...);
  setData(data);
  setLoading(false);
}

// При unmount компонента до завершения async → setState на размонтированный
// React 18 не предупреждает (раньше было warning), но баг возможен
```

---

## 🔬 Тонкие моменты

**Batching работает только для setState от React**

```tsx
// ❌ DOM-операции вне React не батчатся (естественно)
element.style.color = "red";
element.style.background = "blue";
// Это не setState, это прямая работа с DOM
```

**Functional update — рекомендуется всегда, когда зависит от prev**

```tsx
// Не нужно think "будет ли batching" — функциональное обновление работает всегда
setCount(c => c + 1);
setCount(c => c * 2);
// 0 → 1 → 2 (если 0 начальное)
```

**Batching и Suspense**

Suspense + transition + batching работают вместе:
- При rendering нового состояния React может выкинуть рендер если приходит ещё одно изменение.
- Batching позволяет "копить" изменения для одного рендера.

**`flushSync` блокирует main thread**

При вызове `flushSync` React **синхронно** выполняет:
1. Render всех компонентов с изменениями.
2. Reconciliation diff.
3. Commit DOM-операций.
4. Вызов всех useLayoutEffect.

Для тяжёлого дерева это может быть 50+ ms блокировки → пользователь увидит лаг.

**`React.unstable_act` для тестов**

```tsx
import { act } from "react";

await act(async () => {
  ReactDOM.flushSync(() => doSomething());
});
// Гарантирует, что все обновления применены до проверки
```

**Migrate React 17 → 18**

Большинство приложений работают без изменений. Возможные баги:
- Код, полагающийся на "несгруппированные" setState (редкий случай).
- Тесты, не использующие `act` правильно.

**Concurrent + batching**

```tsx
// React 18 может откладывать low-priority обновления
startTransition(() => setHeavy(...));
// Этот рендер откладывается, пока есть user interactions
// Внутри transition тоже работает batching
```

**setState с одним значением — bailout**

Если новый state === старому → React пропускает рендер (но один проход ему всё-таки делает для проверки).

```tsx
const [v, setV] = useState(0);
setV(0);  // → React попробует, но не будет рендерить компонент
```

---

## 🧩 Задачи для закрепления

**Задача 1 — Доказательство automatic batching**
Создай компонент с 3 useState и логом в render. В обработчике setTimeout вызови все три setState. В React 18 — должен быть один лог. В React 17 (если есть к чему) — три.

**Задача 2 — flushSync для скролла**
Чат: при отправке сообщения нужно прокрутиться к новому элементу. Сделай через `flushSync`. Покажи, что без него скролл происходит ДО появления нового сообщения (баг).

**Задача 3 — flushSync для focus**
Форма с условным полем. При клике "Add field" — поле появляется и должно сразу получить фокус. Используй flushSync, чтобы поле было в DOM перед `.focus()`.

**Задача 4 — Functional update тест**
Кнопка "+3", при клике вызывает setCount три раза. Покажи, что:
1. `setCount(count + 1) × 3` → +1.
2. `setCount(c => c + 1) × 3` → +3.

**Задача 5 — Profiler с/без batching**
Создай компонент с 50 useState. В обработчике вызови все setState. Сравни в Profiler:
- React 18 — один рендер.
- React 17 эмуляция через ReactDOM.render — 50 рендеров.

**Задача 6 — Async batching в Promise**
Async функция:
```tsx
async function load() {
  setData(d);
  setLoading(false);
  setError(null);
}
```
Замерь рендеры в React 18 vs React 17.

**Задача 7 — Race condition**
Реализуй компонент с двумя кнопками "Load A" и "Load B". Каждая делает fetch и setState. Если кликнуть быстро A → B, какой результат окажется в state? Используй AbortController.

**Задача 8 — flushSync в анимации**
FLIP-анимация: измерил начальную позицию → setState (новая позиция) → измерил конечную → animate. Без flushSync — измерения неправильные. Реализуй правильно.
