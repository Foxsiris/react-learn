## 📝 Теория

### Что такое SyntheticEvent

React оборачивает все нативные DOM-события в кросс-браузерную обёртку — **SyntheticEvent**. У неё тот же API, что и у нативного `Event` (preventDefault, stopPropagation, target, currentTarget), но поведение одинаковое во всех браузерах. Под капотом всегда лежит реальное событие — доступно через `e.nativeEvent`.

```tsx
function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
  console.log(e);              // SyntheticEvent
  console.log(e.nativeEvent);  // реальный MouseEvent
  console.log(e.target);       // элемент, на котором сработало событие
  console.log(e.currentTarget);// элемент, к которому привязан обработчик
}
```

### Event delegation в React

До React 17 React вешал ОДИН listener на `document` и сам разруливал, какой обработчик вызвать. С React 17+ events привязываются к **корневому элементу приложения** (тот, в который монтируется React). Это позволяет иметь несколько React-приложений на одной странице с независимыми обработчиками.

```
[document]
   └── [div#root]   ← React 17+ вешает все listeners сюда
         └── [App]
               └── <button onClick={...}/>
```

Когда ты пишешь `<button onClick={fn}>`, React **не** вешает реальный listener на эту кнопку — он только запоминает соответствие "элемент → обработчик". При клике событие всплывает до `#root`, и React сам вызывает нужную функцию.

---

### Все типы событий React

```tsx
// Мышь
onClick, onDoubleClick, onMouseDown, onMouseUp,
onMouseEnter, onMouseLeave, onMouseMove, onMouseOver, onMouseOut,
onContextMenu

// Клавиатура
onKeyDown, onKeyUp, onKeyPress (deprecated)

// Форма
onChange, onInput, onSubmit, onReset, onInvalid

// Фокус
onFocus, onBlur

// Тач
onTouchStart, onTouchMove, onTouchEnd, onTouchCancel

// Указатель (универсальный — мышь + тач + перо)
onPointerDown, onPointerUp, onPointerMove, onPointerCancel,
onPointerEnter, onPointerLeave, onPointerOver, onPointerOut

// Drag & Drop
onDragStart, onDrag, onDragEnd,
onDragEnter, onDragLeave, onDragOver, onDrop

// Буфер обмена
onCopy, onCut, onPaste

// Композиция (IME)
onCompositionStart, onCompositionUpdate, onCompositionEnd

// Скролл / колесо
onScroll, onWheel

// Анимация / переходы
onAnimationStart, onAnimationEnd, onAnimationIteration,
onTransitionEnd

// Медиа
onPlay, onPause, onEnded, onLoadedData, onTimeUpdate, onVolumeChange

// Захват (capture phase) — добавь Capture к любому
onClickCapture, onMouseDownCapture, ...
```

---

### Типы TypeScript для событий

Каждое событие имеет свой тип. Generic — это **тип элемента**, на котором висит обработчик:

```tsx
function App() {
  const onClick:    React.MouseEventHandler<HTMLButtonElement>  = (e) => {};
  const onChange:   React.ChangeEventHandler<HTMLInputElement>  = (e) => e.target.value;
  const onSubmit:   React.FormEventHandler<HTMLFormElement>     = (e) => e.preventDefault();
  const onKeyDown:  React.KeyboardEventHandler<HTMLInputElement>= (e) => e.key;
  const onFocus:    React.FocusEventHandler<HTMLInputElement>   = (e) => {};
  const onDragOver: React.DragEventHandler<HTMLDivElement>      = (e) => e.preventDefault();
  const onWheel:    React.WheelEventHandler<HTMLDivElement>     = (e) => e.deltaY;
  
  // Inline-вариант (предпочтительнее в JSX):
  return <button onClick={(e) => console.log(e.currentTarget.disabled)}>OK</button>;
  // e: React.MouseEvent<HTMLButtonElement> — выводится автоматически
}
```

**Общая таблица:**

| Событие | Тип | Что важно знать |
|---|---|---|
| `onClick` | `MouseEvent<T>` | `clientX/Y`, `button`, `ctrlKey/shiftKey/altKey` |
| `onChange` | `ChangeEvent<T>` | для input/select/textarea, `target.value` |
| `onSubmit` | `FormEvent<T>` | обычно `e.preventDefault()` |
| `onKeyDown` | `KeyboardEvent<T>` | `e.key` ("Enter"), `e.code` ("Enter"), `e.repeat` |
| `onFocus`/`onBlur` | `FocusEvent<T>` | `relatedTarget` — куда уходит фокус |
| `onDragStart`/`onDrop` | `DragEvent<T>` | `dataTransfer` |
| `onWheel` | `WheelEvent<T>` | `deltaY` (>0 — вниз) |
| `onTouchStart` | `TouchEvent<T>` | `touches`, `changedTouches` |
| `onAnimationEnd` | `AnimationEvent<T>` | `animationName` |

---

### Базовые паттерны

```tsx
// 1. Чтение значения input
<input onChange={e => setValue(e.target.value)} />

// 2. Передача параметров через стрелочную функцию
{items.map(item => (
  <button key={item.id} onClick={() => handleDelete(item.id)}>
    Удалить
  </button>
))}

// 3. Передача параметров через data-атрибуты (без инлайн-функции)
function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
  const id = e.currentTarget.dataset.id;
  handleDelete(Number(id));
}
{items.map(item => (
  <button key={item.id} data-id={item.id} onClick={handleClick}>
    Удалить
  </button>
))}

// 4. Обработка Enter в input
<input onKeyDown={e => {
  if (e.key === "Enter") handleSubmit();
  if (e.key === "Escape") handleCancel();
}} />

// 5. Submit формы (с preventDefault)
<form onSubmit={e => {
  e.preventDefault();
  const formData = new FormData(e.currentTarget);
  console.log(Object.fromEntries(formData));
}}>
  <input name="email" />
  <button type="submit">Send</button>
</form>

// 6. Остановка всплытия — клик внутри родителя не активирует родителя
<div onClick={openCard}>
  <button onClick={e => {
    e.stopPropagation(); // openCard не вызовется
    deleteCard();
  }}>×</button>
</div>

// 7. preventDefault — отмена дефолтного поведения
<a href="/some" onClick={e => {
  e.preventDefault(); // не уходим по ссылке
  navigate("/other"); // SPA-навигация
}}>Link</a>
```

---

### Capture-фаза (`onClickCapture`)

Каждое событие в браузере проходит **3 фазы**:
1. **Capture** — от document вниз к target
2. **Target** — на самом элементе
3. **Bubble** — обратно вверх к document

По умолчанию React-обработчики в bubble-фазе. Добавь суффикс `Capture` для capture-фазы.

```tsx
<div onClickCapture={() => console.log("1. Capture (parent)")}>
  <button
    onClickCapture={() => console.log("2. Capture (button)")}
    onClick={() => console.log("3. Bubble (button)")}
  >
    Click
  </button>
  {/* родительский bubble сработает последним */}
</div>
{/* Порядок при клике: 1 → 2 → 3 → (parent bubble, если бы был onClick) */}
```

Capture полезен для **глобального перехвата** до того, как событие дойдёт до конкретного компонента (например, focus-trap, аналитика всех кликов).

---

### Подписка на window/document события (нативные)

React-события работают только на DOM-элементах. Для глобальных событий (`window.resize`, `document.keydown`, `media query change`) используй `useEffect` + `addEventListener`:

```tsx
function useKeyboardShortcut(key: string, callback: () => void) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === key && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        callback();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [key, callback]);
}

// Использование:
useKeyboardShortcut("s", saveDocument);  // Cmd/Ctrl + S
useKeyboardShortcut("Escape", closeModal);
```

---

### Custom events (синтез своих событий)

```tsx
// Прокинуть событие через колбэк-проп — это и есть "custom event" в React
function Toggle({ onToggle }: { onToggle: (next: boolean) => void }) {
  const [on, setOn] = useState(false);
  return (
    <button onClick={() => {
      const next = !on;
      setOn(next);
      onToggle(next); // вызываем колбэк
    }}>
      {on ? "ON" : "OFF"}
    </button>
  );
}

<Toggle onToggle={(state) => console.log("changed:", state)} />
```

Если нужен реальный browser CustomEvent (для коммуникации между разными приложениями/iframe):

```tsx
// Эмиттер
const event = new CustomEvent("user:login", { detail: { id: 42 } });
window.dispatchEvent(event);

// Подписчик
useEffect(() => {
  function onLogin(e: Event) {
    const { detail } = e as CustomEvent<{ id: number }>;
    console.log(detail.id);
  }
  window.addEventListener("user:login", onLogin);
  return () => window.removeEventListener("user:login", onLogin);
}, []);
```

---

## ⚠️ Подводные камни

### 1. Вызов функции вместо передачи

```tsx
// ❌ handleClick вызовется СРАЗУ при рендере, а в onClick попадёт undefined
<button onClick={handleClick()}>Click</button>

// ❌ То же самое с параметром
<button onClick={handleDelete(id)}>Delete</button>
// handleDelete(id) вернёт что-то (или undefined) — это и попадёт в onClick

// ✅ Передаём ссылку на функцию
<button onClick={handleClick}>Click</button>

// ✅ Если нужен параметр — оборачиваем в стрелку
<button onClick={() => handleDelete(id)}>Delete</button>
```

### 2. Inline-функция и React.memo

```tsx
// ❌ Каждый рендер — новая ссылка → React.memo не помогает
const MemoButton = React.memo(Button);
<MemoButton onClick={() => doSomething(id)} />  // новая ссылка каждый раз

// ✅ useCallback стабилизирует ссылку
const handleClick = useCallback(() => doSomething(id), [id]);
<MemoButton onClick={handleClick} />
```

### 3. Async-обработчик и доступ к `e.target` после await

```tsx
// ❌ В React 16 SyntheticEvent уходил в "пул" — после await поля очищались
async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
  await fetchSomething();
  console.log(e.target.value);  // в React 16 → null
}

// React 17+ убрал event pooling — но всё равно safer паттерн:
async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
  const value = e.target.value;  // ← сохрани до await
  await fetchSomething();
  console.log(value);  // ✅ работает в любой версии
}
```

### 4. `stopPropagation` не останавливает React-обработчики верх по DOM, а не по React-дереву

```tsx
// Тонкий момент с Portals: события идут по React-дереву, не DOM!
function Modal({ children }: { children: ReactNode }) {
  return createPortal(<div className="modal">{children}</div>, document.body);
}

function App() {
  return (
    <div onClick={() => console.log("App clicked")}>
      <Modal>
        <button onClick={() => console.log("button")}>Click</button>
        {/* В DOM кнопка в body, но событие всплывёт до App в React-дереве! */}
      </Modal>
    </div>
  );
}
// При клике на button: "button" → "App clicked"
// stopPropagation на button — остановит всплытие в React, но НЕ в DOM
```

### 5. `onChange` в React ≠ `onchange` в HTML

```tsx
// HTML: onchange срабатывает на blur (потеря фокуса)
// React: onChange срабатывает на каждое изменение (как onInput в HTML)

// ✅ В React onChange = "значение изменилось" (на каждый ввод)
<input onChange={e => console.log(e.target.value)} /> // на каждый символ

// Если нужно только при потере фокуса — используй onBlur
<input onBlur={e => console.log("final:", e.target.value)} />
```

### 6. Checkbox и radio — `e.target.value` это НЕ то что ты ждёшь

```tsx
// ❌ value у чекбокса — это атрибут value, а не "включён ли он"
<input type="checkbox" value="agreed" onChange={e => console.log(e.target.value)} />
// Всегда выводит "agreed" — независимо от состояния!

// ✅ Используй checked
<input type="checkbox" onChange={e => console.log(e.target.checked)} />

// Для radio — value важен (определяет выбранное значение):
<input type="radio" name="color" value="red"   onChange={e => setColor(e.target.value)} />
<input type="radio" name="color" value="blue"  onChange={e => setColor(e.target.value)} />
```

### 7. `onScroll` — НЕ всплывает в React

```tsx
// onScroll работает только если повешен напрямую на скроллящийся элемент
// Он не bubble'ится в React (как и в нативе)

// ❌ Не сработает, если scroll внутри
<div onScroll={handleScroll}>
  <div style={{ overflow: "auto" }}>...</div>
</div>

// ✅ Вешай на сам скроллящийся контейнер
<div style={{ overflow: "auto" }} onScroll={handleScroll}>...</div>
```

### 8. `passive: true` нельзя задать через JSX

```tsx
// onWheel/onTouchMove с preventDefault блокируют скролл,
// но их нельзя пометить пассивными через JSX (производительность скролла)

// ✅ Только через addEventListener в useEffect
useEffect(() => {
  const el = ref.current;
  if (!el) return;
  function onWheel(e: WheelEvent) { /* ... */ }
  el.addEventListener("wheel", onWheel, { passive: true });
  return () => el.removeEventListener("wheel", onWheel);
}, []);
```

---

## 🔬 Тонкие моменты

**`e.target` vs `e.currentTarget`**

```tsx
<div onClick={(e) => {
  console.log(e.target);        // конкретный элемент, на который кликнули
  console.log(e.currentTarget); // div, к которому прикреплён обработчик
}}>
  <span>Внутри</span>
</div>
// Клик на span: target = <span>, currentTarget = <div>
// TypeScript у currentTarget типизирован, у target — Element (нужно приводить)
```

**`relatedTarget` у focus/blur**

```tsx
<input
  onBlur={(e) => {
    // Куда ушёл фокус
    if (e.relatedTarget?.tagName === "BUTTON") {
      // фокус ушёл на кнопку — не валидируем
    }
  }}
/>
```

**Ключи клавиш: `key` vs `code` vs `keyCode`**

```tsx
onKeyDown={(e) => {
  e.key;     // "Enter", "a", "A", "ArrowUp" — учитывает раскладку и регистр
  e.code;    // "Enter", "KeyA", "ArrowUp" — физическая клавиша, независимо от раскладки
  e.keyCode; // 13, 65 — ❌ DEPRECATED, не использовать
  e.which;   // ❌ DEPRECATED
  
  // ✅ Используй e.key для печатных, e.code для горячих клавиш
}}
```

**`onClick` не сработает на `disabled` элементах**

```tsx
// Браузер блокирует все события на disabled <button>, <input>, <select>
<button disabled onClick={() => alert("hi")}>Click</button>  // ❌ ничего

// ✅ Если нужен клик "вокруг" disabled — оберни в div
<div onClick={() => alert("disabled")}>
  <button disabled>Click</button>
</div>
```

**Order событий при mouseDown → mouseUp → click**

```
1. pointerdown
2. mousedown
3. (внутри click-цепочки) focus, blur
4. pointerup
5. mouseup
6. click  ← последним
```

При drag — `click` НЕ срабатывает (если был mousemove между down/up за пределами).

**`React.MouseEvent` vs `MouseEvent`**

```tsx
// Это РАЗНЫЕ типы!
import { MouseEvent } from "react";   // SyntheticEvent
const native: MouseEvent = ...;       // global DOM-тип

// Лучше явно:
const onClick = (e: React.MouseEvent<HTMLButtonElement>) => {};
window.addEventListener("click", (e: MouseEvent) => {}); // глобальный
```

**Composition events (IME для китайского/японского)**

```tsx
// При вводе через IME (например, японский) — onChange срабатывает на каждом промежуточном символе
// Что мешает поиску с debounce
const [composing, setComposing] = useState(false);

<input
  onCompositionStart={() => setComposing(true)}
  onCompositionEnd={(e) => {
    setComposing(false);
    setSearch((e.target as HTMLInputElement).value);
  }}
  onChange={(e) => {
    if (!composing) setSearch(e.target.value);
  }}
/>
```

---

## 🧩 Задачи для закрепления

**Задача 1 — Dropdown с закрытием по клику вне**
Реализуй компонент `Dropdown` с `<button>` и `<div>`-меню. Меню закрывается:
1. По клику вне компонента (через `document.addEventListener("mousedown")` + проверка `contains`).
2. По нажатию `Escape`.
3. При открытии другого Dropdown — старый закрывается.
   
Используй `useRef` для хранения DOM-элемента и проверки `e.target` в обработчике.

**Задача 2 — Хук горячих клавиш**
Напиши `useHotkeys(map: Record<string, () => void>)`, где ключ — комбинация (`"cmd+s"`, `"ctrl+shift+p"`, `"escape"`), значение — обработчик. Поддержи:
- Кросс-платформу (Cmd на Mac, Ctrl на Windows).
- Игнорирование при фокусе в `<input>`/`<textarea>` (опционально через флаг).
- Множественные обработчики на одну клавишу.

**Задача 3 — Drag & drop элементов**
Реализуй сортируемый список через нативный HTML5 DnD: `draggable`, `onDragStart`, `onDragOver`, `onDrop`. Передавай ID элемента через `e.dataTransfer.setData("text/plain", id)`. Не забудь `e.preventDefault()` в `onDragOver` (без него `drop` не сработает).

**Задача 4 — Глобальный аналитический трекер**
Через `onClickCapture` на корневом `<App>` логируй ВСЕ клики в приложении, отправляя `{ tag, text, dataset }` в аналитику. Не мешая работе самих обработчиков.

**Задача 5 — Multi-select клавишами**
Список элементов. Поддержи:
- Click — выделить один.
- Cmd/Ctrl + Click — добавить/убрать из выделения.
- Shift + Click — диапазон от последнего до текущего.
- Стрелки ↑/↓ — навигация (focus + выделение). Enter — действие.

**Задача 6 — Long press**
Хук `useLongPress(callback, { delay = 500 })`, возвращающий пропсы для элемента (`onMouseDown`, `onMouseUp`, `onMouseLeave`, `onTouchStart`, `onTouchEnd`). Если пользователь держит мышь/палец >500мс — срабатывает callback. При движении — отмена.
