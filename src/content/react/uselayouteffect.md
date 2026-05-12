## 📝 Теория

### Главное отличие

| | `useEffect` | `useLayoutEffect` |
|---|---|---|
| **Когда выполняется** | После того как браузер отрисовал кадр (async) | После DOM-мутаций, **до** отрисовки браузером (sync) |
| **Блокирует UI** | Нет | Да — браузер не показывает кадр пока не отработает |
| **SSR** | Не выполняется на сервере (warning не выдаётся) | Не выполняется + **warning в консоли** |
| **Когда использовать** | 95% случаев | Измерения DOM, синхронные правки стиля во избежание мерцания |
| **Производительность** | Лучше — отрисовка не задерживается | Хуже — пользователь ждёт окончания эффекта |

### Поток рендера React

```
1. Render phase — React вычисляет новое VDOM (вызов компонента)
2. Commit phase:
   ├─ DOM mutations    — React применяет изменения к реальному DOM
   ├─ useLayoutEffect  — выполняется СИНХРОННО, перед отрисовкой
   └─ Browser paint    — браузер рисует кадр
3. После paint:
   └─ useEffect        — выполняется АСИНХРОННО, не блокируя
```

**Ключевая разница:** `useLayoutEffect` "застаёт" DOM в обновлённом виде, но **до** того как пользователь увидит результат. `useEffect` — после.

### Базовый пример различий

```tsx
function Demo() {
  const [width, setWidth] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  // useEffect — браузер сначала покажет начальный кадр (width=0),
  // потом setWidth → перерендер → пользователь увидит мерцание
  useEffect(() => {
    if (ref.current) setWidth(ref.current.offsetWidth);
  }, []);

  // useLayoutEffect — браузер пересчитает и покажет уже правильный width
  // НИКАКОГО мерцания
  useLayoutEffect(() => {
    if (ref.current) setWidth(ref.current.offsetWidth);
  }, []);

  return (
    <div ref={ref}>
      Ширина: {width}
    </div>
  );
}
```

---

### Когда useLayoutEffect ОБЯЗАТЕЛЕН

#### 1. Измерения DOM с последующим setState

```tsx
function Tooltip({ targetRef, text }) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (!targetRef.current || !tooltipRef.current) return;
    const rect    = targetRef.current.getBoundingClientRect();
    const tipRect = tooltipRef.current.getBoundingClientRect();
    
    setPos({
      top:  rect.top - tipRect.height - 8,
      left: rect.left + (rect.width - tipRect.width) / 2,
    });
  }, [text]);  // пересчитываем при смене текста (размер мог поменяться)

  return (
    <div ref={tooltipRef} style={{ position: "fixed", ...pos }}>
      {text}
    </div>
  );
}
// С useEffect — тултип на мгновение появится в (0, 0), потом скакнёт на нужную позицию
// С useLayoutEffect — сразу на месте
```

#### 2. Скролл к позиции до отрисовки

```tsx
function ChatWindow({ messages }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  return (
    <div ref={scrollRef} className="chat">
      {messages.map(m => <div key={m.id}>{m.text}</div>)}
    </div>
  );
}
// Скролл происходит до того, как пользователь увидит новый кадр
```

#### 3. Синхронные DOM-правки (анимация стартовая позиция)

```tsx
// FLIP-анимация: First, Last, Invert, Play
function AnimatedItem({ id }) {
  const ref = useRef<HTMLDivElement>(null);
  const prevPos = useRef<DOMRect>();

  useLayoutEffect(() => {
    if (!ref.current) return;
    const newPos = ref.current.getBoundingClientRect();
    
    if (prevPos.current) {
      const dx = prevPos.current.left - newPos.left;
      const dy = prevPos.current.top - newPos.top;
      
      // Inverse — устанавливаем "старое" положение через transform
      ref.current.style.transform = `translate(${dx}px, ${dy}px)`;
      ref.current.style.transition = "none";
      
      // requestAnimationFrame чтобы браузер отрисовал старое
      requestAnimationFrame(() => {
        if (!ref.current) return;
        // Затем анимируем к 0
        ref.current.style.transform = "";
        ref.current.style.transition = "transform 300ms ease";
      });
    }
    
    prevPos.current = newPos;
  });

  return <div ref={ref}>...</div>;
}
```

#### 4. Контролируемый каретка/выделение в input

```tsx
function FormattedInput() {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const cursorRef = useRef<number>(0);

  useLayoutEffect(() => {
    if (inputRef.current) {
      inputRef.current.setSelectionRange(cursorRef.current, cursorRef.current);
    }
  }, [value]);  // после рендера сразу восстанавливаем позицию каретки

  return (
    <input
      ref={inputRef}
      value={value}
      onChange={(e) => {
        cursorRef.current = e.target.selectionStart ?? 0;
        setValue(formatPhone(e.target.value));
      }}
    />
  );
}
```

---

### Когда useEffect лучше

```tsx
// 1. ✅ Запрос данных — пользователю не нужно ждать сетевой запрос для отрисовки
useEffect(() => {
  fetch("/api/data").then(...);
}, []);

// 2. ✅ Подписки на события
useEffect(() => {
  window.addEventListener("resize", handler);
  return () => window.removeEventListener("resize", handler);
}, []);

// 3. ✅ Аналитика
useEffect(() => {
  analytics.trackPageView(location.pathname);
}, [location.pathname]);

// 4. ✅ Логирование
useEffect(() => {
  console.log("State changed:", state);
}, [state]);
```

---

### useLayoutEffect и SSR

`useLayoutEffect` **не выполняется на сервере** (там нет DOM). React выдаёт warning:

```
Warning: useLayoutEffect does nothing on the server, because its effect cannot
be encoded into the server renderer's output format.
```

Решения:

```tsx
// 1. Используй useEffect, если SSR-критично
useEffect(() => {/* ... */}, []);

// 2. Изоморфный хук — useLayoutEffect в браузере, useEffect на сервере
import { useLayoutEffect, useEffect } from "react";
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;
useIsoLayoutEffect(() => {/* ... */}, []);

// 3. В Next.js — то же, или использовать useInsertionEffect для CSS
```

---

### useInsertionEffect — особый случай

`useInsertionEffect` срабатывает **до** `useLayoutEffect`, в момент DOM-мутаций. Используется только библиотеками CSS-in-JS (styled-components, emotion) для вставки стилей до того, как другие эффекты прочитают layout.

```tsx
// Только если ты пишешь CSS-in-JS библиотеку — иначе не используй
useInsertionEffect(() => {
  const style = document.createElement("style");
  style.textContent = ".foo { color: red }";
  document.head.appendChild(style);
}, []);
```

**Порядок выполнения хуков** в commit phase:

```
1. DOM mutations (React пишет в реальный DOM)
2. useInsertionEffect (вставка CSS)
3. Layout (браузер пересчитывает layout если нужно)
4. useLayoutEffect (твой код, видит обновлённый layout)
5. Browser paint
6. useEffect (асинхронно, после кадра)
```

---

## ⚠️ Подводные камни

### 1. Тяжёлые вычисления → лагает UI

```tsx
// ❌ Блокирует отрисовку, пользователь видит зависание
useLayoutEffect(() => {
  for (let i = 0; i < 1e9; i++) {/* heavy */}
}, []);

// ✅ Тяжёлое — в useEffect
useEffect(() => {
  doHeavy();
}, []);

// ✅ Или раздели: измерения в useLayoutEffect, обработку в useEffect
useLayoutEffect(() => {
  const rect = ref.current?.getBoundingClientRect();
  setMeasurement(rect);
}, []);

useEffect(() => {
  if (measurement) doHeavyCalc(measurement);
}, [measurement]);
```

### 2. Бесконечный цикл при setState

```tsx
// ❌ setState в useLayoutEffect → render → useLayoutEffect → бесконечно
useLayoutEffect(() => {
  setHeight(ref.current?.offsetHeight ?? 0);  // нет deps → каждый рендер
});

// ✅ Условие или зависимости
useLayoutEffect(() => {
  const h = ref.current?.offsetHeight ?? 0;
  if (h !== height) setHeight(h);  // только если изменилась
}, []);
```

### 3. SSR warning в Next.js / Remix

```tsx
// ❌ В Next.js на сервере — warning в консоли
useLayoutEffect(() => {/* DOM-логика */}, []);

// ✅ Изоморфная версия
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;
useIsoLayoutEffect(() => {/* ... */}, []);
```

### 4. StrictMode — два запуска в dev

В development StrictMode вызывает все эффекты дважды:

```tsx
useLayoutEffect(() => {
  console.log("layout");
  return () => console.log("layout cleanup");
}, []);

// В StrictMode (dev) лог:
// layout
// layout cleanup
// layout
```

Это нормально. Cleanup должен полностью откатить эффект.

### 5. useLayoutEffect без необходимости

```tsx
// ❌ Если измерения не нужны — useEffect лучше
useLayoutEffect(() => {
  console.log("mounted");  // зачем синхронно?
}, []);

// ✅ Просто useEffect
useEffect(() => {
  console.log("mounted");
}, []);
```

### 6. Чтение DOM в обычном useEffect

```tsx
// ⚠️ В useEffect DOM уже отрисован, но если ты setState на основе размеров —
// будет один лишний кадр (frame с неправильным значением)
useEffect(() => {
  setSize(ref.current.getBoundingClientRect());  // мерцание возможно
}, []);

// ✅ Для setState на основе DOM — useLayoutEffect
useLayoutEffect(() => {
  setSize(ref.current.getBoundingClientRect());
}, []);
```

---

## 🔬 Тонкие моменты

**Не блокирует первый paint, если deps пустые и нет setState**

Если useLayoutEffect ничего не меняет в state/DOM (только читает) — пользователь не почувствует разницы с useEffect. Но он всё равно блокирует событийный цикл, поэтому жди только на быстрых операциях.

**В тестах useLayoutEffect и useEffect ведут себя одинаково**

В JSDOM нет реального paint, поэтому различие незаметно. Тесты проходят одинаково с любым из них.

**Хуки-обёртки**

```tsx
// Изоморфный хук для библиотек
export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;
```

Этот паттерн используется в Material-UI, Radix UI, react-spring и других популярных библиотеках.

**Order of execution: parent vs child**

```tsx
// useLayoutEffect: child first, then parent (так же как ComponentDidMount)
function Parent() {
  useLayoutEffect(() => console.log("parent"));
  return <Child />;
}
function Child() {
  useLayoutEffect(() => console.log("child"));
  return null;
}
// Лог: child → parent
```

**Cleanup тоже синхронный для useLayoutEffect**

```tsx
useLayoutEffect(() => {
  return () => {
    // Этот cleanup — синхронный, до следующего эффекта
    console.log("cleanup");
  };
}, [dep]);
```

**`useEffect` с RAF — почти как useLayoutEffect**

```tsx
// Если хочется отложить setState на следующий frame, но не блокировать paint
useEffect(() => {
  requestAnimationFrame(() => {
    setHeight(ref.current.offsetHeight);
  });
}, []);
// → одно мерцание, но не блокирует UI
```

---

## 🧩 Задачи для закрепления

**Задача 1 — `useWindowSize` сравнение**
Реализуй два варианта хука: один на `useEffect`, другой на `useLayoutEffect`. Намеренно сделай начальное значение `{ width: 0, height: 0 }`. Открой DevTools → Throttle CPU 6×, перезагрузи. Засеки разницу: с useEffect ты увидишь промежуточное значение в первом кадре.

**Задача 2 — Tooltip с правильной позицией**
Тултип, который позиционируется относительно target-элемента. Используй `useLayoutEffect` для измерения размеров обоих элементов. Покажи, что без useLayoutEffect тултип "прыгает".

**Задача 3 — Auto-scroll чата**
При получении новых сообщений автоматически скроллить вниз — но только если пользователь уже был внизу (если он скроллил вверх — не дёргать). Используй `useLayoutEffect` для проверки позиции скролла и прокрутки.

**Задача 4 — FLIP-анимация**
Реализуй переупорядочивание списка с плавной анимацией перемещения элементов (FLIP — First, Last, Invert, Play). Используй `useLayoutEffect` для замера позиций до и после.

**Задача 5 — Контролируемая каретка**
Input с автоформатированием (например, телефон). При вводе значения форматируется, но позиция курсора сохраняется в той же логической позиции. Реализуй через `useLayoutEffect` + `setSelectionRange`.

**Задача 6 — Изоморфный хук для SSR**
Напиши хелпер `useIsomorphicLayoutEffect`. Используй его в Next.js — убедись что warning исчезает на сервере.

**Задача 7 — Профилирование useEffect vs useLayoutEffect**
Создай компонент, который измеряет элемент и устанавливает state с размерами. Открой Performance в DevTools, запиши паттерн с обоими хуками. Сравни Long Tasks и FPS.
