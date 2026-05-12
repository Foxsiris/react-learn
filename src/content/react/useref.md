## 📝 Теория

### Что такое useRef

`useRef(initialValue)` возвращает мутабельный объект с одним полем `current`. Этот объект:

1. **Сохраняется между рендерами** (как state).
2. **Изменение `.current` НЕ вызывает рендер** (в отличие от state).
3. **Один и тот же объект** на протяжении всей жизни компонента — стабильная ссылка.

```tsx
const ref = useRef<T>(initialValue);
// ref имеет тип { current: T }
// ref.current = newValue   ← присваивание не триггерит рендер
```

### Два главных кейса использования

**Кейс 1. DOM ref** — получить ссылку на конкретный DOM-элемент:

```tsx
const inputRef = useRef<HTMLInputElement>(null);

useEffect(() => {
  inputRef.current?.focus();  // вызвать DOM API
}, []);

return <input ref={inputRef} />;
```

**Кейс 2. Instance variable** — хранить значение между рендерами без триггера ре-рендера:

```tsx
const renderCountRef = useRef(0);
renderCountRef.current++;  // не триггерит рендер
console.log("Рендер №", renderCountRef.current);
```

---

### Как ведёт себя `ref` под капотом

```tsx
// Псевдокод React:
function useRef(initial) {
  return useMemo(() => ({ current: initial }), []);
  // Объект создаётся один раз, никогда не меняется
}
```

Поэтому `ref` — это просто **стабильный объект-контейнер**, в который ты можешь класть что угодно.

---

### DOM ref — детальные примеры

```tsx
// 1. Фокус при монтировании
function AutoFocus() {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  return <input ref={ref} />;
}

// 2. Чтение размеров элемента
function MeasureBox() {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  
  useLayoutEffect(() => {
    if (!ref.current) return;
    const { width, height } = ref.current.getBoundingClientRect();
    setSize({ w: width, h: height });
  }, []);
  
  return <div ref={ref}>Я {size.w}×{size.h}px</div>;
}

// 3. Управление видеоплеером
function Player() {
  const videoRef = useRef<HTMLVideoElement>(null);
  return (
    <>
      <video ref={videoRef} src="..." />
      <button onClick={() => videoRef.current?.play()}>▶</button>
      <button onClick={() => videoRef.current?.pause()}>⏸</button>
    </>
  );
}

// 4. Скролл к элементу
function ScrollToBottom({ messages }) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);
  return (
    <>
      {messages.map(m => <div key={m.id}>{m.text}</div>)}
      <div ref={endRef} />
    </>
  );
}

// 5. Интеграция с библиотеками без React-обёртки (Chart.js, D3, Map)
function Chart({ data }) {
  const elRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  
  useEffect(() => {
    if (!elRef.current) return;
    chartRef.current = new Chart(elRef.current, { data });
    return () => chartRef.current?.destroy();
  }, []);
  
  useEffect(() => {
    chartRef.current?.update(data);
  }, [data]);
  
  return <canvas ref={elRef} />;
}
```

---

### Instance variable — паттерны

```tsx
// 1. Хранение таймера (нужно очищать)
function Timer() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function start() {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => alert("⏰"), 5000);
  }

  function cancel() {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return <><button onClick={start}>Старт</button><button onClick={cancel}>Стоп</button></>;
}

// 2. Хук usePrevious — предыдущее значение
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  useEffect(() => { ref.current = value; });
  return ref.current;
}

function Counter({ count }: { count: number }) {
  const prev = usePrevious(count);
  return <p>Сейчас {count}, было {prev}</p>;
}

// 3. Mounted-флаг — игнорирование первого useEffect
function useDidUpdateEffect(fn: () => void, deps: any[]) {
  const isFirst = useRef(true);
  useEffect(() => {
    if (isFirst.current) { isFirst.current = false; return; }
    return fn();
  }, deps);
}

// 4. Latest-callback — всегда актуальная функция в замыкании
function useLatest<T>(value: T) {
  const ref = useRef(value);
  useEffect(() => { ref.current = value; });
  return ref;
}

function Component({ onSave }: { onSave: () => void }) {
  const latestSave = useLatest(onSave);
  
  useEffect(() => {
    const id = setInterval(() => latestSave.current(), 1000);
    return () => clearInterval(id);
  }, []);  // ← деps пустой, но onSave всегда актуальный
}

// 5. Уникальный ID на жизнь компонента
function uniqueIdComponent() {
  const idRef = useRef(crypto.randomUUID());
  return <div data-id={idRef.current}>...</div>;
}
```

---

### Callback ref — функция вместо объекта

`ref` может быть не только объектом, но и **функцией**. React вызывает её при mount (с DOM-элементом) и при unmount (с `null`).

```tsx
function CallbackRef() {
  const setRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      console.log("mounted, размер:", node.getBoundingClientRect());
    } else {
      console.log("unmounted");
    }
  }, []);

  return <div ref={setRef}>Hi</div>;
}
```

**Когда callback ref удобнее `useRef`:**
- Нужно **отреагировать** на появление/исчезновение элемента (а не просто получить ссылку).
- Нужно отслеживать размер: можно сразу подключить `ResizeObserver`.
- Условный рендер элемента — не нужно проверять `current` в эффекте.

```tsx
// Reactive measurement — без useEffect
function useMeasure() {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const ref = useCallback((node: HTMLElement | null) => {
    if (!node) return;
    const ro = new ResizeObserver(([entry]) => setRect(entry.contentRect));
    ro.observe(node);
    return () => ro.disconnect();
  }, []);
  return [ref, rect] as const;
}
```

---

### `forwardRef` — передача ref в кастомный компонент

По умолчанию `ref` — особый prop, не передаётся как обычный. Для проброса в дочерний компонент нужен `React.forwardRef`:

```tsx
import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, ...props }, ref) => (
    <label>
      {label}
      <input ref={ref} {...props} />
    </label>
  )
);

// Использование
const inputRef = useRef<HTMLInputElement>(null);
<Input ref={inputRef} label="Имя" />
useEffect(() => inputRef.current?.focus(), []);
```

> ⚠️ В **React 19** `forwardRef` устарел — `ref` стал обычным prop:
> ```tsx
> function Input({ label, ref, ...props }: InputProps & { ref: Ref<HTMLInputElement> }) {
>   return <input ref={ref} {...props} />;
> }
> ```

---

### `useImperativeHandle` — кастомный API через ref

Иногда родителю нужен не сам DOM-элемент, а **набор методов** дочернего компонента (`.focus()`, `.scrollToBottom()`, `.reset()`).

```tsx
interface FormHandle {
  reset: () => void;
  submit: () => void;
  isDirty: () => boolean;
}

const Form = forwardRef<FormHandle, {}>((_, ref) => {
  const [data, setData] = useState({ name: "" });

  useImperativeHandle(ref, () => ({
    reset: () => setData({ name: "" }),
    submit: () => api.save(data),
    isDirty: () => data.name !== "",
  }), [data]);

  return <input value={data.name} onChange={e => setData({ name: e.target.value })} />;
});

// Использование
const formRef = useRef<FormHandle>(null);
<Form ref={formRef} />
<button onClick={() => formRef.current?.reset()}>Сброс</button>
<button onClick={() => formRef.current?.submit()}>Отправить</button>
```

> Это иногда нужно (legacy API, сторонние библиотеки), но в большинстве случаев лучше использовать обычные пропсы и колбэки. Не делай "Imperative" интерфейсы там, где можно обойтись декларативными.

---

### Множественные рефы на один элемент

```tsx
// useMergedRefs — объединение нескольких рефов
function useMergedRefs<T>(...refs: React.Ref<T>[]) {
  return useCallback((node: T | null) => {
    refs.forEach(ref => {
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as React.MutableRefObject<T | null>).current = node;
    });
  }, refs);
}

// Пример: forwarded ref + локальный ref
const Input = forwardRef<HTMLInputElement, {}>((props, ref) => {
  const localRef = useRef<HTMLInputElement>(null);
  const merged = useMergedRefs(ref, localRef);

  useEffect(() => {
    localRef.current?.focus();  // используем локально
  }, []);

  return <input ref={merged} {...props} />;
});
```

---

## ⚠️ Подводные камни

### 1. `ref.current` равен `null` сразу после useRef

```tsx
function Comp() {
  const ref = useRef<HTMLDivElement>(null);
  console.log(ref.current);  // null! компонент ещё не в DOM

  useEffect(() => {
    console.log(ref.current);  // ← здесь уже DOM
  }, []);

  return <div ref={ref}>Hi</div>;
}
```

### 2. Изменение ref не вызывает рендер

```tsx
// ❌ Не работает
function BadCounter() {
  const count = useRef(0);
  return (
    <button onClick={() => { count.current++; }}>
      {count.current}  {/* ← всегда показывает 0! */}
    </button>
  );
}

// ✅ Для отображения — useState
function GoodCounter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

### 3. Чтение/запись ref **во время рендера** = плохо

```tsx
// ❌ В StrictMode компонент рендерится 2 раза в dev → ref.current будет 2, не 1
function Bad() {
  const ref = useRef(0);
  ref.current++;  // мутация во время рендера → SSR/Concurrent проблемы
  return <p>{ref.current}</p>;
}

// ✅ Мутируй в эффектах или обработчиках
function Good() {
  const ref = useRef(0);
  useEffect(() => { ref.current++; });
  return <p>...</p>;
}
```

### 4. `ref` на условно рендерящийся элемент

```tsx
function Conditional({ show }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;  // важно!
    ref.current.focus();
  }, [show]);

  return show ? <div ref={ref} tabIndex={-1}>Hi</div> : null;
}
```

### 5. forwardRef и displayName

```tsx
// ❌ В DevTools отображается как "ForwardRef"
const Input = forwardRef<HTMLInputElement>((props, ref) => <input ref={ref} {...props} />);

// ✅ Задай displayName
Input.displayName = "Input";
```

### 6. Inline callback ref пересоздаётся при каждом рендере

```tsx
// ❌ Функция новая каждый рендер → React вызывает её с null, потом снова с node
<div ref={(el) => { console.log(el); }} />

// ✅ useCallback
const setRef = useCallback((el: HTMLDivElement | null) => { /* ... */ }, []);
<div ref={setRef} />
```

### 7. Тип `useRef(null)` — `MutableRefObject<null>` или `RefObject<T>`?

```tsx
// Если будем использовать как DOM-ref:
const ref = useRef<HTMLInputElement>(null);
// тип: RefObject<HTMLInputElement> — current readonly (для React)

// Если будем сами писать в .current:
const ref = useRef<number | null>(null);
// тип: MutableRefObject<number | null>

// Разница: первый нельзя присваивать, второй можно
```

---

## 🔬 Тонкие моменты

**`ref` сохраняется при перемещении компонента**

Если компонент с ref перемещается в дереве (но React его reuse) — ref остаётся. Если key меняется — ref пересоздаётся.

**`ref` vs `useState` для производительности**

```tsx
// Если значение нужно только в обработчиках, но НЕ в JSX — лучше ref:
const dragOffsetRef = useRef({ x: 0, y: 0 });

function onMouseMove(e: MouseEvent) {
  dragOffsetRef.current.x += e.movementX;  // 0 рендеров на каждое движение мыши
  el.style.transform = `translate(${dragOffsetRef.current.x}px, 0)`;
}
```

**`ref` объект стабильнее `useState` для DI-паттернов**

Можно безопасно положить ref в зависимости `useEffect` — он никогда не изменится:

```tsx
const ref = useRef(...);
useEffect(() => { /* использует ref */ }, [ref]);  // эффект НЕ перезапустится
// (хотя обычно ref в deps писать не нужно — eslint этого не требует)
```

**Тип `RefCallback`**

```tsx
type RefCallback<T> = (instance: T | null) => void;
// Может вернуть cleanup-функцию (React 19+):
type RefCallback<T> = (instance: T | null) => void | (() => void);
```

В React 19 у callback ref появился cleanup, как у эффектов:

```tsx
<div ref={(node) => {
  if (!node) return;
  const ro = new ResizeObserver(/*...*/);
  ro.observe(node);
  return () => ro.disconnect();  // React 19 cleanup
}} />
```

**Не используй ref для бизнес-данных**

Если данные участвуют в UI — они должны быть в state или внешнем сторе. Ref — это "побочная" память, для **низкоуровневых** вещей: DOM, таймеры, интеграция с не-React кодом.

---

## 🧩 Задачи для закрепления

**Задача 1 — `useClickOutside(ref, handler)`**
Хук, вызывающий `handler()` при клике вне элемента. Используй `mousedown` event на `document` и `node.contains(e.target)`. Не забудь про cleanup. Покажи использование с Dropdown.

**Задача 2 — Видеоплеер**
Компонент с `<video>` и контролами:
- Кнопки play/pause/stop через `videoRef.current.play() / .pause() / .currentTime = 0`.
- Прогресс-бар, синхронизированный с `currentTime`.
- Скорость воспроизведения (0.5x, 1x, 1.5x, 2x).
- Кнопка fullscreen через `requestFullscreen()`.

**Задача 3 — `useDebounce<T>(value, delay)`**
Хук, возвращающий debounced-значение. Используй `useRef` для хранения таймера, `useEffect` для пересоздания при смене value/delay. Очищай таймер в cleanup.

**Задача 4 — `useStateWithRef<T>(initial)`**
Возвращает `[state, setState, ref]`. `ref.current` всегда актуально, можно использовать в замыканиях `setInterval`/`setTimeout`. Решает проблему stale closure.

**Задача 5 — Imperative API через `useImperativeHandle`**
Реализуй `<RichEditor ref={ref} />` с методами `ref.current.getContent() / setContent(...) / focus() / clear()`. Внутри — обычный `contentEditable` div.

**Задача 6 — useMergedRefs**
Реализуй хук, объединяющий несколько рефов в один callback ref. Покажи, как использовать его, чтобы одновременно получить ref в родителе и сделать локальные манипуляции внутри компонента.

**Задача 7 — `useResizeObserver`**
Хук возвращает `[ref, size]`. Используй callback ref + `ResizeObserver`. Возвращай width/height, переключай при изменении.
