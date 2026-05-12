## 📝 Теория

### React event types — обзор

React оборачивает все события в **SyntheticEvent**. Все типы — generic, параметр — тип HTML-элемента, на котором событие происходит.

```tsx
React.SyntheticEvent<T>      // базовый
  ├─ React.UIEvent<T>          // ui events
  │   ├─ React.MouseEvent<T>     // click, mouseover, ...
  │   ├─ React.TouchEvent<T>     // touchstart, ...
  │   ├─ React.PointerEvent<T>   // pointerdown, ...
  │   ├─ React.WheelEvent<T>     // wheel
  │   ├─ React.KeyboardEvent<T>  // keydown, keyup, ...
  │   └─ React.FocusEvent<T>     // focus, blur
  ├─ React.ChangeEvent<T>      // change input
  ├─ React.FormEvent<T>        // submit, reset
  ├─ React.DragEvent<T>        // dragstart, drop, ...
  ├─ React.ClipboardEvent<T>   // copy, paste
  ├─ React.AnimationEvent<T>   // animationstart
  └─ React.TransitionEvent<T>  // transitionend
```

---

### Главные типы и handlers

```tsx
// onChange (input/textarea/select)
const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  e.target.value;        // string
  e.target.checked;      // boolean (для checkbox)
  e.target.files;        // FileList | null (для type="file")
};

// onClick
const onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
  e.currentTarget;       // HTMLButtonElement
  e.target;              // EventTarget — может быть child element!
  e.clientX; e.clientY;
  e.shiftKey; e.ctrlKey;
};

// onSubmit
const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  const formData = new FormData(e.currentTarget);
};

// onKeyDown
const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  e.key;            // "Enter", "ArrowUp", "a", ...
  e.code;           // "Enter", "ArrowUp", "KeyA", ...
  e.ctrlKey; e.shiftKey; e.altKey; e.metaKey;
};

// onFocus / onBlur
const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
  e.relatedTarget; // куда переходит фокус (или откуда пришёл)
};

// onScroll
const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
  e.currentTarget.scrollTop;
};

// onWheel
const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
  e.deltaY;
};

// onDrop / onDragOver
const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
  e.preventDefault();
  const files = e.dataTransfer.files;
};

// onCopy / onPaste
const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
  const text = e.clipboardData.getData("text");
};
```

---

### Inline vs handler — TypeScript вывод

```tsx
// ✅ Inline — TypeScript выводит из контекста (по типу onClick)
<button onClick={(e) => console.log(e.shiftKey)} />
//                ↑ автоматически e: React.MouseEvent<HTMLButtonElement>

// ✅ Handler с явным типом
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => { ... };
<button onClick={handleClick} />

// ❌ Без типа handler — e: any
const handleClick = (e) => { ... };  // ❌ implicit any
```

---

### currentTarget vs target

```tsx
// e.currentTarget — элемент, на котором установлен handler (типизирован)
// e.target       — элемент, на котором СОБЫТИЕ ПРОИЗОШЛО (всегда EventTarget)

<div onClick={(e) => {
  e.currentTarget;  // div
  e.target;         // EventTarget — может быть div, button внутри, span внутри...
}}>
  <button>Click</button>
</div>

// При клике на button:
//   currentTarget = div
//   target        = button

// Чтобы типизировать target:
const target = e.target as HTMLButtonElement;
```

---

### Тип event handler из React

Вместо ручной типизации параметра, можно использовать тип handler:

```tsx
type ChangeHandler = React.ChangeEventHandler<HTMLInputElement>;
type ClickHandler = React.MouseEventHandler<HTMLButtonElement>;
type KeyHandler = React.KeyboardEventHandler<HTMLInputElement>;

const onChange: ChangeHandler = (e) => { ... };
// Эквивалент: const onChange = (e: React.ChangeEvent<HTMLInputElement>) => { ... };
```

Полезно для пропсов компонентов:

```tsx
type InputProps = {
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
};
```

---

### Несколько типов элементов

Если handler работает с разными элементами:

```tsx
type FieldChange = React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;

const handleField = (e: FieldChange) => {
  setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
};

<input name="email" onChange={handleField} />
<select name="role" onChange={handleField}>...</select>
```

---

### Keyboard events

```tsx
const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === "Enter") submit();
  if (e.key === "Escape") cancel();
  if (e.key === "ArrowDown") navigate("down");
  if (e.ctrlKey && e.key === "s") {
    e.preventDefault();
    save();
  }
  // metaKey — Cmd на Mac, Win на Windows
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") submit();
};
```

`e.key` vs `e.code`:
- `e.key` — символ ("a", "ArrowUp", "Enter") — учитывает раскладку.
- `e.code` — физическая клавиша ("KeyA", "ArrowUp", "Enter") — не зависит от раскладки.

---

### Focus events

```tsx
const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
  e.relatedTarget;  // куда фокус переходит (HTMLElement | null)
  // Полезно для click-outside
};

const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
  e.relatedTarget;  // откуда фокус пришёл
};
```

---

### Drag and drop

```tsx
const [dragOver, setDragOver] = useState(false);

const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
  e.preventDefault();
  setDragOver(true);
};

const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
  setDragOver(false);
};

const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
  e.preventDefault();
  setDragOver(false);
  const files = e.dataTransfer.files;
  // обработка файлов
};

<div
  onDragOver={onDragOver}
  onDragLeave={onDragLeave}
  onDrop={onDrop}
  className={dragOver ? "drag-over" : ""}
>
  Drop here
</div>
```

---

### File input

```tsx
const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files;
  if (!files) return;
  
  const file = files[0];
  // или: Array.from(files) для multiple
};

<input type="file" onChange={onFile} />
<input type="file" multiple onChange={onFile} />
```

---

### Custom events / event interfaces

```tsx
// Наследуем интерфейс события
interface CustomChangeEvent extends React.ChangeEvent<HTMLInputElement> {
  target: HTMLInputElement & { dataset: { customId: string } };
}

const onChange = (e: CustomChangeEvent) => {
  e.target.dataset.customId;  // string
};
```

---

### Обработчик от пропа

```tsx
type ButtonProps = {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
};

function Button({ onClick }: ButtonProps) {
  return <button onClick={onClick} />;
}

// или через generic тип
type ButtonProps = {
  onClick: React.MouseEventHandler<HTMLButtonElement>;
};
```

---

### Native event vs SyntheticEvent

```tsx
const onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
  e;            // SyntheticEvent
  e.nativeEvent; // нативный MouseEvent (DOM)
};
```

В большинстве случаев SyntheticEvent — то, что нужно.

---

### React 17+ event delegation

В React 17+ события делегируются на root container, не document. Для типизации это не имеет значения.

---

### Generic event handlers

```tsx
// Обобщённая функция-фабрика
function makeChangeHandler<T extends HTMLElement>(
  setter: (val: string) => void
) {
  return (e: React.ChangeEvent<T>) => {
    setter((e.target as any).value);
  };
}

// или через типов:
type AnyInputElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

function field<T extends AnyInputElement>(name: string) {
  return (e: React.ChangeEvent<T>) => {
    setForm(prev => ({ ...prev, [name]: e.target.value }));
  };
}

<input onChange={field<HTMLInputElement>("email")} />
```

---

## ⚠️ Подводные камни

### 1. e.target vs e.currentTarget

```tsx
// ❌ Можно получить вложенный элемент
<button onClick={(e) => {
  console.log(e.target.tagName);  // может быть "SPAN" если внутри <button><span>...</span>
}}>
  <span>Click</span>
</button>

// ✅ currentTarget — всегда тот, на котором handler
e.currentTarget.tagName  // всегда "BUTTON"
```

### 2. Implicit any в handler

```tsx
// ❌
const onChange = (e) => { ... };  // e: any

// ✅
const onChange = (e: React.ChangeEvent<HTMLInputElement>) => { ... };
// или inline:
<input onChange={(e) => ...} />  // тип выводится
```

### 3. Wrong element type

```tsx
// ❌ Тип не совпадает с реальным элементом
const onClick: React.MouseEventHandler<HTMLDivElement> = (e) => {...};
<button onClick={onClick} />  // ❌ button не div
```

### 4. preventDefault() в правильное время

```tsx
// ❌ После async — может быть поздно
const onSubmit = async (e: FormEvent) => {
  await something();
  e.preventDefault();  // браузер уже отправил форму
};

// ✅ Сразу
const onSubmit = async (e: FormEvent) => {
  e.preventDefault();
  await something();
};
```

### 5. Persisting events (deprecated)

```tsx
// React 16: SyntheticEvent переиспользуется → нельзя использовать асинхронно
// e.persist() — раньше нужен был для async
// React 17+: events не переиспользуются, persist() — no-op
```

### 6. Bubble vs capture

```tsx
<div onClick={...}>     // bubble (default)
<div onClickCapture={...}>  // capture phase
```

В TypeScript — оба имеют тот же тип события.

### 7. Касание deltaY не везде число

```tsx
e.deltaY  // number, но может быть 0
// Нормализация для cross-browser:
const delta = Math.sign(e.deltaY);
```

### 8. files может быть null

```tsx
const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
  e.target.files  // FileList | null
  // ❌ e.target.files[0] — ошибка если null
  // ✅
  if (!e.target.files || e.target.files.length === 0) return;
  const file = e.target.files[0];
};
```

### 9. e.key === "Spacebar" в legacy браузерах

```tsx
if (e.key === " " || e.key === "Spacebar") { ... }
// modern: " ", legacy IE: "Spacebar"
```

### 10. Composition events (для IME)

```tsx
const onCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
  // Для IME (китайский, японский input)
  // onChange срабатывает много раз во время composition
};
```

---

## 🔬 Тонкие моменты

**MouseEvent на разных тегах**

```tsx
React.MouseEvent<HTMLButtonElement>  // event на button
React.MouseEvent<HTMLDivElement>     // event на div
React.MouseEvent<HTMLAnchorElement>  // event на a
// Параметр T — тип e.currentTarget
```

**TouchEvent vs PointerEvent**

```tsx
// PointerEvent — современный, объединяет mouse + touch + pen
const onPointer = (e: React.PointerEvent<HTMLDivElement>) => {
  e.pointerType;  // "mouse" | "touch" | "pen"
  e.pressure;
};

// TouchEvent — только touch
const onTouch = (e: React.TouchEvent<HTMLDivElement>) => {
  e.touches;       // TouchList
  e.changedTouches;
};
```

**Animation / transition events**

```tsx
const onAnimationEnd = (e: React.AnimationEvent<HTMLDivElement>) => {
  e.animationName;
};

const onTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
  e.propertyName;  // какое свойство закончило transition
};
```

**Generic forms with TypeScript discriminator**

```tsx
type FormFields = {
  name: string;
  age: number;
  isAdmin: boolean;
};

const handleField = <K extends keyof FormFields>(name: K) => 
  (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === "checkbox" 
      ? e.target.checked as FormFields[K]
      : e.target.value as FormFields[K];
    setForm(prev => ({ ...prev, [name]: value }));
  };
```

**Native event listener (addEventListener)**

```tsx
useEffect(() => {
  const handler = (e: MouseEvent) => { ... };  // ← Native MouseEvent, не React!
  window.addEventListener("mousemove", handler);
  return () => window.removeEventListener("mousemove", handler);
}, []);
```

Native MouseEvent — DOM API, не React.

**Globally-typed e — антипаттерн**

```tsx
// ❌ Лучше явно типизировать каждый handler
const handler = (e: any) => { ... };

// ✅
const handler = (e: React.MouseEvent<HTMLButtonElement>) => { ... };
```

**EventTarget трудно типизировать**

```tsx
const onClick = (e: React.MouseEvent) => {
  // e.target — EventTarget (без свойств HTMLElement)
  // ✅ assert
  if (e.target instanceof HTMLAnchorElement) {
    e.target.href;  // typed
  }
};
```

**SyntheticEvent.persist() устарел**

В React 17+ события не переиспользуются. `persist()` ничего не делает.

**InputEvent — отдельный тип**

```tsx
const onInput = (e: React.FormEvent<HTMLInputElement>) => {
  // FormEvent, не InputEvent в React
  e.currentTarget.value;
};

// В нативном DOM — InputEvent с e.inputType, e.data
```

**Обращение к refs внутри handlers**

```tsx
const ref = useRef<HTMLInputElement>(null);
const onSubmit = (e: React.FormEvent) => {
  ref.current?.focus();
};
```

---

## 🧩 Задачи для закрепления

**Задача 1 — Универсальный field handler**
Реализуй `handleField` для формы с разными типами input (text, number, checkbox). Правильно типизируй для всех случаев. Возвращай данные нужного типа.

**Задача 2 — Drag & drop с типами**
Реализуй DropZone компонент. Правильно типизируй все drag* события. При drop принимай файлы (FileList).

**Задача 3 — useKeyboard хук**
Хук принимает map `{ "Enter": fn, "Escape": fn, "Ctrl+S": fn }`. Внутри подписывается на keydown с типизацией. Использование: `useKeyboard({ Enter: submit })`.

**Задача 4 — Custom select с keyboard navigation**
Select компонент. ArrowDown/Up — навигация по опциям, Enter — выбор, Escape — закрыть. Типизируй keyboard events.

**Задача 5 — Auto-resize textarea**
Textarea, которая увеличивается с вводом. Используй onChange + ref. Типизируй правильно.

**Задача 6 — Click outside hook**
useClickOutside(ref, callback). Подписка на mousedown с правильным типом MouseEvent. Учти разницу target vs currentTarget.

**Задача 7 — Form data extraction**
В onSubmit получи FormData из event. Типизируй так, чтобы вытащить поля с правильными типами (используя generic + Zod).

**Задача 8 — Typed event emitter**
Реализуй мини event emitter с типизированными событиями: `emit<K>(event: K, payload: Events[K])`. Используй для UI событий.

**Задача 9 — Focus trap**
Компонент FocusTrap, который ловит Tab/Shift+Tab и не выпускает фокус наружу. Типизируй FocusEvent + KeyboardEvent.

**Задача 10 — Touch + mouse → Pointer**
Реализуй draggable компонент через PointerEvent (объединяющий mouse и touch). Типизируй все pointer-события.
