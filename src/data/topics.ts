export type TopicStatus = "done" | "review" | "skip" | "todo";

export interface CodeExample {
  title: string;
  description?: string;
  code: string;
}

export interface Topic {
  id: string;
  title: string;
  description: string;
  theory: string;
  examples: CodeExample[];
  links?: { title: string; url: string }[];
}

export interface Block {
  id: string;
  title: string;
  emoji: string;
  description: string;
  topics: Topic[];
}

const r = (s: string) => s.replace(/^\n/, "");

export const blocks: Block[] = [
  {
    id: "react",
    emoji: "⚛️",
    title: "React",
    description: "Всё про React — от JSX и хуков до производительности и TypeScript",
    topics: [
      {
        id: "jsx",
        title: "JSX",
        description: "Синтаксис, выражения, условный рендеринг",
        theory: r(`
JSX — это синтаксическое расширение JavaScript, которое выглядит как HTML, но компилируется в обычные вызовы \`React.createElement()\`.

**Ключевые правила:**
- В JSX используется \`className\` вместо \`class\` и \`htmlFor\` вместо \`for\`
- Все атрибуты пишутся в camelCase: \`onClick\`, \`tabIndex\`
- Выражения внутри JSX оборачиваются в фигурные скобки \`{}\`
- Компонент должен возвращать один корневой элемент (или Fragment)
- Самозакрывающиеся теги обязательны: \`<img />\`, \`<br />\`

**Условный рендеринг:**
- \`{condition && <Component />}\` — рендер по условию
- \`{condition ? <A /> : <B />}\` — тернарный оператор
- Возврат \`null\` — не рендерить ничего
        `),
        examples: [
          {
            title: "Базовый JSX и выражения",
            code: r(`
export default function App() {
  const name = "Daniil";
  const isOnline = true;
  const items = ["React", "TypeScript", "Vite"];

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h1>Привет, {name}!</h1>
      <p>Статус: {isOnline ? "🟢 онлайн" : "⚫ оффлайн"}</p>
      {isOnline && <p>Можно работать!</p>}
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
`),
          },
          {
            title: "Fragment vs обёрточный div",
            code: r(`
export default function App() {
  return (
    <>
      <h1>Без лишнего div</h1>
      <p>Fragment не создаёт DOM-узел</p>
    </>
  );
}
`),
          },
        ],
      },
      {
        id: "props",
        title: "Props",
        description: "Передача данных, деструктуризация, defaultProps",
        theory: r(`
Props — это объект параметров, которые родительский компонент передаёт дочернему. Props **только для чтения** — компонент не должен изменять полученные props.

**Передача props:**
- Строки: \`<Component name="Daniil" />\`
- Выражения: \`<Component age={25} active />\` (булевый = true по умолчанию)
- Объекты/массивы: \`<Component data={{ x: 1 }} />\`
- children — особый prop, всё что между открывающим и закрывающим тегом

**Деструктуризация в параметрах** — короткий и читаемый способ:
\`function Card({ title, children }) { ... }\`

**Значения по умолчанию** в современном React задаются через дефолты деструктуризации, а не \`defaultProps\`.
        `),
        examples: [
          {
            title: "Базовая передача props",
            code: r(`
function Greeting({ name, age = 18 }) {
  return (
    <p>
      Привет, <b>{name}</b>! Тебе {age}.
    </p>
  );
}

export default function App() {
  return (
    <div style={{ padding: 20 }}>
      <Greeting name="Даня" age={25} />
      <Greeting name="Гость" />
    </div>
  );
}
`),
          },
          {
            title: "children как prop",
            code: r(`
function Card({ title, children }) {
  return (
    <div style={{
      border: "1px solid #444",
      borderRadius: 8,
      padding: 16,
      margin: 8,
      background: "#1a1a1a",
      color: "white",
    }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <div>{children}</div>
    </div>
  );
}

export default function App() {
  return (
    <Card title="О компоненте">
      <p>children — это всё что внутри тега.</p>
      <button>Действие</button>
    </Card>
  );
}
`),
          },
        ],
      },
      {
        id: "state",
        title: "State (useState)",
        description: "Состояние, иммутабельность",
        theory: r(`
**State** — это данные, которые компонент хранит между рендерами. При обновлении state React заново рендерит компонент.

\`const [count, setCount] = useState(0);\`

**Главные правила:**
1. **Никогда не мутируй state напрямую** — всегда создавай новый объект/массив
2. \`setState\` асинхронен — используй функциональную форму \`setCount(c => c + 1)\` когда новое значение зависит от старого
3. Несколько \`setState\` подряд **батчатся** — React сольёт их в один рендер

**Иммутабельные обновления:**
- Объект: \`setUser({ ...user, name: "new" })\`
- Массив: \`setItems([...items, newItem])\`
- Удаление: \`setItems(items.filter(i => i.id !== id))\`
        `),
        examples: [
          {
            title: "Счётчик с функциональным обновлением",
            code: r(`
import { useState } from "react";

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ padding: 20 }}>
      <h1>Счёт: {count}</h1>
      <button onClick={() => setCount(c => c + 1)}>+1</button>
      <button onClick={() => setCount(c => c - 1)}>-1</button>
      <button onClick={() => setCount(0)}>Сброс</button>
      <p>Кнопка тройного клика:</p>
      <button onClick={() => {
        setCount(c => c + 1);
        setCount(c => c + 1);
        setCount(c => c + 1);
      }}>+3</button>
    </div>
  );
}
`),
          },
          {
            title: "Иммутабельное обновление объекта",
            code: r(`
import { useState } from "react";

export default function App() {
  const [user, setUser] = useState({ name: "Daniil", age: 25 });

  return (
    <div style={{ padding: 20 }}>
      <p>{user.name}, {user.age} лет</p>
      <button onClick={() => setUser({ ...user, age: user.age + 1 })}>
        +1 год
      </button>
      <input
        value={user.name}
        onChange={e => setUser({ ...user, name: e.target.value })}
      />
    </div>
  );
}
`),
          },
          {
            title: "Список TODO",
            code: r(`
import { useState } from "react";

export default function App() {
  const [todos, setTodos] = useState([
    { id: 1, text: "Изучить useState" },
  ]);
  const [text, setText] = useState("");

  const add = () => {
    if (!text.trim()) return;
    setTodos([...todos, { id: Date.now(), text }]);
    setText("");
  };

  const remove = (id) =>
    setTodos(todos.filter(t => t.id !== id));

  return (
    <div style={{ padding: 20 }}>
      <input value={text} onChange={e => setText(e.target.value)} />
      <button onClick={add}>+</button>
      <ul>
        {todos.map(t => (
          <li key={t.id}>
            {t.text}
            <button onClick={() => remove(t.id)}>×</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
`),
          },
        ],
      },
      {
        id: "lifecycle",
        title: "Lifecycle (useEffect)",
        description: "useEffect, зависимости, cleanup",
        theory: r(`
**useEffect** — выполняет побочные эффекты после рендера: подписки, запросы, таймеры, ручная работа с DOM.

\`useEffect(() => { ... }, [deps])\`

**Три варианта зависимостей:**
- \`[]\` — выполнить один раз после монтирования
- \`[a, b]\` — каждый раз, когда меняются \`a\` или \`b\`
- *(не указан)* — после каждого рендера

**Cleanup-функция** возвращается из эффекта и вызывается перед следующим запуском и при размонтировании:

\`\`\`js
useEffect(() => {
  const id = setInterval(tick, 1000);
  return () => clearInterval(id); // cleanup
}, []);
\`\`\`

**Типичные ошибки:**
- Забыть cleanup для таймеров/подписок → утечки памяти
- Забыть зависимость → stale closure
- Запрос в эффекте без AbortController → race condition
        `),
        examples: [
          {
            title: "Таймер с cleanup",
            code: r(`
import { useState, useEffect } from "react";

export default function App() {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  return (
    <div style={{ padding: 20 }}>
      <h1>{seconds}s</h1>
      <button onClick={() => setRunning(r => !r)}>
        {running ? "⏸ Пауза" : "▶ Старт"}
      </button>
      <button onClick={() => setSeconds(0)}>Сброс</button>
    </div>
  );
}
`),
          },
          {
            title: "Слушатель размера окна",
            code: r(`
import { useState, useEffect } from "react";

export default function App() {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Ширина окна: {width}px</h2>
      <p>Поменяй размер окна — значение обновится.</p>
    </div>
  );
}
`),
          },
        ],
      },
      {
        id: "lists-keys",
        title: "Списки и ключи",
        description: "map, key, reconciliation",
        theory: r(`
Для рендера списков используется \`.map()\`. **Каждому элементу нужен уникальный prop \`key\`** — он помогает React эффективно обновлять DOM.

**Правила key:**
- Уникален среди сиблингов (не глобально)
- Стабилен между рендерами (один элемент — один key)
- \`key={index}\` — антипаттерн, если список меняется (вставки/удаления/сортировка)
- Лучший key — это id из данных

**Что произойдёт без key или с неправильным key:**
- React будет переиспользовать DOM-узлы и состояние не там, где нужно
- Сломаются анимации, фокус, локальный state дочерних компонентов
        `),
        examples: [
          {
            title: "Правильный key из id",
            code: r(`
import { useState } from "react";

export default function App() {
  const [users] = useState([
    { id: "u1", name: "Алиса" },
    { id: "u2", name: "Боб" },
    { id: "u3", name: "Чарли" },
  ]);

  return (
    <ul>
      {users.map(u => (
        <li key={u.id}>{u.name}</li>
      ))}
    </ul>
  );
}
`),
          },
        ],
      },
      {
        id: "events",
        title: "События",
        description: "SyntheticEvent, обработчики",
        theory: r(`
React оборачивает нативные DOM-события в **SyntheticEvent** — кросс-браузерную обёртку с одинаковым API.

**Особенности:**
- Имена в camelCase: \`onClick\`, \`onChange\`, \`onSubmit\`
- В обработчик передаётся объект события: \`(e) => { e.preventDefault() }\`
- React делает **делегирование событий** на root-узле — навешивает один listener на корень

**Самые частые методы события:**
- \`e.preventDefault()\` — отменить дефолтное поведение (например, submit формы)
- \`e.stopPropagation()\` — остановить всплытие
- \`e.target.value\` — значение элемента (для input)
- \`e.currentTarget\` — элемент, на котором висит обработчик
        `),
        examples: [
          {
            title: "Форма с preventDefault",
            code: r(`
import { useState } from "react";

export default function App() {
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(name);
    setName("");
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: 20 }}>
      <input
        placeholder="Имя"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button type="submit">Отправить</button>
      {submitted && <p>Отправлено: {submitted}</p>}
    </form>
  );
}
`),
          },
        ],
      },
      {
        id: "controlled-uncontrolled",
        title: "Controlled vs Uncontrolled",
        description: "Управляемые и неуправляемые компоненты",
        theory: r(`
**Controlled (управляемый):** value хранится в React state, изменения идут через onChange. React — единый источник истины.

\`<input value={text} onChange={e => setText(e.target.value)} />\`

**Uncontrolled (неуправляемый):** значение живёт в DOM, читается через ref. React не следит за каждым нажатием.

\`<input ref={inputRef} defaultValue="" />\` → \`inputRef.current.value\`

**Когда использовать что:**
- Controlled — нужна валидация, динамический disable кнопки, форматирование на лету
- Uncontrolled — большая форма с одним submit, интеграция с не-React кодом, файловый input (он всегда uncontrolled)
        `),
        examples: [
          {
            title: "Controlled input",
            code: r(`
import { useState } from "react";

export default function App() {
  const [text, setText] = useState("");
  return (
    <div style={{ padding: 20 }}>
      <input value={text} onChange={e => setText(e.target.value)} />
      <p>Длина: {text.length}</p>
      <button disabled={text.length < 3}>
        Submit (нужно минимум 3 символа)
      </button>
    </div>
  );
}
`),
          },
          {
            title: "Uncontrolled через ref",
            code: r(`
import { useRef } from "react";

export default function App() {
  const inputRef = useRef(null);

  const handleSubmit = () => {
    alert("Значение: " + inputRef.current.value);
  };

  return (
    <div style={{ padding: 20 }}>
      <input ref={inputRef} defaultValue="hello" />
      <button onClick={handleSubmit}>Прочитать</button>
    </div>
  );
}
`),
          },
        ],
      },
      {
        id: "fragments-portals-errors",
        title: "Fragments, Portals, Error Boundaries",
        description: "Полезные обёртки React",
        theory: r(`
**Fragment** \`<>...</>\` — группирует элементы без добавления узла в DOM. Полезно, когда нужно вернуть несколько корней.

**Portal** — рендерит дочерние элементы в произвольный DOM-узел вне иерархии родителя. Используется для модалок, тултипов, toast'ов — чтобы они не страдали от \`overflow: hidden\` родителя.

\`createPortal(<Modal />, document.body)\`

**Error Boundary** — компонент-класс, который ловит ошибки рендера в поддереве и показывает fallback. Только классы, реализующие \`getDerivedStateFromError\` или \`componentDidCatch\`. Не ловит: ошибки в обработчиках событий, async-ошибки, ошибки в самом ErrorBoundary.
        `),
        examples: [
          {
            title: "Portal-модалка",
            code: r(`
import { useState } from "react";
import { createPortal } from "react-dom";

function Modal({ onClose }) {
  return createPortal(
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,0.6)",
      display: "grid", placeItems: "center"
    }}>
      <div style={{ background: "#222", color: "white", padding: 24, borderRadius: 8 }}>
        <h2>Модалка через Portal</h2>
        <button onClick={onClose}>Закрыть</button>
      </div>
    </div>,
    document.body
  );
}

export default function App() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ padding: 20 }}>
      <button onClick={() => setOpen(true)}>Открыть</button>
      {open && <Modal onClose={() => setOpen(false)} />}
    </div>
  );
}
`),
          },
        ],
      },
      {
        id: "useref",
        title: "useRef",
        description: "Доступ к DOM, хранение значений без ре-рендера",
        theory: r(`
**useRef** возвращает изменяемый объект \`{ current: value }\`, который сохраняется между рендерами и **не вызывает ре-рендер** при изменении.

**Два основных применения:**
1. **Доступ к DOM-узлу:** \`const ref = useRef(null); <input ref={ref} />\` → \`ref.current.focus()\`
2. **Хранение значений** между рендерами без триггера ре-рендера: предыдущее значение, id таймера, флаг «уже обработали»

**Не используй useRef как state** — изменение \`current\` не вызывает рендер.
        `),
        examples: [
          {
            title: "Фокус на input",
            code: r(`
import { useRef } from "react";

export default function App() {
  const inputRef = useRef(null);
  return (
    <div style={{ padding: 20 }}>
      <input ref={inputRef} placeholder="Кликни кнопку →" />
      <button onClick={() => inputRef.current?.focus()}>
        Сфокусировать
      </button>
    </div>
  );
}
`),
          },
          {
            title: "Счётчик рендеров",
            code: r(`
import { useRef, useState, useEffect } from "react";

export default function App() {
  const [count, setCount] = useState(0);
  const renders = useRef(0);

  useEffect(() => {
    renders.current += 1;
  });

  return (
    <div style={{ padding: 20 }}>
      <p>count: {count}</p>
      <p>Рендеров было: {renders.current}</p>
      <button onClick={() => setCount(c => c + 1)}>+</button>
    </div>
  );
}
`),
          },
        ],
      },
      {
        id: "usememo",
        title: "useMemo",
        description: "Мемоизация вычислений",
        theory: r(`
**useMemo** запоминает результат функции и возвращает закешированное значение, пока не изменятся зависимости.

\`const value = useMemo(() => expensiveCalc(a, b), [a, b]);\`

**Когда нужен:**
- Тяжёлые вычисления (фильтрация большого массива, парсинг)
- Стабильная ссылка на объект/массив, передаваемый в memo-компонент или в зависимости useEffect

**Когда НЕ нужен:**
- Простые операции (\`a + b\`) — useMemo дороже, чем сам подсчёт
- "На всякий случай" — добавь только когда увидишь тормоза
        `),
        examples: [
          {
            title: "Мемоизация фильтрации",
            code: r(`
import { useState, useMemo } from "react";

const ITEMS = Array.from({ length: 5000 }, (_, i) => "Item " + i);

export default function App() {
  const [query, setQuery] = useState("");
  const [count, setCount] = useState(0);

  const filtered = useMemo(() => {
    console.log("filter run");
    return ITEMS.filter(x => x.includes(query));
  }, [query]);

  return (
    <div style={{ padding: 20 }}>
      <input value={query} onChange={e => setQuery(e.target.value)} placeholder="filter..." />
      <button onClick={() => setCount(c => c + 1)}>
        ре-рендер ({count})
      </button>
      <p>Найдено: {filtered.length}</p>
    </div>
  );
}
`),
          },
        ],
      },
      {
        id: "usecallback",
        title: "useCallback",
        description: "Мемоизация функций",
        theory: r(`
**useCallback** возвращает мемоизированную версию функции — стабильную ссылку, которая не меняется между рендерами, пока не изменятся зависимости.

\`const onClick = useCallback(() => { ... }, [deps]);\`

Это \`useMemo(() => fn, deps)\` — но для функций.

**Когда нужен:**
- Функция передаётся в \`React.memo\`-компонент как prop
- Функция — зависимость \`useEffect\`/\`useMemo\`/другого \`useCallback\`
- Функция передаётся в кастомный хук, который чувствителен к ссылкам

**Не нужен**, если функция используется только локально и не передаётся в memo/effect.
        `),
        examples: [
          {
            title: "useCallback + React.memo",
            code: r(`
import { useState, useCallback, memo } from "react";

const Child = memo(function Child({ onClick }) {
  console.log("Child render");
  return <button onClick={onClick}>Child кнопка</button>;
});

export default function App() {
  const [count, setCount] = useState(0);
  const [other, setOther] = useState(0);

  const handleClick = useCallback(() => {
    setCount(c => c + 1);
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <p>count: {count}, other: {other}</p>
      <Child onClick={handleClick} />
      <button onClick={() => setOther(o => o + 1)}>
        изменить other (Child не должен ре-рендериться)
      </button>
    </div>
  );
}
`),
          },
        ],
      },
      {
        id: "usecontext",
        title: "useContext",
        description: "Контекст без prop drilling",
        theory: r(`
**Context** позволяет передавать данные через всё дерево компонентов, минуя пропсы.

**Шаги:**
1. Создать контекст: \`const ThemeContext = createContext("light")\`
2. Обернуть поддерево: \`<ThemeContext.Provider value="dark">...\`
3. Прочитать в любом потомке: \`const theme = useContext(ThemeContext)\`

**Подводные камни:**
- При смене value ре-рендерятся все потребители — для частых обновлений лучше Zustand/Redux
- Передавай в value стабильную ссылку (useMemo), если это объект
        `),
        examples: [
          {
            title: "Тема через Context",
            code: r(`
import { createContext, useContext, useState } from "react";

const ThemeContext = createContext("light");

function ThemedButton() {
  const theme = useContext(ThemeContext);
  return (
    <button style={{
      background: theme === "dark" ? "#222" : "#eee",
      color: theme === "dark" ? "white" : "black",
      padding: "8px 16px",
      border: "none",
      borderRadius: 4,
    }}>
      Кнопка темы: {theme}
    </button>
  );
}

export default function App() {
  const [theme, setTheme] = useState("light");
  return (
    <ThemeContext.Provider value={theme}>
      <div style={{ padding: 20 }}>
        <button onClick={() => setTheme(t => t === "light" ? "dark" : "light")}>
          переключить
        </button>
        <ThemedButton />
      </div>
    </ThemeContext.Provider>
  );
}
`),
          },
        ],
      },
      {
        id: "usereducer",
        title: "useReducer",
        description: "Сложный state, паттерн reducer",
        theory: r(`
**useReducer** — альтернатива useState для сложного state с несколькими переходами.

\`const [state, dispatch] = useReducer(reducer, initialState);\`

**Reducer** — pure-функция \`(state, action) => newState\`. Action обычно \`{ type: "...", payload: ... }\`.

**Когда брать useReducer вместо useState:**
- State — объект с многими полями, обновляемыми по-разному
- Следующий state зависит от текущего сложным способом
- Логика обновлений раскидана по компоненту — хочется собрать в одном месте
        `),
        examples: [
          {
            title: "Счётчик через reducer",
            code: r(`
import { useReducer } from "react";

function reducer(state, action) {
  switch (action.type) {
    case "inc": return { count: state.count + 1 };
    case "dec": return { count: state.count - 1 };
    case "reset": return { count: 0 };
    case "set": return { count: action.payload };
    default: return state;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, { count: 0 });
  return (
    <div style={{ padding: 20 }}>
      <h1>{state.count}</h1>
      <button onClick={() => dispatch({ type: "inc" })}>+</button>
      <button onClick={() => dispatch({ type: "dec" })}>-</button>
      <button onClick={() => dispatch({ type: "reset" })}>Reset</button>
      <button onClick={() => dispatch({ type: "set", payload: 100 })}>=100</button>
    </div>
  );
}
`),
          },
        ],
      },
      {
        id: "uselayouteffect",
        title: "useLayoutEffect",
        description: "Отличие от useEffect",
        theory: r(`
**useLayoutEffect** — синхронный эффект, который запускается **до отрисовки** браузером. \`useEffect\` запускается **после**.

| | useEffect | useLayoutEffect |
|---|---|---|
| Когда | После paint | До paint (синхронно) |
| Блокирует UI | Нет | Да |
| Применение | 95% случаев | Измерение DOM, синхронные правки лейаута |

**Используй useLayoutEffect только когда:**
- Нужно прочитать размер/позицию узла и сразу обновить state, чтобы избежать мерцания
- Синхронизировать DOM-мутацию с рендером

В остальных случаях \`useEffect\` — лучше для производительности.
        `),
        examples: [
          {
            title: "Измерение DOM",
            code: r(`
import { useState, useRef, useLayoutEffect } from "react";

export default function App() {
  const boxRef = useRef(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    setWidth(boxRef.current.offsetWidth);
  });

  return (
    <div style={{ padding: 20 }}>
      <div ref={boxRef} style={{ width: "60%", background: "#333", color: "white", padding: 12 }}>
        Я измеряюсь
      </div>
      <p>Ширина: {width}px</p>
    </div>
  );
}
`),
          },
        ],
      },
      {
        id: "useid-deferred-transition",
        title: "useId, useDeferredValue, useTransition",
        description: "Новые хуки React 18",
        theory: r(`
**useId** — генерирует уникальный стабильный id, безопасный для SSR. Используй для связывания label/input.

**useTransition** — помечает обновление как "не срочное". UI остаётся отзывчивым.
\`const [isPending, startTransition] = useTransition();\`
\`startTransition(() => setHeavyState(...))\`

**useDeferredValue** — отложенная версия значения. Похоже на debounce, но без таймера: React сам решает, когда обновить.
\`const deferred = useDeferredValue(value);\`
        `),
        examples: [
          {
            title: "useTransition для тяжёлого списка",
            code: r(`
import { useState, useTransition } from "react";

const big = Array.from({ length: 10000 }, (_, i) => "Item " + i);

export default function App() {
  const [q, setQ] = useState("");
  const [filtered, setFiltered] = useState(big);
  const [isPending, startTransition] = useTransition();

  const onChange = (e) => {
    const v = e.target.value;
    setQ(v);
    startTransition(() => {
      setFiltered(big.filter(x => x.includes(v)));
    });
  };

  return (
    <div style={{ padding: 20 }}>
      <input value={q} onChange={onChange} placeholder="Введи цифру" />
      {isPending && <span> загрузка...</span>}
      <p>Найдено: {filtered.length}</p>
    </div>
  );
}
`),
          },
        ],
      },
      {
        id: "custom-hooks",
        title: "Кастомные хуки",
        description: "Правила, примеры написания",
        theory: r(`
**Кастомный хук** — обычная функция, которая начинается с \`use\` и может использовать другие хуки. Способ переиспользовать логику между компонентами.

**Правила:**
1. Имя начинается с \`use\` — иначе линтер не отследит порядок вызовов
2. Хуки вызываются на верхнем уровне, не в условиях/циклах
3. Хуки вызываются только из React-компонентов или других хуков

**Что обычно выносят в хук:**
- Подписки и работа с window (useWindowSize)
- localStorage синхронизация (useLocalStorage)
- Fetch с состояниями (useFetch)
- Дебаунс значения (useDebounce)
        `),
        examples: [
          {
            title: "useLocalStorage",
            code: r(`
import { useState, useEffect } from "react";

function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}

export default function App() {
  const [name, setName] = useLocalStorage("user-name", "");
  return (
    <div style={{ padding: 20 }}>
      <input value={name} onChange={e => setName(e.target.value)} />
      <p>Сохраняется в localStorage — обнови страницу!</p>
    </div>
  );
}
`),
          },
        ],
      },
      {
        id: "context-api",
        title: "Context API",
        description: "Provider, Consumer, оптимизация",
        theory: r(`
**Context** — встроенный механизм передачи данных через дерево. Хорош для редко меняющихся глобальных значений: тема, локаль, текущий пользователь.

**Оптимизация:**
- Разделяй контексты по природе данных (отдельно тема и пользователь)
- Мемоизируй value: \`<Ctx.Provider value={useMemo(() => ({a, b}), [a, b])}>\`
- Для часто меняющихся данных — лучше Zustand/Redux, иначе всё дерево ре-рендерится
        `),
        examples: [
          {
            title: "Контекст пользователя",
            code: r(`
import { createContext, useContext, useState, useMemo } from "react";

const UserCtx = createContext(null);

function useUser() {
  const ctx = useContext(UserCtx);
  if (!ctx) throw new Error("useUser must be inside UserProvider");
  return ctx;
}

function Header() {
  const { user, logout } = useUser();
  return (
    <header style={{ padding: 10, borderBottom: "1px solid #444" }}>
      Привет, {user.name} <button onClick={logout}>выйти</button>
    </header>
  );
}

export default function App() {
  const [user, setUser] = useState({ name: "Даня" });

  const value = useMemo(
    () => ({ user, logout: () => setUser({ name: "Гость" }) }),
    [user]
  );

  return (
    <UserCtx.Provider value={value}>
      <Header />
    </UserCtx.Provider>
  );
}
`),
          },
        ],
      },
      {
        id: "zustand",
        title: "Zustand",
        description: "Базовый стор, actions, selectors",
        theory: r(`
**Zustand** — минималистичный стейт-менеджер. Один хук, без провайдеров.

\`\`\`js
import { create } from "zustand";

const useStore = create((set) => ({
  count: 0,
  inc: () => set((s) => ({ count: s.count + 1 })),
}));
\`\`\`

Чтобы избежать лишних ре-рендеров, **используй селекторы**: \`useStore(s => s.count)\` — компонент перерисуется только при изменении \`count\`.

В этом примере мы не подключаем Zustand, но логика та же.
        `),
        examples: [
          {
            title: "Имитация Zustand-стора через useSyncExternalStore",
            code: r(`
import { useSyncExternalStore } from "react";

function createStore(initial) {
  let state = initial;
  const subs = new Set();
  return {
    get: () => state,
    set: (fn) => { state = fn(state); subs.forEach(s => s()); },
    subscribe: (cb) => { subs.add(cb); return () => subs.delete(cb); },
  };
}

const store = createStore({ count: 0 });
const useCount = () =>
  useSyncExternalStore(store.subscribe, () => store.get().count);

export default function App() {
  const count = useCount();
  return (
    <div style={{ padding: 20 }}>
      <h1>{count}</h1>
      <button onClick={() => store.set(s => ({ count: s.count + 1 }))}>+</button>
    </div>
  );
}
`),
          },
        ],
      },
      {
        id: "react-query",
        title: "React Query (TanStack)",
        description: "Серверный state",
        theory: r(`
**React Query** управляет серверным состоянием: кэширует, инвалидирует, дедуплицирует запросы, повторяет при ошибках.

\`\`\`js
const { data, isLoading, error } = useQuery({
  queryKey: ["users"],
  queryFn: () => fetch("/api/users").then(r => r.json()),
});
\`\`\`

**Ключевые понятия:**
- **queryKey** — уникальный ключ кеша, реагирует на изменения как deps в useEffect
- **staleTime** — сколько данные считаются "свежими" (не перезапрашиваются)
- **cacheTime** — сколько хранить в кеше после анмаунта
- **useMutation** — для POST/PUT/DELETE, с инвалидацией кеша после успеха
        `),
        examples: [
          {
            title: "Ручная имитация fetch с состояниями",
            code: r(`
import { useState, useEffect } from "react";

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    fetch("https://jsonplaceholder.typicode.com/users/1")
      .then(r => r.json())
      .then(d => { if (alive) { setData(d); setLoading(false); } })
      .catch(e => { if (alive) { setError(e); setLoading(false); } });
    return () => { alive = false; };
  }, []);

  if (loading) return <p>Загрузка...</p>;
  if (error) return <p>Ошибка</p>;
  return (
    <div style={{ padding: 20 }}>
      <h2>{data.name}</h2>
      <p>{data.email}</p>
    </div>
  );
}
`),
          },
        ],
      },
      {
        id: "react-memo",
        title: "React.memo",
        description: "Когда помогает, когда нет",
        theory: r(`
**React.memo** — HOC, который пропускает ре-рендер компонента, если props не изменились (по shallow compare).

\`const MyComp = memo(function MyComp(props) { ... })\`

**Помогает, когда:**
- Компонент часто получает одни и те же props при ре-рендере родителя
- Внутри тяжёлый рендер

**НЕ помогает / даже вредит:**
- Props всегда новые (объекты/функции без useMemo/useCallback)
- Компонент маленький — затраты на сравнение больше, чем экономия
- Внутри много children-нод (shallow check скажет "разные ссылки")
        `),
        examples: [
          {
            title: "memo пропускает ре-рендер",
            code: r(`
import { useState, memo } from "react";

const Child = memo(function Child({ value }) {
  console.log("Child render with", value);
  return <p>value: {value}</p>;
});

export default function App() {
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);

  return (
    <div style={{ padding: 20 }}>
      <Child value={a} />
      <p>b: {b}</p>
      <button onClick={() => setA(a + 1)}>a (Child ре-рендерится)</button>
      <button onClick={() => setB(b + 1)}>b (Child НЕ ре-рендерится)</button>
    </div>
  );
}
`),
          },
        ],
      },
      {
        id: "code-splitting",
        title: "Code Splitting",
        description: "React.lazy, Suspense",
        theory: r(`
**Code splitting** разбивает бандл на чанки, чтобы загружать код по требованию.

\`\`\`js
const Heavy = lazy(() => import("./Heavy"));

<Suspense fallback={<Spinner />}>
  <Heavy />
</Suspense>
\`\`\`

Чанк скачается, только когда \`<Heavy />\` появится в дереве. Идеально для:
- Страниц в роутере (\`lazy(() => import("./pages/Settings"))\`)
- Тяжёлых модалок, графиков, редакторов кода
        `),
        examples: [
          {
            title: "Базовый Suspense (без реального lazy)",
            code: r(`
import { Suspense, useState } from "react";

function Heavy() {
  return <p>📦 Тяжёлый компонент загружен</p>;
}

export default function App() {
  const [show, setShow] = useState(false);
  return (
    <div style={{ padding: 20 }}>
      <button onClick={() => setShow(true)}>загрузить</button>
      {show && (
        <Suspense fallback={<p>Loading...</p>}>
          <Heavy />
        </Suspense>
      )}
    </div>
  );
}
`),
          },
        ],
      },
      {
        id: "virtual-dom",
        title: "Virtual DOM",
        description: "Diffing, reconciliation",
        theory: r(`
**Virtual DOM** — лёгкое JS-представление UI. React сравнивает старое и новое VDOM-дерево и применяет минимальные изменения в реальный DOM.

**Алгоритм reconciliation:**
1. Сравнение по типу: \`<div>\` vs \`<span>\` → полный рестарт поддерева
2. Сравнение детей по позиции — отсюда важность \`key\` в списках
3. Текстовые и атрибутные изменения применяются точечно

**Fiber** (React 16+) — переписанный reconciler, позволяющий прерывать и приоритизировать работу. Основа для Concurrent Mode.
        `),
        examples: [
          {
            title: "Иллюстрация diffing'а",
            code: r(`
import { useState } from "react";

export default function App() {
  const [order, setOrder] = useState(["A", "B", "C"]);

  return (
    <div style={{ padding: 20 }}>
      <button onClick={() => setOrder([...order].reverse())}>reverse</button>
      <ul>
        {order.map(x => (
          <li key={x}>
            <input defaultValue={x} />
          </li>
        ))}
      </ul>
      <p>Без key={"{x}"} state input'ов перепутается!</p>
    </div>
  );
}
`),
          },
        ],
      },
      {
        id: "react-router",
        title: "React Router v6",
        description: "Routes, Route, Outlet",
        theory: r(`
**React Router v6** — стандарт SPA-роутинга в React.

\`\`\`jsx
<BrowserRouter>
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/users/:id" element={<User />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
</BrowserRouter>
\`\`\`

**Ключевые элементы:**
- \`<Link to="/path">\` — навигация без перезагрузки
- \`<NavLink>\` — добавляет active-класс
- \`<Outlet />\` — слот для вложенных роутов
- \`useNavigate()\` — программная навигация
- \`useParams()\` — параметры URL
- \`useSearchParams()\` — query-параметры

Эта учебная платформа сама использует React Router — посмотри [App.tsx](src/App.tsx).
        `),
        examples: [],
      },
      {
        id: "rhf",
        title: "React Hook Form",
        description: "register, handleSubmit, errors",
        theory: r(`
**React Hook Form** — производительная либа форм. Минимум ре-рендеров (uncontrolled под капотом), небольшой размер, удобный API.

\`\`\`jsx
const { register, handleSubmit, formState: { errors } } = useForm();

<form onSubmit={handleSubmit(onSubmit)}>
  <input {...register("email", { required: true })} />
  {errors.email && <p>обязательно</p>}
</form>
\`\`\`

В связке с **Zod** через \`zodResolver\` — типобезопасная схема валидации.
        `),
        examples: [
          {
            title: "Ручная валидация (без либы)",
            code: r(`
import { useState } from "react";

export default function App() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (!email.includes("@")) {
      setError("Введите корректный email");
      return;
    }
    setError("");
    alert("OK: " + email);
  };

  return (
    <form onSubmit={submit} style={{ padding: 20 }}>
      <input
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="email"
      />
      {error && <p style={{ color: "tomato" }}>{error}</p>}
      <button>Submit</button>
    </form>
  );
}
`),
          },
        ],
      },
      {
        id: "props-types",
        title: "Props типы",
        description: "FC, ReactNode, JSX.Element",
        theory: r(`
**Типизация props:**

\`\`\`ts
type Props = {
  title: string;
  count?: number;
  onClick: (id: string) => void;
  children: React.ReactNode;
};

function Card({ title, children, onClick }: Props) { ... }
\`\`\`

**ReactNode vs JSX.Element:**
- \`ReactNode\` — всё, что может рендериться: JSX, строки, числа, null, массивы → используй для \`children\`
- \`JSX.Element\` — конкретно результат JSX → реже нужен явно

**FC<Props>** — устаревший паттерн (раньше неявно добавлял children). Сейчас принято просто типизировать аргумент функции.
        `),
        examples: [],
      },
      {
        id: "event-types",
        title: "Типизация событий",
        description: "ChangeEvent, MouseEvent",
        theory: r(`
**Часто используемые типы:**

\`\`\`ts
onChange={(e: React.ChangeEvent<HTMLInputElement>) => ...}
onClick={(e: React.MouseEvent<HTMLButtonElement>) => ...}
onSubmit={(e: React.FormEvent<HTMLFormElement>) => ...}
onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => ...}
\`\`\`

Если inline-функция передаётся напрямую в JSX, TS обычно сам выводит типы — указывать явно нужно только когда выносишь обработчик в отдельную функцию.
        `),
        examples: [],
      },
    ],
  },
  {
    id: "algorithms",
    emoji: "📘",
    title: "Грокаем алгоритмы",
    description: "База алгоритмов и структур данных через призму фронтенда",
    topics: [
      {
        id: "big-o",
        title: "Big O — нотация сложности",
        description: "Как читать O(1), O(n), O(n log n), O(n²)",
        theory: r(`
**Big O** — это **верхняя оценка скорости роста** числа операций при увеличении входа \`n\`. Не «сколько миллисекунд», а «как кривая ведёт себя на больших данных». Константы и младшие слагаемые отбрасываются: \`O(3n + 7)\` → \`O(n)\`.

\`\`\`
n = 10        n = 1000      n = 1_000_000
O(1)          1             1             1
O(log n)      ~3            ~10           ~20
O(n)          10            1 000         1 000 000
O(n log n)    ~30           ~10 000       ~20 000 000
O(n²)         100           1 000 000     10¹²  💀
O(2ⁿ)         1024          🔥            🔥
\`\`\`

**Шпаргалка по операциям JS:**

| Операция | Сложность |
|---|---|
| \`arr[i]\`, \`arr.push/pop\` | O(1) |
| \`arr.unshift/shift\` | **O(n)** — сдвигает все элементы |
| \`arr.includes/indexOf\` | O(n) |
| \`arr.sort()\` | O(n log n) |
| \`set.has/add/delete\` | O(1) средний |
| \`map.get/set/has\` | O(1) средний |
| Spread \`[...arr]\` | O(n) |

**Как считать сложность кода:**
- Один цикл по \`n\` → \`O(n)\`
- Вложенный цикл → \`O(n²)\`
- Цикл с делением пополам → \`O(log n)\`
- Рекурсия с двумя вызовами без мемо → \`O(2ⁿ)\`

**Подводные камни:**
- \`.includes\` внутри цикла превращает \`O(n)\` в \`O(n²)\` — лучше \`Set\`
- \`shift/unshift\` — это \`O(n)\` под капотом
- Spread в цикле — тоже \`O(n²)\`: \`result = [...result, x]\`

**Память тоже считается.** \`arr.reverse()\` — O(n) время, O(1) память. \`[...arr].reverse()\` — O(n)/O(n).
        `),
        examples: [
          {
            title: "Сравниваем O(n²) и O(n) на практике",
            code: r(`
import { useState } from "react";

// O(n²) — includes на каждой итерации
function uniqueSlow(arr) {
  const unique = [];
  for (const x of arr) if (!unique.includes(x)) unique.push(x);
  return unique;
}

// O(n) — Set
function uniqueFast(arr) {
  return [...new Set(arr)];
}

export default function App() {
  const [n, setN] = useState(2000);
  const [result, setResult] = useState(null);

  const run = () => {
    const arr = Array.from({ length: n }, () => Math.floor(Math.random() * (n / 2)));
    const t1 = performance.now();
    uniqueSlow(arr);
    const slow = performance.now() - t1;
    const t2 = performance.now();
    uniqueFast(arr);
    const fast = performance.now() - t2;
    setResult({ slow: slow.toFixed(2), fast: fast.toFixed(2), ratio: (slow / fast).toFixed(1) });
  };

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <label>n = </label>
      <input type="number" value={n} onChange={e => setN(+e.target.value)} />
      <button onClick={run} style={{ marginLeft: 8 }}>Замерить</button>
      {result && (
        <div style={{ marginTop: 12 }}>
          <p>O(n²) includes: <b>{result.slow} ms</b></p>
          <p>O(n) Set:      <b>{result.fast} ms</b></p>
          <p>Разница: <b>×{result.ratio}</b></p>
        </div>
      )}
    </div>
  );
}
`),
          },
          {
            title: "Two Sum: O(n²) vs O(n)",
            code: r(`
export default function App() {
  // O(n²) — двойной цикл
  function twoSumSlow(nums, target) {
    for (let i = 0; i < nums.length; i++)
      for (let j = i + 1; j < nums.length; j++)
        if (nums[i] + nums[j] === target) return [i, j];
    return null;
  }

  // O(n) — Map: для каждого x ищем target - x
  function twoSumFast(nums, target) {
    const seen = new Map();
    for (let i = 0; i < nums.length; i++) {
      const need = target - nums[i];
      if (seen.has(need)) return [seen.get(need), i];
      seen.set(nums[i], i);
    }
    return null;
  }

  const nums = [2, 7, 11, 15, 3, 6, 8];
  const target = 17;

  return (
    <div style={{ padding: 20, fontFamily: "monospace" }}>
      <p>nums = [{nums.join(", ")}]</p>
      <p>target = {target}</p>
      <p>O(n²): {JSON.stringify(twoSumSlow(nums, target))}</p>
      <p>O(n):  {JSON.stringify(twoSumFast(nums, target))}</p>
    </div>
  );
}
`),
          },
        ],
      },
      {
        id: "binary-search",
        title: "Бинарный поиск",
        description: "O(log n) — повсюду: от виртуализации до git bisect",
        theory: r(`
Если массив **отсортирован**, не нужно пробегать его целиком: каждый раз делим пополам и спрашиваем «искомое больше или меньше середины?». За один шаг отсекается ровно половина.

Линейный поиск — до \`n\` сравнений. Бинарный — до \`log₂(n)\`. Для 1 000 000 элементов: **миллион vs 20**.

\`\`\`js
function binarySearch(sorted, target) {
  let low = 0;
  let high = sorted.length - 1;
  while (low <= high) {
    const mid = low + Math.floor((high - low) / 2);
    if (sorted[mid] === target) return mid;
    if (sorted[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  return -1;
}
\`\`\`

**Где это во фронте:**
- **Виртуализация** (\`react-window\`, \`@tanstack/virtual\`) — найти, какой элемент сейчас сверху экрана по \`scrollTop\` среди известных \`offsets\`.
- **Insertion point** в отсортированных коллекциях — \`lowerBound\` для вставки сообщения в чат без полной пересортировки.
- **git bisect** — буквально бинарный поиск по истории коммитов.
- **Autocomplete** по отсортированному списку.

**Подводные камни:**
- Массив **обязательно** отсортирован — иначе случайный результат.
- Бесконечный цикл, если \`low = mid\` вместо \`mid + 1\`.
- \`"10" < "2"\` — JS сравнивает строки лексикографически.

**«Бинарный поиск по ответу»** — мощная техника: ищешь минимальную ширину колонки, при которой текст помещается без переноса в \`N\` строк, перебором по \`[1, maxWidth]\` с проверкой «помещается?».
        `),
        examples: [
          {
            title: "Интерактивный бинарный поиск",
            code: r(`
import { useState } from "react";

const arr = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25];

export default function App() {
  const [target, setTarget] = useState(13);
  const [steps, setSteps] = useState([]);

  const run = () => {
    const log = [];
    let low = 0, high = arr.length - 1;
    while (low <= high) {
      const mid = low + ((high - low) >> 1);
      log.push({ low, high, mid, value: arr[mid] });
      if (arr[mid] === target) { log.push({ found: mid }); break; }
      if (arr[mid] < target) low = mid + 1;
      else high = mid - 1;
    }
    if (!log.some(s => s.found !== undefined)) log.push({ found: -1 });
    setSteps(log);
  };

  return (
    <div style={{ padding: 20, fontFamily: "monospace" }}>
      <p>arr = [{arr.join(", ")}]</p>
      <label>target: </label>
      <input type="number" value={target} onChange={e => setTarget(+e.target.value)} />
      <button onClick={run} style={{ marginLeft: 8 }}>Найти</button>
      <ol style={{ marginTop: 12 }}>
        {steps.map((s, i) =>
          s.found !== undefined
            ? <li key={i}><b>{s.found >= 0 ? "Найдено на индексе " + s.found : "Не найдено"}</b></li>
            : <li key={i}>low={s.low}, high={s.high}, mid={s.mid} → arr[mid]={s.value}</li>
        )}
      </ol>
    </div>
  );
}
`),
          },
          {
            title: "lowerBound — куда вставить, чтобы сохранить порядок",
            code: r(`
import { useState } from "react";

function lowerBound(arr, target) {
  let lo = 0, hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (arr[mid] < target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

export default function App() {
  const [items, setItems] = useState([10, 20, 30, 40, 50]);
  const [val, setVal] = useState(25);

  const insert = () => {
    const idx = lowerBound(items, val);
    const next = [...items];
    next.splice(idx, 0, val);
    setItems(next);
  };

  return (
    <div style={{ padding: 20, fontFamily: "monospace" }}>
      <p>Массив: [{items.join(", ")}]</p>
      <input type="number" value={val} onChange={e => setVal(+e.target.value)} />
      <button onClick={insert} style={{ marginLeft: 8 }}>Вставить</button>
      <p>Позиция вставки {val}: <b>{lowerBound(items, val)}</b></p>
    </div>
  );
}
`),
          },
        ],
      },
      {
        id: "arrays-vs-lists",
        title: "Массивы vs Связные списки",
        description: "Кеш-локальность, LRU, React Fiber",
        theory: r(`
**Массив** — непрерывная область памяти. Адрес элемента вычисляется арифметикой → **доступ по индексу O(1)**. Вставка в начало — O(n) (сдвиг всех элементов).

**Связный список** — каждый узел хранит значение и указатель на следующий. Доступ по индексу — O(n). Вставка/удаление при наличии указателя на узел — **O(1)**.

| Операция | Массив | Связный список |
|---|---|---|
| Чтение по индексу | **O(1)** | O(n) |
| Вставка в начало | **O(n)** | **O(1)** |
| Вставка в середину | O(n) | O(1) с указателем |
| Удаление | O(n) | O(1) с указателем |
| Кеш-локальность | ✅ | ❌ |

**Где это во фронте:**
- **React Fiber** — связный список с указателями \`child\`, \`sibling\`, \`return\`. Reconciler обходит fiber-узлы итеративно, чтобы можно было прерываться (Concurrent Mode).
- **LRU-кеш** — двусвязный список + Map. Используется в \`swr\`, \`react-query\` для удаления старых записей.
- **Очередь эффектов** в React — тоже список.

**Подводные камни:**
- \`Array.prototype.shift\` — O(n) (сдвигает все индексы). Очередь на \`shift\` тормозит.
- У связного списка плохая кеш-локальность — на маленьких \`n\` массив почти всегда быстрее.
- Дырки в массиве (\`arr[10000] = x\`) → V8 переключается на hash-режим, доступ замедляется.

**LRU за O(1)** = двусвязный список + Map. Map даёт O(1) поиск узла, список даёт O(1) перемещение в начало и удаление с конца. Классический вопрос на мидл-собесе.
        `),
        examples: [
          {
            title: "LRU-кеш на двусвязном списке",
            code: r(`
import { useState } from "react";

class DNode {
  constructor(key, value) {
    this.key = key; this.value = value;
    this.prev = null; this.next = null;
  }
}

class LRU {
  constructor(capacity) {
    this.cap = capacity;
    this.map = new Map();
    this.head = new DNode();
    this.tail = new DNode();
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }
  _remove(n) { n.prev.next = n.next; n.next.prev = n.prev; }
  _addFront(n) {
    n.next = this.head.next; n.prev = this.head;
    this.head.next.prev = n; this.head.next = n;
  }
  get(key) {
    if (!this.map.has(key)) return null;
    const n = this.map.get(key);
    this._remove(n); this._addFront(n);
    return n.value;
  }
  set(key, value) {
    if (this.map.has(key)) {
      const n = this.map.get(key);
      n.value = value;
      this._remove(n); this._addFront(n);
      return;
    }
    if (this.map.size === this.cap) {
      const lru = this.tail.prev;
      this._remove(lru); this.map.delete(lru.key);
    }
    const n = new DNode(key, value);
    this._addFront(n); this.map.set(key, n);
  }
  toArray() {
    const out = []; let cur = this.head.next;
    while (cur !== this.tail) { out.push([cur.key, cur.value]); cur = cur.next; }
    return out;
  }
}

const lru = new LRU(3);

export default function App() {
  const [, setTick] = useState(0);

  const action = (fn) => { fn(); setTick(t => t + 1); };

  return (
    <div style={{ padding: 20, fontFamily: "monospace" }}>
      <p>LRU capacity = 3</p>
      <button onClick={() => action(() => lru.set("A", 1))}>set A=1</button>
      <button onClick={() => action(() => lru.set("B", 2))}>set B=2</button>
      <button onClick={() => action(() => lru.set("C", 3))}>set C=3</button>
      <button onClick={() => action(() => lru.set("D", 4))}>set D=4 (выкинет хвост)</button>
      <button onClick={() => action(() => lru.get("A"))}>get A (в начало)</button>
      <p>Состояние (от свежего к старому):</p>
      <pre>{JSON.stringify(lru.toArray(), null, 2)}</pre>
    </div>
  );
}
`),
          },
        ],
      },
      {
        id: "recursion",
        title: "Рекурсия",
        description: "База, шаг, стек вызовов, рекурсивные компоненты",
        theory: r(`
Любая рекурсивная функция = **база** (условие выхода) + **рекурсивный шаг** (вызов себя с меньшим аргументом). Без базы — \`Maximum call stack size exceeded\`.

Каждый вызов кладёт «фрейм» на стек. JS-движок держит ~10 000–20 000 фреймов. Глубокая рекурсия по большим данным → \`RangeError\`.

**Когда рекурсия — естественное решение:** данные сами рекурсивны — деревья, JSON, AST, DOM, файловая система.

**Рекурсивный компонент** во фронте — это меню с подменю, дерево комментариев, файловое дерево:

\`\`\`jsx
function MenuItem({ item }) {
  return (
    <li>
      {item.label}
      {item.children?.length > 0 && (
        <ul>
          {item.children.map(c => <MenuItem key={c.id} item={c} />)}
        </ul>
      )}
    </li>
  );
}
\`\`\`

**Divide & Conquer** — рекурсивная стратегия: раздели → реши → объедини. Так устроены Quicksort, Mergesort, бинарный поиск, и React diff поддеревьев.

**Подводные камни:**
- Забыл базу или база не достигается → переполнение стека.
- Лишние пересчёты: \`fib(n)\` без мемо — O(2ⁿ).
- Мутация общих структур внутри рекурсии — соседи увидят изменения.

**React Fiber отказался от рекурсии.** В React 16 reconciler переписан с рекурсии на итеративный обход линкед-листа fiber-узлов. Цель — возможность прерывать работу (Concurrent Mode).
        `),
        examples: [
          {
            title: "Рекурсивный компонент: дерево комментариев",
            code: r(`
const thread = {
  id: 1, author: "Аня", text: "Тема обсуждения", likes: 3,
  replies: [
    { id: 2, author: "Боб", text: "Согласен", likes: 1, replies: [
      { id: 4, author: "Аня", text: "Спасибо", likes: 5, replies: [] },
    ]},
    { id: 3, author: "Чарли", text: "А я нет", likes: 0, replies: [] },
  ],
};

function Comment({ node, depth = 0 }) {
  return (
    <div style={{ marginLeft: depth * 24, padding: 8, borderLeft: "2px solid #444" }}>
      <b>{node.author}</b> · ❤ {node.likes}
      <div>{node.text}</div>
      {node.replies.map(child => (
        <Comment key={child.id} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

function totalLikes(node) {
  let sum = node.likes;
  for (const c of node.replies) sum += totalLikes(c);
  return sum;
}

export default function App() {
  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h3>Всего лайков: {totalLikes(thread)}</h3>
      <Comment node={thread} />
    </div>
  );
}
`),
          },
          {
            title: "deepFlatten: рекурсия vs итерация через стек",
            code: r(`
import { useState } from "react";

function deepFlatten(arr) {
  const out = [];
  for (const x of arr) {
    if (Array.isArray(x)) out.push(...deepFlatten(x));
    else out.push(x);
  }
  return out;
}

function deepFlattenIter(arr) {
  const out = [];
  const stack = [arr];
  while (stack.length) {
    const top = stack.pop();
    for (const x of top) {
      if (Array.isArray(x)) stack.push(x);
      else out.unshift(x);
    }
  }
  return out;
}

export default function App() {
  const input = [1, [2, [3, [4, [5, [6]]]]], 7];
  return (
    <div style={{ padding: 20, fontFamily: "monospace" }}>
      <p>Вход: {JSON.stringify(input)}</p>
      <p>Рекурсия: {JSON.stringify(deepFlatten(input))}</p>
      <p>Стек: {JSON.stringify(deepFlattenIter(input))}</p>
    </div>
  );
}
`),
          },
        ],
      },
      {
        id: "quicksort",
        title: "Быстрая сортировка",
        description: "Divide & conquer, Quickselect, что под капотом sort()",
        theory: r(`
**Quicksort** = классика divide & conquer:
1. Выбираем **опорный элемент (pivot)**.
2. Делим массив на части: \`< pivot\`, \`= pivot\`, \`> pivot\`.
3. Рекурсивно сортируем обе.
4. Склеиваем.

| | Время | Память |
|---|---|---|
| Лучший / Средний | **O(n log n)** | O(log n) |
| Худший (плохой pivot) | O(n²) | O(n) |

**Худший случай** — когда pivot всё время минимум/максимум (отсортированный массив + pivot = первый элемент). Лечится случайным выбором или «медианой трёх».

**Где это во фронте:**
- Прямо — почти нигде, есть \`Array.prototype.sort\`.
- **V8 использует Timsort** (merge + insertion), не quicksort.
- **Quickselect** — найти k-й по величине за среднее O(n). «Топ-3 пользователя по активности» без полной сортировки.
- Идея divide & conquer применима к React reconciliation.

**Сравнение базовых сортировок:**

| Алгоритм | Среднее | Худшее | Память | Стабильна? |
|---|---|---|---|---|
| Quicksort | O(n log n) | O(n²) | O(log n) | ❌ |
| Mergesort | O(n log n) | O(n log n) | O(n) | ✅ |
| \`Array.sort\` (Timsort) | O(n log n) | O(n log n) | O(n) | ✅ |

**Подводные камни sort():**
- \`[10, 2, 1].sort()\` → \`[1, 10, 2]\` — лексикографически! Нужен компаратор \`(a, b) => a - b\`.
- \`sort\` мутирует массив (\`toSorted\` в ES2023 — копирующий).
- \`(a, b) => a > b\` неверно — нужно число (-1/0/1).
        `),
        examples: [
          {
            title: "Quicksort с тремя массивами (для собеса)",
            code: r(`
import { useState } from "react";

function quicksort(arr) {
  if (arr.length <= 1) return arr;
  const pivot = arr[arr.length >> 1];
  const left = [], right = [], equal = [];
  for (const x of arr) {
    if (x < pivot) left.push(x);
    else if (x > pivot) right.push(x);
    else equal.push(x);
  }
  return [...quicksort(left), ...equal, ...quicksort(right)];
}

export default function App() {
  const [arr, setArr] = useState([5, 2, 9, 1, 5, 6, 3, 8, 7, 4, 5]);
  return (
    <div style={{ padding: 20, fontFamily: "monospace" }}>
      <p>Вход:  [{arr.join(", ")}]</p>
      <p>Выход: [{quicksort(arr).join(", ")}]</p>
      <button onClick={() => setArr(Array.from({ length: 10 }, () => Math.floor(Math.random() * 100)))}>
        Случайные
      </button>
    </div>
  );
}
`),
          },
          {
            title: "Quickselect: k-й по величине за O(n)",
            code: r(`
function partition(arr, lo, hi) {
  const pivot = arr[hi];
  let i = lo;
  for (let j = lo; j < hi; j++) {
    if (arr[j] < pivot) { [arr[i], arr[j]] = [arr[j], arr[i]]; i++; }
  }
  [arr[i], arr[hi]] = [arr[hi], arr[i]];
  return i;
}

function quickselect(arr, k, lo = 0, hi = arr.length - 1) {
  if (lo === hi) return arr[lo];
  const p = partition(arr, lo, hi);
  if (k === p) return arr[p];
  return k < p ? quickselect(arr, k, lo, p - 1) : quickselect(arr, k, p + 1, hi);
}

export default function App() {
  const nums = [7, 2, 9, 1, 5, 6, 3, 8, 4];
  const sorted = [...nums].sort((a, b) => a - b);

  return (
    <div style={{ padding: 20, fontFamily: "monospace" }}>
      <p>Массив: [{nums.join(", ")}]</p>
      <p>Отсортированный: [{sorted.join(", ")}]</p>
      <p>3-й по величине (k=2): <b>{quickselect([...nums], 2)}</b></p>
      <p>Медиана (k=4): <b>{quickselect([...nums], 4)}</b></p>
    </div>
  );
}
`),
          },
        ],
      },
      {
        id: "hash-tables",
        title: "Хеш-таблицы",
        description: "Map, Set, кеш запросов, дедупликация, индексация",
        theory: r(`
Хеш-функция превращает ключ в число — индекс в массиве «корзин». Среднее время поиска — **O(1)**.

Иногда два разных ключа дают один индекс — **коллизия**. Когда коллизий много, таблица перехешируется: новый массив вдвое больше, всё переносится. Это O(n) единоразово, но амортизированно остаётся O(1).

**Map vs Set vs Object:**

| | Map | Set | Object |
|---|---|---|---|
| Ключи | любые | значения = ключи | строки/символы |
| Порядок | вставки | вставки | с оговорками |
| Размер | \`.size\` (O(1)) | \`.size\` (O(1)) | \`Object.keys(o).length\` (O(n)) |
| Сериализация в JSON | ❌ | ❌ | ✅ |

**Правило:** для логики/сторов — \`Map\`. Для DTO/JSON — \`Object\`.

**Где это во фронте:**
- **Кеш запросов** в \`react-query\`, \`swr\` — большая хеш-таблица: \`key → data\`.
- **Дедупликация:** \`[...new Set(arr)]\`.
- **Группировка / индексация** — заменяет \`O(n²) filter\` на \`O(n)\`.
- **Подсчёт частот** — \`Map<char, count>\`.
- **WeakMap** для «приватных» данных, привязанных к DOM-узлу.

**Подводные камни:**
- Объект как ключ работает по ссылке: \`m.set({id: 1}, "a"); m.get({id: 1})\` → \`undefined\`.
- \`Object\` ломается на ключах \`__proto__\`, \`constructor\`, \`hasOwnProperty\` — используй \`Map\` или \`Object.create(null)\`.
- \`JSON.stringify\` нестабилен по порядку ключей — для ключа кеша нормализуй.
        `),
        examples: [
          {
            title: "Замена O(n²) на O(n) индексом",
            code: r(`
const users = [
  { id: 1, name: "Аня" }, { id: 2, name: "Боб" }, { id: 3, name: "Чарли" },
];
const purchases = [
  { userId: 1, item: "Кофе" }, { userId: 2, item: "Чай" },
  { userId: 1, item: "Печенье" }, { userId: 3, item: "Вода" },
];

// O(n*m) — для каждого user ищем линейно
function slowJoin() {
  return users.map(u => ({
    ...u,
    purchases: purchases.filter(p => p.userId === u.id),
  }));
}

// O(n+m) — индексируем один раз
function fastJoin() {
  const byUser = new Map();
  for (const p of purchases) {
    if (!byUser.has(p.userId)) byUser.set(p.userId, []);
    byUser.get(p.userId).push(p);
  }
  return users.map(u => ({ ...u, purchases: byUser.get(u.id) ?? [] }));
}

export default function App() {
  return (
    <div style={{ padding: 20 }}>
      <h4>Через Map (O(n+m)):</h4>
      <pre>{JSON.stringify(fastJoin(), null, 2)}</pre>
    </div>
  );
}
`),
          },
          {
            title: "Подсчёт частот символов",
            code: r(`
import { useState } from "react";

export default function App() {
  const [text, setText] = useState("привет мир привет react");
  const freq = new Map();
  for (const ch of text) freq.set(ch, (freq.get(ch) ?? 0) + 1);
  const top = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);

  return (
    <div style={{ padding: 20 }}>
      <input value={text} onChange={e => setText(e.target.value)} style={{ width: "100%" }} />
      <p>Топ символов:</p>
      <ul>
        {top.map(([ch, n]) => (
          <li key={ch}><code>"{ch}"</code> → {n}</li>
        ))}
      </ul>
    </div>
  );
}
`),
          },
        ],
      },
      {
        id: "bfs-dfs",
        title: "BFS и DFS",
        description: "Обход графов и деревьев: очередь vs стек",
        theory: r(`
**BFS** (поиск в ширину) обходит граф **по уровням**. Использует **очередь FIFO**. Гарантия: первый раз, когда видим вершину, мы пришли к ней по **кратчайшему пути** (в невзвешенном графе).

**DFS** (поиск в глубину) идёт «вглубь до упора», потом откатывается. Использует **стек** (или рекурсию).

**Разница в коде — одна строка:** \`queue.shift()\` (BFS) vs \`stack.pop()\` (DFS).

| Задача | Алгоритм |
|---|---|
| Кратчайший путь (без весов) | **BFS** |
| Топологическая сортировка | DFS (post-order) |
| Все возможные пути | DFS с возвратом |
| Уровни / расстояния | **BFS** |
| Поиск компонент связности | оба |

**Где это во фронте:**
- **Обход DOM / VDOM** — DFS (\`walkDOM\`, JSON-stringify).
- **AST в Babel/ESLint** — DFS (pre-order для enter, post-order для exit).
- **React Fiber commit phase** — post-order DFS: \`useEffect\` дочернего срабатывает **раньше** родительского.
- **Топологическая сортировка модулей** в Webpack — DFS.
- **Поиск «связь 2-го уровня»** в соцграфе — BFS.
- **Levels rendering** дерева комментариев — BFS.

**Сложность:** O(V + E) время, O(V) память.

**Подводные камни:**
- Без \`visited\` Set DFS уходит в бесконечный цикл на циклическом графе.
- \`Array.prototype.shift()\` — O(n)! На больших графах BFS тормозит. Лучше — настоящая очередь с двумя индексами.
- Метить \`visited\` нужно **при добавлении в очередь**, а не при извлечении — иначе одну вершину положим много раз.
- DFS не даёт кратчайший путь, найденный — любой.
        `),
        examples: [
          {
            title: "BFS: кратчайший путь в графе друзей",
            code: r(`
import { useState } from "react";

const friends = new Map([
  ["Аня",   ["Боб", "Дима"]],
  ["Боб",   ["Аня", "Чарли"]],
  ["Чарли", ["Боб", "Ева"]],
  ["Дима",  ["Аня", "Ева"]],
  ["Ева",   ["Чарли", "Дима", "Федя"]],
  ["Федя",  ["Ева"]],
]);

function shortestPath(graph, start, target) {
  const queue = [start];
  const cameFrom = new Map([[start, null]]);
  while (queue.length) {
    const node = queue.shift();
    if (node === target) {
      const path = [];
      for (let n = target; n !== null; n = cameFrom.get(n)) path.unshift(n);
      return path;
    }
    for (const next of graph.get(node) ?? []) {
      if (!cameFrom.has(next)) {
        cameFrom.set(next, node);
        queue.push(next);
      }
    }
  }
  return null;
}

export default function App() {
  const [from, setFrom] = useState("Аня");
  const [to, setTo] = useState("Федя");
  const path = shortestPath(friends, from, to);
  return (
    <div style={{ padding: 20, fontFamily: "monospace" }}>
      <p>От: <input value={from} onChange={e => setFrom(e.target.value)} /></p>
      <p>До: <input value={to} onChange={e => setTo(e.target.value)} /></p>
      <p>Путь: <b>{path ? path.join(" → ") : "не найден"}</b></p>
      <p>Степень: <b>{path ? path.length - 1 : "—"}</b></p>
    </div>
  );
}
`),
          },
          {
            title: "DFS: топологическая сортировка",
            code: r(`
const deps = new Map([
  ["App", ["Header", "Main"]],
  ["Main", ["List", "Footer"]],
  ["List", ["Item"]],
  ["Item", []],
  ["Header", ["Logo"]],
  ["Logo", []],
  ["Footer", []],
]);

function topoSort(graph) {
  const visited = new Set();
  const result = [];
  function dfs(u) {
    if (visited.has(u)) return;
    visited.add(u);
    for (const v of graph.get(u) ?? []) dfs(v);
    result.push(u); // post-order
  }
  for (const u of graph.keys()) dfs(u);
  return result.reverse();
}

export default function App() {
  return (
    <div style={{ padding: 20, fontFamily: "monospace" }}>
      <p>Граф зависимостей — порядок «кого собрать первым»:</p>
      <ol>{topoSort(deps).map(x => <li key={x}>{x}</li>)}</ol>
    </div>
  );
}
`),
          },
        ],
      },
      {
        id: "dynamic-programming",
        title: "Динамическое программирование",
        description: "Мемоизация, табулирование, и почему это React.memo",
        theory: r(`
**DP** — это **запоминание промежуточных результатов**, чтобы не считать одно и то же дважды. Применимо, когда задача:
1. Разбивается на подзадачи (overlapping subproblems).
2. Оптимум состоит из оптимумов подзадач (optimal substructure).

**Два стиля:**
- **Top-down (мемоизация):** рекурсивно, кешируем ответы.
- **Bottom-up (табулирование):** итеративно, заполняем таблицу от меньшего к большему.

**Фибоначчи:**
- Наивно — O(2ⁿ).
- С мемо — O(n) время / O(n) память.
- Bottom-up с двумя переменными — O(n) / O(1).

**Классические задачи:**
- **LCS** (Longest Common Subsequence) — основа \`git diff\`.
- **Edit distance** (Левенштейн) — «вы имели в виду…?», fuzzy-поиск.
- **Coin change** — минимум монет (жадный не работает).
- **LIS** — наивно O(n²), с patience sort + бинарный поиск — O(n log n). Используется в **Vue 3 patchKeyedChildren**.

**DP во фронте:**
- \`useMemo\`, \`useCallback\`, \`React.memo\`, \`reselect\` — это DP на уровне инструмента.
- **Diff в reconciler** — без ключей это вариант edit distance O(n²), с ключами — O(n).
- **Кеш высот строк** в виртуализованных таблицах.
- **Вагнер–Фишер** для diff текста — базис \`react-diff-viewer\` и git.

**Подводные камни:**
- Мемо по объекту-ссылке: новый объект каждый рендер ломает мемо.
- Таблица n×m может занять гигабайты — часто можно хранить только последнюю строку.
- Top-down может переполнить стек — переписывай в bottom-up.
- Жадный вместо DP даёт неверный ответ на Knapsack/Coin Change.
        `),
        examples: [
          {
            title: "Фибоначчи: три варианта",
            code: r(`
import { useState } from "react";

let naiveCalls = 0;
function fibNaive(n) {
  naiveCalls++;
  if (n < 2) return n;
  return fibNaive(n - 1) + fibNaive(n - 2);
}

function fibMemo(n, memo = new Map()) {
  if (n < 2) return n;
  if (memo.has(n)) return memo.get(n);
  const v = fibMemo(n - 1, memo) + fibMemo(n - 2, memo);
  memo.set(n, v);
  return v;
}

function fibTab(n) {
  if (n < 2) return n;
  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) [a, b] = [b, a + b];
  return b;
}

export default function App() {
  const [n, setN] = useState(20);
  naiveCalls = 0;
  const naive = fibNaive(n);
  const memo = fibMemo(n);
  const tab = fibTab(n);

  return (
    <div style={{ padding: 20, fontFamily: "monospace" }}>
      <label>n = </label>
      <input type="number" value={n} onChange={e => setN(Math.min(35, +e.target.value))} />
      <p>Наивно (O(2ⁿ)): fib({n}) = {naive}, вызовов: <b>{naiveCalls}</b></p>
      <p>С мемо (O(n)):  fib({n}) = {memo}</p>
      <p>Таблица (O(1) память): fib({n}) = {tab}</p>
    </div>
  );
}
`),
          },
          {
            title: "Edit distance: «вы имели в виду…?»",
            code: r(`
import { useState } from "react";

function editDistance(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[a.length][b.length];
}

const dict = ["react", "redux", "router", "recoil", "remix", "rxjs", "rust", "rest"];

export default function App() {
  const [q, setQ] = useState("recat");
  const ranked = dict
    .map(w => ({ w, d: editDistance(q.toLowerCase(), w) }))
    .sort((a, b) => a.d - b.d);

  return (
    <div style={{ padding: 20, fontFamily: "monospace" }}>
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="опечатка" />
      <p>Похоже на:</p>
      <ol>
        {ranked.slice(0, 4).map(({ w, d }) => (
          <li key={w}>{w} (расстояние {d})</li>
        ))}
      </ol>
    </div>
  );
}
`),
          },
        ],
      },
      {
        id: "greedy",
        title: "Жадные алгоритмы",
        description: "Интервалы, throttle, упаковка галереи",
        theory: r(`
**Жадный** = на каждом шаге берём **локально оптимальный** выбор и надеемся, что суммарно получится глобально оптимально.

**Классические задачи:**

**1. Activity selection.** Максимум непересекающихся интервалов. Стратегия — **сортировка по концу**, потом берём первый подходящий.

**2. Покрытие множеств.** Жадный даёт ln(n)-приближение к NP-hard задаче.

**3. Сдача монетами.** В системе 1/5/10/25 — жадный работает. В системе 1/3/4 для суммы 6: жадный → \`4+1+1\`, оптимум → \`3+3\`. **Жадный не всегда оптимален** — нужно доказывать.

**Где это во фронте:**
- **Throttle / rate-limiting** — token bucket жадно отправляет, как только токен доступен.
- **Перенос строк** в \`<p>\` — greedy line breaking. (TeX использует DP для лучшего вида.)
- **Justified gallery** (Flickr/Unsplash) — жадно набираем картинки в ряд.
- **LRU** — жадно выкидываем самое неиспользуемое.
- **React batching** — жадно набирает обновления в кадр.
- **Дейкстра** — тоже жадный.

**Сложность:** обычно O(n log n) — доминирует сортировка.

**Подводные камни:**
- Жадный ≠ всегда оптимальный. Перед написанием — проверь на каверзном входе.
- Activity selection работает **только** с сортировкой по \`end\`, а не \`start\` или длительности.
- 0/1 Knapsack по «удельной ценности» жадно не решается — нужна DP.

**Хаффман-коды** (gzip, brotli) — оптимальное префиксное кодирование жадным алгоритмом: всегда сливаем два самых редких символа.
        `),
        examples: [
          {
            title: "Activity selection: максимум встреч",
            code: r(`
import { useState } from "react";

function maxIntervals(intervals) {
  const sorted = [...intervals].sort((a, b) => a.end - b.end);
  const chosen = [];
  let lastEnd = -Infinity;
  for (const iv of sorted) {
    if (iv.start >= lastEnd) {
      chosen.push(iv);
      lastEnd = iv.end;
    }
  }
  return chosen;
}

const meetings = [
  { id: "Standup",   start: 9,  end: 9.5 },
  { id: "Дизайн",    start: 10, end: 12 },
  { id: "Обед",      start: 12, end: 13 },
  { id: "Митинг",    start: 11, end: 12.5 },
  { id: "1-on-1",    start: 13, end: 14 },
  { id: "Demo",      start: 13.5, end: 15 },
  { id: "Ретро",     start: 15, end: 16 },
];

export default function App() {
  const [view, setView] = useState("all");
  const data = view === "all" ? meetings : maxIntervals(meetings);
  return (
    <div style={{ padding: 20, fontFamily: "monospace" }}>
      <button onClick={() => setView("all")}>Все ({meetings.length})</button>
      <button onClick={() => setView("max")}>Max непересекающихся ({maxIntervals(meetings).length})</button>
      <ul>
        {data.map(m => <li key={m.id}>{m.id}: {m.start}–{m.end}</li>)}
      </ul>
    </div>
  );
}
`),
          },
          {
            title: "Throttle: жадная стратегия",
            code: r(`
import { useState, useRef } from "react";

function throttle(fn, ms) {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= ms) { last = now; fn(...args); }
  };
}

export default function App() {
  const [count, setCount] = useState(0);
  const [calls, setCalls] = useState(0);
  const throttled = useRef(throttle(() => setCount(c => c + 1), 500)).current;

  return (
    <div style={{ padding: 20 }}>
      <p>Throttle: 500мс — клики «жадно» проходят, как только окно открыто.</p>
      <button onClick={() => { setCalls(c => c + 1); throttled(); }}>
        Кликни много раз!
      </button>
      <p>Всего кликов: <b>{calls}</b></p>
      <p>Прошло throttle: <b>{count}</b></p>
    </div>
  );
}
`),
          },
        ],
      },
      {
        id: "trees-heap-trie",
        title: "Деревья: BST, Heap, Trie",
        description: "BST для порядка, Heap для приоритетов, Trie для autocomplete",
        theory: r(`
Дерево — связный граф без циклов. В нём фронт сталкивается ежедневно: DOM, VDOM, AST, JSON, дерево комментариев.

**1. BST (Binary Search Tree).** Для любого узла: левое поддерево < узел < правое. Операции — O(log n) в среднем, **O(n) в худшем** (вырожденное дерево-список). Гарантия — AVL/Red-Black.

inorder-обход BST даёт **отсортированную последовательность**.

**2. Heap (Min/Max).** Почти полное бинарное дерево, где корень — минимум/максимум. Реализуется массивом: для узла \`i\` дети — \`2i+1\`, \`2i+2\`.
- \`push\` / \`pop\` — O(log n).
- \`peek\` — O(1).
- Построение из массива — O(n).

**Где Heap во фронте:**
- **React Scheduler** буквально использует min-heap по приоритетам задач. Файл \`react-reconciler/src/Scheduler.js\`. Это основа «прерываемой работы» в Concurrent React.
- **Алгоритм Дейкстры** — min-heap для следующей ближайшей вершины.
- **Top-K**: «10 самых популярных» через min-heap размера K.

**3. Trie (префиксное дерево).** Каждый узел — символ; путь от корня — префикс. Операции — O(L), где L — длина строки. **Не зависит от числа слов!**

**Где Trie во фронте:**
- **Autocomplete** для команд (VSCode, Slack \`/команды\`).
- **URL-роутер** в React Router 6 / Vue Router строит trie-подобную структуру для O(L) матчинга.
- **emoji-picker** — поиск по началу имени.

**Подводные камни:**
- Несбалансированный BST на отсортированных данных = связный список.
- Heap — НЕ отсортированный массив. \`h[1]\` и \`h[2]\` могут идти в любом порядке.
- Trie жрёт память: 100K слов = десятки МБ. Лекарство — radix tree.
        `),
        examples: [
          {
            title: "Trie: autocomplete по префиксу",
            code: r(`
import { useState } from "react";

class Trie {
  constructor() { this.root = Object.create(null); }
  insert(word) {
    let node = this.root;
    for (const ch of word) {
      if (!node[ch]) node[ch] = Object.create(null);
      node = node[ch];
    }
    node.$ = true;
  }
  wordsWithPrefix(prefix) {
    let node = this.root;
    for (const ch of prefix) {
      if (!node[ch]) return [];
      node = node[ch];
    }
    const out = [];
    const walk = (n, path) => {
      if (n.$) out.push(path);
      for (const ch in n) if (ch !== "$") walk(n[ch], path + ch);
    };
    walk(node, prefix);
    return out;
  }
}

const trie = new Trie();
["react", "redux", "router", "recoil", "remix", "rxjs", "rust", "rest", "render", "ref"]
  .forEach(w => trie.insert(w));

export default function App() {
  const [q, setQ] = useState("re");
  const matches = q ? trie.wordsWithPrefix(q.toLowerCase()) : [];

  return (
    <div style={{ padding: 20 }}>
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="префикс..." />
      <ul>{matches.map(w => <li key={w}>{w}</li>)}</ul>
      {q && matches.length === 0 && <p>Нет совпадений</p>}
    </div>
  );
}
`),
          },
          {
            title: "MinHeap и Top-K за O(n log K)",
            code: r(`
class MinHeap {
  constructor() { this.h = []; }
  push(v) {
    this.h.push(v);
    let i = this.h.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.h[p] <= this.h[i]) break;
      [this.h[p], this.h[i]] = [this.h[i], this.h[p]];
      i = p;
    }
  }
  pop() {
    if (!this.h.length) return undefined;
    const top = this.h[0];
    const last = this.h.pop();
    if (this.h.length) {
      this.h[0] = last;
      let i = 0;
      while (true) {
        const l = 2*i+1, r = 2*i+2;
        let s = i;
        if (l < this.h.length && this.h[l] < this.h[s]) s = l;
        if (r < this.h.length && this.h[r] < this.h[s]) s = r;
        if (s === i) break;
        [this.h[i], this.h[s]] = [this.h[s], this.h[i]];
        i = s;
      }
    }
    return top;
  }
  peek() { return this.h[0]; }
  get size() { return this.h.length; }
}

// Top-K: храним K самых больших через min-heap размера K
function topK(arr, k) {
  const heap = new MinHeap();
  for (const x of arr) {
    if (heap.size < k) heap.push(x);
    else if (x > heap.peek()) { heap.pop(); heap.push(x); }
  }
  return [...heap.h].sort((a, b) => b - a);
}

export default function App() {
  const nums = Array.from({ length: 50 }, () => Math.floor(Math.random() * 1000));
  return (
    <div style={{ padding: 20, fontFamily: "monospace" }}>
      <p>50 случайных чисел:</p>
      <p style={{ fontSize: 11 }}>[{nums.join(", ")}]</p>
      <p>Top-5: <b>[{topK(nums, 5).join(", ")}]</b></p>
    </div>
  );
}
`),
          },
        ],
      },
    ],
  },
];

// Плоский список всех топиков (удобно для роутинга)
export const allTopics: Topic[] = blocks.flatMap((b) => b.topics);

export function findTopic(id: string): Topic | undefined {
  return allTopics.find((t) => t.id === id);
}

export function findBlockOf(topicId: string): Block | undefined {
  return blocks.find((b) => b.topics.some((t) => t.id === topicId));
}
